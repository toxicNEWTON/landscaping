/* PANLABAS — no dependencies, no external requests. */
(() => {
 'use strict';
 const root = document.documentElement;
 root.classList.add('js');
 const $ = (selector, scope=document) => scope.querySelector(selector);
 const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];
 const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const themeSwitch = $('#themeSwitch');
 const themeLabel = $('.theme-label');
 const storageKey = 'panlabas-theme';
 let savedTheme;
 try { savedTheme = localStorage.getItem(storageKey); } catch (_) { savedTheme = null; }
 const setTheme = theme => {
   const dark = theme === 'dark';
   root.dataset.theme = dark ? 'dark' : 'light';
   themeSwitch.setAttribute('aria-pressed', String(dark));
   themeSwitch.setAttribute('aria-label', dark ? 'Switch to colorful mode' : 'Switch to dark mode');
   themeSwitch.title = dark ? 'Switch to colorful mode' : 'Switch to dark mode';
   themeLabel.textContent = dark ? 'COLOR' : 'DARK';
   const metaTheme = $('meta[name="theme-color"]');
   if (metaTheme) metaTheme.content = dark ? '#0b100d' : '#f0f0e8';
   try { localStorage.setItem(storageKey, dark ? 'dark' : 'light'); } catch (_) {}
 };
 setTheme(savedTheme === 'dark' ? 'dark' : 'light');
 themeSwitch.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

 const menuButton = $('#mobileMenuButton');
 const mobileMenu = $('#mobileMenu');
 function closeMenu() { mobileMenu.hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Open menu'); }
 menuButton.addEventListener('click', () => {
   const open = menuButton.getAttribute('aria-expanded') === 'true';
   mobileMenu.hidden = open; menuButton.setAttribute('aria-expanded', String(!open));
   menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
 });
 $$('#mobileMenu a').forEach(a => a.addEventListener('click', closeMenu));
 document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
 document.addEventListener('click', e => { if (!mobileMenu.hidden && !mobileMenu.contains(e.target) && !menuButton.contains(e.target)) closeMenu(); });

 const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
   entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); } });
 }, {threshold:0.08,rootMargin:'0px 0px -30px 0px'}) : null;
 $$('.reveal').forEach((el, i) => { if (!io || prefersReduced.matches) el.classList.add('visible'); else io.observe(el); });

 const header=$('#siteHeader');
 const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>10);
 window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();

 const compare = $('#comparison');
 const range = $('#compareRange');
 if (compare && range) {
   const setSplit = () => compare.style.setProperty('--split', range.value + '%');
   range.addEventListener('input', setSplit); setSplit();
 }

 const pointerFine = window.matchMedia('(pointer:fine)').matches;
 if (pointerFine && !prefersReduced.matches) {
   const glow = $('#cursorGlow'), ring = $('#cursorRing');
   let pos = {x:-1000,y:-1000}, ringPos = {x:-1000,y:-1000};
   document.addEventListener('pointermove', e => {
     if (e.pointerType !== 'mouse') return;
     pos.x=e.clientX;pos.y=e.clientY;
     glow.style.left=pos.x+'px';glow.style.top=pos.y+'px';
     document.body.classList.add('is-pointer');
   }, {passive:true});
   document.addEventListener('pointerover', e => {
     document.body.classList.toggle('cursor-active', Boolean(e.target.closest('a,button,input,.project-card')));
   });
   const tick = () => {
     ringPos.x += (pos.x-ringPos.x)*.23;
     ringPos.y += (pos.y-ringPos.y)*.23;
     ring.style.left=ringPos.x+'px';ring.style.top=ringPos.y+'px';
     requestAnimationFrame(tick);
   }; requestAnimationFrame(tick);
   $$('.magnetic').forEach(el => {
     el.addEventListener('pointermove', e => {
       const b=el.getBoundingClientRect();
       const dx=(e.clientX-(b.left+b.width/2))*.13;
       const dy=(e.clientY-(b.top+b.height/2))*.13;
       el.style.transform=`translate3d(${dx}px,${dy}px,0)`;
     }, {passive:true});
     el.addEventListener('pointerleave', () => {el.style.transition='transform .5s cubic-bezier(.22,1,.36,1), background .3s';el.style.transform='';});
   });
 }

 // Subtle perspective interaction on portfolio cards, desktop only.
 if (pointerFine && !prefersReduced.matches) {
   $$('.tilt-target').forEach(el => {
     el.addEventListener('pointermove', e => {
       const r=el.getBoundingClientRect();
       const px=(e.clientX-r.left)/r.width-.5;
       const py=(e.clientY-r.top)/r.height-.5;
       el.style.transform=`perspective(1200px) rotateY(${px*4}deg) rotateX(${-py*4}deg)`;
     }, {passive:true});
     el.addEventListener('pointerleave',()=>{el.style.transform='';});
   });
 }

 // Restrained parallax, once per rendered frame, disabled for reduced motion.
 const photo=$('.immersive-photo > img');
 if (photo && !prefersReduced.matches) {
   let scheduled = false;
   const updateParallax = () => {
     const r=photo.parentElement.getBoundingClientRect();
     if (r.bottom>0 && r.top<innerHeight) {
       const scrollRatio=(r.top+r.height/2-innerHeight/2)/innerHeight;
       photo.style.transform=`translateY(${Math.max(-25,Math.min(25,-scrollRatio*32))}px)`;
     }
     scheduled=false;
   };
   window.addEventListener('scroll', () => { if(!scheduled) { requestAnimationFrame(updateParallax);scheduled=true; } }, {passive:true});
   updateParallax();
 }

 // Project preview modal: illustrative design concept images, not claimed jobs.
 const projectModal=document.createElement('div');
 projectModal.className='project-modal'; projectModal.hidden=true;
 projectModal.setAttribute('role','dialog'); projectModal.setAttribute('aria-modal','true');
 projectModal.setAttribute('aria-label','Illustrative landscape concept preview');
 projectModal.innerHTML='<button class="project-modal-close" type="button" aria-label="Close preview">✕</button><img alt=""><div class="project-modal-caption"></div>';
 document.body.append(projectModal);
 let lastFocus=null;
 const closeProject=() => { projectModal.hidden=true; document.body.style.overflow='';if(lastFocus) lastFocus.focus(); };
 $('.project-modal-close',projectModal).addEventListener('click',closeProject);
 projectModal.addEventListener('click',e => {if(e.target===projectModal) closeProject();});
 document.addEventListener('keydown',e => {if(e.key==='Escape'&&!projectModal.hidden) closeProject();});
 $$('.project-card').forEach(card => {
   card.setAttribute('role','button'); card.setAttribute('aria-label','Open illustrative project concept');
   const open=() => {
     lastFocus=card;
     const img=$('img',card);
     $('img',projectModal).src=img.src;
     $('img',projectModal).alt=img.alt;
     $('.project-modal-caption',projectModal).textContent=$('.project-details',card).innerText.replace(/\s+/g,' ').trim()+' · ILLUSTRATIVE CONCEPT';
     projectModal.hidden=false;document.body.style.overflow='hidden';$('.project-modal-close',projectModal).focus();
   };
   card.addEventListener('click',open);
   card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
 });

 const form=$('#enquiryForm'), output=$('#formOutput'), copyButton=$('#copyEnquiry');
 if(form){
   let enquiry='';
   form.addEventListener('submit',e=>{
     e.preventDefault();
     if(!form.reportValidity())return;
     const data=new FormData(form);
     enquiry=[
       'Hello PANLABAS LANDSCAPING,',
       'I would like to enquire about an outdoor landscaping project.',
       '', 'Name: '+data.get('name'), 'Email: '+data.get('email'),
       'Project type: '+data.get('type'), 'Location: '+(data.get('location')||'Not specified'),
       'Message: '+data.get('message'),'', 'Please let me know the next steps.'
     ].join('\n');
     output.hidden=false;
     output.scrollIntoView({behavior:prefersReduced.matches?'auto':'smooth',block:'nearest'});
   });
   copyButton.addEventListener('click',async()=>{
     try {await navigator.clipboard.writeText(enquiry);copyButton.textContent='COPIED ✓';}
     catch(_){
       const t=document.createElement('textarea');t.value=enquiry;document.body.append(t);t.select();
       try{document.execCommand('copy');copyButton.textContent='COPIED ✓';}catch(err){copyButton.textContent='COPY FAILED';}
       t.remove();
     }
   });
 }
 const year=$('#year');if(year)year.textContent=String(new Date().getFullYear());
})();
