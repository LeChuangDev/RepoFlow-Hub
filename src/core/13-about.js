/* ================= v10 · 作者署名、关于面板与隐私隔离自检 =================
   「樂創」是作者主动公开的中文笔名，不是账户信息；所有版本都展示。
   公开产物不含任何真实账号、仓库清单、路径、提交哈希或凭据。       */
const AUTHOR='樂創';
const APP_VERSION='0.10';
const EDITION_NAME={dev:'本机开发副本',web:'公开网站版',desktop:'离线 Windows 版'};
const EDGEONE_STEPS=[
  '把 web/ 目录（含 index.html）作为静态站点根目录上传到 EdgeOne Pages，或在控制台直接导入该目录；无需服务端、构建命令或数据库。',
  '控制台进入项目详情，切换到「域名管理」，点击「添加自定义域名」，输入根域名或子域名。',
  '按弹窗指引在域名注册商添加解析记录验证归属权，再配置平台给出的 CNAME 记录值。',
  '验证通过后平台自动签发免费 SSL 证书，启用 HTTPS；DNS 生效通常几分钟，最长可能到 48 小时。',
  '中国大陆可用区或全球（含中国大陆）可用区绑定自定义域名需完成 ICP 备案；全球（不含中国大陆）可用区免备案。',
  '自定义域名可关联生产或预览环境，域名始终指向该环境最近一次成功部署。'
];
const PRIVACY_FACTS=[
  '单文件静态页面：无后端、无数据库、无服务端会话；只有在你主动连接 GitHub 时才会调用 api.github.com，其余时间不发起任何网络请求。',
  'GitHub 登录使用你自己创建的访问令牌：令牌只存在当前页面内存，不写入 localStorage（浏览器本地存储）、cookie（小型站点数据）或网址参数；刷新页面即失效，退出登录立即清空。',
  '主题、筛选、折叠状态与项目图标偏好只写入当前浏览器的 localStorage；不同设备、不同浏览器、隐私窗口之间互不可见。',
  '公开产物使用中性示例仓库与示例文件名，查看网页源码也看不到作者的账号、真实仓库清单、本机路径或提交短哈希（你自己登录后拉取的真实仓库只显示在本次会话）。',
  '公开产物不加载远程字体、脚本、图片或统计代码，字体使用设备自带系统字体；请求只发往 api.github.com。',
  '离线 Windows 版与网站版各自使用独立的浏览器存储，两边的仓库列表、图标与登录状态不会同步；离线版不联网。'
];

