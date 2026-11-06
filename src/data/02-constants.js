/* ================= v2 · 提交规范与规模策略 ================= */
const COMMIT_TYPES=[
  {k:'feat',d:'新功能'},{k:'fix',d:'缺陷修复'},{k:'docs',d:'文档'},
  {k:'chore',d:'杂项'},{k:'refactor',d:'重构'},{k:'perf',d:'性能'},
  {k:'test',d:'测试'},{k:'hw',d:'硬件 · 自定义'},{k:'fw',d:'固件 · 自定义'}
];
const SYNC_POLICY={max:100,concurrency:4,virtualizeAt:40,lfsQuotaGB:1};
const C={type:'feat',repo:'calcbridge'};

/* ================= v3 · 工程矩阵 / 钩子 / 删除向导 / 缺口 ================= */
const CMAKE_PROJECTS=['AT_F435_Demo','CW_F030_Demo','GD_E230_Demo','GD_F407_Demo','ST_F103_Demo','ST_F407_Demo','ST_G431_Demo','ST_H743_Demo'];
const PROJECTS=[
  ...['F103_Demo','F407','F407_Demo','H743_Demo'].map(n=>({n,repo:'32_Demo',kind:'Keil MDK-ARM / EIDE',tool:'armcc / armclang',level:'block',ci:'不可编译',
    why:'仅 .uvprojx；商业授权且仅 Windows，.eide/ 未入库'})),
  ...CMAKE_PROJECTS.map(n=>({n,repo:'Templates',kind:'CMake 裸机',tool:'gcc-arm-none-eabi + Ninja',level:'ok',ci:'可直接编译',
    why:'CMakePresets.json + cmake/arm-none-eabi.cmake + Core/Linker'})),
  {n:'ESP_S3_Demo',repo:'Templates',kind:'ESP-IDF',tool:'Xtensa / RISC-V',level:'warn',ci:'容器编译',
    why:'有 sdkconfig 与 main/CMakeLists.txt，需 espressif/idf 容器'}
];
const HOOKS=[
  {n:'trailing-whitespace',d:'尾部空白',g:'格式',log:'0 files'},
  {n:'end-of-file-fixer',d:'文件末尾换行',g:'格式',log:'0 files'},
  {n:'check-merge-conflict',d:'合并冲突标记',g:'门禁',log:'clean'},
  {n:'check-added-large-files',d:'新文件 > 2 MB 拦截',g:'门禁',log:'0 blocked'},
  {n:'clang-format',d:'C/C++ 格式化（排除第三方源码）',g:'格式',log:'3 files'},
  {n:'cppcheck',d:'语法与静态检查',g:'检查',log:'1 warning'},
  {n:'firmware-checks',d:'CMake 编译 + 单元测试',g:'测试',log:'1 project · 0 tests'}
];
const COMMITS=[
  {sha:'8f3a1c2',msg:'chore: 清理 Keil 构建产物并修正 gitignore',date:'2026-10-23',tag:'HEAD',real:true},
  {sha:'6d2b9e4',msg:'fw: 修正 H743 ADC 采样通道映射',date:'2026-10-21',tag:'',real:false},
  {sha:'c41f80a',msg:'hw: 更新电源板采样电阻封装',date:'2026-10-18',tag:'v1.2.0',real:false},
  {sha:'b9e7315',msg:'docs: 补充 EIDE 工程导入说明',date:'2026-10-15',tag:'',real:false},
  {sha:'3a7d208',msg:'chore: 误提交 .pack 器件包缓存',date:'2026-10-12',tag:'',real:false},
  {sha:'e52c4b6',msg:'feat: 初始化 STM32H743 寄存器工程',date:'2026-10-08',tag:'',real:false}
];
const CHANGES=[
  {f:'H743_Demo/App/adc.c',s:'M',a:24,d:6},
  {f:'H743_Demo/BSP/bsp_adc.c',s:'M',a:11,d:3},
  {f:'H743_Demo/Core/Inc/adc.h',s:'M',a:2,d:0},
  {f:'H743_Demo/EIDE/.pack/Keil/STM32H7xx_DFP.pdsc',s:'D',a:0,d:1},
  {f:'README.md',s:'M',a:5,d:1}
];
const DELETE_MODES=[
  {k:'revert',t:'撤销这次改动',sub:'新增一条反向提交，历史不变',risk:'低',cls:'t-green',
   impact:['后续哈希变化','0 个','是否强制推送','不需要','影响其他克隆','否','新增提交','1 条']},
  {k:'drop',t:'丢弃未推送的本地提交',sub:'仅影响本地分支，远端不变',risk:'中',cls:'t-amber',
   impact:['后续哈希变化','仅本地重放','是否强制推送','不需要','影响其他克隆','否','适用条件','目标未推送']},
  {k:'rewrite',t:'从历史中彻底移除',sub:'改变其后所有提交哈希，不可逆',risk:'高',cls:'t-red',
   impact:['后续哈希变化','见预览','是否强制推送','需要','影响其他克隆','是','自动备份','bundle 必做']}
];
const GAPS={
  now:[
    {n:'提交工作台 + pre-commit 门禁',why:'用户明确要求；6 个仓库里只有 calcbridge 有 CI，其余提交前无检查'},
    {n:'删除某一次提交记录（三档安全模型）',why:'原设计只有「回退预览 soft/mixed/hard」，未区分 revert / drop / 重写'},
    {n:'GitHub Actions 编译矩阵与 Release 包',why:'Templates 8 个工程已有 preset + toolchain，具备直接落地条件'},
    {n:'32 项目工程识别与可构建性分级',why:'实测 32_Demo 是 Keil/EIDE，不能套用 CMake 工作流，必须在界面上说清'},
    {n:'大文件提交前拦截',why:'嘉立创资料仓曾混入 74.5 MB PDF，check-added-large-files 直接对症'},
  ],
  next:[
    {n:'CI 运行状态与失败通知回传',why:'需要 GitHub 令牌与限流退避；本机未装 gh，须走 REST/GraphQL'},
    {n:'私有仓库 Actions 分钟数监控',why:'Free 计划 2000 分钟/月，8 工程矩阵编译需估算单次耗时'},
    {n:'32_Demo 的 CMake 迁移向导',why:'当前 4 个 Keil 工程编译不了；Templates 已有成熟模板可复用'},
    {n:'固件版本号与 changelog 自动生成',why:'原设计模块 4 已列，尚未实现；release 任务已预留 CHANGELOG 步骤'},
    {n:'单元测试目标补齐',why:'仅 Module/build-test 出现过 CTest 产物，钩子目前只能跳过'},
  ],
  no:[
    {n:'可视化交互式 rebase / 拖拽 cherry-pick',why:'6 个仓库全部线性 main，每仓仅 2–3 分支，当前无使用场景'},
    {n:'Gitee 多平台账号',why:'6 个仓库远端全部 github.com/LeChuangDev，无 Gitee 远端'},
    {n:'重型团队协作功能',why:'产品定位是个人开发者，原设计已明确排除'}
  ]
};
const CFG_FILES=[
  {k:'ci',n:'firmware-ci.yml',file:'firmware-ci.yml',hint:'放到 <仓库>/.github/workflows/'},
  {k:'precommit',n:'.pre-commit-config.yaml',file:'.pre-commit-config.yaml',hint:'放到 <仓库根>/'},
  {k:'hook',n:'firmware-checks.sh',file:'firmware-checks.sh',hint:'放到 <仓库>/.repoflow/hooks/'}
];
const CFG={ci:()=>$('#cfgCi').textContent.trim(),precommit:()=>$('#cfgPrecommit').textContent.trim(),hook:()=>$('#cfgHook').textContent.trim()};
const W={staged:new Set(),hookDone:0,hookRunning:false,fixed:false,committed:false,
         histIdx:0,delMode:'revert',confirmName:'',backedUp:false,cfgKey:'ci'};
