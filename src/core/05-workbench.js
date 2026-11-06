/* ================= v3 · 提交工作台 ================= */
function renderWbFiles(){
  if(!S.demo){
    $('#wbFiles').innerHTML='<div class="empty">本机 6 个仓库当前全部 clean，没有待暂存变更。切换右上角「演示态」可操作提交工作台。</div>';
  }else{
    $('#wbFiles').innerHTML=CHANGES.map((f,i)=>`<div class="file-row">
      <input type="checkbox" class="cbx file-stage" data-i="${i}" ${W.staged.has(i)?'checked':''} aria-label="暂存 ${esc(f.f)}">
      <span class="fstat st-${f.s}">${f.s}</span><span class="file-name" title="${esc(f.f)}">${esc(f.f)}</span>
      <span class="diff-n" style="color:var(--green)">+${f.a}</span><span class="diff-n" style="color:var(--red)">-${f.d}</span></div>`).join('');
    $$('.file-stage').forEach(c=>c.onchange=()=>{const i=+c.dataset.i;c.checked?W.staged.add(i):W.staged.delete(i);renderWbButtons();});
  }
  renderWbButtons();
}
function renderHooks(){
  $('#wbHooks').innerHTML=HOOKS.map((h,i)=>{
    const done=W.hookDone>i, run=W.hookRunning&&W.hookDone===i;
    const cls=done?(hookPass(i)?'pass':'fail'):(run?'run':'');
    const log=done?(hookPass(i)?h.log:'adc.c:42 未初始化变量'):(run?'running…':'queued');
    return `<div class="hook-row"><span class="hook-dot ${cls}"></span><span style="flex:1;min-width:0">
      <b style="font-weight:600">${esc(h.d)}</b><span style="color:var(--text-3);font-size:10.5px;margin-left:7px">${esc(h.n)}</span></span>
      <span class="tag ${done?(hookPass(i)?'t-clean':'t-red'):'t-grey'}">${done?(hookPass(i)?'通过':'阻断'):(run?'执行中':'等待')}</span>
      <span class="hook-log">${esc(log)}</span></div>`;
  }).join('');
  const passed=W.hookDone===HOOKS.length&&HOOKS.every((h,i)=>hookPass(i));
  $('#wbHookMeta').textContent=W.hookDone===0?'未运行':(W.hookDone<HOOKS.length?'执行中 '+W.hookDone+'/'+HOOKS.length:(passed?(HOOKS.length+'/'+HOOKS.length+' 通过'):'1 项阻断'));
  $('#wbHookMeta').style.color=W.hookDone===HOOKS.length?(passed?'var(--green)':'var(--red)'):'var(--primary)';
  renderWbButtons();
}
function runHooks(instant){
  W.hookDone=0;W.hookRunning=true;W.committed=false;
  $('#wbResult').style.display='none';
  const step=()=>{W.hookDone++;renderHooks();return W.hookDone<HOOKS.length;};
  if(instant){while(step()){}W.hookRunning=false;renderHooks();}
  else{const tick=()=>{if(step())setTimeout(tick,140);else{W.hookRunning=false;renderHooks();}};tick();}
}
function wbMessage(){
  const d=$('#wbDesc').value.trim();
  return buildCommit({type:'fw',scope:'adc',desc:d||'<简短描述>',body:'',issue:'',breaking:false});
}
function renderWbButtons(){
  const msg=wbMessage();
  $('#wbMessage').textContent=msg;
  $('#wbStagedNote').textContent='已暂存 '+W.staged.size+' 个文件';
  const ok=W.staged.size>0&&W.hookDone===HOOKS.length&&HOOKS.every((h,i)=>hookPass(i))&&$('#wbDesc').value.trim().length>0;
  $('#wbCommit').disabled=!ok;$('#wbPush').disabled=!ok;
}
function doCommit(push){
  const sha='rf'+(1000+W.staged.size*7+W.hookDone*3);
  W.committed=true;
  $('#wbResult').style.display='block';
  $('#wbResult').textContent=
    '$ git commit -m "'+wbMessage()+'"\n'
    +'[main '+sha+'] '+wbMessage()+'\n'
    +' '+W.staged.size+' files changed\n'
    +(push?'\n$ git push origin main\n→ 已触发 GitHub Actions「固件 CI」矩阵编译（模拟）':'\n→ 已提交到本地，未推送（模拟）')
    +'\n\n原型演示：未写入任何仓库，未产生真实提交对象。';
  toast('已生成模拟提交'+(push?'并推送':'')+'。','success');
}