function editionName(){return EDITION_NAME[EDITION]||'未知形态';}
function aboutCardHtml(){
  return `<div class="about-card">
    <div class="about-mark"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><circle cx="18" cy="12" r="2.3"/><path d="M6 8.3v7.4M8.3 6h3.4a3 3 0 0 1 3 3v.7M8.3 18h3.4a3 3 0 0 0 3-3v-.7"/></svg></div>
    <div class="about-text"><b>关于 RepoFlow Hub · 作者 ${AUTHOR}</b>
      <span>面向独立开发者的多仓库 Git 管理工具 · ${editionName()} · v${APP_VERSION} · 数据仅存本机</span></div>
    <span class="tag t-clean">零账户内置</span>
    <button class="btn btn-ghost" data-about style="height:28px;padding:0 11px;font-size:10.5px;flex:none">关于与隐私</button>
  </div>`;
}
function mountAboutCard(v){
  const view=$('#view-'+v);
  if(!view||view.querySelector('.about-card'))return;
  view.insertAdjacentHTML('beforeend',aboutCardHtml());
}
function privacyAudit(){
  let keys=[];
  try{keys=Object.keys(localStorage);}catch(e){keys=[];}
  const accountKeys=keys.filter(k=>/account|token|user|auth|secret|credential/i.test(k));
  const external=document.querySelectorAll('script[src],link[href],img[src^="http"]').length;
  const devFontOnly=EDITION==='dev'&&external>0;
  return [
    {n:'本地存储无账号 / 令牌键',ok:accountKeys.length===0,note:accountKeys.length?accountKeys.join(', '):'仅界面偏好与图标覆盖'},
    {n:'cookie 为空',ok:document.cookie==='',note:document.cookie?'存在 cookie':'未写入任何 cookie'},
    {n:'网址不含身份或令牌参数',ok:!/[?&](token|user|account|login)=/i.test(location.search),note:location.search||'无查询参数'},
    {n:'无外部脚本 / 样式 / 图片',ok:external===0,note:devFontOnly?'开发副本保留远程字体（公开产物已移除）':external+' 个外部标签'},
    {n:'公开版为中性示例数据',ok:EDITION==='dev'||S.live||REPOS.every(r=>r.remote.indexOf('demoOrg/')===0),
     note:EDITION==='dev'?'开发副本含本机实测数据，不对外发布':S.live?'当前为你登录后拉取的实时数据，仅存在于本页内存（离开即清空）':'公开产物已中性化（构建期扫描校验）'},
    {n:'账号仅存页面内存',ok:!keys.some(k=>/accounts|authed/i.test(k)),note:'刷新后需重新登录'}
  ];
}
function openAbout(){
  openDrawer('about');
  $('#drawerTitle').textContent='关于 RepoFlow Hub';
  $('#drawerRemote').textContent='作者 '+AUTHOR+' · '+editionName()+' · v'+APP_VERSION;
  const audit=privacyAudit();
  const pass=audit.every(x=>x.ok);
  $('#drawerBody').innerHTML=`
    <div class="drawer-hero"><div class="about-mark" style="width:48px;height:48px;border-radius:14px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><circle cx="18" cy="12" r="2.3"/><path d="M6 8.3v7.4M8.3 6h3.4a3 3 0 0 1 3 3v.7M8.3 18h3.4a3 3 0 0 0 3-3v-.7"/></svg></div>
      <div><b>RepoFlow Hub</b><span>作者 ${AUTHOR} · 面向独立全栈开发者的多仓库 Git 管理桌面工具</span></div></div>
    <div class="section-desc">以全局视角管理多个本地与远端仓库，覆盖提交规范、历史删除、大文件清理、固件 CI 与项目集群。本原型为交互演示，不执行任何真实 Git 写操作。</div>

    <div class="drawer-sec">隐私与多设备隔离</div>
    <div class="notice" style="margin-bottom:var(--s3)"><b>不同设备打开同一个网站，不会看到彼此的账号。</b>页面没有服务端账号体系，所有状态都在各自浏览器内；一个人登录后，另一个人打开仍是未登录状态。</div>
    ${PRIVACY_FACTS.map(x=>`<div class="asset-row"><span class="tag t-clean" style="flex:none">保证</span><span style="color:var(--text-2)">${esc(x)}</span></div>`).join('')}
    <div class="drawer-sec" style="margin-top:var(--s5)">本机隐私自检</div>
    <div class="notice" style="background:${pass?'var(--green-soft)':'var(--amber-soft)'}"><b>${pass?'全部通过':'存在例外项'}：</b>${audit.length} 项检查，${audit.filter(x=>x.ok).length} 项通过。</div>
    ${audit.map(x=>`<div class="oss-row"><span class="oss-state"><span class="tag ${x.ok?'t-clean':'t-amber'}">${x.ok?'通过':'例外'}</span></span>
      <span style="flex:1"><b>${esc(x.n)}</b><div style="font-size:10.5px;color:var(--text-3);margin-top:3px">${esc(x.note)}</div></span></div>`).join('')}

    <div class="drawer-sec" style="margin-top:var(--s5)">部署到 EdgeOne Pages（自己用）</div>
    ${EDGEONE_STEPS.map((x,i)=>`<div class="asset-row"><span class="tag t-blue" style="flex:none">${i+1}</span><span style="color:var(--text-2)">${esc(x)}</span></div>`).join('')}
    <div class="drawer-sec" style="margin-top:var(--s5)">分发形态</div>
    <div class="asset-row"><span class="tag t-teal" style="min-width:96px;text-align:center">网站版</span><span style="color:var(--text-2)">公开静态页面，自己绑定域名后登录使用；别人打开只看到中性示例数据与登录门。</span></div>
    <div class="asset-row"><span class="tag t-grey" style="min-width:96px;text-align:center">离线版</span><span style="color:var(--text-2)">desktop/ 文件夹拷贝给他人，双击 start.cmd，不联网、不登录、不访问网站。</span></div>`;
  $('#drawerFoot').innerHTML='';
}
