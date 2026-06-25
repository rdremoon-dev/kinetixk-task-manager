// DOM Elements
const addTaskTrigger = document.getElementById('addTaskTrigger');
const taskModal = document.getElementById('taskModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const taskInput = document.getElementById('taskInput');
const taskDesc = document.getElementById('taskDesc');

// Dropdowns & Inputs
const dateBtn = document.getElementById('dateBtn');
const dateDropdown = document.getElementById('dateDropdown');
const dateText = document.getElementById('dateText');
const taskTimeInput = document.getElementById('taskTimeInput');
const taskRepeatSelect = document.getElementById('taskRepeatSelect');

const priorityBtn = document.getElementById('priorityBtn');
const priorityDropdown = document.getElementById('priorityDropdown');

const attachmentBtn = document.getElementById('attachmentBtn');
const fileInput = document.getElementById('fileInput');
const attachmentText = document.getElementById('attachmentText');

const projectSelect = document.getElementById('projectSelect');
const taskBoard = document.getElementById('taskBoard');
const navItems = document.querySelectorAll('.nav-menu .nav-item');
const displayToggle = document.getElementById('displayToggle');
const viewTitle = document.querySelector('.main-content h1');

// State Tracking & Local Storage Hydration
let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];
let selectedDate = 'today'; // Default to today inside modal
let selectedPriority = '4';
let editingTaskId = null;
let currentView = 'active'; // 'active' or 'completed'
let currentMenu = 'inbox'; // 'inbox', 'today', 'upcoming', 'filter'

// --- Local Storage Sync Helper ---
function saveToLocalStorage() {
  localStorage.setItem('todo_tasks', JSON.stringify(tasks));
}

// --- 1. Sidebar Menu Filtering Logic ---
navItems.forEach(item => {
  item.addEventListener('click', e => {
    if (item.id === 'addTaskTrigger') return;
    e.preventDefault();

    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    // Extract text context to determine the active menu mode
    const menuText = item.textContent.replace(/\s+/g, ' ').trim().toLowerCase();

    if (menuText.includes('inbox')) {
      currentMenu = 'inbox';
      viewTitle.textContent = 'Inbox';
    } else if (menuText.includes('today')) {
      currentMenu = 'today';
      viewTitle.textContent = 'Today';
    } else if (menuText.includes('upcoming')) {
      currentMenu = 'upcoming';
      viewTitle.textContent = 'Upcoming';
    } else if (menuText.includes('filter')) {
      currentMenu = 'filter';
      viewTitle.textContent = 'Filters & Labels';
    }

    renderTasks();
  });
});

// --- 2. View Filter Toggle (Display Button) ---
displayToggle.addEventListener('click', e => {
  e.preventDefault();
  if (currentView === 'active') {
    currentView = 'completed';
    displayToggle.innerHTML = `<span class="nav-icon"><i class="ri-arrow-left-box-line"></i></span>Go Back`;
    displayToggle.style.color = 'rgb(112, 11, 112)';
  } else {
    currentView = 'active';
    displayToggle.innerHTML = `<span class="nav-icon"><i class="ri-todo-fill"></i></span>Completed Task`;
    displayToggle.style.color = '';
  }
  renderTasks();
});

// --- 3. Modal Overlay Open/Close Mechanics ---
addTaskTrigger.addEventListener('click', e => {
  e.preventDefault();
  editingTaskId = null;
  saveTaskBtn.textContent = 'Add task';
  taskModal.classList.remove('hidden');
  taskInput.focus();
});

function closeModal() {
  taskModal.classList.add('hidden');
  resetForm();
}

cancelBtn.addEventListener('click', closeModal);

taskModal.addEventListener('click', e => {
  if (e.target === taskModal) closeModal();
});

taskInput.addEventListener('input', () => {
  saveTaskBtn.disabled = taskInput.value.trim() === '';
});

// --- 4. Dropdown Handling ---
function closeAllDropdowns() {
  dateDropdown.classList.add('hidden');
  priorityDropdown.classList.add('hidden');
  document
    .querySelectorAll('.card-actions-dropdown')
    .forEach(d => d.classList.add('hidden'));
}

dateBtn.addEventListener('click', e => {
  e.stopPropagation();
  closeAllDropdowns();
  dateDropdown.classList.toggle('hidden');
});

