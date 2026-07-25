/* header shadow on scroll */
const hdr=document.getElementById('hdr');
if(hdr)addEventListener('scroll',()=>hdr.classList.toggle('scrolled',scrollY>30),{passive:true});

/* reveal on scroll (with fallback) */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
const rvs=[...document.querySelectorAll('.rv')];
rvs.forEach((el,i)=>{el.style.transitionDelay=(i%5*60)+'ms';io.observe(el)});
function revealCheck(){for(const el of rvs){if(el.classList.contains('in'))continue;if(el.getBoundingClientRect().top<innerHeight*0.92){el.classList.add('in');io.unobserve(el);}}}
addEventListener('scroll',revealCheck,{passive:true});
addEventListener('load',()=>{revealCheck();setTimeout(revealCheck,400);});
revealCheck();

/* mission — scroll-driven word reveal */
const statement=document.getElementById('statement');
if(statement){
  const words=[...statement.querySelectorAll('.w')];
  let lit=-1;
  function lite(){
    const vh=window.innerHeight||document.documentElement.clientHeight||800;
    const r=statement.getBoundingClientRect();
    const start=vh*0.82,end=vh*0.30;
    let p=(start-r.top)/(start-end);p=Math.max(0,Math.min(1,p));
    const n=Math.round(p*words.length);
    if(n===lit)return;lit=n;
    words.forEach((w,i)=>w.classList.toggle('lit',i<n));
  }
  addEventListener('scroll',lite,{passive:true});addEventListener('resize',lite);lite();
}

/* scroll progress */
const prog=document.getElementById('prog');
if(prog)addEventListener('scroll',()=>{const m=document.documentElement.scrollHeight-innerHeight;prog.style.width=(m>0?scrollY/m*100:0)+'%';},{passive:true});

/* ambient background videos — only the on-screen video plays.
   Playing every full-screen bg video at once is the main cause of fast-scroll stalls on iOS. */
const bgs=[...document.querySelectorAll('video.bg')];
bgs.forEach(v=>{v.muted=true;});
const _heroLoader=document.getElementById('loader')&&!document.documentElement.classList.contains('no-intro');
if('IntersectionObserver'in window){
  const vio=new IntersectionObserver(es=>es.forEach(e=>{
    const v=e.target;
    if(e.isIntersecting){v.play&&v.play().catch(()=>{});}
    else if(!v.paused){v.pause();}
  }),{threshold:0.05});
  bgs.forEach(v=>vio.observe(v));
}else{
  bgs.forEach(v=>{v.play&&v.play().catch(()=>{});});
}
/* hero: restart from frame 0 exactly as the loader curtain lifts */
if(_heroLoader){const _hv=document.getElementById('heroVid');if(_hv)setTimeout(()=>{try{_hv.currentTime=0;}catch(e){}_hv.play().catch(()=>{});},2050);}

/* film — FLIP: the frame itself grows from its spot into the player (one connected motion) */
const filmSec=document.getElementById('film');
if(filmSec){
  const frame=document.getElementById('filmFrame'),preview=document.getElementById('filmPreview'),full=document.getElementById('filmFull'),cta=filmSec.querySelector('.fs-cta'),closeBtn=document.getElementById('filmClose'),backdrop=document.getElementById('filmBackdrop');
  function flip(toPlaying){
    const first=frame.getBoundingClientRect();
    filmSec.classList.toggle('playing',toPlaying);
    const last=frame.getBoundingClientRect();
    const dx=first.left-last.left,dy=first.top-last.top,s=last.width?first.width/last.width:1;
    frame.style.zIndex='70';frame.style.transformOrigin='top left';frame.style.transition='none';
    frame.style.transform='translate('+dx+'px,'+dy+'px) scale('+s+')';
    void frame.offsetWidth;
    requestAnimationFrame(()=>{frame.style.transition='transform .62s cubic-bezier(.16,1,.3,1)';frame.style.transform='translate(0,0) scale(1)';});
    clearTimeout(frame._t);
    frame._t=setTimeout(()=>{frame.style.transition='';frame.style.transform='';frame.style.transformOrigin='';frame.style.zIndex='';},660);
  }
  const play=()=>{if(filmSec.classList.contains('playing'))return;flip(true);if(preview)preview.pause();if(full){full.currentTime=0;full.muted=false;full.play().catch(()=>{});}};
  const stop=()=>{if(!filmSec.classList.contains('playing'))return;if(full)full.pause();flip(false);if(preview)preview.play().catch(()=>{});};
  if(frame)frame.addEventListener('click',()=>{if(!filmSec.classList.contains('playing'))play();});
  if(cta)cta.addEventListener('click',play);
  if(closeBtn)closeBtn.addEventListener('click',e=>{e.stopPropagation();stop();});
  if(backdrop)backdrop.addEventListener('click',stop);
  if(frame)frame.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!filmSec.classList.contains('playing')){e.preventDefault();play();}});
  addEventListener('keydown',e=>{if(e.key==='Escape')stop();});
}

