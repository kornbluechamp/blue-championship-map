
document.addEventListener('DOMContentLoaded',()=>{
  let data=loadDataset(),active=loadActiveRoute(),watchId=null,current=null,currentMarker=null,accuracyCircle=null,liveLine=null,tapMode=false,wakeLock=null;
  const map=L.map('scoutMap').setView([40.3328434,-105.1031801],15);
  const layers=baseLayers();
  layers.imagery.addTo(map);
  L.control.layers({'Satellite':layers.imagery,'Street map':layers.osm},null,{position:'topright'}).addTo(map);
  const savedGroup=L.featureGroup().addTo(map);
  const activeGroup=L.featureGroup().addTo(map);

  const locateButton=document.getElementById('locateButton');
  document.getElementById('courseButton').onclick=()=>map.setView([40.3328434,-105.1031801],15);

  function status(msg){document.getElementById('saveStatus').textContent=msg}
  function persist(msg='Saved locally'){
    const t=saveDataset(data);
    status(`${msg} at ${new Date(t).toLocaleTimeString()}`);
    renderCounts();
    renderRecent();
    addDatasetToMap(map,data,savedGroup);
  }
  function renderCounts(){
    document.getElementById('pointCount').textContent=data.points.length;
    document.getElementById('routeCount').textContent=data.routes.length;
    document.getElementById('routeSamples').textContent=`${active?.points?.length||0} points`;
  }
  function renderRecent(){
    const root=document.getElementById('recentList');
    root.innerHTML='<h2>Recently saved</h2>';
    [...data.points].slice(-3).reverse().forEach(p=>{
      const d=document.createElement('div');
      d.className='data-item';
      d.innerHTML=`<strong>${escapeHtml(p.name)}</strong><br><span class="small">${escapeHtml(p.type)} · ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}</span>`;
      root.appendChild(d);
    });
    [...data.routes].slice(-3).reverse().forEach(r=>{
      const d=document.createElement('div');
      d.className='data-item';
      d.innerHTML=`<strong>${escapeHtml(r.name)}</strong><br><span class="small">${escapeHtml(r.status)} · ${r.points.length} samples · ${feet(routeDistance(r.points))} ft</span>`;
      root.appendChild(d);
    });
  }

  function updateCurrent(pos){
    current={
      lat:pos.coords.latitude,
      lng:pos.coords.longitude,
      accuracy:pos.coords.accuracy,
      altitude:pos.coords.altitude,
      timestamp:new Date(pos.timestamp).toISOString()
    };
    document.getElementById('gpsAccuracy').textContent=`${Math.round(current.accuracy)} m`;

    if(currentMarker)map.removeLayer(currentMarker);
    if(accuracyCircle)map.removeLayer(accuracyCircle);

    currentMarker=L.circleMarker([current.lat,current.lng],{
      radius:8,color:'#fff',weight:3,fillColor:'#1769e0',fillOpacity:1
    }).addTo(map).bindPopup(`You are here<br><small>Estimated accuracy ${Math.round(current.accuracy)} m</small>`);

    accuracyCircle=L.circle([current.lat,current.lng],{
      radius:current.accuracy,color:'#1769e0',weight:1,fillOpacity:.08
    }).addTo(map);

    locateButton.textContent='Center on me';

    if(active&&!active.paused){
      const pts=active.points,last=pts[pts.length-1];
      const elapsed=last?(new Date(current.timestamp)-new Date(last.timestamp))/1000:999;
      const moved=last?haversine(last,current):999;
      if(!last||(elapsed>=3&&moved>=2)||(elapsed>=10)){
        pts.push({...current});
        active.updatedAt=new Date().toISOString();
        saveActiveRoute(active);
        renderActive();
        status(`Route autosaved locally at ${new Date().toLocaleTimeString()}`);
      }
    }
  }

  function locationMessage(err){
    const code=err?.code;
    if(code===1){
      return 'Location permission is blocked for this site. Open your browser site settings, allow Location, then reload this page.';
    }
    if(code===2){
      return 'Your phone could not determine its location. Move outdoors with a clear view of the sky and try again.';
    }
    if(code===3){
      return 'Location timed out. Move outdoors, confirm Location Services are on, and try again.';
    }
    return `Location error: ${err?.message||'Unknown error'}`;
  }

  function gpsError(err){
    status(locationMessage(err));
    locateButton.textContent='Try location again';
    if(watchId!==null){
      try{navigator.geolocation.clearWatch(watchId)}catch(_){}
      watchId=null;
    }
  }

  function startContinuousWatch(){
    if(watchId!==null||!navigator.geolocation)return;
    watchId=navigator.geolocation.watchPosition(
      updateCurrent,
      gpsError,
      {enableHighAccuracy:true,maximumAge:0,timeout:30000}
    );
  }

  async function requestLocationFromTap(center=true){
    if(!window.isSecureContext){
      status('Location requires a secure HTTPS page. Reopen the GitHub Pages address beginning with https:// rather than a downloaded file or http:// link.');
      return false;
    }
    if(!navigator.geolocation){
      status('Geolocation is unavailable in this browser.');
      return false;
    }

    locateButton.textContent='Requesting location…';
    status('Requesting phone location. Approve Location access when your browser asks.');

    // The first request is deliberately made inside the button tap.
    // This avoids mobile browsers suppressing a permission request made during page load.
    return new Promise(resolve=>{
      navigator.geolocation.getCurrentPosition(
        pos=>{
          updateCurrent(pos);
          startContinuousWatch();
          if(center)map.setView([current.lat,current.lng],19);
          status(`Location active. Estimated accuracy ${Math.round(current.accuracy)} m. Continuous tracking is now running.`);
          resolve(true);
        },
        err=>{
          gpsError(err);
          resolve(false);
        },
        {enableHighAccuracy:true,maximumAge:0,timeout:30000}
      );
    });
  }

  function renderActive(){
    activeGroup.clearLayers();
    if(active?.points?.length){
      liveLine=L.polyline(active.points.map(p=>[p.lat,p.lng]),{
        color:active.status==='restricted'?'#b3261e':active.status==='conditional'?'#d07b00':'#00a264',
        weight:6
      }).addTo(activeGroup);
      document.getElementById('recordingBanner').classList.remove('hidden');
      document.getElementById('recordingBanner').innerHTML=`<strong>${active.paused?'Paused':'Recording'}:</strong> ${escapeHtml(active.name)}<br>${active.points.length} GPS samples · ${feet(routeDistance(active.points))} ft`;
      document.getElementById('startRoute').classList.add('hidden');
      document.getElementById('pauseRoute').classList.remove('hidden');
      document.getElementById('finishRoute').classList.remove('hidden');
      document.getElementById('discardRoute').classList.remove('hidden');
      document.getElementById('pauseRoute').textContent=active.paused?'Resume':'Pause';
    }else{
      document.getElementById('recordingBanner').classList.add('hidden');
      document.getElementById('startRoute').classList.remove('hidden');
      document.getElementById('pauseRoute').classList.add('hidden');
      document.getElementById('finishRoute').classList.add('hidden');
      document.getElementById('discardRoute').classList.add('hidden');
    }
    renderCounts();
  }

  function savePoint(lat,lng,source,accuracy=0){
    const name=document.getElementById('pointName').value.trim();
    if(!name)return alert('Enter a clear location name first.');
    const p={
      id:uid('point'),
      type:document.getElementById('pointType').value,
      name,
      nearest:document.getElementById('pointNearest').value.trim(),
      notes:document.getElementById('pointNotes').value.trim(),
      photoRef:document.getElementById('photoRef').value.trim(),
      lat,lng,accuracy,source,
      createdAt:new Date().toISOString()
    };
    data.points.push(p);
    persist('Point saved');
    document.getElementById('pointName').value='';
    document.getElementById('pointNotes').value='';
    document.getElementById('photoRef').value='';
    map.setView([lat,lng],19);
  }

  locateButton.onclick=async()=>{
    if(current){
      map.setView([current.lat,current.lng],19);
      status(`Centered on current location. Estimated accuracy ${Math.round(current.accuracy)} m.`);
    }else{
      await requestLocationFromTap(true);
    }
  };

  document.getElementById('saveGpsPoint').onclick=async()=>{
    if(!current){
      const ok=await requestLocationFromTap(false);
      if(!ok||!current)return;
    }
    savePoint(current.lat,current.lng,'gps',current.accuracy);
  };

  document.getElementById('tapPoint').onclick=()=>{
    tapMode=true;
    status('Tap the exact location on the map. The next map tap will save the point.');
  };
  map.on('click',e=>{
    if(!tapMode)return;
    tapMode=false;
    savePoint(e.latlng.lat,e.latlng.lng,'manual-map',0);
  });

  document.getElementById('startRoute').onclick=async()=>{
    const name=document.getElementById('routeName').value.trim();
    if(!name)return alert('Enter a route name first.');
    if(!current){
      const ok=await requestLocationFromTap(false);
      if(!ok)return;
    }
    active={
      id:uid('route'),
      name,
      status:document.getElementById('routeStatus').value,
      notes:document.getElementById('routeNotes').value.trim(),
      startedAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      paused:false,
      points:current?[{...current}]:[]
    };
    saveActiveRoute(active);
    startContinuousWatch();
    renderActive();
    status('Route started. Every accepted GPS sample is being saved locally.');
  };

  document.getElementById('pauseRoute').onclick=()=>{
    if(!active)return;
    active.paused=!active.paused;
    saveActiveRoute(active);
    renderActive();
    status(active.paused?'Route paused and saved locally.':'Route resumed and autosaving.');
  };
  document.getElementById('finishRoute').onclick=()=>{
    if(!active)return;
    if(active.points.length<2&&!confirm('Only a few GPS samples were captured. Save it anyway?'))return;
    active.endedAt=new Date().toISOString();
    active.paused=false;
    data.routes.push(active);
    active=null;
    saveActiveRoute(null);
    persist('Route completed and saved');
    renderActive();
    document.getElementById('routeName').value='';
    document.getElementById('routeNotes').value='';
  };
  document.getElementById('discardRoute').onclick=()=>{
    if(active&&confirm('Discard the active route?')){
      active=null;
      saveActiveRoute(null);
      renderActive();
      status('Active route discarded. Completed data remains saved.');
    }
  };

  function exportData(){
    const packageData={...data,activeRoute:active||null,exportedAt:new Date().toISOString()};
    downloadJson(packageData,`tpc-colorado-scout-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`);
  }
  document.getElementById('downloadData').onclick=exportData;
  document.getElementById('backupTop').onclick=exportData;
  document.getElementById('copyData').onclick=async()=>{
    await navigator.clipboard.writeText(JSON.stringify({...data,activeRoute:active||null,exportedAt:new Date().toISOString()},null,2));
    status('JSON copied to clipboard.');
  };
  document.getElementById('shareData').onclick=async()=>{
    const obj={...data,activeRoute:active||null,exportedAt:new Date().toISOString()};
    const file=new File([JSON.stringify(obj,null,2)],`tpc-colorado-scout-${Date.now()}.json`,{type:'application/json'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({title:'TPC Colorado scouting data',files:[file]});
    }else exportData();
  };

  document.getElementById('wakeButton').onclick=async()=>{
    try{
      if(!('wakeLock'in navigator))return alert('Screen wake lock is not supported in this browser. Keep the screen on manually while tracing.');
      wakeLock=await navigator.wakeLock.request('screen');
      document.getElementById('wakeButton').textContent='Screen will stay awake';
      wakeLock.addEventListener('release',()=>document.getElementById('wakeButton').textContent='Keep screen awake');
    }catch(e){alert(e.message)}
  };

  if(active){
    const b=document.getElementById('recoveryBanner');
    b.classList.remove('hidden');
    b.innerHTML=`Recovered unfinished route <strong>${escapeHtml(active.name)}</strong> with ${active.points.length} saved samples. It remains safely stored. Resume, finish, or discard it below.`;
    document.getElementById('routeName').value=active.name;
    document.getElementById('routeStatus').value=active.status;
    document.getElementById('routeNotes').value=active.notes||'';
    renderActive();
  }else renderActive();

  persist('Existing data loaded');

  // Do not request GPS on page load. Mobile browsers may suppress that prompt.
  // The user must press Locate me, Save at current GPS, or Start route.
  if(!window.isSecureContext){
    status('Location is disabled because this page is not using HTTPS. Open the published GitHub Pages link.');
  }else{
    status('Ready. The map starts at TPC Colorado even when you are at home. Tap Locate me to move the blue dot to your phone, or Show course to return to TPC Colorado.');
  }
});
