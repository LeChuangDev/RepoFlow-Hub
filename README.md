# RepoFlow Hub

面向独立全栈开发者的多仓库 Git 管理工具 · 高保真交互原型。

用一个驾驶舱管理分散在 GitHub、Gitee 与本机的多个仓库：批量提交、跨库检索、CI 与钩子状态、平台同步、账号授权都在同一处完成。仓库数据不出本机，凭据不进静态文件。

作者：**樂創**

---

## 两种分发形态

| | 网站版（Web） | 离线版（Windows / Linux） |
| --- | --- | --- |
| 使用方式 | 粘贴 GitHub 访问令牌，读取你的真实仓库 | 解压即用，无需登录、不联网 |
| 数据 | 只读真实仓库列表，令牌仅存页面内存 | 中性示例数据，不访问网站 |
| 适合 | 演示、自用 | 分发给别人、断网环境 |

两个版本都是**单文件 HTML**、零外部依赖、零第三方框架。网站版只在你主动连接 GitHub 时请求 `api.github.com`，其余时间不发起网络请求；离线版完全不联网。

## 下载

- 离线安装包：[Releases](https://github.com/LeChuangDev/RepoFlow-Hub/releases/latest)
  - `RepoFlow-Hub-<版本>-windows-x64.zip` → 解压后双击 `start.cmd`
  - `RepoFlow-Hub-<版本>-linux-x64.tar.gz` → 解压后执行 `./start.sh`
- 网站版：由 EdgeOne Pages 托管（自定义域名绑定完成后在此补充地址）

离线包依赖本机已安装的 Chrome / Chromium / Edge 提供 App 窗口；找不到时会退回系统默认浏览器打开 `app/index.html`。

## 功能视图

全局驾驶舱 · 提交工作台 · 全局检索 · 历史与删除 · 删减与清理 · 提交辅助 · CI 与钩子 · 项目集群 · 通知中心 · 平台与同步 · 开发数据 · 功能缺口 · 模块规划 · 账号与授权，共 14 个视图。

- **批量操作**：跨仓库选择、批量拉取/推送/提交，执行前有 dry-run 预览。
- **全局检索**：按仓库、时间范围、关键词检索提交与文件。
- **CI 与钩子**：固件 CI、pre-commit、自定义钩子的模板与运行结果。
- **平台与同步**：GitHub / Gitee 双远端策略，同一提交分别推送。
- **账号与授权**：使用你自己的 GitHub 访问令牌真实登录。GitHub 的 OAuth 端点不返回 CORS 头，纯静态页面无法直接换取 token，因此采用「用户自带令牌」方式：令牌只存在当前页面内存，不写入 localStorage / cookie / 网址，刷新即失效。也可一键进入**演示模式**，数据明确标注为中性示例。推送、删除等写操作仍为原型模拟，不会改动任何仓库。
- **主题**：日间冷白 + 夜间黑蓝，跟随系统或手动切换。

## 目录结构

```
src/
  shell.html            页面骨架（含占位符 @@CSS@@ / @@CONFIG@@ / @@JS@@）
  styles/               01-tokens → 08-about，按序拼接
  data/                 版本常量、示例快照、内置常量
  core/                 渲染、状态、交互、账号、离开页等 14 个模块
  selftest.js           内置自检，仅 ?selftest=1 时运行
templates/              固件 CI / pre-commit / 钩子三份内嵌配置 + 脱敏脚本
scripts/build.py        单文件构建器（dev / web / desktop 三个目标）
scripts/verify.py       静态校验 + 可选浏览器自检
scripts/package.py      生成 Windows / Linux 离线安装包
web/                    网站构建产物
desktop/                离线版启动脚本与产物
prototype/              本机开发副本（含实测数据，不入公开分发）
```

## 本地构建

需要 Python 3.10+（无第三方依赖）：

```bash
python scripts/build.py                 # 构建全部三个目标
python scripts/build.py --target=web    # 只构建网站版
python scripts/build.py --check         # 只比对源码与产物是否一致
python scripts/verify.py                # 静态校验：拼接一致、无残留占位符、node --check 等
python scripts/verify.py --browser      # 追加无头浏览器交互自检
npm run package                         # 生成 dist/ 下的 Windows / Linux 安装包
```

工作副本 `prototype/index.html`、网站版 `web/index.html`、离线版 `desktop/app/index.html` 均由源码拼接生成，**不要手工编辑产物**。

## 发布离线安装包

推送版本 tag 即触发 `.github/workflows/release.yml`，自动构建并上传两套包到 GitHub Release：

```bash
git tag v0.8.0
git push origin v0.8.0
```

也可以本地 `npm run package` 后手动上传 `dist/` 下的文件。

## 部署网站版

网站版为纯静态单文件，`web/` 目录可直接托管：

```bash
npx edgeone login
npx edgeone makers deploy ./web -n repoflow-hub -e production -a overseas
```

仓库根目录的 `edgeone.json` 定义了安全响应头（CSP、HSTS、nosniff、X-Frame-Options 等）与 HTML 不缓存策略（EdgeOne 只读取项目根目录的该文件，放在输出目录不会生效）。未备案域名请使用海外区域；绑定自定义域名需在 EdgeOne 控制台「域名管理」完成归属验证、CNAME 与 HTTPS 证书。GitHub Actions 的 CLI 部署为手动兜底，日常发布由 EdgeOne 的 Git 导入自动完成。

## 隐私

- 静态页面不保存、不转发任何令牌；账号信息只在页面内存中，刷新即清空。
- 公开产物由 `templates/sanitize.py` 脱敏：账号名、仓库清单、本机路径、提交短哈希全部替换为中性示例值。
- 离线版不联网、不登录、无外链资源。
