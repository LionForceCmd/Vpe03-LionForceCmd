const STORAGE_KEY = "study-pulse.tasks.v1";
const VALID_PRIORITIES = new Set(["high", "medium", "low"]);
const PRIORITY_LABELS = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const form = document.querySelector("[data-task-form]");
const titleInput = document.querySelector("#task-title");
const priorityInput = document.querySelector("#task-priority");
const taskList = document.querySelector("[data-task-list]");
const emptyState = document.querySelector("[data-empty-state]");
const progress = document.querySelector("[data-progress]");
const progressText = document.querySelector("[data-progress-text]");
const totalCount = document.querySelector("[data-total-count]");
const activeCount = document.querySelector("[data-active-count]");
const doneCount = document.querySelector("[data-done-count]");
const completion = document.querySelector("[data-completion]");
const clearCompletedButton = document.querySelector("[data-clear-completed]");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let currentFilter = "all";
let tasks = loadTasks();

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createInitialTasks() {
  const now = Date.now();
  return [
    {
      id: createId(),
      title: "Проверить SSH-подключение",
      priority: "high",
      done: false,
      createdAt: now,
    },
    {
      id: createId(),
      title: "Задеплоить проект в Coolify",
      priority: "medium",
      done: false,
      createdAt: now + 1,
    },
    {
      id: createId(),
      title: "Сделать тестовый коммит",
      priority: "low",
      done: false,
      createdAt: now + 2,
    },
  ];
}

function normalizeTask(task) {
  if (!task || typeof task !== "object") {
    return null;
  }

  const title = typeof task.title === "string" ? task.title.trim().slice(0, 120) : "";
  if (!title) {
    return null;
  }

  return {
    id: typeof task.id === "string" ? task.id : createId(),
    title,
    priority: VALID_PRIORITIES.has(task.priority) ? task.priority : "medium",
    done: Boolean(task.done),
    createdAt: Number.isFinite(task.createdAt) ? task.createdAt : Date.now(),
  };
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks === null) {
      return createInitialTasks();
    }

    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks)) {
      return [];
    }

    return parsedTasks.map(normalizeTask).filter(Boolean);
  } catch {
    return createInitialTasks();
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    return;
  }
}

function getVisibleTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.done);
  }

  if (currentFilter === "done") {
    return tasks.filter((task) => task.done);
  }

  return tasks;
}

function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = task.done ? "task-item is-done" : "task-item";
  item.dataset.taskId = task.id;

  const checkbox = document.createElement("input");
  checkbox.className = "task-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", `Отметить задачу «${task.title}»`);

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("span");
  meta.className = "task-meta";

  const priority = document.createElement("span");
  priority.className = `priority priority-${task.priority}`;
  priority.textContent = PRIORITY_LABELS[task.priority];

  const status = document.createElement("span");
  status.textContent = task.done ? "Готово" : "В работе";

  meta.append(priority, status);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.deleteTask = task.id;
  deleteButton.setAttribute("aria-label", `Удалить задачу «${task.title}»`);
  deleteButton.textContent = "×";

  content.append(title, meta);
  item.append(checkbox, content, deleteButton);
  return item;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  const fragment = document.createDocumentFragment();
  visibleTasks.forEach((task) => fragment.append(createTaskElement(task)));
  taskList.replaceChildren(fragment);

  const emptyTitle = emptyState.querySelector("strong");
  const emptyText = emptyState.querySelector("span");
  if (tasks.length === 0) {
    emptyTitle.textContent = "План пока пуст";
    emptyText.textContent = "Добавь первую учебную задачу.";
  } else if (currentFilter === "active" && visibleTasks.length === 0) {
    emptyTitle.textContent = "Все задачи выполнены";
    emptyText.textContent = "Можно переключиться на фильтр «Готово».";
  } else if (currentFilter === "done" && visibleTasks.length === 0) {
    emptyTitle.textContent = "Готовых задач пока нет";
    emptyText.textContent = "Завершите задачу из фильтра «Активные».";
  } else {
    emptyTitle.textContent = "Нет задач для этого фильтра";
    emptyText.textContent = "Добавь задачу или выбери другой фильтр.";
  }

  emptyState.hidden = visibleTasks.length > 0;
  renderMetrics();
}

function renderMetrics() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.done).length;
  const active = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  totalCount.textContent = String(total);
  activeCount.textContent = String(active);
  doneCount.textContent = String(completed);
  completion.textContent = `${percent}%`;
  progress.value = percent;
  progress.textContent = `${percent}%`;
  progressText.textContent = `${completed} из ${total}`;
  clearCompletedButton.disabled = completed === 0;
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderTasks();
}

function setDate() {
  const currentDate = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(new Date());

  document.querySelector("[data-current-date]").textContent = currentDate;
  document.querySelector("[data-current-year]").textContent = String(new Date().getFullYear());
}

async function loadRelease() {
  const versionElements = document.querySelectorAll("[data-release-version]");
  const messageElements = document.querySelectorAll("[data-release-message]");
  const dateElements = document.querySelectorAll("[data-release-date]");

  try {
    const response = await fetch("/release.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const release = await response.json();
    versionElements.forEach((element) => {
      element.textContent = release.version ?? "dev";
    });
    messageElements.forEach((element) => {
      element.textContent = release.message ?? "Рабочая сборка";
    });
    dateElements.forEach((element) => {
      element.textContent = release.deployedAt
        ? `Дата деплоя: ${release.deployedAt}`
        : "Дата деплоя не указана";
    });
  } catch {
    versionElements.forEach((element) => {
      element.textContent = "dev";
    });
    messageElements.forEach((element) => {
      element.textContent = "Локальная сборка: release.json недоступен";
    });
    dateElements.forEach((element) => {
      element.textContent = "Проверьте сетевой запрос к /release.json";
    });
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  tasks.push({
    id: createId(),
    title: title.slice(0, 120),
    priority: priorityInput.value,
    done: false,
    createdAt: Date.now(),
  });

  saveTasks();
  setFilter("all");
  form.reset();
  priorityInput.value = "medium";
  titleInput.focus();
});

taskList.addEventListener("change", (event) => {
  if (!event.target.matches(".task-checkbox")) {
    return;
  }

  const taskItem = event.target.closest("[data-task-id]");
  const task = tasks.find((item) => item.id === taskItem?.dataset.taskId);
  if (!task) {
    return;
  }

  task.done = event.target.checked;
  saveTasks();
  renderTasks();
});

taskList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-task]");
  if (!deleteButton) {
    return;
  }

  tasks = tasks.filter((task) => task.id !== deleteButton.dataset.deleteTask);
  saveTasks();
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
});

setDate();
renderTasks();
loadRelease();