/* hero lab-news broadcast — rotating ticker (data from window.MULAB_NEWS, set in index.html) */
const nw=document.getElementById('newswire');
if(nw){
  const NEWS=(window.MULAB_NEWS&&window.MULAB_NEWS.length)?window.MULAB_NEWS:[];
  const slot=document.getElementById('nwSlot'),meta=document.getElementById('nwMeta'),head=document.getElementById('nwHead');
  if(NEWS.length){
    let i=0,timer;
    if(slot){slot.setAttribute('href','#news');slot.removeAttribute('target');slot.removeAttribute('rel');
      slot.addEventListener('click',function(e){var t=document.getElementById('news');if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}});}
    function paint(){const n=NEWS[i];meta.textContent=(n.date?n.date+' · ':'')+(n.tag||'');head.textContent=n.head||'';}
    function go(k){i=(k%NEWS.length+NEWS.length)%NEWS.length;slot.classList.add('swap');setTimeout(()=>{paint();slot.classList.remove('swap');},260);}
    function next(){go(i+1);}
    function restart(){clearInterval(timer);if(NEWS.length>1)timer=setInterval(next,4800);}
    paint();restart();
    nw.addEventListener('mouseenter',()=>clearInterval(timer));
    nw.addEventListener('mouseleave',restart);
    document.addEventListener('visibilitychange',()=>{document.hidden?clearInterval(timer):restart();});
  }
}

/* lab news section — static scannable grid from the same MULAB_NEWS source */
const newsGrid=document.getElementById('newsGrid');
if(newsGrid&&window.MULAB_NEWS&&window.MULAB_NEWS.length){
  const frag=document.createDocumentFragment();
  window.MULAB_NEWS.forEach(n=>{
    const valid=n.href&&n.href!=='#';
    const row=document.createElement(valid?'a':'div');row.className='news-row';
    if(valid){row.href=n.href;if(/^https?:/.test(n.href)||/\.(jpe?g|png|webp|gif|avif)$/i.test(n.href)){row.target='_blank';row.rel='noopener';}}
    row.innerHTML='<div class="nr-meta"><span class="nr-date"></span><span class="nr-cat"></span></div><div class="nr-main"><h3 class="nr-title"></h3></div>'+(valid?'<span class="nr-go">&#8594;</span>':'');
    row.querySelector('.nr-date').textContent=n.date||'';
    row.querySelector('.nr-cat').textContent=n.tag||'News';
    row.querySelector('.nr-title').textContent=n.head||'';
    if(n.desc){const p=document.createElement('p');p.className='nr-desc';p.textContent=n.desc;row.querySelector('.nr-main').appendChild(p);}
    frag.appendChild(row);
  });
  newsGrid.appendChild(frag);
}

/* PI page — sticky table-of-contents rail: magnetic hover (gallery-style) + active-on-scroll */
(function(){
  const toc=document.getElementById('piToc');
  if(!toc)return;
  const nodes=[].slice.call(toc.querySelectorAll('.pi-toc-node'));
  const secs=nodes.map(n=>document.querySelector(n.getAttribute('href')));
  function setActive(i){nodes.forEach((n,k)=>n.classList.toggle('active',k===i));}
  if('IntersectionObserver'in window){
    const io=new IntersectionObserver(es=>{
      const vis=es.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(vis)setActive(secs.indexOf(vis.target));
    },{rootMargin:'-28% 0px -58% 0px',threshold:[0,.2,.5,1]});
    secs.forEach(s=>s&&io.observe(s));
  }else setActive(0);
})();

