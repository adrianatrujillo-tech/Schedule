'use strict';
let shared=null, connected=false, noteDirty=false, noteRev=0, noteTimeout=null, noteSaving=false, editingTask=null, serial=Promise.resolve(), clockOffset=0, localTimer=null;
const statusEl=document.getElementById('syncStatus');
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function status(text){statusEl.textContent=text;document.getElementById('notesSaveLabel').textContent=noteDirty?'Sin guardar':connected?'Auto-guardado':'Sin conexión';}
function enqueue(fn){const result=serial.then(fn);serial=result.catch(()=>{});return result;}
function redraw(){renderDailyTasks();renderTasksBoard();renderCalendar();selectCalendarDate(selectedCalendarDate);}
function applyState(s){window.ScheduleIdentity='public-demo';window.ScheduleLegacyNote=s.notes||'';window.dispatchEvent(new Event('schedule-account'));

 shared=s;tasks=s.tasks;clockOffset=s.serverTime*1000-Date.now();localTimer=s.timer;currentTimerMode=s.timer.mode;pomodorosCompleted=s.count;
 if(!noteDirty){notesArea.value=s.notes;noteRev=s.notesRev;}
 redraw();paintTimer();updatePomodoroBadge();
 status(noteDirty?'📝 Tienes notas sin guardar.':'🌷 Modo demo · guardado en este navegador');
}
async function refresh(){try{const s=await demoStore('state');connected=true;applyState(s);}catch(e){if(e.code!==401){connected=false;status('No se pudo acceder al almacenamiento de este navegador.');}}}
async function mutation(path,method,data){
 try{const s=await demoStore(path,method,data);applyState(s);return true;}
 catch(e){status('⚠️ '+e.message);if(e.code===409){const msg=e.message;await refresh();status('⚠️ '+msg);alert(msg);}else if(e.code!==401)alert('No se guardó el cambio. '+e.message);return false;}
}
function needConnection(){if(!connected||!shared){status('Espera a que termine de abrirse la demostración.');return false;}return true;}
async function addQuickTask(){const input=document.getElementById('quickTaskInput');const title=input.value.trim();if(!title||!needConnection())return;await enqueue(async()=>{if(await mutation('tasks','POST',{title,category:'Personal',priority:'Importante',date:getTodayStr(),completed:false})){if(input.value.trim()===title)input.value='';playKawaiiChime();}});}
async function toggleTask(id){if(!needConnection())return;await enqueue(async()=>{const t=tasks.find(t=>t.id===id);if(t)await mutation('tasks/'+id,'PUT',{...t,completed:!t.completed});});}
async function deleteTask(id){if(!needConnection()||!confirm('¿Eliminar esta tarea?'))return;await enqueue(async()=>{const t=tasks.find(t=>t.id===id);if(t)await mutation('tasks/'+id,'DELETE',{rev:t.rev});});}
const originalOpen=openAddTaskModal;
openAddTaskModal=function(){originalOpen();document.getElementById('taskTitle').focus();};
const originalClose=closeAddTaskModal;
closeAddTaskModal=function(){originalClose();editingTask=null;};
function editTask(id){const t=tasks.find(t=>t.id===id);if(!t)return;editingTask={...t};document.getElementById('taskTitle').value=t.title;document.getElementById('taskCategory').value=t.category;document.getElementById('taskPriority').value=t.priority;document.getElementById('taskDueDate').value=t.date;openAddTaskModal();}
async function saveTask(e){e.preventDefault();if(!needConnection())return;const title=document.getElementById('taskTitle').value.trim();if(!title)return;const edit=editingTask;const data={title,category:document.getElementById('taskCategory').value,priority:document.getElementById('taskPriority').value,date:document.getElementById('taskDueDate').value||getTodayStr(),completed:edit?edit.completed:false};if(edit)data.rev=edit.rev;const btn=e.target.querySelector('[type=submit]');btn.disabled=true;try{await enqueue(async()=>{if(await mutation(edit?'tasks/'+edit.id:'tasks',edit?'PUT':'POST',data)){closeAddTaskModal();playKawaiiChime();}});}finally{btn.disabled=false;}}
// Notes preserve the local draft when another device changes the server copy.
notesArea.maxLength=20000;
const noteTools=document.createElement('div');noteTools.style.cssText='display:flex;gap:12px;font-size:12px;margin-top:8px;flex-wrap:wrap';
noteTools.innerHTML='<button type="button" id="saveNotes">Guardar notas</button><button type="button" id="loadNotes">Ver notas de este navegador</button>';
notesArea.after(noteTools);
notesArea.addEventListener('input',()=>{if(!noteDirty)noteRev=shared?shared.notesRev:0;noteDirty=true;status('📝 Guardando notas…');clearTimeout(noteTimeout);noteTimeout=setTimeout(()=>saveNotes(false),700);});
async function saveNotes(explicit){if(!noteDirty||noteSaving||!needConnection())return;noteSaving=true;clearTimeout(noteTimeout);const value=notesArea.value;const rev=noteRev;
 await enqueue(async()=>{try{const s=await demoStore('notes','PUT',{value,rev});if(notesArea.value===value)noteDirty=false;noteRev=s.notesRev;applyState(s);}catch(e){status('⚠️ Notas sin guardar: '+e.message);if(e.code===409){await refresh();status('⚠️ Las notas cambiaron en otra pestaña. Tu borrador sigue aquí. Pulsa Guardar notas para elegir.');if(explicit&&confirm('Otra pestaña cambió las notas. ¿Reemplazar las notas de este navegador por el borrador que ves aquí?')){noteRev=shared.notesRev;setTimeout(()=>saveNotes(false),0);}}else if(explicit)alert(e.message);}});noteSaving=false;}
