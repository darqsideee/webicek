// Cloudflare Worker: Exchange Discord OAuth2 authorization code for access token
// Steps to finish:
// 1) Deploy this as a Worker (Workers & Pages -> Create Worker -> paste -> Deploy)
// 2) Set Variables/Secrets on the Worker:
//    - DISCORD_CLIENT_ID (Secret)
//    - DISCORD_CLIENT_SECRET (Secret)
//    - ALLOW_ORIGIN = https://darqsideee.github.io (Plain text)
// 3) In app.js set cfg.redirectUri to https://darqsideee.github.io/webicek/
// 4) In Discord Developer Portal, add Redirect URI: https://darqsideee.github.io/webicek/
// 5) In app.js set cfg.tokenExchangeUrl to this Worker's URL

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(env) });

    // Data API: /gallery, /news, /admins, /tickets, /dm, /owner/announce, /revive, /giveaway/create, /giveaways
    if (path === '/gallery' || path === '/news' || path.startsWith('/gallery/') || path === '/admins' || path.startsWith('/tickets') || path === '/dm' || path === '/owner/announce' || path === '/revive' || path === '/giveaway/create' || path === '/giveaways') {
      try {
        if (method === 'GET' && (path === '/gallery' || path === '/news')) {
          const arr = await kvGetArray(env, path === '/gallery' ? 'gallery' : 'news');
          return json(arr, env);
        }
        // Admins DB
        if (path === '/admins' && method === 'GET') {
          const arr = await kvGetArray(env, 'admins');
          return json(arr, env);
        }
        if (path === '/admins' && method === 'POST') {
          const secret = request.headers.get('X-Admin-Secret');
          if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) return json({ ok:false, error:'forbidden' }, env, 403);
          const body = await request.json();
          const { id, action } = body || {};
          if (!id) return json({ ok:false, error:'missing_id' }, env, 400);
          const arr = await kvGetArray(env, 'admins');
          const idx = arr.indexOf(id);
          if (action === 'remove') { if (idx !== -1) arr.splice(idx,1); }
          else { if (idx === -1) arr.push(id); }
          await kvPutArray(env, 'admins', arr);
          return json({ ok:true, admins: arr }, env);
        }
        if (method === 'POST' && (path === '/gallery' || path === '/news')) {
          const body = await request.json();
          if (path === '/gallery') {
            const item = normalizeGallery(body);
            await kvPush(env, 'gallery', item);
            // admin log: gallery request
            const logs = await kvGetArray(env,'admin_logs');
            logs.push({type:'gallery_requested', image:item.image, caption:item.caption, user:item.user, id:item.id, ts:Date.now()});
            await kvPutArray(env,'admin_logs',logs);
            return json({ ok: true, id: item.id }, env);
          } else {
            const item = normalizeNews(body);
            await kvPush(env, 'news', item);
            return json({ ok: true, ts: item.ts }, env);
          }
        }
        // Tickets
        if (path === '/tickets' && method === 'GET') {
          const arr = await kvGetArray(env, 'tickets');
          return json(arr, env);
        }
        if (path === '/tickets' && method === 'POST') {
          const t = await request.json();
          const arr = await kvGetArray(env, 'tickets');
          arr.push(t);
          await kvPutArray(env, 'tickets', arr);
          // admin log: ticket opened
          const logs = await kvGetArray(env,'admin_logs');
          logs.push({type:'ticket_opened', id:t.id, no:t.no, userId:t.userId, user:t.user, reason:t.reason, ts:Date.now()});
          await kvPutArray(env,'admin_logs',logs);
          return json({ ok:true, id:t.id }, env);
        }
        if (path === '/tickets/close' && method === 'POST') {
          const { id, by } = await request.json();
          const arr = await kvGetArray(env, 'tickets');
          const it = arr.find(x=>x.id===id);
          if(!it) return json({ ok:false, error:'not_found' }, env, 404);
          it.status='closed'; it.solvedTs=Date.now(); it.solvedBy=by||'Staff'; (it.messages||(it.messages=[])).push({by:'system',text:`Solved by ${it.solvedBy}`,ts:Date.now()});
          await kvPutArray(env, 'tickets', arr);
          // admin log
          const logs = await kvGetArray(env,'admin_logs');
          logs.push({type:'ticket_closed', id:it.id, no:it.no, userId:it.userId, user:it.user, by:it.solvedBy, reason:it.reason, ts:Date.now()});
          await kvPutArray(env,'admin_logs',logs);
          return json({ ok:true }, env);
        }
        if (path === '/tickets/message' && method === 'POST') {
          const { id, by, byId, role, text, image } = await request.json();
          const arr = await kvGetArray(env, 'tickets');
          const it = arr.find(x=>x.id===id);
          if(!it) return json({ ok:false, error:'not_found' }, env, 404);
          (it.messages||(it.messages=[])).push({by, byId, role, text, image:image||null, ts:Date.now()});
          await kvPutArray(env, 'tickets', arr);
          return json({ ok:true }, env);
        }
        if (path === '/tickets/start' && method === 'POST') {
          const { id, by, byId } = await request.json();
          const arr = await kvGetArray(env, 'tickets');
          const it = arr.find(x=>x.id===id);
          if(!it) return json({ ok:false, error:'not_found' }, env, 404);
          if(!it.startedTs){ it.startedTs=Date.now(); it.startedBy=by||'Staff'; it.startedById=byId||null; (it.messages||(it.messages=[])).push({by:'system', text:`${it.startedBy} started solving`, ts:Date.now()}); }
          await kvPutArray(env, 'tickets', arr);
          return json({ ok:true }, env);
        }
        if (path === '/tickets/stop' && method === 'POST') {
          const { id, by } = await request.json();
          const arr = await kvGetArray(env, 'tickets');
          const it = arr.find(x=>x.id===id);
          if(!it) return json({ ok:false, error:'not_found' }, env, 404);
          if(it.startedTs){ (it.messages||(it.messages=[])).push({by:'system', text:`${by||'Staff'} stopped solving`, ts:Date.now()}); delete it.startedTs; delete it.startedBy; delete it.startedById; }
          await kvPutArray(env, 'tickets', arr);
          return json({ ok:true }, env);
        }
        if (path === '/tickets/rename' && method === 'POST') {
          const { id, name, by } = await request.json();
          if(!id || !name) return json({ ok:false, error:'missing_params' }, env, 400);
          const arr = await kvGetArray(env, 'tickets');
          const it = arr.find(x=>x.id===id);
          if(!it) return json({ ok:false, error:'not_found' }, env, 404);
          it.name = String(name).slice(0,80);
          (it.messages||(it.messages=[])).push({ by:'system', text:`Ticket renamed to '${it.name}' by ${by||'Staff'}`, ts:Date.now() });
          await kvPutArray(env, 'tickets', arr);
          return json({ ok:true, name: it.name }, env);
        }
        // Web DM endpoint
        if (path === '/dm' && method === 'POST') {
          try{
            const { userId, type, head, body, by } = await request.json();
            if(!env.BOT_TOKEN) return json({ ok:false, error:'missing_bot_token' }, env, 400);
            if(!userId || !head || !body) return json({ ok:false, error:'missing_params' }, env, 400);
            const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels',{
              method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bot ${env.BOT_TOKEN}` },
              body: JSON.stringify({ recipient_id: userId })
            });
            if(!dmRes.ok){ const txt=await dmRes.text().catch(()=>'' ); return json({ ok:false, error:'dm_create_failed', details:txt }, env, 502); }
            const dm=await dmRes.json();
            const color = type==='warn' ? 0xff0000 : 0x7c3aed;
            const embed = { title: head, description: body, color, timestamp: new Date().toISOString(), footer: { text: by? `Sent by ${by}` : 'Web message' } };
            const msgRes = await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`,{
              method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bot ${env.BOT_TOKEN}` },
              body: JSON.stringify({ embeds:[embed] })
            });
            if(!msgRes.ok){ const txt=await msgRes.text().catch(()=>'' ); return json({ ok:false, error:'dm_send_failed', details:txt }, env, 502); }
            return json({ ok:true }, env);
          }catch(e){ return json({ ok:false, error:'dm_error', message:e.message }, env, 500); }
        }

        // Giveaway create
        if (path === '/giveaway/create' && method === 'POST') {
          try{
            if(!env.BOT_TOKEN) return json({ ok:false, error:'missing_bot_token' }, env, 400);
            const { channelId, head, body, footerIcon, durationMin=60, winners=1, by } = await request.json();
            if(!channelId || !head || !body) return json({ ok:false, error:'missing_params' }, env, 400);
            const endsAt = Date.now() + Number(durationMin)*60*1000;
            const embed = { title: head, description: `${body}\n\n⏳ Končí: <t:${Math.floor(endsAt/1000)}:R>\n🎁 Výherci: ${winners}`, color: 0xffa500, timestamp: new Date().toISOString(), footer: { text: by? `by ${by}` : 'Giveaway', icon_url: footerIcon||undefined } };
            const r = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bot ${env.BOT_TOKEN}` }, body: JSON.stringify({ embeds:[embed], content:'🎉 Giveaway zahájen!' }) });
            if(!r.ok){ const txt=await r.text().catch(()=>'' ); return json({ ok:false, error:'gw_post_failed', details:txt }, env, 502); }
            const msg = await r.json();
            // save giveaway
            const g = { id: `gw_${Date.now()}`, channelId, messageId: msg.id, head, body, footerIcon: footerIcon||'', winners: Number(winners), createdAt: Date.now(), endsAt, by: by||'', participants: [] };
            const all = await kvGetArray(env, 'giveaways'); all.push(g); await kvPutArray(env, 'giveaways', all);
            return json({ ok:true, giveaway: g }, env);
          }catch(e){ return json({ ok:false, error:'gw_create_error', message:e.message }, env, 500); }
        }
        // Giveaway list
        if (path === '/giveaways' && method === 'GET'){
          try{ const all = await kvGetArray(env, 'giveaways'); return json({ ok:true, items: all.slice().reverse() }, env); }
          catch(e){ return json({ ok:false, error:'gw_list_error', message:e.message }, env, 500); }
        }

        if (path === '/tickets' && method === 'DELETE') {
          const id = url.searchParams.get('id');
          if(!id) return json({ ok:false, error:'missing_id' }, env, 400);
          const left = await kvFilter(env, 'tickets', (x)=> x.id !== id);
          return json({ ok:true, count:left }, env);
        }
        // Admin logs endpoint
        if (path === '/admin/logs' && method === 'GET') {
          const page = Number(url.searchParams.get('page')||'1');
          const size = Number(url.searchParams.get('size')||'7');
          const logs = (await kvGetArray(env,'admin_logs'))||[];
          const ordered = logs.slice().reverse();
          const pages = Math.max(1, Math.ceil(ordered.length/size));
          const p = Math.min(Math.max(1,page), pages);
          const start=(p-1)*size; const items=ordered.slice(start,start+size);
          return json({ items, page:p, pages, total:ordered.length }, env);
        }
        if (path === '/admin/logs' && method === 'POST') {
          const entry = await request.json();
          const logs = await kvGetArray(env,'admin_logs');
          logs.push({ ...entry, ts: entry.ts||Date.now() });
          await kvPutArray(env,'admin_logs',logs);
          return json({ ok:true }, env);
        }
        // Gallery moderation: like/approve/delete/logs
        if (path === '/gallery/like' && method === 'POST') {
          const { id, userId } = await request.json();
          const arr = await kvGetArray(env, 'gallery');
          const it = arr.find(x => x.id === id);
          if (!it) return json({ ok:false, error:'not_found' }, env, 404);
          it.likes = Array.isArray(it.likes) ? it.likes : [];
          if (!userId) return json({ ok:false, error:'missing_user' }, env, 400);
          let liked;
          const idx = it.likes.indexOf(userId);
          if (idx === -1) { it.likes.push(userId); liked = true; }
          else { it.likes.splice(idx,1); liked = false; }
          await kvPutArray(env, 'gallery', arr);
          return json({ ok:true, likes: it.likes.length, liked }, env);
        }
        if (path === '/gallery/approve' && method === 'POST') {
          const { id } = await request.json();
          const arr = await kvGetArray(env, 'gallery');
          const it = arr.find(x => x.id === id);
          if (!it) return json({ ok:false, error:'not_found' }, env, 404);
          it.approved = true;
          await kvPutArray(env, 'gallery', arr);
          await galLog(env, { action:'approve', image:it.image, caption:it.caption, user:it.user, ts:Date.now() });
          // admin log
          const logs = await kvGetArray(env,'admin_logs');
          logs.push({type:'gallery_approved', image:it.image, caption:it.caption, user:it.user, id:it.id, ts:Date.now()});
          await kvPutArray(env,'admin_logs',logs);
          return json({ ok:true }, env);
        }
        if (path === '/gallery/delete' && method === 'POST') {
          const { id } = await request.json();
          const arr = await kvGetArray(env, 'gallery');
          const it = arr.find(x => x.id === id);
          const next = arr.filter(x => x.id !== id);
          await kvPutArray(env, 'gallery', next);
          if (it) await galLog(env, { action:'delete', image:it.image, caption:it.caption, user:it.user, ts:Date.now() });
          // admin log
          if (it){ const logs = await kvGetArray(env,'admin_logs'); logs.push({type:'gallery_deleted', image:it.image, caption:it.caption, user:it.user, id:it.id, ts:Date.now()}); await kvPutArray(env,'admin_logs',logs); }
          return json({ ok:true }, env);
        }
        if (path === '/gallery/logs' && method === 'GET') {
          const logs = await kvGetArray(env, 'gal_logs');
          return json(logs, env);
        }
        if (method === 'DELETE' && path === '/news') {
          const ts = Number(url.searchParams.get('ts'));
          if (!ts) return json({ ok: false, error: 'missing_ts' }, env, 400);
          const all = await kvGetArray(env,'news');
          const removed = all.find(x=>x.ts===ts);
          const n = await kvFilter(env, 'news', (x) => Number(x.ts) !== ts);
          if(removed){
            const logs = await kvGetArray(env,'admin_logs');
            logs.push({type:'news_deleted', head:removed.head, body:removed.body, image:removed.image||null, user:removed.user||'', ts:Date.now()});
            await kvPutArray(env,'admin_logs',logs);
          }
          return json({ ok: true, count: n }, env);
        }
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders(env) });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'data_error', message: e.message }), { status: 500, headers: corsHeaders(env) });
      }
    }

    // OAuth2 exchange (POST /)
    if (path === '/' && method === 'POST') {
      try {
        const { code, redirect_uri } = await request.json();
        if (!code || !redirect_uri) {
          return new Response(JSON.stringify({ error: 'Missing code or redirect_uri' }), { status: 400, headers: corsHeaders(env) });
        }
        const body = new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri
        }).toString();
        const r = await fetch('https://discord.com/api/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        const data = await r.json();
        if (!r.ok) return new Response(JSON.stringify({ error: 'exchange_failed', details: data }), { status: r.status, headers: corsHeaders(env) });
        return json({ access_token: data.access_token, token_type: data.token_type, expires_in: data.expires_in, refresh_token: data.refresh_token, scope: data.scope }, env);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'server_error', message: e.message }), { status: 500, headers: corsHeaders(env) });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: corsHeaders(env) });
  }
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

