// Cloudflare Worker: Single-file backend to exchange Discord OAuth2 authorization code for access token
// Deployment steps:
// 1) In Cloudflare dashboard, create a new Worker and paste this entire file.
// 2) Add Vars/Secrets:
//    - DISCORD_CLIENT_ID (Secret)
//    - DISCORD_CLIENT_SECRET (Secret)
//    - ALLOW_ORIGIN = https://darqsideee.github.io (Plain text)
// 3) Deploy and copy the Worker URL (e.g., https://your-worker-subdomain.your-account.workers.dev)
// 4) In app.js, set cfg.tokenExchangeUrl to that URL.

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders(env) });
    }

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

      const r = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const data = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ error: 'exchange_failed', details: data }), { status: r.status, headers: corsHeaders(env) });
      }

      return new Response(JSON.stringify({
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope
      }), { headers: corsHeaders(env) });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'server_error', message: e.message }), { status: 500, headers: corsHeaders(env) });
    }
  }
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
