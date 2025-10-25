const cfg={
  discordClientId:"1431308039927107719",
  redirectUri:"https://darqsideee.github.io/webicek/",
  scopes:["identify","guilds","guilds.members.read"],
  discordInvite:"https://discord.gg/rSHWAYWzP4",
  guildId:"1330612477578313789", // Target guild for members/admin checks
  adminRoleId:"1399465075722551376",
  logsRoleId:"1399463718978588804",
  closedHistoryRoleId:"1400548624248737922",
  galleryAdminRoleId:"1399465429516161024",
  ticketOpenRoleId:"1410635979340910694",
  tokenExchangeUrl:"https://pepa.darqsideee.workers.dev/", // Cloudflare Worker endpoint
  api:"https://discord.com/api",
  ownerIds : "1051222395417014282"
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
  homePromoted:qs('#home-promoted'),
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
const STATE={
  current:null,
  isStaff:false,
  isGalleryAdmin:false,
  canOpenTickets:false,
  newsPage:1
};

// Tickets selectors
const T={
  openBtn:qs('#btn-open-ticket'),
  history:qs('#ticket-history'),
  modal:qs('#ticket-modal'),
  mType:qs('#ticket-type'), mReason:qs('#ticket-reason'), mImage:qs('#ticket-image'),
  mCreate:qs('#ticket-create')
};
// Admin selectors
const A={
  guard:qs('#admin-guard'), wrap:qs('#admin-wrap'),
  timer:qs('#admin-timer'), solved:qs('#admin-solved'),
  list:qs('#admin-tickets'), logs:qs('#admin-logs'), logsList:qs('#logs-list'),
  closedPanel:qs('#admin-closed'), closedList:qs('#admin-closed-list'),
  galAllow:qs('#admin-gal-allow'), galList:qs('#admin-gal-list'),
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
  closeUser:qs('#tc-close-user'),
  file:qs('#tc-file'),
  attach:qs('#tc-attach'),
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
  start(id,by,byId){const v=this.all(); const t=v.find(x=>x.id===id); if(t && !t.startedTs){ t.startedTs=Date.now(); t.startedBy=by||'Staff'; t.startedById=byId||null; (t.messages||(t.messages=[])).push({by:'system',text:`${t.startedBy} started solving`,ts:Date.now()}); this.save(v);} return t},
  addMsg(id,byName,byId,role,text,image){const v=this.all(); const t=v.find(x=>x.id===id); if(!t) return; (t.messages||(t.messages=[])).push({by:byName, byId, role, text, image:image||null, ts:Date.now()}); this.save(v); return t},
  rename(id,name,by){ const v=this.all(); const t=v.find(x=>x.id===id); if(!t) return null; t.name=String(name).slice(0,80); (t.messages||(t.messages=[])).push({by:'system',text:`Ticket renamed to '${t.name}' by ${by||'Staff'}`,ts:Date.now()}); this.save(v); return t }
};

let __adminTimer=null;
function startAdminTimer(){
  if(!A.timer) return;
  if(__adminTimer) clearInterval(__adminTimer);
  A.timer.textContent='—';
  // Timer disabled per request
}

function showTicketModal(v){
  if(!T.modal) return;
  if(v){ T.modal.classList.remove('hidden'); }
  else { T.modal.classList.add('hidden'); if(T.mReason) T.mReason.value=''; if(T.mImage) T.mImage.value=''; if(T.mType) T.mType.value='support'; }
}

function ticketItemEl(t,opts={}){
  const wrap=document.createElement('div');
  wrap.className='guild';
  const meta=document.createElement('div');
  const label = t.name ? t.name : t.type;
  const solverInfo = t.solvedBy? ` • Solved by ${t.solvedBy}`: '';
  meta.innerHTML=`<div class="g-name">#${t.no||'?'} • ${label} • ${new Date(t.ts).toLocaleString()}${solverInfo}</div><div class="g-id">${t.reason}</div>`;
  wrap.appendChild(meta);
  if(t.image){ const img=document.createElement('img'); img.src=t.image; img.alt='evidence'; img.style.width='46px'; img.style.height='46px'; img.style.borderRadius='8px'; wrap.insertBefore(img,meta); }
  wrap.style.cursor='pointer';
  wrap.addEventListener('click',()=> openTicketChat(t.id, !!opts.adminView));
  if(t.status==='closed'){
    const badge=document.createElement('span'); badge.className='chip'; badge.textContent='Closed'; badge.style.marginLeft='auto'; badge.style.background='#000'; badge.style.border='1px solid #e11d48'; badge.style.color='#e11d48';
    wrap.appendChild(badge);
  }
  return wrap;
}

async function syncTicketsFromServer(){
  try{
    const remote = await dataGet('/tickets');
    if(Array.isArray(remote)){
      // merge: server is source of truth
      store.set('ns_tickets', remote);
    }
  }catch{}
}
async function renderMyTickets(me){
  if(!T.history||!me) return;
  const uid=me.id||String(me);
  await syncTicketsFromServer();
  const items=TStore.byUser(uid);
  if(items.length===0){ T.history.textContent='No tickets yet.'; return; }
  T.history.textContent='';
  items.forEach(t=>{
    const row=ticketItemEl(t);
    if(t.status==='closed'){
      // allow user to delete from local history view only
      const del=document.createElement('button'); del.className='btn btn-ghost'; del.textContent='Smazat z historie'; del.style.marginLeft='8px';
      del.addEventListener('click',(e)=>{ e.stopPropagation(); const v=TStore.all().filter(x=>x.id!==t.id); TStore.save(v); renderMyTickets({id:uid}); });
      row.appendChild(del);
    }
    T.history.appendChild(row);
  });
}

async function renderAdminTickets(){
  if(!A.list) return;
  await syncTicketsFromServer();
  let items=TStore.open();
  if(items.length===0){ A.list.textContent='No open tickets.'; return; }
  A.list.textContent='';
  items.forEach(t=>{ A.list.appendChild(ticketItemEl(t,{adminView:true})); });
  // clicking any item already opens chat via ticketItemEl -> openTicketChat(..., true)
}

async function renderClosedTickets(page){
  if(!A.closedList) return;
  await syncTicketsFromServer();
  const all=TStore.closed();
  if(!all.length){ A.closedList.textContent='No closed tickets.'; return; }
  const size=7; A.closedPage = page || A.closedPage || 1; const pages = Math.max(1, Math.ceil(all.length/size));
  if(A.closedPage>pages) A.closedPage=pages; if(A.closedPage<1) A.closedPage=1;
  const start=(A.closedPage-1)*size; const items=all.slice(start,start+size);
  A.closedList.textContent='';
  items.forEach(t=>{ A.closedList.appendChild(ticketItemEl(t,{adminView:true})); });
  // pager
  const pager=document.createElement('div'); pager.className='pager'; pager.style.marginTop='8px';
  const prev=document.createElement('button'); prev.className='btn btn-outline'; prev.textContent='Předchozí'; prev.disabled=A.closedPage<=1; prev.addEventListener('click',()=>renderClosedTickets(A.closedPage-1));
  const next=document.createElement('button'); next.className='btn btn-outline'; next.textContent='Další'; next.disabled=A.closedPage>=pages; next.addEventListener('click',()=>renderClosedTickets(A.closedPage+1));
  const info=document.createElement('span'); info.className='muted'; info.style.margin='0 8px'; info.textContent=`Strana ${A.closedPage}/${pages}`;
  const wrap=document.createElement('div'); wrap.style.display='flex'; wrap.style.alignItems='center'; wrap.style.justifyContent='center'; wrap.appendChild(prev); wrap.appendChild(info); wrap.appendChild(next);
  A.closedList.appendChild(wrap);
}

async function getTicketById(id){
  let t=TStore.all().find(x=>x.id===id);
  if(!t){ await syncTicketsFromServer(); t=TStore.all().find(x=>x.id===id); }
  return t;
}
let __chatPoll=null, __lastMsgCount=0;
async function openTicketChat(id,isAdmin){
  const t=await getTicketById(id); if(!t||!TC.modal) return;
  TC.currentId=t.id;
  const label = t.name ? t.name : t.type; const closedTag = (t.status==='closed') ? '' : '';
  TC.title.textContent = `#${t.no} • ${label}`;
  TC.list.textContent='';
  // ensure 'Ostatní' tools exist for staff when opening chat
  try{
    const chat=qs('#ticket-chat .chat');
    const actions=qs('#ticket-chat .chat-actions');
    const existing=qs('#tc-more');
    if(chat && actions && !existing && STATE.isStaff){
      const moreBar=document.createElement('div'); moreBar.className='form-actions';
      const btn=document.createElement('button'); btn.id='tc-more'; btn.className='btn btn-outline'; btn.textContent='Ostatní';
      moreBar.appendChild(btn); actions.insertAdjacentElement('afterend', moreBar);
      const wrap=document.createElement('div'); wrap.id='tc-more-wrap'; wrap.className='admin-actions hidden';
      wrap.innerHTML = `
        <div class="action-row">
          <input id="tc-rename-input" type="text" placeholder="Název ticketu" />
          <button id="tc-rename" class="btn btn-outline">Přejmenovat</button>
        </div>
        <div class="action-row">
          <button id="tc-start-2" class="btn btn-outline">Řešit ticket</button>
          <button id="tc-solve-2" class="btn btn-primary">Ukončit ticket</button>
          <button id="tc-mark-solved" class="btn btn-outline">Mark as solved</button>
        </div>`;
      chat.appendChild(wrap);
      btn.addEventListener('click',()=> wrap.classList.toggle('hidden'));
      qs('#tc-rename')?.addEventListener('click', async ()=>{
        if(!TC.currentId) return; const name=(qs('#tc-rename-input')?.value||'').trim(); if(!name) return;
        const by=STATE.current?.name||'Staff'; const t=TStore.rename(TC.currentId,name,by);
        try{ await dataPost('/tickets/rename',{id:TC.currentId, name, by}); }catch{}
        if(t) { TC.title.textContent = `#${t.no} • ${t.name}`; renderAdminTickets(); renderMyTickets({id:t.userId}); }
      });
      const start2=qs('#tc-start-2'), solve2=qs('#tc-solve-2'), markSolved=qs('#tc-mark-solved');
      start2?.addEventListener('click',()=> TC.start?.click());
      solve2?.addEventListener('click',()=> TC.solve?.click());
      markSolved?.addEventListener('click',()=> TC.solve?.click());
    }
  }catch{}

  (t.messages||[]).forEach(m=>{
    const row=document.createElement('div'); row.className='msg'+(m.byId===STATE.current?.id?' me':'');
    const b=document.createElement('div'); b.className='bubble'+(m.by==='system'?' system':'');
    const meta=document.createElement('div'); meta.className='meta'; meta.textContent = m.by==='system'? 'System' : `${m.by} • ${new Date(m.ts).toLocaleTimeString()}`;
    const body=document.createElement('div');
    if(m.image){
      const img=document.createElement('img'); img.src=m.image; img.alt='attachment'; img.style.maxWidth='240px'; img.style.borderRadius='8px'; img.style.display='block';
      if(m.text){ const p=document.createElement('div'); p.textContent=m.text; b.appendChild(p); }
      b.appendChild(img);
    } else {
      body.textContent=m.text;
      b.appendChild(body);
    }
    b.appendChild(meta); row.appendChild(b); TC.list.appendChild(row);
  });
  __lastMsgCount=(t.messages||[]).length;
  // controls visibility
  if(TC.start) TC.start.style.display = (isAdmin && !t.startedTs && t.status==='open')? 'inline-flex' : 'none';
  if(TC.solve) TC.solve.style.display = (isAdmin && t.status==='open')? 'inline-flex' : 'none';
  if(TC.closeUser) TC.closeUser.style.display = (!isAdmin && t.status==='open' && STATE.current?.id===t.userId)? 'inline-flex' : 'none';
  if(TC.input) { TC.input.disabled = (t.status==='closed'); TC.input.placeholder = t.status==='closed' ? 'Ticket is closed' : 'Type a message...'; }
  if(TC.send) { TC.send.disabled = (t.status==='closed'); }
  // autoscroll
  try{ TC.list.scrollTop = TC.list.scrollHeight; }catch{}
  TC.modal.classList.remove('hidden');
  // start realtime-ish polling
  if(__chatPoll) clearInterval(__chatPoll);
  __chatPoll=setInterval(async ()=>{
    const cur=await getTicketById(TC.currentId); if(!cur) return;
    const count=(cur.messages||[]).length;
    if(count!==__lastMsgCount){
      __lastMsgCount=count;
      const last=cur.messages?.[cur.messages.length-1];
      if(last && last.by!=='system' && last.byId!==STATE.current?.id){
        const isStaffMsg = last.role==='staff';
        const isSolver = STATE.isStaff && cur.startedById && cur.startedById=== (STATE.current?.id||'');
        const canNotify = (!STATE.isStaff && isStaffMsg) || isSolver;
        if(canNotify) showTicketToast(cur,last);
      }
      openTicketChat(TC.currentId,isAdmin);
    }
  }, 500);
}

function closeTicketChat(){ TC.modal?.classList.add('hidden'); TC.currentId=null; TC.input.value=''; if(__chatPoll) { clearInterval(__chatPoll); __chatPoll=null; } }


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
async function renderGallery(){
  let items;
  try{
    items = await dataGet('/gallery');
  }catch{
    items = store.get('ns_gallery',[]);
  }
  if(!S.galleryList) return;
  S.galleryList.innerHTML='';
  items.slice().reverse().forEach(it=>{
    // visibility: approved for all, pending only for uploader or gallery admin
    const isMine = !!STATE.current && (STATE.current.id===it.uploaderId);
    const canSee = it.approved || isMine || STATE.isGalleryAdmin;
    if(!canSee) return;
    const card=document.createElement('div');card.className='card';
    const img=document.createElement('img');img.src=it.image;img.alt='';img.style.width='100%';img.style.borderRadius='10px';
    img.style.cursor='zoom-in';
    img.addEventListener('click',()=>openLightbox(it.image,it.caption||'', it.user));
    const cap=document.createElement('div');cap.className='card-text';cap.textContent=it.caption||'';
    const meta=document.createElement('div');meta.className='muted';meta.style.marginTop='6px';
    const pub=document.createElement('div'); pub.className='promoted-pub';
    const ava=document.createElement('img'); ava.src=it.uploaderAvatar||`https://cdn.discordapp.com/embed/avatars/0.png`; ava.alt='';
    const name=document.createElement('span'); name.textContent=it.user;
    pub.appendChild(ava); pub.appendChild(name);
    meta.appendChild(pub);
    // like button
    const likeBtn=document.createElement('button'); likeBtn.className='btn btn-outline'; likeBtn.textContent=`Líbí se (${(it.likes?.length)||0})`;
    likeBtn.style.marginLeft='8px';
    likeBtn.addEventListener('click', async ()=>{
      try{ await dataPost('/gallery/like',{ id:it.id, userId: STATE.current?.id||'guest' }); }catch{}
      renderGallery();
    });
    meta.appendChild(likeBtn);
    if(!it.approved){
      const badge=document.createElement('div'); badge.className='pending-badge'; badge.textContent='Čeká na schválení týmem'; card.appendChild(badge);
    }
    // delete if owner or staff
    const canDel = (STATE.current && (STATE.current.id===it.uploaderId)) || STATE.isGalleryAdmin;
    if(canDel){
      const del=document.createElement('button'); del.className='btn btn-muted'; del.textContent='Smazat'; del.style.marginTop='6px';
      del.addEventListener('click',()=>{ deleteGallery(it.id); });
      card.appendChild(del);
    }
    // Promote to Home removed per request
    card.appendChild(img);card.appendChild(cap);card.appendChild(meta);
    S.galleryList.appendChild(card);
  });
}
async function addGallery(image,caption,user){
  const payload={image,caption,user,uploaderId:STATE.current?.id||null,uploaderAvatar:HP.pillImg?.src||''};
  try{
    await dataPost('/gallery',payload);
  }catch{
    const items=store.get('ns_gallery',[]);
    const id=`g_${Date.now()}`;
    const uploaderAvatar = HP.pillImg?.src||'';
    items.push({id,image,caption,user,uploaderId:STATE.current?.id||null,uploaderAvatar,approved:false,promoted:false,likes:[],ts:Date.now()});
    store.set('ns_gallery',items);
  }
  renderGallery();
  renderAdminGalleryPending();
}
async function deleteGallery(id){
  try{ await dataPost('/gallery/delete',{id}); }
  catch{ const items=store.get('ns_gallery',[]).filter(x=>x.id!==id); store.set('ns_gallery',items); }
  renderGallery(); renderAdminGalleryPending();
}
function approveGallery(id){ const items=store.get('ns_gallery',[]); const it=items.find(x=>x.id===id); if(it){it.approved=true;} store.set('ns_gallery',items); renderGallery(); renderAdminGalleryPending(); }
function togglePromoteGallery(id){ const items=store.get('ns_gallery',[]); const it=items.find(x=>x.id===id); if(it){it.promoted=!it.promoted;} store.set('ns_gallery',items); renderGallery(); renderHomePromoted(); }

async function renderAdminGalleryPending(){
  if(!A.galList) return;
  let items=[]; try{ items=(await dataGet('/gallery'))||[] }catch{ items=store.get('ns_gallery',[]) }
  items=items.filter(x=>!x.approved).sort((a,b)=>b.ts-a.ts);
  if(items.length===0){ A.galList.textContent='No pending images.'; return; }
  A.galList.textContent='';
  items.forEach(it=>{
    const row=document.createElement('div'); row.className='guild';
    const img=document.createElement('img'); img.src=it.image; img.alt=''; img.style.width='46px'; img.style.height='46px'; img.style.borderRadius='8px';
    const meta=document.createElement('div'); meta.innerHTML=`<div class="g-name">${it.caption||'Untitled'}</div><div class="g-id">by ${it.user}</div>`;
    const allow=document.createElement('button'); allow.className='btn btn-primary'; allow.textContent='Povolit'; allow.addEventListener('click',async ()=>{ try{ await dataPost('/gallery/approve',{id:it.id}); }catch{ approveGallery(it.id); } renderGallery(); renderAdminGalleryPending(); addGalLog('approve',it); });
    const del=document.createElement('button'); del.className='btn btn-outline'; del.textContent='Smazat'; del.style.marginLeft='8px'; del.addEventListener('click',async ()=>{ try{ await dataPost('/gallery/delete',{id:it.id}); }catch{ deleteGallery(it.id); } renderAdminGalleryPending(); addGalLog('delete',it); });
    row.appendChild(img); row.appendChild(meta); row.appendChild(allow); row.appendChild(del);
    A.galList.appendChild(row);
  });
}

async function renderHomePromoted(){
  if(!S.homePromoted) return;
  let items=store.get('ns_gallery',[]);
  try{ items=await dataGet('/gallery'); }catch{}
  items=items.filter(x=>x.approved && x.promoted).sort((a,b)=>b.ts-a.ts).slice(0,3);
  S.homePromoted.textContent='';
  items.forEach(it=>{
    const card=document.createElement('div'); card.className='promoted-card';
    const img=document.createElement('img'); img.src=it.image; img.alt='';
    const pub=document.createElement('div'); pub.className='promoted-pub';
    const ava=document.createElement('img'); ava.src=it.uploaderAvatar||`https://cdn.discordapp.com/embed/avatars/0.png`; ava.alt='';
    const name=document.createElement('span'); name.textContent=it.user;
    pub.appendChild(ava); pub.appendChild(name);
    card.appendChild(img); card.appendChild(pub);
    S.homePromoted.appendChild(card);
  });
}

// Admin logs (server, paginated)
async function renderAdminLogs(page=1){
  if(!A.logsList) return;
  A.logsList.textContent='Načítám logy...';
  let resp; try{ resp=await dataGet(`/admin/logs?page=${encodeURIComponent(String(page))}&size=7`); }catch{ resp=null }
  if(!resp || !Array.isArray(resp.items) || resp.items.length===0){ A.logsList.textContent='Žádné logy.'; return; }
  const { items, pages } = resp;
  A.logsList.textContent='';
  items.forEach(l=>{
    const row=document.createElement('div'); row.className='guild'; row.style.cursor='pointer';
    if(l.type==='ticket_closed'){
      row.innerHTML=`<div class="g-name">Ticket uzavřen • #${l.no||'?'} • ${new Date(l.ts).toLocaleString()}</div><div class="g-id">${l.user||''} • ${l.by||''} • ${l.reason||''}</div>`;
      row.addEventListener('click',()=>{ alert('Ticket #' + (l.no||'?') + '\nUživatel: ' + (l.user||'') + '\nUzavřel: ' + (l.by||'') + '\nDůvod: ' + (l.reason||'') ); });
    } else if(l.type==='news_deleted'){
      row.innerHTML=`<div class="g-name">Novinka smazána • ${new Date(l.ts).toLocaleString()}</div><div class="g-id">${(l.head||'').slice(0,60)}</div>`;
      row.addEventListener('click',()=>{ if(l.image){ openLightbox(l.image,l.head||'',l.user||''); } alert('Nadpis: '+(l.head||'')+'\nAutor: '+(l.user||'')+'\n\nText:\n'+(l.body||'')); });
    } else {
      row.innerHTML=`<div class="g-name">${l.type||'Log'} • ${new Date(l.ts).toLocaleString()}</div>`;
    }
    A.logsList.appendChild(row);
  });
  // pager under list
  const pager=document.createElement('div'); pager.className='pager';
  const prev=document.createElement('button'); prev.className='btn btn-outline'; prev.textContent='Předchozí'; prev.disabled=page<=1; prev.addEventListener('click',()=>renderAdminLogs(page-1));
  const next=document.createElement('button'); next.className='btn btn-outline'; next.textContent='Další'; next.disabled=page>=pages; next.addEventListener('click',()=>renderAdminLogs(page+1));
  const info=document.createElement('span'); info.className='muted'; info.style.margin='0 8px'; info.textContent=`Strana ${page}/${pages}`;
  pager.appendChild(prev); pager.appendChild(info); pager.appendChild(next);
  A.logsList.appendChild(pager);
}
// keep gallery local logs feature for offline fallback removed; now using server logs

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
async function renderNews(page=1){
  let all;
  try{ all = await dataGet('/news'); }
  catch{ all = store.get('ns_news',[]); }
  all = (all||[]).slice().reverse();
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
    const meta=document.createElement('div');meta.className='muted';meta.textContent=`od ${n.user} • ${new Date(n.ts).toLocaleString()}`;card.appendChild(meta);
    if(STATE.isStaff){
      const row=document.createElement('div'); row.className='admin-actions'; row.style.marginTop='8px';
      const del=document.createElement('button'); del.className='btn btn-muted'; del.textContent='Smazat novinku';
      del.addEventListener('click',()=>deleteNews(n.ts));
      row.appendChild(del);
      card.appendChild(row);
    }
    S.newsList.appendChild(card);
  });
  // pager
  if(S.newsPager){
    S.newsPager.innerHTML='';
    if(pages>1){
      const prev=document.createElement('button'); prev.className='btn btn-outline'; prev.textContent='Předchozí'; prev.disabled=p<=1; prev.addEventListener('click',()=>renderNews(p-1));
      const next=document.createElement('button'); next.className='btn btn-outline'; next.textContent='Další'; next.disabled=p>=pages; next.addEventListener('click',()=>renderNews(p+1));
      const info=document.createElement('span'); info.className='muted'; info.style.margin='0 8px'; info.textContent=`Strana ${p}/${pages}`;
      S.newsPager.appendChild(prev); S.newsPager.appendChild(info); S.newsPager.appendChild(next);
    }
  }
}
async function addNews(image,head,body,user){
  const n={image,head,body,user};
  try{ await dataPost('/news',n); }
  catch{
    const items=store.get('ns_news',[]);
    items.push({image,head,body,user,ts:Date.now()});
    store.set('ns_news',items);
  }
  renderNews(1);
  renderHomeNews();
}
async function deleteNews(ts){
  try{ await dataDelete(`/news?ts=${encodeURIComponent(String(ts))}`); }
  catch{ const items=(store.get('ns_news',[])||[]).filter(n=>n.ts!==ts); store.set('ns_news',items); }
  renderNews(STATE.newsPage||1); renderHomeNews();
}
function parseHash(h){return h.replace(/^#/,'').split('&').reduce((a,p)=>{const[k,v]=p.split('=');if(k)a[decodeURIComponent(k)]=decodeURIComponent(v||'');return a},{});} 
function clearHash(){history.replaceState(null,document.title,location.pathname+location.search)}
function token(){return localStorage.getItem("ns_token")}
function setToken(t){ if(t){ localStorage.setItem("ns_token",t); } else { localStorage.removeItem("ns_token"); } }
function authUrl(){
  const u=new URL("https://discord.com/oauth2/authorize");
  u.searchParams.set("client_id", cfg.discordClientId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("response_type", "code");
  const scopes = Array.isArray(cfg.scopes) && cfg.scopes.length ? cfg.scopes : ["identify","guilds","guilds.members.read"];
  u.searchParams.set("scope", scopes.join(" "));
  u.searchParams.set("prompt","consent");
  return u.toString();
}
async function apiGet(path){const t=token();if(!t)throw new Error("no_token");const r=await fetch(`${cfg.api}${path}`,{headers:{Authorization:`Bearer ${t}`}});if(!r.ok)throw new Error("api_error");return r.json()}
async function tryExchangeCode(code){
  try{
    if(!cfg.tokenExchangeUrl){ return false; }
    const res=await fetch(cfg.tokenExchangeUrl,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ code, redirect_uri:cfg.redirectUri }) });
    if(!res.ok){
      let details='';
      try{ details=await res.text(); }catch{}
      console.error('Token exchange failed', res.status, details);
      alertShow('Token exchange failed: '+res.status+' '+details);
      return false;
    }
    const data=await res.json();
    if(data && data.access_token){ setToken(data.access_token); return true; }
    return false;
  }catch{ return false; }
}
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
  // Handle implicit flow tokens (legacy) if present
  if(location.hash.includes('access_token')){const h=parseHash(location.hash);if(h.access_token){setToken(h.access_token);clearHash()}}
  // Handle authorization code (supports both query and hash)
  let codeFromQuery = new URLSearchParams(location.search).get('code');
  let code = codeFromQuery;
  if(!code){
    const h=parseHash(location.hash);
    if(h.code){ code=h.code; }
  }
  if(code){
    const exchanged=await tryExchangeCode(code);
    // Clean code from URL (both query and hash)
    try{
      const url=new URL(location.href);
      url.searchParams.delete('code'); url.searchParams.delete('state');
      // strip code/state from hash if present
      if(location.hash){
        const h=parseHash(location.hash);
        delete h.code; delete h.state;
        const rebuilt = Object.keys(h).length? ('#'+Object.entries(h).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')) : '';
        url.hash = rebuilt || url.hash.split('?')[0];
      }
      history.replaceState(null,document.title,url.toString());
    }catch{}
    if(!exchanged){
      alertShow('Authorization code received but token exchange failed. Configure cfg.tokenExchangeUrl to your backend.');
      return;
    }
  }
  route();
  if(!token()){
    setHeaderLoggedIn(null);
    showDashboard(false);
    // Gate gallery form
    if(S.galleryGuard) S.galleryGuard.classList.remove('hidden');
    if(S.galleryForm) S.galleryForm.classList.add('hidden');
    renderGallery();
    renderNews();
    renderHomeNews();
    // Tickets for logged-out cannot create
    STATE.canOpenTickets=false; applyTicketGate();
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
  try{ const admins=await fetchAdmins(); if(Array.isArray(admins) && admins.includes(me.id)) STATE.isStaff=true; }catch{}
  if(adm.isAdmin){
    show(S.staffNote);
    show(S.staffActions);
    show(S.newsAdmin);
    // bind handled globally below via openAdmin()
    // Admin page gate
    if(A.guard && A.wrap){ A.guard.classList.add('hidden'); A.wrap.classList.remove('hidden'); }
    try{ const mem=await apiGet(`/users/@me/guilds/${cfg.guildId}/member`); const roles=mem.roles||[];
      if(roles.includes(cfg.logsRoleId)){ A.logs?.classList.remove('hidden'); STATE.canSeeLogs=true; }
      if(roles.includes(cfg.closedHistoryRoleId)){ A.closedPanel?.classList.remove('hidden'); renderClosedTickets(); }
      if(roles.includes(cfg.galleryAdminRoleId)){ STATE.isGalleryAdmin=true; }
      STATE.isStaff = roles.includes(cfg.adminRoleId) || roles.includes(cfg.logsRoleId) || roles.includes(cfg.closedHistoryRoleId) || roles.includes(cfg.galleryAdminRoleId);
      // For any staff, show approvals panel and logs list
      if(STATE.isStaff){ A.galAllow?.classList.remove('hidden'); renderAdminGalleryPending(); A.logs?.classList.remove('hidden'); renderGalleryLogs(); }
    }catch{}
  } else {
    if(A.guard && A.wrap){ A.guard.classList.remove('hidden'); A.wrap.classList.add('hidden'); }
    // Even if not staff, still check ticket open role and staff roles
    try{ const mem=await apiGet(`/users/@me/guilds/${cfg.guildId}/member`); const roles=mem.roles||[]; 
      STATE.canOpenTickets = roles.includes(cfg.ticketOpenRoleId);
      STATE.isStaff = roles.includes(cfg.adminRoleId) || roles.includes(cfg.logsRoleId) || roles.includes(cfg.closedHistoryRoleId) || roles.includes(cfg.galleryAdminRoleId);
      try{ const admins=await fetchAdmins(); if(Array.isArray(admins) && admins.includes(me.id)) STATE.isStaff=true; }catch{}
    }catch{}
  }
  // If staff detected by roles, ensure staff UI is visible
  if(STATE.isStaff){ show(S.staffNote); S.staffActions?.classList.add('hidden'); // remove dashboard admin button
    // ensure nav admin link exists for staff
    ensureNavAdminLink(true);
    show(S.newsAdmin); A.closedPanel?.classList.remove('hidden'); renderAdminTickets(); A.galAllow?.classList.remove('hidden'); renderAdminGalleryPending(); if(A.logs){ A.logs.classList.remove('hidden'); renderGalleryLogs(); } }
  // after login, re-evaluate owner-only UI
  try{ setupOwnerUI(); initGiveawayUI(); }catch{}
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
  renderHomePromoted();
  renderHomeNews();
  STATE.canOpenTickets=true; applyTicketGate();
  // 15s role polling to refresh admin UI and lists
  setInterval(async ()=>{
    try{
      const mem=await apiGet(`/users/@me/guilds/${cfg.guildId}/member`); const roles=mem.roles||[];
      const wasStaff=STATE.isStaff;
      STATE.isStaff = roles.includes(cfg.adminRoleId) || roles.includes(cfg.logsRoleId) || roles.includes(cfg.closedHistoryRoleId) || roles.includes(cfg.galleryAdminRoleId);
      try{ const admins=await fetchAdmins(); if(Array.isArray(admins) && admins.includes(STATE.current?.id)) STATE.isStaff=true; }catch{}
      if(STATE.isStaff){ show(S.staffNote); S.staffActions?.classList.add('hidden'); ensureNavAdminLink(true); show(S.newsAdmin); A.closedPanel?.classList.remove('hidden'); A.galAllow?.classList.remove('hidden'); A.logs?.classList.remove('hidden'); renderAdminTickets(); renderAdminGalleryPending(); renderGalleryLogs(); }
      else if(wasStaff && !STATE.isStaff){ hide(S.staffNote); ensureNavAdminLink(false); hide(S.newsAdmin); }
    }catch{}
  },5000);
  // Tickets wiring
  T.openBtn?.addEventListener('click',()=>showTicketModal(true));
  T.mCreate?.addEventListener('click',()=>{
    const type=T.mType.value; const reason=T.mReason.value.trim(); if(!reason) {T.mReason.focus(); return}
    let img=null; const f=T.mImage.files?.[0];
    const finish=async (t)=>{ try{ await dataPost('/tickets',t); }catch{} showTicketModal(false); renderMyTickets({id:t.userId}); renderAdminTickets(); };
    if(f){ const reader=new FileReader(); reader.onload=()=>{ img=reader.result; const t=TStore.create({userId:qs('#user-id').textContent.replace('ID ','')||'me', user:HP.pillName?.textContent||'User', type, reason, image:img}); finish(t); }; reader.readAsDataURL(f); }
    else { const t=TStore.create({userId:qs('#user-id').textContent.replace('ID ','')||'me', user:HP.pillName?.textContent||'User', type, reason, image:null}); finish(t); }
  });
  // Render initial tickets
  try{ const me=await apiGet('/users/@me'); renderMyTickets(me);}catch{}
  renderAdminTickets();
  // Ticket chat controls
  TC.close?.addEventListener('click',closeTicketChat);
  // Inject 'Ostatní' tools row dynamically
  try{
    const chat=qs('#ticket-chat .chat');
    const actions=qs('#ticket-chat .chat-actions');
    if(chat && actions && !qs('#tc-more')){
      const moreBar=document.createElement('div'); moreBar.className='form-actions';
      const btn=document.createElement('button'); btn.id='tc-more'; btn.className='btn btn-outline'; btn.textContent='Ostatní';
      moreBar.appendChild(btn); actions.insertAdjacentElement('afterend', moreBar);
      const wrap=document.createElement('div'); wrap.id='tc-more-wrap'; wrap.className='admin-actions hidden';
      wrap.innerHTML = `
        <div class="action-row">
          <input id="tc-rename-input" type="text" placeholder="Název ticketu" />
          <button id="tc-rename" class="btn btn-outline">Přejmenovat</button>
        </div>
        <div class="action-row">
          <button id="tc-start-2" class="btn btn-outline">Řešit ticket</button>
          <button id="tc-solve-2" class="btn btn-primary">Ukončit ticket</button>
        </div>`;
      chat.appendChild(wrap);
      btn.addEventListener('click',()=> wrap.classList.toggle('hidden'));
      qs('#tc-rename')?.addEventListener('click', async ()=>{
        if(!TC.currentId) return; const name=(qs('#tc-rename-input')?.value||'').trim(); if(!name) return;
        const by=STATE.current?.name||'Staff'; const t=TStore.rename(TC.currentId,name,by);
        try{ await dataPost('/tickets/rename',{id:TC.currentId, name, by}); }catch{}
        if(t) { TC.title.textContent = `#${t.no} • ${t.name}`; renderAdminTickets(); renderMyTickets({id:t.userId}); }
      });
      const start2=qs('#tc-start-2'), solve2=qs('#tc-solve-2');
      start2?.addEventListener('click',()=> TC.start?.click());
      solve2?.addEventListener('click',()=> TC.solve?.click());
    }
  }catch{}

  TC.send?.addEventListener('click',async ()=>{
    if(!TC.currentId) return; const txt=TC.input.value.trim(); if(!txt) return;
    const by=HP.pillName?.textContent||'User'; const byId=STATE.current?.id||'me';
    TStore.addMsg(TC.currentId,by,byId,STATE.isStaff?'staff':'user',txt,null);
    try{ await dataPost('/tickets/message',{id:TC.currentId, by, byId, role: (STATE.isStaff?'staff':'user'), text:txt}); }catch{}
    openTicketChat(TC.currentId,STATE.isStaff); // re-render
    TC.input.value=''; TC.input.focus();
    try{ TC.list.scrollTop = TC.list.scrollHeight; }catch{}
  });
  // Attach image via file picker
  TC.attach?.addEventListener('click',()=> TC.file?.click());
  TC.file?.addEventListener('change',(e)=>{
    if(!TC.currentId) return; const f=e.target.files?.[0]; if(!f) return;
    const reader=new FileReader(); reader.onload=async ()=>{
      const by=HP.pillName?.textContent||'User'; const byId=STATE.current?.id||'me';
      const txt=TC.input.value.trim();
      TStore.addMsg(TC.currentId,by,byId,STATE.isStaff?'staff':'user',txt,reader.result);
      try{ await dataPost('/tickets/message',{id:TC.currentId, by, byId, role:(STATE.isStaff?'staff':'user'), text:txt, image:reader.result}); }catch{}
      TC.input.value=''; openTicketChat(TC.currentId,STATE.isStaff);
    }; reader.readAsDataURL(f);
    e.target.value='';
  });
  TC.input?.addEventListener('keydown',(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); TC.send?.click(); }});
  TC.start?.addEventListener('click',async ()=>{ if(!TC.currentId) return; TStore.start(TC.currentId,STATE.current?.name||'Staff',STATE.current?.id||null); try{ await dataPost('/tickets/start',{id:TC.currentId, by:STATE.current?.name||'Staff', byId:STATE.current?.id||null}); }catch{} await syncTicketsFromServer(); openTicketChat(TC.currentId,true); renderAdminTickets(); });
  TC.solve?.addEventListener('click',async ()=>{ if(!TC.currentId) return; TStore.close(TC.currentId,STATE.current?.name||'Staff'); try{ await dataPost('/tickets/close',{id:TC.currentId, by:STATE.current?.name||'Staff'}); }catch{} await syncTicketsFromServer(); closeTicketChat(); renderAdminTickets(); renderClosedTickets(); renderAdminLogs(1); });
  TC.closeUser?.addEventListener('click',async ()=>{ if(!TC.currentId) return; const t=TStore.all().find(x=>x.id===TC.currentId); if(!t) return; if(STATE.current?.id!==t.userId || t.status==='closed') return; TStore.addMsg(TC.currentId,'system',t.userId,'user','Ticket uzavřen hráčem',null); TStore.close(TC.currentId,STATE.current?.name||t.user); try{ await dataPost('/tickets/close',{id:TC.currentId, by:STATE.current?.name||t.user}); }catch{} await syncTicketsFromServer(); closeTicketChat(); renderMyTickets({id:t.userId}); renderAdminTickets(); renderClosedTickets(); renderAdminLogs(1); });
  // Admin actions require reasons (placeholder enable rules)
  function enableIfReason(input,btns){ const upd=()=>{ const ok=!!input?.value.trim(); btns.forEach(b=> b && (b.disabled=!ok)); }; input?.addEventListener('input',upd); upd(); }
  enableIfReason(A.dReason,[A.dKick,A.dBan]);
  enableIfReason(A.fReason,[A.fKick,A.fBan,A.fAnn]);
  // Wire post actions
  // Ticket modal close
  qs('#ticket-close')?.addEventListener('click',()=>showTicketModal(false));
  qs('#ticket-modal .modal-backdrop')?.addEventListener('click',()=>showTicketModal(false));
  // Admin tickets refresh
  qs('#ad-tickets-refresh')?.addEventListener('click',()=>{ renderAdminTickets(); });
  qs('#ad-closed-refresh')?.addEventListener('click',()=>{ renderClosedTickets(); });
  // Live refresh Gallery/News and Tickets for open users
  let __galPoll=null, __newsPoll=null, __openPoll=null, __closedPoll=null, __ticketMsgPoll=null;
  const startLiveRefresh=()=>{
    if(!__galPoll){ __galPoll=setInterval(()=>{ try{ renderGallery(); renderAdminGalleryPending(); }catch{} }, 1000); }

// Giveaway modal wiring (owner only)
function initGiveawayUI(){ try{
  const G={ wrap:qs('#giveaway-modal'), open:qs('#owner-giveaway-open'), close:qs('#giveaway-close'), list:qs('#gw-list'), detail:qs('#gw-detail'), eta:qs('#gw-eta'), count:qs('#gw-count'), users:qs('#gw-users'), endNW:qs('#gw-end-nw'), endW:qs('#gw-end-w'), reroll:qs('#gw-reroll'), finish:qs('#gw-finish') };
  if(!G.wrap) return;
  const show=(v)=>{ if(v) G.wrap.classList.remove('hidden'); else G.wrap.classList.add('hidden'); };
  const fmt = (ms)=>{ const s=Math.max(0,Math.floor(ms/1000)); const m=Math.floor(s/60), r=s%60; return `${m}m ${r}s`; };
  async function loadList(){ if(!G.list) return; G.list.textContent='Načítám...'; let resp=null; try{ resp=await dataGet('/giveaways'); }catch{} const items=(resp?.items)||[]; G.list.textContent=''; if(items.length===0){ G.list.textContent='Žádné probíhající soutěže.'; return; }
    items.forEach(g=>{ const row=document.createElement('div'); row.className='guild'; row.innerHTML=`<div class=\"g-name\">${g.head}</div><div class=\"g-id\">Konec: ${new Date(g.endsAt).toLocaleString()}</div>`; row.addEventListener('click',()=> openDetail(g)); G.list.appendChild(row); });
  }
  function openDetail(g){ if(!G.detail) return; G.detail.classList.remove('hidden'); G.eta.textContent=fmt(g.endsAt-Date.now()); G.count.textContent=String((g.participants||[]).length); G.users.textContent=''; (g.participants||[]).forEach(id=>{ const div=document.createElement('div'); div.className='guild'; div.textContent=id; G.users.appendChild(div); });
    // bind actions (placeholders for future endpoints)
    G.endNW.onclick=()=> alertShow('Endpoint pro ukončení bez výherce zatím není implementován.');
    G.endW.onclick=()=> alertShow('Endpoint pro ukončení s výhercem zatím není implementován.');
    G.reroll.onclick=()=> alertShow('Endpoint pro reroll zatím není implementován.');
    G.finish.onclick=()=> alertShow('Endpoint pro finish zatím není implementován.');
  }
  const applyVisibility=()=>{ const allowed=isOwnerAllowed(); if(G.open){ G.open.classList[allowed?'remove':'add']('hidden'); } };
  applyVisibility();
  G.open?.addEventListener('click',()=>{ if(!isOwnerAllowed()){ alertShow('Pouze owner.'); return; } show(true); loadList(); });
  G.close?.addEventListener('click',()=> show(false));
  qs('#giveaway-modal .modal-backdrop')?.addEventListener('click',()=> show(false));
  // Re-apply visibility on role polls via external calls to setupOwnerUI(); this keeps in sync
}catch{} }

    if(!__newsPoll){ __newsPoll=setInterval(()=>{ try{ renderNews(STATE.newsPage||1); }catch{} }, 1000); }
    if(!__openPoll){ __openPoll=setInterval(()=>{ try{ renderAdminTickets(); }catch{} }, 2000); }
    if(!__closedPoll){ __closedPoll=setInterval(()=>{ try{ renderClosedTickets(); }catch{} }, 2000); }
    if(!__ticketMsgPoll){ __ticketMsgPoll=setInterval(async ()=>{
      try{
        await syncTicketsFromServer();
        const all=TStore.all();
        const map = (window.__lastCounts||(window.__lastCounts={}));
        all.forEach(t=>{
          const count=(t.messages||[]).length; const prev=map[t.id]||0;
          if(count>prev){
            const m=t.messages[t.messages.length-1];
            if(m && m.by!=='system' && m.byId!==STATE.current?.id){
              const isStaffMsg=m.role==='staff';
              const forPlayer = !STATE.isStaff && isStaffMsg;
              const forSolver = STATE.isStaff && t.startedById && t.startedById=== (STATE.current?.id||'');
              if(forPlayer || forSolver) showTicketToast(t,m);
            }
          }
          map[t.id]=count;
        });
      }catch{}
    }, 1500); }
  };
  const stopLiveRefresh=()=>{ if(__galPoll){ clearInterval(__galPoll); __galPoll=null; } if(__newsPoll){ clearInterval(__newsPoll); __newsPoll=null; } if(__openPoll){ clearInterval(__openPoll); __openPoll=null; } if(__closedPoll){ clearInterval(__closedPoll); __closedPoll=null; } if(__ticketMsgPoll){ clearInterval(__ticketMsgPoll); __ticketMsgPoll=null; } };
  startLiveRefresh();
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') stopLiveRefresh(); else startLiveRefresh(); });
  // initial logs render if panel present
  if(A.logsList) { try{ renderAdminLogs(1); }catch{} }
  // Cleaner modal wiring
  const CL={wrap:qs('#cleaner-modal'), open:qs('#admin-cleaner-open'), close:qs('#cleaner-close'), tabGal:qs('#cleaner-tab-gallery'), tabNews:qs('#cleaner-tab-news'), listGal:qs('#cleaner-gallery'), listNews:qs('#cleaner-news')};
  const showCleaner=(v)=>{ if(!CL.wrap) return; if(v) CL.wrap.classList.remove('hidden'); else CL.wrap.classList.add('hidden'); };
  const switchTab=(t)=>{ if(!CL.wrap) return; if(t==='gal'){ CL.listGal.classList.remove('hidden'); CL.listNews.classList.add('hidden'); CL.tabGal.classList.add('btn'); CL.tabNews.classList.add('btn-outline'); CL.tabNews.classList.remove('btn'); } else { CL.listNews.classList.remove('hidden'); CL.listGal.classList.add('hidden'); CL.tabNews.classList.add('btn'); CL.tabGal.classList.add('btn-outline'); CL.tabGal.classList.remove('btn'); } };
  const loadCleanerGallery=async ()=>{
    if(!CL.listGal) return; CL.listGal.textContent='Načítám...';
    let items=[]; try{ items=await dataGet('/gallery'); }catch{ items=store.get('ns_gallery',[]) }
    CL.listGal.textContent=''; if(!items.length){ CL.listGal.textContent='Žádné fotky.'; return; }
    items.slice().reverse().forEach(it=>{
      const row=document.createElement('div'); row.className='guild';
      const img=document.createElement('img'); img.src=it.image; img.alt=''; img.style.width='46px'; img.style.height='46px'; img.style.borderRadius='8px';
      const meta=document.createElement('div'); meta.innerHTML=`<div class="g-name">${it.caption||'Untitled'}</div><div class="g-id">by ${it.user||''}</div>`;
      const del=document.createElement('button'); del.className='btn btn-muted'; del.textContent='Smazat'; del.style.marginLeft='auto';
      del.addEventListener('click',async ()=>{ try{ await dataPost('/gallery/delete',{id:it.id}); }catch{ deleteGallery(it.id); } await loadCleanerGallery(); renderGallery(); renderAdminGalleryPending(); });
      row.appendChild(img); row.appendChild(meta); row.appendChild(del); CL.listGal.appendChild(row);
    });
  };
  const loadCleanerNews=async ()=>{
    if(!CL.listNews) return; CL.listNews.textContent='Načítám...';
    let items=[]; try{ items=await dataGet('/news'); }catch{ items=store.get('ns_news',[]) }
    items=(items||[]).slice().reverse(); CL.listNews.textContent=''; if(!items.length){ CL.listNews.textContent='Žádné novinky.'; return; }
    items.forEach(n=>{
      const row=document.createElement('div'); row.className='guild';
      const meta=document.createElement('div'); meta.innerHTML=`<div class="g-name">${n.head}</div><div class="g-id">${new Date(n.ts).toLocaleString()}</div>`;
      const del=document.createElement('button'); del.className='btn btn-muted'; del.textContent='Smazat'; del.style.marginLeft='auto';
      del.addEventListener('click',async ()=>{ await deleteNews(n.ts); await loadCleanerNews(); });
      row.appendChild(meta); row.appendChild(del); CL.listNews.appendChild(row);
    });
  };
  CL.open?.addEventListener('click',async ()=>{ showCleaner(true); switchTab('gal'); await loadCleanerGallery(); });
  CL.close?.addEventListener('click',()=> showCleaner(false));
  CL.tabGal?.addEventListener('click',async ()=>{ switchTab('gal'); await loadCleanerGallery(); });
  CL.tabNews?.addEventListener('click',async ()=>{ switchTab('news'); await loadCleanerNews(); });
  
  // Gallery upload modal wiring
  const gm={wrap:qs('#gal-modal'), open:qs('#gal-upload-open'), close:qs('#gal-close'), file:qs('#gm-file'), url:qs('#gm-image'), cap:qs('#gm-caption'), add:qs('#gm-add')};
  gm.open?.addEventListener('click',()=> gm.wrap?.classList.remove('hidden'));
  gm.close?.addEventListener('click',()=> gm.wrap?.classList.add('hidden'));
  qs('#gal-modal .modal-backdrop')?.addEventListener('click',()=> gm.wrap?.classList.add('hidden'));
  gm.file?.addEventListener('change',(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ gm.url.value=r.result; }; r.readAsDataURL(f); });
  gm.add?.addEventListener('click',()=>{ const image=(gm.url?.value||'').trim(); const caption=(gm.cap?.value||'').trim(); if(!image) return; addGallery(image,caption,HP.pillName?.textContent||'User'); gm.url.value=''; gm.cap.value=''; gm.wrap?.classList.add('hidden'); });

  // News create modal wiring
  const nm={wrap:qs('#news-modal'), open:qs('#news-open'), close:qs('#news-close'), file:qs('#nm-file'), img:qs('#nm-image'), head:qs('#nm-head'), body:qs('#nm-body'), add:qs('#nm-add')};
  nm.open?.addEventListener('click',()=> nm.wrap?.classList.remove('hidden'));
  nm.close?.addEventListener('click',()=> nm.wrap?.classList.add('hidden'));
  qs('#news-modal .modal-backdrop')?.addEventListener('click',()=> nm.wrap?.classList.add('hidden'));
  nm.file?.addEventListener('change',(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ nm.img.value=r.result; }; r.readAsDataURL(f); });
  nm.add?.addEventListener('click',()=>{ const image=(nm.img?.value||'').trim(); const head=(nm.head?.value||'').trim(); const body=(nm.body?.value||'').trim(); if(!head||!body) return; addNews(image,head,body,HP.pillName?.textContent||'Staff'); nm.img.value=''; nm.head.value=''; nm.body.value=''; nm.wrap?.classList.add('hidden'); });
}

