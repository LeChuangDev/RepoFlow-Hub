/* ================= 实测数据（只读扫描，2026-11-06 14:37） ================= */
const REPOS = [
  {id:'calcbridge', name:'calcbridge', group:'上位机 / 工具脚本', remote:'LeChuangDev/calcbridge', branch:'main',
   date:'2026-11-06', msg:'docs: README 增加在线地址、部署方式与发布流程', size:'1.5 MB', sizeMB:1.5,
   files:181, branches:2, attrs:true, kind:'tool', demo:{dirty:3, ahead:2, pr:1}},
  {id:'lechuang-site', name:'lechuang-site', group:'个人站点', remote:'LeChuangDev/lechung-site', branch:'main',
   date:'2026-11-06', msg:'chore: 精简站点标题与描述文案', size:'20 MB', sizeMB:20,
   files:183, branches:3, attrs:false, kind:'web', demo:{dirty:0, ahead:0, pr:2}},
  {id:'32_Demo', name:'32_Demo', group:'电源项目集群 · 固件', remote:'LeChuangDev/stm32-demos', branch:'main',
   date:'2026-10-23', msg:'chore: 清理 Keil 构建产物并修正 gitignore', size:'21 MB', sizeMB:21,
   files:861, branches:2, attrs:false, kind:'fw', demo:{dirty:12, ahead:0, pr:0}},
  {id:'Templates', name:'Templates', group:'电源项目集群 · 模板', remote:'LeChuangDev/mcu-demo-templates', branch:'main',
   date:'2026-10-30', msg:'更新', size:'5.0 MB', sizeMB:5,
   files:530, branches:2, attrs:false, kind:'fw', demo:{dirty:0, ahead:1, pr:0}},
  {id:'pcb-basics-notes', name:'pcb-basics-notes', group:'硬件工程 · 笔记', remote:'LeChuangDev/pcb-basics-notes', branch:'main',
   date:'2026-10-20', msg:'docs: fix markdown folder tree render error', size:'95 KB', sizeMB:.095,
   files:3, branches:2, attrs:false, kind:'hw', demo:{dirty:1, ahead:0, pr:0}},
  {id:'jlc', name:'嘉立创资料', group:'硬件工程 · 资料', remote:'LeChuangDev/Leeco-Jialichuang-EDA-Notes', branch:'main',
   date:'2026-10-20', msg:'改变', size:'93 MB', sizeMB:93,
   files:6, branches:2, attrs:false, kind:'hw', demo:{dirty:0, ahead:0, pr:0}},
];
const BIGFILES = [
  {n:'嘉立创EDA专业版电子版设计认证考试实战详解.pdf', p:'硬件设计/嘉立创资料 · 文件名含换行符', s:'74.5 MB', v:74.5, a:'LFS 追踪'},
  {n:'嘉立创EDA专业版…设计认证考试实战详解.pdf', p:'硬件设计/嘉立创资料', s:'20.1 MB', v:20.1, a:'LFS 追踪'},
  {n:'西湖-单面板布线(PCB)设计指南_1-99.pdf', p:'硬件设计/嘉立创资料', s:'14.4 MB', v:14.4, a:'LFS 追踪'},
  {n:'十年社群…资料合辑.pdf', p:'硬件设计/嘉立创资料', s:'13.4 MB', v:13.4, a:'LFS 追踪'},
  {n:'STM32H7B3.svd', p:'32_Demo · H743_Demo/EIDE/.pack/Keil/…', s:'5.1 MB', v:5.1, a:'加入 .gitignore'},
  {n:'STM32H7B0.svd', p:'32_Demo · H743_Demo/EIDE/.pack/Keil/…', s:'4.9 MB', v:4.9, a:'加入 .gitignore'},
  {n:'r3-top-1440.png', p:'lechuang-site · preview/', s:'1.3 MB', v:1.3, a:'LFS 候选'},
  {n:'stm32h743xx.h', p:'Templates · Drivers/CMSIS/Device/ST/', s:'2.0 MB', v:2.0, a:'保留（源码）'},
];
const TIMELINE = [
  {day:'今天 · 11-06', items:[
    {r:'calcbridge', m:'docs: README 增加在线地址、部署方式与发布流程', t:'main · 14:02', c:''},
    {r:'lechuang-site', m:'chore: 精简站点标题与描述文案', t:'main · 11:48', c:'alt'},
  ]},
  {day:'10-30', items:[{r:'Templates', m:'更新', t:'main · 09:16', c:'grey'}]},
  {day:'10-23', items:[{r:'32_Demo', m:'chore: 清理 Keil 构建产物并修正 gitignore', t:'main · 16:30', c:'alt'}]},
  {day:'10-20', items:[
    {r:'pcb-basics-notes', m:'docs: fix markdown folder tree render error', t:'main · 20:11', c:'grey'},
    {r:'嘉立创资料', m:'改变', t:'main · 19:44', c:'grey'},
  ]},
];
const PLANS = {
  planHistory:[
    {n:'规范提交模板（Conventional Commits）', ico:'M4 6h16M4 12h10M4 18h7', phase:'v0.1 · 立即做', cls:'t-teal', li:['实测 6 个仓库最近提交多为「更新 / 改变 / docs: …」自由文本，规范缺失是真实痛点','内置 feat/fix/docs/chore/refactor，扩展 hw / fw 两类自定义前缀','下拉选择 + 作用域 + 描述，自动生成提交信息，不强制拦截手写']},
    {n:'提交草稿', ico:'M4 4h16v12H8l-4 4V4z', phase:'v0.2', cls:'t-blue', li:['把工作区快照存为本地草稿，替代频繁 stash','草稿需与分支绑定，切换分支时明确提示冲突风险']},
    {n:'可视化提交图谱 / 行级暂存 / Diff', ico:'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4', phase:'v0.2', cls:'t-blue', li:['实测 6 个仓库仅 2–3 个分支、全部线性 main，图谱与拖拽 cherry-pick 暂无使用场景','优先做文件级 diff + 行级暂存，图谱在分支数上升后再投入']},
    {n:'交互式 rebase / 拖拽 cherry-pick / 回退预览', ico:'M12 3v18M3 12h18', phase:'v0.4 · 延后', cls:'t-grey', li:['实现复杂度高（冲突回滚、rebase todo 编辑、three-way merge 可视化）','当前无多分支历史，投入产出比最低；先在 CLI 完成，工具只做结果预览']},
  ],
  planRelease:[
    {n:'Git LFS 可视化管理', ico:'M4 7h16v10H4zM8 7V4h8v3', phase:'v0.1 · 立即做', cls:'t-teal', li:['实测 git-lfs 3.7.1 已装但 6 个仓库均未追踪 LFS；嘉立创资料 93 MB / 最大单文件 74.5 MB','一键写入 .gitattributes、展示 LFS 对象与配额占用','区分「后续追踪（可逆）」与「历史重写（不可逆，需二次确认）」']},
    {n:'固件一键发布流水线', ico:'M12 3v12M8 7l4-4 4 4M4 15v6h16v-6', phase:'v0.2', cls:'t-blue', li:['按 platformio.ini / sdkconfig / .ioc 识别 ESP-IDF、PlatformIO、STM32 工程','版本号 → changelog → 编译校验 → 打包 → GitHub Release 上传附件','编译依赖本机工具链，必须先做「工具链可用性探测」并允许跳过校验']},
    {n:'项目集群联动', ico:'M3 3h8v8H3zM13 13h8v8h-8zM11 7h4v4', phase:'v0.3', cls:'t-grey', li:['把硬件工程 + 固件工程 + 上位机绑定，记录版本对应矩阵','发布整机版本时生成跨仓库版本快照，需定义快照的存储格式与失效规则']},
  ],
  planCluster:[
    {n:'集群定义与版本矩阵', ico:'M3 3h8v8H3zM13 13h8v8h-8z', phase:'v0.3', cls:'t-grey', li:['候选集群：32_Demo（固件）+ Templates（MCU 模板）+ 嘉立创资料（硬件资料）+ calcbridge（上位机）','需回答：快照存在哪里、跨仓库 tag 如何对齐、某仓库回滚时快照如何处理']},
    {n:'外部工具一键唤起', ico:'M4 4h16v16H4zM8 8h8v8H8z', phase:'v0.2', cls:'t-blue', li:['VS Code / 立创 EDA / 终端 / 资源管理器，路径与命令走配置而非硬编码','固件仓库可挂串口监控、烧录工具；启动前校验可执行文件存在']},
  ],
  planWorkflow:[
    {n:'GitHub 深度集成', ico:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20', phase:'v0.2', cls:'t-blue', li:['实测本机未安装 gh CLI，必须走 REST/GraphQL + PAT/OAuth，不能依赖命令行 gh','Issue/PR/Actions 聚合需处理 5000 次/小时限流与私有仓库 scope','令牌存系统密钥链，不落盘明文']},
    {n:'笔记与文档联动', ico:'M4 4h12l4 4v12H4z', phase:'v0.3', cls:'t-grey', li:['实测有 pcb-basics-notes 等笔记仓库，双向链接有真实承接对象','需定义双链格式（repo+commit sha）与笔记移动后的失效修复']},
    {n:'脚本扩展（pre-commit / post-push / post-release）', ico:'M8 4l-4 8 4 8M16 4l4 8-4 8', phase:'v0.3', cls:'t-grey', li:['Python / PowerShell 钩子需超时、白名单与失败策略，否则会阻塞批量操作','与 Git 原生 hooks 的边界要先划清，避免双触发']},
    {n:'多平台账号（Gitee 等）', ico:'M12 2v20M2 12h20', phase:'v0.4 · 延后', cls:'t-grey', li:['实测 6 个仓库远端全部是 github.com/LeChuangDev，无 Gitee 远端','当前无真实使用场景，建议延后到出现第一个非 GitHub 仓库']},
  ],
  planStats:[
    {n:'个人开发数据仪表盘', ico:'M4 20V10M10 20V4M16 20v-7', phase:'v0.3', cls:'t-grey', li:['提交频次 / 活跃时段 / 代码行数，按周月复盘','代码行数需排除 vendor 与生成文件（实测 Templates 有 530 个受控文件，含大量 CMSIS 源码）']},
    {n:'暗黑主题与自定义布局', ico:'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z', phase:'v0.1 · 已实现', cls:'t-teal', li:['本原型已提供亮/暗主题切换、8pt 网格、12px 圆角与统一动效','面板拖拽需持久化布局状态，并在窗口尺寸变化时可复位']},
  ],
};

