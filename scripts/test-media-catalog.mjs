import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {variantNames, validateCatalog, renderFigure, validateMediaReferences} from './media-catalog.mjs';
function fixture() {
  const figure = {id:'demo',alt:'Demo beat rows with artwork and titles',caption:'Browse beats. Example with demo data.',variants:{}};
  const files = new Map();
  for (const key of variantNames) {
    const mobile=key.startsWith('mobile-'), width=mobile?1170:1440,height=mobile?2532:1000;
    const bytes = Buffer.alloc(24); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.writeUInt32BE(width,16); bytes.writeUInt32BE(height,20);
    const name=`/assets/media/screenshots/demo/ready/${key}.png`;
    figure.variants[key]={path:name,captured_at:'2026-10-29T12:00:00Z',source:{head:'a'.repeat(40),frontend_sha256:'b'.repeat(64),theme_sha256:'c'.repeat(64),navigation_sha256:'e'.repeat(64),role_contract_sha256:'9'.repeat(64)},route:'/new-beats',state:'populated',viewport:{width:mobile?390:1440,height:mobile?844:1000},image:{width,height,sha256:createHash('sha256').update(bytes).digest('hex')},actor:{role:'customer',raw_role_names:[],authenticated:true,user_id:101,permissions:['music.view'],owned_artist_ids:[],primary_artist_id:null,has_admin:false,can_create_music:false,is_producer:false,valid_subscription:false},theme:key.split('-')[1],synthetic:true,crop:{reviewed:true},artwork:{ready:true,bad_images:[],unpainted_discs:[]},capture:{mode:'viewport',full_page:false,capture_beyond_viewport:false},...(mobile?{emulation:{preset:'iPhone 13',device_scale_factor:3,is_mobile:true,has_touch:true,user_agent:'Mozilla/5.0 (iPhone)',observed:{inner_width:390,inner_height:844,visual_viewport_width:390,device_pixel_ratio:3,coarse_pointer:true,max_touch_points:1,viewport_meta:'width=device-width, initial-scale=1'}}}:{})};
    files.set(name,bytes);
  }
  return {catalog:{schema_version:1,figures:[figure]},files,figure};
}
test('catalog requires both themes at both viewports',()=>{
  const {catalog,files,figure}=fixture(); assert.deepEqual(validateCatalog(catalog,files),[]);
  delete figure.variants['mobile-dark']; assert.match(validateCatalog(catalog,files).join('\n'),/missing mobile-dark/);
});
test('catalog detects changed pixels, mismatched theme and unreviewed framing',()=>{
  const {catalog,files,figure}=fixture(); const record=figure.variants['desktop-dark'];
  record.theme='light';record.crop.reviewed=false;record.image.sha256='d'.repeat(64);
  const errors=validateCatalog(catalog,files).join('\n');
  assert.match(errors,/theme differs/);assert.match(errors,/framing/);assert.match(errors,/image changed/);
});
test('generated figure exposes four independently selectable theme/device variants without nested snippet imports',()=>{
  const {figure}=fixture(),output=renderFigure(figure);
  assert.equal((output.match(/data-bp-media-variant=/g)||[]).length,4);
  for (const name of variantNames) assert.ok(output.includes(`data-bp-media-variant="${name}"`));
  assert.match(output,/bp-media-mobile/);assert.match(output,/bp-media-dark/);
  assert.doesNotMatch(output,/<picture|<source/);
  assert.doesNotMatch(output,/^import /m);assert.doesNotMatch(output,/object-fit/);
});

test('a figure cannot combine light and dark screenshots from different app candidates',()=>{
  const {catalog,files,figure}=fixture();figure.variants['mobile-dark'].source.frontend_sha256='f'.repeat(64);
  assert.match(validateCatalog(catalog,files).join('\n'),/same app and public-theme baseline/);
});


test('rejects tall desktop-style phone captures and980px fallback layout',()=>{
  const {catalog,files,figure}=fixture();const record=figure.variants['mobile-light'];
  record.viewport.height=1800;record.emulation.is_mobile=false;record.emulation.observed.inner_width=980;
  const errors=validateCatalog(catalog,files).join('\n');assert.match(errors,/fixed iPhone/);assert.match(errors,/mobile\/touch/);assert.match(errors,/observed phone layout/);
});
test('rejects incomplete artwork even when a screenshot has valid PNG dimensions',()=>{
  const {catalog,files,figure}=fixture();figure.variants['desktop-dark'].artwork={ready:false,bad_images:[],unpainted_discs:[{label:'Golden Hour'}]};
  assert.match(validateCatalog(catalog,files).join('\n'),/loaded and painted/);
});
test('phone screenshots cannot conceal layout problems through clipped or expanded captures',()=>{
  const {catalog,files,figure}=fixture();figure.variants['mobile-dark'].capture.mode='native-clip';
  assert.match(validateCatalog(catalog,files).join('\n'),/native fixed viewports/);
});


