/* ================= v4 · 全局检索 ================= */
function searchMatch(q,repo,rng){
  const term=q.trim().toLowerCase();
  return SEARCH_INDEX.filter(x=>{
    if(repo!=='all'&&x.repo!==repo)return false;
    if(rng==='week'&&x.date<'2026-11-03')return false;
    if(rng==='month'&&x.date<'2026-11-01')return false;
    if(rng==='older'&&x.date>='2026-11-01')return false;
    if(!term)return true;
    return (x.msg+' '+x.sha+' '+x.repo+' '+x.author).toLowerCase().includes(term);
  });
}
function renderSearch(){
  const q=$('#searchQ').value,list=searchMatch(q,S.searchRepo,S.searchRange);
  $('#idxCount').textContent=SEARCH_INDEX.length;
  $('#searchMeta').textContent='命中 '+list.length+' 条 · 索引 '+SEARCH_INDEX.length+' 条（实测 '+LIVE.length+' / 演示 '+COMMITS.length+'）';
  $('#searchResults').innerHTML=list.length?list.map(x=>`<div class="result-row" data-sha="${x.sha}" data-repo="${esc(x.repo)}">
    ${projectMarkByName(x.repo,'sm')}<span class="hist-sha">${x.sha}</span>
    <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.msg)}</span>
    <span class="tag ${x.real?'t-teal':'t-grey'}">${x.real?'实测':'演示'}</span>
    <span class="tag t-blue">${esc(x.repo)}</span>
    <span style="font-size:10.5px;color:var(--text-3);white-space:nowrap">${x.date}</span></div>`).join('')
    :'<div class="empty">没有匹配的提交。清空条件或切换时间范围再试。</div>';
  $$('#searchResults .result-row').forEach(el=>el.onclick=()=>{
    const r=REPOS.find(x=>x.name===el.dataset.repo||x.id===el.dataset.repo);
    if(r)openRepo(r.id);else toast('该提交属于演示索引，没有对应的本地仓库详情。','warn');
  });
}
function renderSearchDrop(){
  const q=$('#searchInput').value.trim().toLowerCase(),box=$('#searchDrop');
  if(!q){box.classList.remove('show');S.sdItems=[];S.sdSel=-1;return;}
  const repos=REPOS.filter(r=>(r.name+' '+r.remote+' '+r.msg).toLowerCase().includes(q)).slice(0,3);
  const commits=SEARCH_INDEX.filter(x=>(x.msg+' '+x.sha+' '+x.repo).toLowerCase().includes(q)).slice(0,4);
  /* 下拉项顺序与 S.sdItems 一一对应，键盘上下键与鼠标共用同一份索引 */
  S.sdItems=repos.map(r=>({kind:'repo',id:r.id})).concat(commits.map(x=>({kind:'commit',msg:x.msg})));
  if(S.sdSel>=S.sdItems.length)S.sdSel=S.sdItems.length-1;
  let idx=0;
  const item=(body,kind)=>`<div class="sd-item ${S.sdSel===idx?'sel':''}" data-sd="${idx++}" data-kind="${kind}">${body}</div>`;
  box.innerHTML=(repos.length?'<div class="sd-head">仓库</div>':'')
    +repos.map(r=>item(`${projectMark(r,'sm')}<span>${esc(r.name)}</span><span class="sd-kind">仓库</span>`,'repo')).join('')
    +(commits.length?'<div class="sd-head">提交</div>':'')
    +commits.map(x=>item(`<span class="hist-sha">${x.sha}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.msg)}</span><span class="sd-kind">${esc(x.repo)}</span>`,'commit')).join('')
    +(repos.length+commits.length?'':'<div class="cmdk-empty">没有匹配结果，回车进入全局检索</div>');
  box.classList.add('show');
  $$('#searchDrop .sd-item').forEach(el=>{
    const i=Number(el.dataset.sd);
    el.onmouseenter=()=>{S.sdSel=i;$$('#searchDrop .sd-item').forEach(x=>x.classList.toggle('sel',Number(x.dataset.sd)===i));};
    el.onclick=()=>activateSearchItem(i);
  });
}
function moveSearchSel(d){
  if(!S.sdItems.length)return;
  S.sdSel=(S.sdSel+d+S.sdItems.length)%S.sdItems.length;
  renderSearchDrop();
}
function activateSearchItem(i){
  const it=S.sdItems[i];if(!it)return;
  $('#searchDrop').classList.remove('show');S.sdSel=-1;
  if(it.kind==='repo')openRepo(it.id);
  else{setView('search');$('#searchQ').value=it.msg;renderSearch();}
}

