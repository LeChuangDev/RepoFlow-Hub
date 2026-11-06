/* ================= v8 · 项目徽标（确定性、零依赖） =================
   每个仓库一枚彩色渐变徽标：类型决定配色与主图形，仓库 id 决定装饰纹。
   同一类型的两个仓库（如 32_Demo / Templates）也会因装饰不同而可区分。
   全部为纯函数，输出内联 SVG，不请求网络、不依赖主题变量。            */
const MARK_THEME = {
  fw:     {a:'#7B6CFF', b:'#4B3FC4', glyph:'chip',     label:'固件工程'},
  hw:     {a:'#2FA79B', b:'#146F68', glyph:'pcb',      label:'硬件工程'},
  web:    {a:'#4C8DFF', b:'#2456C8', glyph:'browser',  label:'站点'},
  tool:   {a:'#E9A23B', b:'#B96C12', glyph:'terminal', label:'工具脚本'},
  notes:  {a:'#8A63D2', b:'#5A3BA8', glyph:'doc',      label:'技术笔记'},
  assets: {a:'#DE6481', b:'#A93456', glyph:'folder',   label:'资料库'},
  repo:   {a:'#6C63FF', b:'#4B43C9', glyph:'chip',     label:'仓库'}
};

/* 主体用实心白，细节用深色叠在白色主体上，亮/暗主题下都清晰 */
const MARK_GLYPH = {
  chip:`<path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" stroke="#fff" stroke-width="1.9" stroke-linecap="round" opacity=".92"/>
    <rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2.4" fill="#fff"/>
    <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" fill="#252050" opacity=".44"/>
    <circle cx="8.5" cy="8.5" r=".9" fill="#252050" opacity=".34"/>
    <circle cx="15.5" cy="15.5" r=".9" fill="#252050" opacity=".34"/>`,
  pcb:`<rect x="2.4" y="4" width="19.2" height="16" rx="2.6" fill="#fff"/>
    <path d="M6 9h4v3h5M6 15h3M18 15h-3" stroke="#163B3A" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".48"/>
    <rect x="10" y="10.4" width="5" height="5" rx="1" fill="#163B3A" opacity=".4"/>
    <circle cx="6" cy="9" r="1.4" fill="#163B3A" opacity=".55"/>
    <circle cx="15" cy="12" r="1.4" fill="#163B3A" opacity=".55"/>
    <circle cx="18" cy="15" r="1.4" fill="#163B3A" opacity=".55"/>`,
  browser:`<rect x="2.4" y="4" width="19.2" height="16" rx="2.6" fill="#fff"/>
    <path d="M2.4 8.7h19.2" stroke="#1B2F58" stroke-width="1.3" opacity=".38"/>
    <circle cx="5.2" cy="6.4" r=".85" fill="#1B2F58" opacity=".45"/>
    <circle cx="7.6" cy="6.4" r=".85" fill="#1B2F58" opacity=".3"/>
    <circle cx="10" cy="6.4" r=".85" fill="#1B2F58" opacity=".2"/>
    <rect x="5.4" y="11" width="8" height="1.8" rx=".9" fill="#1B2F58" opacity=".42"/>
    <rect x="5.4" y="14.4" width="12" height="1.8" rx=".9" fill="#1B2F58" opacity=".26"/>
    <rect x="15.2" y="11" width="3.4" height="5.2" rx="1" fill="#1B2F58" opacity=".2"/>`,
  terminal:`<rect x="2.4" y="4" width="19.2" height="16" rx="2.6" fill="#fff"/>
    <path d="M2.4 8.7h19.2" stroke="#4A2E0C" stroke-width="1.3" opacity=".34"/>
    <path d="M6.6 12l3 2.6-3 2.6M11.2 17.4h5.4" stroke="#4A2E0C" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".58"/>`,
  doc:`<path d="M6 2.8h8l4.2 4.2v14H6z" fill="#fff"/>
    <path d="M14 2.8v4.2h4.2" fill="#321C5C" opacity=".3"/>
    <path d="M8.6 11h7M8.6 14h7M8.6 17h4.6" stroke="#321C5C" stroke-width="1.5" stroke-linecap="round" opacity=".44"/>`,
  folder:`<path d="M2.5 6.5a2 2 0 0 1 2-2h5l2 2.4h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill="#fff"/>
    <path d="M2.5 10h19" stroke="#5A1E32" stroke-width="1.3" opacity=".28"/>
    <circle cx="8" cy="14.3" r="1.6" fill="#5A1E32" opacity=".4"/>
    <path d="M5 18.6l4-4 3 2.6 3.2-3.4 3.8 4.8z" fill="#5A1E32" opacity=".32"/>`
};

