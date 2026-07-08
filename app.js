document.addEventListener('DOMContentLoaded',async()=>{
  let verified={points:[],routes:[],network:{nodes:[],edges:[]},mapCenter:[40.3384,-105.1099],defaultZoom:15,displayDefaults:{amenities:true,places:true,paths:true,holes:false,junctions:false,staff:false}};
  try{
    verified=await fetch(`verified-data.json?ts=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()});
  }catch(err){console.error(err)}

  const map=L.map('navigateMap').setView(verified.mapCenter||[40.3384,-105.1099],verified.defaultZoom||15);
  const base=baseLayers();base.osm.addTo(map);L.control.layers({'Street map':base.osm,'Satellite':base.imagery},{}).addTo(map);
  const dataGroup=L.featureGroup().addTo(map),routeGroup=L.featureGroup().addTo(map),locationGroup=L.featureGroup().addTo(map);
  const status=document.getElementById('navigateStatus'),locateButton=document.getElementById('locateMe'),followButton=document.getElementById('followMode');
  const filters={...verified.displayDefaults};
  let lastPosition=null,previousPosition=null,watchId=null,deviceHeading=null,smoothedHeading=null,followMode='north',pendingAction=null,activeDirections=false;

  const adjacency=(verified.network?.nodes||[]).map(()=>[]);
  (verified.network?.edges||[]).forEach(([a,b,w])=>{if(adjacency[a]&&adjacency[b]){adjacency[a].push([b,w]);adjacency[b].push([a,w])}});

  function setStatus(title,text,html=false){status.innerHTML=`<h2>${escapeHtml(title)}</h2><p>${html?text:escapeHtml(text)}</p>`}
  function pointVisible(p){return filters[p.group||'amenities']!==false}
  function renderData(){addDatasetToMap(map,verified,dataGroup,{pointFilter:pointVisible,routeFilter:()=>filters.paths!==false})}
  renderData();

  const compass=document.createElement('div');compass.className='bearing-indicator';compass.innerHTML='<span>▲</span><small>N</small>';document.getElementById('navigateMap').appendChild(compass);
  map.on('bearingchange',e=>{compass.style.transform=`rotate(${e.bearing}deg)`});
  map.on('dragstart',()=>{if(lastPosition){followMode='free';map.setBearing(0);updateFollowButton()}});

  function updateFollowButton(){followButton.textContent=followMode==='north'?'Follow: North up':followMode==='heading'?'Follow: Heading up':'Follow: Off'}
  updateFollowButton();

  function friendlyLocationError(err){
    if(err?.code===1)return 'Location permission is blocked. Allow precise Location for this site in browser settings, reload, and try again.';
    if(err?.code===2)return 'Your phone could not determine its location. Move outdoors and try again.';
    if(err?.code===3)return 'Location timed out. Confirm Location Services are on and try again outdoors.';
    return err?.message||'Unknown location error.';
  }

  function currentHeading(pos){
    const current={lat:pos.coords.latitude,lng:pos.coords.longitude};
    let h=Number.isFinite(pos.coords.heading)?pos.coords.heading:null;
    if(h===null&&lastPosition&&haversine(lastPosition,current)>2.5)h=bearingBetween(lastPosition,current);
    if(h===null&&Number.isFinite(deviceHeading))h=deviceHeading;
    if(Number.isFinite(h))smoothedHeading=circularBlend(smoothedHeading,h,.3);
    return smoothedHeading;
  }

  function drawLocation(pos,heading){
    locationGroup.clearLayers();
    const screenHeading=followMode==='heading'?0:(Number.isFinite(heading)?heading:0);
    const arrow=Number.isFinite(heading)?`<div class="location-arrow" style="transform:rotate(${screenHeading}deg)">▲</div>`:'';
    const marker=L.marker([pos.lat,pos.lng],{icon:L.divIcon({className:'',html:`<div class="location-pin">${arrow}<div class="location-core"></div></div>`,iconSize:[38,38],iconAnchor:[19,19]})}).bindPopup(`You are here<br><small>Estimated accuracy ${Math.round(pos.accuracy)} m</small>`);
    locationGroup.addLayer(L.circle([pos.lat,pos.lng],{radius:pos.accuracy,color:'#1769e0',fillOpacity:.07,weight:1}));locationGroup.addLayer(marker);
  }

  function showPosition(position){
    const p={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy,speed:position.coords.speed,heading:position.coords.heading};
    const heading=currentHeading(position);previousPosition=lastPosition;lastPosition=p;drawLocation(p,heading);
    if(followMode==='heading'&&Number.isFinite(heading)){map.setBearing(heading);map.setView([p.lat,p.lng],Math.max(map.zoom,17))}
    else if(followMode==='north'){map.setBearing(0);map.setView([p.lat,p.lng],Math.max(map.zoom,17))}
    locateButton.textContent='Center on me';
    if(!activeDirections)setStatus('Location found',`Estimated accuracy: ${Math.round(p.accuracy)} meters. Choose a destination for a path-based route.`);
    if(pendingAction){const action=pendingAction;pendingAction=null;setTimeout(action,100)}
  }

  function startWatch(){
    if(!window.isSecureContext)return setStatus('Location unavailable','Open the secure address beginning with https://.');
    if(!navigator.geolocation)return setStatus('Location unavailable','This browser does not provide GPS location.');
    if(watchId!==null)return;
    setStatus('Finding your location','Approve precise Location access when your phone asks.');
    watchId=navigator.geolocation.watchPosition(showPosition,err=>setStatus('Location unavailable',friendlyLocationError(err)),{enableHighAccuracy:true,timeout:30000,maximumAge:2000});
  }

  function centerOnUser(){
    followMode='north';map.setBearing(0);updateFollowButton();startWatch();
    if(lastPosition)map.setView([lastPosition.lat,lastPosition.lng],Math.max(map.zoom,17));
  }
  locateButton.onclick=centerOnUser;

  async function enableDeviceHeading(){
    try{
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function')await DeviceOrientationEvent.requestPermission();
    }catch(_){ }
  }
  function orientationHandler(e){
    let h=Number.isFinite(e.webkitCompassHeading)?e.webkitCompassHeading:(Number.isFinite(e.alpha)?(360-e.alpha)%360:null);
    if(Number.isFinite(h)){deviceHeading=h;smoothedHeading=circularBlend(smoothedHeading,h,.18);if(followMode==='heading'&&lastPosition){map.setBearing(smoothedHeading);drawLocation(lastPosition,smoothedHeading)}}
  }
  window.addEventListener('deviceorientationabsolute',orientationHandler,true);window.addEventListener('deviceorientation',orientationHandler,true);

  followButton.onclick=async()=>{
    if(followMode==='north'){followMode='heading';await enableDeviceHeading();startWatch();if(Number.isFinite(smoothedHeading))map.setBearing(smoothedHeading)}
    else if(followMode==='heading'){followMode='free';map.setBearing(0)}
    else{followMode='north';map.setBearing(0);startWatch();if(lastPosition)map.setView([lastPosition.lat,lastPosition.lng],Math.max(map.zoom,17))}
    updateFollowButton();if(lastPosition)drawLocation(lastPosition,smoothedHeading);
  };

  function nearestNetworkNode(ll){
    let best=-1,bestD=Infinity;(verified.network?.nodes||[]).forEach((n,i)=>{const d=haversine(ll,{lat:n[0],lng:n[1]});if(d<bestD){bestD=d;best=i}});return{node:best,distance:bestD};
  }
  function dijkstra(start){
    const n=adjacency.length,dist=new Float64Array(n),prev=new Int32Array(n),used=new Uint8Array(n);for(let i=0;i<n;i++){dist[i]=Infinity;prev[i]=-1}dist[start]=0;
    const heap=[[0,start]];
    function push(item){heap.push(item);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=item[0])break;heap[i]=heap[p];i=p}heap[i]=item}
    function pop(){const root=heap[0],last=heap.pop();if(heap.length){let i=0;heap[0]=last;while(true){let l=i*2+1,r=l+1,s=i;if(l<heap.length&&heap[l][0]<heap[s][0])s=l;if(r<heap.length&&heap[r][0]<heap[s][0])s=r;if(s===i)break;[heap[i],heap[s]]=[heap[s],heap[i]];i=s}}return root}
    while(heap.length){const[d,u]=pop();if(used[u])continue;used[u]=1;for(const[v,w]of adjacency[u]){const nd=d+w;if(nd<dist[v]){dist[v]=nd;prev[v]=u;push([nd,v])}}}return{dist,prev};
  }
  function reconstruct(prev,start,end){const out=[];let u=end,guard=0;while(u!==-1&&guard++<prev.length+2){out.push(u);if(u===start)break;u=prev[u]}return out.reverse()}

  function routeToCandidates(candidates,title){
    if(!lastPosition){pendingAction=()=>routeToCandidates(candidates,title);centerOnUser();return}
    if(!adjacency.length)return setStatus('Routing unavailable','The published path network is missing.');
    const start=nearestNetworkNode(lastPosition),result=dijkstra(start.node);
    const reachable=candidates.filter(p=>Number.isInteger(p.networkNode)&&Number.isFinite(result.dist[p.networkNode]));
    if(!reachable.length)return setStatus(title,'No reachable published destinations were found in this category.');
    const chosen=reachable.reduce((a,b)=>(result.dist[b.networkNode]+(b.networkAccessMeters||0))<(result.dist[a.networkNode]+(a.networkAccessMeters||0))?b:a);
    const ids=reconstruct(result.prev,start.node,chosen.networkNode),coords=[{lat:lastPosition.lat,lng:lastPosition.lng},...ids.map(i=>({lat:verified.network.nodes[i][0],lng:verified.network.nodes[i][1]})),{lat:chosen.lat,lng:chosen.lng}];
    routeGroup.clearLayers();routeGroup.addLayer(L.polyline(coords,{color:'#168447',weight:8}).bindPopup(`<strong>Route to ${escapeHtml(chosen.name)}</strong>`));
    routeGroup.addLayer(L.marker([chosen.lat,chosen.lng],{icon:pointIcon(chosen.type,chosen.type==='hole'?(chosen.holeNumber||'H'):'',chosen.iconType)}).bindPopup(markerPopup(chosen)));
    const mapped=result.dist[chosen.networkNode],access=start.distance+(chosen.networkAccessMeters||0),total=mapped+access;activeDirections=true;
    const accessNote=access>25?` About ${feet(access)} ft of the route is an approximate connection between your position/destination and the mapped path.`:'';
    setStatus(chosen.name,`Approximate walking distance: <strong>${feet(total).toLocaleString()} ft</strong> along the connected spectator-path network.${escapeHtml(accessNote)} Follow signs and staff if access changes.`,true);
    const b=L.latLngBounds(coords);if(b.isValid())map.fitBounds(b.pad(.14));
  }

  function categoryCandidates(category){return(verified.points||[]).filter(p=>category==='restroom'?(p.type==='restroom'||p.type==='accessible_restroom'):p.type===category)}
  document.querySelectorAll('[data-category]').forEach(btn=>btn.onclick=()=>routeToCandidates(categoryCandidates(btn.dataset.category),btn.textContent));

  const holes=[...new Set((verified.points||[]).filter(p=>p.holeNumber).map(p=>p.holeNumber))].sort((a,b)=>a-b),holeSelect=document.getElementById('holeSelect');
  holes.forEach(h=>{const o=document.createElement('option');o.value=h;o.textContent=`Hole ${h}`;holeSelect.appendChild(o)});
  document.getElementById('routeHole').onclick=()=>{const h=Number(holeSelect.value);if(!h)return setStatus('Choose a hole','Select a hole number first.');routeToCandidates((verified.points||[]).filter(p=>p.holeNumber===h),`Hole ${h}`)};

  document.getElementById('clearRoute').onclick=()=>{routeGroup.clearLayers();activeDirections=false;setStatus('Route cleared','Choose another destination or explore the map.');if(lastPosition&&followMode!=='free')map.setView([lastPosition.lat,lastPosition.lng],Math.max(map.zoom,17))};

  const filterPanel=document.getElementById('filterPanel');document.getElementById('filterButton').onclick=()=>filterPanel.classList.toggle('hidden');
  filterPanel.querySelectorAll('input[data-filter]').forEach(cb=>{cb.checked=filters[cb.dataset.filter]!==false;cb.onchange=()=>{filters[cb.dataset.filter]=cb.checked;renderData()}});

  document.getElementById('showAllMapped').onclick=()=>{const b=dataGroup.getBounds?.();if(b?.isValid())map.fitBounds(b.pad(.1));document.getElementById('toolsPanel').classList.add('hidden');setStatus('Published course data',`${verified.points.length} locations and ${verified.routes.length} path segments are available. Hole and junction markers can be shown with Filters.`)};

  document.querySelectorAll('.view-tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.view-tab').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(btn.dataset.view+'View').classList.add('active');if(btn.dataset.view==='navigate')setTimeout(()=>map.invalidateSize(),60)});
  const panel=document.getElementById('toolsPanel');document.getElementById('menuButton').onclick=()=>panel.classList.remove('hidden');document.getElementById('closeTools').onclick=()=>panel.classList.add('hidden');
  document.getElementById('shareApp').onclick=async()=>{try{navigator.share?await navigator.share({title:document.title,url:location.href}):await navigator.clipboard.writeText(location.href)}catch(_){}};

  if(verified.points.length||verified.routes.length)setStatus('Published course map ready',`${verified.points.length} mapped locations and ${verified.routes.length} path segments load automatically for every visitor. Hole references are hidden by default; use Filters to show them.`);
  else setStatus('No published course data','The shared verified-data.json file is empty or could not be loaded.');
});
