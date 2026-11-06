/* ================= v2 · 提交生成器（纯函数，可自检） ================= */
function commitState(){
  return {type:C.type,repo:$('#cmtRepo').value,scope:$('#cmtScope').value,desc:$('#cmtDesc').value,
    body:$('#cmtBody').value,issue:$('#cmtIssue').value,breaking:$('#cmtBreak').checked};
}
function buildCommit(o){
  const desc=o.desc.trim()||'<简短描述>';
  const head=`${o.type}${o.scope.trim()?'('+o.scope.trim()+')':''}${o.breaking?'!':''}: ${desc}`;
  const lines=[head];
  if(o.body.trim())lines.push('',o.body.trim());
  if(o.issue.trim())lines.push('',`Refs: ${o.issue.trim()}`);
  if(o.breaking)lines.push('',`BREAKING CHANGE: ${o.body.trim()||desc}`);
  return lines.join('\n');
}
function commitChecks(o){
  const d=o.desc.trim();
  return [
    {ok:!!o.type,t:'已选择提交类型'},
    {ok:d.length>0,t:'已填写简短描述'},
    {ok:d.length<=50,t:`描述长度 ${d.length}/50`},
    {ok:!/[。！]$/.test(d),t:'描述结尾无中文句号'},
    {ok:o.breaking?!!o.body.trim():true,t:'破坏性变更需填写正文说明'}
  ];
}
function renderCommit(){
  const o=commitState(),text=buildCommit(o),lines=text.split('\n');
  const colon=lines[0].indexOf(': ');
  const prefix=esc(lines[0].slice(0,colon))
    .replace(/^([a-z]+)/,'<span class="tok-type">$1</span>')
    .replace(/(\([^)]*\))/,'<span class="tok-scope">$1</span>')
    .replace(/!(?=$)/,'<span class="tok-break">!</span>');
  const head=prefix+esc(lines[0].slice(colon));
  $('#cmtPreview').innerHTML=head+(lines.length>1?'\n'+lines.slice(1).map(esc).join('\n'):'');
  $('#cmtChecks').innerHTML=commitChecks(o).map(c=>`<div class="check-item ${c.ok?'ok':'bad'}"><span class="ci">${c.ok?'✓':'!'}</span>${esc(c.t)}</div>`).join('');
  return text;
}
function renderCommitInit(){
  $('#typeChips').innerHTML=COMMIT_TYPES.map(t=>`<button class="type-chip ${C.type===t.k?'on':''}" data-k="${t.k}">${t.k}<small>${t.d}</small></button>`).join('');
  $('#cmtRepo').innerHTML=REPOS.map(r=>`<option value="${r.id}" ${C.repo===r.id?'selected':''}>${esc(r.name)}</option>`).join('');
  $$('.type-chip').forEach(b=>b.onclick=()=>{C.type=b.dataset.k;renderCommitInit();});
  renderCommit();
}

