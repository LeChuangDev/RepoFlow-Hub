/* ================= 本地文件夹只读扫描 =================
   浏览器无法执行 git 命令，这里用 File System Access API 读取所选目录里
   .git 的文本文件（HEAD / config / refs / logs / COMMIT_EDITMSG），
   还原仓库名、当前分支、远端地址与最近一次提交。
   不支持目录选择器的环境（Firefox / Safari / 部分 file:// 场景）退回到
   webkitdirectory 文件选择，从相对路径里识别 .git。
   限制：脏工作区、未推送提交、准确体积需要真正运行 git，页面里不伪造。
   安全：只读，不请求写权限，不上传任何内容。                        */
let LOCAL_DIR_HANDLE=null;

function parseGitHead(text){
  const t=String(text||'').trim();
  if(!t)return '—';
  if(t.startsWith('ref: '))return t.slice(5).replace(/^refs\/heads\//,'');
  return t.slice(0,7)+'（游离）';
}

function gitRemoteFromConfig(text){
  const m=String(text||'').match(/^\s*url\s*=\s*(.+)$/m);
  return m?m[1].trim():'';
}

function parseGitLogLine(line){
  const m=String(line||'').match(/\s(\d{9,})\s+[+-]\d{4}\s+([^]*)$/);
  if(!m)return null;
  const msg=m[2].replace(/^\s*commit:\s*/,'').trim();
  const date=new Date(Number(m[1])*1000).toISOString().slice(0,10);
  return {date:date,msg:msg};
}

function buildLocalRepo(name,headText,cfgText,logText,commitEditText,branchCount){
  let commit=null;
  if(logText){
    const lines=String(logText).trim().split('\n');
    commit=parseGitLogLine(lines[lines.length-1]);
  }
  if(!commit||!commit.msg){
    const first=String(commitEditText||'').trim().split('\n')[0];
    if(first)commit=Object.assign({},commit||{date:''},{msg:first});
  }
  return {
    id:'lf-'+name,name:name,group:'本地工程',remote:gitRemoteFromConfig(cfgText)||'（未配置远端）',
    branch:parseGitHead(headText),date:(commit&&commit.date)||new Date().toISOString().slice(0,10),
    msg:(commit&&commit.msg)||'（没有读取到提交说明）',size:'—',sizeMB:0.05,
    files:0,branches:Math.max(1,branchCount||0),attrs:false,kind:'tool',live:true,local:true,
    demo:{dirty:0,ahead:0,pr:0}
  };
}

async function readTextFile(dir,parts){
  try{
    let h=dir;
    for(const p of parts.slice(0,-1))h=await h.getDirectoryHandle(p);
    const f=await h.getFileHandle(parts[parts.length-1]);
    return await (await f.getFile()).text();
  }catch(err){return '';}
}

async function hasGitDir(dir){
  try{await dir.getDirectoryHandle('.git');return true;}catch(err){return false;}
}

async function countRefFiles(dir,depth){
  let n=0;
  for await(const [,h] of dir.entries()){
    if(h.kind==='file')n++;
    else if(depth>0)n+=await countRefFiles(h,depth-1);
  }
  return n;
}

async function readGitRepo(dir,name){
  const git=await dir.getDirectoryHandle('.git');
  const head=await readTextFile(git,['HEAD']);
  const cfg=await readTextFile(git,['config']);
  const log=await readTextFile(git,['logs','HEAD']);
  const commitEdit=await readTextFile(git,['COMMIT_EDITMSG']);
  let branches=0;
  try{branches=await countRefFiles(await (await git.getDirectoryHandle('refs')).getDirectoryHandle('heads'),1);}catch(err){branches=0;}
  return buildLocalRepo(name,head,cfg,log,commitEdit,branches);
}

async function scanLocalDirectory(root){
  const found=[];
  if(await hasGitDir(root))found.push(await readGitRepo(root,root.name));
  if(!found.length){
    for await(const [name,h] of root.entries()){
      if(h.kind!=='directory')continue;
      if(name==='node_modules'||name.startsWith('.')||name==='dist')continue;
      if(await hasGitDir(h))found.push(await readGitRepo(h,name));
      if(found.length>=60)break;
    }
  }
  if(!found.length){
    for await(const [name,h] of root.entries()){
      if(h.kind!=='directory'||name==='node_modules'||name.startsWith('.')||name==='dist')continue;
      for await(const [sub,sh] of h.entries()){
        if(sh.kind!=='directory'||sub.startsWith('.'))continue;
        if(await hasGitDir(sh))found.push(await readGitRepo(sh,name+'/'+sub));
        if(found.length>=60)break;
      }
      if(found.length>=60)break;
    }
  }
  return found;
}

/* webkitdirectory 兜底：从相对路径识别 .git，读取关键文本 */
async function collectReposFromFiles(files){
  const groups=new Map();
  for(const file of files){
    const parts=String(file.webkitRelativePath||file.name||'').split('/');
    const gi=parts.indexOf('.git');
    if(gi<1)continue;
    const root=parts.slice(0,gi).join('/');
    if(!groups.has(root))groups.set(root,{name:parts.slice(0,gi).pop(),files:{},heads:new Set()});
    const g=groups.get(root);
    const rel=parts.slice(gi+1).join('/');
    if(rel==='HEAD'||rel==='config'||rel==='COMMIT_EDITMSG'||rel==='logs/HEAD')g.files[rel]=file;
    if(rel.startsWith('refs/heads/'))g.heads.add(rel);
  }
  const repos=[];
  for(const g of groups.values()){
    const text=async f=>f?await f.text():'';
    repos.push(buildLocalRepo(g.name,await text(g.files['HEAD']),await text(g.files['config']),
      await text(g.files['logs/HEAD']),await text(g.files['COMMIT_EDITMSG']),g.heads.size));
  }
  return repos;
}

function applyLocalScan(rootName,repos){
  S.demo=false;S.live=false;S.local=true;S.localName=rootName;
  const acct={id:'local-folder',platform:'local',host:'本地文件夹',user:rootName,
    label:'本地文件夹 · '+rootName,state:'active',scopes:['只读扫描 .git'],
    color:'#2E9E96',short:'LF',exp:'不适用',store:'只读，不保存授权'};
  S.accounts=[acct];
  S.activeAccount='local-folder';S.authed=true;S.authMode='local';
  ACCOUNT_REPOS['local-folder']=repos.map(r=>r.id);
  REPOS.length=0;repos.forEach(r=>REPOS.push(r));
  S.removedRepos.clear();S.selected.clear();S.repoLimit=PAGE_SIZE;
  hideGate();renderAccountCards();renderSideAccount();renderAll();renderDemoState();renderLiveNote();rerenderRendered();
}

async function pickLocalFolderViaInput(){
  const input=document.createElement('input');
  input.type='file';input.webkitdirectory=true;input.multiple=true;input.style.display='none';
  document.body.appendChild(input);
  input.onchange=async()=>{
    const files=Array.from(input.files||[]);
    input.remove();
    if(!files.length)return;
    toast('正在只读扫描所选目录…','success');
    const repos=await collectReposFromFiles(files);
    if(!repos.length){toast('没有识别到 .git，请选择包含仓库的目录。','warn');return;}
    LOCAL_DIR_HANDLE=null;
    applyLocalScan(repos[0].name||'本地文件夹',repos);
    toast('已扫描 '+repos.length+' 个本地仓库（只读，不会修改任何文件）。','success');
  };
  input.click();
}

async function pickLocalFolder(){
  if(!('showDirectoryPicker' in window)){
    await pickLocalFolderViaInput();
    return;
  }
  let root=null;
  try{
    root=await window.showDirectoryPicker({mode:'read',id:'repoflow-local-scan'});
  }catch(err){
    if(err&&err.name==='AbortError')return;
    await pickLocalFolderViaInput();
    return;
  }
  toast('正在只读扫描「'+esc(root.name)+'」…','success');
  const repos=await scanLocalDirectory(root);
  if(!repos.length){
    toast('没有在该文件夹或其一级子目录里找到 .git，换个目录再试。','warn');
    return;
  }
  LOCAL_DIR_HANDLE=root;
  applyLocalScan(root.name,repos);
  toast('已扫描 '+repos.length+' 个本地仓库（只读，不会修改任何文件）。','success');
}
