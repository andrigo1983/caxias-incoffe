export async function renderMap(cafes,visitas){
 const {default:L}=await import('https://esm.sh/leaflet@1.9.4');
 const box=document.querySelector('#mapa');
 if(box.mapInstance)box.mapInstance.remove();
 const map=L.map(box).setView([-29.167,-51.179],13);box.mapInstance=map;
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
 const bounds=[];
 for(const c of cafes.filter(c=>c.lat!=null&&c.lng!=null)){const pos=[c.lat,c.lng];bounds.push(pos);const label=document.createElement('b');label.textContent=c.name;L.circleMarker(pos,{radius:8,color:visitas.some(v=>v.cafe===c.id&&v.valida)?'#33754d':'#79462b',fillOpacity:.85}).addTo(map).bindPopup(label)}
 if(bounds.length)map.fitBounds(bounds,{padding:[20,20],maxZoom:16});
}
