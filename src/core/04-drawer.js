/* ================= v2 · 抽屉：仓库详情 / 批量任务 ================= */
function syncMask(){ $('#mask').classList.toggle('show',!!(S.drawer||S.cmdk||S.help)); }
/* 打开抽屉前记住触发元素，关闭后把焦点还回去，键盘用户不会掉到页面开头 */
let drawerReturnFocus=null;
function openDrawer(mode){
  if(!S.drawer)drawerReturnFocus=document.activeElement;
  S.drawer=mode;$('#drawer').classList.add('show');syncMask();
  const close=$('#drawerClose');
  if(close)setTimeout(function(){try{close.focus({preventScroll:true})}catch(e){close.focus()}},40);
}
function closeDrawer(){
  S.drawer=null;$('#drawer').classList.remove('show');syncMask();
  const back=drawerReturnFocus;drawerReturnFocus=null;
  if(back&&back.focus)setTimeout(function(){try{back.focus({preventScroll:true})}catch(e){}},20);
}
function openRepo(id){
  const r=REPOS.find(x=>x.id===id); if(!r)return;
  const d=dirtyOf(r),a=aheadOf(r),p=prOf(r);
  const max=Math.max(...REPOS.map(x=>x.sizeMB));
  $('#drawerTitle').textContent=r.name;
  $('#drawerRemote').textContent='https://github.com/'+r.remote+'.git';
  $('#drawerBody').innerHTML=`
    <div class="drawer-hero">${projectMark(r,'lg')}<div><b>${esc(r.name)}</b><span>${MARK_THEME[markKind(r)].label} · ${esc(r.group)}</span>
      <button class="btn btn-ghost" data-markrepo="${esc(r.id)}" style="height:24px;padding:0 9px;font-size:10.5px;margin-top:5px;align-self:flex-start">更换图标</button></div></div>
    <div class="drawer-sec">基础信息</div>
    <dl class="dl">
      <dt>分组</dt><dd>${esc(r.group)}</dd>
      <dt>当前分支</dt><dd>${r.branch}</dd>
      <dt>远端</dt><dd>${esc(r.remote)}</dd>
      <dt>分支总数</dt><dd>${r.live?'—（GitHub API 未提供）':r.branches+' 个（含远端）'}</dd>
      <dt>受控文件</dt><dd>${r.live?'—（GitHub API 未提供）':r.files+' 个'}</dd>
      <dt>.git 体积</dt><dd style="color:${r.sizeMB>=20?'var(--red)':'inherit'}">${r.size}</dd>
      <dt>LFS 追踪</dt><dd>${r.attrs?'有 .gitattributes，仅换行规则':'未配置'}</dd>
    </dl>
    <div class="drawer-sec">工作区状态（${S.live?'GitHub 只读数据':S.demo?'演示态':'实测快照'}）</div>
    <div class="metric-list" style="margin-top:0">
      <div class="metric"><span>未提交变更</span><b>${d}</b></div>
      <div class="metric"><span>未推送提交</span><b>${a}</b></div>
      <div class="metric"><span>待处理 PR / Issue</span><b>${p}</b></div>
    </div>
    <div class="drawer-sec">最近提交</div>
    <div class="code-preview" style="font-size:11.5px">${r.date} · ${r.branch}\n${esc(r.msg)}</div>
    <div class="drawer-sec">6 个仓库 .git 体积对比</div>
    <div class="size-bars">${REPOS.map(x=>`<span class="${x.id===r.id?'hi':''}" style="height:${Math.max(6,x.sizeMB/max*100)}%"><em>${esc(x.name.slice(0,6))}</em></span>`).join('')}</div>
    <div class="notice" style="margin-top:var(--s6);margin-bottom:0">${r.id==='jlc'
      ? '该仓库 93 MB 却只有 6 个受控文件，最大单个 PDF 为 74.5 MB，且文件名含换行符。建议先做可逆的 LFS 后续追踪，历史重写单独评估。'
      : r.id==='32_Demo'
      ? '含 Keil 工具链 .pack/*.svd 缓存文件（单个 4–5 MB）。适合加入 .gitignore 白名单，不属于 LFS 场景。'
      : '当前仓库状态正常，无体积或规范方面的待办。'}</div>`;
  $('#drawerFoot').innerHTML=`
    <button class="btn btn-primary" data-copy="${esc('https://github.com/'+r.remote+'.git')}">复制远端地址</button>
    <button class="btn btn-ghost" id="drawerToClean">查看大文件</button>
    <button class="btn btn-ghost" data-copy="${esc(r.msg)}">复制提交说明</button>`;
  openDrawer('detail');
}

