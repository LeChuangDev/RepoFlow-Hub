/* ================= 真实 GitHub 登录 · 访问令牌 =================
   为什么不用 OAuth 弹窗：github.com 的 /login/device/code 与
   /login/oauth/access_token 都不返回 Access-Control-Allow-Origin，
   浏览器里无法跨域换取 token；而 api.github.com 允许跨域。
   因此这里让用户自带一个最小权限的访问令牌（BYOA）。

   安全约束：
   1. 令牌只存在本模块闭包变量里，不写 localStorage / cookie / 网址参数；
   2. 只与 https://api.github.com 通信，不经过任何第三方代理；
   3. 错误提示里不回显令牌内容；
   4. 刷新页面即失效，退出登录立即清空。                              */
const GH_API='https://api.github.com';
const GH_ACCOUNT_ID='github-live';
const DEMO_REPOS=REPOS.map(r=>Object.assign({},r));

let GH_TOKEN='';

function ghTokenFormatOk(t){
  return /^[A-Za-z0-9_]{20,255}$/.test(String(t||'').trim());
}

async function ghGet(path,token){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),20000);
  try{
    const res=await fetch(GH_API+path,{
      headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},
      signal:ctl.signal,cache:'no-store'
    });
    if(res.status===401)throw new Error('令牌无效或已过期（HTTP 401），请重新生成');
    if(res.status===403)throw new Error('令牌权限不足或已触发速率限制（HTTP 403）');
    if(!res.ok)throw new Error('GitHub 接口返回 HTTP '+res.status);
    return await res.json();
  }catch(err){
    if(err.name==='AbortError')throw new Error('连接 GitHub 超时，请检查网络后重试');
    if(err instanceof TypeError)throw new Error('无法连接 api.github.com，请检查网络或代理设置');
    throw err;
  }finally{clearTimeout(timer);}
}

function ghKindOf(language){
  const l=String(language||'');
  if(/C\+\+|C#|Assembly|Rust|Verilog|CMake/.test(l)||l==='C')return 'fw';
  if(/HTML|CSS|JavaScript|TypeScript|Vue|Svelte/.test(l))return 'web';
  if(/Python|Shell|Batchfile|PowerShell/.test(l))return 'tool';
  return 'tool';
}

/* GitHub REST /user/repos 的单条记录 → 本工具的仓库卡片模型 */
function ghRepoToLocal(r){
  const mb=Math.max(.05,(Number(r.size)||0)/1024);
  return {
    id:'gh-'+r.id,name:r.name,group:r.language||'未分类',remote:r.full_name,
    branch:r.default_branch||'main',
    date:String(r.pushed_at||r.updated_at||'').slice(0,10),
    msg:r.description||'（该仓库没有简介）',
    size:mb>=1?mb.toFixed(1)+' MB':Math.max(1,Math.round(mb*1024))+' KB',sizeMB:mb,
    files:0,branches:1,attrs:false,kind:ghKindOf(r.language),live:true,
    demo:{dirty:0,ahead:0,pr:0}
  };
}

/* 检索数据源：演示模式用内置索引；真实登录后直接用当前仓库列表，
   避免搜索仍停留在示例数据上。 */
function searchSource(){
  if(!S.live&&!S.local)return SEARCH_INDEX;
  const user=(S.accounts[0]&&S.accounts[0].user)||'本地';
  return REPOS.map(r=>({repo:r.name,sha:'—',msg:r.msg,branch:r.branch,author:user,date:r.date,real:true,github:S.live,local:S.local}));
}

function renderLiveNote(){
  const el=$('#liveNote');if(!el)return;
  const on=S.live||S.local;
  el.style.display=on?'flex':'none';
  if(on){
    const b=el.querySelector('b'),s=el.querySelector('span');
    if(S.local){
      if(b)b.textContent='已扫描本地文件夹（只读）';
      if(s)s.textContent='仓库列表来自你选择的文件夹（读取 .git 文本）；脏工作区、未推送提交需要真正运行 git，因此显示 0，写操作仍为模拟。';
    }else{
      if(b)b.textContent='已连接远端（只读）';
      if(s)s.textContent='仓库列表为实时数据；提交历史、CI、通知、推送记录与平台同步仍为内置示例，不会改动任何仓库。';
    }
  }
}

function applyLiveSession(platform,user,repos){
  const gh=platform==='github';
  const id=gh?GH_ACCOUNT_ID:GITEE_ACCOUNT_ID;
  const login=user.login||user.name||'unknown';
  S.demo=false;S.live=true;S.local=false;S.localName='';
  const acct={id:id,platform:platform,host:gh?'github.com':'gitee.com',user:login,
    label:(gh?'GitHub · ':'Gitee · ')+login,state:'active',
    scopes:[gh?'repo（按令牌授权范围）':'projects（按令牌授权范围）'],
    color:gh?'#6C63FF':'#C71D23',short:gh?'GH':'GE',
    exp:'随令牌失效',store:'仅本页内存 · 刷新即失效',avatar:user.avatar_url||''};
  S.accounts=[acct];
  S.activeAccount=id;S.authed=true;S.authMode=platform;
  ACCOUNT_REPOS[id]=repos.map(r=>r.id);
  REPOS.length=0;repos.forEach(r=>REPOS.push(r));
  S.removedRepos.clear();S.selected.clear();S.repoLimit=PAGE_SIZE;
}
function applyGitHubSession(user,repos){applyLiveSession('github',user,repos);}

/* Gitee：OAuth 端点同样不支持跨域，但开放 API 允许跨域（ACAO *），
   因此同样使用用户自带的私人令牌。Gitee API 只接受 access_token 查询参数，
   令牌随 HTTPS 请求发往 gitee.com，不进入页面地址栏、不落盘。 */
const GITEE_API='https://gitee.com/api/v5';
const GITEE_ACCOUNT_ID='gitee-live';
let GITEE_TOKEN='';

async function giteeGet(path,token){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),20000);
  const sep=path.includes('?')?'&':'?';
  try{
    const res=await fetch(GITEE_API+path+sep+'access_token='+encodeURIComponent(token),{
      headers:{'Accept':'application/json'},signal:ctl.signal,cache:'no-store'});
    if(res.status===401)throw new Error('Gitee 令牌无效或已过期（HTTP 401），请重新生成');
    if(res.status===403)throw new Error('令牌权限不足或触发频率限制（HTTP 403）');
    if(!res.ok)throw new Error('Gitee 接口返回 HTTP '+res.status);
    return await res.json();
  }catch(err){
    if(err.name==='AbortError')throw new Error('连接 Gitee 超时，请检查网络后重试');
    if(err instanceof TypeError)throw new Error('无法连接 gitee.com，请检查网络或代理设置');
    throw err;
  }finally{clearTimeout(timer);}
}