/* ================= v4 · 通知中心 ================= */
function activeNotices(){return S.demo?[...NOTICES_DEMO,...NOTICES_LOCAL]:NOTICES_LOCAL}
function unreadCount(){return activeNotices().filter(n=>!S.read.has(n.id)).length}
function renderBell(){
  const n=unreadCount();$('#bellCount').textContent=n;$('#bellCount').style.display=n?'grid':'none';
  $('#inboxMeta').textContent=n+' 条未读';
}
function renderInbox(){
  const all=activeNotices();
  $('#inboxChips').innerHTML=INBOX_FILTERS.map(f=>`<button class="chip ${S.inboxFilter===f.k?'on':''}" data-inf="${f.k}">${f.n}<span class="n">${f.k==='all'?all.length:all.filter(x=>f.k==='fail'?x.level==='fail':x.kind===f.k).length}</span></button>`).join('');
  $$('[data-inf]').forEach(b=>b.onclick=()=>{S.inboxFilter=b.dataset.inf;renderInbox();});
  const list=all.filter(x=>S.inboxFilter==='all'?true:(S.inboxFilter==='fail'?x.level==='fail':x.kind===S.inboxFilter));
  $('#inboxList').innerHTML=list.length?list.map(n=>`<div class="notice-row ${S.read.has(n.id)?'is-read':''}" data-nid="${n.id}">
    <span class="n-dot" style="background:var(--${n.level==='fail'?'red':n.level==='warn'?'amber':n.level==='ok'?'green':'blue'})"></span>
    <div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <b style="font-size:12.5px">${esc(n.title)}</b><span class="tag t-grey">${esc(n.kind)}</span>
      ${!S.read.has(n.id)?'<span class="tag t-red">未读</span>':''}</div>
      <div style="font-size:11.5px;color:var(--text-2);margin-top:5px;line-height:1.5">${esc(n.body)}</div>
      <div style="font-size:10.5px;color:var(--text-3);margin-top:5px">${esc(n.repo)} · ${esc(n.time)}</div></div>
    <span class="tag t-blue">${esc(VIEW_NAME[n.view]||n.view)} →</span></div>`).join('')
    :'<div class="empty">当前分类下没有消息。切换「演示态」可查看 GitHub 侧通知。</div>';
  $$('#inboxList .notice-row').forEach(el=>el.onclick=()=>{
    const id=el.dataset.nid;S.read.add(id);renderBell();renderInbox();
    const n=activeNotices().find(x=>x.id===id);if(n)setView(n.view);
  });
  const fail=NOTICES_DEMO.find(n=>n.level==='fail');
  $('#inboxFailLog').textContent=S.demo&&fail?fail.log:'演示态下展示 Templates 固件 CI #24 的链接失败日志。';
  renderBell();
}

/* ================= v4 · 项目集群（纯函数可自检） ================= */
function makeSnapshot(name,i){
  return {id:'SNAP-'+String(i+1).padStart(3,'0'),name:name||'未命名版本',
    members:CLUSTER_MEMBERS.map(m=>({role:m.role,repo:m.repo,sha:(LIVE.find(x=>x.id===m.id)||{sha:'—'}).sha}))};
}
function renderCluster(){
  $('#clusterBody').innerHTML=CLUSTER_MEMBERS.map(m=>{
    const l=LIVE.find(x=>x.id===m.id)||{sha:'—'};
    return `<tr><td><b>${esc(m.role)}</b></td><td><span style="display:flex;align-items:center;gap:7px">${projectMarkByName(m.repo,'sm')}${esc(m.repo)}</span></td>
      <td><code style="color:var(--primary)">${l.sha}</code></td><td>${esc(m.ver)}</td>
      <td style="color:var(--text-2)">${esc(m.note)}</td></tr>`;
  }).join('');
  $('#snapList').innerHTML=S.snapshots.length?S.snapshots.map(s=>`<div class="snap-card">
    <div style="display:flex;align-items:center;gap:8px"><b style="font-size:12.5px">${esc(s.name)}</b><span class="tag t-teal">${s.id}</span></div>
    <div style="font-size:10.5px;color:var(--text-3);margin-top:6px">${s.members.length} 个仓库 · ${esc(s.time)}</div>
    <div style="margin-top:8px">${s.members.map(m=>`<div style="font-size:10.5px;color:var(--text-2);display:flex;justify-content:space-between"><span>${esc(m.role)} · ${esc(m.repo)}</span><code>${m.sha}</code></div>`).join('')}</div>
  </div>`).join(''):'<div class="section-desc" style="margin-top:var(--s4);margin-bottom:0">还没有快照。输入版本号后生成第一条。</div>';
}

