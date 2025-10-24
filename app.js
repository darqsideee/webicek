const cfg={
  discordClientId:"1431308039927107719",
  redirectUri:"http://127.0.0.1:5500/index.html#home",
  scopes:["identify","guilds","guilds.members.read"],
  discordInvite:"https://discord.gg/rSHWAYWzP4",
  guildId:"1330612477578313789", // Target guild for members/admin checks
  adminRoleId:"1399465075722551376",
  logsRoleId:"1399463718978588804",
  closedHistoryRoleId:"1400548624248737922",
  api:"https://discord.com/api"
};
const qs=(sel,root=document)=>root.querySelector(sel);
const qsa=(sel,root=document)=>[...root.querySelectorAll(sel)];
const S={
  home:qs("#home"),
  features:qs("#features"),
  about:qs("#about"),
  rules:qs("#rules"),
  dashboard:qs("#dashboard"),
  gallery:qs('#gallery'),
  news:qs('#news'),
  tickets:qs('#tickets'),
  admin:qs('#admin'),
  loginBtn:qs("#login-btn"),
  logoutBtn:qs("#logout-btn"),
  navDash:qs("#nav-dashboard"),
  heroDiscord:qs("#hero-discord"),
  heroLogin:qs("#hero-login"),
  chipRefresh:qs("#chip-refresh"),
  chipAdmin:qs("#chip-admin"),
  adminPanel:qs("#admin-panel"),
  adminLogs:qs('#admin-logs'),
  logsList:qs('#logs-list'),
  avatar:qs("#user-avatar"),
  uname:qs("#user-name"),
  uid:qs("#user-id"),
  staffNote:qs('#staff-note'),
  staffActions:qs('#staff-actions'),
  btnOpenAdmin:qs('#btn-open-admin'),
  guilds:qs("#guilds"),
  perm:qs("#perm-scope"),
  statFirstJoined:qs('#stat-first-joined'),
  statLastJoined:qs('#stat-last-joined'),
  year:qs("#year"),
  // Gallery
  galleryGuard:qs('#gallery-guard'),
  galleryForm:qs('#gallery-form'),
  galImage:qs('#gal-image'),
  galFile:qs('#gal-file'),
  galCaption:qs('#gal-caption'),
  galPost:qs('#gal-post'),
  galleryList:qs('#gallery-list'),
  // News
  newsAdmin:qs('#news-admin'),
  newsImage:qs('#news-image'),
  newsHead:qs('#news-head'),
  newsBody:qs('#news-body'),
  newsPost:qs('#news-post'),
  newsList:qs('#news-list'),
  newsPager:qs('#news-pager')
};
// Header UI
const HP={pill:qs('#user-pill'),pillImg:qs('#pill-avatar'),pillName:qs('#pill-name'),navDash:qs('#nav-dashboard'),loginBtn:qs('#login-btn'),logoutBtn:qs('#logout-btn')};
// Alerts
const Alert={box:qs('#alert'),text:qs('#alert-text')};
function px(v){return Math.max(0,Math.min(1,v))}
// simple app state
const STATE={current:null,isStaff:false,canSeeLogs:false};

// Tickets selectors
const T={
  openBtn:qs('#btn-open-ticket'),
  history:qs('#ticket-history'),
  modal:qs('#ticket-modal'),
  mType:qs('#tm-type'), mReason:qs('#tm-reason'), mImage:qs('#tm-image'),
  mCreate:qs('#tm-create'), mCancel:qs('#tm-cancel')
};
// Admin selectors
const A={
  guard:qs('#admin-guard'), wrap:qs('#admin-wrap'),
  timer:qs('#admin-timer'), solved:qs('#admin-solved'),
  list:qs('#admin-tickets'), logs:qs('#admin-logs'), logsList:qs('#logs-list'),
  closedPanel:qs('#admin-closed'), closedList:qs('#admin-closed-list'),
  dUser:qs('#ad-discord-user'), dReason:qs('#ad-discord-reason'), dKick:qs('#ad-discord-kick'), dBan:qs('#ad-discord-ban'),
  fId:qs('#ad-fivem-id'), fReason:qs('#ad-fivem-reason'), fKick:qs('#ad-fivem-kick'), fBan:qs('#ad-fivem-ban'), fAnn:qs('#ad-fivem-announce')
};

