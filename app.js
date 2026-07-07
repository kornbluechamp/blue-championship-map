
(() => {
  const viewport=document.getElementById('mapViewport');
  const stage=document.getElementById('mapStage');
  const image=document.getElementById('mapImage');
  const markerLayer=document.getElementById('markerLayer');
  const maskLayer=document.getElementById('maskLayer');
  const toolbar=document.getElementById('toolbar');
  const resultCard=document.getElementById('resultCard');
  const dialog=document.getElementById('markerDialog');
  const toolsPanel=document.getElementById('toolsPanel');
  const you=document.getElementById('youAreHere');
  const routeLayer=document.getElementById('routeLayer');
  let viewKey='course',filterKey='essentials',selected=null;
  let scale=1,minScale=.3,maxScale=5,tx=0,ty=0,dragging=false,sx=0,sy=0,stx=0,sty=0;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const view=()=>APP_DATA.views[viewKey];
  const cat=k=>APP_DATA.categories[k]||{label:k,icon:'•'};
  function apply(){stage.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`}
  function setStageSize(){
    const v=view();
    let targetW=Math.min(1500,Math.max(viewport.clientWidth*1.35,900));
    if(viewKey==='clubhouse') targetW=Math.min(1200,Math.max(viewport.clientWidth*1.1,720));
    const targetH=targetW*v.height/v.width;
    stage.style.width=targetW+'px';stage.style.height=targetH+'px';
    image.style.width=targetW+'px';image.style.height=targetH+'px';
    markerLayer.style.width=targetW+'px';markerLayer.style.height=targetH+'px';
    maskLayer.style.width=targetW+'px';maskLayer.style.height=targetH+'px';
    routeLayer.style.width=targetW+'px';routeLayer.style.height=targetH+'px';
  }
  function fit(){
    setStageSize();const w=stage.clientWidth,h=stage.clientHeight;
    scale=Math.min(viewport.clientWidth/w,viewport.clientHeight/h);minScale=Math.max(.2,scale*.72);maxScale=Math.max(3.3,scale*7);
    tx=(viewport.clientWidth-w*scale)/2;ty=(viewport.clientHeight-h*scale)/2;apply();
  }
  function renderTabs(){document.querySelectorAll('.view-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===viewKey))}
  function renderToolbar(){
    toolbar.innerHTML='';view().filters.forEach(k=>{const b=document.createElement('button');b.className='filter'+(k===filterKey?' active':'');b.dataset.category=k;b.textContent=`${cat(k).icon} ${cat(k).label}`;b.onclick=()=>setFilter(k);toolbar.appendChild(b)});
  }
  function renderMasks(){
    maskLayer.innerHTML='';view().masks.forEach(m=>{const el=document.createElement('div');el.className='map-mask';el.style.left=m.x+'%';el.style.top=m.y+'%';el.style.width=m.w+'%';el.style.height=m.h+'%';maskLayer.appendChild(el)});
  }
  function showMarker(m){if(filterKey==='all')return true;if(filterKey==='essentials')return !!m.essential;return m.category===filterKey}
  function renderMarkers(){
    markerLayer.innerHTML='';view().markers.forEach(m=>{const b=document.createElement('button');b.className=`marker ${m.category} ${m.verified?'':'approx'} ${showMarker(m)?'':'hidden'}`;b.style.left=m.x+'%';b.style.top=m.y+'%';b.textContent=m.icon||cat(m.category).icon;b.setAttribute('aria-label',m.name);b.onclick=e=>{e.stopPropagation();showDetails(m)};markerLayer.appendChild(b)});
    const shown=view().markers.filter(showMarker).length;resultCard.innerHTML=`<h2>${esc(view().title)} - ${esc(cat(filterKey).label)}</h2><p>${shown} location${shown===1?'':'s'} shown. Tap a marker for details. Yellow question marks mean the location still needs onsite verification.</p>`;
  }
  function renderLegend(){
    const keys=['restroom','firstaid','concession','gate','clubhouse','fanarea','proshop','volunteer','hospitality'];
    document.getElementById('menuLegend').innerHTML=keys.map(k=>`<div class="legend-row"><span class="legend-dot ${k}" style="background:${color(k)}">${esc(cat(k).icon)}</span><span>${esc(cat(k).label)}</span></div>`).join('')
  }
  function color(k){return {restroom:'#1779ba',firstaid:'#c83232',concession:'#14785d',gate:'#7b4da8',clubhouse:'#864d26',fanarea:'#3757a6',proshop:'#166f94',volunteer:'#e17a00',hospitality:'#7550a5'}[k]||'#456'}
  function loadView(k,fromUrl=false){
    if(!APP_DATA.views[k])k='course';viewKey=k;filterKey=view().defaultFilter;you.classList.add('hidden');image.src=view().image;image.alt=view().title+' map';renderTabs();renderToolbar();renderMasks();renderMarkers();
    image.onload=fit;if(image.complete)fit();
    if(!fromUrl){const u=new URL(location.href);u.searchParams.set('view',viewKey);u.searchParams.delete('category');history.replaceState(null,'',u)}
  }
  function setFilter(k){filterKey=k;renderToolbar();renderMarkers();const u=new URL(location.href);u.searchParams.set('view',viewKey);u.searchParams.set('category',k);history.replaceState(null,'',u)}
  function showDetails(m){
    selected=m;document.getElementById('dialogTitle').textContent=m.name;document.getElementById('dialogType').textContent=cat(m.category).label;document.getElementById('dialogNotes').textContent=m.notes||'No notes yet.';document.getElementById('dialogStatus').textContent=m.verified?'Onsite location verified.':'Approximate location - verify onsite before relying on it.';dialog.showModal?dialog.showModal():dialog.setAttribute('open','')
  }
  function zoomAt(f,cx=viewport.clientWidth/2,cy=viewport.clientHeight/2){const ns=Math.max(minScale,Math.min(maxScale,scale*f)),mx=(cx-tx)/scale,my=(cy-ty)/scale;tx=cx-mx*ns;ty=cy-my*ns;scale=ns;apply()}
  function center(m){const px=stage.clientWidth*m.x/100,py=stage.clientHeight*m.y/100;scale=Math.max(scale,Math.min(maxScale,1.45));tx=viewport.clientWidth/2-px*scale;ty=viewport.clientHeight/2-py*scale;apply()}
  viewport.onpointerdown=e=>{if(e.target.closest('.marker')||e.target.closest('.zoom-controls'))return;dragging=true;viewport.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;stx=tx;sty=ty};
  viewport.onpointermove=e=>{if(!dragging)return;tx=stx+(e.clientX-sx);ty=sty+(e.clientY-sy);apply()};viewport.onpointerup=viewport.onpointercancel=()=>dragging=false;
  viewport.addEventListener('wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();zoomAt(e.deltaY<0?1.14:.88,e.clientX-r.left,e.clientY-r.top)},{passive:false});
  document.querySelectorAll('.view-tab').forEach(b=>b.onclick=()=>loadView(b.dataset.view));
  document.getElementById('zoomIn').onclick=()=>zoomAt(1.25);document.getElementById('zoomOut').onclick=()=>zoomAt(.8);document.getElementById('resetView').onclick=fit;
  document.getElementById('menuBtn').onclick=()=>toolsPanel.classList.remove('hidden');document.getElementById('closeTools').onclick=()=>toolsPanel.classList.add('hidden');
  document.getElementById('closeDialog').onclick=()=>dialog.close?dialog.close():dialog.removeAttribute('open');document.getElementById('centerMarkerBtn').onclick=()=>{if(selected)center(selected);if(dialog.close)dialog.close()};
  document.getElementById('shareBtn').onclick=async()=>{try{navigator.share?await navigator.share({title:document.title,url:location.href}):await navigator.clipboard.writeText(location.href)}catch(_){}};document.getElementById('copyBtn').onclick=async()=>{await navigator.clipboard.writeText(location.href);alert('Map link copied.')};
  document.getElementById('locationBtn').onclick=()=>{
    if(viewKey!=='course')return alert('Switch to Full Course before using current location.');if(!navigator.geolocation)return alert('This phone does not provide browser location.');if(!APP_DATA.calibration.anchors||APP_DATA.calibration.anchors.length<3)return alert('The app is ready for GPS, but the map still needs at least three onsite calibration anchors. Use the Field Scout page to collect them.');
    navigator.geolocation.getCurrentPosition(pos=>{const p=gpsToMap(pos.coords.latitude,pos.coords.longitude);if(!p)return alert('Unable to convert this location.');you.style.left=p.x+'%';you.style.top=p.y+'%';you.classList.remove('hidden');center(p)},err=>alert('Location unavailable: '+err.message),{enableHighAccuracy:true,timeout:15000})
  };
  function gpsToMap(lat,lng){const a=APP_DATA.calibration.anchors;if(!a||a.length<3)return null;const A=[[a[0].lng,a[0].lat,1],[a[1].lng,a[1].lat,1],[a[2].lng,a[2].lat,1]],bx=[a[0].x,a[1].x,a[2].x],by=[a[0].y,a[1].y,a[2].y],cx=solve(A,bx),cy=solve(A,by);return cx&&cy?{x:cx[0]*lng+cx[1]*lat+cx[2],y:cy[0]*lng+cy[1]*lat+cy[2]}:null}
  function solve(A,b){const m=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<3;c++){let p=c;for(let r=c+1;r<3;r++)if(Math.abs(m[r][c])>Math.abs(m[p][c]))p=r;[m[c],m[p]]=[m[p],m[c]];if(Math.abs(m[c][c])<1e-12)return null;const d=m[c][c];for(let j=c;j<4;j++)m[c][j]/=d;for(let r=0;r<3;r++)if(r!==c){const f=m[r][c];for(let j=c;j<4;j++)m[r][j]-=f*m[c][j]}}return[m[0][3],m[1][3],m[2][3]]}
  window.onresize=fit;renderLegend();const u=new URL(location.href),initialView=u.searchParams.get('view')||'course';loadView(initialView,true);const requested=u.searchParams.get('category');if(requested&&view().filters.includes(requested))setFilter(requested);if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
})();