function giteeRepoToLocal(r){
  const mb=Math.max(.05,(Number(r.size)||0)/1024);
  return {
    id:'ge-'+r.id,name:r.name,group:r.language||'未分类',remote:r.full_name||r.path||r.name,
    branch:r.default_branch||'master',
    date:String(r.pushed_at||r.updated_at||r.created_at||'').slice(0,10),
    msg:r.description||'（该仓库没有简介）',
    size:mb>=1?mb.toFixed(1)+' MB':Math.max(1,Math.round(mb*1024))+' KB',sizeMB:mb,
    files:0,branches:1,attrs:false,kind:ghKindOf(r.language),live:true,
    demo:{dirty:0,ahead:0,pr:0}
  };
}

async function giteeLogin(rawToken){
  const token=String(rawToken||'').trim();
  if(!ghTokenFormatOk(token))throw new Error('令牌格式不正确：Gitee 私人令牌应为 32 位以上的字母、数字或下划线组合');
  const user=await giteeGet('/user',token);
  const list=await giteeGet('/user/repos?per_page=100&sort=updated&visibility=all',token);
  const repos=(Array.isArray(list)?list:[]).map(giteeRepoToLocal);
  GITEE_TOKEN=token;
  applyLiveSession('gitee',user,repos);
  hideGate();showPatPanel(false);renderAccountCards();renderSideAccount();renderAll();renderDemoState();renderLiveNote();rerenderRendered();
  toast('已连接 Gitee <b>@'+esc(user.login||user.name||'')+'</b>，读取到 '+repos.length+' 个仓库；令牌只保存在本页内存。','success');
  return {user,repos};
}

async function githubLogin(rawToken){
  const token=String(rawToken||'').trim();
  if(!ghTokenFormatOk(token))throw new Error('令牌格式不正确：应为 20 位以上的字母、数字或下划线组合');
  const user=await ghGet('/user',token);
  const list=await ghGet('/user/repos?per_page=100&affiliation=owner&sort=updated',token);
  const repos=(Array.isArray(list)?list:[]).map(ghRepoToLocal);
  GH_TOKEN=token;                       // 校验通过后才保留
  applyGitHubSession(user,repos);
  hideGate();showPatPanel(false);renderAccountCards();renderSideAccount();renderAll();renderDemoState();renderLiveNote();rerenderRendered();
  toast('已连接 GitHub <b>@'+esc(user.login||'')+'</b>，读取到 '+repos.length+' 个仓库；令牌只保存在本页内存。','success');
  return {user,repos};
}

