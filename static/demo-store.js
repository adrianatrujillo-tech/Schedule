// Frontend-only demo. No backend, account, database server or remote requests.
const DEMO_KEY='pastel_planner_public_demo_v1';
function demoToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function readDemo(){const saved=localStorage.getItem(DEMO_KEY);if(!saved)return {tasks:[],notes:'',notesRev:0,timer:{mode:'study',seconds:1500,deadline:null},timerRev:0,counts:{}};return JSON.parse(saved);}
async function demoStore(path,method='GET',data){
 const s=readDemo();const t=s.timer;
 if(t.deadline!==null&&t.deadline<=Date.now()/1000){if(t.mode==='study'){const d=demoToday();s.counts[d]=(s.counts[d]||0)+1;}t.seconds=0;t.deadline=null;s.timerRev++;}
 const conflict=()=>{const e=new Error('Este elemento cambió en otra pestaña. Revisa la nueva versión.');e.code=409;throw e;};
 if(path==='tasks'&&method==='POST')s.tasks.unshift({...data,id:(globalThis.ScheduleCore?ScheduleCore.uuid():crypto.randomUUID()),rev:0});
 else if(path.startsWith('tasks/')){const id=path.slice(6),i=s.tasks.findIndex(x=>x.id===id);if(i<0||s.tasks[i].rev!==data.rev)conflict();if(method==='DELETE')s.tasks.splice(i,1);else s.tasks[i]={...data,id,rev:data.rev+1};}
 else if(path==='notes'&&method==='PUT'){if(data.rev!==s.notesRev)conflict();s.notes=data.value;s.notesRev++;}
 else if(path==='timer'&&method==='POST'){
  if(data.rev!==s.timerRev)conflict();const durations={study:1500,shortBreak:300,longBreak:900};
  if(data.action==='mode')s.timer={mode:data.mode,seconds:durations[data.mode],deadline:null};
  else if(data.action==='reset'){t.seconds=durations[t.mode];t.deadline=null;}
  else if(data.action==='pause'&&t.deadline!==null){t.seconds=Math.max(0,t.deadline-Date.now()/1000);t.deadline=null;}
  else if(data.action==='start'&&t.deadline===null){if(t.seconds<=0)t.seconds=durations[t.mode];t.deadline=Date.now()/1000+t.seconds;}
  s.timerRev++;
 }
 localStorage.setItem(DEMO_KEY,JSON.stringify(s));
 return {...s,count:s.counts[demoToday()]||0,serverTime:Date.now()/1000};
}