/* publications — detail modal */
const pubModal=document.getElementById('pubModal');
if(pubModal){
  const set=(sel,v)=>{const el=pubModal.querySelector(sel);if(el)el.textContent=v;};
  function openPub(c){
    const d=c.dataset;
    const img=pubModal.querySelector('.pm-art img');
    if(d.art){img.src=d.art;img.style.display='';}else{img.style.display='none';}
    set('.pm-jr',d.journal+' · '+d.year);
    set('.pm-title',d.title);
    set('.pm-auth',d.authors);
    set('.pm-sum',d.summary);
    const a=pubModal.querySelector('.pm-link');a.href=d.link;
    pubModal.classList.add('open');document.body.style.overflow='hidden';
  }
  function closePub(){pubModal.classList.remove('open');document.body.style.overflow='';}
  document.querySelectorAll('.pcard').forEach(c=>c.addEventListener('click',()=>openPub(c)));
  pubModal.querySelector('.pm-close').addEventListener('click',closePub);
  pubModal.addEventListener('click',e=>{if(e.target===pubModal)closePub();});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&pubModal.classList.contains('open'))closePub();});
}

/* gallery — Mu Lab archive: newest-first year-grouped justified rows + lightbox */
const galleryData=window.MULAB_GALLERY;
if(galleryData){
  const GAP=10;
  let lbItems=[];
  const yearOf=it=>{const m=(it.date||'').match(/(?:19|20)\d\d/);return m?m[0]:'';};
  function layout(items,W,targetH){
    const rows=[];let cur=[];
    for(const it of items){
      it._ar=(it.width&&it.height)?it.width/it.height:1.5;
      cur.push(it);
      const arSum=cur.reduce((s,x)=>s+x._ar,0);
      if(arSum*targetH+GAP*(cur.length-1)>=W){rows.push(cur);cur=[];}
    }
    if(cur.length)rows.push(cur);
    return rows.map((row,i)=>{
      const arSum=row.reduce((s,x)=>s+x._ar,0);
      const avail=W-GAP*(row.length-1);
      let h=avail/arSum;
      if(i===rows.length-1&&h>targetH*1.4)h=targetH;
      return {row,h};
    });
  }
  function makeFig(it){
    const f=document.createElement('figure');f.className='gcard';
    f.style.width=(it._ar*it._h)+'px';f.style.height=it._h+'px';f.style.flex='0 0 auto';
    const img=document.createElement('img');img.src=it.src;img.alt=it.title||'';img.loading='lazy';img.decoding='async';
    const cap=document.createElement('figcaption');
    const d=document.createElement('span');d.className='gdate';d.textContent=it.date||'';
    const t=document.createElement('span');t.className='gtitle';t.textContent=it.title||'';
    cap.append(d,t);f.append(img,cap);
    const idx=lbItems.push(it)-1;
    f.addEventListener('click',()=>openLB(idx));
    return f;
  }
  function renderBlock(targetId,items,grouped){
    const target=document.getElementById(targetId);if(!target)return;
    const block=target.closest('.gallery-block');
    if(!items||!items.length){if(block)block.style.display='none';return;}
    if(block)block.style.display='';
    target.innerHTML='';
    const W=target.clientWidth||1100;
    const targetH=W<640?165:(W<1000?205:258);
    let groups;
    if(grouped){
      const map=new Map();
      items.forEach(it=>{const y=yearOf(it)||'Earlier';if(!map.has(y))map.set(y,[]);map.get(y).push(it);});
      groups=[...map.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
    }else groups=[[null,items]];
    groups.forEach(([year,its])=>{
      if(year){const yd=document.createElement('div');yd.className='gyear';yd.innerHTML='<span class="gyear-num serif">'+year+'</span>';target.appendChild(yd);}
      const wrap=document.createElement('div');wrap.className='gjust';target.appendChild(wrap);
      layout(its,W,targetH).forEach(r=>{
        const rowEl=document.createElement('div');rowEl.className='grow';
        r.row.forEach(it=>{it._h=r.h;rowEl.appendChild(makeFig(it));});
        wrap.appendChild(rowEl);
      });
    });
  }
  function renderAll(){lbItems=[];renderBlock('galleryTimeline',galleryData.timeline,true);renderBlock('galleryPending',galleryData.datePending||galleryData.pending,false);}
  renderAll();
  let gto;addEventListener('resize',()=>{clearTimeout(gto);gto=setTimeout(renderAll,200);},{passive:true});

  /* lightbox */
  const lb=document.createElement('div');lb.className='lightbox';
  lb.innerHTML='<button class="lb-close" aria-label="Close">&#10005;</button><button class="lb-nav lb-prev" aria-label="Previous">&#8249;</button><button class="lb-nav lb-next" aria-label="Next">&#8250;</button><figure class="lb-fig"><img alt=""><figcaption><span class="lb-date"></span><span class="lb-cap"></span></figcaption></figure>';
  document.body.appendChild(lb);
  let lbi=0;
  function showLB(){const it=lbItems[lbi];if(!it)return;lb.querySelector('img').src=it.src;lb.querySelector('.lb-date').textContent=it.date||'';lb.querySelector('.lb-cap').textContent=it.caption||it.title||'';}
  function openLB(i){lbi=i;showLB();lb.classList.add('open');document.body.style.overflow='hidden';}
  function closeLB(){lb.classList.remove('open');document.body.style.overflow='';}
  function nav(d){if(!lbItems.length)return;lbi=(lbi+d+lbItems.length)%lbItems.length;showLB();}
  lb.querySelector('.lb-close').addEventListener('click',closeLB);
  lb.querySelector('.lb-prev').addEventListener('click',e=>{e.stopPropagation();nav(-1);});
  lb.querySelector('.lb-next').addEventListener('click',e=>{e.stopPropagation();nav(1);});
  lb.addEventListener('click',e=>{if(e.target===lb)closeLB();});
  addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')closeLB();else if(e.key==='ArrowLeft')nav(-1);else if(e.key==='ArrowRight')nav(1);});
}

/* UMAP signature scatter */
const cv=document.getElementById('umap');
if(cv){
  const clusters=[
    {name:'Luminal',cx:.34,cy:.40,r:.13,n:2200,col:'#6f82f2'},
    {name:'Basal',cx:.62,cy:.30,r:.11,n:1500,col:'#dd9466'},
    {name:'Stem-like',cx:.70,cy:.62,r:.10,n:1400,col:'#46b3a4'},
    {name:'Neuroendocrine',cx:.42,cy:.72,r:.085,n:900,col:'#dcaf48'},
  ];
  const legend=document.getElementById('legend');
  if(legend)clusters.forEach(c=>{const d=document.createElement('div');d.innerHTML=`<i style="background:${c.col}"></i>${c.name}`;legend.appendChild(d);});
  const cx=cv.getContext('2d');let pts=[];
  const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
  function build(){pts=[];clusters.forEach(c=>{for(let i=0;i<c.n;i++)pts.push({x:c.cx+gauss()*c.r,y:c.cy+gauss()*c.r,col:c.col,r:2+Math.random()*1.6});});}
  function draw(){const w=cv.width,h=cv.height,dpr=w/cv.getBoundingClientRect().width;cx.clearRect(0,0,w,h);cx.globalAlpha=.7;for(const p of pts){cx.fillStyle=p.col;cx.beginPath();cx.arc(p.x*w,p.y*h,p.r*dpr,0,7);cx.fill();}cx.globalAlpha=1;}
  function size(){const r=cv.getBoundingClientRect();cv.width=Math.round(r.width*2);cv.height=Math.round(r.height*2);build();draw();}
  let to;addEventListener('resize',()=>{clearTimeout(to);to=setTimeout(size,150);});
  size();
}

/* home section rhythm — free scrolling with a silky eased settle onto the nearest section.
   No wheel hijack: fling straight to the bottom; when you STOP, it glides (easeOutCubic)
   into the closest section. Falls back to native CSS proximity snap on mobile / reduced-motion. */
(function(){
  if(!document.body.classList.contains('home'))return;
  const root=document.documentElement;
  const secList=()=>[...document.querySelectorAll('body.home>section')];
  if(secList().length<2)return;
  const enabled=()=>innerWidth>880&&innerHeight>680&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
  function sync(){root.classList.toggle('js-snap',enabled());}
  sync();addEventListener('resize',sync,{passive:true});
  let animating=false,raf=0,endTimer=0;
  function nearest(){const y=scrollY;let best=null,d=1e9;secList().forEach(s=>{const v=Math.abs(s.offsetTop-y);if(v<d){d=v;best=s;}});return best;}
  function glide(to){
    const from=scrollY,dist=to-from;
    if(Math.abs(dist)<2)return;
    animating=true;
    const dur=Math.min(760,320+Math.abs(dist)*.55),t0=performance.now();
    const ease=t=>1-Math.pow(1-t,3); /* easeOutCubic — smooth deceleration */
    cancelAnimationFrame(raf);
    (function step(now){
      if(!animating)return;
      const p=Math.min(1,(now-t0)/dur);
      scrollTo(0,Math.round(from+dist*ease(p)));
      if(p<1)raf=requestAnimationFrame(step);else animating=false;
    })(t0);
  }
  function settle(){if(!enabled()||animating)return;const s=nearest();if(s)glide(s.offsetTop);}
  addEventListener('scroll',()=>{
    if(animating)return;
    clearTimeout(endTimer);endTimer=setTimeout(settle,120);
  },{passive:true});
  /* hand control straight back if the user acts mid-glide */
  const interrupt=()=>{if(animating){animating=false;cancelAnimationFrame(raf);}clearTimeout(endTimer);endTimer=setTimeout(settle,140);};
  addEventListener('wheel',interrupt,{passive:true});
  addEventListener('touchstart',interrupt,{passive:true});
  addEventListener('keydown',e=>{
    if(!enabled()||e.altKey||e.ctrlKey||e.metaKey)return;
    const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
    const down=(e.key==='PageDown'||e.key==='ArrowDown'||(e.key===' '&&!e.shiftKey));
    const up=(e.key==='PageUp'||e.key==='ArrowUp'||(e.key===' '&&e.shiftKey));
    if(!down&&!up)return;
    e.preventDefault();
    const secs=secList();let i=0,d=1e9;secs.forEach((s,k)=>{const v=Math.abs(s.offsetTop-scrollY);if(v<d){d=v;i=k;}});
    glide(secs[Math.max(0,Math.min(secs.length-1,i+(down?1:-1)))].offsetTop);
  });
})();

/* people page — profile card modal (opens in place of navigating to an external profile) */
(function(){
  const modal=document.getElementById('peopleModal');
  const cards=[...document.querySelectorAll('.pcard[data-name],.pi-feature[data-name]')];
  if(!modal||!cards.length)return;
  const img=document.getElementById('pplImg');
  const ini=document.getElementById('pplIni');
  const nameEl=document.getElementById('pplName');
  const roleEl=document.getElementById('pplRole');
  const linksEl=document.getElementById('pplLinks');
  const bioEl=document.getElementById('pplBio');
  const trainingEl=document.getElementById('pplTraining');
  const closeBtn=document.getElementById('peopleModalClose');
  function initials(n){return n.replace(/,.*$/,'').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();}
  function detailFor(name){return (window.MULAB_PEOPLE_DETAILS&&window.MULAB_PEOPLE_DETAILS[name])||{};}
  function renderBio(value){
    if(!bioEl)return;
    bioEl.innerHTML='';
    const paras=Array.isArray(value)?value:(value?String(value).split(/\n\s*\n/):[]);
    bioEl.classList.toggle('empty',!paras.length);
    if(!paras.length){bioEl.textContent='Bio coming soon.';return;}
    paras.forEach(txt=>{const p=document.createElement('p');p.textContent=txt;bioEl.appendChild(p);});
  }
  function renderTraining(items){
    if(!trainingEl)return;
    trainingEl.innerHTML='';
    if(!items||!items.length){trainingEl.style.display='none';return;}
    trainingEl.style.display='';
    const h=document.createElement('div');h.className='mlabel';h.textContent='Education & Training';trainingEl.appendChild(h);
    items.forEach(it=>{
      const row=document.createElement('div');
      const title=document.createElement('b');title.textContent=it.title||it.degree||'';
      const meta=document.createElement('span');meta.textContent=it.meta||it.institution||'';
      row.append(title,meta);trainingEl.appendChild(row);
    });
  }
  /* verbatim path: clone bio <p> and training rows from a hidden in-page source element */
  function renderFromSource(src){
    bioEl.innerHTML='';bioEl.classList.remove('empty');
    src.querySelectorAll(':scope > p').forEach(p=>bioEl.appendChild(p.cloneNode(true)));
    if(!bioEl.children.length){bioEl.classList.add('empty');bioEl.textContent='Bio coming soon.';}
    const rows=src.querySelectorAll('.ppl-training-src > div, .pi-training > div:not(.mlabel)');
    trainingEl.innerHTML='';
    if(!rows.length){trainingEl.style.display='none';return;}
    trainingEl.style.display='';
    const h=document.createElement('div');h.className='mlabel';h.textContent='Education & Training';trainingEl.appendChild(h);
    rows.forEach(r=>trainingEl.appendChild(r.cloneNode(true)));
  }
  function open(card){
    const photo=card.dataset.photo,nm=card.dataset.name,em=card.dataset.email,lk=card.dataset.link;
    const info=detailFor(nm),rl=card.dataset.role||info.role||'',bio=card.dataset.bio||info.bio;
    const src=card.dataset.source?document.getElementById(card.dataset.source):null;
    if(photo){img.src=photo;img.alt=nm;img.style.display='';ini.style.display='none';}
    else{img.style.display='none';ini.style.display='';ini.textContent=initials(nm);}
    nameEl.textContent=nm;
    roleEl.textContent=rl;
    if(src){renderFromSource(src);}
    else{renderBio(bio);renderTraining(info.training);}
    linksEl.innerHTML='';
    if(em){const a=document.createElement('a');a.href='mailto:'+em;a.textContent='mail ↗';linksEl.appendChild(a);}
    if(lk){const a=document.createElement('a');a.href=lk;a.target='_blank';a.rel='noopener';a.textContent='Yale profile ↗';linksEl.appendChild(a);}
    if(em||lk){
      [['scholar','Google Scholar'],['orcid','ORCID'],['linkedin','LinkedIn']].forEach(function(s){
        const url=card.dataset[s[0]]||'#';
        const a=document.createElement('a');a.href=url;a.textContent=s[1]+' ↗';
        if(/^https?:/.test(url)){a.target='_blank';a.rel='noopener';}
        else{a.classList.add('soon');a.title='Link coming soon';a.addEventListener('click',function(e){e.preventDefault();});}
        linksEl.appendChild(a);
      });
    }
    const cardEl=modal.querySelector('.ppl-card');if(cardEl)cardEl.scrollTop=0;
    modal.classList.add('open');document.body.style.overflow='hidden';
  }
  function close(){modal.classList.remove('open');document.body.style.overflow='';}
  cards.forEach(c=>{
    c.addEventListener('click',()=>open(c));
    c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(c);}});
  });
  closeBtn.addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close();});
})();

