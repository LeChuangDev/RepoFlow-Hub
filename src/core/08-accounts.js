/* ================= v6 · 账号与授权 ================= */
function currentAccount(){return S.accounts.find(a=>a.id===S.activeAccount)||S.accounts[0]||null}
function renderSideAccount(){
  const a=currentAccount();
  if(!a){$('#sideAccountName').textContent='未登录';$('#sideAccountSub').textContent='登录后显示仓库';return;}
  const n=(ACCOUNT_REPOS[a.id]||activeRepos().map(r=>r.id)).length;
  $('#sideAccountAvatar').textContent=a.short||'—';
  $('#sideAccountName').textContent=a.platform==='local'?'本地离线模式':a.platform==='demo'?'演示数据':(a.state==='pending'?'未登录':a.user);
  $('#sideAccountSub').textContent=(a.platform==='github'?'GitHub':a.platform==='gitee'?'Gitee':a.platform==='demo'?'中性示例':'本机文件')+' · '+n+(a.platform==='local'?' 个演示仓库':' 个仓库');
}
function renderAccountCards(){
  const offlineNote=EDITION==='desktop'
    ?'<div class="notice" style="margin-bottom:var(--s4)"><b>离线 Windows 版：</b>本版本不连接网站、不需要任何账号，所有仓库信息来自本机文件。账号与授权页仅用于说明，登录入口已停用。</div>':'';
  if(!S.accounts.length){
    $('#accountCards').innerHTML=offlineNote+'<div class="empty">当前没有关联任何账号。登录后才会读取仓库列表。'
      +(EDITION==='desktop'?'':'<div class="action-row" style="justify-content:center;margin-top:var(--s4)"><button class="btn btn-primary" data-login="github">连接 GitHub</button><button class="btn btn-ghost" data-login="gitee">连接 Gitee</button><button class="btn btn-ghost" data-login="demo">演示数据</button></div>')
      +'</div>';
    $('#acctSummary').textContent='0 个账号 · 0 个已授权';
    renderSideAccount();
    return;
  }
  $('#accountCards').innerHTML=offlineNote+S.accounts.map(a=>{
    const count=(ACCOUNT_REPOS[a.id]||[]).length;
    return `<div class="acct-card ${a.id===S.activeAccount?'current':''} ${a.state==='revoked'?'revoked':''}">
      <span class="acct-avatar" style="background:${a.color}">${a.short}</span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:12.5px">${esc(a.label)}</b>
          <span class="tag ${a.state==='active'?'t-clean':a.state==='pending'?'t-amber':'t-red'}">${a.state==='active'?'已授权':a.state==='pending'?'待关联':'已撤销'}</span>
          ${a.id===S.activeAccount?'<span class="tag t-blue">当前</span>':''}</div>
        <div style="font-size:11px;color:var(--text-2);margin-top:4px">${esc(a.user)} @ ${esc(a.host)} · ${count} 个仓库</div>
        <div style="font-size:10.5px;color:var(--text-3);margin-top:3px">范围：${esc(a.scopes.join(', '))} · ${esc(a.exp)}</div>
        <div style="font-size:10px;color:var(--text-3);margin-top:2px;font-family:ui-monospace,Menlo,Consolas,monospace">${esc(a.store)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;flex:none">
        <button class="btn btn-ghost" style="height:28px;padding:0 10px;font-size:10.5px" data-setacct="${a.id}">设为当前</button>
        <button class="btn btn-ghost" style="height:28px;padding:0 10px;font-size:10.5px" data-revoke="${a.id}">撤销</button>
      </div></div>`;
  }).join('');
  $$('[data-setacct]').forEach(b=>b.onclick=()=>{
    S.activeAccount=b.dataset.setacct;renderAccountCards();renderSideAccount();renderRepos();
    toast('已切换到 '+esc(currentAccount().label)+'，仓库列表按该账号刷新。','success');
  });
  $$('[data-revoke]').forEach(b=>b.onclick=()=>{
    const a=S.accounts.find(x=>x.id===b.dataset.revoke);
    if(!a)return;
    if(a.id===GH_ACCOUNT_ID||a.id===GITEE_ACCOUNT_ID){logoutAll();return;}
    a.state='revoked';a.store='已清除密钥链条目';renderAccountCards();renderSideAccount();toast('已撤销 '+esc(a.label)+' 的授权。','warn');
  });
  $('#acctSummary').textContent=S.accounts.length+' 个账号 · '+S.accounts.filter(a=>a.state==='active').length+' 个已授权';
  renderSideAccount();
}
function renderAuthMethods(){
  $('#authMethodBody').innerHTML=AUTH_METHODS.map(m=>`<tr>
    <td><div class="fname">${esc(m.n)}</div><div style="font-size:10px;color:var(--text-3);margin-top:3px">${esc(m.host)}</div></td>
    <td><span class="tag ${m.secret.includes('否')?'t-clean':'t-amber'}">${esc(m.secret)}</span></td>
    <td style="color:var(--text-2)">${esc(m.flow)}</td>
    <td><span class="tag ${m.cls}">${esc(m.use)}</span><div style="font-size:10px;color:var(--text-3);margin-top:4px">${esc(m.why)}</div></td></tr>`).join('');
}
function renderScopeChips(){
  $('#scopeChips').innerHTML=DEFAULT_SCOPES.map(x=>`<span class="scope-chip ${S.scopes.has(x)?'on':''}" data-scope="${x}">${x}</span>`).join('');
  $$('[data-scope]').forEach(el=>el.onclick=()=>{
    const k=el.dataset.scope;S.scopes.has(k)?S.scopes.delete(k):S.scopes.add(k);renderScopeChips();renderByoaUrl();
  });
}
function renderByoaUrl(){
  const p=$('#wizPlatform').value,scopes=[...S.scopes].join(' ');
  const id=$('#byoaClientId').value.trim()||'YOUR_CLIENT_ID';
  const red=$('#byoaRedirect').value.trim();
  const base=p==='github'?'https://github.com/login/oauth/authorize':'https://gitee.com/oauth/authorize';
  $('#byoaUrl').textContent=base+'\n  ?client_id='+id
    +'\n  &redirect_uri='+encodeURIComponent(red)
    +'\n  &response_type=code'
    +'\n  &scope='+encodeURIComponent(scopes)
    +'\n  &state=<每次登录独立随机值>'
    +(p==='github'?'\n  &code_challenge=<BASE64URL(SHA256(verifier))>\n  &code_challenge_method=S256':'\n  # Gitee 无 PKCE：client_secret 仅在令牌交换时放入请求体');
}
function renderWizard(){
  $('#wizSteps').innerHTML=AUTH_STEPS.map((x,i)=>`<div class="wiz-step ${i<S.wizardStep?'done':i===S.wizardStep?'now':''}">
    <span class="wiz-n">${i<S.wizardStep?'✓':i+1}</span>
    <span style="flex:1"><b style="font-weight:600">${esc(x.n)}</b>
    <div style="font-size:10.5px;color:var(--text-3);margin-top:3px;line-height:1.45">${esc(x.d)}</div></span></div>`).join('');
  $('#btnNextStep').disabled=S.wizardStep>=AUTH_STEPS.length||S.wizardStep<0;
}
function finishAuth(){
  const p=$('#wizPlatform').value;
  S.wizardStep=-1;renderWizard();
  if(p==='github'){
    showPatPanel(true);
    toast('向导只说明 OAuth 流程；本页用访问令牌完成真实连接，请粘贴令牌。','warn');
    return;
  }
  toast('Gitee 真实登录尚未接入（需要后端换 token），可先用 GitHub 访问令牌或演示数据。','warn');
}

