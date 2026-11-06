/* ================= v9 · 删除仓库项目 / 删除一次推送记录 / 回收站 =================
   原型只改内存状态，绝不执行 Git 命令、不删磁盘文件、不访问远端。
   所有影响判断都是显式规则的纯函数，命令串只生成、可复制、不执行。       */
const PUSH_EVENTS=[
  {id:'pe1',repo:'calcbridge',       sha:'d3m0001',prev:'d3m0000',at:'2026-11-06 14:02',ref:'refs/remotes/origin/main',branch:'main',n:1,note:'最近一次推送 · 文档更新'},
  {id:'pe2',repo:'lechuang-site',    sha:'d3m0002',prev:'d3m0001',at:'2026-11-06 11:48',ref:'refs/remotes/origin/main',branch:'main',n:1,note:'最近一次推送 · 站点文案'},
  {id:'pe3',repo:'32_Demo',          sha:'d3m0003',prev:'d3m0002',at:'2026-10-23 16:30',ref:'refs/remotes/origin/main',branch:'main',n:2,note:'Keil 产物清理'},
  {id:'pe4',repo:'Templates',        sha:'d3m0004',prev:'d3m0003',at:'2026-10-30 09:16',ref:'refs/remotes/origin/main',branch:'main',n:2,note:'模板工程更新'},
  {id:'pe5',repo:'pcb-basics-notes',sha:'d3m0005',prev:'d3m0004',at:'2026-10-20 20:11',ref:'refs/remotes/origin/main',branch:'main',n:3,note:'文档目录树修复'},
  {id:'pe6',repo:'嘉立创资料',        sha:'d3m0006',prev:'d3m0005',at:'2026-10-20 19:44',ref:'refs/remotes/origin/main',branch:'main',n:3,note:'资料文件提交'}
];
const PUSH_DELETE_MODES=[
  {k:'reflog',n:'删除本地推送日志',risk:'low', d:'只删 reflog（引用日志）里的推送条目，提交对象与远端引用都不变。',
   tag:'t-clean',label:'低风险 · 可恢复'},
  {k:'remote',n:'回退最近一次推送',risk:'high',d:'把远端分支引用回退到上一个提交，需带租约强制推送，影响其他克隆。',
   tag:'t-red',label:'高风险 · 不可逆'},
  {k:'commit',n:'删除对应提交',risk:'mid', d:'改由「提交删除」页签处理，按 revert / drop / rewrite 三档选择。',
   tag:'t-amber',label:'转交提交向导'}
];

function activeRepos(){return REPOS.filter(r=>!S.removedRepos.has(r.id));}
function removeImpact(ids){
  const list=REPOS.filter(r=>ids.includes(r.id));
  return {
    count:list.length,
    reversible:true,
    scope:'仅本工具的纳管列表',
    items:[
      '磁盘上的仓库文件夹与 .git 目录保持不变',
      '远端 GitHub / Gitee 仓库不发生任何变化',
      '移除后进入回收站，30 天内可一键恢复',
      '彻底清除只删除本工具内的记录，仍不触碰磁盘'
    ],
    names:list.map(r=>r.name)
  };
}
function pushDeleteImpact(mode,rows){
  const n=rows.length;
  const spec={
    reflog:{reversible:true,scope:'仅本地引用日志',
      items:['提交对象仍在对象库，历史不受影响','远端分支引用不变','其他克隆与协作者无感知','日志过期后无法从 reflog 找回旧条目']},
    remote:{reversible:false,scope:'远端分支引用',
      items:['远端分支回退到上一个提交','已推送的提交在其他克隆中仍存在','必须带租约强制推送 push --force-with-lease','其他协作者需重新同步，操作前必须导出备份']},
    commit:{reversible:false,scope:'本地提交历史',
      items:['转交「提交删除」页签按三档处理','未推送提交可用 drop，不改变远端','已推送提交需历史重写，改变其后全部哈希']}
  }[mode]||{reversible:false,scope:'未知',items:[]};
  return {count:n,mode:mode,summary:spec.scope+' · '+n+' 条记录',...spec};
}
function pushDeleteCommand(mode,ev){
  if(mode==='reflog')return `# 仅删除本地引用日志条目（不影响提交与远端）\n`
    +`git reflog delete ${ev.ref}@{${ev.n}}\n`
    +`git reflog expire --expire=30.days --all`;
  if(mode==='remote')return `# 回退远端引用：不可逆，先导出完整备份包\n`
    +`git bundle create backup-${ev.repo}.bundle ${ev.sha}\n`
    +`git push --force-with-lease origin ${ev.prev}:${ev.branch}\n`
    +`# 其他克隆需执行 git fetch --prune 后重新对齐`;
  return `# 删除提交请切到「提交删除」页签，按 revert / drop / rewrite 三档生成命令`;
}
function removeRepos(ids){
  const im=removeImpact(ids);
  ids.forEach(id=>{
    const r=REPOS.find(x=>x.id===id);
    if(!r||S.removedRepos.has(id))return;
    S.removedRepos.add(id);
    S.trash.unshift({id:id,name:r.name,at:'2026-11-06 16:55',days:30});
  });
  S.selected.clear();
  return im;
}
function restoreRepo(id){
  S.removedRepos.delete(id);
  S.trash=S.trash.filter(x=>x.id!==id);
}
function purgeTrash(id){S.trash=S.trash.filter(x=>x.id!==id);}
function refreshAfterRemoval(){
  renderAll();renderTimeline();rerenderRendered();
  if(typeof renderRemoval==='function')renderRemoval();
}

