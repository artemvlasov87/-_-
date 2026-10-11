'use strict';
// Only enumerated form values. No contact text, raw URLs, IP or keystrokes.
(function(){
 const ENDPOINT=window.VLASOV_ANALYTICS_ENDPOINT||'';
 const VERSION='5.0-2026.10.12', KEY='vlasovtech.analytics.choice.v1', VISITOR='vlasovtech.analytics.visitor.v1';
 const uuid=()=>crypto.randomUUID(), started=performance.now(), session=uuid();
 const safeGet=k=>{try{return localStorage.getItem(k)}catch{return null}},safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
 let enabled=false, visitor=uuid(), queue=[], busy=false, step='object', calcId='', fingerprint='', calcTimer, pendingResult=null, formStarted=false;
 let entry=new URL(location.href);try{if(window.parent!==window&&window.parent.location.origin===location.origin)entry=new URL(window.parent.location.href)}catch{}
 const test=entry.searchParams.get('analytics_test')==='1';
 function viewport(){try{if(window.parent!==window&&window.frameElement&&window.parent.location.origin===location.origin){const b=window.frameElement.getBoundingClientRect();return {width:window.parent.innerWidth,height:window.parent.innerHeight,top:b.top,left:b.left,frameVisible:b.bottom>0&&b.top<window.parent.innerHeight};}}catch{}return {width:innerWidth,height:innerHeight,top:0,left:0,frameVisible:true};}
 function isSeen(el){if(!el||el.closest('[hidden]'))return false;const b=el.getBoundingClientRect(),v=viewport();return b.bottom+v.top>0&&b.top+v.top<v.height&&b.right+v.left>0&&b.left+v.left<v.width;}
 const source={};for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','src']){const v=entry.searchParams.get(k);if(v&&/^[a-zA-Z0-9_.-]{1,80}$/.test(v))source[k]=v;}
 try{source.referrer_host=new URL(document.referrer).hostname}catch{}
 function record(event,extra={}){
  if(!enabled||!ENDPOINT)return;
  if(queue.length>=300)return;
  queue.push({event_id:uuid(),visitor_id:visitor,session_id:session,event,elapsed_ms:Math.min(86400000,Math.round(performance.now()-started)),step,test,...extra});
 }
 async function flush(){
  if(busy||!queue.length||!enabled||!ENDPOINT||document.visibilityState==='hidden')return;
  busy=true;const batch=queue.slice(0,40);
  try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain'},credentials:'omit',body:JSON.stringify({events:batch}),keepalive:true,referrerPolicy:'no-referrer'});if(r.ok)queue.splice(0,batch.length);}catch{}finally{busy=false}
 }
 function exit(event){commit();record(event,{calculation_id:calcId||undefined,visible:false});if(!enabled||!queue.length||!ENDPOINT)return;try{navigator.sendBeacon(ENDPOINT,new Blob([JSON.stringify({events:queue.slice(0,40)})],{type:'text/plain'}))}catch{}}
 const seenResults=new Set();
 function view(id){if(!enabled||!id||seenResults.has(id))return;seenResults.add(id);record('result_view',{calculation_id:id,step:'result'});}
 function commit(){if(pendingResult){record('result_generated',pendingResult);if(isSeen(document.getElementById('result-content')))view(pendingResult.calculation_id);pendingResult=null;clearTimeout(calcTimer);}}
 function result(data,r,prices){
  if(!enabled)return '';
  const pkg=({'Эконом':'economy','Комфорт':'comfort','Премиум':'premium'})[r.package];
  const value={object_type:data.object_type,area_m2:data.area_m2,need_smart_home:data.need_smart_home,electric_level:data.electric_level,main_priority:data.main_priority,package:pkg,functions:data.selected_functions,systems:r.systems,automation_level:prices[0]?.materials?.level||'',prices:prices.map(p=>({system:p.id,work_rate:p.rate,works:p.total,materials:p.materials?.combined,total:p.fullTotal}))};
  const fp=JSON.stringify(value);if(fp!==fingerprint){fingerprint=fp;calcId=uuid();pendingResult={calculation_id:calcId,result:value};clearTimeout(calcTimer);calcTimer=setTimeout(commit,700);}
  return calcId;
 }
 function start(){
  if(enabled||!ENDPOINT)return;enabled=true;
  try{const old=JSON.parse(safeGet(VISITOR)||'null');if(old&&/^[a-f0-9-]{36}$/.test(old.id)&&Date.now()-old.at<90*86400000)visitor=old.id}catch{}
  safeSet(VISITOR,JSON.stringify({id:visitor,at:Date.now()}));
  record('visit_start',{source,embedded:window.parent!==window,device:matchMedia('(pointer:coarse)').matches?'touch':'desktop',viewport:[viewport().width,viewport().height]});
  if(isSeen(document.getElementById('object-title')))record('step_view',{step:'object'});if(typeof collect==='function'&&collect().object_type){record('form_start');formStarted=true;}if(typeof refresh==='function')refresh();flush();
 }
 function choice(value){safeSet(KEY,JSON.stringify({value,at:Date.now()}));document.getElementById('analytics-notice').hidden=true;if(value==='yes')start();else{enabled=false;queue=[];calcId='';fingerprint='';pendingResult=null;clearTimeout(calcTimer);try{localStorage.removeItem(VISITOR)}catch{}if(typeof refresh==='function')refresh();}}
 function notice(){document.getElementById('analytics-notice').hidden=false;}
 window.VlasovTechAnalytics={record,result,flush,commit,get calculationId(){return calcId},get enabled(){return enabled},version:VERSION};
 document.addEventListener('DOMContentLoaded',()=>{
  if(window.parent!==window){const n=document.getElementById('analytics-notice');document.querySelector('main').before(n);n.style.position='static';}
  document.getElementById('analytics-accept').addEventListener('click',()=>choice('yes'));
  document.getElementById('analytics-decline').addEventListener('click',()=>choice('no'));
  document.getElementById('analytics-settings').addEventListener('click',notice);
  let saved;try{saved=JSON.parse(safeGet(KEY)||'null')}catch{}
  if(saved&&Date.now()-saved.at<180*86400000){document.getElementById('analytics-notice').hidden=true;if(saved.value==='yes')start();}else notice();
  const form=document.getElementById('configuration');
  form.addEventListener('change',e=>{const el=e.target;if(!enabled||!['object_type','area_m2','need_smart_home','electric_level','main_priority','functions'].includes(el.name)||el.disabled)return;step=({object_type:'object',area_m2:'area',need_smart_home:'need',electric_level:'electric_level',main_priority:'priority',functions:'functions'})[el.name];if(!formStarted){record('form_start');formStarted=true;}record('field_change',{field:el.name,...(el.name==='area_m2'?{}:{value:el.value,checked:el.checked})});if(el.name==='need_smart_home'&&el.value==='electric')record('step_view',{step:'electric_level'});});
  form.addEventListener('submit',()=>{if(typeof lastResult!=='undefined'&&lastResult?.errors?.length)lastResult.errors.forEach(e=>record('validation_error',{field:e.selector==='#area_m2'?'area_m2':e.selector.match(/name="([^"]+)/)?.[1]}));});
  form.addEventListener('reset',()=>{commit();record('reset');fingerprint='';calcId='';formStarted=false;});
  const sections={'object-title':'object','area-title':'area','need-title':'need','smart-title':'functions','electric-level-title':'electric_level','priority-title':'priority','result-title':'result'};
  const seen=new Set();const io=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting||!isSeen(e.target))continue;step=sections[e.target.id];if(!enabled||seen.has(step))continue;seen.add(step);record('step_view',{step});if(step==='result'&&document.getElementById('contact-actions')?.hidden===false){commit();view(calcId);}}},{threshold:0.7});
  for(const id of Object.keys(sections)){const el=document.getElementById(id);if(el)io.observe(el)}
  function visibleSteps(){if(!enabled)return;for(const id of Object.keys(sections)){const el=document.getElementById(id),name=sections[id];if(!isSeen(el))continue;step=name;if(!seen.has(name)){seen.add(name);record('step_view',{step:name});}}if(isSeen(document.getElementById('result-content'))&&document.getElementById('contact-actions')?.hidden===false){commit();view(calcId);}}
  addEventListener('scroll',visibleSteps,{passive:true});try{if(window.parent!==window&&window.parent.location.origin===location.origin)window.parent.addEventListener('scroll',visibleSteps,{passive:true});}catch{}
  setInterval(visibleSteps,1000);
  const dialog=document.getElementById('area-confirmation');if(dialog)new MutationObserver(()=>{if(dialog.open)record('area_review',{step:'area'});}).observe(dialog,{attributes:true,attributeFilter:['open']});
  document.addEventListener('click',e=>{const el=e.target.closest('a,button,summary');if(!el)return;const channel=({'telegram-cta':'telegram','vk-cta':'vk','max-cta':'max','email-cta':'email'})[el.id];if(channel&&el.hasAttribute('href')&&!el.closest('[hidden]')){commit();view(calcId);record('contact_click',{channel,calculation_id:calcId});flush();}else if(el.id==='copy-result'){commit();view(calcId);record('copy_click',{calculation_id:calcId});}else if(el.id==='confirm-area')record('area_confirm',{step:'area'});else if(el.id==='edit-area')record('area_edit',{step:'area'});else if(el.type==='submit')record('ui_click',{ui:'submit'});});
  const status=document.getElementById('result-status');if(status)new MutationObserver(()=>{if(status.textContent.startsWith('Текст скопирован'))record('copy_success',{calculation_id:calcId});else if(status.textContent.startsWith('Автокопирование недоступно'))record('copy_fallback',{calculation_id:calcId});}).observe(status,{childList:true,subtree:true,characterData:true});
 });
 let scroll=0;addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;const value=max>0?Math.min(100,Math.floor(scrollY/max*4)*25):100;if(value>scroll){scroll=value;record('scroll',{scroll_percent:value});}},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)exit('visibility');else{record('visibility',{visible:true});flush();}});
 addEventListener('pagehide',()=>exit('page_exit'));
 setInterval(flush,5000);setInterval(()=>{if(!document.hidden&&viewport().frameVisible){record('heartbeat',{calculation_id:calcId||undefined,visible:true});flush();}},30000);
})();
