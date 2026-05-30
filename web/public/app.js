// Minimal vanilla-JS Task Board. Talks to /api on the same origin (nginx proxies
// /api to the API container). Kept dependency-free so the page needs no build step.

const API = '/api';
const STATUS_ORDER = ['todo', 'doing', 'done'];

const form = document.getElementById('add-form');
const input = document.getElementById('title-input');
const list = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');

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
  list.innerHTML = '';
  emptyState.hidden = tasks.length > 0;

  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = 'task';
    li.dataset.id = task.id;
    li.dataset.testid = 'task';

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
    badge.addEventListener('click', () => cycleStatus(task));

    const del = document.createElement('button');
    del.className = 'delete';
    del.dataset.testid = 'task-delete';
    del.type = 'button';
    del.textContent = 'Delete';
    del.addEventListener('click', () => deleteTask(task.id));

    li.append(title, badge, del);
    list.append(li);
  }
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

load().catch((err) => {
  console.error(err);
});