document.getElementById('saveNotes').onclick=()=>saveNotes(true);
document.getElementById('loadNotes').onclick=()=>{if(noteDirty&&!confirm('¿Descartar tu borrador y mostrar las últimas notas recibidas de este navegador?'))return;noteDirty=false;if(shared){notesArea.value=shared.notes;noteRev=shared.notesRev;}enqueue(refresh);};
function loadQuickNotes(){}function saveState(){} // Persistence is handled by the local demo adapter.
function changeBg(bg){if(!['bg-clouds','bg-stripes','bg-cream-dots'].includes(bg))return;document.getElementById('appBody').className=`${bg} min-h-screen pb-12 transition-all duration-300`;localStorage.setItem('pastel_bg',bg);}
function paintTimer(){if(!localTimer)return;const t=localTimer;timerSeconds=Math.max(0,Math.ceil(t.deadline===null?t.seconds:t.deadline-(Date.now()+clockOffset)/1000));isTimerRunning=t.deadline!==null;updateTimerDisplay();document.getElementById('btnStartText').innerText=isTimerRunning?'Pausar':'Iniciar';document.getElementById('timerStatusText').innerText=t.mode==='study'?'¡Tiempo de enfocar tu mente con ternura! 🌸':'Descansa un poquito ☕';document.querySelectorAll('[id^="mode-"]').forEach(b=>{const active=b.id==='mode-'+({study:'study',shortBreak:'short',longBreak:'long'}[t.mode]);b.style.background=active?'#d8b4f8':'transparent';b.style.color=active?'white':'#7e6b8f';});}
function updateTimerDisplay(){document.getElementById('timerDisplay').textContent=`${String(Math.floor(timerSeconds/60)).padStart(2,'0')}:${String(timerSeconds%60).padStart(2,'0')}`;}
function updatePomodoroBadge(){document.getElementById('pomoCountBadge').textContent=`✨ ${pomodorosCompleted} pomodoros`;}
function timerAction(action,mode){if(!needConnection())return;enqueue(()=>mutation('timer','POST',{action,mode,rev:shared.timerRev}));}
function setTimerMode(mode){timerAction('mode',mode);}function toggleTimer(){timerAction(isTimerRunning?'pause':'start');}function startTimer(){timerAction('start');}function pauseTimer(){timerAction('pause');}function resetTimer(){timerAction('reset');}
function exportBackup(){if(!needConnection())return;const u=URL.createObjectURL(new Blob([JSON.stringify(readDemo(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='pastel-demo-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
document.getElementById('quickTaskInput').maxLength=300;document.getElementById('taskTitle').maxLength=300;
document.getElementById('quickTaskInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addQuickTask();}});
window.addEventListener('beforeunload',e=>{if(noteDirty){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)enqueue(refresh);});
let lastDay=getTodayStr();setInterval(()=>{paintTimer();if(getTodayStr()!==lastDay){lastDay=getTodayStr();renderHeaderDate();redraw();}},250);
let pollBusy=false;setInterval(async()=>{if(pollBusy||document.hidden)return;pollBusy=true;try{await enqueue(refresh);}finally{pollBusy=false;}},2000);
try{changeBg(localStorage.getItem('pastel_bg')||'bg-clouds');}catch{}
enqueue(refresh);
