'use strict';
// Без cookies, хранилища, идентификатора посетителя и отправки на сервер.
// История ограничена текущей вкладкой. collector не подключён.
(function(){
 const sources=new Set(['telegram_footer','vk_footer','max_footer','telegram_calculator','vk_calculator','max_calculator']);
 const events=[];
 const api=Object.freeze({
  mode:'browser_only',
  record(event,source,medium='button'){
   if(!sources.has(source)||!['contact_click','contact_transition_requested','contact_unavailable'].includes(event))return;
   const item=Object.freeze({event,source,medium:medium==='qr'?'qr':'button',page:location.pathname.split('/').slice(-2).join('/'),at:new Date().toISOString()});
   events.push(item);if(events.length>500)events.shift();
   window.dispatchEvent(new CustomEvent('vlasovtech:contact',{detail:item}));
   if(Array.isArray(window.dataLayer))window.dataLayer.push({...item});
  },
  snapshot:()=>events.map(x=>({...x}))
 });
 window.VlasovTechAnalytics=api;
 document.addEventListener('click',e=>{
  const el=e.target.closest('[data-contact-source]');if(!el)return;
  const source=el.dataset.contactSource,medium=el.dataset.contactMedium||'button';
  api.record('contact_click',source,medium);
  if(el.matches('[disabled],[aria-disabled=true]')||!el.getAttribute('href')){api.record('contact_unavailable',source,medium);return;}
  // Это запрос перехода. Он не доказывает запуск приложения или отправку сообщения.
  api.record('contact_transition_requested',source,medium);
  try{if(window.parent!==window&&window.parent.VlasovTechAnalytics){window.parent.VlasovTechAnalytics.record('contact_click',source,medium);window.parent.VlasovTechAnalytics.record('contact_transition_requested',source,medium);}}catch{/* Same-origin bridge only. */}
 });
})();