function markSeed(id){
  let h=0;
  const s=String(id);
  for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;
  return h%4;
}
function markKind(r){
  if(r.id==='pcb-basics-notes')return 'notes';
  if(r.id==='jlc')return 'assets';
  return MARK_THEME[r.kind]?r.kind:'repo';
}
function escMark(s){
  return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
/* 每个仓库的图标可单独覆盖，保存在本机 localStorage，不上传、不联网。
   覆盖项是显式白名单，projectMark 接受可选的 ov 参数，便于确定性自检。 */
const MARK_KEY='repoflow-marks-v1';
let MARK_OVERRIDES={};
try{MARK_OVERRIDES=JSON.parse(localStorage.getItem(MARK_KEY)||'{}')||{}}catch(e){MARK_OVERRIDES={}}
function markOverrides(){return MARK_OVERRIDES;}
function saveMarkOverrides(){
  try{localStorage.setItem(MARK_KEY,JSON.stringify(MARK_OVERRIDES));}catch(e){/* 隐私模式下降级为内存态 */}
}
function setMarkOverride(id,patch){
  MARK_OVERRIDES[id]=Object.assign({},MARK_OVERRIDES[id]||{},patch);
  saveMarkOverrides();
}
function clearMarkOverride(id){delete MARK_OVERRIDES[id];saveMarkOverrides();}
function markAbbr(name){
  const s=String(name);
  const parts=s.match(/[A-Za-z0-9]+/g);
  if(parts&&parts.length)return parts.join('').slice(0,2).toUpperCase();
  return s.replace(/[^一-龥A-Za-z0-9]/g,'').slice(0,2)||'RF';
}
function markOptions(){
  return {themes:Object.keys(MARK_THEME),glyphs:Object.keys(MARK_GLYPH),decos:[0,1,2,3]};
}
function projectMark(r,size,ov){
  const o=ov===undefined?(MARK_OVERRIDES[r.id]||{}):(ov||{});
  const k=(o.theme&&MARK_THEME[o.theme])?o.theme:markKind(r);
  const t=MARK_THEME[k];
  const glyph=(o.glyph&&MARK_GLYPH[o.glyph])?o.glyph:t.glyph;
  const deco=(Number.isInteger(o.deco)&&o.deco>=0&&o.deco<4)?o.deco:markSeed(r.id);
  const cls=size==='sm'?'pmark sm':size==='md'?'pmark md':size==='lg'?'pmark lg':'pmark';
  const title=escMark(r.name)+' · '+t.label;
  let inner;
  if(o.image)inner=`<img src="${escMark(o.image)}" alt="">`;
  else if(o.text)inner=`<span class="pmark-text">${escMark(String(o.text).slice(0,3))}</span>`;
  else inner=`<svg viewBox="0 0 24 24" fill="none">${MARK_GLYPH[glyph]}</svg>`;
  const badge=(size==='sm'||size==='md'||o.noAbbr)?'':`<i class="pmark-abbr">${escMark(o.abbr||markAbbr(r.name))}</i>`;
  return `<span class="${cls}" data-deco="${deco}" style="--pm-a:${t.a};--pm-b:${t.b}" title="${title}" aria-hidden="true">${inner}${badge}</span>`;
}
function projectMarkByName(name,size){
  const r=REPOS.find(x=>x.name===name||x.id===name)
       ||{id:String(name),name:String(name),kind:'repo'};
  return projectMark(r,size);
}
