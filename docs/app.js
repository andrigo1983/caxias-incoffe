import {url,key} from './config.js';
const el=id=>document.getElementById(id), status=msg=>el('status').textContent=msg;
let db,user,cafes=[],visitas=[],perfil;
const token=new URL(location.href).searchParams.get('placa');
if(token && /^[0-9a-f-]{36}$/i.test(token)) sessionStorage.setItem('placa',token);
function run(action){return async e=>{try{await action(e)}catch(err){status(err.message||String(err))}}}
async function data(query){const {data,error}=await query;if(error)throw error;return data}
function draw(){
 const lista=el('lista');lista.replaceChildren();
 for(const c of cafes.filter(c=>(c.name+' '+(c.address||'')).toLocaleLowerCase().includes(el('busca').value.toLocaleLowerCase()))){
 const card=document.createElement('article');lista.append(card);
 for(const [tag,value] of [['h3',c.name],['strong',c.combo],['p',c.description],['p',c.address],['p',c.hours],['b',visitas.some(v=>v.cafe===c.id&&v.valida)?'✓ Visitada':'']]){
 if(value){const node=document.createElement(tag);node.textContent=value;card.append(node)}}
 if(c.lat!=null&&c.lng!=null){for(const [label,href] of [['Google Maps','https://www.google.com/maps/dir/?api=1&destination='],['Waze','https://www.waze.com/ul?ll=']]){
 const a=document.createElement('a');a.textContent=label;a.href=href+c.lat+','+c.lng+(label==='Waze'?'&navigate=yes':'');card.append(a)}}
 }
}
async function refresh(){
 cafes=await data(db.from('cic_cafes').select('*').order('name'));draw();
 user=(await db.auth.getSession()).data.session?.user;
 if(!user){mapa();return}
 perfil=await data(db.from('cic_perfis').select('*').eq('id',user.id).maybeSingle());
 visitas=await data(db.from('cic_visitas').select('*'));draw();
 el('login').hidden=true;el('acoes').hidden=el('perfil').hidden=false;
 const f=el('perfil').elements;
 if(perfil){f.cidade.value=perfil.cidade;f.uf.value=perfil.uf;f.aceite.checked=true;f.novidades.checked=perfil.novidades}
 el('progresso').textContent=visitas.filter(v=>v.valida&&cafes.some(c=>c.id===v.cafe)).length+' de '+cafes.length+' cafeterias visitadas';
 mapa();el('check').hidden=!sessionStorage.getItem('placa')||!perfil;
}
el('busca').oninput=draw;
el('login').onclick=run(async()=>{if(!db)throw Error('A organização ainda precisa configurar o Supabase.');await data(db.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}}))});
el('perfil').onsubmit=run(async e=>{e.preventDefault();const f=e.target.elements;
 const fields={cidade:f.cidade.value.trim(),uf:f.uf.value,novidades:f.novidades.checked};
 await data(perfil?db.from('cic_perfis').update(fields).eq('id',user.id):db.from('cic_perfis').insert({...fields,id:user.id,aceite:'1.2'}));await refresh();status('Cadastro salvo.')});
el('check').onclick=run(async()=>{const {coords}=await new Promise((ok,no)=>navigator.geolocation.getCurrentPosition(ok,no,{enableHighAccuracy:true,timeout:20000}));
 const msg=await data(db.rpc('cic_checkin',{placa:sessionStorage.getItem('placa'),latitude:coords.latitude,longitude:coords.longitude,precisao:coords.accuracy}));status(msg);if(msg==='Check-in confirmado!')sessionStorage.removeItem('placa');await refresh();el('status').scrollIntoView()});
el('exportar').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({email:user.email,perfil,visitas},null,2)],{type:'application/json'}));a.download='passaporte.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
el('sair').onclick=run(async()=>{await data(db.auth.signOut());location.replace(location.pathname)});
el('excluir').onclick=run(async()=>{if(confirm('Excluir definitivamente a conta e todas as visitas?')){await data(db.rpc('cic_excluir'));await db.auth.signOut({scope:'local'});location.replace(location.pathname)}});
if(!url||!key)status('Catálogo aguardando configuração do Supabase.');
else await run(async()=>{const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.49.8');db=createClient(url,key);await refresh()})();
async function mapa(){try{const {renderMap}=await import('./mapa.js');await renderMap(cafes,visitas)}catch{el('mapa').textContent='Mapa indisponível. Use as rotas da lista.'}}
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
