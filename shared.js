const STORAGE_KEY='tpcColoradoScoutV3';
const ACTIVE_KEY='tpcColoradoActiveRouteV3';
function emptyDataset(){return{version:7,event:'The Blue Championship',course:'TPC Colorado',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),points:[],routes:[],activeRoute:null}}
function loadDataset(){try{return{...emptyDataset(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch(_){return emptyDataset()}}
function saveDataset(data){data.updatedAt=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data}
function saveActiveRoute(route){localStorage.setItem(ACTIVE_KEY,JSON.stringify(route))}
function loadActiveRoute(){try{return JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null')}catch(_){return null}}
function clearActiveRoute(){localStorage.removeItem(ACTIVE_KEY)}
function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function haversine(a,b){const R=6371000,toRad=x=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng),q=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
function routeDistance(points){let m=0;for(let i=1;i<points.length;i++)m+=haversine(points[i-1],points[i]);return m}
function feet(m){return Math.round(m*3.28084)}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function downloadJson(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function pointIcon(type,label='',iconType=''){
  const t=iconType||type;
  const chars={restroom:'R',accessible_restroom:'R',firstaid:'+',concession:'C',water:'W',scoreboard:'S',gate:'G',volunteer:'V',junction:'J',crossing:'X',restriction:'!',hole:'H',expo:'E',viewing:'P',hospitality:'H',proshop:'P',clubhouse:'CL',other:'•'};
  const classes={restroom:'marker-restroom',accessible_restroom:'marker-restroom',firstaid:'marker-firstaid',concession:'marker-concession',water:'marker-concession',scoreboard:'marker-scoreboard',hole:'marker-hole',junction:'marker-junction',crossing:'marker-junction',restriction:'marker-restriction',proshop:'marker-place',clubhouse:'marker-place',hospitality:'marker-place',gate:'marker-place',volunteer:'marker-volunteer'};
  return L.divIcon({className:'',html:`<div class="marker-dot ${classes[t]||'marker-other'}">${escapeHtml(label||chars[t]||'•')}</div>`,iconSize:[31,31],iconAnchor:[15,15],popupAnchor:[0,-14]});
}
function baseLayers(){
  const osm=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'&copy; OpenStreetMap contributors'});
  const imagery=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Powered by Esri | Imagery &copy; Esri and data providers'});
  return{imagery,osm};
}
function markerPopup(p){
  const labels={accessible_restroom:'Accessible restroom',firstaid:'First aid',proshop:'Pro shop / merchandise',scoreboard:'Scoreboard',clubhouse:'Clubhouse entrance'};
  const typeLabel=labels[p.type]||String(p.type||'location').replaceAll('_',' ');
  return `<strong>${escapeHtml(p.name)}</strong><br>${escapeHtml(typeLabel)}${p.nearest?`<br><small>Near ${escapeHtml(p.nearest)}</small>`:''}${p.notes?`<br>${escapeHtml(p.notes)}`:''}`;
}
function routeDisplay(route){
  const type=route.routeType||'path';
  if(type==='street_crossing')return{style:{color:'#c62828',weight:7},label:'Public street crossing'};
  if(type==='spectator_crossing')return{style:{color:'#e07a00',weight:7},label:'Spectator crossing — may pause during play'};
  if(route.status==='restricted')return{style:{color:'#70777d',dashArray:'8 6',weight:5},label:'Restricted route'};
  if(route.status==='conditional')return{style:{color:'#1769aa',dashArray:'10 5',weight:5},label:'Conditional spectator path'};
  return{style:{color:'#1769aa',weight:5},label:type==='connector'?'Spectator connector':'Spectator path'};
}
function addDatasetToMap(map,data,group,options={}){
  group.clearLayers();const pointMarkers=[],routeLayers=[];
  (data.points||[]).forEach(p=>{
    if(options.pointFilter&&!options.pointFilter(p))return;
    const label=p.type==='hole'?(p.holeNumber||p.nearest||'H'):'';
    const m=L.marker([p.lat,p.lng],{icon:pointIcon(p.type,label,p.iconType),draggable:!!options.draggable});
    m.bindPopup(markerPopup(p));m._dataId=p.id;m._dataType='point';group.addLayer(m);pointMarkers.push(m);
    if(options.onPointDrag)m.on('dragend',()=>options.onPointDrag(p,m.getLatLng()));
    if(options.onSelect)m.on('click',()=>options.onSelect('point',p));
  });
  (data.routes||[]).forEach(r=>{
    if(!r.points?.length||(options.routeFilter&&!options.routeFilter(r)))return;
    const display=routeDisplay(r);
    const generatedNote=r.generated&&r.routeType!=='street_crossing'&&r.routeType!=='spectator_crossing'?'<br><small>Short connected gap between scouted path endpoints</small>':'';
    const line=L.polyline(r.points.map(p=>[p.lat,p.lng]),display.style).bindPopup(`<strong>${escapeHtml(r.name)}</strong><br>${escapeHtml(display.label)}${generatedNote}${r.notes?`<br>${escapeHtml(r.notes)}`:''}<br><small>${feet(routeDistance(r.points))} ft</small>`);
    line._dataId=r.id;line._dataType='route';group.addLayer(line);routeLayers.push(line);if(options.onSelect)line.on('click',()=>options.onSelect('route',r));
  });
  return{pointMarkers,routeLayers};
}
function importJsonFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{try{resolve(JSON.parse(reader.result))}catch(e){reject(e)}};reader.onerror=reject;reader.readAsText(file)})}
function bearingBetween(a,b){const toRad=x=>x*Math.PI/180,toDeg=x=>x*180/Math.PI,lat1=toRad(a.lat),lat2=toRad(b.lat),dLon=toRad(b.lng-a.lng),y=Math.sin(dLon)*Math.cos(lat2),x=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);return(toDeg(Math.atan2(y,x))+360)%360}
function circularBlend(oldDeg,newDeg,weight=.28){if(!Number.isFinite(oldDeg))return newDeg;const a=oldDeg*Math.PI/180,b=newDeg*Math.PI/180,x=(1-weight)*Math.cos(a)+weight*Math.cos(b),y=(1-weight)*Math.sin(a)+weight*Math.sin(b);return(Math.atan2(y,x)*180/Math.PI+360)%360}
