/* ================= 交互 ================= */
const VIEW_NAME={dashboard:'全局驾驶舱',workbench:'提交工作台',search:'全局检索',rewrite:'历史与删除',clean:'删减与清理',commit:'提交辅助',ci:'CI 与钩子',cluster:'项目集群',inbox:'通知中心',platforms:'平台与同步',accounts:'账号与授权',stats:'开发数据',gaps:'功能缺口',plans:'模块规划'};
function setView(v){
  const changed=S.view!==v;
  S.view=v; ensureView(v); mountAboutCard(v); $$('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('#crumbText').textContent=VIEW_NAME[v]; $('.scroll').scrollTop=0; writeHash(changed);
}
$$('.nav-item').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$$('[data-theme-set]').forEach(b=>b.onclick=()=>applyTheme(b.dataset.themeSet));
/* 数据来源切换的界面部分单独抽出，供浏览器前进/后退恢复状态时复用 */
function renderDemoState(){
  $('#segDemo').classList.toggle('on',S.demo); $('#segReal').classList.toggle('on',!S.demo);
  $('#snapshotText').textContent=S.live
    ? 'GitHub 实时快照 · '+REPOS.length+' 个仓库 · 只读'
    : S.demo?'演示态 · 模拟脏工作区 / 未推送 / PR 数据 · 2026-11-06':'实测快照 · 2026-11-06 14:37 · '+REPOS.length+' 个仓库';
  $('#timelineNote').innerHTML=S.live
    ? '数据来自 GitHub REST API（只读）：脏工作区、未推送提交与 PR 数量需要本机 git 才能得知，因此统一显示 0；推送 / 删除等写操作在原型里仍为模拟。'
    : S.demo
    ? '当前为<b>演示态</b>：脏工作区、未推送提交与 PR 数量为模拟值，用于验证筛选器、卡片状态与批量操作栏的界面表现；不是本机真实 Git 状态。'
    : '本机 6 个仓库全部处于 <b>clean</b> 状态且仅有 main 分支，因此「未提交变更 / 未推送 / 分支差异」三类卡片数据均为 0。切换「演示态」可查看这些状态出现时的界面表现。';
}
function setDemo(on){
  S.demo=on;renderDemoState();
  S.selected.clear(); rerenderRendered(); renderSideAccount(); save(); writeHash(false);
}
$('#segDemo').onclick=()=>setDemo(true);
$('#segReal').onclick=()=>setDemo(false);
$('#syncBtn').onclick=()=>{
  if($('.scroll').classList.contains('syncing'))return;
  setSyncing(true);
  setTimeout(()=>{setSyncing(false);toast('已刷新 6 个仓库的本地状态（原型演示，未执行真实 Git 命令）。','success');},900);
};
/* 搜索：仅当关键词真正变化时才重建仓库网格；下拉本身始终即时更新 */
$('#searchInput').oninput=e=>{
  const q=e.target.value.trim().toLowerCase();
  if(q!==S.q){S.q=q;S.repoLimit=PAGE_SIZE;S.sdSel=-1;renderRepos();}
  renderSearchDrop();
};
$('#searchInput').onkeydown=e=>{
  const open=$('#searchDrop').classList.contains('show');
  if(e.key==='ArrowDown'&&open){e.preventDefault();moveSearchSel(1);return;}
  if(e.key==='ArrowUp'&&open){e.preventDefault();moveSearchSel(-1);return;}
  if(e.key==='Escape'){$('#searchDrop').classList.remove('show');S.sdSel=-1;return;}
  if(e.key==='Enter'){
    if(open&&S.sdSel>=0){e.preventDefault();activateSearchItem(S.sdSel);return;}
    $('#searchDrop').classList.remove('show');setView('search');$('#searchQ').value=e.target.value;renderSearch();
  }
};
$('#searchInput').onblur=()=>setTimeout(()=>{$('#searchDrop').classList.remove('show');S.sdSel=-1;},160);
$('#batchClose').onclick=clearSelection;
$('#batchAll').onclick=selectVisibleAll;
$('#batchClear').onclick=clearSelection;
$('#tlRepo').onchange=renderTimeline;
$('#insightClean').onclick=()=>setView('clean');
$('#insightCommit').onclick=()=>setView('commit');
$('#ciToGaps').onclick=()=>setView('gaps');
$('#wbToCommit').onclick=()=>setView('commit');
$('#wbDesc').oninput=renderWbButtons;
$('#wbRunHooks').onclick=()=>runHooks(false);
$('#wbFix').onclick=()=>{W.fixed=true;runHooks(true);toast('已模拟修复 adc.c:42 未初始化变量，重跑 7/7 通过。','success');};
$('#wbCommit').onclick=()=>doCommit(false);
$('#wbPush').onclick=()=>doCommit(true);
$('#btnCopyDelete').onclick=()=>copyText($('#deleteCmd').textContent,' 删除命令');
$('#btnExecuteDelete').onclick=()=>toast('原型演示：未执行任何历史写操作。真机版本需显式授权、bundle 备份与 --force-with-lease。','warn');
$('#btnCopyCfg').onclick=()=>copyText(CFG[W.cfgKey](),' 配置文件内容');
$('#btnDownloadCfg').onclick=downloadCfg;
$('#btnCopySync').onclick=()=>copyText($('#syncCmd').textContent,' 同步命令');
$('#btnRunSync').onclick=()=>{S.syncRan=true;renderSyncResults();toast('逐远端同步完成：结果按平台分别记录。','success');};
$('#btnCopyPerf').onclick=()=>copyText(perfCommand(),' 性能配置命令');
$('#btnStartAuth').onclick=()=>{S.wizardStep=0;renderWizard();toast('登录向导用于展示 OAuth 流程；本页的真实连接使用访问令牌。','success');};
$('#btnNextStep').onclick=()=>{S.wizardStep++;renderWizard();if(S.wizardStep>=AUTH_STEPS.length)finishAuth();};
$('#wizPlatform').onchange=renderByoaUrl;
$('#byoaClientId').oninput=renderByoaUrl;
$('#byoaRedirect').oninput=renderByoaUrl;
$('#btnRescan').onclick=()=>{renderPII(scanPII());toast('已重新扫描当前页面。','success');};
$('#btnExportPrefs').onclick=()=>{const txt=exportPrefs();$('#prefsPreview').textContent=txt;
  const blob=new Blob([txt],{type:'application/json;charset=utf-8'});const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='repoflow-preferences.json';document.body.appendChild(a);a.click();
  document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
  toast('已导出偏好（不含令牌）。','success');};
$('#btnImportPrefs').onclick=()=>$('#importFile').click();
$('#importFile').onchange=function(e){const f=e.target.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=function(){try{const d=importPrefs(rd.result);$('#prefsPreview').textContent=rd.result;
    toast('已导入偏好：'+esc(d.view||'当前视图'),'success');}catch(err){toast('导入失败：'+esc(err.message),'warn');}};
  rd.readAsText(f);e.target.value='';};
$('#bellBtn').onclick=()=>setView('inbox');
$('#inboxReadAll').onclick=()=>{activeNotices().forEach(n=>S.read.add(n.id));renderBell();renderInbox();};
$('#helpBtn').onclick=openHelp;
$('#helpClose').onclick=closeHelp;
$('#searchQ').oninput=renderSearch;
$('#searchRepo').onchange=e=>{S.searchRepo=e.target.value;renderSearch();};
$('#searchRange').onchange=e=>{S.searchRange=e.target.value;renderSearch();};
$('#searchClear').onclick=()=>{$('#searchQ').value='';S.searchRepo='all';S.searchRange='all';$('#searchRepo').value='all';$('#searchRange').value='all';renderSearch();};
$('#btnSnapshot').onclick=()=>{const name=$('#snapName').value.trim();const snap=makeSnapshot(name,S.snapshots.length);snap.time=new Date().toLocaleString('zh-CN',{hour12:false});S.snapshots.unshift(snap);renderCluster();toast('已生成快照 '+esc(snap.id)+'（内存态）。','success');};
$$('.nav-label').forEach(el=>el.onclick=()=>{const g=el.closest('.nav-group').dataset.group;S.collapsed.has(g)?S.collapsed.delete(g):S.collapsed.add(g);applyCollapsed();save();});
$('#cmdkBtn').onclick=openCmdk;
$('#cmdkInput').oninput=()=>{S.cmdSel=0;renderCmdk();};
$('#mask').onclick=()=>{if(S.cmdk)closeCmdk();else if(S.help)closeHelp();else if(S.drawer)closeDrawer();};
$('#drawerClose').onclick=closeDrawer;
$('#selectAllFiles').onclick=()=>{
  BIGFILES.forEach((f,i)=>{if(f.a.includes('LFS'))S.picked.add(i);});
  renderBigFiles();
};
$('#cbxAll').onchange=e=>{S.picked=e.target.checked?new Set(BIGFILES.map((_,i)=>i)):new Set();renderBigFiles();};
$('#btnGenRules').onclick=()=>{const p=updateLfsPlan();copyText(lfsCommand(p),' LFS 规则与命令');};
$('#btnCopyCmd').onclick=()=>copyText(lfsCommand(updateLfsPlan()),' 命令序列');
$('#btnCopyCommit').onclick=()=>copyText(buildCommit(commitState()),' 提交信息');
$('#btnResetCommit').onclick=()=>{
  C.type='feat';$('#cmtScope').value='';$('#cmtDesc').value='';$('#cmtBody').value='';$('#cmtIssue').value='';$('#cmtBreak').checked=false;
  renderCommitInit();toast('提交表单已重置。','success');
};
['#cmtScope','#cmtDesc','#cmtBody','#cmtIssue'].forEach(sel=>$(sel).oninput=renderCommit);
$('#cmtBreak').onchange=renderCommit;
$('#cmtRepo').onchange=e=>{C.repo=e.target.value;};
document.addEventListener('keydown',e=>{
  const inField=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();S.cmdk?closeCmdk():openCmdk();return;}
  if(e.key==='Escape'){
    if(S.cmdk)closeCmdk();
    else if(S.help)closeHelp();
    else if($('#searchDrop').classList.contains('show')){$('#searchDrop').classList.remove('show');S.sdSel=-1;}
    else if(S.drawer)closeDrawer();
    return;
  }
  if(e.key==='?'&&!inField){e.preventDefault();S.help?closeHelp():openHelp();return;}
  if((e.key==='t'||e.key==='T')&&!inField&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!S.cmdk&&!S.help&&!S.drawer){
    e.preventDefault();toggleTheme();return;
  }
  if(S.cmdk){
    if(e.key==='ArrowDown'){e.preventDefault();S.cmdSel=Math.min(S.cmdSel+1,S.cmdList.length-1);renderCmdk();}
    else if(e.key==='ArrowUp'){e.preventDefault();S.cmdSel=Math.max(0,S.cmdSel-1);renderCmdk();}
    else if(e.key==='Enter'){e.preventDefault();execCmd();}
    return;
  }
  if(e.key==='/'&&!inField){e.preventDefault();$('#searchInput').focus();}
});
document.addEventListener('click',e=>{
  const copy=e.target.closest('[data-copy]');
  if(copy){copyText(copy.dataset.copy,' 内容');return;}
  const task=e.target.closest('[data-batch]');
  if(task){openTasks(task.dataset.batch);return;}
  if(e.target.closest('#btnMarks')){openMarkEditor();return;}
  if(e.target.closest('[data-about]')){openAbout();return;}
  const lg=e.target.closest('[data-login]');
  if(lg){
    const v=lg.dataset.login;
    if(v==='github'){showPatPanel(true);return;}
    if(v==='demo'){enterDemoMode();return;}
    if(v==='local'){enterLocalMode();return;}
    toast('Gitee 真实登录尚未接入：Gitee 的 OAuth 同样需要后端换取 token。可先用 GitHub 访问令牌或演示数据。','warn');
    return;
  }
  if(e.target.closest('#gatePatSubmit')){submitPat();return;}
  if(e.target.closest('#gatePatCancel')){showPatPanel(false);return;}
  if(e.target.closest('#btnLogout')){logoutAll();return;}
  const mk=e.target.closest('[data-markrepo]');
  if(mk){openMarkEditor(mk.dataset.markrepo);return;}
  if(e.target.closest('#drawerToClean')){closeDrawer();setView('clean');return;}
  if(e.target.closest('#btnRunTasks')){runTasks(false);return;}
  if(e.target.closest('#btnCloseTasks')){closeDrawer();return;}
  if(e.target.closest('#btnUndo')){undoTasks();return;}
  const b=e.target.closest('[data-action]');
  if(b)toast('原型演示：未执行「<b>'+esc(b.dataset.action)+'</b>」。该操作在真机版本需要显式确认与可回滚备份。','warn');
});
function renderAll(){renderKPI();renderChips();renderRepos();renderBatch();}
const patInput=$('#gatePatInput');
if(patInput)patInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitPat();}});
function toast(msg,kind){
  const t=$('#toast'); t.innerHTML=msg; t.className='toast show'+(kind?' '+kind:'');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}
