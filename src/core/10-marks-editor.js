/* ================= v9 · 项目图标编辑器（离线、按仓库持久化） ================= */
const MARK_GLYPH_NAME={chip:'芯片',pcb:'电路板',browser:'浏览器',terminal:'终端',doc:'文档',folder:'资料夹'};
const MARK_THEME_NAME={fw:'靛紫',hw:'青绿',web:'蓝',tool:'琥珀',notes:'紫罗兰',assets:'玫红',repo:'默认紫'};

function markEditorRepos(){return REPOS.filter(r=>!S.removedRepos.has(r.id));}
function markDraftOf(){
  if(!S.markDraft)S.markDraft=Object.assign({},MARK_OVERRIDES[S.markEditId]||{});
  return S.markDraft;
}
function refreshMarks(){
  closeDrawer();
  renderAll();renderTimeline();
  if(typeof renderSearch==='function')renderSearch();
  rerenderRendered();
}
function openMarkEditor(focusId){
  const list=markEditorRepos();
  if(!list.length){toast('当前没有可编辑的仓库。','warn');return;}
  S.markEditId=(focusId&&REPOS.some(r=>r.id===focusId))?focusId:list[0].id;
  S.markDraft=null;
  openDrawer('marks');
  $('#drawerTitle').textContent='项目图标';
  $('#drawerRemote').textContent='配色 / 图形 / 装饰 / 缩写 / 本地图片 · 按仓库分别保存到本机';
  renderMarkEditor();
}
function renderMarkEditor(){
  const list=markEditorRepos();
  const r=REPOS.find(x=>x.id===S.markEditId)||list[0];
  if(!r)return;
  S.markEditId=r.id;
  const d=markDraftOf(),opt=markOptions();
  const theme=(d.theme&&MARK_THEME[d.theme])?d.theme:markKind(r);
  const glyph=(d.glyph&&MARK_GLYPH[d.glyph])?d.glyph:MARK_THEME[theme].glyph;
  const deco=Number.isInteger(d.deco)?d.deco:markSeed(r.id);
  $('#drawerBody').innerHTML=`
    <div class="section-desc">点选仓库后自定义图标。所有改动只写入本机浏览器存储，离线版与网站版互不共享。</div>
    <div class="mark-list" style="margin:var(--s3) 0 var(--s5)">
      ${list.map(x=>`<div class="mark-item ${x.id===r.id?'on':''}" data-mrepo="${esc(x.id)}">${projectMark(x,'sm')}<span class="txt">${esc(x.name)}</span></div>`).join('')}
    </div>
    <div class="drawer-sec">实时预览</div>
    <div class="mark-preview" style="margin-bottom:var(--s4)">
      ${projectMark(r,'lg',d)}
      <div style="min-width:0"><b style="font-family:var(--font-display);font-size:14px">${esc(r.name)}</b>
        <div style="font-size:11px;color:var(--text-3);margin-top:4px">${esc(MARK_THEME[theme].label)} · ${esc(MARK_GLYPH_NAME[glyph]||glyph)} · 装饰 ${deco+1}</div></div>
    </div>
    <div class="mark-label">配色</div>
    <div class="mark-opt">${opt.themes.map(k=>`<button data-mtheme="${k}" class="${k===theme?'on':''}"><i class="mark-swatch" style="background:linear-gradient(145deg,${MARK_THEME[k].a},${MARK_THEME[k].b})"></i>${esc(MARK_THEME_NAME[k]||k)}</button>`).join('')}</div>
    <div class="mark-label">图形</div>
    <div class="mark-opt">${opt.glyphs.map(k=>`<button data-mglyph="${k}" class="${k===glyph?'on':''}">${esc(MARK_GLYPH_NAME[k]||k)}</button>`).join('')}</div>
    <div class="mark-label">装饰纹</div>
    <div class="mark-opt">${opt.decos.map(n=>`<button data-mdeco="${n}" class="${n===deco?'on':''}">样式 ${n+1}</button>`).join('')}</div>
    <div class="mark-label">缩写角标（2 字符）与自定义文字</div>
    <div style="display:flex;gap:8px;margin:6px 0 12px">
      <input class="input-apple" id="markAbbr" maxlength="2" style="width:88px;flex:none" value="${esc(d.abbr||markAbbr(r.name))}" placeholder="缩写">
      <input class="input-apple" id="markText" maxlength="3" style="flex:1;min-width:0" value="${esc(d.text||'')}" placeholder="留空则显示图形">
    </div>
    <div class="mark-label">本地图片（不上传，仅存本机）</div>
    <div class="action-row" style="margin:6px 0 12px">
      <label class="btn btn-ghost" style="height:32px;padding:0 12px;font-size:11.5px;display:inline-flex;align-items:center;cursor:pointer">选择图片<input type="file" id="markFile" accept="image/*" style="display:none"></label>
      <button class="btn btn-ghost" id="markClearImage" style="height:32px;padding:0 12px;font-size:11.5px">清除图片</button>
    </div>
    <div class="notice" style="font-size:11px">上传的图片以 data URL（内嵌数据）保存在本机，不产生网络请求；建议小于 200 KB，避免占用浏览器存储配额。</div>
    <div class="action-row" style="margin-top:var(--s5)">
      <button class="btn btn-primary" id="markSave">保存到本机</button>
      <button class="btn btn-ghost" id="markReset">恢复默认</button>
    </div>`;
  $('#drawerFoot').innerHTML='';

  $$('[data-mrepo]').forEach(b=>b.onclick=()=>{
    S.markEditId=b.dataset.mrepo;S.markDraft=null;renderMarkEditor();
  });
  $$('[data-mtheme]').forEach(b=>b.onclick=()=>{markDraftOf().theme=b.dataset.mtheme;delete markDraftOf().image;renderMarkEditor();});
  $$('[data-mglyph]').forEach(b=>b.onclick=()=>{markDraftOf().glyph=b.dataset.mglyph;delete markDraftOf().image;delete markDraftOf().text;renderMarkEditor();});
  $$('[data-mdeco]').forEach(b=>b.onclick=()=>{markDraftOf().deco=Number(b.dataset.mdeco);renderMarkEditor();});
  $('#markAbbr').oninput=e=>{markDraftOf().abbr=e.target.value.slice(0,2);};
  $('#markText').oninput=e=>{
    const v=e.target.value.slice(0,3);
    if(v)markDraftOf().text=v;else delete markDraftOf().text;
    const box=$('.mark-preview'),old=box&&box.querySelector('.pmark');
    if(old)old.outerHTML=projectMark(r,'lg',markDraftOf());
  };
  $('#markFile').onchange=e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    if(f.size>512*1024){toast('图片超过 512 KB，已拒绝以避免占满本机存储。','warn');return;}
    const reader=new FileReader();
    reader.onload=()=>{markDraftOf().image=String(reader.result);delete markDraftOf().text;renderMarkEditor();};
    reader.readAsDataURL(f);
  };
  $('#markClearImage').onclick=()=>{delete markDraftOf().image;renderMarkEditor();};
  $('#markSave').onclick=()=>{
    const d=markDraftOf();
    d.abbr=$('#markAbbr').value.slice(0,2)||markAbbr(r.name);
    if($('#markText').value)d.text=$('#markText').value.slice(0,3);else delete d.text;
    setMarkOverride(r.id,d);
    S.markDraft=null;
    refreshMarks();
    toast('已保存 '+esc(r.name)+' 的项目图标。','success');
  };
  $('#markReset').onclick=()=>{
    clearMarkOverride(r.id);S.markDraft=null;refreshMarks();
    toast('已恢复 '+esc(r.name)+' 的默认图标。','success');
  };
}
