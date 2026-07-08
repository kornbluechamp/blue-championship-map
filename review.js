
document.addEventListener('DOMContentLoaded',()=>{
  let data=emptyDataset();
  let pointDrag=false;
  let mode='select';
  let draftLatLng=null;
  let selected=null;
  let routeEdit=null;
  let draftRoute=null;

  const map=L.map('reviewMap').setView([40.3384,-105.1099],15);
  const layers=baseLayers();
  layers.osm.addTo(map);
  let reviewMapStyle='street';
  let officialLayer=null;

  function setReviewTileBase(layer){
    if(map.baseLayer)map.removeLayer(map.baseLayer);
    if(layer)map.addLayer(layer);
  }

  function configureOfficialLayer(){
    if(officialLayer)map.removeLayer(officialLayer);
    officialLayer=null;
    const config=data.officialOverlay;
    const officialButton=document.querySelector('[data-review-map-style="official"]');
    if(config?.bounds&&config?.opaqueImage){
      officialLayer=L.imageOverlay(`${config.opaqueImage}?v=450`,config.bounds,{opacity:1,alt:'Official course map'});
      if(officialButton)officialButton.disabled=false;
    }else if(officialButton){
      officialButton.disabled=true;
      if(reviewMapStyle==='official')reviewMapStyle='street';
    }
  }

  function applyReviewMapStyle(){
    if(officialLayer)map.removeLayer(officialLayer);
    if(reviewMapStyle==='official'){
      setReviewTileBase(null);
      if(officialLayer)map.addLayer(officialLayer);
    }else{
      setReviewTileBase(reviewMapStyle==='satellite'?layers.imagery:layers.osm);
    }
    document.querySelectorAll('.review-map-style-button').forEach(button=>{
      button.classList.toggle('active',button.dataset.reviewMapStyle===reviewMapStyle);
    });
  }

  document.querySelectorAll('.review-map-style-button').forEach(button=>{
    button.onclick=()=>{
      reviewMapStyle=button.dataset.reviewMapStyle;
      applyReviewMapStyle();
    };
  });
  applyReviewMapStyle();

  const dataGroup=L.featureGroup().addTo(map);
  const draftGroup=L.featureGroup().addTo(map);
  const editGroup=L.featureGroup().addTo(map);
  const details=document.getElementById('reviewDetails');

  const pointTypes=[
    ['restroom','Restroom'],
    ['accessible_restroom','Accessible restroom'],
    ['firstaid','First aid'],
    ['concession','Concession'],
    ['water','Water / refill'],
    ['scoreboard','Scoreboard'],
    ['gate','Gate / exit'],
    ['expo','Expo Row entrance'],
    ['viewing','Public viewing'],
    ['hospitality','Hospitality entrance'],
    ['proshop','Pro shop / merchandise'],
    ['clubhouse','Clubhouse entrance'],
    ['volunteer','Volunteer HQ'],
    ['junction','Cart-path junction'],
    ['crossing','Spectator crossing'],
    ['restriction','Restricted path / entrance'],
    ['hole','Hole reference'],
    ['other','Other']
  ];

  function optionHtml(options,current){
    return options.map(([value,label])=>
      `<option value="${escapeHtml(value)}" ${value===current?'selected':''}>${escapeHtml(label)}</option>`
    ).join('');
  }

  function pointMetadata(type){
    let group='amenities';
    if(type==='hole')group='holes';
    else if(['junction','crossing'].includes(type))group='junctions';
    else if(['volunteer','restriction'].includes(type))group='staff';
    else if(type==='scoreboard')group='scoreboards';
    else if(['hospitality','proshop','clubhouse','gate','expo','viewing'].includes(type))group='places';
    return{
      iconType:(type==='restroom'||type==='accessible_restroom')?'restroom':type,
      accessible:type==='accessible_restroom',
      group,
      defaultVisible:!['hole','junction','crossing','volunteer','restriction'].includes(type)
    };
  }


  function normalizeImported(d){
    const base={...emptyDataset(),...d,points:d.points||[],routes:d.routes||[]};
    if(d.activeRoute?.points?.length){
      base.routes.push({
        ...d.activeRoute,
        id:d.activeRoute.id||uid('route'),
        name:`${d.activeRoute.name||'Unfinished route'} (unfinished export)`
      });
    }
    return base;
  }

  function mergeDatasets(a,b){
    const pointMap=new Map((a.points||[]).map(p=>[p.id||`${p.lat},${p.lng},${p.name}`,p]));
    (b.points||[]).forEach(p=>pointMap.set(p.id||`${p.lat},${p.lng},${p.name}`,p));

    const routeMap=new Map((a.routes||[]).map(r=>[r.id||`${r.name},${r.startedAt||''}`,r]));
    (b.routes||[]).forEach(r=>routeMap.set(r.id||`${r.name},${r.startedAt||''}`,r));

    return {
      ...a,
      points:[...pointMap.values()],
      routes:[...routeMap.values()],
      networkNeedsRebuild:true,
      updatedAt:new Date().toISOString()
    };
  }

  function markNetworkDirty(){
    data.networkNeedsRebuild=true;
    document.getElementById('summaryNetwork').textContent='Routing will rebuild on export';
    document.getElementById('summaryNetwork').classList.add('summary-warning');
  }

  function routePoint(latlng,source='edited'){
    return{
      lat:Number(latlng.lat),
      lng:Number(latlng.lng),
      accuracy:0,
      source,
      timestamp:new Date().toISOString()
    };
  }

  function nearestNetworkAttachment(ll){
    let best=-1,bestD=Infinity;
    (data.network?.nodes||[]).forEach((n,i)=>{
      const d=haversine(ll,{lat:n[0],lng:n[1]});
      if(d<bestD){bestD=d;best=i}
    });
    return{
      networkNode:best>=0?best:null,
      networkAccessMeters:Number.isFinite(bestD)?Math.round(bestD*100)/100:null
    };
  }

  function attachPointToNetwork(p){
    Object.assign(p,nearestNetworkAttachment(p));
    return p;
  }

  function refreshRoutePicker(){
    const select=document.getElementById('routeSelect');
    const current=select.value;
    select.innerHTML='<option value="">Choose a route…</option>';
    (data.routes||[])
      .slice()
      .sort((a,b)=>(a.name||'').localeCompare(b.name||''))
      .forEach(r=>{
        const option=document.createElement('option');
        option.value=r.id;
        const prefix=r.routeType==='street_crossing'?'Red street crossing — ':r.routeType==='spectator_crossing'?'Orange spectator crossing — ':r.status==='restricted'?'Restricted — ':'';
        option.textContent=prefix+(r.name||'Unnamed route');
        select.appendChild(option);
      });
    if((data.routes||[]).some(r=>r.id===current))select.value=current;
  }

  function render(){
    addDatasetToMap(map,data,dataGroup,{
      draggable:pointDrag&&mode==='select',
      onPointDrag:(p,ll)=>{
        p.lat=ll.lat;
        p.lng=ll.lng;
        p.editedAt=new Date().toISOString();
        attachPointToNetwork(p);
        saveDataset(data);
        render();
        showPoint(p);
      },
      onSelect:(type,item)=>{
        if(type==='point')showPoint(item);
        else showRoute(item);
      }
    });

    document.getElementById('summaryPoints').textContent=`${(data.points||[]).length} points`;
    document.getElementById('summaryRoutes').textContent=`${(data.routes||[]).length} routes`;
    document.getElementById('summaryDistance').textContent=
      `${feet((data.routes||[]).reduce((n,r)=>n+routeDistance(r.points||[]),0)).toLocaleString()} feet traced`;

    if(data.networkNeedsRebuild){
      document.getElementById('summaryNetwork').textContent='Routing will rebuild on export';
      document.getElementById('summaryNetwork').classList.add('summary-warning');
    }else{
      const count=data.network?.nodes?.length||0;
      document.getElementById('summaryNetwork').textContent=count?`${count} routing nodes ready`:'Routing not built';
      document.getElementById('summaryNetwork').classList.remove('summary-warning');
    }

    refreshRoutePicker();
    if(routeEdit)renderRouteHandles();
    else editGroup.clearLayers();
  }

  function fit(){
    const b=dataGroup.getBounds?.();
    if(b?.isValid())map.fitBounds(b.pad(.10));
  }

  function saveAndRender(){
    saveDataset(data);
    render();
  }

  function stopModes(){
    mode='select';
    draftLatLng=null;
    draftRoute=null;
    routeEdit=null;
    draftGroup.clearLayers();
    editGroup.clearLayers();
    document.getElementById('addPoint').classList.remove('active-mode');
    document.getElementById('drawRoute').classList.remove('active-mode');
  }

  function showPoint(item){
    stopModes();
    selected={type:'point',item};
    details.innerHTML=`
      <h2>Edit destination</h2>
      <p class="edit-hint">Use <strong>Move destination markers</strong> above to drag the marker on Street or Satellite.</p>
      <div class="field"><label>Name</label><input id="editName" value="${escapeHtml(item.name||'')}"></div>
      <div class="field"><label>Type</label><select id="editType">${optionHtml(pointTypes,item.type)}</select></div>
      <div class="field"><label>Nearest hole / area</label><input id="editNearest" value="${escapeHtml(item.nearest||'')}"></div>
      <div class="field"><label>Directions, access, or restrictions</label><textarea id="editNotes">${escapeHtml(item.notes||'')}</textarea></div>
      <p class="small">Coordinates: ${Number(item.lat).toFixed(7)}, ${Number(item.lng).toFixed(7)}</p>
      <div class="button-row">
        <button id="savePoint" class="button primary">Save destination edits</button>
        <button id="deletePoint" class="button danger">Delete destination</button>
      </div>
    `;

    document.getElementById('savePoint').onclick=()=>{
      item.name=document.getElementById('editName').value.trim()||item.name;
      item.type=document.getElementById('editType').value;
      item.nearest=document.getElementById('editNearest').value.trim();
      item.notes=document.getElementById('editNotes').value.trim();
      Object.assign(item,pointMetadata(item.type));
      attachPointToNetwork(item);
      item.editedAt=new Date().toISOString();
      saveAndRender();
      showPoint(item);
    };

    document.getElementById('deletePoint').onclick=()=>{
      if(!confirm(`Delete ${item.name||'this destination'}?`))return;
      data.points=(data.points||[]).filter(p=>p.id!==item.id);
      saveAndRender();
      details.innerHTML='<h2>Destination deleted</h2><p>The point was removed from the editable dataset.</p>';
    };
  }

  function startAddPoint(){
    stopModes();
    mode='add-point';
    document.getElementById('addPoint').classList.add('active-mode');
    details.innerHTML=`
      <h2>Add a new destination</h2>
      <ol class="compact-steps">
        <li>Choose Street or Satellite and zoom to the location.</li>
        <li>Complete the fields below.</li>
        <li>Tap the public entrance or spectator approach point on the map.</li>
        <li>Save the new destination.</li>
      </ol>
      <div class="field"><label>Name</label><input id="newName" placeholder="Example: Heroes Watch entrance"></div>
      <div class="field"><label>Type</label><select id="newType">${optionHtml(pointTypes,'hospitality')}</select></div>
      <div class="field"><label>Nearest hole / area</label><input id="newNearest" placeholder="Example: Hole 18 Green"></div>
      <div class="field"><label>Directions, access, or restrictions</label><textarea id="newNotes" placeholder="Example: Credentialed hospitality. Entrance faces the main spectator path."></textarea></div>
      <div class="open-area-guidance">
        <strong>Open-area rule:</strong> A separate path is not required when spectators can freely walk from the nearby mapped path to this location. Draw a short connector only when ropes, fencing, terrain, or a required entrance control the approach.
      </div>
      <p id="newCoordinates" class="selection-message">Tap the map to choose the location.</p>
      <div class="button-row">
        <button id="saveNewPoint" class="button good" disabled>Save new destination</button>
        <button id="cancelNewPoint" class="button">Cancel</button>
      </div>
    `;

    document.getElementById('cancelNewPoint').onclick=()=>{
      stopModes();
      details.innerHTML='<h2>Add cancelled</h2><p>No destination was added.</p>';
    };
    document.getElementById('newType').onchange=()=>{
      if(!draftLatLng)return;
      draftGroup.clearLayers();
      draftGroup.addLayer(L.marker([draftLatLng.lat,draftLatLng.lng],{icon:pointIcon(document.getElementById('newType').value)}));
    };

    document.getElementById('saveNewPoint').onclick=()=>{
      const name=document.getElementById('newName').value.trim();
      if(!name)return alert('Enter a destination name.');
      if(!draftLatLng)return alert('Tap the map to place the destination.');

      const type=document.getElementById('newType').value;
      const p={
        id:uid('point'),
        type,
        name,
        nearest:document.getElementById('newNearest').value.trim(),
        notes:document.getElementById('newNotes').value.trim(),
        lat:draftLatLng.lat,
        lng:draftLatLng.lng,
        accuracy:0,
        source:'map',
        createdAt:new Date().toISOString(),
        addedManually:true,
        accessType:'open_area',
        ...pointMetadata(type)
      };
      attachPointToNetwork(p);
      data.points.push(p);
      saveDataset(data);
      stopModes();
      render();
      map.setView([p.lat,p.lng],Math.max(map.zoom,18));
      showPoint(p);
    };
  }

  function drawDraftPointMarkers(points){
    draftGroup.clearLayers();
    if(points.length>1)draftGroup.addLayer(L.polyline(points.map(p=>[p.lat,p.lng]),{color:'#7a32a8',weight:7}));
    points.forEach((p,index)=>{
      draftGroup.addLayer(L.marker([p.lat,p.lng],{
        icon:L.divIcon({
          className:'',
          html:`<div class="route-edit-handle draft-handle">${index+1}</div>`,
          iconSize:[28,28],
          iconAnchor:[14,14]
        })
      }));
    });
  }

  function startDrawRoute(){
    stopModes();
    mode='draw-route';
    draftRoute={points:[]};
    document.getElementById('drawRoute').classList.add('active-mode');
    details.innerHTML=`
      <h2>Draw a new path</h2>
      <p>Tap the map in walking order. Add enough bends to follow the visible cart path. Use Street or Satellite and zoom in.</p>
      <div class="field"><label>Route name</label><input id="newRouteName" placeholder="Example: Heroes Watch entrance connector"></div>
      <div class="field"><label>Route display</label>
        <select id="newRouteType">
          <option value="path">Normal spectator path</option>
          <option value="spectator_crossing">Spectator crossing through playing area</option>
          <option value="street_crossing">Public street crossing</option>
          <option value="connector">Short connector</option>
        </select>
      </div>
      <div class="field"><label>Route status</label>
        <select id="newRouteStatus">
          <option value="allowed">Allowed spectator route</option>
          <option value="conditional">Conditional / may close</option>
          <option value="restricted">Restricted — do not route spectators</option>
        </select>
      </div>
      <div class="field"><label>Route notes</label><textarea id="newRouteNotes"></textarea></div>
      <p id="draftRouteCount" class="selection-message">0 shape points. Tap the map to start.</p>
      <div class="button-row">
        <button id="undoDraftPoint" class="button">Undo last point</button>
        <button id="saveDraftRoute" class="button good" disabled>Save new path</button>
        <button id="cancelDraftRoute" class="button">Cancel</button>
      </div>
    `;

    document.getElementById('undoDraftPoint').onclick=()=>{
      draftRoute.points.pop();
      drawDraftPointMarkers(draftRoute.points);
      updateDraftRouteCount();
    };
    document.getElementById('cancelDraftRoute').onclick=()=>{
      stopModes();
      details.innerHTML='<h2>Drawing cancelled</h2><p>No new path was added.</p>';
    };
    document.getElementById('saveDraftRoute').onclick=()=>{
      if(draftRoute.points.length<2)return alert('Add at least two map points.');
      const name=document.getElementById('newRouteName').value.trim()||'New spectator path';
      const route={
        id:uid('route'),
        name,
        routeType:document.getElementById('newRouteType').value,
        status:document.getElementById('newRouteStatus').value,
        notes:document.getElementById('newRouteNotes').value.trim(),
        generated:false,
        editedManually:true,
        points:draftRoute.points.map(p=>routePoint(p,'map')),
        createdAt:new Date().toISOString()
      };
      data.routes.push(route);
      markNetworkDirty();
      rebuildNetworkAndAttachments();
      saveDataset(data);
      stopModes();
      render();
      showRoute(route);
    };
  }

  function updateDraftRouteCount(){
    const count=draftRoute?.points?.length||0;
    const label=document.getElementById('draftRouteCount');
    const save=document.getElementById('saveDraftRoute');
    if(label)label.textContent=`${count} shape point${count===1?'':'s'}. Tap the map to continue.`;
    if(save)save.disabled=count<2;
  }

  function routeSnapshot(route){
    return route.points.map(p=>({...p}));
  }

  function pushUndo(){
    if(!routeEdit)return;
    routeEdit.undo.push(routeSnapshot(routeEdit.route));
    if(routeEdit.undo.length>20)routeEdit.undo.shift();
  }

  function editableIndices(points,density,selectedIndex){
    const n=points.length;
    if(!n)return[];
    let max=density==='all'?n:density==='detailed'?80:30;
    if(n<=max)return[...Array(n).keys()];
    const indices=new Set([0,n-1]);
    const step=(n-1)/(max-1);
    for(let i=1;i<max-1;i++)indices.add(Math.round(i*step));
    if(Number.isInteger(selectedIndex))indices.add(selectedIndex);
    return[...indices].sort((a,b)=>a-b);
  }

  function handleIcon(index,last,selectedIndex,sectionStart,sectionEnd){
    const boundary=index===sectionStart?'A':index===sectionEnd?'B':'';
    const endpoint=index===0?'S':index===last?'E':'';
    const selectedClass=index===selectedIndex?' selected':'';
    const endpointClass=endpoint?' endpoint':'';
    const boundaryClass=boundary?' section-boundary':'';
    return L.divIcon({
      className:'',
      html:`<div class="route-edit-handle${selectedClass}${endpointClass}${boundaryClass}">${boundary||endpoint||'•'}</div>`,
      iconSize:[28,28],
      iconAnchor:[14,14]
    });
  }

  function renderRouteHandles(){
    editGroup.clearLayers();
    if(!routeEdit)return;
    const route=routeEdit.route;
    if(!route.points?.length)return;

    editGroup.addLayer(L.polyline(route.points.map(p=>[p.lat,p.lng]),{
      color:'#7736a8',
      weight:9
    }));

    const indices=editableIndices(route.points,routeEdit.density,routeEdit.selectedIndex);
    indices.forEach(index=>{
      const p=route.points[index];
      const old={...p};
      const marker=L.marker([p.lat,p.lng],{
        icon:handleIcon(index,route.points.length-1,routeEdit.selectedIndex,routeEdit.sectionStart,routeEdit.sectionEnd),
        draggable:true
      });
      marker.on('click',()=>{
        routeEdit.selectedIndex=index;
        renderRouteHandles();
        showRouteEditor();
      });
      marker.on('dragend',()=>{
        pushUndo();
        const ll=marker.getLatLng();
        route.points[index]={...p,lat:ll.lat,lng:ll.lng,accuracy:0,source:'edited',timestamp:new Date().toISOString()};
        routeEdit.selectedIndex=index;
        route.editedAt=new Date().toISOString();
        markNetworkDirty();
        saveDataset(data);
        render();
        showRouteEditor();
      });
      editGroup.addLayer(marker);
    });
  }

  function localXY(ll,lat0){
    const cos=Math.cos(lat0*Math.PI/180);
    return{x:ll.lng*111320*cos,y:ll.lat*110540};
  }

  function xyLatLng(xy,lat0){
    const cos=Math.cos(lat0*Math.PI/180);
    return{lat:xy.y/110540,lng:xy.x/(111320*cos)};
  }

  function projectToSegment(p,a,b){
    const lat0=p.lat;
    const P=localXY(p,lat0),A=localXY(a,lat0),B=localXY(b,lat0);
    const dx=B.x-A.x,dy=B.y-A.y;
    const den=dx*dx+dy*dy;
    const t=den?Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/den)):0;
    const Q={x:A.x+t*dx,y:A.y+t*dy};
    const ll=xyLatLng(Q,lat0);
    return{...ll,t,distance:Math.hypot(P.x-Q.x,P.y-Q.y)};
  }

  function nearestSegment(route,ll){
    let best=null;
    for(let i=0;i<(route.points||[]).length-1;i++){
      const q=projectToSegment(ll,route.points[i],route.points[i+1]);
      if(!best||q.distance<best.distance)best={...q,index:i};
    }
    return best;
  }

  function nearestOtherRoutePosition(route,ll){
    let best=null;
    (data.routes||[]).forEach(other=>{
      if(other.id===route.id||!other.points?.length)return;
      if(other.points.length===1){
        const distance=haversine(ll,other.points[0]);
        if(!best||distance<best.distance)best={lat:other.points[0].lat,lng:other.points[0].lng,distance,route:other};
        return;
      }
      for(let i=0;i<other.points.length-1;i++){
        const q=projectToSegment(ll,other.points[i],other.points[i+1]);
        if(!best||q.distance<best.distance)best={...q,route:other};
      }
    });
    return best;
  }

  function startRouteEdit(route){
    stopModes();
    mode='edit-route';
    routeEdit={
      route,
      selectedIndex:null,
      density:'simple',
      action:null,
      sectionStart:null,
      sectionEnd:null,
      undo:[]
    };
    document.getElementById('routeSelect').value=route.id;
    render();
    showRouteEditor();
    const b=L.latLngBounds(route.points.map(p=>[p.lat,p.lng]));
    if(b.isValid())map.fitBounds(b.pad(.30));
  }

  function finishRouteEdit(){
    if(!routeEdit)return;
    const route=routeEdit.route;
    rebuildNetworkAndAttachments();
    route.editedAt=new Date().toISOString();
    saveDataset(data);
    routeEdit=null;
    mode='select';
    editGroup.clearLayers();
    render();
    showRoute(route);
  }

  function showRoute(route){
    stopModes();
    selected={type:'route',item:route};
    document.getElementById('routeSelect').value=route.id;
    details.innerHTML=`
      <h2>${escapeHtml(route.name||'Edit route')}</h2>
      <p class="edit-hint">
        Select <strong>Edit route shape</strong> to drag endpoints and bends, move a selected shape point by tapping,
        insert a new bend, extend either end, or snap a point to an adjoining path.
      </p>
      ${route.routeType==='spectator_crossing'?'<p class="spectator-crossing-note">This route is orange: a spectator crossing that may pause during play.</p>':''}
      ${route.routeType==='street_crossing'?'<p class="street-crossing-note">This route is red: a public street crossing requiring extra caution.</p>':''}
      <div class="field"><label>Route name</label><input id="editRouteName" value="${escapeHtml(route.name||'')}"></div>
      <div class="field"><label>Route display</label>
        <select id="editRouteType">
          <option value="path" ${!route.routeType||route.routeType==='path'?'selected':''}>Normal spectator path</option>
          <option value="spectator_crossing" ${route.routeType==='spectator_crossing'?'selected':''}>Spectator crossing through playing area</option>
          <option value="street_crossing" ${route.routeType==='street_crossing'?'selected':''}>Public street crossing</option>
          <option value="connector" ${route.routeType==='connector'?'selected':''}>Short connector</option>
        </select>
      </div>
      <div class="field"><label>Route status</label>
        <select id="editRouteStatus">
          <option value="allowed" ${route.status==='allowed'?'selected':''}>Allowed spectator route</option>
          <option value="conditional" ${route.status==='conditional'?'selected':''}>Conditional / may close</option>
          <option value="restricted" ${route.status==='restricted'?'selected':''}>Restricted — do not route spectators</option>
        </select>
      </div>
      <div class="field"><label>Route notes</label><textarea id="editRouteNotes">${escapeHtml(route.notes||'')}</textarea></div>
      <p><strong>${route.points?.length||0}</strong> shape points · <strong>${feet(routeDistance(route.points||[])).toLocaleString()} ft</strong></p>
      <div class="button-row">
        <button id="saveRouteInfo" class="button primary">Save route information</button>
        <button id="editRouteShape" class="button route-shape-button">Edit route shape</button>
        <button id="deleteRoute" class="button danger">Delete route</button>
      </div>
    `;

    document.getElementById('saveRouteInfo').onclick=()=>{
      route.name=document.getElementById('editRouteName').value.trim()||route.name;
      route.routeType=document.getElementById('editRouteType').value;
      route.status=document.getElementById('editRouteStatus').value;
      route.notes=document.getElementById('editRouteNotes').value.trim();
      route.editedAt=new Date().toISOString();
      markNetworkDirty();
      rebuildNetworkAndAttachments();
      saveAndRender();
      showRoute(route);
    };

    document.getElementById('editRouteShape').onclick=()=>startRouteEdit(route);
    document.getElementById('deleteRoute').onclick=()=>{
      if(!confirm(`Delete ${route.name||'this route'}?`))return;
      data.routes=(data.routes||[]).filter(r=>r.id!==route.id);
      rebuildNetworkAndAttachments();
      saveAndRender();
      details.innerHTML='<h2>Route deleted</h2><p>The path was removed and the routing network was rebuilt.</p>';
    };
  }

  function crossingTypeDetails(type){
    if(type==='spectator_crossing')return{
      name:'Spectator crossing',
      status:'conditional',
      notes:'Spectator crossing through a playing area. May be temporarily held while players are hitting. Follow marshal instructions.'
    };
    if(type==='street_crossing')return{
      name:'Public street crossing',
      status:'conditional',
      notes:'Public street crossing. Use the marked crossing, watch for vehicles, and follow traffic-control or staff instructions.'
    };
    return{name:'Spectator path',status:'allowed',notes:''};
  }

  function applyTypeToSelectedSection(){
    if(!routeEdit)return;
    const route=routeEdit.route;
    if(!Number.isInteger(routeEdit.sectionStart)||!Number.isInteger(routeEdit.sectionEnd)){
      return alert('Set both the section start and section end first.');
    }
    let start=Math.min(routeEdit.sectionStart,routeEdit.sectionEnd);
    let end=Math.max(routeEdit.sectionStart,routeEdit.sectionEnd);
    if(end-start<1)return alert('The selected section must include at least two route points.');

    const type=document.getElementById('sectionType').value;
    const detailsForType=crossingTypeDetails(type);
    const originalIndex=data.routes.findIndex(r=>r.id===route.id);
    if(originalIndex<0)return alert('The route could not be found.');

    const before=route.points.slice(0,start+1);
    const middle=route.points.slice(start,end+1);
    const after=route.points.slice(end);
    const pieces=[];
    const baseName=route.parentRouteName||route.name||'Spectator route';

    function makePiece(points,pieceType,pieceStatus,pieceName,pieceNotes,keepId=false){
      if(points.length<2)return;
      pieces.push({
        ...route,
        id:keepId?route.id:uid('route'),
        name:pieceName,
        parentRouteName:baseName,
        routeType:pieceType,
        status:pieceStatus,
        notes:pieceNotes,
        generated:false,
        editedManually:true,
        editedAt:new Date().toISOString(),
        points:points.map(p=>({...p}))
      });
    }

    const originalType=route.routeType||'path';
    const originalStatus=route.status||'allowed';
    const originalNotes=route.notes||'';
    let idUsed=false;
    if(before.length>=2){
      makePiece(before,originalType,originalStatus,baseName,originalNotes,true);
      idUsed=true;
    }
    makePiece(
      middle,
      type,
      detailsForType.status,
      `${detailsForType.name} — ${baseName}`,
      detailsForType.notes,
      !idUsed
    );
    idUsed=true;
    if(after.length>=2){
      makePiece(after,originalType,originalStatus,baseName,originalNotes,false);
    }

    data.routes.splice(originalIndex,1,...pieces);
    rebuildNetworkAndAttachments();
    saveDataset(data);
    routeEdit=null;
    mode='select';
    editGroup.clearLayers();
    render();
    const changed=pieces.find(r=>r.routeType===type)||pieces[0];
    showRoute(changed);
  }

  function actionText(action){
    const messages={
      'move-selected':'Tap the map where the selected purple handle should move.',
      'insert':'Tap near the route where a new bend or shape point should be inserted.',
      'extend-start':'Tap where the route should extend before its current start.',
      'extend-end':'Tap where the route should extend after its current end.'
    };
    return messages[action]||'Drag a purple handle or choose another editing action.';
  }

  function showRouteEditor(){
    if(!routeEdit)return;
    const route=routeEdit.route;
    const selectedIndex=routeEdit.selectedIndex;
    const selectedPoint=Number.isInteger(selectedIndex)?route.points[selectedIndex]:null;
    const sectionReady=Number.isInteger(routeEdit.sectionStart)&&Number.isInteger(routeEdit.sectionEnd);

    details.innerHTML=`
      <h2>Editing route shape and crossing sections</h2>
      <p><strong>${escapeHtml(route.name||'Unnamed route')}</strong></p>
      <p class="selection-message">${escapeHtml(actionText(routeEdit.action))}</p>

      <div class="route-editor-grid">
        <div class="field">
          <label>Visible shape handles</label>
          <select id="handleDensity">
            <option value="simple" ${routeEdit.density==='simple'?'selected':''}>Simple — about 30 handles</option>
            <option value="detailed" ${routeEdit.density==='detailed'?'selected':''}>Detailed — about 80 handles</option>
            <option value="all" ${routeEdit.density==='all'?'selected':''}>All recorded samples</option>
          </select>
        </div>
        <div class="route-selection-box">
          <strong>Selected handle</strong><br>
          ${selectedPoint
            ? `Point ${selectedIndex+1} of ${route.points.length}<br><span class="small">${selectedPoint.lat.toFixed(7)}, ${selectedPoint.lng.toFixed(7)}</span>`
            : '<span class="small">Tap a purple handle to select it.</span>'}
        </div>
      </div>

      <div class="route-edit-actions">
        <button id="moveSelected" class="button" ${selectedPoint?'':'disabled'}>Move selected by tapping map</button>
        <button id="insertPoint" class="button">Insert bend by tapping map</button>
        <button id="extendStart" class="button">Extend route start</button>
        <button id="extendEnd" class="button">Extend route end</button>
        <button id="snapSelected" class="button" ${selectedPoint?'':'disabled'}>Snap selected to nearest other path</button>
        <button id="deleteVertex" class="button danger" ${selectedPoint&&route.points.length>2?'':'disabled'}>Delete selected shape point</button>
        <button id="undoShape" class="button" ${routeEdit.undo.length?'':'disabled'}>Undo last shape change</button>
      </div>

      <section class="section-type-editor">
        <h3>Mark only part of this route as a crossing</h3>
        <p>Select a purple handle at the beginning of the crossing and set the start. Select a handle at the end and set the end.</p>
        <div class="section-boundary-grid">
          <button id="setSectionStart" class="button" ${selectedPoint?'':'disabled'}>Set selected handle as section start</button>
          <button id="setSectionEnd" class="button" ${selectedPoint?'':'disabled'}>Set selected handle as section end</button>
          <div><strong>Start:</strong> ${Number.isInteger(routeEdit.sectionStart)?`Point ${routeEdit.sectionStart+1}`:'Not set'}</div>
          <div><strong>End:</strong> ${Number.isInteger(routeEdit.sectionEnd)?`Point ${routeEdit.sectionEnd+1}`:'Not set'}</div>
        </div>
        <div class="field">
          <label>Selected section should become</label>
          <select id="sectionType">
            <option value="spectator_crossing">Orange — spectator crossing through playing area; may pause during play</option>
            <option value="street_crossing">Red — public street crossing; use extra caution</option>
            <option value="path">Blue — normal spectator path</option>
          </select>
        </div>
        <div class="button-row">
          <button id="applySectionType" class="button crossing-apply" ${sectionReady?'':'disabled'}>Apply to selected section</button>
          <button id="clearSection" class="button">Clear section selection</button>
        </div>
      </section>

      <div class="route-editor-help">
        <strong>Examples:</strong> Mark the short sections in front of the Hole 1, Hole 8, and Hole 9 tee boxes as orange spectator crossings. Mark crossings over public roads—such as Hole 1–2, Hole 10–11, and Hole 13–14—as red public street crossings.
      </div>

      <div class="button-row">
        <button id="finishShape" class="button good">Finish route shape and rebuild routing</button>
        <button id="cancelAction" class="button">Stop tap action</button>
      </div>
    `;

    document.getElementById('handleDensity').onchange=e=>{
      routeEdit.density=e.target.value;
      renderRouteHandles();
      showRouteEditor();
    };

    document.getElementById('moveSelected').onclick=()=>{routeEdit.action='move-selected';showRouteEditor()};
    document.getElementById('insertPoint').onclick=()=>{routeEdit.action='insert';showRouteEditor()};
    document.getElementById('extendStart').onclick=()=>{routeEdit.action='extend-start';showRouteEditor()};
    document.getElementById('extendEnd').onclick=()=>{routeEdit.action='extend-end';showRouteEditor()};
    document.getElementById('cancelAction').onclick=()=>{routeEdit.action=null;showRouteEditor()};

    document.getElementById('setSectionStart').onclick=()=>{
      routeEdit.sectionStart=routeEdit.selectedIndex;
      showRouteEditor();
    };
    document.getElementById('setSectionEnd').onclick=()=>{
      routeEdit.sectionEnd=routeEdit.selectedIndex;
      showRouteEditor();
    };
    document.getElementById('clearSection').onclick=()=>{
      routeEdit.sectionStart=null;routeEdit.sectionEnd=null;showRouteEditor();
    };
    document.getElementById('applySectionType').onclick=applyTypeToSelectedSection;

    document.getElementById('snapSelected').onclick=()=>{
      if(!Number.isInteger(routeEdit.selectedIndex))return;
      const index=routeEdit.selectedIndex;
      const current=route.points[index];
      const best=nearestOtherRoutePosition(route,current);
      if(!best)return alert('No other route was found.');
      if(best.distance>50)return alert(`The nearest other path is about ${Math.round(best.distance)} meters away. Zoom in and move the point manually instead.`);
      if(!confirm(`Snap this handle about ${Math.round(best.distance)} meters to ${best.route.name||'the nearest route'}?`))return;
      pushUndo();
      route.points[index]={...current,lat:best.lat,lng:best.lng,accuracy:0,source:'snapped',timestamp:new Date().toISOString()};
      route.editedAt=new Date().toISOString();
      routeEdit.action=null;
      markNetworkDirty();
      saveDataset(data);
      render();
      showRouteEditor();
    };

    document.getElementById('deleteVertex').onclick=()=>{
      if(!Number.isInteger(routeEdit.selectedIndex)||route.points.length<=2)return;
      pushUndo();
      route.points.splice(routeEdit.selectedIndex,1);
      routeEdit.selectedIndex=Math.min(routeEdit.selectedIndex,route.points.length-1);
      route.editedAt=new Date().toISOString();
      markNetworkDirty();
      saveDataset(data);
      render();
      showRouteEditor();
    };

    document.getElementById('undoShape').onclick=()=>{
      const previous=routeEdit.undo.pop();
      if(!previous)return;
      route.points=previous;
      routeEdit.selectedIndex=null;
      routeEdit.action=null;
      markNetworkDirty();
      saveDataset(data);
      render();
      showRouteEditor();
    };

    document.getElementById('finishShape').onclick=finishRouteEdit;
  }


  function handleMapClick(ll){
    if(mode==='add-point'){
      draftLatLng=ll;
      draftGroup.clearLayers();
      const draftType=document.getElementById('newType')?.value||'other';
      draftGroup.addLayer(L.marker([ll.lat,ll.lng],{icon:pointIcon(draftType)}));
      const text=document.getElementById('newCoordinates');
      const save=document.getElementById('saveNewPoint');
      if(text)text.textContent=`Selected: ${ll.lat.toFixed(7)}, ${ll.lng.toFixed(7)}. Tap elsewhere to move it.`;
      if(save)save.disabled=false;
      return;
    }

    if(mode==='draw-route'&&draftRoute){
      draftRoute.points.push({lat:ll.lat,lng:ll.lng});
      drawDraftPointMarkers(draftRoute.points);
      updateDraftRouteCount();
      return;
    }

    if(mode==='edit-route'&&routeEdit?.action){
      const route=routeEdit.route;
      pushUndo();

      if(routeEdit.action==='move-selected'){
        if(!Number.isInteger(routeEdit.selectedIndex)){
          routeEdit.undo.pop();
          return alert('Select a purple handle first.');
        }
        const old=route.points[routeEdit.selectedIndex];
        route.points[routeEdit.selectedIndex]={...old,lat:ll.lat,lng:ll.lng,accuracy:0,source:'edited',timestamp:new Date().toISOString()};
      }else if(routeEdit.action==='insert'){
        const nearest=nearestSegment(route,ll);
        if(!nearest){
          route.points.push(routePoint(ll));
          routeEdit.selectedIndex=route.points.length-1;
        }else{
          const index=nearest.index+1;
          route.points.splice(index,0,routePoint(ll));
          routeEdit.selectedIndex=index;
        }
      }else if(routeEdit.action==='extend-start'){
        route.points.unshift(routePoint(ll));
        routeEdit.selectedIndex=0;
      }else if(routeEdit.action==='extend-end'){
        route.points.push(routePoint(ll));
        routeEdit.selectedIndex=route.points.length-1;
      }

      routeEdit.action=null;
      route.editedAt=new Date().toISOString();
      markNetworkDirty();
      saveDataset(data);
      render();
      showRouteEditor();
    }
  }

  function buildNetwork(routes){
    const usable=(routes||[]).filter(r=>r.status!=='restricted'&&r.points?.length>=2);
    const nodes=[];
    const nodeRoutes=[];
    const routeNodeIds=new Map();
    const edges=new Map();
    const buckets=new Map();
    const bucketDegrees=0.00003;
    const mergeMeters=2.5;

    function bucketKey(x,y){return`${x}:${y}`}

    function findOrCreateNode(point,routeId){
      const bx=Math.floor(point.lat/bucketDegrees);
      const by=Math.floor(point.lng/bucketDegrees);
      let best=-1,bestD=Infinity;
      for(let dx=-1;dx<=1;dx++){
        for(let dy=-1;dy<=1;dy++){
          const ids=buckets.get(bucketKey(bx+dx,by+dy))||[];
          ids.forEach(id=>{
            const d=haversine(point,{lat:nodes[id][0],lng:nodes[id][1]});
            if(d<bestD){bestD=d;best=id}
          });
        }
      }
      if(best>=0&&bestD<=mergeMeters){
        nodeRoutes[best].add(routeId);
        return best;
      }
      const id=nodes.length;
      nodes.push([Number(point.lat),Number(point.lng)]);
      nodeRoutes.push(new Set([routeId]));
      const key=bucketKey(bx,by);
      if(!buckets.has(key))buckets.set(key,[]);
      buckets.get(key).push(id);
      return id;
    }

    function addEdge(a,b,w,routeType='path',routeStatus='allowed',routeId=''){
      if(a===b||!Number.isFinite(w)||w<=0)return;
      const key=a<b?`${a}:${b}`:`${b}:${a}`;
      const current=edges.get(key);
      if(!current||w<current.w)edges.set(key,{w,routeType:routeType||'path',routeStatus:routeStatus||'allowed',routeId});
    }

    usable.forEach(route=>{
      const ids=route.points.map(p=>findOrCreateNode(p,route.id));
      routeNodeIds.set(route.id,ids);
      for(let i=1;i<ids.length;i++){
        addEdge(
          ids[i-1],ids[i],
          haversine({lat:nodes[ids[i-1]][0],lng:nodes[ids[i-1]][1]},{lat:nodes[ids[i]][0],lng:nodes[ids[i]][1]}),
          route.routeType||'path',route.status||'allowed',route.id
        );
      }
    });

    const endpointJoinMeters=10;
    usable.forEach(route=>{
      const ids=routeNodeIds.get(route.id)||[];
      if(!ids.length)return;
      [ids[0],ids[ids.length-1]].forEach(endpointId=>{
        let best=-1,bestD=Infinity;
        const endpoint={lat:nodes[endpointId][0],lng:nodes[endpointId][1]};
        nodes.forEach((n,id)=>{
          if(id===endpointId||nodeRoutes[id].has(route.id))return;
          const d=haversine(endpoint,{lat:n[0],lng:n[1]});
          if(d<bestD){bestD=d;best=id}
        });
        if(best>=0&&bestD<=endpointJoinMeters)addEdge(endpointId,best,bestD,'connector','allowed','auto-endpoint-join');
      });
    });

    return{
      units:'meters',
      nodeFormat:'[latitude, longitude]',
      edgeFormat:'[fromNode, toNode, distanceMeters, routeType, routeStatus, routeId]',
      nodes,
      edges:[...edges.entries()].map(([key,edge])=>{
        const[a,b]=key.split(':').map(Number);
        return[a,b,Math.round(edge.w*100)/100,edge.routeType,edge.routeStatus,edge.routeId];
      })
    };
  }


  function rebuildNetworkAndAttachments(){
    data.network=buildNetwork(data.routes||[]);
    (data.points||[]).forEach(attachPointToNetwork);
    data.networkNeedsRebuild=false;
    data.networkRebuiltAt=new Date().toISOString();
    document.getElementById('summaryNetwork').classList.remove('summary-warning');
    return data.network;
  }

  async function loadPublished(){
    try{
      details.innerHTML='<h2>Loading current public map…</h2>';
      const response=await fetch(`verified-data.json?ts=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      data=normalizeImported(await response.json());
      configureOfficialLayer();
      applyReviewMapStyle();
      saveDataset(data);
      render();
      fit();
      details.innerHTML=`
        <h2>Current public map loaded</h2>
        <p>
          Choose <strong>Add a destination</strong>, <strong>Draw a missing path</strong>,
          move a marker, choose a route from the dropdown, or tap a route line directly.
        </p>`;
    }catch(err){
      details.innerHTML=`<h2>Could not load the public map</h2><p>${escapeHtml(err.message)}</p>`;
    }
  }

  document.getElementById('loadPublished').onclick=loadPublished;

  document.getElementById('fileInput').onchange=async e=>{
    try{
      data=normalizeImported(await importJsonFile(e.target.files[0]));
      configureOfficialLayer();
      applyReviewMapStyle();
      saveDataset(data);
      render();
      fit();
      details.innerHTML=`<h2>JSON imported</h2><p>${data.points.length} destinations and ${data.routes.length} routes loaded.</p>`;
    }catch(err){
      alert('Could not read that JSON file: '+err.message);
    }finally{
      e.target.value='';
    }
  };

  document.getElementById('mergeInput').onchange=async e=>{
    try{
      data=mergeDatasets(data,normalizeImported(await importJsonFile(e.target.files[0])));
      configureOfficialLayer();
      applyReviewMapStyle();
      rebuildNetworkAndAttachments();
      saveDataset(data);
      render();
      fit();
      details.innerHTML=`<h2>Merge complete</h2><p>${data.points.length} destinations and ${data.routes.length} routes are now loaded.</p>`;
    }catch(err){
      alert('Could not merge that JSON file: '+err.message);
    }finally{
      e.target.value='';
    }
  };

  document.getElementById('loadLocal').onclick=()=>{
    data=loadDataset();
    configureOfficialLayer();
    applyReviewMapStyle();
    render();
    fit();
    details.innerHTML='<h2>Local browser data loaded</h2><p>These are the records currently stored by this browser.</p>';
  };

  document.getElementById('fitAll').onclick=fit;

  document.getElementById('addPoint').onclick=startAddPoint;
  document.getElementById('drawRoute').onclick=startDrawRoute;

  document.getElementById('toggleDrag').onclick=e=>{
    stopModes();
    pointDrag=!pointDrag;
    e.currentTarget.classList.toggle('active-mode',pointDrag);
    e.currentTarget.querySelector('strong').textContent=pointDrag?'✓ Destination dragging is on':'↔ Move destination markers';
    render();
    details.innerHTML=pointDrag
      ?'<h2>Destination dragging is on</h2><p>Drag any destination marker to its correct public entrance or approach point. Turn dragging off when finished.</p>'
      :'<h2>Destination dragging is off</h2><p>Marker positions will no longer move when touched.</p>';
  };

  document.getElementById('editSelectedRoute').onclick=()=>{
    const id=document.getElementById('routeSelect').value;
    const route=(data.routes||[]).find(r=>r.id===id);
    if(!route)return alert('Choose a route first.');
    startRouteEdit(route);
  };

  map.on('click',e=>handleMapClick(e.latlng));

  document.getElementById('rebuildNetwork').onclick=()=>{
    rebuildNetworkAndAttachments();
    saveAndRender();
    details.innerHTML=`<h2>Routing rebuilt</h2><p>${data.network.nodes.length} network nodes and ${data.network.edges.length} connections are ready.</p>`;
  };

  document.getElementById('exportReview').onclick=()=>{
    rebuildNetworkAndAttachments();
    saveDataset(data);
    downloadJson(
      {...data,reviewedAt:new Date().toISOString()},
      `tpc-colorado-reviewed-${Date.now()}.json`
    );
    document.getElementById('summaryEdited').textContent='Editable backup exported';
  };

  document.getElementById('exportPublic').onclick=()=>{
    if(!(data.points||[]).length&&!(data.routes||[]).length)return alert('There is no map data to publish.');

    rebuildNetworkAndAttachments();

    const publicData={...data,version:7,publishedAt:new Date().toISOString(),displayDefaults:{...data.displayDefaults,restrooms:true,firstaid:true,concessions:true,scoreboards:true,places:true,paths:true,holes:false,junctions:false}};
    delete publicData.activeRoute;
    delete publicData.networkNeedsRebuild;

    publicData.points=(data.points||[]).map(p=>{
      const q={...p};
      delete q.photoRef;
      delete q.accuracy;
      delete q.source;
      delete q.createdAt;
      delete q.editedAt;
      return q;
    });

    publicData.routes=(data.routes||[]).map(r=>{
      const q={...r};
      delete q.startedAt;
      delete q.updatedAt;
      delete q.endedAt;
      delete q.paused;
      return q;
    });

    saveDataset(data);
    downloadJson(publicData,'verified-data.json');
    document.getElementById('summaryEdited').textContent='verified-data.json exported';
    details.innerHTML=`
      <h2>Public file created</h2>
      <p>
        Upload <strong>verified-data.json</strong> to the root of the GitHub repository and replace
        the current file. The edited geometry and rebuilt routing network are included.
      </p>`;
  };

  render();
  loadPublished();
});
