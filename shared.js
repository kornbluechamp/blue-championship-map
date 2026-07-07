// Development build: remove any service worker/cache left by earlier versions.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(()=>{});
}
if ('caches' in window) {
  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(()=>{});
}

const STORAGE_KEY = 'tbc-course-scout-v3';
const ACTIVE_KEY = 'tbc-course-active-route-v3';

function emptyDataset(){
  return {version:3,event:'The Blue Championship',course:'TPC Colorado',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),points:[],routes:[]};
}
function loadDataset(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return emptyDataset();const d=JSON.parse(raw);d.points=d.points||[];d.routes=d.routes||[];return d}catch(_){return emptyDataset()}
}
function saveDataset(data){data.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data.updatedAt}
function loadActiveRoute(){try{return JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null')}catch(_){return null}}
function saveActiveRoute(route){if(route)localStorage.setItem(ACTIVE_KEY,JSON.stringify(route));else localStorage.removeItem(ACTIVE_KEY)}
function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function haversine(a,b){const R=6371000,toRad=x=>x*Math.PI/180;const dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);const q=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
function routeDistance(points){let m=0;for(let i=1;i<points.length;i++)m+=haversine(points[i-1],points[i]);return m}
function feet(m){return Math.round(m*3.28084)}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function downloadJson(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function pointIcon(type,label=''){
  const chars={restroom:'R',accessible_restroom:'AR',firstaid:'+',concession:'C',water:'W',gate:'G',volunteer:'V',junction:'J',crossing:'X',restriction:'!',hole:'H',expo:'E',viewing:'P',hospitality:'H',proshop:'S',other:'•'};
  const classes={restroom:'marker-restroom',accessible_restroom:'marker-restroom',firstaid:'marker-firstaid',concession:'marker-concession',water:'marker-concession',hole:'marker-hole',junction:'marker-junction',crossing:'marker-junction'};
  return L.divIcon({className:'',html:`<div class="marker-dot ${classes[type]||'marker-other'}">${escapeHtml(label||chars[type]||'•')}</div>`,iconSize:[31,31],iconAnchor:[15,15],popupAnchor:[0,-14]});
}
function baseLayers(){
  const osm=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'&copy; OpenStreetMap contributors'});
  const imagery=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Powered by Esri | Imagery &copy; Esri and data providers'});
  return {imagery,osm};
}
function addDatasetToMap(map,data,group,options={}){
  group.clearLayers();
  const pointMarkers=[];
  (data.points||[]).forEach(p=>{
    const m=L.marker([p.lat,p.lng],{icon:pointIcon(p.type,p.type==='hole'?(p.nearest||'H'):''),draggable:!!options.draggable});
    m.bindPopup(`<strong>${escapeHtml(p.name)}</strong><br>${escapeHtml(p.type)}${p.notes?`<br>${escapeHtml(p.notes)}`:''}<br><small>Accuracy: ${Math.round(p.accuracy||0)} m</small>`);
    m._dataId=p.id;m._dataType='point';group.addLayer(m);pointMarkers.push(m);
    if(options.onPointDrag)m.on('dragend',()=>options.onPointDrag(p,m.getLatLng()));
    if(options.onSelect)m.on('click',()=>options.onSelect('point',p));
  });
  const routeLayers=[];
  (data.routes||[]).forEach(r=>{
    if(!r.points?.length)return;
    const style=r.status==='restricted'?{color:'#b3261e',dashArray:'8 6',weight:5}:r.status==='conditional'?{color:'#d07b00',dashArray:'10 5',weight:5}:{color:'#1769aa',weight:5};
    const line=L.polyline(r.points.map(p=>[p.lat,p.lng]),style).bindPopup(`<strong>${escapeHtml(r.name)}</strong><br>${escapeHtml(r.status||'allowed')}<br>${feet(routeDistance(r.points))} ft · ${r.points.length} samples`);
    line._dataId=r.id;line._dataType='route';group.addLayer(line);routeLayers.push(line);if(options.onSelect)line.on('click',()=>options.onSelect('route',r));
  });
  return {pointMarkers,routeLayers};
}
function importJsonFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{try{resolve(JSON.parse(reader.result))}catch(e){reject(e)}};reader.onerror=reject;reader.readAsText(file)})}