function hookPass(i){return !(i===5&&!W.fixed)}

const LIVE=[
  {id:"32_Demo",short:"32_Demo",sha:"49f1846",author:"樂創",date:"2026-10-23",msg:"chore: 清理 Keil 构建产物并修正 gitignore"},
  {id:"calcbridge",short:"calcbridge",sha:"646b5cf",author:"樂創",date:"2026-11-06",msg:"docs: README 增加在线地址、部署方式与发布流程"},
  {id:"lechuang-site",short:"lechuang-site",sha:"8abe37d",author:"樂創",date:"2026-11-06",msg:"style: 弱化首屏横向光痕，消除明显的横向分割线"},
  {id:"Templates",short:"Templates",sha:"5739bea",author:"樂創",date:"2026-10-30",msg:"更新"},
  {id:"pcb-basics-notes",short:"pcb-basics-notes",sha:"abe93ad",author:"樂創",date:"2026-10-20",msg:"docs: fix markdown folder tree render error"},
  {id:"jlc",short:"嘉立创资料",sha:"4851548",author:"樂創",date:"2026-10-20",msg:"改变"}
];
/* ================= v4 · 检索索引 / 通知 / 集群 / 规划分组 ================= */
const SEARCH_INDEX=[
  ...LIVE.map(x=>({repo:x.short,sha:x.sha,msg:x.msg,date:x.date,branch:'main',author:x.author,real:true})),
  ...COMMITS.map(c=>({repo:'32_Demo',sha:c.sha,msg:c.msg,date:c.date,branch:'main',author:'演示数据',real:false}))
];
const NOTICES_LOCAL=[
  {id:'L1',kind:'本地检测',level:'warn',repo:'嘉立创资料',title:'仓库体积 93 MB',body:'4 个 PDF 未启用 LFS 追踪，最大单文件 74.5 MB',time:'15:14',view:'clean'},
  {id:'L2',kind:'本地检测',level:'warn',repo:'32_Demo',title:'Keil 工程无法进入免费 CI',body:'4 个子工程仅 .uvprojx，需先迁移到 CMake',time:'15:14',view:'ci'},
  {id:'L3',kind:'本地检测',level:'ok',repo:'calcbridge',title:'已具备 CI + Release 工作流',body:'ci.yml / release.yml，含最小权限与锁文件门禁',time:'15:14',view:'ci'}
];
const NOTICES_DEMO=[
  {id:'G1',kind:'Actions',level:'fail',repo:'Templates',title:'固件 CI #24 失败',body:'ST_G431_Demo 链接阶段未定义符号',time:'13:41',view:'ci',
   log:'-- Configuring done\n-- Generating done\n[ 92%] Building C object CMakeFiles/ST_G431_Register.dir/BSP/bsp_adc.c.obj\n[100%] Linking C executable ST_G431_Register.elf\n/usr/bin/ld: undefined reference to `ADC_ConvCplt_Callback\'\ncollect2: error: ld returned 1 exit status\nninja: build stopped: subcommand failed.'},
  {id:'G2',kind:'Actions',level:'ok',repo:'calcbridge',title:'CI #128 通过',body:'typecheck / lint / format / test / build 全部通过',time:'14:02',view:'ci'},
  {id:'G3',kind:'合并请求',level:'info',repo:'lechuang-site',title:'PR #7 收到 1 条评审意见',body:'建议弱化首屏横向光痕',time:'11:48',view:'dashboard'},
  {id:'G4',kind:'问题',level:'info',repo:'pcb-basics-notes',title:'Issue #3 有新回复',body:'确认 markdown 目录树渲染问题已修复',time:'昨天',view:'dashboard'},
  {id:'G5',kind:'LFS',level:'warn',repo:'嘉立创资料',title:'LFS 配额即将达到阈值',body:'当前占用约 12%（按 1 GB 配额估算）',time:'昨天',view:'clean'}
];
const INBOX_FILTERS=[{k:'all',n:'全部'},{k:'fail',n:'失败'},{k:'Actions',n:'Actions'},{k:'合并请求',n:'合并请求'},{k:'本地检测',n:'本地检测'}];
const CLUSTER_MEMBERS=[
  {role:'固件工程',repo:'32_Demo',id:'32_Demo',ver:'v1.2.0',note:'4 个 Keil / EIDE 子工程'},
  {role:'MCU 模板',repo:'Templates',id:'Templates',ver:'—',note:'8 个 CMake 子工程'},
  {role:'硬件资料',repo:'嘉立创资料',id:'jlc',ver:'—',note:'93 MB，待 LFS 迁移'},
  {role:'上位机',repo:'calcbridge',id:'calcbridge',ver:'—',note:'已有 CI + Release 工作流'}
];
const PLAN_TABS=[
  {k:'planHistory',n:'提交与历史'},{k:'planRelease',n:'固件发布'},
  {k:'planCluster',n:'项目集群'},{k:'planWorkflow',n:'工作流生态'},{k:'planStats',n:'开发数据'}
];
const HELP_KEYS=[
  ['/','聚焦顶部搜索'],['Ctrl / ⌘ + K','打开命令面板'],['?','打开快捷键帮助'],['T','切换日间 / 夜间'],
  ['Esc','关闭面板 / 抽屉 / 搜索下拉'],['↑ ↓','搜索结果或命令面板内选择'],['Enter','打开选中项 / 执行命令'],
  ['Shift + 点击复选框','连续选中一段仓库'],['Tab 后 Enter / 空格','键盘打开卡片或切换选择']
];
function applyLive(){
  LIVE.forEach(l=>{
    const r=REPOS.find(x=>x.id===l.id);
    if(r){r.sha=l.sha;r.date=l.date;r.msg=l.msg;r.author=l.author;}
  });
  TIMELINE.forEach(g=>g.items.forEach(it=>{
    const l=LIVE.find(x=>x.short===it.r);
    if(l){it.m=l.msg;}
  }));
}