/* ================= v3 · 历史与删除（纯函数部分可自检） ================= */
function isPushed(i){return !(S.demo&&i>=COMMITS.length-2)}
function deleteImpact(i,mode){
  const after=COMMITS.length-i-1;
  if(mode==='revert')return {after:0,hash:'0 个',force:'不需要',clone:'否',backup:'不需要',level:'低'};
  if(mode==='drop')return {after,hash:'仅本地重放',force:'不需要',clone:'否',backup:'建议',level:'中'};
  return {after,hash:after+' 个被改变',force:'需要 --force-with-lease',clone:'是',backup:'必须',level:'高'};
}
function deleteCommand(i,mode){
  const c=COMMITS[i],sha=c.sha;
  if(mode==='revert')return `# 低风险：新增反向提交，历史不变\ngit revert --no-edit ${sha}\ngit push origin main`;
  if(mode==='drop')return `# 中风险：仅适用于未推送的本地提交\ngit rebase -i ${sha}^\n# 在编辑器中把 ${sha} 那一行改为 drop，保存退出\n# 不需要 force-push`;
  return `# 高风险：会改变其后 ${COMMITS.length-i-1} 个提交哈希，原型不执行\n`
    +`# 1. 必须先导出完整备份\ngit bundle create ../backup-${sha}.bundle --all\n`
    +`# 2. 交互式变基移除目标提交\ngit rebase -i ${sha}^\n# 把 ${sha} 那一行改为 drop\n`
    +`# 3. 带租约强制推送，防止覆盖他人提交\ngit push --force-with-lease origin main`;
}
function renderHistory(){
  $('#histList').innerHTML=COMMITS.map((c,i)=>`<div class="hist-row ${i===W.histIdx?'on':''}" data-hi="${i}">
    <span class="hist-sha">${c.sha}</span><span class="hist-msg" title="${esc(c.msg)}">${esc(c.msg)}</span>
    ${c.tag?`<span class="tag ${c.tag==='HEAD'?'t-blue':'t-teal'}">${c.tag}</span>`:''}
    <span class="tag ${isPushed(i)?'t-grey':'t-amber'}">${isPushed(i)?'已推送':'本地未推送'}</span>
    <span style="font-size:10.5px;color:var(--text-3);white-space:nowrap">${c.date}</span></div>`).join('');
  $('#histCount').textContent=COMMITS.length+' 条 · 第 1 条为实测';
  $$('.hist-row').forEach(el=>el.onclick=()=>{W.histIdx=+el.dataset.hi;renderHistory();updateDelete();});
}
function renderDeleteModes(){
  $('#deleteModes').innerHTML=DELETE_MODES.map(m=>`<label class="mode-card ${m.k===W.delMode?'on':''}" data-mode="${m.k}">
    <input type="radio" name="delmode" value="${m.k}" ${m.k===W.delMode?'checked':''}>
    <span style="flex:1"><span class="mode-title">${m.t} <span class="tag ${m.cls}" style="margin-left:6px">风险 ${m.risk}</span></span>
    <span class="mode-sub" style="display:block">${m.sub}</span></span></label>`).join('');
  $$('.mode-card').forEach(el=>el.onclick=()=>{W.delMode=el.dataset.mode;W.confirmName='';W.backedUp=false;renderDeleteModes();updateDelete();});
}
function updateDelete(){
  const i=W.histIdx,mode=W.delMode,imp=deleteImpact(i,mode),c=COMMITS[i];
  $('#impactGrid').innerHTML=
    `<div><span>目标提交</span><b>${c.sha} · ${c.date}</b></div>`
    +`<div><span>后续提交哈希</span><b>${imp.hash}</b></div>`
    +`<div><span>强制推送</span><b style="color:${imp.force==='不需要'?'var(--green)':'var(--red)'}">${imp.force}</b></div>`
    +`<div><span>影响其他克隆</span><b>${imp.clone}</b></div>`
    +`<div><span>自动备份</span><b>${imp.backup}</b></div>`
    +`<div><span>风险等级</span><b>${imp.level}</b></div>`;
  $('#deleteCmd').textContent=deleteCommand(i,mode);
  if(mode==='rewrite'){
    $('#confirmBox').innerHTML=`<div class="confirm-box">
      <b style="color:var(--red);font-size:12.5px">二次确认 · 不可逆操作</b>
      <div style="font-size:11.5px;color:var(--text-2);margin:8px 0 12px;line-height:1.5">输入仓库名 <code>32_Demo</code>，并确认已导出 bundle 备份。原型无论如何都不会执行该操作。</div>
      <input class="inp" id="confirmName" placeholder="输入仓库名 32_Demo" value="${esc(W.confirmName)}" style="margin-bottom:10px">
      <label class="switch"><input type="checkbox" id="confirmBackup" ${W.backedUp?'checked':''}><span>我已导出完整备份（bundle）</span></label>
    </div>`;
    $('#confirmName').oninput=e=>{W.confirmName=e.target.value;updateBtn();};
    $('#confirmBackup').onchange=e=>{W.backedUp=e.target.checked;updateBtn();};
  }else $('#confirmBox').innerHTML='';
  updateBtn();
}
function updateBtn(){
  const need=W.delMode==='rewrite';
  const ok=!need||(W.confirmName.trim()==='32_Demo'&&W.backedUp);
  $('#btnExecuteDelete').disabled=!ok;
  $('#btnExecuteDelete').textContent=need?(ok?'执行（真机需授权）':'先完成二次确认'):'执行（真机需授权）';
}

