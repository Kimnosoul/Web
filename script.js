const storageKey = "astral-planner-state-v2";

const clock = document.getElementById("clock");
const dateLabel = document.getElementById("dateLabel");
const dayProgress = document.getElementById("dayProgress");
const dayPercent = document.getElementById("dayPercent");

const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");

const doneCount = document.getElementById("doneCount");
const openCount = document.getElementById("openCount");
const completionRate = document.getElementById("completionRate");
const highRemaining = document.getElementById("highRemaining");

const startFocus = document.getElementById("startFocus");
const resetFocus = document.getElementById("resetFocus");
const focusTime = document.getElementById("focusTime");

const habitInputs = [...document.querySelectorAll(".habit")];
const dailyQuote = document.getElementById("dailyQuote");

const quotes = [
  "Small steps today become legendary progress tomorrow.",
  "Discipline is the map; consistency is the journey.",
  "Complete one quest at a time, and the whole day transforms.",
  "Your future self is built by the habits you honor now."
];

const defaultState = {
  tasks: [
    { id: crypto.randomUUID(), text: "Plan your top 3 priorities", priority: "high", done: false },
    { id: crypto.randomUUID(), text: "Move your body for 30 minutes", priority: "medium", done: false },
    { id: crypto.randomUUID(), text: "Review notes before sleep", priority: "low", done: true }
  ],
  habits: {},
  quoteIndex: Math.floor(Math.random() * quotes.length)
};

let state = loadState();
let focusSeconds = 25 * 60;
let focusTimer = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || typeof saved !== "object") return defaultState;
    return {
      tasks: Array.isArray(saved.tasks) ? saved.tasks : defaultState.tasks,
      habits: saved.habits ?? {},
      quoteIndex: Number.isInteger(saved.quoteIndex) ? saved.quoteIndex : defaultState.quoteIndex
    };
  } catch {
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatClock(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function tick() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString();
  dateLabel.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const elapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const percent = Math.round((elapsed / 86400) * 100);
  dayProgress.style.width = `${percent}%`;
  dayPercent.textContent = `${percent}%`;
}

function updateStats() {
  const done = state.tasks.filter((task) => task.done).length;
  const open = state.tasks.length - done;
  const high = state.tasks.filter((task) => !task.done && task.priority === "high").length;
  const rate = state.tasks.length ? Math.round((done / state.tasks.length) * 100) : 0;

  doneCount.textContent = String(done);
  openCount.textContent = String(open);
  completionRate.textContent = `${rate}%`;
  highRemaining.textContent = String(high);
}

function buildTaskItem(task) {
  const li = document.createElement("li");
  li.className = `task-item ${task.done ? "done" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.addEventListener("change", () => {
    task.done = checkbox.checked;
    saveState();
    render();
  });

  const text = document.createElement("span");
  text.className = "text";
  text.textContent = task.text;

  const badge = document.createElement("span");
  badge.className = `badge ${task.priority}`;
  badge.textContent = task.priority;

  const delBtn = document.createElement("button");
  delBtn.className = "delete";
  delBtn.type = "button";
  delBtn.textContent = "✕";
  delBtn.setAttribute("aria-label", `Delete ${task.text}`);
  delBtn.addEventListener("click", () => {
    state.tasks = state.tasks.filter((entry) => entry.id !== task.id);
    saveState();
    render();
  });

  li.append(checkbox, text, badge, delBtn);
  return li;
}

function renderTasks() {
  taskList.innerHTML = "";
  const sorted = [...state.tasks].sort((a, b) => Number(a.done) - Number(b.done));

  for (const task of sorted) {
    taskList.appendChild(buildTaskItem(task));
  }
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  state.tasks.unshift({
    id: crypto.randomUUID(),
    text,
    priority: taskPriority.value,
    done: false
  });

  taskInput.value = "";
  saveState();
  render();
}

function renderHabits() {
  for (const input of habitInputs) {
    input.checked = Boolean(state.habits[input.dataset.id]);
    input.parentElement.classList.toggle("done", input.checked);
  }
}

function bindHabits() {
  for (const input of habitInputs) {
    input.addEventListener("change", () => {
      state.habits[input.dataset.id] = input.checked;
      saveState();
      renderHabits();
    });
  }
}

function startFocusTimer() {
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
    startFocus.textContent = "Start";
    return;
  }

  startFocus.textContent = "Pause";
  focusTimer = setInterval(() => {
    focusSeconds -= 1;
    focusTime.textContent = formatClock(Math.max(0, focusSeconds));

    if (focusSeconds <= 0) {
      clearInterval(focusTimer);
      focusTimer = null;
      startFocus.textContent = "Start";
      focusSeconds = 25 * 60;
      setTimeout(() => {
        focusTime.textContent = formatClock(focusSeconds);
      }, 800);
    }
  }, 1000);
}

function resetFocusTimer() {
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
  }
  startFocus.textContent = "Start";
  focusSeconds = 25 * 60;
  focusTime.textContent = formatClock(focusSeconds);
}

function render() {
  renderTasks();
  renderHabits();
  updateStats();
  dailyQuote.textContent = `“${quotes[state.quoteIndex % quotes.length]}”`;
}

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTask();
});
startFocus.addEventListener("click", startFocusTimer);
resetFocus.addEventListener("click", resetFocusTimer);

bindHabits();
render();
tick();
setInterval(tick, 1000);