const PERF=[{"id": "32_Demo", "files": 861, "ms": 35.8, "fsmonitor": "unset", "untracked": "unset", "commitGraph": "unset"}, {"id": "Templates", "files": 530, "ms": 44.4, "fsmonitor": "unset", "untracked": "unset", "commitGraph": "unset"}, {"id": "jlc", "files": 6, "ms": 24.1, "fsmonitor": "unset", "untracked": "unset", "commitGraph": "unset"}, {"id": "lechuang-site", "files": 183, "ms": 29.7, "fsmonitor": "unset", "untracked": "unset", "commitGraph": "unset"}, {"id": "calcbridge", "files": 181, "ms": 28.4, "fsmonitor": "unset", "untracked": "unset", "commitGraph": "unset"}, {"id": "pcb-basics-notes", "files": 3, "ms": 27.2, "fsmonitor": "unset", "untracked": "unset", "commitGraph": "unset"}];
const GIT_VER="git version 2.55.0.windows.3";

/* ================= v5 · 调研结论 / 平台 / 同步策略 / 性能 ================= */
const RESEARCH=[
  {t:'跨 provider 工作区',s:'GitKraken Workspaces',f:'分组仓库 + 一键 pull/fetch/open + 跨设备共享配置',u:'采用',w:'对应分组与批量操作；个人版不需要云工作区与团队共享'},
  {t:'免费版可见性限制',s:'GitKraken 定价 / 竞品对比',f:'免费版仅支持公开库，私有库需付费套餐',u:'不采用',w:'个人工具按可见性设限没有意义，公开与私有库都应是一等公民'},
  {t:'多远端同步机制',s:'Git 多远端实践 / Gitee 社区',f:'单 remote 多 pushurl 的 fetch 只认第一个 URL，错误堆叠、认证过期难定位',u:'采用独立 remote',w:'逐远端记录状态与错误，失败可单独重试'},
  {t:'平台侧镜像',s:'Gitee 帮助中心 · 仓库镜像管理',f:'最短间隔 5 分钟、不支持 Git LFS、会覆盖目标分支/标签/提交，双向镜像有代码丢失风险',u:'受限采用',w:'93 MB 的 LFS 仓库明确不适用；大仓库走超时风险'},
  {t:'私有库认证',s:'GitHub Docs · 细粒度访问令牌',f:'限定仓库与最小权限、强制过期、存系统密钥链',u:'采用',w:'令牌不进远端 URL、不落盘明文、不写进工作流'},
  {t:'API 效率',s:'GitHub REST API 最佳实践',f:'优先 Webhook、ETag 条件请求 304 不计主要限流、串行并间隔 1 秒、私有资源 404 可能是权限不足',u:'采用',w:'替代高频轮询，避免把 404 误报成仓库不存在'},
  {t:'大仓库性能',s:'Git git-status 文档 / Scalar',f:'fsmonitor + untrackedCache 在 30 万文件级把秒级扫描降到毫秒',u:'列为可选',w:'本机 6 仓仅 27–50 ms，当前瓶颈不在单次扫描'},
  {t:'命令面板',s:'Setproduct 命令面板 8 状态 / Linear',f:'禁用命令要灰显并说明原因、无结果给恢复路径、离线时本地命令仍可用',u:'采用',w:'补齐当前只实现了一半的状态'},
  {t:'批量操作',s:'Design for Power Users / Linear',f:'选中可见、键盘可达、必须有真实撤销',u:'采用',w:'当前批量任务缺少撤销入口'},
  {t:'保存的视图',s:'Design for Power Users',f:'筛选状态要可寻址（URL），不能只存本地存储',u:'采用',w:'刷新与跨设备可恢复'}
];
const PLATFORMS=[
  {k:'github',n:'GitHub',host:'github.com',account:'LeChuangDev',repos:6,connected:true,color:'#6C63FF',short:'GH',
   scope:'细粒度令牌 · 限定仓库 · Contents 读写 · 90 天过期',note:'本机 6 个仓库的实测远端'},
  {k:'gitee',n:'Gitee',host:'gitee.com',account:'未绑定',repos:0,connected:false,color:'#C71D23',short:'GE',
   scope:'需 projects / pull_requests / issues 权限',note:'接入后可为指定仓库添加第二远端'}
];
const SYNC_STRATEGIES=[
  {k:'separate',n:'独立 remote 分别推送',lvl:'推荐',cls:'t-teal',
   pro:'fetch / push 关系清晰，可双向同步，逐个远端可定位失败',con:'需要两条推送命令（工具编排为一次点击）',src:'Git 多远端实践',
   cmd:'# 每个远端独立命名，可分别 fetch / push\ngit remote add github https://github.com/LeChuangDev/calcbridge.git\ngit remote add gitee https://gitee.com/LeChuangDev/calcbridge.git\ngit fetch github main\ngit fetch gitee main\ngit push github main\ngit push gitee main'},
  {k:'pushurl',n:'单 remote 多 pushurl',lvl:'单向镜像',cls:'t-amber',
   pro:'一条 git push 同时推到所有平台',con:'fetch 只认第一个 URL；错误堆叠只报最后一段；认证过期难定位；失败不自动重试',src:'Git 文档 / 多远端实践',
   cmd:'# 注意：fetch 仍只走第一个 URL\ngit remote set-url --add --push origin https://github.com/LeChuangDev/calcbridge.git\ngit remote set-url --add --push origin https://gitee.com/LeChuangDev/calcbridge.git\ngit push origin main'},
  {k:'mirror',n:'Gitee 平台镜像管理',lvl:'受限',cls:'t-red',
   pro:'平台侧自动同步分支 / 标签 / 提交，可配 webhook 自动触发',con:'最短间隔 5 分钟；不支持 Git LFS；会覆盖目标分支/标签/提交；双向镜像有代码丢失风险；超 30 分钟视为超时',src:'Gitee 帮助中心',
   cmd:'# Gitee 仓库 → 管理 → 仓库镜像管理 → 添加镜像\n# Pull 方向：GitHub → Gitee（需 GitHub 令牌含 repo；自动镜像还需 admin:repo_hook）\n# Push 方向：Gitee → GitHub\n# 注意：不支持 Git LFS；镜像操作会覆盖目标仓库的分支、标签与提交'}
];
const API_POLICY=[
  ['条件请求','ETag + If-None-Match，304 不计入主要限流'],
  ['优先 Webhook','推送 / 问题 / Actions 事件驱动，替代高频轮询'],
  ['串行与间隔','变更类请求间隔 ≥ 1 秒，避免次级限流'],
  ['缓存 TTL','本地元数据 5 分钟，写后立即失效'],
  ['私有库 404','提示「可能权限不足」，不显示「仓库不存在」'],
  ['并发扫描','本地 4 路，按纳管规模自适应']
];
const PERF_CONFIG=[
  {k:'core.fsmonitor=true',why:'用文件系统事件替代全量 stat',when:'本地 SSD；网络盘 / WSL 跨文件系统应关闭'},
  {k:'core.untrackedCache=true',why:'缓存目录 mtime，跳过未变化目录',when:'先跑 git update-index --test-untracked-cache 确认返回 OK'},
  {k:'commitGraph.changedPaths=true',why:'Bloom 过滤加速 git log -- path 与 blame',when:'提交历史变长后启用'},
  {k:'git maintenance start',why:'后台 commit-graph / prefetch / 增量 repack',when:'多仓库长期维护，避免随机 gc 卡住终端'},
  {k:'index.version 4 / gc.auto 0',why:'Scalar 做法：索引瘦身、关闭自动 gc',when:'需与后台维护配合'}
];
function perfCommand(){
  return '# 本机实测：6 个仓库 status 中位数 27–50 ms，当前瓶颈不在单次扫描\n'
    +'# 以下为规模上升后的可选配置，逐项测量再启用\n'
    +PERF_CONFIG.slice(0,3).map(x=>'git config --global '+x.k).join('\n')
    +'\n# 后台维护（每台机器一次）\ngit maintenance start\n'
    +'# 量化前后差异\nGIT_TRACE2_PERF=1 git status';
}
const SYNC_STATES={
  single:{t:'仅 GitHub 单远端',cls:'t-blue'},ok:{t:'两边一致',cls:'t-clean'},
  behind:{t:'Gitee 落后 2 个提交',cls:'t-amber'},diverged:{t:'分叉 · 需先分别 fetch',cls:'t-red'},
  na:{t:'LFS 仓库不适用镜像',cls:'t-grey'},none:{t:'未配置第二远端',cls:'t-grey'}
};
const DEMO_SYNC={calcbridge:'diverged','lechuang-site':'behind','32_Demo':'ok',Templates:'ok',jlc:'na','pcb-basics-notes':'none'};
function syncStateOf(r){
  if(!S.demo)return r.id==='jlc'?'na':'single';
  return DEMO_SYNC[r.id]||'none';
}
function visibilityOf(r){
  if(!S.demo)return {t:'待令牌读取',cls:'t-grey'};
  return ['calcbridge','jlc','32_Demo'].includes(r.id)?{t:'私有',cls:'t-amber'}:{t:'公开',cls:'t-clean'};
}
function syncResults(){
  const rows=[{p:'GitHub',host:'github.com',ok:true,ms:'0.41s',log:'ok · fast-forward'}];
  if(S.demo)rows.push({p:'Gitee',host:'gitee.com',ok:false,ms:'1.20s',log:'401 · 令牌过期或权限不足'});
  return rows;
}

