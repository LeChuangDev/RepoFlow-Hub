/* ================= 状态 ================= */
const S = {view:'dashboard', filter:'all', selected:new Set(), demo:false, theme:'light', q:'',
  picked:new Set([0,1,2,3]), drawer:null, cmdk:false, cmdSel:0, tasks:null,
  help:false, read:new Set(), inboxFilter:'all', planTab:'planHistory',
  snapshots:[], collapsed:new Set(), searchRepo:'all', searchRange:'all',
  strategy:'separate', syncRan:false, cmdRecent:[], cmdMode:'', undone:false,
  activeAccount:'github-primary', acctTab:'auth', wizardStep:-1, wizardPlatform:'github',
  accounts:[], scopes:new Set(['repo','read:org']),
  repoLimit:PAGE_SIZE, autoLoadMore:false,
  markEditId:null, markDraft:null,
  removedRepos:new Set(), trash:[], pushRows:[], pushMode:'reflog', removeTab:'commits',
  authed:false, authMode:'', edition:EDITION, live:false, patPlatform:'github',
  lastPicked:null, sdSel:-1, sdItems:[]};
const LS_KEY='repoflow-hub-v2';
/* 首屏进入时是否带着显式路由（分享链接）：显式路由优先于本机上次偏好 */
const BOOT_HASH=location.hash;
function save(){try{localStorage.setItem(LS_KEY,JSON.stringify({theme:S.theme,demo:S.demo,filter:S.filter,collapsed:[...S.collapsed],recent:S.cmdRecent.slice(0,8)}))}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(LS_KEY)||'{}')}catch(e){return {}}}
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* 兼容两种入参：纯路径数据（自动包 <path>）或完整 SVG 片段（原样插入）。
   之前纯路径被当作文本节点插入，导致所有动态图标只剩空白方块。 */
const icon = (path,size=18) => {
  const body = /<[a-zA-Z]/.test(path) ? path : `<path d="${path}"/>`;
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
};
const ICONS = {
  repo:'M4 4h16v16H4zM8 8h8v8H8z', fw:'M12 2v20M2 12h20M5 5l14 14', hw:'M4 6h16v12H4zM8 10h8M8 14h5',
  web:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z',
  tool:'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-3 3-3-3 3-3z'
};
let toastTimer;

