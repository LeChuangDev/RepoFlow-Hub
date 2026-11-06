/* ================= v5 · 平台与同步 ================= */
function renderPlatforms(){
  $('#platformCards').innerHTML=PLATFORMS.map(p=>`<div class="plat-card" style="margin-bottom:var(--s3)">
    <span class="plat-logo" style="background:${p.color}">${p.short}</span>
    <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:13.5px">${p.n}</b>
      <span class="tag ${p.connected?'t-clean':'t-grey'}">${p.connected?'已连接':'未绑定'}</span></div>
      <div style="font-size:11px;color:var(--text-2);margin-top:4px">${esc(p.host)} · ${esc(p.account)} · ${p.repos} 个仓库</div>
      <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">${esc(p.scope)}</div></div></div>`).join('');
  const counts={待令牌读取:0,私有:0,公开:0};
  REPOS.forEach(r=>counts[visibilityOf(r).t]++);
  $('#visibilityBox').innerHTML=`<div class="metric-list" style="margin-top:0">
    <div class="metric"><span>公开库（演示态）</span><b>${counts.公开}</b></div>
    <div class="metric"><span>私有库（演示态）</span><b>${counts.私有}</b></div>
    <div class="metric"><span>可见性待 API 读取</span><b>${counts.待令牌读取}</b></div></div>
    <div class="quote" style="margin-top:var(--s3)">本机没有令牌，无法从 API 判定可见性，实测态统一标「待令牌读取」，不猜测。私有库走细粒度令牌（限定仓库 + Contents 读写 + 30–90 天过期）并存入系统密钥链；遇到 404 提示「可能权限不足」而不是「仓库不存在」。竞品免费版仅支持公开库，本项目不按可见性设限。</div>`;
  renderStrategies();
  renderRemoteMatrix();
  renderSyncResults();
}
function renderStrategies(){
  $('#strategyList').innerHTML=SYNC_STRATEGIES.map(x=>`<label class="strategy ${x.k===S.strategy?'on':''}" data-str="${x.k}">
    <span class="radio"></span><span style="flex:1"><span class="mode-title">${x.n} <span class="tag ${x.cls}" style="margin-left:6px">${x.lvl}</span>
    <span class="src-tag" style="margin-left:6px">${esc(x.src)}</span></span>
    <span class="mode-sub" style="display:block"><b style="color:var(--green)">适用：</b>${esc(x.pro)}</span>
    <span class="mode-sub" style="display:block"><b style="color:var(--amber)">限制：</b>${esc(x.con)}</span></span></label>`).join('');
  $$('[data-str]').forEach(el=>el.onclick=()=>{S.strategy=el.dataset.str;renderStrategies();});
  const cur=SYNC_STRATEGIES.find(x=>x.k===S.strategy);
  $('#syncCmd').textContent=cur.cmd;
}
function renderRemoteMatrix(){
  $('#remoteBody').innerHTML=REPOS.map(r=>{
    const st=SYNC_STATES[syncStateOf(r)],v=visibilityOf(r);
    const hasGitee=S.demo&&syncStateOf(r)!=='single'&&syncStateOf(r)!=='none';
    return `<tr><td><div class="fname">${esc(r.name)}</div></td>
      <td><span class="tag ${v.cls}">${v.t}</span></td>
      <td><span class="lvl lvl-ok">已配置</span></td>
      <td>${hasGitee?'<span class="lvl lvl-ok">已配置</span>':'<span class="lvl lvl-warn">未配置</span>'}</td>
      <td><span class="tag ${st.cls}">${st.t}</span></td></tr>`;
  }).join('');
  const div=REPOS.filter(r=>syncStateOf(r)==='diverged').length;
  $('#remoteCount').textContent=REPOS.length+' 个仓库'+(div?' · '+div+' 个分叉':'');
}
function renderSyncResults(){
  const rows=syncResults(),failed=rows.filter(x=>!x.ok);
  $('#syncResults').innerHTML=S.syncRan?rows.map(x=>`<div class="sync-row">
    <span class="hook-dot ${x.ok?'pass':'fail'}"></span><b style="min-width:64px">${x.p}</b>
    <span class="tag ${x.ok?'t-clean':'t-red'}">${x.ok?'成功':'失败'}</span>
    <span class="task-log">${esc(x.log)}</span><span style="font-size:10.5px;color:var(--text-3)">${x.ms}</span></div>`).join('')
    :'<div class="section-desc">尚未执行。点击「模拟逐远端同步」查看每个远端独立的状态与错误定位。</div>';
  $('#syncRetryRow').innerHTML=S.syncRan&&failed.length?`<button class="btn btn-ghost" id="btnRetryFailed">仅重试失败远端（${failed.length}）</button>
    <span class="count-note">退避后重试，不重发已成功的远端</span>`:'';
  if($('#btnRetryFailed'))$('#btnRetryFailed').onclick=()=>toast('仅对失败远端重试；已成功的 GitHub 不重复发送。','success');
}