/* ================= v4 · 开发数据（确定性统计） ================= */
let _statsKey='',_statsCache=null;
function repoStats(){
  const key=REPOS.length+'|'+(LIVE[0]||{}).sha+'|'+S.demo;
  if(key===_statsKey&&_statsCache)return _statsCache;
  const st={
    repos:REPOS.length,
    files:REPOS.reduce((a,r)=>a+r.files,0),
    sizeMB:Math.round(REPOS.reduce((a,r)=>a+r.sizeMB,0)*10)/10,
    commits:LIVE.length,
    bySize:[...REPOS].sort((a,b)=>b.sizeMB-a.sizeMB),
    byFiles:[...REPOS].sort((a,b)=>b.files-a.files),
    byGroup:Object.entries(REPOS.reduce((m,r)=>{const k=r.group.split(' · ')[0];m[k]=(m[k]||0)+1;return m;},{})),
    byDate:Object.entries(LIVE.reduce((m,x)=>{m[x.date]=(m[x.date]||0)+1;return m;},{})).sort()
  };
  _statsKey=key;_statsCache=st;return st;
}
function barRow(label,val,max,unit){
  return `<div class="stat-bar"><span class="lab" title="${esc(label)}">${esc(label)}</span>
    <span class="track"><span class="fill" style="width:${max?Math.max(3,val/max*100):0}%"></span></span>
    <span class="val">${val}${unit}</span></div>`;
}
function renderStats(){
  const st=repoStats();
  $('#statsKpi').innerHTML=[
    ['纳管仓库',st.repos,'个'],['受控文件',st.files,'个'],['.git 总体积',st.sizeMB,' MB'],['实测提交',st.commits,'条']
  ].map(([l,v,u])=>`<div class="kpi"><div class="kpi-top"><span class="kpi-label">${l}</span></div><div class="kpi-val">${v}<span style="font-size:12px;color:var(--text-3);margin-left:4px">${u}</span></div></div>`).join('');
  $('#statSize').innerHTML=st.bySize.map(r=>barRow(r.name,r.sizeMB,st.bySize[0].sizeMB,' MB')).join('');
  $('#statFiles').innerHTML=st.byFiles.map(r=>barRow(r.name,r.files,st.byFiles[0].files,' 个')).join('');
  const gmax=Math.max(...st.byGroup.map(x=>x[1]));
  $('#statGroups').innerHTML=st.byGroup.map(([k,v])=>barRow(k,v,gmax,' 个')).join('');
  const dmax=Math.max(...st.byDate.map(x=>x[1]));
  $('#statDates').innerHTML=st.byDate.map(([k,v])=>barRow(k,v,dmax,' 条')).join('');
}

/* ================= v4 · 帮助 / 主题 / 折叠 ================= */
const THEMES=['light','dark','system'];
function systemDark(){return !!(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)}
/* silent=true 用于跟随系统时的被动重绘，不重复写本机偏好 */
function applyTheme(t,silent){
  if(THEMES.indexOf(t)<0)t='light';
  S.theme=t;
  const actual=t==='system'?(systemDark()?'dark':'light'):t;
  document.documentElement.dataset.theme=actual;
  document.documentElement.style.colorScheme=actual;
  const meta=document.getElementById('themeColor');
  if(meta)meta.setAttribute('content',actual==='dark'?'#04070E':'#F5F6FA');
  $$('[data-theme-set]').forEach(b=>{
    const on=b.dataset.themeSet===t;
    b.classList.toggle('on',on);
    b.setAttribute('aria-pressed',on?'true':'false');
  });
  if(!silent)save();
}
/* 单键切换只走日间 / 夜间两态；自动模式在下次按键时落到相反的实际外观 */
function toggleTheme(){
  const actual=S.theme==='system'?(systemDark()?'dark':'light'):S.theme;
  applyTheme(actual==='dark'?'light':'dark');
}
if(window.matchMedia){
  const mq=matchMedia('(prefers-color-scheme: dark)');
  const onSysChange=()=>{if(S.theme==='system')applyTheme('system',true)};
  if(mq.addEventListener)mq.addEventListener('change',onSysChange);
  else if(mq.addListener)mq.addListener(onSysChange);
}
function openHelp(){S.help=true;$('#help').classList.add('show');syncMask();}
function closeHelp(){S.help=false;$('#help').classList.remove('show');syncMask();}
function renderHelp(){
  $('#helpList').innerHTML=HELP_KEYS.map(([k,d])=>`<div class="help-item"><kbd>${esc(k)}</kbd><span>${esc(d)}</span></div>`).join('');
}
function applyCollapsed(){
  $$('.nav-group').forEach(g=>g.classList.toggle('collapsed',S.collapsed.has(g.dataset.group)));
}
function renderTimelineInit(){
  const sel=$('#tlRepo');
  sel.innerHTML='<option value="all">全部仓库</option>'+[...new Set(TIMELINE.flatMap(g=>g.items.map(i=>i.r)))].map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
}