function openAdmin(){
  if(!STATE.isStaff){ alertShow('Access denied. Admin only.'); return; }
  location.hash='#admin';
  if(A.guard && A.wrap){ A.guard.classList.add('hidden'); A.wrap.classList.remove('hidden'); }
  startAdminTimer();
  renderAdminTickets();
  renderAdminGalleryPending();
  if(STATE.isStaff || STATE.canSeeLogs) renderGalleryLogs();
}

// Toast notifications and sound
function ensureToasts(){ let t=qs('#toasts'); if(!t){ t=document.createElement('div'); t.id='toasts'; document.body.appendChild(t); } return t; }
let __AUDIO_CTX=null, __AUDIO_UNLOCKED=false; function unlockAudio(){ try{ if(!__AUDIO_CTX){ __AUDIO_CTX=new (window.AudioContext||window.webkitAudioContext)(); } if(__AUDIO_CTX.state==='suspended'){ __AUDIO_CTX.resume(); } __AUDIO_UNLOCKED=true; document.removeEventListener('pointerdown',unlockAudio); }catch{} }
addEventListener('pointerdown', unlockAudio, { once:true });
function playNotifSound(){ try{ if(!__AUDIO_CTX){ __AUDIO_CTX=new (window.AudioContext||window.webkitAudioContext)(); } if(__AUDIO_CTX.state==='suspended' && !__AUDIO_UNLOCKED) return; const ctx=__AUDIO_CTX; const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sine'; o.frequency.value=880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime+0.01); o.start(); setTimeout(()=>{ g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.14); o.stop(ctx.currentTime+0.15); }, 120); }catch{} }
function showTicketToast(t,m){ const host=ensureToasts(); const d=document.createElement('div'); d.className='toast'; d.innerHTML=`<div class="t-title">#${t.no} • ${t.name||t.type}</div><div class="t-meta">${m.by}</div><div class="t-body">${(m.text||'').slice(0,160)}</div>`; d.addEventListener('click',()=>{ try{ openTicketChat(t.id, STATE.isStaff); }catch{}; d.remove(); }); host.appendChild(d); playNotifSound(); setTimeout(()=>{ try{ d.remove(); }catch{} }, 8000); }

function ensureNavAdminLink(isStaff){
  const id='nav-admin';
  const existing=qs('#'+id);
  if(isStaff){
    if(existing) return;
    // try to put into main nav .links, else .actions, else body header
    const host = qs('.links') || qs('.actions') || qs('header .nav-inner') || qs('header') || document.body;
    const a=document.createElement('a'); a.id=id; a.href='#admin'; a.textContent='Admin dashboard'; a.className='chip';
    a.addEventListener('click',(e)=>{ e.preventDefault?.(); openAdmin(); });
    host.appendChild(a);
  } else {
    existing?.remove();
  }
}

document.addEventListener('DOMContentLoaded',()=>{ onReady(); setLoginLinks(); wireRulesTabs(); startParticles(); qs('#nav-admin')?.addEventListener('click',(e)=>{ e.preventDefault?.(); openAdmin(); }); setupOwnerUI(); initGiveawayUI(); });

// Logout button wiring (in dashboard staff actions)
qs('#logout-btn')?.addEventListener('click',()=>{ setToken(null); location.reload(); });

// Unconditional heartbeat: ping Worker every 5 minutes to keep bot alive
const REVIVE_CHANNEL_ID='1431543291039580200';
function startReviveHeartbeat(){
  try{
    if(window.__reviveTimer) return;
    const ping=async ()=>{ try{ await dataPost('/revive',{ channelId: REVIVE_CHANNEL_ID, by: 'Web heartbeat' }); }catch{} };
    ping(); // initial
    window.__reviveTimer=setInterval(ping, 5*60*1000);
  }catch{}
}
function stopReviveHeartbeat(){ try{ if(window.__reviveTimer){ clearInterval(window.__reviveTimer); window.__reviveTimer=null; } }catch{} }

function startParticles(){const c=qs('#bg-particles');const ctx=c.getContext('2d');function rs(){c.width=innerWidth;c.height=innerHeight}rs();addEventListener('resize',rs);const dots=[...Array(80)].map(()=>({x:Math.random()*c.width,y:Math.random()*c.height,s:.6+Math.random()*1.6,dx:(Math.random()-.5)*.6,dy:(Math.random()-.5)*.6,o:.2+.6*Math.random()}));function step(){ctx.clearRect(0,0,c.width,c.height);for(const d of dots){d.x+=d.dx;d.y+=d.dy;if(d.x<0||d.x>c.width)d.dx*=-1;if(d.y<0||d.y>c.height)d.dy*=-1;ctx.beginPath();const g=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,16*d.s);g.addColorStop(0,`rgba(124,58,237,${px(d.o)})`);g.addColorStop(1,'rgba(124,58,237,0)');ctx.fillStyle=g;ctx.arc(d.x,d.y,16*d.s,0,Math.PI*2);ctx.fill()}requestAnimationFrame(step)}requestAnimationFrame(step)}

// Simple lightbox for gallery images
function openLightbox(src,caption='',author=''){
  const m=document.createElement('div'); m.className='modal';
  const bd=document.createElement('div'); bd.className='modal-backdrop';
  const card=document.createElement('div'); card.className='modal-card';
  const x=document.createElement('button'); x.className='btn btn-ghost'; x.textContent='✕'; x.style.position='absolute'; x.style.top='8px'; x.style.right='8px';
  const img=document.createElement('img'); img.src=src; img.alt=''; img.style.width='100%'; img.style.borderRadius='10px';
  const cap=document.createElement('div'); cap.className='muted'; cap.style.marginTop='8px'; cap.textContent=caption;
  const auth=document.createElement('div'); auth.className='muted'; auth.style.marginTop='4px'; auth.textContent = author? `autor ${author}` : '';
  card.appendChild(x); card.appendChild(img); card.appendChild(cap); if(author) card.appendChild(auth);
  const close=()=>{ m.remove(); };
  bd.addEventListener('click',close); x.addEventListener('click',close);
  m.appendChild(bd); m.appendChild(card); document.body.appendChild(m);
}

// Home big news feature
async function renderHomeNews(){
  const host=qs('#home-news-card'); if(!host) return;
  host.textContent='';
  let all=store.get('ns_news',[]);
  host.dataset.src='remote';
  try{ all = (await dataGet('/news'))||all; }catch{}
  all = all.slice().reverse();
  if(all.length===0){ host.className='news-card'; host.textContent='Zatím žádné novinky.'; return; }
  const n=all[0];
  host.className='news-card';
  if(n.image){ const img=document.createElement('img'); img.src=n.image; img.alt=''; host.appendChild(img); }
  const head=document.createElement('h2'); head.textContent=n.head; host.appendChild(head);
  const meta=document.createElement('div'); meta.className='muted'; meta.textContent = new Date(n.ts).toLocaleString(); host.appendChild(meta);
  const body=document.createElement('div'); body.className='news-body'; body.innerHTML=parseNewsBody(n.body); host.appendChild(body);
}

// Ticket gate by role
function applyTicketGate(){
  const btn=qs('#btn-open-ticket');
  if(!btn) return;
  if(STATE.canOpenTickets){ btn.disabled=false; btn.classList.remove('disabled'); }
  else { btn.disabled=true; btn.classList.add('disabled'); }
}

// Worker data API helpers (use same origin as tokenExchangeUrl)
function baseWorker(){ const u=new URL(cfg.tokenExchangeUrl); u.hash=''; u.search=''; return u.origin; }
async function dataGet(path){ const r=await fetch(`${baseWorker()}${path}`,{headers:{'Content-Type':'application/json'}}); if(!r.ok) throw new Error('data_get'); return r.json(); }
async function fetchAdmins(){ try{ return await dataGet('/admins'); }catch{ return store.get('ns_admins',[]); } }
async function dataPost(path,body){ const r=await fetch(`${baseWorker()}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); if(!r.ok) throw new Error('data_post'); return r.json().catch(()=>({ok:true})); }
async function dataDelete(path){ const r=await fetch(`${baseWorker()}${path}`,{method:'DELETE'}); if(!r.ok) throw new Error('data_del'); return true; }

// Auto-refresh disabled per request

// (music player removed)

// Helper to compute owner permission dynamically
function isOwnerAllowed(){
  try{
    const meId = STATE?.current?.id||'';
    const owners = Array.isArray(cfg.ownerIds) ? cfg.ownerIds : (cfg.ownerIds ? [cfg.ownerIds] : []);
    return !!(STATE?.isStaff===true || owners.includes(meId) || meId==='1399465075722551376');
  }catch{ return false; }
}

// Owner-only UI helper
function setupOwnerUI(){ try{
  const btnTools=qs('#owner-tools-open');
  const btnGive=qs('#owner-giveaway-open');
  const btnRev=qs('#bot-reviver-toggle');
  const allowed = isOwnerAllowed();
  if(btnTools){ if(allowed) btnTools.classList.remove('hidden'); else btnTools.classList.add('hidden'); }
  if(btnGive){ if(allowed) btnGive.classList.remove('hidden'); else btnGive.classList.add('hidden'); }
  if(btnRev){
    if(allowed) btnRev.classList.remove('hidden'); else btnRev.classList.add('hidden');
    const setLabel=()=>{ btnRev.textContent = window.__reviveTimer ? 'Bot Reviver OFF' : 'Bot Reviver ON'; };
    setLabel();
    if(!btnRev.__bound){
      btnRev.addEventListener('click',()=>{
        if(!isOwnerAllowed()){ alertShow('Pouze owner.'); return; }
        if(window.__reviveTimer){ stopReviveHeartbeat(); }
        else { startReviveHeartbeat(); }
        setLabel();
      });
      btnRev.__bound=true;
    }
  }
  // Wire owner tools modal
  const OW={wrap:qs('#owner-modal'), close:qs('#owner-close'), open:btnTools, ch:qs('#owner-channel'), type:qs('#owner-type'), head:qs('#owner-head'), body:qs('#owner-body'), icon:qs('#owner-footericon'), send:qs('#owner-send')};
  const show=(v)=>{ if(!OW.wrap) return; if(v) OW.wrap.classList.remove('hidden'); else OW.wrap.classList.add('hidden'); };
  if(!OW.wrap) return;
  if(!OW.__bound){
    OW.open?.addEventListener('click',()=>{ if(!isOwnerAllowed()){ alertShow('Pouze owner.'); return; } show(true); });
    OW.close?.addEventListener('click',()=> show(false));
    qs('#owner-modal .modal-backdrop')?.addEventListener('click',()=> show(false));
    OW.send?.addEventListener('click', async ()=>{
      if(!isOwnerAllowed()){ alertShow('Pouze owner.'); return; }
      const channelId=(OW.ch?.value||'').trim(); const type=(OW.type?.value||'normal');
      const head=(OW.head?.value||'').trim(); const text=(OW.body?.value||'').trim(); const footerIcon=(OW.icon?.value||'').trim();
      const durationMin = Number(qs('#owner-gw-duration')?.value||60);
      const winners = Number(qs('#owner-gw-winners')?.value||1);
      if(!channelId || !head || !text){ alertShow('Vyplň kanál, nadpis a text.'); return; }
      try{
        if(type==='giveaway'){
          await dataPost('/giveaway/create',{ channelId, head, body:text, footerIcon, durationMin, winners, by: STATE.current?.name||'Owner' });
        } else {
          await dataPost('/owner/announce',{ channelId, type, head, body:text, footerIcon, by: STATE.current?.name||'Owner' });
        }
        alertShow('Odesláno.'); show(false);
        if(OW.head) OW.head.value=''; if(OW.body) OW.body.value='';
      }catch{ alertShow('Odeslání selhalo. Zkontroluj BOT_TOKEN na serveru.'); }
    });
    // Show/hide giveaway extra fields by type
    const durEl=qs('#owner-gw-duration');
    const winEl=qs('#owner-gw-winners');
    const toggleGwFields=()=>{
      const isGw=(OW.type?.value||'normal')==='giveaway';
      try{ durEl?.parentElement && (durEl.parentElement.style.display = isGw? '' : 'none'); }catch{}
      try{ winEl?.parentElement && (winEl.parentElement.style.display = isGw? '' : 'none'); }catch{}
    };
    OW.type?.addEventListener('change', toggleGwFields);
    toggleGwFields();
    OW.__bound=true;
  } else {
    // ensure fields visibility reflects current selection when roles/UI refresh
    const ev=new Event('change'); OW.type?.dispatchEvent(ev);
  }
}catch{} }

// Admin Messager (Web DM) wiring - robust init
function initMessager(){
  const wrap=document.querySelector('#dm-modal');
  const openBtn=document.querySelector('#admin-dm-open');
  const closeBtn=document.querySelector('#dm-close');
  const typeEl=document.querySelector('#dm-type');
  const userEl=document.querySelector('#dm-user');
  const headEl=document.querySelector('#dm-head');
  const bodyEl=document.querySelector('#dm-body');
  const sendBtn=document.querySelector('#dm-send');
  if(!wrap) return; // modal not in DOM yet
  const show=(v)=>{ if(v) wrap.classList.remove('hidden'); else wrap.classList.add('hidden'); };
  // Bind once
  if(!wrap.__bound){
    openBtn?.addEventListener('click',()=>{ if(!STATE.isStaff){ alertShow('Pouze pro tým.'); return; } show(true); });
    closeBtn?.addEventListener('click',()=> show(false));
    document.querySelector('#dm-modal .modal-backdrop')?.addEventListener('click',()=> show(false));
    sendBtn?.addEventListener('click', async ()=>{
      if(!STATE.isStaff){ alertShow('Pouze pro tým.'); return; }
      const userId=(userEl?.value||'').trim();
      const type=(typeEl?.value||'info');
      const head=(headEl?.value||'').trim();
      const text=(bodyEl?.value||'').trim();
      if(!userId||!head||!text){ alertShow('Vyplňte Discord ID, nadpis a text.'); return; }
      try{
        await dataPost('/dm',{ userId, type, head, body:text, by:(STATE.current?.name||'Staff') });
        alertShow('Zpráva odeslána.'); show(false);
        if(userEl) userEl.value=''; if(headEl) headEl.value=''; if(bodyEl) bodyEl.value='';
      }catch{ alertShow('Odeslání selhalo. Zkontrolujte BOT_TOKEN na serveru.'); }
    });
    // Delegated fallback if button is injected later
    document.addEventListener('click',(e)=>{
      const t=e.target; if(!(t instanceof HTMLElement)) return;
      if(t.id==='admin-dm-open'){ e.preventDefault?.(); if(!STATE.isStaff){ alertShow('Pouze pro tým.'); return; } show(true); }
    });
    wrap.__bound=true;
  }
}
// Ensure init runs after DOM and when admin UI becomes visible
document.addEventListener('DOMContentLoaded', initMessager);
setTimeout(initMessager, 500);