priorityBtn.addEventListener('click', e => {
  e.stopPropagation();
  closeAllDropdowns();
  priorityDropdown.classList.toggle('hidden');
});

dateDropdown.addEventListener('click', e => e.stopPropagation());
priorityDropdown.addEventListener('click', e => e.stopPropagation());

document.addEventListener('click', closeAllDropdowns);

// Parse Date Presets
dateDropdown.querySelectorAll('.dropdown-item').forEach(item => {
  item.addEventListener('click', () => {
    selectedDate = item.getAttribute('data-date');
    dateText.textContent = item.textContent.replace(/\s+/g, ' ').trim();
  });
});

// Parse Priorities Safely
priorityDropdown.querySelectorAll('.dropdown-item').forEach(item => {
  item.addEventListener('click', () => {
    selectedPriority = item.getAttribute('data-priority');
    const targetIcon = item.querySelector('i').cloneNode(true);
    const targetText = item.textContent.trim();

    priorityBtn.innerHTML = '';
    priorityBtn.appendChild(targetIcon);

    const textSpan = document.createElement('span');
    textSpan.id = 'priorityText';
    textSpan.style.marginLeft = '6px';
    textSpan.textContent = targetText;

    priorityBtn.appendChild(textSpan);
  });
});

// Attachment handling
attachmentBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    attachmentText.textContent = fileInput.files[0].name;
    attachmentBtn.style.borderColor = 'rgb(112, 11, 112)';
  }
});

// --- 5. Notifications Engine ---
function showNotification(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; background: #440b44; color: white;
    padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-size: 14px; z-index: 10000; transition: all 0.3s ease; transform: translateY(100px); opacity: 0;
  `;
  toast.innerHTML = `<i class="ri-notification-3-fill"></i> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 50);
  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- 6. Task Save & Processing Pipeline ---
saveTaskBtn.addEventListener('click', () => {
  const taskTitle = taskInput.value.trim();
  if (!taskTitle) return;

  if (editingTaskId !== null) {
    // Edit Existing Mode
    const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].title = taskTitle;
      tasks[taskIndex].description = taskDesc.value.trim();
      tasks[taskIndex].date = selectedDate || 'No Date';
      tasks[taskIndex].time = taskTimeInput.value || null;
      tasks[taskIndex].repeat =
        taskRepeatSelect.value !== 'none' ? taskRepeatSelect.value : null;
      tasks[taskIndex].priority = selectedPriority;
      tasks[taskIndex].file = fileInput.files[0]
        ? fileInput.files[0].name
        : tasks[taskIndex].file;
    }
    showNotification('Task changes saved.');
  } else {
    // Add New Mode
    const taskData = {
      id: Date.now(),
      title: taskTitle,
      description: taskDesc.value.trim(),
      date: selectedDate || 'today',
      time: taskTimeInput.value || null,
      repeat: taskRepeatSelect.value !== 'none' ? taskRepeatSelect.value : null,
      priority: selectedPriority,
      file: fileInput.files[0] ? fileInput.files[0].name : null,
      completed: false,
    };
    tasks.push(taskData);
    showNotification(`Task successfully added!`);
  }

  saveToLocalStorage();
  renderTasks();
  closeModal();
});

