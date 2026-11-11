import {url,key} from './config.js';
const form=document.querySelector('form'),result=document.querySelector('#result'),msg=document.querySelector('#msg');
function add(parent,tag,value){const node=document.createElement(tag);node.textContent=value;parent.append(node);return node}
form.onsubmit=async e=>{
 e.preventDefault();result.replaceChildren();
 try{
 if(!url||!key)throw Error('Configure o Supabase para acessar o painel.');
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.49.8');
 const db=createClient(url,key,{auth:{storageKey:'cic-equipe',persistSession:false}});
 const login=await db.auth.signInWithPassword({email:form.email.value,password:form.senha.value});if(login.error)throw login.error;
 const {data,error}=await db.rpc('cic_painel');if(error)throw error;
 const QR=(await import('https://esm.sh/qrcode@1.5.4')).default;
 form.hidden=true;form.reset();msg.textContent='';document.querySelector('#sair').hidden=false;
 document.querySelector('#sair').onclick=async()=>{await db.auth.signOut();location.reload()};
 const placas=add(result,'div','');placas.className='placas';
 for(const c of data.cafes){const card=add(placas,'article','');add(card,'small','CAFETERIA PARTICIPANTE');add(card,'h2',c.name);const link=new URL('./',location.href);link.searchParams.set('placa',c.token);const img=add(card,'img','');img.alt='QR de check-in';img.src=await QR.toDataURL(link.href);add(card,'p',c.combo||'');add(result,'p',c.name+' · Hoje: '+c.hoje+' · Total: '+c.total)}
 for(const [k,title] of [['primeiros','Primeiros participantes'],['conclusoes','Conclusões'],['origens','Origem dos visitantes']])if(k in data){add(result,'h2',title);const list=add(result,'ol','');for(const row of data[k]||[])add(list,'li',row.email||row.cidade+' / '+row.uf+' · '+row.participantes)}
 const print=document.querySelector('#print');print.hidden=false;print.onclick=()=>window.print()
 }catch(err){msg.textContent=err.message}
};