// Ticket chat selectors
const TC={
  modal:qs('#ticket-chat'),
  title:qs('#tc-title'),
  list:qs('#tc-messages'),
  input:qs('#tc-input'),
  send:qs('#tc-send'),
  start:qs('#tc-start'),
  solve:qs('#tc-solve'),
  close:qs('#tc-close'),
  currentId:null
};

// Ticket local storage
const TStore={
  all(){return store.get('ns_tickets',[])},
  save(v){store.set('ns_tickets',v)},
  seq(){ const n=store.get('ns_ticket_seq',0)+1; store.set('ns_ticket_seq',n); return n; },
  create({userId,user,type,reason,image}){
    const v=this.all();
    const t={
      id:`t_${Date.now()}`,
      no:this.seq(),
      userId, user,
      type, reason, image:image||null,
      status:'open',
      ts:Date.now(),
      startedTs:null, startedBy:null,
      solvedTs:null, solvedBy:null,
      messages:[{by:'system',text:`Ticket created by ${user} • Reason: ${reason}`,ts:Date.now()}]
    };
    v.push(t); this.save(v); return t;
  },
  byUser(uid){return this.all().filter(t=>t.userId===uid).sort((a,b)=>b.ts-a.ts)},
  open(){return this.all().filter(t=>t.status==='open').sort((a,b)=>b.ts-a.ts)},
  closed(){return this.all().filter(t=>t.status==='closed').sort((a,b)=>b.solvedTs-a.solvedTs)},
  close(id,by){const v=this.all(); const t=v.find(x=>x.id===id); if(t){t.status='closed'; t.solvedTs=Date.now(); t.solvedBy=by||'Staff'; (t.messages||(t.messages=[])).push({by:'system',text:`Solved by ${t.solvedBy}`,ts:Date.now()}); this.save(v);} return t},
  start(id,by){const v=this.all(); const t=v.find(x=>x.id===id); if(t && !t.startedTs){ t.startedTs=Date.now(); t.startedBy=by||'Staff'; (t.messages||(t.messages=[])).push({by:'system',text:`${t.startedBy} started solving`,ts:Date.now()}); this.save(v);} return t},
  addMsg(id,byName,byId,role,text){const v=this.all(); const t=v.find(x=>x.id===id); if(!t) return; (t.messages||(t.messages=[])).push({by:byName, byId, role, text, ts:Date.now()}); this.save(v); return t}
};

let __adminTimer=null, __adminStart=null;
function startAdminTimer(){
  if(!A.timer) return;
  if(__adminTimer) clearInterval(__adminTimer);
  __adminStart=Date.now();
  const tick=()=>{
    const m=Math.floor((Date.now()-__adminStart)/60000);
    A.timer.textContent=`${m}m`;
  };
  tick();
  __adminTimer=setInterval(tick,15000);
}

function showTicketModal(v){
  if(!T.modal) return;
  if(v){ T.modal.classList.remove('hidden'); }
  else { T.modal.classList.add('hidden'); T.mReason.value=''; T.mImage.value=''; T.mType.value='Bugs'; }
}

function ticketItemEl(t,opts={}){
  const wrap=document.createElement('div');
  wrap.className='guild';
  const meta=document.createElement('div');
  const solverInfo = t.solvedBy? ` • Solved by ${t.solvedBy}`: '';
  meta.innerHTML=`<div class="g-name">#${t.no} • ${t.type} • ${new Date(t.ts).toLocaleString()}${solverInfo}</div><div class="g-id">${t.reason}</div>`;
  wrap.appendChild(meta);
  if(t.image){ const img=document.createElement('img'); img.src=t.image; img.alt='evidence'; img.style.width='46px'; img.style.height='46px'; img.style.borderRadius='8px'; wrap.insertBefore(img,meta); }
  wrap.style.cursor='pointer';
  wrap.addEventListener('click',()=> openTicketChat(t.id, !!opts.adminView));
  if(t.status==='closed'){
    const badge=document.createElement('span'); badge.className='chip'; badge.textContent='Closed'; badge.style.marginLeft='auto';
    wrap.appendChild(badge);
  }
  return wrap;
}

