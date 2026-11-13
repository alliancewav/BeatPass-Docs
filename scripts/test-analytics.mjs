import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../analytics.js', import.meta.url), 'utf8');
const denied = {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'};

// Vendor network requests remain stubbed; the real notice is exercised in browser QA.
function browser(choice) {
  const jar = new Map(choice ? [['bp_consent',choice]] : []);
  const writes = [];
  const scripts = [];
  const events = new Map();
  let blocked = false;
  const element = () => ({
    hidden:false, isConnected:false, dataset:{}, children:new Map(), listeners:new Map(),
    setAttribute() {}, focus() {},
    addEventListener(name, callback) { this.listeners.set(name,callback); },
    querySelector(selector) {
      if (!this.children.has(selector)) this.children.set(selector,element());
      return this.children.get(selector);
    },
  });
  const body = [];
  const document = {
    title:'BeatPass help', activeElement:null,
    createElement:element,
    body:{appendChild(node) { node.isConnected=true;body.push(node); }},
    head:{appendChild(node) { scripts.push({src:node.src,commands:commands()}); }},
    get cookie() { return [...jar].map(([key,value]) => `${key}=${value}`).join('; '); },
    set cookie(value) {
      writes.push(value);
      if (blocked) return;
      const [entry] = value.split(';');
      const at = entry.indexOf('=');
      const key = entry.slice(0,at);
      if (value.includes('Max-Age=0')) jar.delete(key);
      else jar.set(key,entry.slice(at+1));
    },
  };
  const window = {
    addEventListener(name,callback) { events.set(name,callback); },
    setInterval(callback) { this.poll=callback; },
  };
  const context = vm.createContext({window,document,location:{hostname:'docs.beatpass.ca',protocol:'https:',href:'https://docs.beatpass.ca/help'},localStorage:{setItem() {}}});
  function commands() { return JSON.parse(JSON.stringify(window.dataLayer ?? [] , (_,v) => Object.prototype.toString.call(v)==='[object Arguments]' ? Array.from(v) : v)); }
  vm.runInContext(source,context);
  return {jar,writes,scripts,window,commands,notice:body[0],reopen:body[1],
    runAgain() { vm.runInContext(source,context); },
    blockStorage() { blocked=true; },
    click(value) { body[0].listeners.get('click')({target:{closest:() => ({dataset:{choice:value}})}}); },
    navigate() { events.get('mintlify:navigate')(); },
  };
}

test('absent, invalid, and refused choices load GA with denied defaults before the tag', () => {
  for (const value of [undefined,'denied','accepted','true']) {
    const b=browser(value);
    assert.deepEqual(b.scripts[0].commands[0],['consent','default',denied]);
    assert.equal(b.scripts.length,1);
    assert.equal(b.scripts[0].src,'https://www.googletagmanager.com/gtag/js?id=G-5K99X60DF6');
    assert.equal(b.commands().filter((c) => c[1]==='update').length,0);
    assert.equal(b.notice.hidden,value==='denied');
    assert.equal(b.jar.has('_ga'),false);
  }
});
test('saved acceptance precedes configuration; docs context survives navigation without a second tag', () => {
  const b=browser('granted');
  assert.equal(b.commands()[1][1],'update');
  assert.equal(b.commands()[1][2].analytics_storage,'granted');
  assert.deepEqual(b.commands().find((c) => c[0]==='set'),['set',{content_group:'docs'}]);
  assert.deepEqual(b.commands().find((c) => c[0]==='config'),['config','G-5K99X60DF6',{content_group:'docs'}]);
  b.navigate();b.navigate();b.runAgain();
  assert.equal(b.scripts.length,1);
  assert.equal(b.commands().filter((c) => c[0]==='config').length,1);
  assert.equal(b.notice.hidden,true);
});
test('Accept and Refuse save the shared six-month contract and update the current page', () => {
  for (const choice of ['granted','denied']) {
    const b=browser();b.click(choice);
    assert.equal(b.jar.get('bp_consent'),choice);
    const cookie=b.writes.find((c) => c.startsWith('bp_consent='));
    assert.match(cookie,/; Path=\/; SameSite=Lax; Domain=\.beatpass\.ca; Secure$/);
    const expiry=new Date(cookie.match(/Expires=([^;]+)/)[1]);
    const expected=new Date();expected.setUTCMonth(expected.getUTCMonth()+6);
    assert.ok(Math.abs(expiry-expected)<2000);
    assert.equal(b.notice.hidden,true);
    assert.equal(b.commands().filter((c) => c[1]==='update').at(-1)?.[2].analytics_storage ?? 'denied',choice);
  }
});
test('subdomain withdrawal denies GA and removes its cookies while preserving essential cookies', () => {
  const b=browser('granted');
  b.jar.set('_ga','synthetic');b.jar.set('beatpass_session','essential');
  b.jar.set('bp_consent','denied');b.window.poll();
  assert.deepEqual(b.commands().at(-1),['consent','update',denied]);
  assert.equal(b.jar.has('_ga'),false);
  assert.equal(b.jar.get('beatpass_session'),'essential');
  assert.equal(b.jar.get('bp_consent'),'denied');
  b.jar.set('bp_consent','granted');b.window.poll();
  assert.equal(b.commands().at(-1)[2].analytics_storage,'granted');
});
test('failed acceptance stays denied and failed withdrawal takes effect in memory', () => {
  const b=browser();b.blockStorage();b.click('granted');
  assert.equal(b.commands().filter((c) => c[1]==='update').length,0);
  assert.equal(b.notice.hidden,false);
  const accepted=browser('granted');accepted.blockStorage();accepted.click('denied');
  assert.deepEqual(accepted.commands().at(-1),['consent','update',denied]);
  assert.equal(accepted.notice.hidden,false);
});
