const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pub = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const LOGIN = 'https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login';

function loadPiAuth() {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync(path.join(pub, 'pi-auth.js'), 'utf8'), { globalThis: ctx });
  return ctx.PiAuth;
}

function csp() {
  const m = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(m, 'CSP meta tag missing');
  return Object.fromEntries(m[1].split(';').map(d => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
}

test('Pi SDK is loaded before app scripts', () => {
  const sdk = html.indexOf('<script src="https://sdk.minepi.com/pi-sdk.js">');
  assert.ok(sdk > -1);
  assert.ok(sdk < html.indexOf('pi-auth.js') && html.indexOf('pi-auth.js') < html.indexOf('app.js'));
});

test('CSP allows Pi SDK, socialchain and App Studio, with no wildcards', () => {
  const p = csp();
  assert.deepStrictEqual(p['connect-src'], ["'self'", 'https://socialchain.app', 'https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com']);
  assert.ok(p['script-src'].includes('https://sdk.minepi.com'));
  assert.ok(!p['script-src'].includes("'unsafe-inline'"));
  assert.ok(p['style-src'].includes("'self'") && p['style-src'].includes("'unsafe-inline'"));
  for (const v of Object.values(p)) assert.ok(!v.includes('*'), 'wildcard source');
});

test('signIn awaits init, exchanges token, and trusts only App Studio identity', async () => {
  const calls = [];
  let initDone = false;
  const Pi = {
    init: async opts => { calls.push(['init', JSON.parse(JSON.stringify(opts))]); await new Promise(r => setTimeout(r, 5)); initDone = true; },
    authenticate: async scopes => {
      assert.ok(initDone, 'authenticate called before init resolved');
      calls.push(['auth', scopes]);
      return { accessToken: 'tok', user: { uid: 'browser-uid', username: 'spoofed' } };
    }
  };
  const fetchFn = async (url, opts) => {
    calls.push(['fetch', url, JSON.parse(opts.body)]);
    return { ok: true, json: async () => ({ sessionToken: 's', user: { uid: 'real-uid', username: 'real' } }) };
  };
  const session = await loadPiAuth().signIn(Pi, fetchFn);
  assert.deepStrictEqual(calls[0], ['init', { version: '2.0' }]);
  assert.deepStrictEqual(calls[2], ['fetch', LOGIN, { accessToken: 'tok' }]);
  assert.strictEqual(session.user.uid, 'real-uid');
  assert.strictEqual(session.user.username, 'real');
  assert.strictEqual(session.sessionToken, 's');
});

test('signIn rejects when App Studio refuses the token', async () => {
  const Pi = { init: async () => {}, authenticate: async () => ({ accessToken: 'bad', user: { uid: 'x', username: 'x' } }) };
  await assert.rejects(loadPiAuth().signIn(Pi, async () => ({ ok: false, status: 401 })));
});