async function galLog(env, entry){
  const logs = await kvGetArray(env, 'gal_logs');
  logs.push(entry);
  await kvPutArray(env, 'gal_logs', logs);
}

function json(data, env, status = 200) { return new Response(JSON.stringify(data), { status, headers: corsHeaders(env) }); }

async function kvGetArray(env, key) {
  const ns = (key === 'gallery' || key === 'gal_logs') ? env.NS_GALLERY : env.NS_NEWS;
  const raw = await ns.get(key);
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
async function kvPutArray(env, key, arr) {
  const ns = (key === 'gallery' || key === 'gal_logs') ? env.NS_GALLERY : env.NS_NEWS;
  await ns.put(key, JSON.stringify(arr));
}
async function kvPush(env, key, item) {
  const arr = await kvGetArray(env, key);
  arr.push(item);
  await kvPutArray(env, key, arr);
}
async function kvFilter(env, key, pred) {
  const arr = await kvGetArray(env, key);
  const next = arr.filter(pred);
  await kvPutArray(env, key, next);
  return next.length;
}

function normalizeGallery(b) {
  const id = b.id || `g_${Date.now()}`;
  return {
    id,
    image: b.image || '',
    caption: b.caption || '',
    user: b.user || 'User',
    uploaderId: b.uploaderId || null,
    uploaderAvatar: b.uploaderAvatar || '',
    approved: !!b.approved,
    promoted: false,
    likes: Array.isArray(b.likes) ? b.likes : [],
    ts: Date.now()
  };
}
function normalizeNews(b) {
  return {
    image: b.image || '',
    head: b.head || '',
    body: b.body || '',
    user: b.user || 'Staff',
    ts: Date.now()
  };
}