readHash();
renderTimelineInit();
$('#searchRepo').innerHTML='<option value="all">全部仓库</option>'+[...new Set(SEARCH_INDEX.map(x=>x.repo))].map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
$('#searchRepo').dataset.sig=[...new Set(SEARCH_INDEX.map(x=>x.repo))].join('\u0001');
applyLive();
renderHelp();renderBell();renderSideAccount();bindRepoGrid();
ensureView(S.view);setView(S.view);
if(!location.search.includes('selftest')){readHash();
  const saved=load();
  const urlTheme=new URLSearchParams(location.search).get('theme');
  if(urlTheme&&THEMES.indexOf(urlTheme)>=0)applyTheme(urlTheme,true);
  else if(saved.theme)applyTheme(saved.theme);
  else applyTheme(S.theme);
  if(Array.isArray(saved.collapsed)){S.collapsed=new Set(saved.collapsed);applyCollapsed();}
  if(Array.isArray(saved.recent))S.cmdRecent=saved.recent;
  /* 分享链接里的视图/筛选/演示态优先；只有直接打开首页才恢复上次偏好 */
  if(!BOOT_HASH){
    if(saved.demo===true)setDemo(true);
    if(saved.filter&&FILTERS.some(f=>f.k===saved.filter)){S.filter=saved.filter;renderChips();renderRepos();writeHash(false);}
  }
}
bootstrapEdition();