const PII_BASELINE={"账号名": 15, "作者名": 7, "本机路径": 1, "真实短哈希": 12};

/* ================= v6 · 账号 / 认证 / 开源就绪 ================= */
const AUTH_METHODS=[
  {n:'GitHub App + PKCE',host:'GitHub',secret:'否（公共客户端）',flow:'授权码 + S256 + loopback 回调；state 防跨站请求伪造',use:'推荐',cls:'t-teal',
   why:'官方建议优先建 GitHub App；公共客户端使用 PKCE；设备流仅在受限环境启用'},
  {n:'Gitee OAuth 授权码',host:'Gitee',secret:'是',flow:'authorize → code → POST /oauth/token（client_secret 放请求体）',use:'Gitee 登录',cls:'t-blue',
   why:'官方 API v5 文档未见 PKCE / 设备流；scope 取 user_info / projects / pull_requests / issues'},
  {n:'细粒度访问令牌',host:'GitHub / Gitee',secret:'令牌本身即凭据',flow:'使用者手动生成后填入',use:'简化路径 / CI',cls:'t-amber',
   why:'限定仓库 + 最小权限 + 30–90 天过期；官方说明应用不应把 PAT 当作应用认证方式'},
  {n:'SSH 密钥',host:'任意 Git 主机',secret:'私钥不离机',flow:'本地 Git 推送认证',use:'仅推送',cls:'t-grey',
   why:'不能用于读取问题 / 合并请求 / CI 状态'}
];
const AUTH_STEPS=[
  {n:'生成 state 与 PKCE verifier',d:'每次登录独立随机值；state 防跨站请求伪造，challenge = BASE64URL(SHA256(verifier))'},
  {n:'打开系统浏览器授权页',d:'GET /login/oauth/authorize?client_id=…&redirect_uri=…&state=…&code_challenge=…&code_challenge_method=S256'},
  {n:'loopback 接收回调',d:'本机临时端口接收 ?code=&state=，校验 state 一致后立即关闭监听，不使用内嵌 WebView'},
  {n:'换取令牌',d:'POST /login/oauth/access_token 带 code + code_verifier；Gitee 另需 client_secret（放请求体）'},
  {n:'写入系统密钥链',d:'Windows 凭据管理器 / macOS 钥匙串 / libsecret；刷新令牌与访问令牌分开存放'},
  {n:'拉取账号与仓库',d:'读取用户与仓库列表，按账号建立独立缓存命名空间；失败时走重新授权流程'}
];
/* 账号模板：只描述「可关联的平台」，不含任何用户名或凭据。
   界面默认 S.accounts 为空，必须由使用者自己登录后才创建账号。 */
