import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Exercises the built Next.js app against a local Supabase REST contract fixture.
// This deliberately does not claim to verify a live database or SQL permissions.
test('authentication, private ownership, saving, public viewing, redirects, and quotas', { timeout: 30_000 }, async () => {
  const entries = new Map();
  const drafts = new Map();
  const userA = '11111111-1111-4111-8111-111111111111';
  const userB = '22222222-2222-4222-8222-222222222222';
  let allowCreation = true;
  let collision = false;
  const database = createServer(async (request, response) => {
    if (request.url === '/auth/v1/user') {
      assert.equal(request.headers.apikey, 'sb_publishable_fixture');
      const token = request.headers.authorization;
      response.setHeader('Content-Type', 'application/json');
      if (token === 'Bearer fixture-token' || token === 'Bearer other-token') {
        response.end(JSON.stringify({ id: token === 'Bearer fixture-token' ? userA : userB, is_anonymous: false }));
      } else { response.writeHead(401); response.end('{}'); }
      return;
    }
    assert.equal(request.headers.apikey, 'sb_secret_fixture');
    let raw = '';
    for await (const chunk of request) raw += chunk;
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/rest/v1/rpc/consume_share_quota') {
      assert.match(JSON.parse(raw).bucket_key, /^[a-f0-9]{64}$/);
      response.end(JSON.stringify(allowCreation));
    } else if (request.method === 'POST' && request.url === '/rest/v1/shared_entries') {
      if (collision) { collision = false; response.writeHead(409); response.end('{}'); return; }
      const entry = { ...JSON.parse(raw), created_at: '2026-09-17T00:00:00Z' };
      entries.set(entry.code, entry);
      response.writeHead(201);
      response.end(JSON.stringify([entry]));
    } else if (request.url.startsWith('/rest/v1/blog_drafts')) {
      const query = new URL(request.url, 'http://fixture').searchParams;
      const owner = query.get('owner_id')?.replace(/^eq\./, '');
      const id = query.get('id')?.replace(/^eq\./, '');
      if (request.method === 'POST') {
        const draft = { ...JSON.parse(raw), updated_at: '2026-09-17T00:00:00Z' };
        drafts.set(draft.id, draft); response.end(JSON.stringify([draft]));
      } else if (request.method === 'PATCH') {
        const draft = drafts.get(id);
        if (draft?.owner_id === owner) { Object.assign(draft, JSON.parse(raw)); response.end(JSON.stringify([draft])); }
        else response.end('[]');
      } else response.end(JSON.stringify([...drafts.values()].filter(draft => draft.owner_id === owner)));
    } else if (request.method === 'GET' && request.url.includes('owner_id=')) {
      const owner = new URL(request.url, 'http://fixture').searchParams.get('owner_id')?.replace(/^eq\./, '');
      response.end(JSON.stringify([...entries.values()].filter(entry => entry.owner_id === owner)));
    } else if (request.method === 'GET') {
      const code = new URL(request.url, 'http://fixture').searchParams.get('code')?.replace(/^eq\./, '');
      response.end(JSON.stringify(entries.has(code) ? [entries.get(code)] : []));
    } else { response.writeHead(404); response.end('{}'); }
  });
  database.listen(0, '127.0.0.1');
  await once(database, 'listening');
  const portProbe = createServer();
  portProbe.listen(0, '127.0.0.1');
  await once(portProbe, 'listening');
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    env: { ...process.env, VERCEL: '', SUPABASE_URL: `http://127.0.0.1:${database.address().port}`, SUPABASE_SECRET_KEY: 'sb_secret_fixture', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  app.stdout.on('data', chunk => { logs += chunk; });
  app.stderr.on('data', chunk => { logs += chunk; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (app.exitCode !== null) throw new Error(logs);
      try { if ((await fetch(base)).ok) { ready = true; break; } } catch { /* Wait for the server. */ }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, logs);
    const post = (path, body, token = 'fixture-token') => fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body),
    });
    const library = token => fetch(base + '/api/library', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    for (const path of ['/api/blogs', '/api/links', '/api/drafts']) {
      assert.equal((await post(path, {}, null)).status, 401);
      assert.equal((await post(path, {}, 'forged-token')).status, 401);
    }
    assert.equal((await library()).status, 401);
    const snapshot = {
      title: 'Blog sharing works', authorName: 'Devansh', avatarUrl: '', selectedFont: 'lora',
      isDarkMode: true, socialLinks: [],
      markdown: '# Hello reader\n\nShared content.\n\n<script>alert("unsafe")</script>\n<img src="https://example.com/image.png" onerror="alert(1)">',
    };
    const draftResponse = await post('/api/drafts', { blog: snapshot, owner_id: userB });
    assert.equal(draftResponse.status, 200);
    const draft = await draftResponse.json();
    assert.equal(drafts.get(draft.id).owner_id, userA);
    const edited = { ...snapshot, title: 'Updated private draft' };
    assert.equal((await post('/api/drafts', { id: draft.id, blog: edited })).status, 200);
    assert.equal(drafts.get(draft.id).blog.title, edited.title);
    assert.equal((await post('/api/drafts', { id: draft.id, blog: snapshot }, 'other-token')).status, 404);
    assert.equal(drafts.get(draft.id).blog.title, edited.title);
    assert.equal((await post('/api/drafts', { id: 'invalid', blog: snapshot })).status, 400);
    const privateLibrary = await (await library('fixture-token')).json();
    assert.equal(privateLibrary.drafts[0].id, draft.id);
    const otherLibrary = await (await library('other-token')).json();
    assert.equal(otherLibrary.drafts.length, 0);
    assert.equal((await fetch(base + '/b/' + draft.id)).status, 404);
    collision = true;
    const publishedResponse = await post('/api/blogs', snapshot);
    assert.equal(publishedResponse.status, 201);
    const published = await publishedResponse.json();
    assert.match(published.code, /^[A-Za-z0-9_-]{8}$/);
    const redirected = await fetch(base + published.path, { redirect: 'manual' });
    assert.equal(redirected.status, 302);
    assert.equal(redirected.headers.get('location'), published.blogPath);
    const viewer = await fetch(base + published.blogPath);
    assert.equal(viewer.status, 200);
    const html = await viewer.text();
    const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    assert.ok(rendered.includes('Blog sharing works'));
    assert.ok(rendered.includes('Hello reader'));
    assert.ok(rendered.includes('font-lora'));
    assert.ok(rendered.includes('Devansh'));
    assert.ok(!rendered.includes('onerror='));
    assert.ok(!rendered.includes('node="[object Object]"'));
    assert.ok(!rendered.includes('Publish blog'));
    assert.ok(!rendered.includes('Edit / Upload'));
    snapshot.markdown = 'Unsaved edits';
    assert.ok(entries.get(published.code).blog.markdown.includes('Shared content.'));
    const external = await post('/api/links', { url: 'https://example.com/path?q=one#section' });
    assert.equal(external.status, 201);
    const short = await external.json();
    const destination = await fetch(base + short.path, { redirect: 'manual' });
    assert.equal(destination.status, 302);
    assert.equal(destination.headers.get('location'), 'https://example.com/path?q=one#section');
    assert.equal((await fetch(base + '/s/missing0')).status, 404);
    assert.equal((await fetch(base + '/b/missing0')).status, 404);
    assert.equal((await post('/api/links', { url: 'javascript:alert(1)' })).status, 400);
    const account = await (await library('fixture-token')).json();
    assert.equal(account.links.length, 2);
    assert.equal((await (await library('other-token')).json()).links.length, 0);
    allowCreation = false;
    assert.equal((await post('/api/drafts', { blog: snapshot })).status, 429);
    assert.equal((await post('/api/drafts', { id: draft.id, blog: edited })).status, 200);
    assert.equal((await post('/api/blogs', snapshot)).status, 429);
    assert.equal((await post('/api/links', { url: 'https://example.com' })).status, 429);
  } finally {
    app.kill('SIGTERM');
    if (app.exitCode === null) await once(app, 'exit');
    database.closeAllConnections();
    await new Promise(resolve => database.close(resolve));
  }
});
