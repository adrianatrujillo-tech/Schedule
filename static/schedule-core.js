(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ScheduleCore=factory();})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function uuid(){if(globalThis.crypto.randomUUID)return globalThis.crypto.randomUUID();const b=new Uint8Array(16);globalThis.crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
 const empty=()=>({version:2,notes:[],reminders:[],draft:{id:null,title:'',body:''},legacyImported:false,settings:{sound:'bell',volume:0.55,enabled:true}});
 function decode(raw){if(!raw)return empty();const s=JSON.parse(raw);if(s.version!==2||!Array.isArray(s.notes)||!Array.isArray(s.reminders)||!s.draft||!s.settings)throw Error('El archivo local no tiene el formato esperado. No se sobrescribió.');return s;}
 function note(data,now,id){const title=data.title.trim(),body=data.body.trim();if(!body)throw Error('Escribe algo para guardar tu nota.');if(body.length>20000||title.length>100)throw Error('La nota es demasiado larga.');return {id,title:title||body.split('\n')[0].slice(0,65),body,createdAt:data.createdAt||now,updatedAt:now};}
 function reminder(data,now,id){const title=data.title.trim(),at=Number(data.at);if(!title||title.length>200)throw Error('Escribe un título de hasta 200 caracteres.');if(!Number.isFinite(at)||at<=now)throw Error('Elige una fecha y hora futuras.');if(!['bell','melody','digital'].includes(data.sound)||!['none','daily'].includes(data.repeat))throw Error('Revisa el sonido y la repetición.');return {id,title,at,sound:data.sound,repeat:data.repeat,taskId:data.taskId||null,status:'pending',createdAt:data.createdAt||now};}
 const due=(s,now)=>s.reminders.filter(r=>r.status==='ringing'||(r.status==='pending'&&r.at<=now)).sort((a,b)=>a.at-b.at);
 function nextDaily(at,now){const d=new Date(at);let n=0;do{d.setDate(d.getDate()+1);n++;}while(d.getTime()<=now&&n<10000);return d.getTime();}
 function finish(s,id,now){const r=s.reminders.find(r=>r.id===id);if(!r)return;if(r.repeat==='daily'){r.at=nextDaily(r.at,now);r.status='pending';}else{r.status='done';r.completedAt=now;}}
 function snooze(s,id,now){const r=s.reminders.find(r=>r.id===id);if(r){r.at=now+5*60000;r.status='pending';}}
 return {uuid,empty,decode,note,reminder,due,nextDaily,finish,snooze};
});
