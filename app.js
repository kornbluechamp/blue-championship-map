
document.addEventListener('DOMContentLoaded',async()=>{
  let verified={points:[],routes:[],mapCenter:[40.3328434,-105.1031801],defaultZoom:15};
  try{verified=await fetch('verified-data.json?v=320',{cache:'no-store'}).then(r=>r.json())}catch(_){}

  const map=L.map('navigateMap',{zoomControl:true}).setView(verified.mapCenter||[40.3328434,-105.1031801],verified.defaultZoom||15);
  const layers=baseLayers();
  layers.osm.addTo(map);
  L.control.layers({'Street map':layers.osm,'Satellite':layers.imagery},null,{position:'topright'}).addTo(map);

  const verifiedGroup=L.featureGroup().addTo(map),localGroup=L.featureGroup().addTo(map);
  addDatasetToMap(map,verified,verifiedGroup);

  let userMarker=null,userAccuracy=null,lastPosition=null;
  const status=document.getElementById('navigateStatus');
  const locateButton=document.getElementById('locateMe');

  function setStatus(title,text){
    status.innerHTML=`<h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>`;
  }
  function friendlyLocationError(err){
    if(err?.code===1)return 'Location permission is blocked for this site. Allow Location in your browser site settings, reload, and try again.';
    if(err?.code===2)return 'Your phone could not determine its location. Move outdoors and try again.';
    if(err?.code===3)return 'Location timed out. Confirm Location Services are on and try again outdoors.';
    return err?.message||'Unknown location error.';
  }
  function showPosition(pos){
    lastPosition={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};
    if(userMarker)map.removeLayer(userMarker);
    if(userAccuracy)map.removeLayer(userAccuracy);
    userMarker=L.marker([lastPosition.lat,lastPosition.lng],{
      icon:L.divIcon({className:'',html:'<div class="marker-dot marker-location">●</div>',iconSize:[31,31],iconAnchor:[15,15]})
    }).addTo(map).bindPopup(`You are here<br><small>Estimated accuracy ${Math.round(lastPosition.accuracy)} m</small>`);
    userAccuracy=L.circle([lastPosition.lat,lastPosition.lng],{
      radius:lastPosition.accuracy,color:'#1769e0',fillOpacity:.08,weight:1
    }).addTo(map);
    map.setView([lastPosition.lat,lastPosition.lng],18);
    setStatus('Location found',`Estimated accuracy: ${Math.round(lastPosition.accuracy)} meters.`);
    locateButton.textContent='Center on me';
  }
  function locate(){
    if(lastPosition){
      map.setView([lastPosition.lat,lastPosition.lng],18);
      return;
    }
    if(!window.isSecureContext){
      return setStatus('Location unavailable','Open the secure GitHub Pages address beginning with https://. Location does not work from a downloaded HTML file or an http:// page.');
    }
    if(!navigator.geolocation){
      return setStatus('Location unavailable','This browser does not provide GPS location.');
    }
    setStatus('Finding your location','Approve Location access when your phone asks.');
    navigator.geolocation.getCurrentPosition(
      showPosition,
      err=>setStatus('Location unavailable',friendlyLocationError(err)),
      {enableHighAccuracy:true,timeout:30000,maximumAge:0}
    );
  }
  locateButton.onclick=locate;

  document.querySelectorAll('.quick-actions button[data-category]').forEach(btn=>btn.onclick=()=>{
    const category=btn.dataset.category;
    const candidates=[...(verified.points||[]),...loadDataset().points].filter(p=>p.type===category||(category==='restroom'&&p.type==='accessible_restroom'));
    if(!candidates.length)return setStatus(btn.textContent,'No verified locations in this category yet. Record them using Scout & Trace.');
    if(!lastPosition){
      setStatus('Location needed','Tap Show my location first so the app can identify the nearest option.');
      return;
    }
    candidates.sort((a,b)=>haversine(lastPosition,a)-haversine(lastPosition,b));
    const p=candidates[0];
    map.setView([p.lat,p.lng],18);
    setStatus(p.name,`${feet(haversine(lastPosition,p))} feet away in a straight line. Walking-path routing will be added after approved paths are traced.`);
  });

  document.querySelectorAll('.view-tab').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.view-tab').forEach(b=>b.classList.toggle('active',b===btn));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    document.getElementById(btn.dataset.view+'View').classList.add('active');
    if(btn.dataset.view==='navigate')setTimeout(()=>map.invalidateSize(),60);
  });

  const panel=document.getElementById('toolsPanel');
  document.getElementById('menuButton').onclick=()=>panel.classList.remove('hidden');
  document.getElementById('closeTools').onclick=()=>panel.classList.add('hidden');
  document.getElementById('shareApp').onclick=async()=>{
    try{
      navigator.share?await navigator.share({title:document.title,url:location.href}):await navigator.clipboard.writeText(location.href);
    }catch(_){}
  };
  document.getElementById('loadLocalData').onclick=()=>{
    const d=loadDataset();
    addDatasetToMap(map,d,localGroup);
    if(d.points.length||d.routes.length){
      const bounds=localGroup.getBounds?.();
      if(bounds?.isValid())map.fitBounds(bounds.pad(.15));
      setStatus('Local scouting data shown',`${d.points.length} points and ${d.routes.length} completed routes from this device.`);
    }else setStatus('No local scouting data','This device does not have saved scouting records yet.');
    panel.classList.add('hidden');
  };
});