function renderMyTickets(me){
  if(!T.history||!me) return;
  const uid=me.id||String(me);
  const items=TStore.byUser(uid);
  if(items.length===0){ T.history.textContent='No tickets yet.'; return; }
  T.history.textContent='';
  items.forEach(t=>{ T.history.appendChild(ticketItemEl(t)); });
}

function renderAdminTickets(){
  if(!A.list) return;
  const items=TStore.open();
  if(items.length===0){ A.list.textContent='No open tickets.'; return; }
  A.list.textContent='';
  items.forEach(t=>{ A.list.appendChild(ticketItemEl(t,{adminView:true})); });
}

function renderClosedTickets(){
  if(!A.closedList) return;
  const items=TStore.closed();
  if(items.length===0){ A.closedList.textContent='No closed tickets.'; return; }
  A.closedList.textContent='';
  items.forEach(t=>{ A.closedList.appendChild(ticketItemEl(t,{adminView:true})); });
}

function openTicketChat(id,isAdmin){
  const t=TStore.all().find(x=>x.id===id); if(!t||!TC.modal) return;
  TC.currentId=t.id;
  TC.title.textContent=`Ticket #${t.no} • ${t.type}`;
  TC.list.textContent='';
  (t.messages||[]).forEach(m=>{
    const row=document.createElement('div'); row.className='msg'+(m.byId===STATE.current?.id?' me':'');
    const b=document.createElement('div'); b.className='bubble'+(m.by==='system'?' system':'');
    const meta=document.createElement('div'); meta.className='meta'; meta.textContent = m.by==='system'? 'System' : `${m.by} • ${new Date(m.ts).toLocaleTimeString()}`;
    const body=document.createElement('div'); body.textContent=m.text;
    b.appendChild(meta); b.appendChild(body); row.appendChild(b); TC.list.appendChild(row);
  });
  // controls visibility
  if(TC.start) TC.start.style.display = (isAdmin && !t.startedTs && t.status==='open')? 'inline-flex' : 'none';
  if(TC.solve) TC.solve.style.display = (isAdmin && t.status==='open')? 'inline-flex' : 'none';
  if(TC.input) { TC.input.disabled = (t.status==='closed'); TC.input.placeholder = t.status==='closed' ? 'Ticket is closed' : 'Type a message...'; }
  if(TC.send) { TC.send.disabled = (t.status==='closed'); }
  // autoscroll
  try{ TC.list.scrollTop = TC.list.scrollHeight; }catch{}
  TC.modal.classList.remove('hidden');
}

function closeTicketChat(){ TC.modal?.classList.add('hidden'); TC.currentId=null; TC.input.value=''; }


function wireRulesTabs(){
  const tabs=qsa('.tab');
  tabs.forEach(b=>b.addEventListener('click',()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    b.classList.add('active');
    const id=b.getAttribute('data-tab');
    qsa('.tab-panel').forEach(p=>p.classList.remove('active'));
    const panel=qs('#'+id); panel&&panel.classList.add('active');
  }));
}