function githubLogout(){
  GH_TOKEN='';GITEE_TOKEN='';LOCAL_DIR_HANDLE=null;
  S.live=false;S.local=false;S.localName='';
  delete ACCOUNT_REPOS[GH_ACCOUNT_ID];
  delete ACCOUNT_REPOS[GITEE_ACCOUNT_ID];
  REPOS.length=0;DEMO_REPOS.forEach(r=>REPOS.push(Object.assign({},r)));
}

/* 同步按钮：真实连接下重新拉取仓库列表（只读），不是本地 git fetch */
async function refreshLiveRepos(){
  if(!S.live)return 0;
  const ge=S.accounts[0]&&S.accounts[0].platform==='gitee';
  const token=ge?GITEE_TOKEN:GH_TOKEN;
  if(!token)throw new Error('令牌已失效，请退出后重新连接');
  const list=await (ge
    ?giteeGet('/user/repos?per_page=100&sort=updated&visibility=all',token)
    :ghGet('/user/repos?per_page=100&affiliation=owner&sort=updated',token));
  const repos=(Array.isArray(list)?list:[]).map(ge?giteeRepoToLocal:ghRepoToLocal);
  REPOS.length=0;repos.forEach(r=>REPOS.push(r));
  ACCOUNT_REPOS[S.activeAccount]=repos.map(r=>r.id);
  S.selected.clear();
  renderAll();renderSideAccount();renderDemoState();rerenderRendered();
  return repos.length;
}

function enterDemoMode(){
  S.demo=true;S.live=false;S.local=false;S.localName='';
  const acct={id:'demo-mode',platform:'demo',host:'示例数据',user:'演示模式',label:'演示数据（中性示例）',
    state:'active',scopes:['只读示例'],color:'#2E9E96',short:'DM',exp:'不适用',store:'不保存凭据'};
  S.accounts=[acct];
  S.activeAccount='demo-mode';S.authed=true;S.authMode='demo';
  ACCOUNT_REPOS['demo-mode']=REPOS.map(r=>r.id);
  hideGate();renderAccountCards();renderSideAccount();renderAll();renderDemoState();renderLiveNote();rerenderRendered();
  toast('已进入演示模式：以下为中性示例数据，不是你的账号，也不会读取任何远端仓库。','warn');
}

function renderPatHint(){
  const ge=S.patPlatform==='gitee';
  const title=$('#gatePatTitle'),input=$('#gatePatInput'),hint=$('#gatePatHint');
  if(title)title.textContent=ge?'粘贴 Gitee 私人令牌（仅保存在本页内存）':'粘贴 GitHub 访问令牌（仅保存在本页内存）';
  if(input)input.placeholder=ge?'Gitee 私人令牌（32 位以上字符）':'ghp_… 或 github_pat_…';
  if(hint)hint.innerHTML=ge
    ?'在 Gitee → 设置 → <a href="https://gitee.com/personal_access_tokens" target="_blank" rel="noopener noreferrer">私人令牌</a> 生成，只勾选 <b>projects</b> 权限即可。令牌随 HTTPS 只发往 gitee.com。'
    :'在 GitHub → Settings → Developer settings → <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer">Fine-grained tokens</a> 新建，只勾选 <b>Contents: Read</b> 与目标仓库即可。令牌不会离开本页。';
}

function showPatPanel(on,platform){
  const panel=$('#gatePat');if(!panel)return;
  if(platform)S.patPlatform=platform;
  if(on)showGate();
  panel.style.display=on?'block':'none';
  if(on){
    renderPatHint();setPatStatus('');
    const input=$('#gatePatInput');
    if(input)setTimeout(()=>input.focus(),50);
  }
}

function setPatStatus(msg,kind){
  const el=$('#gatePatStatus');if(!el)return;
  el.textContent=msg||'';
  el.className='gate-status'+(kind?' '+kind:'');
}

async function submitPat(){
  const input=$('#gatePatInput'),btn=$('#gatePatSubmit');
  if(!input||!btn)return;
  const token=input.value.trim();
  if(!token){setPatStatus('请先粘贴访问令牌','err');return;}
  btn.disabled=true;setPatStatus('正在校验令牌并读取仓库列表…');
  try{
    if(S.patPlatform==='gitee')await giteeLogin(token);
    else await githubLogin(token);
    input.value='';
  }catch(err){
    setPatStatus(err.message||'登录失败','err');
  }finally{
    btn.disabled=false;
  }
}
