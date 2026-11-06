# RepoFlow Hub

面向独立全栈开发者的多仓库 Git 管理工具 · 高保真交互原型。

用一个驾驶舱管理分散在 GitHub、Gitee 与本机的多个仓库：批量操作、跨库检索、CI 与钩子、平台同步、账号授权都在同一处完成。仓库数据只读，不写入任何仓库。

- 在线版：https://github.zhangwenle.com/
- 离线安装包：[Releases](https://github.com/LeChuangDev/RepoFlow-Hub/releases/latest)

作者：**樂創**

---

## 两种分发形态

| | 网站版（Web） | 离线版（Windows / Linux） |
| --- | --- | --- |
| 使用方式 | 粘贴 GitHub / Gitee 令牌，读取真实仓库；也可浏览演示数据 | 解压即用，无需登录、不联网；可扫描本地文件夹 |
| 数据 | 远端仓库列表只读；令牌仅存页面内存 | 本机 `.git` 只读扫描；未扫描时展示中性演示数据 |
| 适合 | 在线演示、多设备查看 | 分发给别人、断网环境、本机仓库盘点 |

两个版本都是**单文件 HTML**、零外部依赖、零第三方框架。网站版只在主动连接 GitHub / Gitee 时请求 `api.github.com` 或 `gitee.com`；离线版完全不联网。

## 下载与安装

- Windows x64：`RepoFlow-Hub-<版本>-windows-x64.zip` → 解压后双击 `start.cmd`
- Linux x64：`RepoFlow-Hub-<版本>-linux-x64.tar.gz` → 解压后 `./start.sh`
- 每个 Release 附带 `SHA256SUMS.txt`，可用 `sha256sum -c SHA256SUMS.txt` 校验

包内自带 `README.txt` 使用说明，解压即可看到。需要本机已安装 Chrome / Chromium / Edge 提供 App 窗口；缺失时会退回系统默认浏览器打开 `app/index.html`。

## 使用教程

### 1. 打开应用

- 网页版：浏览器访问 https://github.zhangwenle.com/
- 离线版：Windows 双击 `start.cmd`；Linux 执行 `chmod +x start.sh && ./start.sh`

首次打开会看到登录门（离线版自动进入本地模式，不显示登录门）。

### 2. 连接 GitHub（可选）

1. 点「使用 GitHub 访问令牌连接」。
2. 在 https://github.com/settings/tokens?type=beta 新建 **Fine-grained token**：
   - Repository access：自己用选 **All repositories**，或只勾目标仓库
   - Permissions：只需 **Contents: Read**（Metadata 会自动包含）
   - 其他权限全部保持 No access
3. 复制令牌（`github_pat_...` 或 `ghp_...`）粘贴到输入框 → 「连接并读取仓库」。
4. 成功后侧栏显示 `账号名 · GitHub · N 个仓库`，仓库卡片换成真实数据。

令牌只存在当前页面内存：不写 localStorage、不进 cookie、不出现在网址里，刷新页面即失效。GitHub 的 OAuth 端点不允许跨域，静态站点无法弹出授权页，因此采用访问令牌方式。

### 3. 连接 Gitee（可选）

1. 点「使用 Gitee 私人令牌连接」。
2. 在 https://gitee.com/personal_access_tokens 生成私人令牌，勾选 **projects** 权限。
3. 粘贴令牌 → 「连接并读取仓库」。

Gitee 的开放 API 允许跨域，所以同样可以纯前端完成；令牌只随 HTTPS 发往 `gitee.com`，不落盘。

### 4. 扫描本地文件夹（离线版核心能力）

1. 点驾驶舱右上角 **扫描本地文件夹**。
2. 选择单个项目目录，或选择包含多个仓库的父目录（会自动向下找一级/二级子仓库）。
3. 应用只读读取 `.git` 里的 `HEAD / config / refs / logs / COMMIT_EDITMSG`，得到仓库名、当前分支、远端地址、最近提交与分支数。
4. 扫描后侧栏显示「文件夹名 · 本地文件夹 · N 个仓库」，快照显示「本地扫描 · N 个仓库 · 只读」。

限制：脏工作区、未推送提交、准确 `.git` 体积必须真正运行 git 才能得到，页面统一显示 0 或「—」，不伪造数据。

浏览器差异：Chrome / Edge 使用目录选择器；Firefox / Safari 或部分 `file://` 场景会自动退回文件夹选择（`webkitdirectory`），效果相同。点「同步状态」会重新扫描。

### 5. 演示模式

不想连接账号、也没有本地仓库时，点「浏览演示数据」即可查看 14 个视图的完整交互。演示数据全部是中性示例，侧栏会明确标注「演示数据 · 中性示例」。

### 6. 退出与清理

侧栏底部账号卡片或「账号与授权」页可撤销授权。退出会清空内存中的令牌并恢复演示数据；网页版会回到登录门。

## 功能视图

全局驾驶舱 · 提交工作台 · 全局检索 · 历史与删除 · 删减与清理 · 提交辅助 · CI 与钩子 · 项目集群 · 通知中心 · 平台与同步 · 开发数据 · 功能缺口 · 模块规划 · 账号与授权，共 14 个视图。

- **本地文件夹扫描**：只读解析 `.git`，支持父目录批量发现。
- **真实账号连接**：GitHub fine-grained token / Gitee 私人令牌，拉取真实仓库列表，支持手动刷新。
- **全局检索**：连接后检索真实仓库；演示模式检索内置索引。
- **批量操作**：跨仓库选择、批量拉取/推送/提交，执行前有 dry-run 预览。
- **CI 与钩子**：固件 CI、pre-commit、自定义钩子的模板与运行结果。
- **平台与同步**：GitHub / Gitee 双远端策略，同一提交分别推送。
- **主题**：日间冷白 + 夜间黑蓝，跟随系统或手动切换。

> 写操作说明：推送、删除、重建等会改变仓库的动作目前只做交互模拟与命令预览，不会真正执行。界面在登录门、顶部提示条和关于页都有标注。

## 常见问题

**令牌报 401**：令牌复制不完整、已过期或被撤销，重新生成。
**令牌报 403**：GitHub 令牌没有勾选目标仓库，或组织仓库未批准 SSO；Gitee 令牌缺少 projects 权限。
**只显示公开仓库**：GitHub 令牌的 Repository access 选的是 Public repositories，改为 All repositories 或勾选具体仓库。
**扫描不到仓库**：确认所选目录或其一级/二级子目录里存在 `.git`；`node_modules`、`dist`、隐藏目录会被跳过。
**浏览器不支持文件夹选择**：用 Chrome / Edge，或等待应用自动退回文件夹上传选择。
**部署后页面没更新**：EdgeOne 部署或 CDN 缓存滞后，在控制台重新部署并刷新缓存。

## 数据与隐私

- 静态页面不保存、不转发令牌；账号与仓库数据只在页面内存中，刷新即清空。
- 本地扫描只请求只读权限，不写入、不上传任何文件。
- 公开产物由 `templates/sanitize.py` 脱敏：账号名、真实仓库清单、本机路径、提交短哈希替换为中性示例值。
- 离线版不联网、不加载远程字体 / 脚本 / 图片 / 统计代码。

## 目录结构

```
src/
  shell.html            页面骨架（含占位符 @@CSS@@ / @@CONFIG@@ / @@JS@@）
  styles/               01-tokens → 08-about，按序拼接
  data/                 版本常量、示例快照、内置常量
  core/                 渲染、状态、交互、账号、远端登录、本地扫描等模块
  selftest.js           内置自检，仅 ?selftest=1 时运行
templates/              固件 CI / pre-commit / 钩子三份内嵌配置 + 脱敏脚本
scripts/build.py        单文件构建器（dev / web / desktop 三个目标）
scripts/verify.py       静态校验 + 可选浏览器自检
scripts/package.py      生成 Windows / Linux 离线安装包与 SHA256SUMS
web/                    网站构建产物
desktop/                离线版启动脚本与产物
prototype/              本机开发副本（含实测数据，不对外分发）
```

## 本地开发

需要 Python 3.10+（无第三方依赖）：

```bash
python scripts/build.py                 # 构建全部三个目标
python scripts/build.py --target=web    # 只构建网站版
python scripts/build.py --check         # 比对源码与产物是否一致
python scripts/verify.py                # 静态校验
python scripts/verify.py --browser      # 追加无头浏览器交互自检（235 条）
npm run package                         # 生成 dist/ 下的安装包与校验和
```

`prototype/index.html`、`web/index.html`、`desktop/app/index.html` 均由源码拼接生成，**不要手工编辑产物**。

## 发布流程

推送 `v*` tag 会自动构建两套离线包、生成校验和并发布 Release：

```bash
git tag v0.8.3
git push origin v0.8.3
```

Release 页面包含下载表格、使用步骤、平台说明与 `SHA256SUMS.txt`。

## 部署网站版

```bash
npx edgeone login
npx edgeone makers deploy ./web -n repoflow-hub -e production -a overseas
```

仓库根目录的 `edgeone.json` 定义安全响应头（CSP、HSTS、nosniff、X-Frame-Options 等）与 HTML 不缓存策略（EdgeOne 只读取项目根目录的该文件，放在输出目录不生效）。未备案域名请使用海外区域；Git 导入项目由 EdgeOne 自动构建部署，GitHub Actions 的 CLI 部署为手动兜底。

## 作者

樂創 · [LeChuangDev](https://github.com/LeChuangDev)