const ACCOUNTS=[
  {id:'github-primary',platform:'github',host:'github.com',user:'—',label:'GitHub 账号',state:'pending',
   scopes:['repo','read:org'],color:'#6C63FF',short:'GH',exp:'—',store:'尚未写入'},
  {id:'gitee-personal',platform:'gitee',host:'gitee.com',user:'—',label:'Gitee 账号',state:'pending',
   scopes:['user_info','projects'],color:'#C71D23',short:'GE',exp:'—',store:'尚未写入'},
  {id:'github-work',platform:'github',host:'github.com',user:'—',label:'第二个 GitHub 账号',state:'pending',
   scopes:['repo'],color:'#2E9E96',short:'GH',exp:'—',store:'尚未写入'}
];
const ACCOUNT_REPOS={
  'github-primary':['calcbridge','lechuang-site','32_Demo','Templates','jlc','pcb-basics-notes'],
  'gitee-personal':['calcbridge','Templates'],
  'github-work':['calcbridge','Templates']
};
const DEFAULT_SCOPES=['repo','read:org','user_info','projects','pull_requests','issues'];
const OSS_CHECKLIST=[
  {n:'源码中无真实账号 / 路径 / 提交短哈希',st:'fail',why:'工作副本含真实数据；用 templates/sanitize.py 生成 index.public.html'},
  {n:'.env.example 只含占位值',st:'pass',why:'已提供；真实 .env 必须加入 .gitignore'},
  {n:'无内嵌 client_secret / 明文令牌',st:'pass',why:'BYOA + 系统密钥链；令牌不进远程 URL、不进版本控制'},
  {n:'多账号令牌按账号隔离',st:'pass',why:'accounts.example.json 定义独立 cacheNamespace'},
  {n:'刷新令牌失效有重新授权路径',st:'pass',why:'invalid_grant → prompt-reauth，不无限重试'},
  {n:'CI 对来自 fork 的 PR 禁用 secrets',st:'plan',why:'开源后 PR 来自 fork，不能让工作流拿到密钥'},
  {n:'许可证、贡献指南与密钥扫描',st:'plan',why:'发布前补齐；GitHub 建议公开库与私有库都开启推送保护'}
];

