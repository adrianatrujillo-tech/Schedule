const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const crypto=require('node:crypto');
(async()=>{
 const saved=new Map();const env={localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},crypto,Date};
 const ctx=vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/demo-store.js'),'utf8'),ctx);
 const store=ctx.demoStore;
 let s=await store('state');assert.equal(s.tasks.length,0);
 s=await store('tasks','POST',{title:'Prueba',category:'Estudio',priority:'Normal',date:'2026-10-26',completed:false});const task=s.tasks[0];
 s=await store('tasks/'+task.id,'PUT',{...task,completed:true});assert.equal(s.tasks[0].completed,true);
 await assert.rejects(()=>store('tasks/'+task.id,'PUT',task),e=>e.code===409);
 s=await store('notes','PUT',{value:'Nota de prueba',rev:0});assert.equal(s.notes,'Nota de prueba');
 const reopened=vm.createContext({...env});vm.runInContext(fs.readFileSync(path.join(__dirname,'../static/demo-store.js'),'utf8'),reopened);
 assert.equal((await reopened.demoStore('state')).notes,'Nota de prueba');
 s=await store('timer','POST',{action:'start',rev:s.timerRev});assert(s.timer.deadline>Date.now()/1000);
 s=await store('timer','POST',{action:'pause',rev:s.timerRev});assert.equal(s.timer.deadline,null);
 s=await store('tasks/'+s.tasks[0].id,'DELETE',{rev:s.tasks[0].rev});assert.equal(s.tasks.length,0);
 assert.equal(saved.size,1);assert(saved.has('pastel_planner_public_demo_v1'));
 console.log('PASS: tareas, edicion, conflictos, notas, persistencia, pomodoro y aislamiento en una clave propia; sin acceso de red.');
})().catch(e=>{console.error(e);process.exitCode=1;});
