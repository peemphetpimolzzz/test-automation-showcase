// Minimal vanilla-JS Task Board (PulseBoard). Talks to /api on the same origin
// (nginx proxies /api to the API container). Kept dependency-free so the page
// needs no build step.

const API = '/api';
const STATUS_ORDER = ['todo', 'doing', 'done'];
const LAYER_TAGS = ['P0 · E2E', 'P1 · CONTRACT', 'P1 · PERF', 'P2 · DAST'];

const DEMO_FALLBACK_TASKS = [
  {
    id: 101,
    title: 'Verify Playwright POM checkout & task lifecycle journeys in headless Chromium',
    status: 'done',
  },
  {
    id: 102,
    title: 'Enforce strict Zod & Ajv response contract validation across /api/tasks endpoints',
    status: 'doing',
  },
  {
    id: 103,
    title: 'Benchmark k6 smoke & ramp-up load profile under p95 < 200ms latency threshold',
    status: 'doing',
  },
  {
    id: 104,
    title: 'Audit OWASP ZAP baseline security headers and disable /api/_reset in AWS ECS task',
    status: 'todo',
  },
];

const form = document.getElementById('add-form');
const input = document.getElementById('title-input');
const list = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');

let currentTasks = [];
let activeFilter = 'all';

function nextStatus(status) {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
}

async function api(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok && res.status !== 204) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch (_) {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

function render(tasks) {
  currentTasks = tasks;
  list.innerHTML = '';

  const filtered = tasks.filter((t) => {
    if (activeFilter === 'active') return t.status !== 'done';
    if (activeFilter === 'done') return t.status === 'done';
    return true;
  });

  emptyState.hidden = filtered.length > 0;

  filtered.forEach((task, idx) => {
    const li = document.createElement('li');
    li.className = 'task task-item';
    li.dataset.id = task.id;
    li.dataset.testid = 'task';

    const key = document.createElement('span');
    key.className = 'task-key';
    const numericId = typeof task.id === 'number' ? task.id : 101 + idx;
    key.textContent = `PUL-${numericId}`;

    const tag = document.createElement('span');
    tag.className = 'task-meta-tag';
    tag.textContent = LAYER_TAGS[idx % LAYER_TAGS.length];

    const title = document.createElement('span');
    title.className = 'task-title';
    title.dataset.testid = 'task-title';
    title.textContent = task.title;

    const badge = document.createElement('button');
    badge.className = `badge ${task.status}`;
    badge.dataset.testid = 'task-status';
    badge.type = 'button';
    badge.textContent = task.status;
    badge.title = 'Click to cycle status';
    badge.addEventListener('click', () => {
      cycleStatus(task).catch((err) => alert(err.message));
    });

    const del = document.createElement('button');
    del.className = 'delete delete-btn';
    del.dataset.testid = 'task-delete';
    del.type = 'button';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      deleteTask(task.id).catch((err) => alert(err.message));
    });

    li.append(key, tag, title, badge, del);
    list.append(li);
  });
}

async function load() {
  const data = await api('/tasks');
  render(data.tasks);
}

async function addTask(title) {
  await api('/tasks', { method: 'POST', body: JSON.stringify({ title }) });
  await load();
}

async function cycleStatus(task) {
  await api(`/tasks/${task.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: nextStatus(task.status) }),
  });
  await load();
}

async function deleteTask(id) {
  await api(`/tasks/${id}`, { method: 'DELETE' });
  await load();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  input.value = '';
  try {
    await addTask(title);
  } catch (err) {
    alert(err.message);
  }
});

// Theme & language controls
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  });
}

const langToggle = document.getElementById('lang-toggle');
if (langToggle) {
  langToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-lang]');
    if (!btn) return;
    const lang = btn.dataset.lang;
    langToggle.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    const sub = document.getElementById('board-subtitle');
    if (sub) {
      sub.textContent =
        lang === 'th'
          ? 'ระบบบริหารจัดการงานสปรินต์พร้อมเกตตรวจสอบคุณภาพอัตโนมัติ (Playwright E2E, Supertest API, Contract และ k6)'
          : 'Interactive system-under-test (SUT) driven by Playwright E2E, Supertest API, and k6 load suites.';
    }
  });
}

const filterPills = document.getElementById('filter-pills');
if (filterPills) {
  filterPills.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    filterPills.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
    render(currentTasks);
  });
}

load().catch((err) => {
  console.error(err);
  if (window.location.protocol === 'file:') {
    render(DEMO_FALLBACK_TASKS);
  }
});