/* 同源对照基线：由 scripts/verify.py --bench 在同一份源码、同一浏览器会话中
   切换优化开关测得，三次运行逐项完全一致，可随 npm run bench 复现。
   before = 展开全部视图 + 仓库列表全量渲染；after = 当前默认（懒渲染 + 增量渲染）。
   只记录确定性的 DOM 结构计数：无头浏览器的虚拟时间会把 performance.now()
   量化成 0，耗时类数字不可复现，因此不写入对比表。 */
const BENCH_BEFORE={views:14,stressDataCount:506,stressCards:506,stressDomNodes:38027,startupDomNodes:20693};
const BENCH_AFTER={views:1,stressDataCount:506,stressCards:40,stressDomNodes:2531,startupDomNodes:1350};
const BENCH_LABELS={before:'关闭优化（同源对照）',after:'启用优化（当前）'};

/* ================= v7 · 渲染性能 / 懒渲染 ================= */
const PAGE_SIZE=40;
const DOM_BUDGET=1400;
const PERF_ACTIONS=[
  ['懒渲染视图','启动时只渲染当前视图，切换到某视图时才首次生成内容；已访问视图再刷新'],
  ['增量渲染长列表','仓库超过 40 个时只渲染一页，提供「显示更多」并可选 IntersectionObserver 自动追加'],
  ['事件委托','卡片 / 筛选器 / 命令项改为父容器单个监听器，避免每项重复绑定'],
  ['视口外跳过渲染','卡片使用 content-visibility:auto + contain-intrinsic-size:auto 208px'],
  ['空闲时间调度','追加渲染走 requestIdleCallback（不支持时降级 setTimeout），让出主线程'],
  ['计算结果缓存','repoStats 按数据指纹缓存，数据不变时复用'],
  ['扁平选择器','沿用单类选择器，避免深层后代匹配']
];
const LAZY={
  dashboard:function(){renderAll();renderTimeline();},
  workbench:function(){renderWbFiles();renderHooks();},
  rewrite:function(){renderHistory();renderDeleteModes();updateDelete();renderRemoval();},
  clean:function(){renderBigFiles();},
  commit:function(){renderCommitInit();},
  ci:function(){renderMatrix();renderCIJobs();renderCfg();},
  cluster:function(){renderCluster();},
  inbox:function(){renderInbox();},
  platforms:function(){renderPlatforms();},
  accounts:function(){renderAccounts();},
  stats:function(){renderStats();renderPerf();renderBench();},
  gaps:function(){renderGaps();renderResearch();},
  plans:function(){renderPlans();},
  search:function(){renderSearch();}
};
const RENDERED=new Set();
function ensureView(v){if(RENDERED.has(v))return;RENDERED.add(v);const f=LAZY[v];if(f)f();}
function rerenderRendered(){RENDERED.forEach(function(v){const f=LAZY[v];if(f)f();});}
function scheduleIdle(fn){
  if(typeof requestIdleCallback!=='undefined')requestIdleCallback(fn,{timeout:600});
  else setTimeout(function(){fn({timeRemaining:function(){return 8;},didTimeout:false});},0);
}
let _loadMoreIO=null;
function observeLoadMore(){
  if(_loadMoreIO){_loadMoreIO.disconnect();_loadMoreIO=null;}
  if(!S.autoLoadMore)return;
  const btn=$('#loadMore');
  if(!btn||typeof IntersectionObserver==='undefined')return;
  _loadMoreIO=new IntersectionObserver(function(entries){
    if(entries.some(function(e){return e.isIntersecting;})){
      _loadMoreIO.disconnect();_loadMoreIO=null;
      scheduleIdle(function(){S.repoLimit+=PAGE_SIZE;renderRepos();});
    }
  },{root:$('.scroll'),rootMargin:'200px'});
  _loadMoreIO.observe(btn);
}
function domBudget(){
  const n=document.querySelectorAll('*').length;
  const pct=Math.min(100,Math.round(n/DOM_BUDGET*100));
  const fill=$('#budgetFill');
  if(fill){fill.style.width=pct+'%';fill.className=pct>100?'over':'';}
  if($('#budgetText'))$('#budgetText').textContent='当前 '+n+' 节点 / 预算 '+DOM_BUDGET+'（'+(pct>100?'超预算':'达标')+'）';
  if($('#budgetNum'))$('#budgetNum').textContent=n;
  return n;
}
function renderBench(){
  const perK=x=>Math.round(x.stressDomNodes/x.stressDataCount*1000);
  const rows=[
    ['启动时 DOM 节点',BENCH_BEFORE.startupDomNodes,BENCH_AFTER.startupDomNodes],
    ['启动时已渲染视图',BENCH_BEFORE.views,BENCH_AFTER.views],
    ['压力场景卡片数',BENCH_BEFORE.stressCards,BENCH_AFTER.stressCards],
    ['压力场景 DOM 节点',BENCH_BEFORE.stressDomNodes,BENCH_AFTER.stressDomNodes],
    ['每千条数据 DOM 节点',perK(BENCH_BEFORE),perK(BENCH_AFTER)]
  ];
  $('#benchCmp').innerHTML=rows.map(function(r){
    const a=r[1],b=r[2],isNum=typeof b==='number';
    const delta=isNum?(b===0?'-100%':(b<a?'-':'+')+Math.round(Math.abs(b-a)/a*100)+'%'):'待测量';
    return '<tr><td>'+esc(r[0])+'</td><td class="bad">'+a+'</td><td class="good">'+(isNum?b:'—')+'</td><td>'+(isNum?delta:'—')+'</td></tr>';
  }).join('');
  $('#perfActions').innerHTML=PERF_ACTIONS.map(function(x){
    return '<div class="asset-row"><span class="tag t-teal" style="min-width:96px;text-align:center">'+esc(x[0])+'</span><span style="color:var(--text-2)">'+esc(x[1])+'</span></div>';
  }).join('');
  if($('#benchInit'))$('#benchInit').textContent='压力数据集 '+BENCH_AFTER.stressDataCount+' 条，五项计数三次运行完全一致；运行 npm run bench 可完整复现。耗时类指标受无头浏览器虚拟时间量化影响，不列入对比。';
  if($('#benchHeadBefore'))$('#benchHeadBefore').textContent=BENCH_LABELS.before;
  if($('#benchHeadAfter'))$('#benchHeadAfter').textContent=BENCH_LABELS.after;
  domBudget();
}
function exportPrefs(){
  const data={
    schema:'repoflow/preferences.v1',
    _comment:'仅含界面偏好，不含任何令牌、密钥或凭据',
    theme:S.theme,demo:S.demo,filter:S.filter,view:S.view,
    collapsed:[...S.collapsed],recent:S.cmdRecent.slice(0,8),
    activeAccount:S.activeAccount,scopes:[...S.scopes],strategy:S.strategy,
    planTab:S.planTab,acctTab:S.acctTab,autoLoadMore:S.autoLoadMore,repoLimit:S.repoLimit
  };
  return JSON.stringify(data,null,2);
}
function importPrefs(text){
  const d=JSON.parse(text);
  if(d.schema!=='repoflow/preferences.v1')throw new Error('偏好文件 schema 不匹配');
  if(d.theme)applyTheme(d.theme);
  if(typeof d.demo==='boolean')S.demo=d.demo;
  if(d.filter&&FILTERS.some(function(f){return f.k===d.filter;}))S.filter=d.filter;
  if(Array.isArray(d.collapsed))S.collapsed=new Set(d.collapsed);
  if(Array.isArray(d.recent))S.cmdRecent=d.recent;
  if(d.activeAccount&&ACCOUNT_REPOS[d.activeAccount])S.activeAccount=d.activeAccount;
  if(Array.isArray(d.scopes))S.scopes=new Set(d.scopes);
  if(d.strategy)S.strategy=d.strategy;
  if(d.planTab)S.planTab=d.planTab;
  if(d.acctTab)S.acctTab=d.acctTab;
  if(typeof d.autoLoadMore==='boolean')S.autoLoadMore=d.autoLoadMore;
  S.repoLimit=PAGE_SIZE;
  applyCollapsed();rerenderRendered();renderAccountCards();renderAcctTabs();
  if(d.view&&$('#view-'+d.view))setView(d.view);
  return d;
}

