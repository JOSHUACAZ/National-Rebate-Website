const APP_BUILD_VERSION = '2026.08.26-national-print-recode-v4';
async function checkForSiteUpdate(){try{const r=await fetch(`site-version.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)return;const remote=await r.json();if(remote.version&&remote.version!==APP_BUILD_VERSION){const u=new URL(location.href);u.searchParams.set('build',remote.version);location.replace(u.toString())}}catch(e){}}
checkForSiteUpdate();window.addEventListener('focus',checkForSiteUpdate);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkForSiteUpdate()});setInterval(checkForSiteUpdate,5*60*1000);
const rebateData=window.REBATE_DATA;const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);const norm=s=>s.toUpperCase().replace(/[^A-Z0-9]/g,'');const $=id=>document.getElementById(id);const modelsInput=$('modelsInput');let selectedNetwork=localStorage.getItem('applianceRebateNetwork')||'';let lastResults={},lastActivePrograms=[];let autocompleteItems=[],autocompleteIndex=-1;
$('calculateBtn').onclick=calculate;$('clearBtn').onclick=()=>{modelsInput.value='';localStorage.removeItem('applianceRebateModelsNetwork');render([])};$('printBtn').onclick=()=>{trackEvent('print_results',analyticsSnapshot());window.print()};$('printFormsBtn').onclick=printEligibleForms;$('changeNetworkBtn').onclick=()=>{document.querySelector('.network-card').scrollIntoView({behavior:'smooth'});};modelsInput.addEventListener('input',()=>{$('modelCount').textContent=parseModels().length+' models entered';updateAutocomplete()});modelsInput.addEventListener('keydown',handleAutocompleteKeydown);modelsInput.addEventListener('click',updateAutocomplete);modelsInput.addEventListener('keyup',e=>{if(!['ArrowUp','ArrowDown','Enter','Escape'].includes(e.key))updateAutocomplete()});document.addEventListener('click',e=>{if(!e.target.closest('.model-entry-wrap'))hideAutocomplete()});
document.querySelectorAll('.network-option').forEach(b=>b.onclick=()=>selectNetwork(b.dataset.network));
function selectNetwork(n){const previous=selectedNetwork;selectedNetwork=n;localStorage.setItem('applianceRebateNetwork',n);document.querySelectorAll('.network-option').forEach(b=>b.classList.toggle('selected',b.dataset.network===n));$('calculatorArea').classList.remove('hidden');$('networkTitle').textContent=n==='brandsource'?'BrandSource selected':'Nationwide / NMG selected';$('networkCopy').textContent='You can change this selection at any time. Your package stays saved locally in this browser.';$('networkLabel').textContent=n==='brandsource'?'BrandSource':'Nationwide / NMG';const saved=localStorage.getItem('applianceRebateModelsNetwork');if(saved&&!modelsInput.value)modelsInput.value=saved;render(parseModels());hideAutocomplete();if(previous!==n)trackEvent('network_selected',{dealer_network:n})}

function currentTokenInfo(){
  const value=modelsInput.value, caret=modelsInput.selectionStart ?? value.length;
  let start=caret,end=caret;
  while(start>0&&!/[\s,;]/.test(value[start-1]))start--;
  while(end<value.length&&!/[\s,;]/.test(value[end]))end++;
  return{raw:value.slice(start,caret),normalized:norm(value.slice(start,caret)),start,end,caret};
}
function autocompleteUniverse(){
  const programs=activePrograms(),map=new Map();
  for(const p of programs){for(const x of p.models||[]){
    if(!map.has(x.model))map.set(x.model,{model:x.model,categories:new Set(),programs:new Set()});
    const item=map.get(x.model);if(x.category)item.categories.add(x.category);item.programs.add(shortName(p));
  }}
  return[...map.values()].map(x=>({...x,categories:[...x.categories],programs:[...x.programs]}));
}
function updateAutocomplete(){
  if(!selectedNetwork){hideAutocomplete();return}
  const token=currentTokenInfo();
  if(token.normalized.length<2){hideAutocomplete();return}
  const entered=new Set(parseModels());entered.delete(token.normalized);
  const universe=autocompleteUniverse();
  let matches=universe.filter(x=>x.model.startsWith(token.normalized)&&!entered.has(x.model));
  if(matches.length<8)matches=matches.concat(universe.filter(x=>!x.model.startsWith(token.normalized)&&x.model.includes(token.normalized)&&!entered.has(x.model)&&!matches.some(m=>m.model===x.model)));
  autocompleteItems=matches.slice(0,8);autocompleteIndex=autocompleteItems.length?0:-1;
  renderAutocomplete();
}
function renderAutocomplete(){
  const box=$('autocompleteBox');
  if(!autocompleteItems.length){box.classList.remove('hidden');box.innerHTML='<div class="autocomplete-empty">No matching eligible models</div>';return}
  box.classList.remove('hidden');
  box.innerHTML=autocompleteItems.map((x,i)=>`<button type="button" class="autocomplete-item ${i===autocompleteIndex?'active':''}" data-index="${i}" role="option" aria-selected="${i===autocompleteIndex}"><span class="autocomplete-model">${x.model}</span><span class="autocomplete-meta">${x.categories.slice(0,2).join(' / ')} · ${x.programs.slice(0,2).join(' + ')}${x.programs.length>2?' + more':''}</span></button>`).join('');
  box.querySelectorAll('.autocomplete-item').forEach(b=>{b.onmousedown=e=>{e.preventDefault();chooseAutocomplete(Number(b.dataset.index))}});
}
function hideAutocomplete(){autocompleteItems=[];autocompleteIndex=-1;$('autocompleteBox').classList.add('hidden');$('autocompleteBox').innerHTML=''}
function chooseAutocomplete(i){
  const item=autocompleteItems[i];if(!item)return;
  const t=currentTokenInfo(),v=modelsInput.value;
  let before=v.slice(0,t.start),after=v.slice(t.end);
  if(after&&!/^[\s,;]/.test(after))after='\n'+after;
  const needsNewline=after.length===0;
  modelsInput.value=before+item.model+(needsNewline?'\n':'')+after;
  const pos=(before+item.model+(needsNewline?'\n':'')).length;modelsInput.setSelectionRange(pos,pos);modelsInput.focus();
  $('modelCount').textContent=parseModels().length+' models entered';hideAutocomplete();
}
function handleAutocompleteKeydown(e){
  const box=$('autocompleteBox');if(box.classList.contains('hidden'))return;
  if(e.key==='ArrowDown'){e.preventDefault();if(autocompleteItems.length){autocompleteIndex=(autocompleteIndex+1)%autocompleteItems.length;renderAutocomplete()}}
  else if(e.key==='ArrowUp'){e.preventDefault();if(autocompleteItems.length){autocompleteIndex=(autocompleteIndex-1+autocompleteItems.length)%autocompleteItems.length;renderAutocomplete()}}
  else if(e.key==='Enter'&&autocompleteItems.length){e.preventDefault();chooseAutocomplete(Math.max(0,autocompleteIndex))}
  else if(e.key==='Escape'){e.preventDefault();hideAutocomplete()}
}

function todayLocalISO(){const q=new URLSearchParams(location.search).get('date');if(q&&/^\d{4}-\d{2}-\d{2}$/.test(q))return q;const d=new Date();return[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function isActive(p,date=todayLocalISO()){return(!p.startDate||date>=p.startDate)&&(!p.endDate||date<=p.endDate)}function activePrograms(){return rebateData.programs.filter(p=>isActive(p)&&(p.audiences||[]).includes(selectedNetwork))}function parseModels(){return modelsInput.value.split(/[\s,;]+/).map(norm).filter(Boolean)}function lookup(p,m){return p.models.find(x=>x.model===m)}function catHas(cat,words){return words.some(w=>(cat||'').toLowerCase().includes(w.toLowerCase()))}
function basicResult(models,p){const matches=models.map(m=>lookup(p,m));return{matches,counts:matches.map(Boolean),count:matches.filter(Boolean).length,amount:0,status:'Not eligible',extra:[]}}
function calcCafe(models,p){let r=basicResult(models,p),used=false;r.matches.forEach((x,i)=>{if(!x)return;const restricted=catHas(x.category,p.rules.restrictedGroupKeywords||p.rules.singleCountCategoryKeywords||[]);if(restricted){if(used)r.counts[i]=false;else used=true}});let di=[];r.matches.forEach((x,i)=>{if(x&&x.category.toLowerCase().includes('dishwasher')&&r.counts[i])di.push(i)});di.slice(p.rules.dishwasherCap||2).forEach(i=>r.counts[i]=false);r.count=r.counts.filter(Boolean).length;let base=p.tiers[String(Math.min(r.count,p.rules.maxBaseCount))]||0;if(r.count===2&&r.matches.some((x,i)=>x&&r.counts[i]&&x.category.toLowerCase().includes('dishwasher'))&&p.rules.twoPieceDishwasherExclusion)base=0;const cats=r.matches.filter((x,i)=>x&&r.counts[i]).map(x=>x.category.toLowerCase());let bonus=(cats.some(c=>c.includes('wall oven'))&&cats.some(c=>c.includes('cooktop'))?p.rules.wallOvenCooktopBonus:0)+(cats.some(c=>c.includes('commercial-style range'))?p.rules.commercialStyleRangeBonus:0);r.amount=base+bonus;r.status=r.amount?'Eligible':'Not eligible';if(bonus)r.extra.push('Bonus applied');return r}
function calcProfile(models,p){let r=basicResult(models,p),seen={};r.matches.forEach((x,i)=>{if(!x)return;if(catHas(x.category,p.rules.singleCountCategoryKeywords||[])){let key=catHas(x.category,['Microwave'])?'Microwave':'Ventilation';if(seen[key])r.counts[i]=false;seen[key]=true}});r.count=r.counts.filter(Boolean).length;r.amount=p.tiers[String(Math.min(r.count,p.rules.maxBaseCount))]||0;r.status=r.amount?'Eligible':'Not eligible';return r}
function calcCommercial(models,p){let r=basicResult(models,p),ok=models.includes(p.rules.washer)&&p.rules.dryers.some(d=>models.includes(d));r.count=ok?2:r.count;r.amount=ok?p.rules.payout:0;r.status=ok?'Eligible':'Needs qualifying pair';return r}
function calcCommercialAny(models,p){let r=basicResult(models,p);let ok=p.rules.washers.some(w=>models.includes(w))&&p.rules.dryers.some(d=>models.includes(d));r.count=ok?2:r.count;r.amount=ok?p.rules.payout:0;r.status=ok?'Eligible':'Needs qualifying pair';return r}
function calcMonogram(models,p){let r=basicResult(models,p);r.amount=r.count?p.rules.payout:0;r.status=r.amount?'Eligible':'Not eligible';return r}
function calcBrandTier(models,p){let r=basicResult(models,p),seen=new Set(),count=0;r.matches.forEach((x,i)=>{if(!x||seen.has(x.category))return;seen.add(x.category);r.counts[i]=true;count+=Number(x.countValue||1)});r.count=count;r.amount=p.tiers[String(Math.min(count,p.rules.maxBaseCount||count))]||0;r.status=r.amount?'Eligible':'Not eligible';if(r.matches.some((x,i)=>x&&r.counts[i]&&Number(x.countValue||1)>1))r.extra.push('All-In-One counted as two appliances');return r}
function calcNMGCafe(models,p){let r=basicResult(models,p),seen=new Set(),count=0,base=0;r.counts=r.matches.map(()=>false);r.matches.forEach((x,i)=>{if(!x||seen.has(x.category)||count>=p.rules.maxCount)return;seen.add(x.category);r.counts[i]=true;count++;base+=Number(x.value||0)});let bonus=p.tiers[String(count)]||0;if(count===2&&r.matches.some((x,i)=>x&&r.counts[i]&&x.category==='Dishwashers')&&p.rules.twoPieceDishwasherExclusion)bonus=0;r.count=count;r.amount=base+bonus;r.status=r.amount?'Eligible':'Not eligible';r.extra=[`Model savings ${money(base)}`,bonus?`Package bonus ${money(bonus)}`:null].filter(Boolean);return r}
function calcNMGLabor(models,p){let r=basicResult(models,p);r.counts=r.matches.map(()=>false);const washerIdx=[],dryerIdx=[];r.matches.forEach((x,i)=>{if(x?.category==='Washers')washerIdx.push(i);if(x?.category==='Dryers')dryerIdx.push(i)});const hasPair=washerIdx.length&&dryerIdx.length;let seen=new Set(),count=0,base=0;r.matches.forEach((x,i)=>{if(!x)return;if((x.category==='Washers'||x.category==='Dryers')&&!hasPair)return;if(seen.has(x.category))return;if(count>=p.rules.maxCount)return;seen.add(x.category);r.counts[i]=true;count+=Number(x.countValue||1);base+=Number(x.value||0)});let bonus=0;if(count>=4)bonus+=p.rules.bonus4||0;if(count>=6)bonus+=p.rules.bonus6Additional||0;r.count=count;r.amount=base+bonus;r.status=r.amount?'Eligible':'Not eligible';r.extra=[hasPair&&washerIdx.length?'Laundry pair requirement satisfied':washerIdx.length||dryerIdx.length?'Laundry not counted without a pair':null,r.matches.some((x,i)=>x&&r.counts[i]&&x.countValue===2)?'Combo Unit counted as two appliances':null,bonus?`Package bonus ${money(bonus)}`:null].filter(Boolean);return r}
function calcProfileLaundry(models,p){let r=basicResult(models,p);r.counts=r.matches.map(()=>false);let best={amount:0,idx:[],desc:''};const idx=m=>models.findIndex(x=>x===m);for(const [combo,accs] of Object.entries(p.rules.combo)){if(!models.includes(combo))continue;for(const [acc,val] of Object.entries(accs)){if(models.includes(acc)&&val>best.amount)best={amount:val,idx:[idx(combo),idx(acc)],desc:'UltraFast Combo + matching riser'}}}for(const rule of p.rules.pairs){if(!models.includes(rule.washer))continue;const dryer=rule.dryers.find(d=>models.includes(d));if(!dryer)continue;for(const [acc,val] of Object.entries(rule.accessories)){if(models.includes(acc)&&val>best.amount)best={amount:val,idx:[idx(rule.washer),idx(dryer),idx(acc)],desc:'Front-load pair + matching riser/pedestal'}}}best.idx.filter(i=>i>=0).forEach(i=>r.counts[i]=true);r.count=r.counts.filter(Boolean).length;r.amount=best.amount;r.status=r.amount?'Eligible — exclusive alternative':'Needs matching pair/combo + accessory';r.extra=r.amount?[best.desc,'Not stackable with other GE Appliances rebates/promotions']:[];return r}
function calculateProgram(models,p){if(p.calculator==='nmgCafeCombined')return calcNMGCafe(models,p);if(p.calculator==='nmgLaborDay')return calcNMGLabor(models,p);if(p.calculator==='commercialPairAnyWasher')return calcCommercialAny(models,p);if(p.calculator==='profileLaundryPedestal')return calcProfileLaundry(models,p);if(p.id==='cafe')return calcCafe(models,p);if(p.id==='profile')return calcProfile(models,p);if(p.id==='commercial')return calcCommercial(models,p);if(p.id==='monogram')return calcMonogram(models,p);if(p.rules?.limitPerCategory)return calcBrandTier(models,p);return calcProfile(models,p)}
function calculate(){const models=parseModels();localStorage.setItem('applianceRebateModelsNetwork',models.join('\n'));render(models);const snapshot=analyticsSnapshot();trackEvent('check_rebates',snapshot);Object.entries(lastResults).forEach(([programId,result])=>{if(Number(result?.amount||0)>0)trackEvent('rebate_qualified',{dealer_network:selectedNetwork,rebate_program:programId,rebate_amount:Number(result.amount||0),package_size:models.length})})}
function compatibleTotal(programs,results){let regular=0,exclusive=[];programs.forEach(p=>{const amt=results[p.id]?.amount||0;if(p.rules?.exclusive)exclusive.push({p,amt});else regular+=amt});const bestExclusive=exclusive.reduce((a,b)=>b.amt>a.amt?b:a,{amt:0});if(bestExclusive.amt>regular)return{total:bestExclusive.amt,note:`Uses ${bestExclusive.p.name} as the better exclusive alternative.`};if(bestExclusive.amt>0)return{total:regular,note:`Exclusive Profile Laundry option: ${money(bestExclusive.amt)} (not stacked into total).`};return{total:regular,note:''}}
function render(models){if(!rebateData||!selectedNetwork)return;const programs=activePrograms();lastActivePrograms=programs;let results={};programs.forEach(p=>results[p.id]=calculateProgram(models,p));lastResults=results;const t=compatibleTotal(programs,results);$('totalSavings').textContent=money(t.total);$('totalNote').textContent=t.note;$('modelCount').textContent=models.length+' models entered';$('asOfDate').textContent='Active rebates as of '+new Date(todayLocalISO()+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});const printable=programs.filter(p=>results[p.id]?.amount>0&&p.pdf);$('printFormsBtn').disabled=!printable.length;$('printFormsBtn').textContent=printable.length?`Print Eligible Rebate Forms (${printable.length})`:'Print Eligible Rebate Forms';$('summaryCards').innerHTML=programs.map(p=>{let r=results[p.id];return`<article class="summary-card" style="--accent:${p.color}"><div class="top"><div><h4>${p.name}</h4><span class="sub">${p.validDates}</span></div><div class="amount">${money(r.amount)}</div></div><div class="metrics"><div class="metric"><strong>${r.count}</strong><span>ELIGIBLE / COUNTED</span></div><div class="metric"><strong>${r.status}</strong><span>STATUS</span></div></div>${r.amount>0&&p.pdf?`<a class="form-link" href="${p.pdf}" target="_blank" rel="noopener">View official rebate form</a>`:''}${p.rules?.exclusive&&r.amount?'<div class="exclusive-note">Exclusive alternative — not added on top of other GE Appliances rebates.</div>':''}${r.extra.length?`<div class="pill yes">${r.extra.join(' • ')}</div>`:''}<ul>${p.notes.map(n=>`<li>${n}</li>`).join('')}</ul></article>`}).join('')||'<div class="unknown"><strong>No rebate programs are active for this network today.</strong></div>';let known=new Set(programs.flatMap(p=>p.models.map(x=>x.model))),unknown=[...new Set(models.filter(m=>!known.has(m)))],ub=$('unknownBox');if(unknown.length){ub.classList.remove('hidden');ub.innerHTML=`<strong>Not found in any active ${selectedNetwork==='brandsource'?'BrandSource':'Nationwide/NMG'} rebate:</strong><br>${unknown.join(', ')}`}else ub.classList.add('hidden');$('detailHead').innerHTML='<tr><th>Model</th>'+programs.map(p=>`<th>${shortName(p)}</th>`).join('')+'</tr>';if(!models.length){$('detailBody').innerHTML=`<tr><td colspan="${programs.length+1}" class="empty">Enter models to begin.</td></tr>`;return}$('detailBody').innerHTML=models.map((m,i)=>`<tr><td class="model">${m}</td>${programs.map(p=>{let r=results[p.id],x=r.matches[i];if(!x)return'<td><span class="pill no">Not listed</span></td>';let counted=r.counts[i];let msg=counted?(x.countValue>1?`Eligible / counts as ${x.countValue}`:'Eligible / counted'):'Listed / requirement or limit not met';return`<td><span class="pill ${counted?'yes':'limited'}">${msg}</span><span class="sub">${x.category}${x.value?' · '+money(x.value):''}</span></td>`}).join('')}</tr>`).join('')}
function shortName(p){const map={'cafe':'Café National','nmg-cafe-2026-h2':'NMG Café','profile':'Profile','profile-laundry-pedestal-2026':'Profile Laundry','commercial':'BS Commercial Laundry','nmg-commercial-2026-h2':'NMG Commercial Laundry','monogram':'Monogram D&I','labor-day-2026':'BS Labor Day','nmg-labor-day-2026':'NMG Labor Day'};return map[p.id]||p.name}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function printFallbackHtml(eligible,message){const links=eligible.map((p,i)=>{const href=new URL(p.pdf,window.location.href).href;return `<li><a href="${href}" target="_blank" rel="noopener">${escapeHtml(p.name)}</a></li>`}).join('');return `<!doctype html><title>Eligible rebate forms</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;padding:32px;color:#233;background:#f6f8fb}.box{max-width:720px;margin:auto;background:white;padding:28px;border-radius:14px;box-shadow:0 8px 30px #0001}a{color:#075aa8;font-weight:700}li{margin:14px 0}.note{background:#fff7df;padding:14px;border-radius:10px;margin:16px 0}</style><div class="box"><h2>Eligible rebate forms</h2><div class="note">${escapeHtml(message)}</div><p>Open each qualifying form below, then use the PDF viewer's Print button or Ctrl+P.</p><ol>${links}</ol></div>`}
function loadPdfLibFallback(){return new Promise(resolve=>{if(window.PDFLib)return resolve(true);const existing=document.querySelector('script[data-pdf-lib-fallback]');if(existing){existing.addEventListener('load',()=>resolve(!!window.PDFLib),{once:true});existing.addEventListener('error',()=>resolve(false),{once:true});return}const s=document.createElement('script');s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';s.defer=true;s.dataset.pdfLibFallback='1';s.onload=()=>resolve(!!window.PDFLib);s.onerror=()=>resolve(false);document.head.appendChild(s);setTimeout(()=>resolve(!!window.PDFLib),5000)})}
async function printEligibleForms(){
  const eligible=lastActivePrograms.filter(p=>lastResults[p.id]?.amount>0&&p.pdf);
  if(!eligible.length)return;
  trackEvent('print_eligible_rebate_forms',{...analyticsSnapshot(),forms_count:eligible.length});

  // Use the exact same print path for one form or many forms. Opening the
  // window synchronously keeps browsers from treating the final PDF as a
  // delayed popup after the async merge finishes.
  const popup=window.open('about:blank','_blank');
  if(!popup){
    alert('Please allow pop-ups for this site so the eligible rebate form(s) can open.');
    return;
  }
  popup.document.open();
  popup.document.write('<!doctype html><title>Preparing rebate forms...</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;padding:32px;color:#233;background:#f6f8fb}.box{max-width:620px;margin:auto;background:#fff;padding:28px;border-radius:14px;box-shadow:0 8px 30px #0001}progress{width:100%}</style><div class="box"><h2>Preparing eligible rebate form'+(eligible.length===1?'':'s')+'…</h2><p>Preparing '+eligible.length+' official rebate form'+(eligible.length===1?'':'s')+'.</p><progress></progress><p>This can take a few seconds.</p></div>');
  popup.document.close();

  try{
    if(!window.PDFLib){
      const loaded=await loadPdfLibFallback();
      if(!loaded)throw new Error('The PDF packet library was blocked by the browser or network.');
    }

    const merged=await PDFLib.PDFDocument.create();
    for(const p of eligible){
      // Resolve every form against the actual site URL before fetching. This
      // prevents blank-tab/relative-path behavior from affecting one-form jobs.
      const formUrl=new URL(p.pdf,window.location.href).href;
      const res=await fetch(formUrl,{cache:'no-store'});
      if(!res.ok)throw new Error(`Could not load ${p.name} form.`);
      const src=await PDFLib.PDFDocument.load(await res.arrayBuffer(),{ignoreEncryption:true});
      const pages=await merged.copyPages(src,src.getPageIndices());
      pages.forEach(pg=>merged.addPage(pg));
    }

    const bytes=await merged.save();
    const blob=new Blob([bytes],{type:'application/pdf'});
    const url=URL.createObjectURL(blob);
    popup.location.replace(url);
    setTimeout(()=>URL.revokeObjectURL(url),10*60*1000);
  }catch(err){
    console.error('Eligible rebate print failed:',err);
    popup.document.open();
    popup.document.write(printFallbackHtml(eligible,'The PDF packet could not be prepared automatically on this browser/network. Open the eligible form(s) below to print them.'));
    popup.document.close();
  }
}
if(rebateData){if(selectedNetwork)selectNetwork(selectedNetwork)}else{$('networkCopy').textContent='Rebate data failed to load. Confirm rebate-data.js is uploaded beside index.html.'}