// Gallery storage helpers
const store={
  get(key,def){try{return JSON.parse(localStorage.getItem(key)||'null')??def}catch{return def}},
  set(key,val){localStorage.setItem(key,JSON.stringify(val))}
};
function renderGallery(){
  const items=store.get('ns_gallery',[]);
  if(!S.galleryList) return;
  S.galleryList.innerHTML='';
  items.slice().reverse().forEach(it=>{
    const card=document.createElement('div');card.className='card';
    const img=document.createElement('img');img.src=it.image;img.alt='';img.style.width='100%';img.style.borderRadius='10px';
    img.style.cursor='zoom-in';
    img.addEventListener('click',()=>openLightbox(it.image,it.caption||''));
    const cap=document.createElement('div');cap.className='card-text';cap.textContent=it.caption||'';
    const meta=document.createElement('div');meta.className='muted';meta.style.marginTop='6px';meta.textContent=`by ${it.user}`;
    // delete if owner or staff
    const canDel = (STATE.current && (STATE.current.id===it.uploaderId)) || STATE.isStaff;
    if(canDel){
      const del=document.createElement('button'); del.className='btn btn-outline'; del.textContent='Delete'; del.style.marginTop='6px';
      del.addEventListener('click',()=>{ deleteGallery(it.id); });
      card.appendChild(del);
    }
    card.appendChild(img);card.appendChild(cap);card.appendChild(meta);
    S.galleryList.appendChild(card);
  });
}
function addGallery(image,caption,user){
  const items=store.get('ns_gallery',[]);
  const id=`g_${Date.now()}`;
  items.push({id,image,caption,user,uploaderId:STATE.current?.id||null,ts:Date.now()});
  store.set('ns_gallery',items);
  renderGallery();
}
function deleteGallery(id){ const items=store.get('ns_gallery',[]).filter(x=>x.id!==id); store.set('ns_gallery',items); renderGallery(); }

