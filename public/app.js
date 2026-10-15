(function () {
  const STORAGE_KEY = 'pi-todo-items';
  let storageKey = STORAGE_KEY;
  let todos = [];
  let filter = 'all';

  const form = document.getElementById('new-todo');
  const input = document.getElementById('todo-text');
  const list = document.getElementById('list');
  const count = document.getElementById('count');
  const userLabel = document.getElementById('user');

  function load() {
    try {
      todos = JSON.parse(localStorage.getItem(storageKey)) || [];
    } catch (e) {
      todos = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(todos));
    } catch (e) {
      // Storage unavailable; the list still works for this session.
    }
  }

  function render() {
    list.innerHTML = '';
    todos
      .filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done))
      .forEach(t => {
        const li = document.createElement('li');
        li.className = t.done ? 'done' : '';

        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = t.done;
        box.addEventListener('change', () => { t.done = box.checked; save(); render(); });

        const text = document.createElement('span');
        text.textContent = t.text;

        const del = document.createElement('button');
        del.className = 'delete';
        del.setAttribute('aria-label', 'Delete');
        del.textContent = '×';
        del.addEventListener('click', () => { todos = todos.filter(x => x.id !== t.id); save(); render(); });

        li.append(box, text, del);
        list.appendChild(li);
      });
    const left = todos.filter(t => !t.done).length;
    count.textContent = left + (left === 1 ? ' item left' : ' items left');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: Date.now() + Math.random(), text, done: false });
    input.value = '';
    save();
    render();
  });

  document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      render();
    });
  });

  document.getElementById('clear-done').addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    save();
    render();
  });

  load();
  render();

  // Pi sign-in: scopes each user's list by the uid App Studio verified.
  if (window.Pi && window.PiAuth) {
    PiAuth.signIn(window.Pi, window.fetch.bind(window))
      .then(session => {
        userLabel.textContent = '@' + session.user.username;
        storageKey = STORAGE_KEY + ':' + session.user.uid;
        load();
        render();
      })
      .catch(() => { userLabel.textContent = 'Open in Pi Browser to sign in'; });
  }
})();
