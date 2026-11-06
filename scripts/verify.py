#!/usr/bin/env python3
"""RepoFlow Hub · 源码与产物验证器。

用法：
    python scripts/verify.py               静态检查（构建一致性 / JS 语法 / 导航视图 / 配置同步）
    python scripts/verify.py --browser     追加无头浏览器自检与渲染核对
    python scripts/verify.py --bench       追加同一口径的性能探针，输出 JSON
    python scripts/verify.py --all         以上全部

所有期望值从源码推导，不手写会漂移的常量。
"""
from pathlib import Path
import html as htmlmod
import json
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import build  # noqa: E402

INDEX = ROOT / 'prototype' / 'index.html'


def browser_path():
    candidates = [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        '/c/Program Files/Google/Chrome/Application/chrome.exe',
        '/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    ]
    for p in candidates:
        if Path(p).exists():
            return p
    for name in ('google-chrome', 'chromium', 'chromium-browser'):
        found = shutil.which(name)
        if found:
            return found
    return None


def dump_dom(file_url, budget=9000, logging=False):
    exe = browser_path()
    if not exe:
        return None, 'no headless browser found'
    with tempfile.TemporaryDirectory() as td:
        dom = Path(td) / 'dom.html'
        err = Path(td) / 'err.log'
        cmd = [exe, '--headless=new', '--disable-gpu', '--no-sandbox',
               '--virtual-time-budget=' + str(budget)]
        if logging:
            cmd += ['--enable-logging=stderr', '--log-level=0']
        cmd += ['--dump-dom', file_url]
        with dom.open('w', encoding='utf-8') as fo, err.open('w', encoding='utf-8') as fe:
            p = subprocess.run(cmd, stdout=fo, stderr=fe, timeout=180)
        return dom.read_text(encoding='utf-8', errors='replace'), err.read_text(encoding='utf-8', errors='replace')


def result_node(dom):
    m = re.search(r'<div id="selftest-result">(.*?)</div>', dom, re.S)
    if not m:
        return None
    try:
        return json.loads(htmlmod.unescape(m.group(1)))
    except json.JSONDecodeError:
        return None


BENCH_PROBE = r'''<script>
/* 同源对照探针：同一份源码、同一个浏览器会话，只切换优化开关。
   baseline  = 启动时渲染全部视图 + 仓库列表全量渲染（模拟优化前行为）
   optimized = 当前默认（懒渲染 + 增量渲染）
   两者使用完全相同的 506 条压力数据，所有数字可随 npm run bench 复现。 */
setTimeout(function(){
  function count(){return document.querySelectorAll('*').length;}
  var out={};
  var startupOptimized=count();
  var acc=S.activeAccount, ids=REPOS.map(function(r){return r.id});
  var backup=ACCOUNT_REPOS[acc];
  ACCOUNT_REPOS[acc]=ids.slice();
  for(var i=0;i<500;i++){
    var b=REPOS[i%6];
    var c=Object.assign({},b,{id:'stress'+i,name:'stress-'+i,remote:'example/stress-'+i});
    REPOS.push(c);ACCOUNT_REPOS[acc].push(c.id);
  }
  S.q='';S.filter='all';S.demo=false;

  function measure(views){
    var t=performance.now();renderRepos();
    return {views:views,stressMs:+(performance.now()-t).toFixed(1),
            stressCards:document.querySelectorAll('#repoGrid .card').length,
            stressDomNodes:count(),stressDataCount:REPOS.length};
  }

  S.repoLimit=PAGE_SIZE;
  var opt=measure(RENDERED.size);

  Object.keys(LAZY).forEach(function(v){ensureView(v);});
  S.repoLimit=100000;
  var base=measure(RENDERED.size);

  out.baseline=base;
  out.optimized=opt;
  REPOS.length=6;ACCOUNT_REPOS[acc]=backup;S.repoLimit=PAGE_SIZE;renderRepos();
  out.afterRestoreDomNodes=count();
  /* 展开全部视图 + 恢复 6 仓 = 关闭优化时的启动态；与懒渲染启动态成对可比 */
  out.baseline.startupDomNodes=out.afterRestoreDomNodes;
  out.optimized.startupDomNodes=startupOptimized;
  var el=document.createElement('div');el.id='bench-result';el.textContent=JSON.stringify(out);
  document.body.appendChild(el);
},200);
</script>
'''


def static_checks():
    checks = {}
    manifest = json.loads((ROOT / 'scripts' / 'manifest.json').read_text(encoding='utf-8'))
    sources = [manifest['shell']] + manifest['css'] + manifest['js'] + [c['file'] for c in manifest['config']]
    checks['清单中全部源文件存在'] = all((ROOT / p).exists() for p in sources)
    built, _ = build.assemble(manifest)
    current = INDEX.read_text(encoding='utf-8')
    checks['源码拼接 == 当前产物'] = built == current
    checks['产物无残留占位符'] = '@@' not in built

    with tempfile.TemporaryDirectory() as td:
        js = Path(td) / 'bundle.js'
        js.write_text(''.join((ROOT / p).read_text(encoding='utf-8') for p in manifest['js']), encoding='utf-8')
        node = shutil.which('node')
        if node:
            r = subprocess.run([node, '--check', str(js)], capture_output=True, text=True)
            checks['node --check 通过'] = r.returncode == 0
            if r.returncode:
                checks['node 报错'] = r.stderr.strip()[:200]
        else:
            checks['node --check 通过'] = False

    shell = (ROOT / manifest['shell']).read_text(encoding='utf-8')
    navs = set(re.findall(r'data-view="([a-z]+)"', shell))
    views = set(re.findall(r'id="view-([a-z]+)"', shell))
    checks['导航与视图集合一致'] = navs == views and len(views) > 0
    checks['视图数量'] = len(views)

    sync = []
    for item in manifest['config']:
        content = (ROOT / item['file']).read_text(encoding='utf-8')
        if not content.endswith('\n'):
            content += '\n'
        m = re.search(r'<script type="text/plain" id="' + item['id'] + r'">(.*?)</script>', built, re.S)
        sync.append(bool(m) and m.group(1) == '\n' + content)
    checks['三份内嵌配置与 templates 一致'] = all(sync)
    return checks


def browser_checks():
    checks = {}
    url = INDEX.resolve().as_uri()
    dom, err = dump_dom(url + '?selftest=1', 7000, logging=True)
    if dom is None:
        return {'无头浏览器可用': False, '原因': err}
    d = result_node(dom)
    checks['自检结果节点存在'] = d is not None
    if d:
        checks['交互自检全部通过'] = bool(d.get('pass'))
        checks['自检条数'] = d.get('total')
        if d.get('error'):
            checks['自检异常'] = str(d['error'])[:200]
        for it in d.get('items', []):
            if not it['ok']:
                checks.setdefault('失败断言', []).append(it['n'] + ' | ' + str(it.get('d', ''))[:80])
    console = [l for l in err.splitlines() if 'CONSOLE' in l.upper() and re.search(r'error|uncaught|exception', l, re.I)]
    checks['控制台无异常'] = not console
    if console:
        checks['控制台片段'] = console[:3]

    dom2, _ = dump_dom(url, 4000)
    m2 = re.search(r'<script>\s*/\* =+', dom2)
    doc = dom2[:m2.start()] if m2 else dom2
    src = (ROOT / 'src' / 'data' / '01-snapshot.js').read_text(encoding='utf-8')
    repo_block = src[src.index('const REPOS'):src.index('const BIGFILES')]
    exp_repos = len(re.findall(r"\{id:'", repo_block))
    got = {
        '仓库卡片': len(re.findall(r'<article class="card[^>]*data-id=', doc)),
        'KPI': len(re.findall(r'<div class="kpi-val">', doc)),
        '视图': len(re.findall(r'<section class="view', doc)),
        '项目徽标': len(re.findall(r'class="pmark', doc)),
        '筛选器': len(re.findall(r'<button class="chip[^>]*data-filter=', doc)),
    }
    checks['正常渲染卡片数 == 源数据'] = got['仓库卡片'] == exp_repos
    checks['卡片与徽标一一对应'] = got['项目徽标'] >= got['仓库卡片']
    checks['KPI 五项'] = got['KPI'] == 5
    checks['渲染统计'] = got
    return checks


def bench():
    text = INDEX.read_text(encoding='utf-8')
    probe = text.replace('</body>', BENCH_PROBE + '</body>', 1)
    tmp = ROOT / 'prototype' / '_bench_probe.html'
    tmp.write_text(probe, encoding='utf-8', newline='\n')
    try:
        dom, _ = dump_dom(tmp.resolve().as_uri() + '?bench=1', 9000)
        m = re.search(r'<div id="bench-result">(.*?)</div>', dom or '', re.S)
        return json.loads(htmlmod.unescape(m.group(1))) if m else {'error': '探针未产出结果'}
    finally:
        tmp.unlink(missing_ok=True)


def main():
    mode = 'all' if '--all' in sys.argv else (
        'bench' if '--bench' in sys.argv else ('browser' if '--browser' in sys.argv else 'static'))
    report = {}
    report['static'] = static_checks()
    if mode in ('browser', 'all'):
        report['browser'] = browser_checks()
    if mode in ('bench', 'all'):
        report['bench'] = bench()

    ok = True
    for group, items in report.items():
        for k, v in items.items():
            if isinstance(v, bool):
                ok = ok and v
                print(('  OK   ' if v else '  FAIL ') + group + ' · ' + k)
            elif k in ('视图数量', '自检条数', '渲染统计'):
                print('  INFO ' + group + ' · ' + k + ': ' + json.dumps(v, ensure_ascii=False))
    if mode in ('bench', 'all'):
        print('BENCH_JSON ' + json.dumps(report['bench'], ensure_ascii=False))
    report['pass'] = ok
    print('VERIFY_RESULT ' + ('PASS' if ok else 'FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
