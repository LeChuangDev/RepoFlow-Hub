#!/usr/bin/env python3
"""RepoFlow Hub · 离线安装包打包器。

先构建 desktop 目标，再把启动器、产物与使用说明打成两个平台包：
    dist/RepoFlow-Hub-<version>-windows-x64.zip
    dist/RepoFlow-Hub-<version>-linux-x64.tar.gz
    dist/SHA256SUMS.txt

用法：
    python scripts/package.py            构建并打包
    python scripts/package.py --skip-build  复用已有 desktop 产物
"""
from pathlib import Path
import hashlib
import io
import json
import subprocess
import sys
import tarfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
DESKTOP = ROOT / 'desktop'
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']

WINDOWS_README = """RepoFlow Hub {version} · Windows 离线版

一、启动
1. 把整个压缩包解压到任意目录，不要只单独复制 start.cmd。
2. 双击 start.cmd。会用本机 Chrome / Edge 打开应用窗口。
3. 若没有安装 Chrome / Edge，会退回系统默认浏览器打开 app\\index.html。

二、扫描本地仓库
1. 点驾驶舱右上角「扫描本地文件夹」。
2. 选择项目目录；也可以选择包含多个仓库的父目录，会自动向下找一级/二级仓库。
3. 只读读取 .git 中的 HEAD / config / refs / logs，不会修改或上传任何文件。
4. 脏工作区、未推送提交和准确体积需要真正运行 git，页面显示 0 或「—」是正常的。

三、说明
· 离线版不联网、无需登录，数据只在本机浏览器内。
· 推送 / 删除等写操作仍为原型模拟，不会改动任何仓库。
· 启动脚本被杀毒软件拦截时，右键选择「允许运行」或加入白名单。

项目主页：https://github.com/LeChuangDev/RepoFlow-Hub
"""

LINUX_README = """RepoFlow Hub {version} · Linux 离线版

一、启动
1. 解压：tar -xzf RepoFlow-Hub-{version}-linux-x64.tar.gz
2. 进入目录：cd RepoFlow-Hub-Linux
3. 启动：./start.sh
   脚本会自动寻找 Google Chrome / Chromium / Microsoft Edge；找不到时退回 xdg-open。

二、扫描本地仓库
1. 点驾驶舱右上角「扫描本地文件夹」。
2. 选择项目目录或包含多个仓库的父目录，会自动向下找一级/二级仓库。
3. 只读读取 .git 中的 HEAD / config / refs / logs，不会修改或上传任何文件。
4. 脏工作区、未推送提交和准确体积需要真正运行 git，页面显示 0 或「—」是正常的。

三、说明
· 离线版不联网、无需登录，数据只在本机浏览器内。
· 推送 / 删除等写操作仍为原型模拟，不会改动任何仓库。
· Chromium 系浏览器对文件夹选择支持最好；Firefox 会退回文件夹上传选择。

项目主页：https://github.com/LeChuangDev/RepoFlow-Hub
"""


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
    readme = WINDOWS_README.format(version=VERSION)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        zf.write(DESKTOP / 'start.cmd', name + '/start.cmd')
        zf.write(DESKTOP / 'app' / 'index.html', name + '/app/index.html')
        zf.writestr(name + '/README.txt', readme)


def make_linux_tarball(out):
    name = 'RepoFlow-Hub-Linux'
    readme = LINUX_README.format(version=VERSION).encode('utf-8')

    def normalize(info):
        # Windows 上没有可执行位，这里统一设置启动脚本权限
        info.mode = 0o755 if info.name.endswith('start.sh') else 0o644
        info.uid = info.gid = 0
        info.uname = info.gname = ''
        return info

    with tarfile.open(out, 'w:gz') as tf:
        tf.add(DESKTOP / 'start.sh', name + '/start.sh', filter=normalize)
        tf.add(DESKTOP / 'app' / 'index.html', name + '/app/index.html', filter=normalize)
        info = tarfile.TarInfo(name + '/README.txt')
        info.size = len(readme)
        info.mode = 0o644
        info.uid = info.gid = 0
        info.uname = info.gname = ''
        tf.addfile(info, io.BytesIO(readme))


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

    sums = DIST / 'SHA256SUMS.txt'
    sums.write_text('\n'.join(digest(a) + '  ' + a.name for a in artifacts) + '\n', encoding='utf-8')

    receipt = {
        'outcome': 'packaged',
        'version': VERSION,
        'target': 'desktop',
        'sourceChars': len((DESKTOP / 'app' / 'index.html').read_text(encoding='utf-8')),
        'artifacts': [{
            'file': a.name,
            'bytes': a.stat().st_size,
            'sha256_12': digest(a)[:12],
        } for a in artifacts + [sums]],
    }
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
