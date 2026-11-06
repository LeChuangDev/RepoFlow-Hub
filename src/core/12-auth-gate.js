/* ================= v9 · 登录门与构建形态 =================
   web     默认没有任何账号，必须自己登录（GitHub / Gitee / 本地离线模式）
   desktop 离线 Windows 版，自动进入本地模式，不显示登录门、不连接网站
   dev     本机开发副本，载入中性演示账号便于预览
   登录是确定性模拟：不发起网络请求、不读取或存储任何真实凭据。       */
function showGate(){
  const g=$('#loginGate');if(!g)return;
  g.style.display='grid';
  const note=$('#gateEdition');
  if(note)note.textContent=EDITION==='web'?'网站版 · 凭据只存本机，不经过站点':EDITION==='desktop'?'离线 Windows 版':'开发副本';
}
function hideGate(){const g=$('#loginGate');if(g)g.style.display='none';}
function loginAs(templateId){
  const tpl=ACCOUNTS.find(a=>a.id===templateId);
  if(!tpl)return null;
  let a=S.accounts.find(x=>x.id===templateId);
  if(!a){a=Object.assign({},tpl);S.accounts.push(a);}
  a.state='active';a.user='已登录账号';a.store='keychain://repoflow/'+templateId;
  a.exp='按平台策略自动刷新';
  S.activeAccount=a.id;S.authed=true;S.authMode=tpl.platform;
  hideGate();renderAccountCards();renderSideAccount();renderAll();rerenderRendered();
  toast('已登录 '+(tpl.platform==='github'?'GitHub':'Gitee')+'（模拟，未发起网络请求）。','success');
  return a;
}
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
  S.accounts=[];S.activeAccount='';S.authed=false;S.authMode='';
  renderAccountCards();renderSideAccount();renderAll();
  toast('已退出登录，本机关联记录已清除。','warn');
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