/* ================= v5 · 性能体检 / 调研表 ================= */
function renderPerf(){
  $('#perfGitVer').textContent=GIT_VER;
  const mids=PERF.map(x=>x.ms),total=Math.round(mids.reduce((a,b)=>a+b,0)*10)/10;
  $('#perfSummary').textContent='串行合计 ≈ '+total+' ms';
  $('#perfBody').innerHTML=PERF.map(x=>{
    const r=REPOS.find(y=>y.id===x.id)||{name:x.id};
    return `<tr><td><div class="fname">${esc(r.name)}</div></td><td>${x.files}</td>
      <td><span class="perf-num">${x.ms} ms</span></td>
      <td><span class="tag ${x.fsmonitor==='unset'?'t-grey':'t-clean'}">${x.fsmonitor}</span></td>
      <td><span class="tag ${x.untracked==='unset'?'t-grey':'t-clean'}">${x.untracked}</span></td></tr>`;
  }).join('');
  $('#apiPolicy').innerHTML=API_POLICY.map(([k,v])=>`<div class="asset-row"><span class="tag t-blue" style="min-width:76px;text-align:center">${esc(k)}</span><span style="color:var(--text-2)">${esc(v)}</span></div>`).join('');
  $('#perfConfig').innerHTML=PERF_CONFIG.map(x=>`<div class="asset-row"><span style="flex:1"><code style="color:var(--primary)">${esc(x.k)}</code>
    <div style="font-size:10.5px;color:var(--text-2);margin-top:3px">${esc(x.why)}</div>
    <div style="font-size:10px;color:var(--text-3);margin-top:2px">适用：${esc(x.when)}</div></span></div>`).join('');
  $('#perfCmd').textContent=perfCommand();
}
function renderResearch(){
  $('#researchBody').innerHTML=RESEARCH.map(x=>`<tr>
    <td><div class="fname">${esc(x.t)}</div></td><td><span class="src-tag">${esc(x.s)}</span></td>
    <td style="color:var(--text-2)">${esc(x.f)}</td>
    <td><span class="tag ${x.u.includes('不')?'t-grey':x.u.includes('受限')||x.u.includes('可选')?'t-amber':'t-teal'}">${esc(x.u)}</span></td>
    <td style="color:var(--text-2)">${esc(x.w)}</td></tr>`).join('');
}

