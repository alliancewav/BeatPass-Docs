import test from 'node:test';
import assert from 'node:assert/strict';
import {publicMediaRecord} from './media-publication.mjs';

test('published media proof cannot expose private CSS or image host paths',()=>{
  const record={source:{head:'reviewed',theme_sha256:'theme'},actor:{role:'producer',has_admin:false},image:{sha256:'png'},crop:{reviewed:true,checks:{accessibility_css_rules:[{source:'/tmp/private-source/messaging.css',body:'private stylesheet diagnostic'}],images:[{src:'http://127.0.0.1:39000/@fs/tmp/private-source/artwork.png',loaded:true}],horizontal_overflow:false}}};
  const result=publicMediaRecord(record),text=JSON.stringify(result);
  assert(!text.includes('private-source'));assert(!text.includes('stylesheet diagnostic'));assert(!text.includes('127.0.0.1'));
  assert.deepEqual(result.source,record.source);assert.deepEqual(result.actor,record.actor);assert.deepEqual(result.image,record.image);
  assert.equal(result.crop.reviewed,true);assert.equal(result.crop.checks.images[0].loaded,true);assert.match(result.crop.checks.images[0].source_id,/^[a-f0-9]{64}$/);
  assert.equal(record.crop.checks.images[0].src,'http://127.0.0.1:39000/@fs/tmp/private-source/artwork.png');assert(record.crop.checks.accessibility_css_rules);
});
test('media screening is idempotent and preserves records without optional diagnostics',()=>{
  for(const record of [{image:{sha256:'png'}},{crop:{checks:{images:[{source_id:'already-screened',loaded:true}]}}}])assert.deepEqual(publicMediaRecord(publicMediaRecord(record)),publicMediaRecord(record));
});
