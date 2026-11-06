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

function applyGitHubSession(user,repos){
  S.demo=false;S.live=true;
  const acct={id:GH_ACCOUNT_ID,platform:'github',host:'github.com',user:user.login||'unknown',
    label:'GitHub · '+(user.login||'unknown'),state:'active',
    scopes:['repo（按令牌授权范围）'],color:'#6C63FF',short:'GH',
    exp:'随令牌失效',store:'仅本页内存 · 刷新即失效',avatar:user.avatar_url||''};
  S.accounts=[acct];
  S.activeAccount=GH_ACCOUNT_ID;S.authed=true;S.authMode='github';
  ACCOUNT_REPOS[GH_ACCOUNT_ID]=repos.map(r=>r.id);
  REPOS.length=0;repos.forEach(r=>REPOS.push(r));
  S.removedRepos.clear();S.selected.clear();S.repoLimit=PAGE_SIZE;
}

async function githubLogin(rawToken){
  const token=String(rawToken||'').trim();
  if(!ghTokenFormatOk(token))throw new Error('令牌格式不正确：应为 20 位以上的字母、数字或下划线组合');
  const user=await ghGet('/user',token);
  const list=await ghGet('/user/repos?per_page=100&affiliation=owner&sort=updated',token);
  const repos=(Array.isArray(list)?list:[]).map(ghRepoToLocal);
  GH_TOKEN=token;                       // 校验通过后才保留
  applyGitHubSession(user,repos);
  hideGate();showPatPanel(false);renderAccountCards();renderSideAccount();renderAll();renderDemoState();rerenderRendered();
  toast('已连接 GitHub <b>@'+esc(user.login||'')+'</b>，读取到 '+repos.length+' 个仓库；令牌只保存在本页内存。','success');
  return {user,repos};
}

function githubLogout(){
  GH_TOKEN='';
  S.live=false;
  delete ACCOUNT_REPOS[GH_ACCOUNT_ID];
  REPOS.length=0;DEMO_REPOS.forEach(r=>REPOS.push(Object.assign({},r)));
}

function enterDemoMode(){
  S.demo=true;S.live=false;
  const acct={id:'demo-mode',platform:'demo',host:'示例数据',user:'演示模式',label:'演示数据（中性示例）',
    state:'active',scopes:['只读示例'],color:'#2E9E96',short:'DM',exp:'不适用',store:'不保存凭据'};
  S.accounts=[acct];
  S.activeAccount='demo-mode';S.authed=true;S.authMode='demo';
  ACCOUNT_REPOS['demo-mode']=REPOS.map(r=>r.id);
  hideGate();renderAccountCards();renderSideAccount();renderAll();renderDemoState();rerenderRendered();
  toast('已进入演示模式：以下为中性示例数据，不是你的账号，也不会读取任何远端仓库。','warn');
}

function showPatPanel(on){
  const panel=$('#gatePat');if(!panel)return;
  if(on)showGate();
  panel.style.display=on?'block':'none';
  if(on){
    setPatStatus('');
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
    await githubLogin(token);
    input.value='';
  }catch(err){
    setPatStatus(err.message||'登录失败','err');
  }finally{
    btn.disabled=false;
  }
}
