        // --- INITIAL DATA & APP STATE ---
        const DEFAULT_TASKS = [];

        let tasks = [];
        let currentFilter = 'all';
        let currentDate = new Date();
        let selectedCalendarDate = getTodayStr();

        // Pomodoro State
        let timerInterval = null;
        let timerSeconds = 25 * 60;
        let currentTimerMode = 'study'; // 'study', 'shortBreak', 'longBreak'
        let isTimerRunning = false;
        let pomodorosCompleted = 0;

        // Audio Synthesis Context for Gentle Kawaii Chimes
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx = null;

        function playKawaiiChime() {
            try {
                if (!audioCtx) audioCtx = new AudioContext();
                const now = audioCtx.currentTime;
                
                // Plays a pleasant 2-tone pastel chime
                const osc1 = audioCtx.createOscillator();
                const gain1 = audioCtx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(523.25, now); // C5
                osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
                gain1.gain.setValueAtTime(0.15, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                
                osc1.connect(gain1);
                gain1.connect(audioCtx.destination);
                osc1.start(now);
                osc1.stop(now + 0.4);
            } catch(e) {
                // Audio not allowed or unsupported
            }
        }

        // Helper date string (YYYY-MM-DD)
        function getTodayStr() {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        }

        // --- INIT & EVENT LISTENERS ---
        window.addEventListener('DOMContentLoaded', () => {
            renderHeaderDate();
            renderDailyTasks();
            renderTasksBoard();
            renderCalendar();

            updatePomodoroBadge();

            // Set default date picker to today
            document.getElementById('taskDueDate').value = getTodayStr();
        });

        // --- TAB NAVIGATION ---
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(btn => {
                btn.classList.remove('bg-white', 'shadow-sm', 'text-pastelTexto');
                btn.classList.add('text-pastelTextoMuted');
            });

            document.getElementById(tabId).classList.add('active');
            const activeBtn = document.getElementById(`btn-${tabId}`);
            if (activeBtn) {
                activeBtn.classList.add('bg-white', 'shadow-sm', 'text-pastelTexto');
                activeBtn.classList.remove('text-pastelTextoMuted');
            }
        }

        // --- DATE BADGE ---
        function renderHeaderDate() {
            const options = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateStr = new Date().toLocaleDateString('es-ES', options);
            document.getElementById('currentDateBadge').innerHTML = `🌸 ${dateStr}`;
        }

        // --- TAB 1: MI DÍA LOGIC ---
        function renderDailyTasks() {
            const container = document.getElementById('dailyTaskList');
            container.innerHTML = '';

            // Get top priority or daily tasks
            const dailyItems = tasks.filter(t => t.date === getTodayStr() || (!t.completed && t.date < getTodayStr()));

            if (dailyItems.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-pastelTextoMuted text-xs">
                        ✨ ¡No tienes pendientes principales para hoy! Agrega uno abajo.
                    </div>
                `;
                return;
            }

            dailyItems.forEach(task => {
                const item = document.createElement('div');
                item.className = `flex items-center justify-between p-2.5 rounded-xl bg-white/90 border border-pastelRosa/20 shadow-sm transition hover:bg-white`;
                
                item.innerHTML = `
                    <label class="flex items-center gap-3 cursor-pointer flex-1">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" class="kawaii-checkbox">
                        <span class="text-sm text-pastelTexto ${task.completed ? 'line-through opacity-50' : 'font-medium'}">
                            ${escapeHTML(task.title)}
                        </span>
                    </label>
                    <button aria-label="Editar tarea" onclick="editTask('${task.id}')" class="px-2">✎</button><button aria-label="Eliminar tarea" onclick="deleteTask('${task.id}')" class="task-delete">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg>
                    </button>
                `;
                container.appendChild(item);
            });
        }

        const notesArea = document.getElementById('quickNotesTextarea');
        // --- TAB 3: PENDIENTES BOARD LOGIC ---
        function setFilter(filter) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-pastelLila', 'border-pastelLilaDark/40');
                btn.classList.add('bg-white', 'text-pastelTextoMuted', 'border-gray-200');
            });
            const activeBtn = document.getElementById(`filter-${filter}`);
            if (activeBtn) {
                activeBtn.classList.remove('bg-white', 'text-pastelTextoMuted', 'border-gray-200');
                activeBtn.classList.add('bg-pastelLila', 'text-pastelTexto', 'border-pastelLilaDark/40');
            }
            renderTasksBoard();
        }

        function renderTasksBoard() {
            const container = document.getElementById('tasksCategoriesContainer');
            container.innerHTML = '';

            const categories = [
                { name: 'Estudio', icon: '📚', color: 'bg-pastelLila/40', border: 'border-pastelLilaDark/30' },
                { name: 'Personal', icon: '🌷', color: 'bg-pastelRosaLight/50', border: 'border-pastelRosa/30' },
                { name: 'Hogar', icon: '🏠', color: 'bg-pastelMenta/30', border: 'border-pastelMentaDark/30' },
                { name: 'Proyectos', icon: '🎨', color: 'bg-pastelCrema', border: 'border-pastelRosa/20' }
            ];

            categories.forEach(cat => {
                let catTasks = tasks.filter(t => t.category === cat.name);
                
                if (currentFilter === 'pending') catTasks = catTasks.filter(t => !t.completed);
                if (currentFilter === 'completed') catTasks = catTasks.filter(t => t.completed);

                const card = document.createElement('div');
                card.className = `${cat.color} p-4 rounded-2xl border-2 ${cat.border} shadow-sm`;

                let tasksListHtml = '';
                if (catTasks.length === 0) {
                    tasksListHtml = `<p class="text-xs text-pastelTextoMuted italic py-3 text-center">Sin tareas en esta sección ✨</p>`;
                } else {
                    catTasks.forEach(task => {
                        const priorityBadge = task.priority === 'Urgente' 
                            ? '<span class="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">Urgente</span>' 
                            : task.priority === 'Importante'
                            ? '<span class="text-[10px] bg-pastelRosa text-white font-bold px-1.5 py-0.5 rounded">Importante</span>'
                            : '';

                        tasksListHtml += `
                            <div class="bg-white/90 p-2.5 rounded-xl border border-gray-100 mb-2 flex items-center justify-between shadow-xs">
                                <label class="flex items-center gap-2.5 flex-1 cursor-pointer">
                                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" class="kawaii-checkbox">
                                    <span class="text-xs font-semibold text-pastelTexto ${task.completed ? 'line-through opacity-50' : ''}">
                                        ${escapeHTML(task.title)}
                                    </span>
                                </label>
                                <div class="flex items-center gap-2">
                                    ${priorityBadge}
                                    <button aria-label="Editar tarea" onclick="editTask('${task.id}')" class="px-2">✎</button><button aria-label="Eliminar tarea" onclick="deleteTask('${task.id}')" class="task-delete">
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                }

                card.innerHTML = `
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-fredoka text-base font-bold text-pastelTexto flex items-center gap-2">
                            <span>${cat.icon}</span> ${cat.name}
                        </h4>
                        <span class="text-xs bg-white px-2 py-0.5 rounded-full font-bold text-pastelTextoMuted border border-gray-200">
                            ${catTasks.length}
                        </span>
                    </div>
                    <div>${tasksListHtml}</div>
                `;

                container.appendChild(card);
            });
        }

        // --- MODAL FUNCTIONS ---
        function openAddTaskModal() { document.getElementById('taskDueDate').value ||= getTodayStr();
            document.getElementById('taskModal').classList.remove('hidden');
        }

        function openAddTaskModalWithDate() {
            document.getElementById('taskDueDate').value = selectedCalendarDate || getTodayStr();
            openAddTaskModal();
        }

        function closeAddTaskModal() {
            document.getElementById('taskModal').classList.add('hidden');
            document.getElementById('taskForm').reset(); document.getElementById('taskDueDate').value = getTodayStr();
        }

        // --- TAB 2: CALENDAR LOGIC ---
        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            document.getElementById('calendarMonthYear').innerText = `${monthNames[month]} ${year}`;

            const firstDayIndex = new Date(year, month, 1).getDay();
            const totalDays = new Date(year, month + 1, 0).getDate();

            const grid = document.getElementById('calendarGrid');
            grid.innerHTML = '';

            // Empty cells for previous month padding
            for (let i = 0; i < firstDayIndex; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'h-12 md:h-16 rounded-xl bg-gray-50/50 opacity-30';
                grid.appendChild(emptyCell);
            }

            // Days cells
            for (let day = 1; day <= totalDays; day++) {
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateString === getTodayStr();
                const dayTasks = tasks.filter(t => t.date === dateString);

                const cell = document.createElement('div');
                cell.onclick = () => selectCalendarDate(dateString);

                let cellClasses = 'h-12 md:h-16 rounded-2xl p-1 md:p-2 cursor-pointer transition flex flex-col justify-between border ';
                if (isToday) {
                    cellClasses += 'bg-pastelLilaDark text-white border-pastelLilaDark shadow-sm font-bold ';
                } else if (dateString === selectedCalendarDate) {
                    cellClasses += 'bg-pastelRosaLight border-pastelRosa text-pastelTexto font-bold ';
                } else {
                    cellClasses += 'bg-white hover:bg-pastelLila/30 border-gray-100 text-pastelTexto ';
                }

                cell.className = cellClasses;

                let taskDots = '';
                if (dayTasks.length > 0) {
                    taskDots = `<div class="flex gap-1 overflow-hidden justify-center">
                        ${dayTasks.slice(0, 3).map(() => `<span class="w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-pastelRosa'}"></span>`).join('')}
                    </div>`;
                }

                cell.innerHTML = `
                    <span class="text-xs md:text-sm ${isToday ? 'text-white' : 'text-pastelTexto'}">${day}</span>
                    ${taskDots}
                `;

                grid.appendChild(cell);
            }
        }

        function prevMonth() {
            currentDate.setDate(1); currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        }

        function nextMonth() {
            currentDate.setDate(1); currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        }

        function selectCalendarDate(dateStr) {
            selectedCalendarDate = dateStr;
            renderCalendar();

            const dateTitle = document.getElementById('selectedDateTitle');
            const tasksContainer = document.getElementById('selectedDateTasks');

            const dateObj = new Date(dateStr + 'T00:00:00');
            dateTitle.innerText = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

            const dayTasks = tasks.filter(t => t.date === dateStr);

            if (dayTasks.length === 0) {
                tasksContainer.innerHTML = '<span class="text-xs text-pastelTextoMuted">No hay tareas para este día. ¡Presiona "Agendar Tarea" para añadir una!</span>';
            } else {
                tasksContainer.innerHTML = dayTasks.map(t => `
                    <div class="inline-block bg-white px-3 py-1 rounded-xl text-xs border border-pastelRosa/30 mr-2 mb-2 font-medium text-pastelTexto">
                        ${t.completed ? '✅' : '🌸'} ${escapeHTML(t.title)}
                    </div>
                `).join('');
            }
        }

