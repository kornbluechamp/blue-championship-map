
document.addEventListener('DOMContentLoaded',()=>{
  const OFFICIAL_OVERLAY={image:'official-course-georeferenced.webp',bounds:[[40.32587470634827,-105.12092583291178],[40.35035060211823,-105.09717800513117]],defaultOpacity:.65,anchorCount:21,alignedAt:'2026-07-08T01:53:02.694Z',method:'piecewise affine rubber-sheet using confirmed GPS tee/green anchors',disclaimer:'Official illustrated overlay is approximate and visually simplified. GPS points and the spectator path network control navigation.'};
  let data=emptyDataset(),drag=false,selected=null,addMode=false,draftLatLng=null;
  const map=L.map('reviewMap').setView([40.3328434,-105.1031801],15);
  const layers=baseLayers();
  layers.osm.addTo(map);
  L.control.layers({'Street map':layers.osm,'Satellite':layers.imagery},null,{position:'topright'}).addTo(map);

  const group=L.featureGroup().addTo(map);
  const draftGroup=L.featureGroup().addTo(map);
  const details=document.getElementById('reviewDetails');

  const pointTypes=[
    ['restroom','Restroom'],
    ['accessible_restroom','Accessible restroom'],
    ['firstaid','First aid'],
    ['concession','Concession'],
    ['water','Water / refill'],
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
    return{
      iconType:(type==='restroom'||type==='accessible_restroom')?'restroom':type,
      accessible:type==='accessible_restroom',
      group:type==='hole'?'holes':(['junction','crossing'].includes(type)?'junctions':(['volunteer','restriction'].includes(type)?'staff':(['hospitality','proshop','clubhouse','gate','expo','viewing'].includes(type)?'places':'amenities'))),
      defaultVisible:!['hole','junction','crossing','volunteer','restriction'].includes(type)
    };
  }

  function nearestNetworkAttachment(ll){
    let best=-1,bestD=Infinity;
    (data.network?.nodes||[]).forEach((n,i)=>{const d=haversine(ll,{lat:n[0],lng:n[1]});if(d<bestD){bestD=d;best=i}});
    return{networkNode:best>=0?best:null,networkAccessMeters:Number.isFinite(bestD)?bestD:null};
  }

  function attachPointToNetwork(p){Object.assign(p,nearestNetworkAttachment(p));return p;}

  function cancelAddMode(){addMode=false;draftLatLng=null;draftGroup.clearLayers();document.getElementById('addPoint').textContent='Add a location by tapping map';}

  function startAddPoint(){
    addMode=true;draftLatLng=null;draftGroup.clearLayers();document.getElementById('addPoint').textContent='Cancel adding location';
    details.innerHTML=`
      <h2>Add a new destination</h2>
      <p><strong>Step 1:</strong> Complete the fields. <strong>Step 2:</strong> tap the public entrance or approach point on the map. <strong>Step 3:</strong> save.</p>
      <div class="field"><label>Name</label><input id="newName" placeholder="Example: Heroes Watch public entrance"></div>
      <div class="field"><label>Type</label><select id="newType">${optionHtml(pointTypes,'hospitality')}</select></div>
      <div class="field"><label>Nearest hole / area</label><input id="newNearest" placeholder="Example: Hole 18 green"></div>
      <div class="field"><label>Directions, access, or restrictions</label><textarea id="newNotes" placeholder="Example: Credentialed hospitality. Public entrance faces the main spectator path."></textarea></div>
      <p id="newCoordinates" class="small">No map location selected yet.</p>
      <div class="button-row"><button id="saveNewPoint" class="button good" disabled>Save new location</button><button id="cancelNewPoint" class="button">Cancel</button></div>`;
    document.getElementById('cancelNewPoint').onclick=()=>{cancelAddMode();details.innerHTML='<h2>Add cancelled</h2><p>No location was added.</p>'};
    document.getElementById('saveNewPoint').onclick=()=>{
      const name=document.getElementById('newName').value.trim();if(!name)return alert('Enter a location name.');if(!draftLatLng)return alert('Tap the map to place the location.');
      const type=document.getElementById('newType').value,p={id:uid('point'),type,name,nearest:document.getElementById('newNearest').value.trim(),notes:document.getElementById('newNotes').value.trim(),lat:draftLatLng.lat,lng:draftLatLng.lng,accuracy:0,source:'map',createdAt:new Date().toISOString(),addedManually:true,...pointMetadata(type)};
      attachPointToNetwork(p);data.points.push(p);saveDataset(data);cancelAddMode();render();show('point',p);map.setView([p.lat,p.lng],Math.max(map.zoom,17));
    };
  }

  function normalizeImported(d){
    const base={...emptyDataset(),...d,points:d.points||[],routes:d.routes||[]};
    if(d.activeRoute?.points?.length){
      base.routes.push({...d.activeRoute,id:d.activeRoute.id||uid('route'),name:`${d.activeRoute.name||'Unfinished route'} (unfinished export)`});
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
      updatedAt:new Date().toISOString()
    };
  }

  function saveReview(){
    saveDataset(data);
    render();
  }

  function render(){
    addDatasetToMap(map,data,group,{
      draggable:drag,
      onPointDrag:(p,ll)=>{
        p.lat=ll.lat;
        p.lng=ll.lng;
        p.editedAt=new Date().toISOString();
        attachPointToNetwork(p);
        saveDataset(data);
        show('point',p);
      },
      onSelect:show
    });

    document.getElementById('summaryPoints').textContent=`${data.points.length} points`;
    document.getElementById('summaryRoutes').textContent=`${data.routes.length} routes`;
    document.getElementById('summaryDistance').textContent=
      `${feet(data.routes.reduce((n,r)=>n+routeDistance(r.points||[]),0))} feet traced`;
  }

  function fit(){
    const b=group.getBounds?.();
    if(b?.isValid())map.fitBounds(b.pad(.12));
  }

  function show(type,item){
    selected={type,item};

    if(type==='point'){
      details.innerHTML=`
        <h2>Edit point</h2>
        <div class="field">
          <label>Name</label>
          <input id="editName" value="${escapeHtml(item.name||'')}">
        </div>
        <div class="field">
          <label>Type</label>
          <select id="editType">${optionHtml(pointTypes,item.type)}</select>
        </div>
        <div class="field">
          <label>Nearest hole / area</label>
          <input id="editNearest" value="${escapeHtml(item.nearest||'')}">
        </div>
        <div class="field">
          <label>Directions, access, or restrictions</label>
          <textarea id="editNotes">${escapeHtml(item.notes||'')}</textarea>
        </div>
        <p class="small">
          Coordinates: ${Number(item.lat).toFixed(7)}, ${Number(item.lng).toFixed(7)}
          · Original GPS accuracy: ${Math.round(item.accuracy||0)} m
        </p>
        <div class="button-row">
          <button id="saveSelected" class="button primary">Save point edits</button>
          <button id="deleteSelected" class="button danger">Delete point</button>
        </div>
      `;

      document.getElementById('saveSelected').onclick=()=>{
        item.name=document.getElementById('editName').value.trim()||item.name;
        item.type=document.getElementById('editType').value;
        item.nearest=document.getElementById('editNearest').value.trim();
        item.notes=document.getElementById('editNotes').value.trim();
        Object.assign(item,pointMetadata(item.type));
        attachPointToNetwork(item);
        item.editedAt=new Date().toISOString();
        saveReview();
        show('point',item);
      };
    }else{
      details.innerHTML=`
        <h2>Edit route</h2>
        <div class="field">
          <label>Route name</label>
          <input id="editRouteName" value="${escapeHtml(item.name||'')}">
        </div>
        <div class="field">
          <label>Route display</label>
          <select id="editRouteType">
            <option value="path" ${!item.routeType||item.routeType==='path'?'selected':''}>Normal spectator path</option>
            <option value="street_crossing" ${item.routeType==='street_crossing'?'selected':''}>Active street crossing</option>
            <option value="connector" ${item.routeType==='connector'?'selected':''}>Short connector between scouted endpoints</option>
          </select>
        </div>
        <div class="field">
          <label>Route status</label>
          <select id="editRouteStatus">
            <option value="allowed" ${item.status==='allowed'?'selected':''}>Allowed spectator route</option>
            <option value="conditional" ${item.status==='conditional'?'selected':''}>Conditional / crossing may close</option>
            <option value="restricted" ${item.status==='restricted'?'selected':''}>Restricted - do not route spectators</option>
          </select>
        </div>
        <div class="field">
          <label>Route notes</label>
          <textarea id="editRouteNotes">${escapeHtml(item.notes||'')}</textarea>
        </div>
        <p>
          <strong>Samples:</strong> ${(item.points||[]).length}
          · <strong>Length:</strong> ${feet(routeDistance(item.points||[]))} ft
        </p>
        <div class="field">
          <label>Remove samples with accuracy worse than (meters)</label>
          <input id="accuracyLimit" type="number" value="25" min="1">
        </div>
        <div class="button-row">
          <button id="saveSelected" class="button primary">Save route edits</button>
          <button id="cleanRoute" class="button">Remove low-accuracy samples</button>
          <button id="trimStart" class="button">Remove first sample</button>
          <button id="trimEnd" class="button">Remove last sample</button>
          <button id="deleteSelected" class="button danger">Delete route</button>
        </div>
      `;

      document.getElementById('saveSelected').onclick=()=>{
        item.name=document.getElementById('editRouteName').value.trim()||item.name;
        const oldStatus=item.status;item.routeType=document.getElementById('editRouteType').value;
        item.status=document.getElementById('editRouteStatus').value;
        if(oldStatus!==item.status)data.networkNeedsRebuild=true;
        item.notes=document.getElementById('editRouteNotes').value.trim();
        item.editedAt=new Date().toISOString();
        saveReview();
        show('route',item);
      };

      document.getElementById('cleanRoute').onclick=()=>{
        const limit=Number(document.getElementById('accuracyLimit').value||25);
        item.points=(item.points||[]).filter(p=>(p.accuracy||0)<=limit);data.networkNeedsRebuild=true;
        item.editedAt=new Date().toISOString();
        saveReview();
        show('route',item);
      };

      document.getElementById('trimStart').onclick=()=>{
        if(item.points?.length)item.points.shift();data.networkNeedsRebuild=true;
        item.editedAt=new Date().toISOString();
        saveReview();
        show('route',item);
      };

      document.getElementById('trimEnd').onclick=()=>{
        if(item.points?.length)item.points.pop();data.networkNeedsRebuild=true;
        item.editedAt=new Date().toISOString();
        saveReview();
        show('route',item);
      };
    }

    document.getElementById('deleteSelected').onclick=()=>{
      if(!confirm(`Delete this ${type}?`))return;
      if(type==='point')data.points=data.points.filter(p=>p.id!==item.id);
      else{data.routes=data.routes.filter(r=>r.id!==item.id);data.networkNeedsRebuild=true;}
      selected=null;
      saveReview();
      details.innerHTML='<h2>Deleted</h2><p>The reviewed dataset has been updated.</p>';
    };
  }

  async function readFile(file){
    if(!file)throw new Error('No file selected');
    return await importJsonFile(file);
  }

  document.getElementById('fileInput').onchange=async e=>{
    try{
      const d=await readFile(e.target.files[0]);
      data=normalizeImported(d);
      saveDataset(data);
      render();
      fit();
      details.innerHTML=`<h2>Import complete</h2><p>${data.points.length} points and ${data.routes.length} routes loaded. Click a marker or route to edit it.</p>`;
    }catch(err){
      alert('Could not read that JSON file: '+err.message);
    }finally{
      e.target.value='';
    }
  };

  document.getElementById('mergeInput').onchange=async e=>{
    try{
      const d=normalizeImported(await readFile(e.target.files[0]));
      data=mergeDatasets(data,d);
      saveDataset(data);
      render();
      fit();
      details.innerHTML=`<h2>Merge complete</h2><p>The combined dataset now has ${data.points.length} points and ${data.routes.length} routes.</p>`;
    }catch(err){
      alert('Could not merge that JSON file: '+err.message);
    }finally{
      e.target.value='';
    }
  };

  document.getElementById('loadPublished').onclick=async()=>{
    try{
      data=normalizeImported(await fetch(`verified-data.json?ts=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}));
      saveDataset(data);render();fit();
      details.innerHTML=`<h2>Published data loaded</h2><p>${data.points.length} points and ${data.routes.length} routes loaded. Name, category, nearest-area, and note corrections can be exported without changing the path network.</p>`;
    }catch(err){alert('Could not load published data: '+err.message)}
  };

  document.getElementById('loadLocal').onclick=()=>{
    data=loadDataset();
    render();
    fit();
  };

  document.getElementById('fitAll').onclick=fit;

  document.getElementById('toggleDrag').onclick=e=>{
    drag=!drag;
    e.target.textContent=drag?'Disable point dragging':'Enable point dragging';
    render();
  };

  document.getElementById('addPoint').onclick=()=>{if(addMode){cancelAddMode();details.innerHTML='<h2>Add cancelled</h2><p>No location was added.</p>'}else startAddPoint()};
  map.on('click',e=>{
    if(!addMode)return;draftLatLng=e.latlng;draftGroup.clearLayers();draftGroup.addLayer(L.marker([draftLatLng.lat,draftLatLng.lng],{icon:pointIcon('hospitality')}));
    const line=document.getElementById('newCoordinates'),save=document.getElementById('saveNewPoint');if(line)line.textContent=`Selected coordinates: ${draftLatLng.lat.toFixed(7)}, ${draftLatLng.lng.toFixed(7)}. Tap elsewhere to move it.`;if(save)save.disabled=false;
  });

  document.getElementById('exportReview').onclick=()=>{
    downloadJson(
      {...data,reviewedAt:new Date().toISOString()},
      `tpc-colorado-reviewed-${Date.now()}.json`
    );
  };

  document.getElementById('exportPublic').onclick=()=>{
    if(!data.points.length&&!data.routes.length)return alert('There is no reviewed data to publish.');
    if(data.networkNeedsRebuild){
      const ok=confirm('A point or path geometry/access setting changed. The existing routing network may be stale. Export anyway? For reliable routing, rebuild the network before publishing.');
      if(!ok)return;
    }
    const publicData={...data,version:5,publishedAt:new Date().toISOString()};
    delete publicData.activeRoute;
    publicData.points=(data.points||[]).map(p=>{
      const q={...p};delete q.photoRef;delete q.accuracy;delete q.source;delete q.createdAt;delete q.editedAt;return q;
    });
    publicData.routes=(data.routes||[]).map(r=>{
      const q={...r};delete q.startedAt;delete q.updatedAt;delete q.endedAt;delete q.paused;return q;
    });
    downloadJson(publicData,'verified-data.json');
    document.getElementById('summaryEdited').textContent='Public file exported';
    details.innerHTML='<h2>Public file created</h2><p>Upload <strong>verified-data.json</strong> to the repository root. The public map will load it automatically after GitHub Pages deploys.</p>';
  };

  render();
});
