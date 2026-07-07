
(() => {
  const viewport=document.getElementById("mapViewport"),stage=document.getElementById("mapStage"),image=document.getElementById("courseMap"),markerLayer=document.getElementById("markerLayer"),resultCard=document.getElementById("resultCard"),dialog=document.getElementById("markerDialog"),toolsPanel=document.getElementById("toolsPanel"),you=document.getElementById("youAreHere");
  let scale=1,minScale=.35,maxScale=4,translateX=0,translateY=0,dragging=false,startX=0,startY=0,startTX=0,startTY=0,selected=null;
  const labels={restroom:"Restroom",firstaid:"First aid",concession:"Concession",gate:"Admission gate",volunteer:"Volunteer location",hole:"Golf hole"};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
  function apply(){stage.style.transform=`translate(${translateX}px,${translateY}px) scale(${scale})`}
  function fit(){
    const w=image.clientWidth||1400,h=w*MAP_DATA.image.height/MAP_DATA.image.width;
    stage.style.width=w+"px";stage.style.height=h+"px";markerLayer.style.width=w+"px";markerLayer.style.height=h+"px";
    scale=Math.min(viewport.clientWidth/w,viewport.clientHeight/h);minScale=Math.max(.2,scale*.75);maxScale=Math.max(3,scale*6);
    translateX=(viewport.clientWidth-w*scale)/2;translateY=(viewport.clientHeight-h*scale)/2;apply()
  }
  function marker(item){
    const b=document.createElement("button");b.className=`marker ${item.category} ${item.verified?"":"approx"}`;b.style.left=item.x+"%";b.style.top=item.y+"%";b.textContent=item.icon||"•";b.dataset.category=item.category;b.setAttribute("aria-label",item.name);
    b.onclick=e=>{e.stopPropagation();show(item)};markerLayer.appendChild(b)
  }
  function render(){markerLayer.innerHTML="";MAP_DATA.destinations.forEach(marker)}
  function show(item){
    selected=item;document.getElementById("dialogTitle").textContent=item.name;document.getElementById("dialogType").textContent=labels[item.category]||item.category;document.getElementById("dialogNotes").textContent=item.notes||"No notes added yet.";
    document.getElementById("dialogStatus").textContent=item.verified?"Onsite location verified.":"Approximate location—verify onsite before directing spectators.";
    dialog.showModal?dialog.showModal():dialog.setAttribute("open","");
    resultCard.innerHTML=`<h2>${esc(item.name)}</h2><p>${esc(item.notes||"")}</p><p><strong>Status:</strong> ${item.verified?"Verified":"Needs onsite verification"}</p>`
  }
  function filter(cat){
    document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.category===cat));
    document.querySelectorAll(".marker").forEach(m=>m.classList.toggle("hidden",cat!=="all"&&m.dataset.category!==cat));
    const list=MAP_DATA.destinations.filter(d=>cat==="all"||d.category===cat);
    resultCard.innerHTML=`<h2>${cat==="all"?"All destinations":(labels[cat]||cat)+" locations"}</h2><p>${list.length} marker${list.length===1?"":"s"} shown. Tap a marker for details.</p>`;
    const u=new URL(location.href);cat==="all"?u.searchParams.delete("category"):u.searchParams.set("category",cat);history.replaceState(null,"",u)
  }
  function zoom(f,cx=viewport.clientWidth/2,cy=viewport.clientHeight/2){
    const ns=Math.max(minScale,Math.min(maxScale,scale*f)),mx=(cx-translateX)/scale,my=(cy-translateY)/scale;
    translateX=cx-mx*ns;translateY=cy-my*ns;scale=ns;apply()
  }
  function center(item){
    const px=stage.clientWidth*item.x/100,py=stage.clientHeight*item.y/100;scale=Math.max(scale,Math.min(maxScale,1.45));translateX=viewport.clientWidth/2-px*scale;translateY=viewport.clientHeight/2-py*scale;apply()
  }
  viewport.onpointerdown=e=>{if(e.target.closest(".marker")||e.target.closest(".zoom-controls"))return;dragging=true;viewport.setPointerCapture(e.pointerId);startX=e.clientX;startY=e.clientY;startTX=translateX;startTY=translateY};
  viewport.onpointermove=e=>{if(!dragging)return;translateX=startTX+(e.clientX-startX);translateY=startTY+(e.clientY-startY);apply()};
  viewport.onpointerup=viewport.onpointercancel=()=>dragging=false;
  viewport.addEventListener("wheel",e=>{e.preventDefault();const r=viewport.getBoundingClientRect();zoom(e.deltaY<0?1.14:.88,e.clientX-r.left,e.clientY-r.top)},{passive:false});
  document.getElementById("zoomIn").onclick=()=>zoom(1.25);document.getElementById("zoomOut").onclick=()=>zoom(.8);document.getElementById("resetView").onclick=fit;
  document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>filter(b.dataset.category));
  document.getElementById("menuBtn").onclick=()=>toolsPanel.classList.remove("hidden");document.getElementById("closeTools").onclick=()=>toolsPanel.classList.add("hidden");
  document.getElementById("closeDialog").onclick=()=>dialog.close?dialog.close():dialog.removeAttribute("open");
  document.getElementById("centerMarkerBtn").onclick=()=>{if(selected)center(selected);if(dialog.close)dialog.close()};
  document.getElementById("shareBtn").onclick=async()=>{try{navigator.share?await navigator.share({title:document.title,url:location.href}):await navigator.clipboard.writeText(location.href)}catch(_){}};
  document.getElementById("copyBtn").onclick=async()=>{await navigator.clipboard.writeText(location.href);alert("Map link copied.")};
  document.getElementById("locationBtn").onclick=()=>{
    if(!navigator.geolocation)return alert("This phone does not provide browser location.");
    if(!MAP_DATA.calibration.anchors||MAP_DATA.calibration.anchors.length<3)return alert("The app is ready for GPS, but the tournament image has not been calibrated yet. Use the Field Scout page to capture at least three widely separated known locations.");
    navigator.geolocation.getCurrentPosition(pos=>{const p=gpsToMap(pos.coords.latitude,pos.coords.longitude);if(!p)return alert("Unable to convert this location.");you.style.left=p.x+"%";you.style.top=p.y+"%";you.classList.remove("hidden");center(p)},err=>alert("Location unavailable: "+err.message),{enableHighAccuracy:true,timeout:15000})
  };
  function gpsToMap(lat,lng){
    const a=MAP_DATA.calibration.anchors;if(!a||a.length<3)return null;
    const A=[[a[0].lng,a[0].lat,1],[a[1].lng,a[1].lat,1],[a[2].lng,a[2].lat,1]],bx=[a[0].x,a[1].x,a[2].x],by=[a[0].y,a[1].y,a[2].y],cx=solve(A,bx),cy=solve(A,by);
    return cx&&cy?{x:cx[0]*lng+cx[1]*lat+cx[2],y:cy[0]*lng+cy[1]*lat+cy[2]}:null
  }
  function solve(A,b){const m=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<3;c++){let p=c;for(let r=c+1;r<3;r++)if(Math.abs(m[r][c])>Math.abs(m[p][c]))p=r;[m[c],m[p]]=[m[p],m[c]];if(Math.abs(m[c][c])<1e-12)return null;const d=m[c][c];for(let j=c;j<4;j++)m[c][j]/=d;for(let r=0;r<3;r++)if(r!==c){const f=m[r][c];for(let j=c;j<4;j++)m[r][j]-=f*m[c][j]}}return[m[0][3],m[1][3],m[2][3]]}
  image.onload=()=>{render();fit();const c=new URL(location.href).searchParams.get("category")||"all";filter(["all","restroom","firstaid","concession","gate","volunteer","hole"].includes(c)?c:"all")};
  window.onresize=fit;if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js").catch(()=>{})
})();
