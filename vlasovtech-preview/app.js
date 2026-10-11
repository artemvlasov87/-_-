'use strict';
// Не канонический бренд-стандарт: интерактивные UI-решения этого сайта.
const touchDevice = matchMedia('(pointer:coarse)').matches || (navigator.maxTouchPoints > 0 && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent));
if(touchDevice && innerWidth > 650) document.documentElement.classList.add('touch-device');
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');
function closeMenu(){nav?.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');}
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){closeMenu();toggle.focus();}});
const scenes={
 light:['Свет под Ваш вечер','Рабочий свет для дел, мягкий — для отдыха. Один сценарий может менять несколько групп одновременно.',['Согласованные группы света','Диммирование — для совместимых светильников','Управление выключателем или приложением']],
 climate:['Комфортная температура','Система может согласовывать отопление и климатическое оборудование, чтобы команды не противоречили друг другу.',['Проверка моделей и способов подключения','Настройки по помещениям','Приоритеты отопления и охлаждения']],
 away:['Уходите — дом меняет режим','Одно действие может выключить выбранный свет и перевести климат в согласованный режим.',['Список отключаемых групп','Критичные нагрузки остаются по проекту','Возвращение — отдельный сценарий']],
 leak:['Протечка: обнаружить и перекрыть','Датчик может дать команду совместимому приводу крана. Место установки и логику действия определяем заранее.',['Датчики в согласованных зонах','Проверка кранов и питания','Проверка срабатывания при запуске']],
 curtains:['Шторы без ежедневной рутины','Открытие по команде или расписанию. Тип карниза, привод и питание согласуем до отделки.',['Подготовка питания','Подбор совместимого привода','Сценарий совместно со светом']],
 control:['Привычный способ управления','Выключатель, приложение, панель или голос. Способы управления выбираем под Ваши привычки и оборудование.',['Физическое управление по проекту','Интерфейс под согласованные функции','Алиса — после проверки интеграции']]
};
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const [title,copy,list]=scenes[button.dataset.scene];document.getElementById('scene-title').textContent=title;document.getElementById('scene-copy').textContent=copy;document.getElementById('scene-list').replaceChildren(...list.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}));
const form=document.querySelector('#request-form'),output=document.querySelector('#message-output'),result=document.querySelector('#message-result'),status=document.querySelector('#copy-status');
form?.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const d=new FormData(form);const text=['Здравствуйте! Хочу обсудить проект с VlasovTech.','Объект: '+d.get('object'),'Стадия: '+d.get('stage'),...(String(d.get('area')).trim()?['Площадь: '+d.get('area')+' м²']:[]),'Задача: '+String(d.get('task')).trim()].join('\n');output.value=text;document.getElementById('telegram-message').href='https://t.me/vlasovtech_pro?text='+encodeURIComponent(text);result.hidden=false;status.textContent='Текст подготовлен. Выберите канал и отправьте сообщение самостоятельно.';output.focus();});
document.querySelector('#copy-message')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);status.textContent='Текст скопирован. Вставьте его в переписку и отправьте.';}catch{output.focus();output.select();status.textContent='Браузер не разрешил копирование. Выделите текст и скопируйте вручную.';}});
form?.addEventListener('input',()=>{if(result&&!result.hidden){result.hidden=true;output.value='';status.textContent='';document.getElementById('telegram-message').href='https://t.me/vlasovtech_pro';}});
const frame=document.querySelector('.calculator-frame');
frame?.addEventListener('load',()=>{try{const doc=frame.contentDocument;const resize=()=>{frame.style.height=(Math.max(doc.documentElement.scrollHeight,doc.body.scrollHeight)+24)+'px';};resize();new ResizeObserver(resize).observe(doc.body);}catch{/* file:// может запретить доступ к iframe; остаётся стандартная прокрутка. */}});