/* ================= v3 · CI 与钩子 ================= */
function renderMatrix(){
  $('#matrixBody').innerHTML=PROJECTS.map(x=>`<tr>
    <td><div class="fname">${esc(x.n)}</div></td>
    <td style="white-space:nowrap">${esc(x.repo)}</td>
    <td style="white-space:nowrap">${esc(x.kind)}</td>
    <td style="white-space:nowrap;color:var(--text-3)">${esc(x.tool)}</td>
    <td><span class="lvl lvl-${x.level}">${x.ci}</span></td>
    <td style="color:var(--text-2)">${esc(x.why)}</td></tr>`).join('');
  const ok=PROJECTS.filter(x=>x.level==='ok').length,block=PROJECTS.filter(x=>x.level==='block').length;
  $('#matrixCount').textContent=PROJECTS.length+' 个工程 · '+ok+' 可直接编译 / '+block+' 需迁移';
}
function renderCIJobs(){
  const jobs=[
    {n:'build · 8 工程矩阵',s:'ubuntu-latest',d:'gcc-arm-none-eabi + Ninja，cmake --preset release，产出 .elf/.hex/.bin',c:'var(--green)'},
    {n:'static-check',s:'ubuntu-latest',d:'大文件门禁 + CMake 工程完整性校验',c:'var(--green)'},
    {n:'release',s:'tag v* 触发',d:'汇总产物 → SHA256SUMS → CHANGELOG → zip → Release 附件',c:'var(--blue)'},
    {n:'ESP-IDF 容器（可选）',s:'espressif/idf',d:'ESP_S3_Demo 需单独容器，耗时较高，默认不加入矩阵',c:'var(--amber)'}
  ];
  $('#ciJobs').innerHTML=jobs.map(j=>`<div class="job-row"><span class="hook-dot pass" style="background:${j.c}"></span>
    <span style="flex:1"><b style="font-weight:700">${esc(j.n)}</b><div style="font-size:10.5px;color:var(--text-3);margin-top:3px">${esc(j.d)}</div></span>
    <span class="tag t-grey" style="white-space:nowrap">${esc(j.s)}</span></div>`).join('');
  $('#releaseAssets').innerHTML=[
    ['*.elf / *.hex / *.bin','8 个工程的固件镜像'],['SHA256SUMS.txt','全部固件的校验和'],
    ['CHANGELOG.md','自上个 tag 以来的提交'],['firmware-<tag>.zip','整包附件']
  ].map(([a,b])=>`<div class="asset-row"><span class="tag t-blue" style="white-space:nowrap">${esc(a)}</span><span style="color:var(--text-2)">${esc(b)}</span></div>`).join('');
  $('#hookList').innerHTML=HOOKS.map(h=>`<div class="asset-row"><span class="tag t-grey" style="white-space:nowrap">${esc(h.g)}</span>
    <span style="flex:1"><b style="font-weight:600">${esc(h.n)}</b><div style="font-size:10.5px;color:var(--text-3)">${esc(h.d)}</div></span></div>`).join('');
}
function renderCfg(){
  $('#cfgTabs').innerHTML=CFG_FILES.map(f=>`<button class="cfg-tab ${f.k===W.cfgKey?'on':''}" data-cfg="${f.k}">${esc(f.n)}</button>`).join('');
  $$('#cfgTabs .cfg-tab').forEach(b=>b.onclick=()=>{W.cfgKey=b.dataset.cfg;renderCfg();});
  const meta=CFG_FILES.find(f=>f.k===W.cfgKey);
  $('#cfgPreview').textContent='# '+meta.hint+'\n'+CFG[W.cfgKey]();
}
function downloadCfg(){
  const meta=CFG_FILES.find(f=>f.k===W.cfgKey);
  const blob=new Blob([CFG[W.cfgKey]()],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=meta.file;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('已下载 '+esc(meta.file),'success');
}
function renderGaps(){
  const groups=[['now','本轮已补齐','t-teal'],['next','建议后续（附依据）','t-blue'],['no','明确不做（附依据）','t-grey']];
  $('#gapGroups').innerHTML=groups.map(([k,title,cls])=>`<div class="section-title">${title} <span class="tag ${cls}">${GAPS[k].length} 项</span></div>
    <div class="plan-grid" style="margin-bottom:var(--s8)">${GAPS[k].map(g=>`<div class="plan gap-card ${k}">
      <div class="plan-name">${esc(g.n)}</div><div class="section-desc" style="margin-top:var(--s3);margin-bottom:0">${esc(g.why)}</div>
    </div>`).join('')}</div>`).join('');
}

