#!/usr/bin/env python3
"""RepoFlow Hub · 多目标单文件构建器。

把 src/ 下的 HTML 骨架、样式、脚本按 scripts/manifest.json 的顺序拼成单文件产物。
三份内嵌配置从 templates/ 读取，避免源码里出现第二份副本。

目标（见 manifest.targets）：
    dev      本机开发副本，含实测数据，自动载入中性演示账号
    web      公开网站版，默认未登录、中性示例数据、零外部资源
    desktop  离线 Windows 版，无账号体系、无外部资源、不访问网站

用法：
    python scripts/build.py                     构建全部目标
    python scripts/build.py --target=dev        只构建指定目标
    python scripts/build.py --check            只比对，不写文件
"""
from pathlib import Path
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'scripts' / 'manifest.json'
sys.path.insert(0, str(ROOT / 'templates'))
import sanitize  # noqa: E402

FONT_LINK = re.compile(r'<link[^>]+(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*')
OFFLINE_FONT_CSS = '''
/* ============ 公开产物 · 零外部资源，使用设备自带系统字体 ============ */
:root{
  --font-display:"Segoe UI Variable Display","Segoe UI",-apple-system,BlinkMacSystemFont,"Microsoft YaHei UI","Microsoft YaHei",sans-serif;
  --font-body:"Segoe UI",-apple-system,BlinkMacSystemFont,"Microsoft YaHei UI","Microsoft YaHei",system-ui,sans-serif;
}
'''

DEFAULT_TARGETS = {
    'dev': {'output': 'prototype/index.html', 'edition': 'dev', 'sanitize': False, 'offline': False},
    'web': {'output': 'web/index.html', 'edition': 'web', 'sanitize': True, 'offline': False},
    'desktop': {'output': 'desktop/app/index.html', 'edition': 'desktop', 'sanitize': True, 'offline': True},
}


def fingerprint(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:12]


def read(path):
    p = ROOT / path
    if not p.exists():
        raise SystemExit('缺少源文件: ' + path)
    return p.read_text(encoding='utf-8')


def assemble(manifest, target='dev'):
    """按清单拼接；验证器调用时默认 dev，保持与工作副本一致。"""
    cfg = manifest.get('targets', DEFAULT_TARGETS).get(target, DEFAULT_TARGETS['dev'])
    edition = cfg['edition']
    shell = read(manifest['shell'])
    css = ''.join(read(p) for p in manifest['css'])
    js = ''.join(read(p) for p in manifest['js'])

    marker = "const EDITION='dev';"
    if marker not in js:
        raise SystemExit('00-edition.js 缺少版本占位常量')
    js = js.replace(marker, "const EDITION='" + edition + "';", 1)

    blocks = []
    for item in manifest['config']:
        content = read(item['file'])
        if not content.endswith('\n'):
            content += '\n'
        blocks.append('<script type="text/plain" id="' + item['id'] + '">\n' + content + '</script>')
    config = '\n'.join(blocks)

    for token in ('@@CSS@@', '@@CONFIG@@', '@@JS@@'):
        if token not in shell:
            raise SystemExit('骨架缺少占位符: ' + token)
    html = (shell.replace('@@CSS@@', css, 1)
                 .replace('@@CONFIG@@', config, 1)
                 .replace('@@JS@@', js, 1))
    if '@@' in html:
        raise SystemExit('产物仍有未替换占位符')
    for item in manifest['config']:
        if 'id="' + item['id'] + '"' not in html:
            raise SystemExit('内嵌配置缺失: ' + item['id'])
    return html, {'cssChars': len(css), 'jsChars': len(js), 'configChars': len(config)}


def postprocess(html, cfg):
    stats = {}
    if cfg.get('sanitize'):
        html, s, leftovers, _ = sanitize.sanitize_text(html)
        if leftovers:
            raise SystemExit('脱敏后仍有真实标识符: ' + json.dumps(leftovers, ensure_ascii=False))
        stats['sanitize'] = s
        html = sanitize.banner(cfg['edition']) + html
    if cfg.get('offline'):
        html, n = FONT_LINK.subn('', html)
        stats['removedFontLinks'] = n
        if '</style>' not in html:
            raise SystemExit('desktop 目标找不到 </style>')
        html = html.replace('</style>', OFFLINE_FONT_CSS + '</style>', 1)
        stats['externalResourceTags'] = len(re.findall(r'<link[^>]+href=|<script[^>]+src=', html))
        if stats['externalResourceTags']:
            raise SystemExit('desktop 产物仍含外部资源引用')
    return html, stats


def parse_target():
    for i, a in enumerate(sys.argv):
        if a.startswith('--target='):
            return a.split('=', 1)[1]
        if a == '--target' and i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return 'all'


def main():
    check = '--check' in sys.argv
    requested = parse_target()
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    targets = manifest.get('targets', DEFAULT_TARGETS)
    names = list(targets) if requested == 'all' else [requested]
    for n in names:
        if n not in targets:
            raise SystemExit('未知构建目标: ' + n)

    results = []
    for name in names:
        cfg = targets[name]
        html, sizes = assemble(manifest, name)
        html, extra = postprocess(html, cfg)
        out = ROOT / cfg['output']
        item = {
            'target': name,
            'edition': cfg['edition'],
            'output': cfg['output'],
            'outputChars': len(html),
            'sha256_12': fingerprint(html),
            **sizes,
            **extra,
        }
        if check:
            current = out.read_text(encoding='utf-8') if out.exists() else ''
            item['matchesCurrentOutput'] = current == html
            if current and current != html:
                i = next((k for k in range(min(len(current), len(html))) if current[k] != html[k]), 0)
                item['firstDiffAt'] = i
        else:
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(html, encoding='utf-8', newline='\n')
            item['verified'] = out.read_text(encoding='utf-8') == html
        results.append(item)

    receipt = {
        'outcome': 'checked' if check else 'built',
        'sources': len(manifest['css']) + len(manifest['js']) + len(manifest['config']) + 1,
        'targets': results,
    }
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    if check and any(not x.get('matchesCurrentOutput', True) for x in results):
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