/* ================= v5 · 命令面板 8 状态 / URL 可寻址 / 撤销 ================= */
function cmdItems(){
  const views=[['dashboard','全局驾驶舱'],['workbench','提交工作台'],['search','全局检索'],['rewrite','历史与删除'],['clean','删减与清理'],['commit','提交辅助'],['ci','CI 与钩子'],['cluster','项目集群'],['inbox','通知中心'],['platforms','平台与同步'],['accounts','账号与授权'],['stats','开发数据'],['gaps','功能缺口'],['plans','模块规划']];
  const items=views.map(([v,t])=>({t:'前往 · '+t,k:'视图',run:()=>setView(v)}));
  FILTERS.forEach(f=>items.push({t:'筛选 · '+f.l,k:'筛选',run:()=>{setView('dashboard');S.filter=f.k;renderChips();renderRepos();save();}}));
  REPOS.forEach(r=>items.push({t:'打开仓库 · '+r.name,k:'仓库',repo:r.id,run:()=>openRepo(r.id)}));
  const actualTheme=S.theme==='system'?(systemDark()?'dark':'light'):S.theme;
  items.push({t:'切换主题 · '+(actualTheme==='dark'?'夜间 → 日间':'日间 → 夜间'),k:'设置',run:toggleTheme});
  items.push({t:'外观 · 跟随系统',k:'设置',run:()=>applyTheme('system')});
  items.push({t:'同步全部平台远端',k:'同步',disabled:!S.demo,reason:'需先绑定 Gitee 账号',
    run:()=>{setView('platforms');$('#btnRunSync').click();}});
  items.push({t:'执行历史重写（强制推送）',k:'危险',disabled:true,reason:'不可逆 · 需二次确认与备份',run:()=>{}});
  return items;
}
function cmdRank(list){
  return list.map((x,i)=>({...x,_r:(S.cmdRecent.indexOf(x.t)>=0?1000-S.cmdRecent.indexOf(x.t)*10:0)+i})).sort((a,b)=>b._r-a._r);
}
function cmdHighlight(text,q){
  if(!q)return esc(text);
  const i=text.toLowerCase().indexOf(q.toLowerCase());
  if(i<0)return esc(text);
  return esc(text.slice(0,i))+'<mark>'+esc(text.slice(i,i+q.length))+'</mark>'+esc(text.slice(i+q.length));
}
function cmdMode(q){
  if(q.startsWith('>'))return {q:q.slice(1).trim(),mode:'命令',test:x=>x.k!=='仓库'};
  if(q.startsWith('#'))return {q:q.slice(1).trim(),mode:'仓库',test:x=>x.k==='仓库'};
  if(q.startsWith('?'))return {q:q.slice(1).trim(),mode:'帮助',test:()=>true};
  return {q,mode:'',test:()=>true};
}
function renderCmdk(){
  const raw=$('#cmdkInput').value.trim(),m=cmdMode(raw),q=m.q.toLowerCase();
  const base=cmdItems().filter(m.test);
  const list=q?base.filter(x=>x.t.toLowerCase().includes(q)||x.k.includes(q))
    :[...cmdRank(base).slice(0,8),...base.filter(x=>x.disabled)];
  S.cmdList=list;S.cmdSel=Math.min(S.cmdSel,Math.max(0,list.length-1));
  const offline=!navigator.onLine;
  $('#cmdkList').innerHTML=
    (!q&&S.cmdRecent.length?'<div class="cmdk-recents">最近使用</div>':'')
    + (list.length?list.map((x,i)=>`<div class="cmdk-item ${i===S.cmdSel?'sel':''} ${x.disabled?'disabled':''}" data-ci="${i}">
        ${x.repo?projectMarkByName(x.repo,'sm'):icon('M4 4h16v16H4zM8 8h8v8H8z',15)}<span>${cmdHighlight(x.t,m.q)}</span>
        ${x.disabled?'<span class="cmdk-reason">'+esc(x.reason)+'</span>':'<span class="cmdk-kind">'+x.k+'</span>'}</div>`).join('')
      :`<div class="cmdk-empty">没有匹配的命令<div class="cmdk-recovery">
        <button class="btn btn-ghost" id="cmdClear">清空查询</button><button class="btn btn-ghost" id="cmdAll">显示全部命令</button></div></div>`)
    + (offline?'<div class="cmdk-offline">当前离线：本地命令仍可执行；远端同步类命令暂不可用。</div>':'');
  if(!$('#cmdkList')._bound){$('#cmdkList')._bound=true;$('#cmdkList').addEventListener('click',function(e){
    const el=e.target.closest('.cmdk-item');if(!el)return;
    const it=S.cmdList[+el.dataset.ci];
    if(it.disabled){toast('该命令不可用：'+esc(it.reason),'warn');return;}
    runCmd(it);
  });}
  if($('#cmdClear'))$('#cmdClear').onclick=()=>{$('#cmdkInput').value='';renderCmdk();};
  if($('#cmdAll'))$('#cmdAll').onclick=()=>{$('#cmdkInput').value='';S.cmdRecent=[];renderCmdk();};
}
function runCmd(it){
  S.cmdRecent=[it.t,...S.cmdRecent.filter(x=>x!==it.t)].slice(0,8);save();closeCmdk();it.run();
}
function execCmd(){
  if(!S.cmdk||!S.cmdList[S.cmdSel])return;
  const it=S.cmdList[S.cmdSel];
  if(it.disabled){toast('该命令不可用：'+esc(it.reason),'warn');return;}
  runCmd(it);
}
function openCmdk(){S.cmdk=true;S.cmdSel=0;$('#cmdkInput').value='';renderCmdk();$('#cmdk').classList.add('show');syncMask();setTimeout(()=>$('#cmdkInput').focus(),40);}
function closeCmdk(){S.cmdk=false;$('#cmdk').classList.remove('show');syncMask();}
/* 视图切换写入浏览历史，筛选 / 数据源切换只替换当前条目，
   避免后退键被大量筛选状态淹没。 */
function writeHash(push){
  try{
    const p=new URLSearchParams({v:S.view,f:S.filter,d:S.demo?'1':'0'});
    const next='#'+p.toString();
    if(location.hash===next)return;
    if(push)history.pushState(null,'',next);else history.replaceState(null,'',next);
  }catch(e){}
}
function readHash(){
  const p=new URLSearchParams(location.hash.slice(1));
  const v=p.get('v'),f=p.get('f');
  if(v&&$('#view-'+v))S.view=v;
  if(f&&FILTERS.some(x=>x.k===f))S.filter=f;
  S.demo=p.get('d')==='1';
}
/* 浏览器前进 / 后退：恢复视图、筛选与数据源，再重绘受影响区域 */
function applyRoute(){
  readHash();
  renderDemoState();
  S.selected.clear();
  renderChips();renderRepos();renderBatch();
  setView(S.view);
}
window.addEventListener('popstate',applyRoute);
function undoTasks(){
  if(!S.tasks)return;
  const n=S.tasks.ids.length;
  S.tasks=null;S.undone=true;
  $('#drawerBody').innerHTML='<div class="notice" style="margin-bottom:0"><b>已撤销本次批量操作</b><div style="margin-top:8px;font-size:11.5px">'
    +n+' 个仓库的任务记录已清空，选中状态保留。真机版本会在撤销时回滚可回滚步骤（拉取 / 打包），对已推送的写操作不提供自动回滚。</div></div>';
  toast('已撤销批量操作（'+n+' 个任务）。','success');
}