/* mobile navigation — hamburger + full-screen overlay, built from the existing .navlinks.
   Elements are hidden on desktop via CSS; only shown ≤900px. */
(function(){
  const nav=document.querySelector('#hdr nav');
  const links=nav&&nav.querySelector('.navlinks');
  if(!nav||!links)return;
  const here=(location.pathname.split('/').pop()||'index.html')||'index.html';
  const seen={},items=[];
  [].forEach.call(links.querySelectorAll('a'),function(a){
    const href=a.getAttribute('href');
    if(!href||href==='#'||seen[href])return;seen[href]=1;
    items.push({href:href,label:a.textContent.replace(/^\s*\d+\s*/,'').trim(),active:(href.split('/').pop()===here)});
  });
  if(!items.length)return;

  const btn=document.createElement('button');
  btn.className='navtoggle';btn.type='button';
  btn.setAttribute('aria-label','Open menu');btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span></span><span></span><span></span>';
  nav.appendChild(btn);

  const menu=document.createElement('div');menu.className='mobmenu';menu.setAttribute('aria-hidden','true');
  const inner=document.createElement('nav');inner.className='mobmenu-inner';
  items.forEach(function(it,i){
    const a=document.createElement('a');a.href=it.href;a.className='mm-link'+(it.active?' active':'');
    a.style.setProperty('--i',i);
    a.innerHTML='<span class="mm-n">'+String(i+1).padStart(2,'0')+'</span><span class="mm-t"></span>';
    a.querySelector('.mm-t').textContent=it.label;
    inner.appendChild(a);
  });
  menu.appendChild(inner);
  document.body.appendChild(menu);

  function setOpen(o){
    menu.classList.toggle('open',o);
    btn.classList.toggle('open',o);
    btn.setAttribute('aria-expanded',o?'true':'false');
    btn.setAttribute('aria-label',o?'Close menu':'Open menu');
    menu.setAttribute('aria-hidden',o?'false':'true');
    document.body.style.overflow=o?'hidden':'';
  }
  btn.addEventListener('click',function(){setOpen(!menu.classList.contains('open'));});
  menu.addEventListener('click',function(e){if(e.target===menu||e.target.classList.contains('mm-link'))setOpen(false);});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&menu.classList.contains('open'))setOpen(false);});
})();