// --- 7. Core Card Renderer Engine with Custom Filtering ---
function renderTasks() {
  taskBoard.innerHTML = '';

  // Phase 1: Filter active vs completed tasks
  let filteredTasks = tasks.filter(task =>
    currentView === 'completed' ? task.completed : !task.completed,
  );

  // Phase 2: Filter based on selected Sidebar Item
  if (currentMenu === 'today') {
    filteredTasks = filteredTasks.filter(task => task.date === 'today');
  } else if (currentMenu === 'upcoming') {
    filteredTasks = filteredTasks.filter(
      task =>
        task.date === 'tomorrow' ||
        task.date === 'weekend' ||
        task.date === 'nextweek',
    );
  } else if (currentMenu === 'filter') {
    // Sort tasks in Filters & Labels mode by Priority level first (P1 -> P4)
    filteredTasks.sort((a, b) => a.priority - b.priority);
  }

  if (filteredTasks.length === 0) {
    taskBoard.innerHTML = `<p style="text-align: center; color: #999; margin-top: 30px; font-size: 14px;">No tasks found inside this view.</p>`;
    return;
  }

  filteredTasks.forEach(task => {
    const taskCard = document.createElement('div');
    taskCard.className = 'task-item';
    taskCard.style.cssText =
      'position: relative; padding: 16px; border-bottom: 1px solid rgba(0,0,0,0.05); margin-top: 10px; display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.8); border-radius: 12px;';

    taskCard.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
         <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <strong style="font-size: 15px; color:#202020; text-decoration: ${task.completed ? 'line-through' : 'none'}; opacity: ${task.completed ? '0.5' : '1'};">${task.title}</strong>
         </div>
         
         <div style="position: relative;">
            <button class="three-dots-btn"><i class="ri-more-fill"></i></button>
            <div class="card-actions-dropdown hidden">
               <div class="menu-item edit-opt"><i class="ri-edit-line"></i> Edit</div>
               <div class="menu-item delete-opt"><i class="ri-delete-bin-line"></i> Delete</div>
            </div>
         </div>
      </div>
      ${task.description ? `<p style="margin: 0 0 0 26px; color: #666; font-size: 13px; opacity: ${task.completed ? '0.4' : '1'}">${task.description}</p>` : ''}
      <div style="margin-left: 26px; font-size: 11px; color: #777; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 6px;">
         <span>📅 ${task.date.toUpperCase()}</span>
         ${task.time ? `<span>⏰ ${task.time}</span>` : ''}
         ${task.repeat ? `<span style="background: rgba(112,11,112,0.1); color: rgb(112,11,112); padding: 2px 6px; border-radius:4px;">🔁 ${task.repeat}</span>` : ''}
         <span style="font-weight: 600; color: ${task.priority === '1' ? '#de4c4a' : task.priority === '2' ? '#ff9a00' : task.priority === '3' ? '#246fe0' : '#777'}">🚩 P${task.priority}</span>
         ${task.file ? `<span>📎 ${task.file}</span>` : ''}
      </div>
    `;

    // --- Card Event Handling Hooks ---
    const checkbox = taskCard.querySelector('.task-checkbox');
    const dotsBtn = taskCard.querySelector('.three-dots-btn');
    const actionMenu = taskCard.querySelector('.card-actions-dropdown');
    const editOpt = taskCard.querySelector('.edit-opt');
    const deleteOpt = taskCard.querySelector('.delete-opt');

    // Toggle Task Completed
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveToLocalStorage();

      taskCard.style.transition = 'all 0.4s ease';
      taskCard.style.opacity = '0';
      taskCard.style.transform = 'translateX(20px)';

      setTimeout(() => {
        renderTasks();
      }, 400);
    });

    // Toggle Context Dropdown Menu
    dotsBtn.addEventListener('click', e => {
      e.stopPropagation();
      const openState = actionMenu.classList.contains('hidden');
      closeAllDropdowns();
      if (openState) actionMenu.classList.remove('hidden');
    });

    // Edit Task Logic Trigger
    editOpt.addEventListener('click', e => {
      e.stopPropagation();
      editingTaskId = task.id;

      taskInput.value = task.title;
      taskDesc.value = task.description;
      taskTimeInput.value = task.time || '';
      taskRepeatSelect.value = task.repeat || 'none';
      selectedDate = task.date;
      selectedPriority = task.priority;

      dateText.textContent = task.date;
      saveTaskBtn.textContent = 'Save Changes';
      saveTaskBtn.disabled = false;

      taskModal.classList.remove('hidden');
      closeAllDropdowns();
    });

    // Permanent Delete Logic Trigger
    deleteOpt.addEventListener('click', e => {
      e.stopPropagation();
      tasks = tasks.filter(t => t.id !== task.id);
      saveToLocalStorage();
      showNotification('Task permanently deleted.');
      renderTasks();
    });

    taskBoard.appendChild(taskCard);
  });
}

function resetForm() {
  taskInput.value = '';
  taskDesc.value = '';
  fileInput.value = '';
  taskTimeInput.value = '';
  taskRepeatSelect.value = 'none';
  selectedDate = 'today';
  selectedPriority = '4';

  dateText.textContent = 'Date';
  priorityBtn.innerHTML = `<i class="ri-flag-line"></i> <span id="priorityText">Priority</span>`;
  attachmentText.textContent = 'Attachment';
  attachmentBtn.style.borderColor = '';
  saveTaskBtn.disabled = true;
  editingTaskId = null;
}

// Initial Boot Cycle Setup
renderTasks();
