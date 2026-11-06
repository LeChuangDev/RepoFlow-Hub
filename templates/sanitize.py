#!/usr/bin/env python3
"""RepoFlow Hub · 公开产物脱敏与中性化（确定性、可重复、可校验）。

用法：
    python templates/sanitize.py
输入：prototype/index.html（本地工作副本，含本机实测数据）
输出：prototype/index.public.html（可随开源仓库分发）

sanitize_text() 同时供 scripts/build.py 复用，用于生成 web / desktop 产物。
公开产物不只替换账号名：仓库名、远端组织、资料路径与示例文件名统一换成
中性示例数据，使别人查看网页源码也看不到作者的项目清单。
例外：中文笔名「樂創」是作者主动公开的署名，不属于需脱敏的账户信息。
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'prototype' / 'index.html'
DST = ROOT / 'prototype' / 'index.public.html'

BS = chr(92)
USER_PATH = 'C:' + BS + 'Users' + BS + 'zhang'
FULL_PATH = USER_PATH + BS + 'Desktop' + BS + 'Project'

# 显式映射：真实值 -> 中性示例。dict 保序，长串必须先于其子串。
# 中文笔名「樂創」是作者主动公开的署名，不在此列，也不属于账户信息。
LITERAL = {
    'LeChuangDev': 'demoOrg',
    # 用 HTML 实体，避免 <WORKSPACE> 被浏览器解析成未知标签而整段消失
    FULL_PATH: '&lt;WORKSPACE&gt;',
    USER_PATH: '&lt;WORKSPACE&gt;',
    'Desktop' + BS + 'Project': 'workspace',
    '硬件设计/嘉立创资料': 'demo/assets',
    '硬件设计/pcb-basics-notes': 'demo/notes',
    'Leeco-Jialichuang-EDA-Notes': 'demoAssetsNotes',
    '嘉立创EDA专业版电子版设计认证考试实战详解.pdf': 'demo-manual.pdf',
    '西湖-单面板布线(PCB)设计指南_1-99.pdf': 'demo-pcb-guide.pdf',
    '十年社群…资料合辑.pdf': 'demo-archive.pdf',
    '嘉立创EDA专业版': '示例EDA专业版',
    '嘉立创资料': 'demoAssets',
    '嘉立创': '示例',
    'pcb-basics-notes': 'demoNotes',
    'jlc': 'demoAssets',
    'lechuang-site': 'demoSite',
    'lechung-site': 'demoSite',
    'calcbridge': 'demoTool',
    '32_Demo': 'demoFw',
    'Templates': 'demoTpls',
    'STM32H7B3.svd': 'demo-svd-a.svd',
    'STM32H7B0.svd': 'demo-svd-b.svd',
    'r3-top-1440.png': 'demo-preview.png',
    'stm32h743xx.h': 'demo-mcu-header.h',
}

# 二次校验：以下值必须彻底消失（作者署名「樂創」不在此列）
FORBIDDEN = [
    'LeChuangDev',
    USER_PATH,
    'Desktop' + BS + 'Project',
    'zhang',
    'Leeco-Jialichuang-EDA-Notes',
    'calcbridge',
    'lechuang-site',
    'lechung-site',
    '32_Demo',
    'Templates',
    'pcb-basics-notes',
    '嘉立创资料',
    '嘉立创',
    'jlc',
]


def sha_map(text):
    """把源码里的真实 7 位提交短哈希映射为确定性假哈希。"""
    found = sorted(set(re.findall(r'\b[0-9a-f]{7}\b', text)))
    return {sha: 'd3m%04d' % (i + 1) for i, sha in enumerate(found)}


def sanitize_text(text):
    """返回 (脱敏后文本, 统计, 残留字典, 哈希映射)；调用方负责校验与落盘。"""
    mapping = sha_map(text)
    stats = {'literalReplacements': 0, 'shaReplacements': 0, 'shaValues': len(mapping),
             'neutralRepoNames': 6}

    for real, fake in LITERAL.items():
        n = text.count(real)
        stats['literalReplacements'] += n
        text = text.replace(real, fake)

    for real, fake in mapping.items():
        n = text.count(real)
        stats['shaReplacements'] += n
        text = text.replace(real, fake)

    stats['userNameReplacements'] = len(re.findall(r'\bzhang\b', text))
    text = re.sub(r'\bzhang\b', 'example', text)

    leftovers = {p: text.count(p) for p in FORBIDDEN if p in text}
    return text, stats, leftovers, mapping


def banner(kind='public'):
    if kind == 'public':
        return ('<!-- RepoFlow Hub · 开源可分发副本，由 templates/sanitize.py 自动生成。\n'
                '     真实账号、仓库清单、本机路径与提交短哈希均已替换为中性示例数据。\n'
                '     作者署名「樂創」为主动公开信息。请勿手工编辑本文件。 -->\n')
    return ('<!-- RepoFlow Hub · ' + kind + ' 构建产物，由 scripts/build.py 生成。\n'
            '     已脱敏；请勿手工编辑，修改 src/ 后重新运行 npm run build。 -->\n')


def main():
    if not SRC.exists():
        print(json.dumps({'outcome': 'not-applied', 'error': 'source missing', 'path': str(SRC)}, ensure_ascii=False))
        return 2

    text, stats, leftovers, _ = sanitize_text(SRC.read_text(encoding='utf-8'))
    if leftovers:
        print(json.dumps({'outcome': 'not-applied', 'leftovers': leftovers}, ensure_ascii=False))
        return 2
    if not text.startswith('<!DOCTYPE html>'):
        print(json.dumps({'outcome': 'not-applied', 'error': 'unexpected source header'}, ensure_ascii=False))
        return 2

    DST.write_text(banner() + text, encoding='utf-8', newline='\n')
    verify = DST.read_text(encoding='utf-8')
    clean = all(p not in verify for p in FORBIDDEN)
    receipt = {
        'outcome': 'committed' if clean else 'not-applied',
        'source': str(SRC.relative_to(ROOT)).replace(BS, '/'),
        'output': str(DST.relative_to(ROOT)).replace(BS, '/'),
        'outputChars': len(verify),
        'stats': stats,
        'forbiddenRemaining': {p: verify.count(p) for p in FORBIDDEN if p in verify},
        'verified': clean,
    }
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0 if clean else 2


if __name__ == '__main__':
    sys.exit(main())
