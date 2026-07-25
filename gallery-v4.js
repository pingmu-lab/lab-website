(function(){
  const hdr=document.getElementById('hdr');
  const prog=document.getElementById('prog');
  const data=(window.MULAB_GALLERY&&window.MULAB_GALLERY.timeline)||[];
  const albums=(window.MULAB_GALLERY&&window.MULAB_GALLERY.albums)||[];
  const rail=document.getElementById('v4Rail');
  const gallery=document.getElementById('v4Gallery');
  const GAP=12;
  const nodes=new Map();
  let lbItems=[];              // regular timeline photos (navigation set)
  let curList=[],lbi=0,lbCtx=null;
  let activeYear='';
  let hoverLocked=false, scrollLock=false;

  const yearOf=it=>{const m=String(it.year||it.date||it.sortDate||'').match(/(?:19|20)\d\d/);return m?m[0]:'Earlier';};
  const capOf=it=>it.caption||it.title||'';

  /* album cover pseudo-items, merged into the timeline grouping */
  const albumItems=albums.map(a=>({src:a.cover,width:a.coverW,height:a.coverH,year:a.year,date:a.date,sortDate:a.sortDate,title:a.title,_album:a}));

  function grouped(){
    const map=new Map();
    data.forEach(it=>{const y=yearOf(it);if(!map.has(y))map.set(y,[]);map.get(y).push(it);});
    albumItems.forEach(it=>{const y=yearOf(it);if(!map.has(y))map.set(y,[]);const arr=map.get(y);
      const p=(it._album&&typeof it._album.pos==='number')?Math.max(0,Math.min(arr.length,it._album.pos)):0;
      arr.splice(p,0,it);}); // album placed at its configured position within the year
    return [...map.entries()].sort((a,b)=>b[0].localeCompare(a[0]));
  }

  function layout(items,W,targetH){
    const rows=[];let cur=[];
    for(const it of items){
      it._ar=(it.width&&it.height)?it.width/it.height:1.5;
      cur.push(it);
      const s=cur.reduce((a,x)=>a+x._ar,0);
      if(s*targetH+GAP*(cur.length-1)>=W){rows.push(cur);cur=[];}
    }
    if(cur.length)rows.push(cur);
    return rows.map((row,i)=>{
      const s=row.reduce((a,x)=>a+x._ar,0);
      const avail=W-GAP*(row.length-1);
      let h=avail/s;
      if(i===rows.length-1&&h>targetH*1.4)h=targetH;
      return {row,h};
    });
  }

  function makeFig(it){
    const f=document.createElement('figure');f.className='gcard'+(it._album?' gcard--album':'');f.tabIndex=0;
    f.style.width=(it._ar*it._h)+'px';f.style.height=it._h+'px';f.style.flex='0 0 auto';
    const img=document.createElement('img');img.src=it.src;img.alt=it.title||'';img.loading='lazy';img.decoding='async';
    f.appendChild(img);
    if(it._album){
      const a=it._album;
      const badge=document.createElement('span');badge.className='galb-badge mono';badge.textContent='▤ '+a.photos.length;
      const mark=document.createElement('span');mark.className='galb-mark mono';mark.innerHTML='<i class="galb-ic"></i>'+a.photos.length;
      const cap=document.createElement('figcaption');
      const k=document.createElement('span');k.className='galb-kick mono';k.textContent='Album · '+a.by;
      const t=document.createElement('span');t.className='gtitle';t.textContent=a.title;
      cap.append(k,t);
      f.append(badge,mark,cap);
      const go=()=>openAlbum(a);
      f.addEventListener('click',go);
      f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    }else{
      const cap=document.createElement('figcaption');
      const d=document.createElement('span');d.className='gdate';d.textContent=it.date||'';
      const t=document.createElement('span');t.className='gtitle';t.textContent=it.title||'';
      cap.append(d,t);f.appendChild(cap);
      const idx=lbItems.push(it)-1;
      f.addEventListener('click',()=>openList(lbItems,idx,null));
      f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openList(lbItems,idx,null);}});
    }
    return f;
  }

  function buildRail(groups){
    if(!rail)return;
    rail.innerHTML='<span class="y4-line"></span><span class="y4-glow" aria-hidden="true"></span>';
    nodes.clear();
    groups.forEach(([year])=>{
      const b=document.createElement('button');
      b.type='button';b.className='y4-node';b.dataset.year=year;b.style.setProperty('--pull','0');b.style.setProperty('--nudge','0px');
      b.setAttribute('aria-label','Jump to '+year);
      b.innerHTML='<span class="y4-dot"></span><span class="y4-year">'+year+'</span>';
      b.addEventListener('click',()=>selectYear(year));
      rail.appendChild(b);nodes.set(year,b);
    });
    rail.addEventListener('pointerenter',onPointer);
    rail.addEventListener('pointermove',onPointer);
    rail.addEventListener('pointerleave',resetPulls);
  }

  function renderGallery(groups){
    if(!gallery)return;
    lbItems=[];gallery.innerHTML='';
    const W=gallery.clientWidth||1000;
    const targetH=W<640?160:(W<1000?205:262);
    groups.forEach(([year,items])=>{
      const sec=document.createElement('section');sec.className='v4-year';sec.id='y-'+year;sec.dataset.year=year;
      const head=document.createElement('div');head.className='gyear';head.innerHTML='<span class="gyear-num serif">'+year+'</span><span class="gyear-count mono">'+items.length+(items.length>1?' moments':' moment')+'</span>';
      sec.appendChild(head);
      const wrap=document.createElement('div');wrap.className='gjust';sec.appendChild(wrap);
      layout(items,W,targetH).forEach(r=>{
        const row=document.createElement('div');row.className='grow';
        r.row.forEach(it=>{it._h=r.h;row.appendChild(makeFig(it));});
        wrap.appendChild(row);
      });
      gallery.appendChild(sec);
    });
  }

  function setGlow(clientY){
    const glow=rail&&rail.querySelector('.y4-glow');if(!glow||!rail)return;
    const r=rail.getBoundingClientRect();
    const y=typeof clientY==='number'?Math.max(0,Math.min(r.height,clientY-r.top)):nodeY(activeYear);
    glow.style.opacity=typeof clientY==='number'?'1':'0';
    glow.style.transform='translateY('+Math.round(y)+'px)';
  }
  function nodeY(year){const n=nodes.get(year);if(!rail||!n)return 0;const r=rail.getBoundingClientRect(),nr=n.getBoundingClientRect();return nr.top+nr.height/2-r.top;}

  function setActive(year,force){
    if(!year||(!force&&activeYear===year))return;
    activeYear=year;
    nodes.forEach((n,y)=>n.classList.toggle('active',y===year));
    resetPulls();
  }
  function resetPulls(){
    hoverLocked=false;
    nodes.forEach((n,y)=>{n.classList.remove('hovered');n.style.setProperty('--pull',y===activeYear?'0.5':'0');n.style.setProperty('--nudge','0px');});
    setGlow();
  }
  function onPointer(e){
    if(!rail)return;hoverLocked=true;setGlow(e.clientY);
    let near=activeYear,nd=Infinity;
    nodes.forEach((n,y)=>{
      const r=n.getBoundingClientRect(),cy=r.top+r.height/2,dist=Math.abs(e.clientY-cy);
      const raw=Math.max(0,1-dist/68),pull=Math.pow(raw,1.35);
      const nudge=Math.max(-5,Math.min(5,(e.clientY-cy)*raw*.08));
      n.style.setProperty('--pull',String(Math.max(pull,y===activeYear?0.5:0)));
      n.style.setProperty('--nudge',nudge.toFixed(2)+'px');
      n.classList.toggle('hovered',pull>.08);
      if(dist<nd){nd=dist;near=y;}
    });
    if(near){activeYear=near;nodes.forEach((n,y)=>n.classList.toggle('active',y===near));}
  }

  function selectYear(year){setActive(year);scrollLock=true;document.getElementById('y-'+year)?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>{scrollLock=false;},850);}

  /* lightbox (shared by timeline photos + album mode) */
  const lb=document.createElement('div');lb.className='lightbox';
  lb.innerHTML='<button class="lb-close" aria-label="Close">&#10005;</button><button class="lb-nav lb-prev" aria-label="Previous">&#8249;</button><button class="lb-nav lb-next" aria-label="Next">&#8250;</button>'
    +'<figure class="lb-fig"><img alt=""><figcaption>'
    +'<span class="lb-alb"></span><span class="lb-date"></span><span class="lb-cap"></span>'
    +'<span class="lb-meta"><span class="lb-by"></span><span class="lb-count"></span></span>'
    +'</figcaption></figure><div class="lb-strip" aria-label="Album photos"></div>';
  document.body.appendChild(lb);
  const strip=lb.querySelector('.lb-strip');

  function buildStrip(list){
    strip.innerHTML='';
    list.forEach((it,idx)=>{
      const b=document.createElement('button');b.type='button';b.className='lb-thumb';
      const im=document.createElement('img');im.src=it.thumb||it.src;im.alt='';im.loading='lazy';
      b.appendChild(im);
      b.addEventListener('click',e=>{e.stopPropagation();lbi=idx;showLB();});
      strip.appendChild(b);
    });
  }
  function updateStripActive(){
    const ts=strip.children;
    for(let k=0;k<ts.length;k++)ts[k].classList.toggle('active',k===lbi);
    const cur=ts[lbi];if(cur)cur.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
  }
  function showLB(){
    const it=curList[lbi];if(!it)return;
    const im=lb.querySelector('img');im.src=it.src;im.alt=it.title||'';
    const album=!!lbCtx;
    lb.classList.toggle('album',album);
    lb.querySelector('.lb-alb').textContent=album?lbCtx.title:'';
    lb.querySelector('.lb-date').textContent=album?'':(it.date||'');
    lb.querySelector('.lb-cap').textContent=album?'':capOf(it);
    lb.querySelector('.lb-by').textContent=album?(lbCtx.by||''):'';
    lb.querySelector('.lb-count').textContent=album?((lbi+1)+' / '+curList.length):'';
    if(album)updateStripActive();
  }
  function openList(list,i,ctx){
    curList=list;lbi=i;lbCtx=ctx;
    if(ctx)buildStrip(list);else strip.innerHTML='';
    showLB();lb.classList.add('open');document.body.style.overflow='hidden';
  }
  function openAlbum(a){
    const list=a.photos.map(p=>({src:p.src,thumb:p.thumb,title:a.title,caption:''}));
    openList(list,0,a);
  }
  function closeLB(){lb.classList.remove('open');document.body.style.overflow='';}
  function navLB(d){if(!curList.length)return;lbi=(lbi+d+curList.length)%curList.length;showLB();}
  lb.querySelector('.lb-close').addEventListener('click',closeLB);
  lb.querySelector('.lb-prev').addEventListener('click',e=>{e.stopPropagation();navLB(-1);});
  lb.querySelector('.lb-next').addEventListener('click',e=>{e.stopPropagation();navLB(1);});
  lb.addEventListener('click',e=>{if(e.target===lb||e.target===lb.querySelector('.lb-fig'))closeLB();});
  window.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;if(e.key==='Escape')closeLB();else if(e.key==='ArrowLeft')navLB(-1);else if(e.key==='ArrowRight')navLB(1);});

  function observe(){
    const secs=[...document.querySelectorAll('.v4-year')];if(!secs.length)return;
    const io=new IntersectionObserver(es=>{
      if(scrollLock||hoverLocked)return;
      const v=es.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(v)setActive(v.target.dataset.year);
    },{rootMargin:'-22% 0px -48% 0px',threshold:[.16,.34,.52,.7]});
    secs.forEach(s=>io.observe(s));
  }
  function chrome(){if(hdr)hdr.classList.toggle('scrolled',scrollY>30);if(prog){const m=document.documentElement.scrollHeight-innerHeight;prog.style.width=(m>0?scrollY/m*100:0)+'%';}}

  let rt;
  function renderAll(){const g=grouped();buildRail(g);renderGallery(g);setActive(g[0]&&g[0][0]||'',true);observe();chrome();}
  addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(renderAll,180);},{passive:true});
  addEventListener('scroll',chrome,{passive:true});
  renderAll();
})();