/* ================= v6 · 开源就绪 ================= */
function scanPII(){
  const data=JSON.stringify({REPOS,LIVE,COMMITS,PLATFORMS,ACCOUNTS});
  const text=data+' '+document.body.innerText;
  return [
    {n:'真实账号名 / 仓库清单',count:EDITION==='dev'?(text.match(/LeChuangDev|calcbridge|32_Demo|嘉立创资料/g)||[]).length:0},
    {n:'作者署名「樂創」（主动公开）',count:(text.match(/樂創/g)||[]).length,ok:true},
    {n:'本机绝对路径',count:(text.match(/C:\\Users\\zhang/g)||[]).length},
    {n:'真实短哈希',count:(text.match(/\b[0-9a-f]{7}\b/g)||[]).length}
  ];
}
function renderPII(rows){
  $('#piiTable').innerHTML=rows.map(r=>`<div class="oss-row"><span class="oss-state"><span class="tag ${r.ok?'t-clean':r.count?'t-red':'t-clean'}">${r.ok?'已公开':r.count?'需处理':'已清除'}</span></span>
    <span style="flex:1"><b>${esc(r.n)}</b></span><b style="font-family:var(--font-display);color:${r.ok?'var(--green)':r.count?'var(--red)':'var(--green)'}">${r.count} 处</b></div>`).join('');
}
function renderOSS(){
  $('#ossChecklist').innerHTML=OSS_CHECKLIST.map(c=>`<div class="oss-row"><span class="oss-state"><span class="tag ${c.st==='pass'?'t-clean':c.st==='plan'?'t-blue':'t-red'}">${c.st==='pass'?'就绪':c.st==='plan'?'待补':'需处理'}</span></span>
    <span style="flex:1"><b>${esc(c.n)}</b><div style="font-size:10.5px;color:var(--text-3);margin-top:3px">${esc(c.why)}</div></span></div>`).join('');
  $('#sanitizeCmd').textContent='# 生成可开源分发的脱敏副本\npython templates/sanitize.py\n'
    +'# 输出：prototype/index.public.html\n'
    +'# 本轮基线（工作副本源码）：'+JSON.stringify(PII_BASELINE);
  renderPII(scanPII());
}
function renderAcctTabs(){
  $('#acctTabs').innerHTML=[['auth','账号与授权'],['oss','开源就绪']].map(([k,n])=>`<button class="acct-tab ${S.acctTab===k?'on':''}" data-atab="${k}">${n}</button>`).join('');
  $$('[data-atab]').forEach(b=>b.onclick=()=>{S.acctTab=b.dataset.atab;renderAcctTabs();});
  $('#acctPaneAuth').style.display=S.acctTab==='auth'?'':'none';
  $('#acctPaneOSS').style.display=S.acctTab==='oss'?'':'none';
  if(S.acctTab==='oss')renderOSS();
}
function renderAccounts(){
  renderAcctTabs();renderAccountCards();renderAuthMethods();renderScopeChips();renderByoaUrl();renderWizard();renderOSS();
}

