/* ================= 渲染 ================= */
function dirtyOf(r){return S.demo ? (r.demo.dirty||0) : 0}
function aheadOf(r){return S.demo ? (r.demo.ahead||0) : 0}
function prOf(r){return S.demo ? (r.demo.pr||0) : 0}

function renderKPI(){
  const dirty=REPOS.filter(r=>dirtyOf(r)>0).length;
  const ahead=REPOS.reduce((a,r)=>a+aheadOf(r),0);
  const risk=REPOS.filter(r=>r.sizeMB>=20).length;
  const pr=REPOS.reduce((a,r)=>a+prOf(r),0);
  const items=[
    {l:'纳管仓库',v:activeRepos().length,f:'全部远端 GitHub / LeChuangDev',i:'M4 4h16v16H4zM8 8h8v8H8z',c:'var(--primary)',b:'var(--primary-soft)'},
    {l:'有未提交变更',v:dirty,f:dirty?`${dirty} 个仓库需处理`:'工作区全部 clean',i:'M12 9v4M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',c:'var(--amber)',b:'var(--amber-soft)'},
    {l:'未推送提交',v:ahead,f:'本地领先远端',i:'M12 19V5M6 11l6-6 6 6',c:'var(--blue)',b:'var(--blue-soft)'},
    {l:'待处理 PR / Issue',v:pr,f:'需 GitHub API 拉取',i:'M8 6h8a4 4 0 0 1 0 8H8zM8 6V4M8 14v6',c:'var(--teal)',b:'var(--teal-soft)'},
    {l:'体积风险仓库',v:risk,f:'≥ 20 MB · 最大 93 MB',i:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01',c:'var(--red)',b:'var(--red-soft)',alert:true},
  ];
  $('#kpiRow').innerHTML=items.map(k=>`<div class="kpi ${k.alert?'alert':''}">
    <div class="kpi-top"><span class="kpi-label">${k.l}</span><span class="kpi-ico" style="background:${k.b};color:${k.c}">${icon(k.i,16)}</span></div>
    <div class="kpi-val">${k.v}</div><div class="kpi-foot">${k.f}</div></div>`).join('');
}

const FILTERS=[
  {k:'all',l:'全部'}, {k:'dirty',l:'有未提交变更'}, {k:'week',l:'本周更新'},
  {k:'stale',l:'长期未维护'}, {k:'risk',l:'体积风险'}, {k:'fw',l:'固件工程'}, {k:'hw',l:'硬件工程'}
];
function counts(){
  const list=activeRepos();
  return {all:list.length, dirty:list.filter(r=>dirtyOf(r)>0).length,
    week:list.filter(r=>r.date>='2026-11-03').length, stale:list.filter(r=>r.date<'2026-10-25').length,
    risk:list.filter(r=>r.sizeMB>=20).length, fw:list.filter(r=>r.kind==='fw').length, hw:list.filter(r=>r.kind==='hw').length};
}
function renderChips(){
  const c=counts();
  $('#chips').innerHTML=FILTERS.map(f=>`<button class="chip ${S.filter===f.k?'on':''}" data-filter="${f.k}">${f.l}<span class="n">${c[f.k]}</span></button>`).join('');
  if(!$('#chips')._bound){$('#chips')._bound=true;$('#chips').addEventListener('click',function(e){
    const b=e.target.closest('.chip');if(!b)return;
    S.filter=b.dataset.filter;S.repoLimit=PAGE_SIZE;renderChips();renderRepos();writeHash(false);
  });}
}
function passFilter(r){
  switch(S.filter){
    case 'dirty': return dirtyOf(r)>0;
    case 'week': return r.date>='2026-11-03';
    case 'stale': return r.date<'2026-10-25';
    case 'risk': return r.sizeMB>=20;
    case 'fw': return r.kind==='fw';
    case 'hw': return r.kind==='hw';
    default: return true;
  }
}
function repoCardHtml(r,i){
  const d=dirtyOf(r),a=aheadOf(r),p=prOf(r),risk=r.sizeMB>=20;
  const tags=[];
  if(d>0)tags.push(`<span class="tag t-amber">${d} 个变更</span>`); else tags.push('<span class="tag t-clean">clean</span>');
  if(a>0)tags.push(`<span class="tag t-blue">↑ ${a} 待推送</span>`);
  if(p>0)tags.push(`<span class="tag t-teal">${p} PR</span>`);
  if(risk)tags.push(`<span class="tag t-red">${r.size} · 大文件</span>`);
  else tags.push(`<span class="tag t-grey">${r.size}</span>`);
  if(r.attrs)tags.push('<span class="tag t-grey">.gitattributes</span>');
  return `<article class="card ${risk?'risk':''} ${S.selected.has(r.id)?'selected':''}" data-id="${r.id}" tabindex="0" role="button" aria-selected="${S.selected.has(r.id)?'true':'false'}" aria-label="打开 ${escMark(r.name)} 仓库详情；按空格键选择" style="animation-delay:${i*.035}s">
        <span class="detail-link">详情 →</span>
      <div class="card-head">
        <span class="check" aria-hidden="true" title="选择；Shift + 点击可连选"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M5 12l5 5L19 7"/></svg></span>
        ${projectMark(r)}
        <div style="min-width:0"><div class="repo-name">${esc(r.name)}</div><div class="repo-group">${esc(r.group)} · <span style="font-family:var(--font-display)">${r.branch}</span></div></div>
      </div>
      <div class="card-stats">
        <div class="stat"><div class="stat-v ${d?'warn':'ok'}">${d}</div><div class="stat-l">未提交</div></div>
        <div class="stat"><div class="stat-v ${a?'warn':'ok'}">${a}</div><div class="stat-l">未推送</div></div>
        <div class="stat"><div class="stat-v ${p?'warn':'ok'}">${p}</div><div class="stat-l">PR / Issue</div></div>
      </div>
      <div class="card-commit"><span class="tag t-grey" style="flex:none">${r.date.slice(5)}</span><span class="msg" title="${esc(r.msg)}">${esc(r.msg)}</span></div>
      <div class="card-foot">${tags.join('')}</div>
    </article>`;
}
/* 当前账号可见、未被移除、符合筛选与搜索的仓库。
   renderRepos 与「全选当前」共用同一份口径，避免两处规则漂移。 */
function visibleRepos(){
  const allowed=ACCOUNT_REPOS[S.activeAccount]||REPOS.map(r=>r.id);
  const q=S.q;
  return REPOS.filter(r=>!S.removedRepos.has(r.id) && allowed.includes(r.id) && passFilter(r)
    && (!q || r.name.toLowerCase().includes(q) || r.remote.toLowerCase().includes(q) || r.msg.toLowerCase().includes(q)));
}
function renderRepos(){
  const list=visibleRepos();
  const total=list.length,shown=Math.min(total,S.repoLimit);
  $('#countNote').textContent='显示 '+shown+' / '+total+' 个仓库'+(total>shown?' · 增量渲染':'');
  if(!total){$('#repoGrid').innerHTML='<div class="empty">当前筛选条件下没有仓库。切换到「演示态」或选择「全部」看看。</div>';return;}
  $('#repoGrid').innerHTML=list.slice(0,shown).map(repoCardHtml).join('')
    +(total>shown?'<div class="load-more"><button class="btn btn-ghost" id="loadMore">显示更多（剩余 '+(total-shown)+' 个）</button>'
      +'<span class="count-note">每次追加 '+PAGE_SIZE+' 个 · 空闲时间分帧</span></div>':'');
  observeLoadMore();
}
/* 只改被点卡片的高亮与批量栏，不重建整张表：
   保留滚动位置、键盘焦点与勾选前的阅读上下文。 */
function paintSelection(){
  $$('#repoGrid .card').forEach(c=>{
    const on=S.selected.has(c.dataset.id);
    c.classList.toggle('selected',on);
    c.setAttribute('aria-selected',on?'true':'false');
  });
  renderBatch();
}
/* Shift + 点击复选框：从上次点过的仓库连续选中一段 */
function toggleSelect(id,ev){
  if(ev&&ev.shiftKey&&S.lastPicked&&S.lastPicked!==id){
    const ids=visibleRepos().map(r=>r.id);
    const a=ids.indexOf(S.lastPicked),b=ids.indexOf(id);
    if(a>=0&&b>=0){
      const lo=Math.min(a,b),hi=Math.max(a,b);
      for(let i=lo;i<=hi;i++)S.selected.add(ids[i]);
      S.lastPicked=id;paintSelection();return;
    }
  }
  S.selected.has(id)?S.selected.delete(id):S.selected.add(id);
  S.lastPicked=id;paintSelection();
}
function selectVisibleAll(){
  const ids=visibleRepos().map(r=>r.id);
  if(!ids.length)return;
  const allOn=ids.every(id=>S.selected.has(id));
  ids.forEach(id=>allOn?S.selected.delete(id):S.selected.add(id));
  paintSelection();
}
function clearSelection(){S.selected.clear();paintSelection();}
function bindRepoGrid(){
  $('#repoGrid').addEventListener('click',function(e){
    if(e.target.closest('#loadMore')){
      scheduleIdle(function(){S.repoLimit+=PAGE_SIZE;renderRepos();});
      return;
    }
    const card=e.target.closest('.card');if(!card)return;
    const id=card.dataset.id;
    if(e.target.closest('.check')){toggleSelect(id,e);return;}
    openRepo(id);
  });
  /* 卡片可 Tab 聚焦：Enter 打开详情，空格切换选择 */
  $('#repoGrid').addEventListener('keydown',function(e){
    const card=e.target.closest('.card');
    if(!card||e.target!==card)return;
    if(e.key==='Enter'){e.preventDefault();openRepo(card.dataset.id);}
    else if(e.key===' '||e.key==='Spacebar'){e.preventDefault();toggleSelect(card.dataset.id,e);}
  });
}

function renderBatch(){
  const vis=new Set(visibleRepos().map(r=>r.id));
  const hidden=[...S.selected].filter(id=>!vis.has(id)).length;
  $('#batchCount').textContent=S.selected.size;
  const note=$('#batchHidden');
  if(note){note.textContent=hidden?'· '+hidden+' 个不在当前筛选':'';note.style.display=hidden?'inline':'none';}
  const allOn=vis.size>0&&[...vis].every(id=>S.selected.has(id));
  const allBtn=$('#batchAll');if(allBtn)allBtn.textContent=allOn?'取消当前':'全选当前';
  $('#batchBar').classList.toggle('show',S.selected.size>0);
}
function renderTimeline(){
  const filter=$('#tlRepo').value||'all';
  const groups=TIMELINE.map(g=>({day:g.day,items:g.items.filter(it=>filter==='all'||it.r===filter)})).filter(g=>g.items.length);
  $('#timeline').innerHTML=groups.length?groups.map(g=>`<div class="tl-day">${g.day}</div>`+g.items.map(it=>`<div class="tl-item">
    <span class="tl-dot ${it.c}"></span><div class="tl-body">
      <div class="tl-repo">${projectMarkByName(it.r,'sm')} ${esc(it.r)}</div>
      <div class="tl-msg" title="${esc(it.m)}">${esc(it.m)}</div>
      <div class="tl-meta">${it.t}</div>
    </div></div>`).join('')).join(''):'<div class="empty">该仓库在当前时间线里没有提交。</div>';
}
/* 纯函数：由勾选集合推导 LFS 迁移收益，供界面与自检共用 */
function lfsPlan(picked){
  const files=BIGFILES.filter((f,i)=>picked.has(i));
  const mb=Math.round(files.reduce((a,f)=>a+f.v,0)*10)/10;
  const before=93;
  const after=Math.round(Math.max(0.5,before-mb*0.9)*10)/10;
  const quota=Math.round(mb/(SYNC_POLICY.lfsQuotaGB*1024)*1000)/10;
  const exts=[...new Set(files.filter(f=>f.a.includes('LFS')).map(f=>(f.n.match(/\.[A-Za-z0-9]+$/i)||[''])[0]).filter(Boolean))];
  return {count:files.length,mb,after,quota,exts,pct:Math.round(after/before*100)};
}
function lfsCommand(plan){
  if(!plan.exts.length)return '# 未勾选任何 LFS 候选文件';
  const lines=['# .gitattributes（由 git lfs track 自动写入）'];
  plan.exts.forEach(e=>lines.push(`*${e} filter=lfs diff=lfs merge=lfs -text`));
  lines.push('','# 在 硬件设计/嘉立创资料 仓库执行（仅影响后续提交）','git lfs install');
  plan.exts.forEach(e=>lines.push(`git lfs track "*${e}"`));
  lines.push('git add .gitattributes','git commit -m "chore: 启用 Git LFS 追踪大文件"','','# 历史重写属于不可逆操作，本原型不生成该命令');
  return lines.join('\n');
}
function renderBigFiles(){
  $('#bigFileTable').innerHTML=BIGFILES.map((f,i)=>`<tr>
    <td><input type="checkbox" class="cbx file-cbx" data-i="${i}" ${S.picked.has(i)?'checked':''} aria-label="选择 ${esc(f.n)}"></td>
    <td><div class="fname">${esc(f.n)}</div><div class="fpath">${esc(f.p)}</div></td>
    <td style="white-space:nowrap;font-size:11px">${f.p.split(' · ')[0]}</td>
    <td style="text-align:right"><span class="size ${f.v<5?'mid':''}">${f.s}</span></td>
    <td><span class="tag ${f.a==='保留（源码）'?'t-grey':f.a.includes('gitignore')?'t-amber':'t-blue'}" style="white-space:nowrap">${f.a}</span></td>
  </tr>`).join('');
  $$('.file-cbx').forEach(c=>c.onchange=()=>{
    const i=+c.dataset.i; c.checked?S.picked.add(i):S.picked.delete(i);
    updateLfsPlan();
  });
  updateLfsPlan();
}
function updateLfsPlan(){
  const plan=lfsPlan(S.picked);
  $('#pickedCount').textContent=plan.count;
  $('#pickedSize').textContent=plan.mb+' MB';
  $('#mFiles').textContent=plan.count+' 个';
  $('#mSize').textContent=plan.mb+' MB';
  $('#mQuota').textContent='≈ '+plan.quota+'%';
  $('#afterSize').textContent='≈ '+plan.after+' MB';
  $('#afterBar').style.width=plan.pct+'%';
  $('#cbxAll').checked=plan.count===BIGFILES.length;
  $('#rulePreview').textContent=lfsCommand(plan);
  return plan;
}
function renderPlans(){
  $('#planTabs').innerHTML=PLAN_TABS.map(x=>`<button class="cfg-tab ${x.k===S.planTab?'on':''}" data-plan="${x.k}">${x.n}<span style="margin-left:6px;opacity:.7">${PLANS[x.k].length}</span></button>`).join('');
  $$('[data-plan]').forEach(b=>b.onclick=()=>{S.planTab=b.dataset.plan;renderPlans();});
  const cards=PLANS[S.planTab];
  $('#planBody').innerHTML='<div class="section-desc">下列优先级依据本机 6 个仓库的实测状态给出，而非功能清单的罗列顺序。</div><div class="plan-grid">'+
    cards.map(c=>`<div class="plan">
      <div class="plan-top"><span class="plan-ico">${icon(c.ico,17)}</span><span class="plan-name">${c.n}</span></div>
      <ul>${c.li.map(x=>`<li>${x}</li>`).join('')}</ul>
      <span class="phase tag ${c.cls}">${c.phase}</span>
    </div>`).join('')+'</div>';
}

