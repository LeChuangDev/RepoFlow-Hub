#!/usr/bin/env python3
"""RepoFlow Hub · 离线安装包打包器。

先构建 desktop 目标，再把启动器与产物打成两个平台包：
    dist/RepoFlow-Hub-<version>-windows-x64.zip
    dist/RepoFlow-Hub-<version>-linux-x64.tar.gz

用法：
    python scripts/package.py            构建并打包
    python scripts/package.py --skip-build  复用已有 desktop 产物
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import tarfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
DESKTOP = ROOT / 'desktop'
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']


def build_desktop():
    result = subprocess.run(
        [sys.executable, str(ROOT / 'scripts' / 'build.py'), '--target=desktop'],
        cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit('desktop 构建失败:\n' + result.stdout + result.stderr)
    if not (DESKTOP / 'app' / 'index.html').exists():
        raise SystemExit('desktop 构建产物缺失: desktop/app/index.html')


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def make_windows_zip(out):
    name = 'RepoFlow-Hub-Windows'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        zf.write(DESKTOP / 'start.cmd', name + '/start.cmd')
        zf.write(DESKTOP / 'app' / 'index.html', name + '/app/index.html')


def make_linux_tarball(out):
    name = 'RepoFlow-Hub-Linux'

    def normalize(info):
        # Windows 上没有可执行位，这里统一设置启动脚本权限
        info.mode = 0o755 if info.name.endswith('start.sh') else 0o644
        info.uid = info.gid = 0
        info.uname = info.gname = ''
        return info

    with tarfile.open(out, 'w:gz') as tf:
        tf.add(DESKTOP / 'start.sh', name + '/start.sh', filter=normalize)
        tf.add(DESKTOP / 'app' / 'index.html', name + '/app/index.html', filter=normalize)


def main():
    skip_build = '--skip-build' in sys.argv
    if not skip_build:
        build_desktop()

    DIST.mkdir(parents=True, exist_ok=True)
    artifacts = [
        DIST / ('RepoFlow-Hub-%s-windows-x64.zip' % VERSION),
        DIST / ('RepoFlow-Hub-%s-linux-x64.tar.gz' % VERSION),
    ]
    make_windows_zip(artifacts[0])
    make_linux_tarball(artifacts[1])

    receipt = {
        'outcome': 'packaged',
        'version': VERSION,
        'target': 'desktop',
        'sourceChars': len((DESKTOP / 'app' / 'index.html').read_text(encoding='utf-8')),
        'artifacts': [{
            'file': a.name,
            'bytes': a.stat().st_size,
            'sha256_12': digest(a)[:12],
        } for a in artifacts],
    }
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