/* ================= v2 · 批量任务（确定性状态机，不执行真实 Git） ================= */
function openTasks(action){
  const ids=[...S.selected];
  if(!ids.length)return;
  S.tasks={action,ids,done:0,log:['$ repoflow batch --dry-run --action="'+action+'"']};
  setView('dashboard');
  $('#drawerTitle').textContent='批量执行 · '+action;
  $('#drawerRemote').textContent='模拟执行 · 不改动任何本地仓库';
  $('#drawerFoot').innerHTML='<button class="btn btn-primary" id="btnRunTasks">开始执行</button><button class="btn btn-ghost" id="btnCloseTasks">关闭</button><button class="btn undo-btn" id="btnUndo">撤销</button>';
  renderTasks();
  openDrawer('tasks');
}
function renderTasks(){
  const t=S.tasks; if(!t)return;
  $('#drawerBody').innerHTML=`
    <div class="notice"><b>模拟执行：</b>下面逐仓库展示状态流转与结构化日志，用于验证批量操作的交互与失败反馈。真机版本会在并发 ${SYNC_POLICY.concurrency} 路下调用真实 Git 子进程。</div>
    <div class="progress"><i id="taskProgress"></i></div>
    <div class="drawer-sec">任务队列 · ${t.ids.length} 个仓库</div>
    <div>${t.ids.map((id,i)=>{
      const r=REPOS.find(x=>x.id===id);
      const st=i<t.done?'done':(t.done>0&&i===t.done)?'run':'wait';
      return `<div class="task-row"><span class="task-state st-${st}">${st==='done'?'完成':st==='run'?'执行中':'等待'}</span>
        <span class="task-name">${esc(r.name)}</span><span class="task-log">${st==='done'?'ok · 0.4s':st==='run'?'running…':'queued'}</span></div>`;
    }).join('')}</div>
    <div class="mini-title">结构化日志</div>
    <div class="code-preview" id="taskLog">${t.log.map(esc).join('\n')}</div>`;
  $('#taskProgress').style.width=(t.done/t.ids.length*100)+'%';
  $('#btnRunTasks').disabled=t.done>=t.ids.length;
}
function runTasks(instant){
  const t=S.tasks; if(!t)return;
  const step=()=>{
    if(t.done>=t.ids.length)return false;
    const r=REPOS.find(x=>x.id===t.ids[t.done]);
    t.log.push(`[${r.name}] status=ok  action=${t.action}  elapsed=0.4s  requestId=rf-${String(t.done+1).padStart(3,'0')}`);
    t.done++; renderTasks(); return true;
  };
  if(instant){while(step()){};}
  else{const tick=()=>{if(step())setTimeout(tick,220);else t.log.push('batch finished: '+t.done+' succeeded, 0 failed');renderTasks();};tick();}
}

/* v5：命令面板实现已移至上方 v5 区块（8 状态 / 模式前缀 / 禁用原因 / 最近使用）。 */

/* ================= v2 · 复制 / 骨架屏 ================= */
function copyText(txt,label){
  const done=()=>toast('已复制'+label+'到剪贴板。','success');
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(()=>fallback());}else fallback();
  function fallback(){
    const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');done();}catch(e){toast('当前环境不支持剪贴板，请手动选中文本复制。','warn');}
    document.body.removeChild(ta);
  }
}
function setSyncing(on){
  $('.scroll').classList.toggle('syncing',on);
  if(on){
    $('#repoGrid').innerHTML=Array.from({length:6},()=>'<article class="card"><div class="skel" style="height:18px;width:60%;margin-bottom:12px"></div><div class="skel" style="height:38px;margin-bottom:16px"></div><div class="skel" style="height:30px;margin-bottom:12px"></div><div class="skel" style="height:18px;width:80%"></div></article>').join('');
  }else renderRepos();
}

