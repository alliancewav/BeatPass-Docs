import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateHelpBoundaries} from './help-boundaries.mjs';
const config=(help=['help/index'],dev=['developers/overview'])=>({navigation:{tabs:[{tab:'Help Center',groups:[{pages:help}]},{tab:'API & Developers',groups:[{pages:dev}]}]}});
test('customer navigation cannot drift into integration reference',()=>{
 assert.equal(validateHelpBoundaries(config(['developers/authentication']),new Map()).length,1);
 assert.equal(validateHelpBoundaries(config(['help/account-settings/developer-api']),new Map()).length,1);
 assert.equal(validateHelpBoundaries(config(['help/index'],['help/index']),new Map()).length,1);
});
test('API component markup stays separate while a useful account-access bridge remains valid',()=>{
 assert.deepEqual(validateHelpBoundaries(config(),new Map([['help/account-settings/developer-api.mdx','Use Account Settings. [Integration guide](/developers/quickstart)'],['developers/authentication.mdx','<ParamField header="Authorization" />']])),[]);
 for(const component of ['ParamField','ResponseField','RequestExample','ResponseExample','CodeGroup'])assert.equal(validateHelpBoundaries(config(),new Map([['help/legal/example.mdx','<'+component+' />']])).length,1);
});
test('actual navigation keeps the account bridge URL and gives customers profile-editing help',()=>{
 const actual=JSON.parse(fs.readFileSync(new URL('../docs.json',import.meta.url),'utf8'));
 assert.deepEqual(validateHelpBoundaries(actual,new Map()),[]);
 const help=actual.navigation.tabs.find(tab=>tab.tab==='Help Center').groups.flatMap(group=>group.pages);
 assert(help.includes('help/profiles/user-profiles/editing-profile'));
 assert(fs.existsSync(new URL('../help/account-settings/developer-api.mdx',import.meta.url)));
});
