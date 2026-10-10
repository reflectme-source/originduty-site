'use strict';
const ENDPOINT='https://public-pilot-production.up.railway.app/regulations.json';
const $=(s)=>document.querySelector(s);
const CTRY={CN:'Chiny',IN:'Indie',TR:'Turcja',KR:'Korea Płd.',VN:'Wietnam',ID:'Indonezja',MY:'Malezja',RU:'Rosja',US:'USA',TH:'Tajlandia',MX:'Meksyk'};
const ACTION={registration:'Rejestracja importu',amendment:'Zmiana przepisu','new-measure':'Nowy środek','potential-refund':'Możliwy zwrot'};
const TYPE={'anti-dumping':'Antydumping',countervailing:'Cła wyrównawcze',safeguard:'Środek ochronny'};
let snapshot=null,loading=false;
function node(tag,text,cls){const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=String(text);if(cls)x.className=cls;return x;}
function dateDisplay(input){const d=new Date(input);return Number.isFinite(d.getTime())?d.toLocaleString('pl-PL',{dateStyle:'medium',timeStyle:'short'}):'Nieznana data';}
function exactCodes(act){return (Array.isArray(act.codes)?act.codes:[]).filter(x=>/^\d{10}$/.test(String(x))).map(String);}
function countries(act){return (Array.isArray(act.countries)?act.countries:[]).filter(x=>/^[A-Z]{2}$/.test(String(x))).map(String);}
function sourceHref(act){const uri=String(act.source_url||'');try{const u=new URL(uri);return u.protocol==='https:'&&u.hostname==='eur-lex.europa.eu'&&/^3\d{4}[A-Z]\d{4,6}$/.test(act.celex)?uri:null;}catch{return null;}}
function trimTitle(v){const s=String(v||'');return s.length>220?s.slice(0,220)+'…':s;}
function meta(label,value){const span=node('span');const b=node('b',value);span.append(b,node('span','  '+label));return span;}
function card(act){
 const article=node('article',null,'doc-card');
 const top=node('div',null,'doc-meta');top.append(node('span',TYPE[act.kind]||'Dokument UE','pill'),node('span','Do weryfikacji','pill review'));
 const date=node('span',act.published_at?dateDisplay(act.published_at):'Data nieustalona','doc-date');top.append(date);
 article.append(top,node('h3',trimTitle(act.title)));
 const facts=node('div',null,'doc-facts');facts.append(meta('Rodzaj:',ACTION[act.action]||'Akt prawny'),meta('Pochodzenie:',countries(act).map(x=>CTRY[x]||x).join(', ')||'Weryfikuj'));
 article.append(facts);
 const chips=node('div',null,'taric-chips');
 const codes=exactCodes(act);
 if(codes.length){for(const code of codes.slice(0,14))chips.append(node('code',code));if(codes.length>14)chips.append(node('span','+'+(codes.length-14)+' kolejne'));}else chips.append(node('span','Brak precyzyjnych kodów TARIC w zweryfikowanym odczycie dokumentu'));
 article.append(chips);
 const bottom=node('div',null,'doc-bottom');bottom.append(node('span','CELEX '+String(act.celex||'—')));
 const href=sourceHref(act);
 if(href){const a=node('a','Otwórz urzędowy akt ↗');a.href=href;a.target='_blank';a.rel='noopener noreferrer';bottom.append(a);}
 article.append(bottom);return article;
}
function matches(act){
 const code=$('#q-code').value.replace(/[\s.\-]/g,'');
 const country=$('#q-country').value,kind=$('#q-type').value,action=$('#q-action').value;
 if(code&&!/^\d{1,10}$/.test(code))return false;
 if(code&&!exactCodes(act).some(x=>x.startsWith(code)))return false;
 if(country&&!countries(act).includes(country))return false;
 if(kind&&act.kind!==kind)return false;
 if(action&&act.action!==action)return false;
 return true;
}
function draw(){
 const results=$('#results');results.replaceChildren();
 if(!snapshot){results.append(node('div','Dane niedostępne. Odśwież stronę lub spróbuj później.','empty-state'));$('#results-count').textContent='Brak danych';return;}
 const docs=snapshot.acts.filter(matches).sort((a,b)=>Date.parse(b.published_at||0)-Date.parse(a.published_at||0));
 $('#results-count').textContent='Dokumenty: '+docs.length+' z '+snapshot.acts.length;
 if(!docs.length){const box=node('div',null,'empty-state');box.append(node('strong','Brak dopasowanych dokumentów.'),node('span','To nie oznacza braku cła lub innych obowiązków. Zmień filtry albo sprawdź oficjalny TARIC.'));results.append(box);return;}
 docs.slice(0,60).forEach(act=>results.append(card(act)));
 if(docs.length>60)results.append(node('div','Wyświetlono pierwsze 60 pozycji. Zawęź filtry.','dash-alert'));
}
function setStat(id,value){$(id).textContent=String(value);}
function setAlert(message,severity='info'){$('#feed-alert').textContent=message;$('#feed-alert').dataset.severity=severity;}
function fillCountries(data){
 const used=[...new Set(data.acts.flatMap(countries))].sort();
 const sel=$('#q-country'),v=sel.value;sel.replaceChildren(node('option','Wszystkie kraje'));sel.firstChild.value='';
 used.forEach(id=>{const opt=node('option',(CTRY[id]||id)+' ('+id+')');opt.value=id;sel.append(opt);});
 sel.value=used.includes(v)?v:'';
}
function freshness(data){
 const d=new Date(data.generatedAt),age=Date.now()-d.getTime();
 const valid=Number.isFinite(age)&&age>=-3600000;
 const stale=!valid||age>48*3600000||data.status!=='ok';
 return {stale,age,valid};
}
async function load(){
 if(loading)return;loading=true;$('#refresh').disabled=true;
 $('#feed-updated').textContent='Weryfikacja aktualności danych…';
 try{
  const res=await fetch(ENDPOINT,{mode:'cors',cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json();
  if(!data||!Array.isArray(data.acts)||typeof data.generatedAt!=='string'||data.acts.length>10000)throw Error('Nieprawidłowa odpowiedź źródła');
  snapshot=data;
  const allCodes=new Set(data.acts.flatMap(exactCodes));
  setStat('#stat-docs',data.acts.length);setStat('#stat-codes',allCodes.size);
  const {stale}=freshness(data);setStat('#stat-quality',stale?'Ograniczone':'Zgodne');
  $('#stat-quality-detail').textContent=stale?'Feed częściowy lub przeterminowany':'Ostatni przegląd bez błędów';
  $('#feed-updated').textContent='Dane źródłowe: '+dateDisplay(data.generatedAt)+' · EUR-Lex / CELLAR';
  setAlert(stale?'Uwaga: stan źródła jest częściowy lub starszy niż 48 godzin. Wyniki mogą być nieaktualne; brak dopasowania niczego nie potwierdza.':'Dane pochodzą z ostatniego przeglądu oficjalnego feedu. Zakres jest ograniczony do aktów wykrytych przez importer; wymagają dalszej analizy.',stale?'error':'info');
  fillCountries(data);draw();
 }catch(err){snapshot=null;setStat('#stat-docs','—');setStat('#stat-codes','—');setStat('#stat-quality','OFFLINE');$('#stat-quality-detail').textContent='Błąd odczytu źródła';
  $('#feed-updated').textContent='Nie udało się potwierdzić stanu feedu.';
  setAlert('Brak dostępu do danych urzędowych przez API OriginDuty. Nie pokazujemy zapamiętanych ani wymyślonych wyników. Sprawdź później albo otwórz EUR-Lex.','error');draw();
 }finally{loading=false;$('#refresh').disabled=false;}
}
['#q-code','#q-country','#q-type','#q-action'].forEach(id=>$(id).addEventListener(id==='#q-code'?'input':'change',draw));
$('#clear').addEventListener('click',()=>{['#q-code','#q-country','#q-type','#q-action'].forEach(id=>$(id).value='');draw();});
$('#refresh').addEventListener('click',load);
load();