const REMOVE_TABS=[['commits','提交删除'],['repos','移除仓库项目'],['pushes','删除一次推送记录'],['trash','回收站']];
function renderRemoval(){
  const tabs=$('#removeTabs');
  if(!tabs)return;
  tabs.innerHTML=REMOVE_TABS.map(([k,n])=>`<button class="chip ${S.removeTab===k?'on':''}" data-rtab="${k}">${n}</button>`).join('');
  $$('[data-rtab]').forEach(b=>b.onclick=()=>{S.removeTab=b.dataset.rtab;renderRemoval();});
  REMOVE_TABS.forEach(([k])=>{const p=$('#pane-'+k);if(p)p.style.display=S.removeTab===k?'':'none';});
  $('#pane-commits').style.display=S.removeTab==='commits'?'':'none';
  renderRemoveRepos();renderRemovePushes();renderTrash();
}
function renderRemoveRepos(){
  const box=$('#removeRepoList');if(!box)return;
  const list=activeRepos();
  box.innerHTML=list.length?list.map(r=>`<div class="asset-row" style="gap:10px">
      <input type="checkbox" class="cbx" data-rmrepo="${esc(r.id)}">
      ${projectMark(r,'sm')}
      <span style="flex:1;min-width:0"><b style="font-size:12px">${esc(r.name)}</b>
        <span style="color:var(--text-3);font-size:10.5px;margin-left:8px">${esc(r.group)}</span></span>
      <button class="btn btn-ghost" data-rmone="${esc(r.id)}" style="height:26px;padding:0 10px;font-size:10.5px">移除</button>
    </div>`).join(''):'<div class="empty">所有仓库都已从纳管列表移除，可到「回收站」恢复。</div>';
  $$('[data-rmone]').forEach(b=>b.onclick=()=>{
    const im=removeRepos([b.dataset.rmone]);
    refreshAfterRemoval();toast('已从纳管列表移除 '+esc(im.names.join('、'))+'，可在回收站恢复。','warn');
  });
  const btn=$('#btnRemoveSelected');
  if(btn)btn.onclick=()=>{
    const ids=$$('[data-rmrepo]:checked').map(x=>x.dataset.rmrepo);
    if(!ids.length){toast('先勾选要移除的仓库。','warn');return;}
    if(!$('#rmConfirm')||!$('#rmConfirm').checked){toast('请先勾选确认：不删除磁盘文件。','warn');return;}
    const im=removeRepos(ids);
    refreshAfterRemoval();toast('已移除 '+im.count+' 个仓库，均可在回收站恢复。','warn');
  };
}
function renderRemovePushes(){
  const box=$('#pushEventList');if(!box)return;
  const rows=PUSH_EVENTS.filter(e=>{
    const r=REPOS.find(x=>x.name===e.repo||x.id===e.repo);
    return !r||!S.removedRepos.has(r.id);
  });
  box.innerHTML=rows.map(e=>`<div class="asset-row" style="gap:9px">
      <input type="checkbox" class="cbx" data-pushrow="${e.id}">
      <span class="hist-sha">${e.sha}</span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.repo)} · ${esc(e.note)}</span>
      <span style="font-size:10.5px;color:var(--text-3);white-space:nowrap">${e.at}</span>
    </div>`).join('');
  $('#pushModes').innerHTML=PUSH_DELETE_MODES.map(m=>`<button class="mode-card ${S.pushMode===m.k?'on':''}" data-pushmode="${m.k}" style="display:block;width:100%;text-align:left">
      <div style="display:flex;align-items:center;gap:8px"><b style="font-size:12px">${m.n}</b><span class="tag ${m.tag}">${m.label}</span></div>
      <div style="font-size:10.5px;color:var(--text-2);margin-top:5px;line-height:1.5">${m.d}</div></button>`).join('');
  $$('[data-pushmode]').forEach(b=>b.onclick=()=>{S.pushMode=b.dataset.pushmode;renderRemovePushes();});
  const checked=$$('[data-pushrow]:checked').map(x=>x.dataset.pushrow);
  const ev=PUSH_EVENTS.find(x=>x.id===checked[0])||PUSH_EVENTS[0];
  const im=pushDeleteImpact(S.pushMode,checked.map(id=>PUSH_EVENTS.find(x=>x.id===id)));
  $('#pushImpact').innerHTML=`<div class="section-desc" style="margin-bottom:10px">${im.summary} · 影响范围：<b>${esc(im.scope)}</b> · ${im.reversible?'可恢复':'不可恢复'}</div>`
    +im.items.map(x=>`<div class="asset-row"><span class="tag ${im.reversible?'t-clean':'t-red'}">${im.reversible?'可恢复':'不可逆'}</span><span style="color:var(--text-2)">${esc(x)}</span></div>`).join('');
  $('#pushCmd').textContent=pushDeleteCommand(S.pushMode,ev);
  if($('#btnCopyPush'))$('#btnCopyPush').dataset.copy=$('#pushCmd').textContent;
  const exec=$('#btnPushDelete');
  if(exec){
    exec.disabled=!checked.length||S.pushMode==='commit';
    exec.onclick=()=>{
      if(S.pushMode==='remote'){
        if(!$('#pushConfirm').checked||$('#pushRepoName').value.trim()!==ev.repo){
          toast('高风险档需勾选备份确认并输入仓库名「'+esc(ev.repo)+'」。','warn');return;
        }
      }
      toast('原型已生成命令，未执行任何 Git 操作；复制后可在本机终端手动执行。','warn');
    };
  }
  const hi=$('#pushHighConfirm');
  if(hi)hi.style.display=S.pushMode==='remote'?'':'none';
}
function renderTrash(){
  const box=$('#trashList');if(!box)return;
  box.innerHTML=S.trash.length?S.trash.map(t=>`<div class="asset-row" style="gap:10px">
      <span class="tag t-amber">${t.days} 天内可恢复</span>
      <span style="flex:1;min-width:0"><b style="font-size:12px">${esc(t.name)}</b>
        <span style="color:var(--text-3);font-size:10.5px;margin-left:8px">${esc(t.at)} 移除 · 磁盘文件保留</span></span>
      <button class="btn btn-ghost" data-restore="${esc(t.id)}" style="height:26px;padding:0 10px;font-size:10.5px">恢复</button>
      <button class="btn btn-ghost" data-purge="${esc(t.id)}" style="height:26px;padding:0 10px;font-size:10.5px">清除记录</button>
    </div>`).join(''):'<div class="section-desc">回收站为空。被移除的仓库与推送记录会在这里保留 30 天。</div>';
  $$('[data-restore]').forEach(b=>b.onclick=()=>{restoreRepo(b.dataset.restore);refreshAfterRemoval();toast('已恢复仓库到纳管列表。','success');});
  $$('[data-purge]').forEach(b=>b.onclick=()=>{purgeTrash(b.dataset.purge);refreshAfterRemoval();toast('已清除工具内记录；磁盘仓库文件未改动。','warn');});
}
