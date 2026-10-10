import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(path.join(root,p),'utf8');
test('public pages and source controls exist',()=>{
 for(const p of ['index.html','dashboard.html','privacy.html','terms.html','assets/site.css','assets/site.js','assets/dashboard.js','assets/favicon.svg','sitemap.xml','robots.txt']){
 assert.ok(existsSync(path.join(root,p)),p);
 }
});
test('landing contains accessible sections and live CTA',()=>{
 const html=read('index.html');
 for(const name of ['why','how','evidence','pricing','questions','contact'])assert.ok(html.includes('id="'+name+'"'),name);
 assert.match(html,/href="\.\/dashboard\.html"/);
 assert.match(html,/href="https:\/\/public-pilot-production\.up\.railway\.app\/#lead"/);
 assert.match(html,/Wersja|wersja|badawcza|badawczą/);
});
test('dashboard never injects official data as HTML',()=>{
 const src=read('assets/dashboard.js');
 assert.ok(!src.includes('innerHTML'));
 assert.match(src,/textContent/);
 assert.match(src,/^\s*const ENDPOINT='https:\/\/public-pilot-production\.up\.railway\.app\/regulations\.json'/m);
 assert.match(src,/No data|Brak|niedostępne/);
});
test('no client credentials in public source',()=>{
 for(const p of ['index.html','dashboard.html','assets/site.js','assets/dashboard.js']){
  const s=read(p);
  assert.doesNotMatch(s,/sk_live_|rk_live_|whsec_|OPERATOR_KEY|DATABASE_URL|STRIPE_SECRET_KEY/);
 }
});
test('legal pages are not false paid-service claims',()=>{
 assert.match(read('terms.html'),/Płatności i indywidualne konto klienta nie zostały udostępnione/);
 assert.match(read('privacy.html'),/nie udostępniamy tutaj|Nie udostępniamy tutaj/);
});