function parseNewsBody(src){
  const lines=src.split(/\r?\n/);
  const html=lines.map(l=>{
    if(/^#\s*(.+)/.test(l)) return `<h3>$1</h3>`.replace('$1',l.replace(/^#\s*/,''));
    let t=l.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    return `<p>${t}</p>`;
  }).join('');
  return html;
}
const NEWS_PAGE_SIZE=5;
function renderNews(page=1){
  const all=store.get('ns_news',[]).slice().reverse();
  if(!S.newsList) return;
  const pages=Math.max(1,Math.ceil(all.length/NEWS_PAGE_SIZE));
  const p=Math.min(Math.max(1,page),pages);
  STATE.newsPage=p;
  S.newsList.innerHTML='';
  const start=(p-1)*NEWS_PAGE_SIZE; const items=all.slice(start,start+NEWS_PAGE_SIZE);
  items.forEach(n=>{
    const card=document.createElement('div');card.className='news-card';
    if(n.image){const img=document.createElement('img');img.src=n.image;img.alt='';card.appendChild(img)}
    const head=document.createElement('h3');head.textContent=n.head;card.appendChild(head);
    const body=document.createElement('div');body.className='news-body';body.innerHTML=parseNewsBody(n.body);card.appendChild(body);
    const meta=document.createElement('div');meta.className='muted';meta.textContent=`by ${n.user}`;card.appendChild(meta);
    S.newsList.appendChild(card);
  });
  // pager
  if(S.newsPager){
    S.newsPager.innerHTML='';
    if(pages>1){
      const prev=document.createElement('button'); prev.className='btn btn-outline'; prev.textContent='Prev'; prev.disabled=p<=1; prev.addEventListener('click',()=>renderNews(p-1));
      const next=document.createElement('button'); next.className='btn btn-outline'; next.textContent='Next'; next.disabled=p>=pages; next.addEventListener('click',()=>renderNews(p+1));
      const info=document.createElement('span'); info.className='muted'; info.style.margin='0 8px'; info.textContent=`Page ${p}/${pages}`;
      S.newsPager.appendChild(prev); S.newsPager.appendChild(info); S.newsPager.appendChild(next);
    }
  }
}
function addNews(image,head,body,user){
  const items=store.get('ns_news',[]);
  items.push({image,head,body,user,ts:Date.now()});
  store.set('ns_news',items);
  renderNews(1);
}
function parseHash(h){return h.replace(/^#/,'').split('&').reduce((a,p)=>{const[k,v]=p.split('=');if(k)a[decodeURIComponent(k)]=decodeURIComponent(v||'');return a},{});} 
function clearHash(){history.replaceState(null,document.title,location.pathname+location.search)}
function token(){return localStorage.getItem("ns_token")}
function setToken(t){if(t)localStorage.setItem("ns_token",t);else localStorage.removeItem("ns_token")}
function authUrl(){const u=new URL("https://discord.com/oauth2/authorize");u.searchParams.set("client_id",cfg.discordClientId);u.searchParams.set("redirect_uri",cfg.redirectUri);u.searchParams.set("response_type","token");u.searchParams.set("scope",cfg.scopes.join(" "));u.searchParams.set("prompt","consent");return u.toString()}
async function apiGet(path){const t=token();if(!t)throw new Error("no_token");const r=await fetch(`${cfg.api}${path}`,{headers:{Authorization:`Bearer ${t}`}});if(!r.ok)throw new Error("api_error");return r.json()}
function setDiscordLinks(){const invite=cfg.discordInvite||"https://discord.com";if(S.heroDiscord) S.heroDiscord.href=invite}
function setLoginLinks(){const u=authUrl();if(S.heroLogin) S.heroLogin.href=u; if(S.loginBtn) S.loginBtn.href=u}
function showDashboard(v){S.dashboard.hidden=!v;S.logoutBtn.hidden=!v; if(S.loginBtn) S.loginBtn.hidden=!!v}
function show(el){el?.classList.remove('hidden')}
function hide(el){el?.classList.add('hidden')}
function setHeaderLoggedIn(me){
  if(me){
    show(HP.navDash); // show dashboard link
    show(HP.pill);
    HP.pillName.textContent = `${me.username}${me.discriminator?('#'+me.discriminator):''}`;
    const a=`https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=64`;
    HP.pillImg.src = me.avatar?a:`https://cdn.discordapp.com/embed/avatars/${Number(me.discriminator??0)%5}.png`;
    if(HP.loginBtn) HP.loginBtn.hidden=true;
    HP.logoutBtn.hidden=false;
  }else{
    hide(HP.navDash);
    hide(HP.pill);
    if(HP.loginBtn) HP.loginBtn.hidden=false;
    HP.logoutBtn.hidden=true;
  }
}
function alertShow(msg){if(!Alert.box)return;Alert.text.textContent=msg;Alert.box.classList.remove('hidden');}
function alertHide(){Alert?.box?.classList.add('hidden')}
function route(){
  const hash=(location.hash||'#home').split('?')[0];
  const sections=[S.home,S.features,S.about,S.rules,S.dashboard,S.gallery,S.news,S.tickets,S.admin];
  sections.forEach(sec=>{
    if(!sec) return;
    sec.hidden=true; // always hide first, including dashboard
    sec.classList.remove('active-section');
  });
  if(hash==="#dashboard"){ if(token()) {S.dashboard.hidden=false; S.dashboard.classList.add('active-section');} }
  else if(hash==="#admin"){ S.admin.hidden=false; S.admin.classList.add('active-section'); }
  else if(hash==="#tickets"){ S.tickets.hidden=false; S.tickets.classList.add('active-section'); }
  else{ const el=qs(hash); if(el){ el.hidden=false; el.classList.add('active-section'); } }
  // active nav glow
  qsa('.links .link').forEach(a=>{
    const h=a.getAttribute('href');
    if(h===hash) a.classList.add('active-glow'); else a.classList.remove('active-glow');
  });
}
addEventListener('hashchange',route);

async function checkAdminRole(){
  if(!token()||!cfg.guildId) return {isMember:false,isAdmin:false};
  try{
    const member = await apiGet(`/users/@me/guilds/${cfg.guildId}/member`);
    const roles = member.roles||[];
    const isAdmin = roles.includes(cfg.adminRoleId);
    return {isMember:true,isAdmin};
  }catch(e){
    return {isMember:false,isAdmin:false};
  }
}

async function onReady(){S.year.textContent=String(new Date().getFullYear());setDiscordLinks();setLoginLinks();wireRulesTabs();HP.logoutBtn.addEventListener('click',()=>{setToken(null);location.hash='';location.reload()});S.chipRefresh?.addEventListener('click',()=>location.reload());
  if(location.protocol==='file:'){
    alertShow('OAuth cannot work on file:// URLs. Please serve this folder with a local web server and add that HTTP URL as a Redirect in Discord Developer Portal.');
    if(S.heroLogin){S.heroLogin.addEventListener('click',(e)=>{e.preventDefault()})}
  }
  if(location.hash.includes('access_token')){const h=parseHash(location.hash);if(h.access_token){setToken(h.access_token);clearHash()}}
  route();
  if(!token()){
    setHeaderLoggedIn(null);
    showDashboard(false);
    // Gate gallery form
    if(S.galleryGuard) S.galleryGuard.classList.remove('hidden');
    if(S.galleryForm) S.galleryForm.classList.add('hidden');
    renderGallery();
    renderNews();
    // Tickets for logged-out cannot create
    return;
  }
  try{
   const me=await apiGet('/users/@me');
   const guilds=await apiGet('/users/@me/guilds');
   setHeaderLoggedIn(me);
  S.uname.textContent=`${me.username}#${me.discriminator??me.global_name??''}`.replace(/#undefined$/,'');
  S.uid.textContent=`ID ${me.id}`;
  const a=`https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128`;
  S.avatar.src=me.avatar?a:`https://cdn.discordapp.com/embed/avatars/${Number(me.discriminator??0)%5}.png`;
  // Stats
  try{
    const mem=await apiGet(`/users/@me/guilds/${cfg.guildId}/member`);
    qs('#stat-joined').textContent=(me.id? new Date(parseInt((BigInt(me.id)>>22n)+1420070400000n)).toLocaleDateString(): '—');
    qs('#stat-roles').textContent=String((mem.roles||[]).length);
    // Placeholder: first/last joined to FiveM server require backend integration
    if(S.statFirstJoined) S.statFirstJoined.textContent='Pending';
    if(S.statLastJoined) S.statLastJoined.textContent='Pending';
  }catch{ /* ignore if not in guild */ }
  const adm=await checkAdminRole();
  STATE.current={id:me.id,name:HP.pillName?.textContent||me.username};
  STATE.isStaff=!!adm.isAdmin;
  if(adm.isAdmin){
    show(S.staffNote);
    show(S.staffActions);
    show(S.newsAdmin);
    S.btnOpenAdmin?.addEventListener('click',()=>{ location.hash='#admin'; startAdminTimer(); });
    // Admin page gate
    if(A.guard && A.wrap){ A.guard.classList.add('hidden'); A.wrap.classList.remove('hidden'); }
    // Logs visibility and closed history panel by roles
    try{ const mem=await apiGet(`/users/@me/guilds/${cfg.guildId}/member`); const roles=mem.roles||[];
      if(roles.includes(cfg.logsRoleId)){ A.logs?.classList.remove('hidden'); STATE.canSeeLogs=true; }
      if(roles.includes(cfg.closedHistoryRoleId)){ A.closedPanel?.classList.remove('hidden'); renderClosedTickets(); }
    }catch{}
  } else {
    if(A.guard && A.wrap){ A.guard.classList.remove('hidden'); A.wrap.classList.add('hidden'); }
  }
  showDashboard(true);
 }catch(e){
   setHeaderLoggedIn(null);
   showDashboard(false);
   if(e.message==='no_token') alertShow('Not logged in. Click Login with Discord.');
   else if(e.message==='api_error') alertShow('Discord API request failed. Ensure Redirect URI matches this page URL in the Developer Portal.');
   else alertShow('Authentication failed. Check your Discord OAuth2 settings.');
 }
  // Enable gallery for logged users
  if(S.galleryGuard) S.galleryGuard.classList.add('hidden');
  if(S.galleryForm) S.galleryForm.classList.remove('hidden');
  renderGallery();
  renderNews(STATE.newsPage||1);
  // Tickets wiring
  T.openBtn?.addEventListener('click',()=>showTicketModal(true));
  T.mCancel?.addEventListener('click',()=>showTicketModal(false));
  T.mCreate?.addEventListener('click',()=>{
    const type=T.mType.value; const reason=T.mReason.value.trim(); if(!reason) {T.mReason.focus(); return}
    let img=null; const f=T.mImage.files?.[0];
    if(f){ const reader=new FileReader(); reader.onload=()=>{ img=reader.result; const t=TStore.create({userId:qs('#user-id').textContent.replace('ID ','')||'me', user:HP.pillName?.textContent||'User', type, reason, image:img}); showTicketModal(false); renderMyTickets({id:t.userId}); renderAdminTickets(); }; reader.readAsDataURL(f); }
    else { const t=TStore.create({userId:qs('#user-id').textContent.replace('ID ','')||'me', user:HP.pillName?.textContent||'User', type, reason, image:null}); showTicketModal(false); renderMyTickets({id:t.userId}); renderAdminTickets(); }
  });
  // Render initial tickets
  try{ const me=await apiGet('/users/@me'); renderMyTickets(me);}catch{}
  renderAdminTickets();
  // Admin actions require reasons (placeholder enable rules)
  function enableIfReason(input,btns){ const upd=()=>{ const ok=!!input?.value.trim(); btns.forEach(b=> b && (b.disabled=!ok)); }; input?.addEventListener('input',upd); upd(); }
  enableIfReason(A.dReason,[A.dKick,A.dBan]);
  enableIfReason(A.fReason,[A.fKick,A.fBan,A.fAnn]);
  // Wire post actions
  S.galPost?.addEventListener('click',()=>{
    const image=S.galImage.value.trim(); const caption=S.galCaption.value.trim();
    if(!image) return;
    addGallery(image,caption,HP.pillName?.textContent||'User');
    S.galImage.value=''; S.galCaption.value='';
  });
  S.galFile?.addEventListener('change',(e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const reader=new FileReader();
    reader.onload=()=>{ S.galImage.value=reader.result; };
    reader.readAsDataURL(f);
  });
  S.newsPost?.addEventListener('click',()=>{
    const image=S.newsImage.value.trim(); const head=S.newsHead.value.trim(); const body=S.newsBody.value.trim();
    if(!head||!body) return;
    addNews(image,head,body,HP.pillName?.textContent||'Staff');
    S.newsImage.value=''; S.newsHead.value=''; S.newsBody.value='';
  });
}

document.addEventListener('DOMContentLoaded',()=>{onReady();startParticles()});

function startParticles(){const c=qs('#bg-particles');const ctx=c.getContext('2d');function rs(){c.width=innerWidth;c.height=innerHeight}rs();addEventListener('resize',rs);const dots=[...Array(80)].map(()=>({x:Math.random()*c.width,y:Math.random()*c.height,s:.6+Math.random()*1.6,dx:(Math.random()-.5)*.6,dy:(Math.random()-.5)*.6,o:.2+.6*Math.random()}));function step(){ctx.clearRect(0,0,c.width,c.height);for(const d of dots){d.x+=d.dx;d.y+=d.dy;if(d.x<0||d.x>c.width)d.dx*=-1;if(d.y<0||d.y>c.height)d.dy*=-1;ctx.beginPath();const g=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,16*d.s);g.addColorStop(0,`rgba(124,58,237,${px(d.o)})`);g.addColorStop(1,'rgba(124,58,237,0)');ctx.fillStyle=g;ctx.arc(d.x,d.y,16*d.s,0,Math.PI*2);ctx.fill()}requestAnimationFrame(step)}requestAnimationFrame(step)}

// Simple lightbox for gallery images
function openLightbox(src,caption=''){
  const m=document.createElement('div'); m.className='modal';
  const bd=document.createElement('div'); bd.className='modal-backdrop';
  const card=document.createElement('div'); card.className='modal-card';
  const img=document.createElement('img'); img.src=src; img.alt=''; img.style.width='100%'; img.style.borderRadius='10px';
  const cap=document.createElement('div'); cap.className='muted'; cap.style.marginTop='8px'; cap.textContent=caption;
  card.appendChild(img); card.appendChild(cap);
  m.appendChild(bd); m.appendChild(card);
  const close=()=>{ m.remove(); removeEventListener('keydown',onKey) };
  const onKey=(e)=>{ if(e.key==='Escape') close(); };
  bd.addEventListener('click',close);
  addEventListener('keydown',onKey);
  document.body.appendChild(m);
}
