/* ================= v9 · 登录门与构建形态 =================
   web     默认没有任何账号，必须自己连接（GitHub 访问令牌 / 演示数据）
   desktop 离线 Windows 版，自动进入本地模式，不显示登录门、不连接网站
   dev     本机开发副本，载入中性演示账号便于预览
   GitHub 真实登录见 12b-github-auth.js：令牌只存页面内存。
   推送、删除等写操作仍是原型模拟，不执行任何 Git 写操作。            */
function showGate(){
  const g=$('#loginGate');if(!g)return;
  g.style.display='grid';
  const note=$('#gateEdition');
  if(note)note.textContent=EDITION==='web'?'网站版 · 访问令牌只存本页内存':EDITION==='desktop'?'离线 Windows 版':'开发副本';
}
function hideGate(){const g=$('#loginGate');if(g)g.style.display='none';}
function enterLocalMode(){
  const id='local-offline';
  if(!S.accounts.some(a=>a.id===id))S.accounts.unshift({
    id:id,platform:'local',host:'本机',user:'本地文件',label:'本地离线模式',state:'active',
    scopes:['本地只读'],color:'#2E9E96',short:'LO',exp:'不适用',store:'不保存凭据'
  });
  S.activeAccount=id;S.authed=true;S.authMode='local';
  hideGate();renderAccountCards();renderSideAccount();renderAll();
  const nav=document.querySelector('[data-view="accounts"] span');
  if(nav)nav.textContent='关于离线版';
}
function logoutAll(){
  githubLogout();
  S.accounts=[];S.activeAccount='';S.authed=false;S.authMode='';
  renderAccountCards();renderSideAccount();renderAll();renderDemoState();renderLiveNote();
  toast('已退出登录，令牌与账号信息已从本页清除。','warn');
  if(EDITION==='web')showGate();
}
function bootstrapEdition(){
  const noGate=location.search.includes('selftest')||location.search.includes('gate=off');
  if(EDITION==='desktop'){enterLocalMode();return;}
  if(EDITION==='web'&&!noGate&&!S.authed){showGate();return;}
  if(EDITION==='dev'&&!noGate){
    S.accounts=ACCOUNTS.map(a=>Object.assign({},a,{state:'active',user:'已登录账号',store:'keychain://repoflow/'+a.id}));
    S.activeAccount='github-primary';S.authed=true;
    renderSideAccount();
  }
}