test('every active media import must belong to the reviewed catalog',()=>{
  const {catalog}=fixture();
  assert.deepEqual(validateMediaReferences(catalog,new Map([['help/demo.mdx','import Demo from "/snippets/media/demo.mdx";']]),['snippets/media/demo.mdx']),[]);
  const errors=validateMediaReferences(catalog,new Map([['help/demo.mdx','import Missing from "/snippets/media/missing.mdx";']]),['snippets/media/retired.mdx']).join('\n');
  assert.match(errors,/absent from the reviewed catalog/);assert.match(errors,/stale or unregistered/);
});


test('configured navigation must be fingerprinted and consistent across each figure',()=>{
  const {catalog,files,figure}=fixture();
  delete figure.variants['mobile-light'].source.navigation_sha256;
  let errors=validateCatalog(catalog,files).join('\n');assert.match(errors,/configured public navigation fingerprint/);
  figure.variants['mobile-light'].source.navigation_sha256='f'.repeat(64);
  errors=validateCatalog(catalog,files).join('\n');assert.match(errors,/including configured navigation/);
});


test('rejects administrator smoke accounts and producer identity in customer guides',()=>{
  const {catalog,files,figure}=fixture();figure.id='track';
  const actor=figure.variants['desktop-light'].actor;actor.has_admin=true;actor.permissions.push('admin','music.create');actor.owned_artist_ids=[5];actor.primary_artist_id=5;actor.is_producer=true;
  const errors=validateCatalog(catalog,files).join('\n');assert.match(errors,/explicit intended/);assert.match(errors,/same synthetic account/);
  actor.has_admin=false;assert.match(validateCatalog(catalog,files).join('\n'),/customer screenshots cannot inherit producer/);
});
test('producer guides require a real-shaped single owned profile and scoped upload permission',()=>{
  const {catalog,files,figure}=fixture();figure.id='dashboard';
  for(const record of Object.values(figure.variants)) record.actor={role:'producer',raw_role_names:[],authenticated:true,user_id:101,permissions:['music.view','music.create'],owned_artist_ids:[5],primary_artist_id:5,has_admin:false,can_create_music:true,is_producer:true,valid_subscription:false};
  assert.deepEqual(validateCatalog(catalog,files),[]);
  for(const record of Object.values(figure.variants)) record.actor.owned_artist_ids=[];
  assert.match(validateCatalog(catalog,files).join('\n'),/one owned profile/);
});
test('missing or mixed role contracts cannot certify earlier unrestricted captures',()=>{
  const {catalog,files,figure}=fixture();delete figure.variants['mobile-light'].source.role_contract_sha256;
  assert.match(validateCatalog(catalog,files).join('\n'),/role contract fingerprint/);
});


test('catalog licensing cannot be illustrated by a self-owned track or an ineligible plan',()=>{
  const {catalog,files,figure}=fixture();figure.id='track';
  for(const record of Object.values(figure.variants)){record.actor.valid_subscription=true;record.actor.paid_download_subscription=true;record.actor.paid_product_download_permission=true;record.source.download_eligibility_sha256='7'.repeat(64);record.actor.track={owner_id:1101,viewer_owns_track:false};}
  assert.deepEqual(validateCatalog(catalog,files),[]);
  for(const record of Object.values(figure.variants)){record.actor.paid_download_subscription=false;record.actor.track={owner_id:101,viewer_owns_track:true};}
  assert.match(validateCatalog(catalog,files).join('\n'),/source-shaped paid download eligibility/);
});


test('public screenshot folders cannot accumulate unregistered capture attempts',()=>{
  const {catalog,figure}=fixture();const assets=Object.values(figure.variants).map(record=>record.path);
  assert.deepEqual(validateMediaReferences(catalog,new Map(),['snippets/media/demo.mdx'],assets),[]);
  assert.match(validateMediaReferences(catalog,new Map(),[],[...assets,'/assets/media/screenshots/demo/unreviewed/desktop-light.png']).join('\n'),/unregistered screenshot/);
});


test('screenshots use supported noZoom image links with stable Safari server/client markup',()=>{
  const {figure}=fixture(),source=renderFigure(figure);
  assert.equal((source.match(/noZoom/g)||[]).length,4);
  assert.equal((source.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,4);
  assert.equal((source.match(/aria-label=/g)||[]).length,4);
  for(const record of Object.values(figure.variants))assert.ok(source.includes(`href={${JSON.stringify(record.path)}}`));
});
