const $ = (s) => document.querySelector(s);

const state = {
  resource: null,
  operation: 'list',
  manual: false,
  lastResponse: '',
  records: [],
  users: []
};

const resources = {
  users: { name: 'Usuarios', file: 'src/data/users.json' },
  pets: { name: 'Mascotas', file: 'src/data/pets.json' }
};

const operations = [
  { id: 'list', method: 'GET' },
  { id: 'one', method: 'GET' },
  { id: 'create', method: 'POST' },
  { id: 'update', method: 'PUT' },
  { id: 'delete', method: 'DELETE' }
];

const withId = ['one', 'update', 'delete'];

const notes = {
  users: {
    list: 'Devuelve todos los usuarios sin el campo contrasenha.',
    one: 'Devuelve un usuario. Responde 404 si el ID no existe.',
    create: 'multipart/form-data. La contraseña se guarda cifrada con AES-256-CBC. Responde 201.',
    update: 'Solo cambia los campos enviados. Un avatar nuevo reemplaza al anterior.',
    delete: 'Elimina el usuario de users.json.'
  },
  pets: {
    list: 'Devuelve todas las mascotas.',
    one: 'Devuelve una mascota. Responde 404 si el ID no existe.',
    create: 'multipart/form-data. duehno debe ser el ID de un usuario existente. Responde 201.',
    update: 'Solo cambia los campos enviados. Las imágenes nuevas reemplazan a las anteriores.',
    delete: 'Elimina la mascota de pets.json y borra sus imágenes del disco.'
  }
};

// [campo, tipo, ejemplo]
const schemas = {
  users: [
    ['nombre', 'text', 'Ana'],
    ['apellidos', 'text', 'Ruiz Torres'],
    ['usuario', 'text', 'a.ruiz'],
    ['contrasenha', 'password'],
    ['avatar', 'file']
  ],
  pets: [
    ['especie', 'text', 'perro'],
    ['color', 'text', 'marrón'],
    ['edad', 'number', '3'],
    ['sexo', 'select'],
    ['duehno', 'owner'],
    ['img', 'multi']
  ]
};

const reasons = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  404: 'Not Found',
  500: 'Internal Server Error'
};

// ==========================================
// NOTIFICACIONES
// ==========================================

function toast(msg) {
  const t = $('#toast');

  t.textContent = msg;
  t.classList.add('show');

  clearTimeout(window._toastTimer);

  window._toastTimer = setTimeout(() => {
    t.classList.remove('show');
  }, 2400);
}

function copy(text, msg) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast(msg))
    .catch(() => toast('No se pudo copiar'));
}

// ==========================================
// SELECCIÓN DE ENDPOINT
// ==========================================

function markRoute() {
  document.querySelectorAll('.route').forEach((b) => {
    const active = state.manual
      ? b.id === 'route-manual'
      : b.dataset.resource === state.resource &&
        b.dataset.op === state.operation;

    b.classList.toggle('active', active);
    b.setAttribute('aria-current', active ? 'true' : 'false');
  });
}

function setMethod(method) {
  const el = $('#req-method');

  el.textContent = method;
  el.className = 'method ' + method.toLowerCase();
}

function updatePath() {
  if (state.manual) {
    $('#req-path').textContent = $('#manual-path').value.trim() || '/';
    return;
  }

  const id = $('#f-id')?.value.trim();

  $('#req-path').textContent =
    `/api/${state.resource}` +
    (withId.includes(state.operation) ? '/' + (id || ':id') : '');
}

function select(resource, opId) {
  const resourceChanged = resource !== state.resource;

  state.resource = resource;
  state.operation = opId;
  state.manual = false;

  markRoute();

  $('#request-form').hidden = false;
  $('#manual-form').hidden = true;

  setMethod(operations.find((x) => x.id === opId).method);
  $('#req-note').textContent = notes[resource][opId];

  buildFields();
  updatePath();

  if (resourceChanged) {
    loadRecords();
  }
}

function showManual() {
  state.manual = true;

  markRoute();

  $('#request-form').hidden = true;
  $('#manual-form').hidden = false;

  setMethod($('#manual-method').value);
  $('#req-note').textContent =
    'Cualquier método y ruta. El cuerpo se envía como JSON; para subir archivos usa los endpoints de la lista.';

  updatePath();
}

// ==========================================
// CAMPOS DEL FORMULARIO
// ==========================================

function buildFields() {
  $('#fields').replaceChildren();

  if (withId.includes(state.operation)) {
    addField('id', 'id');
  }

  if (['create', 'update'].includes(state.operation)) {
    schemas[state.resource].forEach((f) => addField(...f));
  }
}

function addField(key, type, example = '') {
  const required =
    key === 'id' ||
    (state.operation === 'create' && key !== 'avatar');

  const wrap = document.createElement('div');
  wrap.className =
    'field' + (['id', 'owner', 'file', 'multi'].includes(type) ? ' wide' : '');

  const label = document.createElement('label');
  label.htmlFor = 'f-' + key;

  const name = document.createElement('code');
  name.textContent = key;
  label.append(name);

  if (required) {
    const req = document.createElement('span');
    req.textContent = 'requerido';
    label.append(req);
  }

  wrap.append(label);

  let el;

  if (type === 'select') {
    el = document.createElement('select');

    const options = [
      ['', state.operation === 'update' ? 'Sin cambios' : 'Seleccionar…'],
      ['macho', 'macho'],
      ['hembra', 'hembra']
    ];

    options.forEach(([val, txt]) => {
      const o = document.createElement('option');

      o.value = val;
      o.textContent = txt;

      el.append(o);
    });

  } else {
    el = document.createElement('input');
    el.type = { id: 'text', owner: 'text', multi: 'file' }[type] || type;
    el.spellcheck = false;

    if (example) el.placeholder = example;

    if (type === 'id') {
      el.setAttribute('list', 'id-options');
      el.placeholder = 'UUID: pégalo o elígelo de la lista';
    }

    if (type === 'owner') {
      el.setAttribute('list', 'owner-options');
      el.placeholder = 'UUID de un usuario existente';
    }

    if (type === 'number') el.min = '0';
    if (type === 'password') el.autocomplete = 'new-password';
    if (type === 'multi') el.multiple = true;

    if (type === 'file' || type === 'multi') {
      el.accept = 'image/png,image/jpeg,image/webp';
    }
  }

  el.id = 'f-' + key;
  el.name = key;
  el.required = required;

  wrap.append(el);

  if (type === 'file' || type === 'multi') {
    const hint = document.createElement('small');

    hint.className = 'hint';
    hint.textContent =
      (type === 'multi' ? 'De 1 a 5 imágenes. ' : '') +
      'PNG, JPG o WEBP, máximo 5 MB por archivo.';

    wrap.append(hint);
  }

  $('#fields').append(wrap);
}

// ==========================================
// PETICIONES HTTP
// ==========================================

async function send(method, url, options = {}) {
  const start = performance.now();

  try {
    const response = await fetch(url, { method, ...options });
    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    return {
      status: response.status,
      statusText: response.statusText || reasons[response.status] || '',
      ok: response.ok,
      data,
      ms: Math.round(performance.now() - start)
    };

  } catch (e) {
    return {
      status: 0,
      ok: false,
      data: { error: 'No se pudo conectar con el servidor', detalle: e.message },
      ms: Math.round(performance.now() - start)
    };
  }
}

// ==========================================
// RESPUESTA
// ==========================================

function highlight(json) {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, str, colon, lit) => {
      if (str) {
        return colon
          ? `<span class="j-key">${str}</span>${colon}`
          : `<span class="j-str">${str}</span>`;
      }

      return `<span class="${lit ? 'j-lit' : 'j-num'}">${match}</span>`;
    }
  );
}

function renderResponse(result, method, url) {
  const status = $('#res-status');

  status.textContent = result.status
    ? `${result.status} ${result.statusText}`.trim()
    : 'Sin conexión';

  status.className =
    'status ' + (
      result.ok
        ? 'ok'
        : result.status >= 400 && result.status < 500
          ? 'warn'
          : 'err'
    );

  $('#res-meta').textContent = `${method} ${url} · ${result.ms} ms`;

  const pre = $('#response-json');
  pre.classList.remove('placeholder');

  if (typeof result.data === 'string') {
    state.lastResponse = result.data;
    pre.textContent = result.data || '(respuesta vacía)';
  } else {
    state.lastResponse = JSON.stringify(result.data, null, 2);
    pre.innerHTML = highlight(state.lastResponse);
  }

  $('#copy-response').hidden = false;
}

// ==========================================
// ENVÍO DEL FORMULARIO
// ==========================================

$('#request-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const op = operations.find((x) => x.id === state.operation);
  const form = e.currentTarget;
  const id = form.elements.namedItem('id')?.value.trim();

  let url = '/api/' + state.resource;

  if (id) {
    url += '/' + encodeURIComponent(id);
  }

  let body;

  if (['create', 'update'].includes(state.operation)) {
    body = new FormData();

    for (const [key] of schemas[state.resource]) {
      const el = form.elements.namedItem(key);

      if (el.type === 'file') {
        const files = [...el.files];

        if (key === 'img' && files.length > 5) {
          return toast('Máximo 5 imágenes');
        }

        files.forEach((file) => body.append(key, file));

      } else if (el.value.trim()) {
        body.append(key, el.value.trim());
      }
    }
  }

  if (
    state.operation === 'delete' &&
    !confirm('¿Eliminar este registro?')
  ) {
    return;
  }

  const btn = $('#send-btn');

  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const result = await send(op.method, url, body ? { body } : {});

  renderResponse(result, op.method, url);

  btn.disabled = false;
  btn.textContent = 'Enviar';

  if (result.ok && op.method !== 'GET') {
    loadRecords();
  }
});

$('#request-form').addEventListener('input', updatePath);

$('#request-form').addEventListener('reset', () => {
  setTimeout(updatePath);
});

// ==========================================
// PETICIÓN MANUAL
// ==========================================

$('#manual-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const method = $('#manual-method').value;
  const url = $('#manual-path').value.trim();

  if (!url.startsWith('/') || url.startsWith('//')) {
    return toast('La ruta debe empezar con /');
  }

  let body;

  const raw = $('#manual-body').value.trim();

  if (raw && method !== 'GET' && method !== 'DELETE') {
    try {
      body = JSON.stringify(JSON.parse(raw));
    } catch {
      return toast('El cuerpo no es JSON válido');
    }
  }

  const result = await send(
    method,
    url,
    body ? { headers: { 'Content-Type': 'application/json' }, body } : {}
  );

  renderResponse(result, method, url);

  if (result.ok && method !== 'GET') {
    loadRecords();
  }
});

$('#manual-method').addEventListener('change', (e) => {
  setMethod(e.target.value);
});

$('#manual-path').addEventListener('input', updatePath);

// ==========================================
// DATOS GUARDADOS
// ==========================================

function fullName(u) {
  return `${u.nombre || u.firstname || ''} ${u.apellidos || u.lastname || ''}`.trim();
}

function userLabel(u) {
  return fullName(u) || u.usuario || u.username || u.id;
}

function thumbs(list) {
  const box = document.createElement('div');
  box.className = 'thumbs';

  list.forEach((src) => {
    if (typeof src === 'string' && src.startsWith('/img/')) {
      const img = document.createElement('img');

      img.className = 'thumb';
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = () => img.replaceWith(missingThumb(src));

      box.append(img);
    } else {
      box.append(missingThumb(src));
    }
  });

  return list.length ? box : '—';
}

function missingThumb(src) {
  const box = document.createElement('span');

  box.className = 'thumb missing';
  box.title = 'Archivo no disponible: ' + src;

  return box;
}

function owner(id) {
  const user = state.users.find((u) => u.id === id);

  if (user) {
    return '@' + (user.usuario || user.username || userLabel(user));
  }

  const span = document.createElement('span');

  span.className = 'muted';
  span.textContent = 'no existe';

  return span;
}

const columns = {
  users: [
    ['Nombre', (u) => fullName(u) || '—'],
    ['Usuario', (u) => u.usuario || u.username || '—'],
    ['Avatar', (u) => thumbs(u.avatar ? [u.avatar] : [])]
  ],
  pets: [
    ['Especie', (p) => p.especie ?? '—'],
    ['Color', (p) => p.color ?? '—'],
    ['Edad', (p) => p.edad ?? '—'],
    ['Sexo', (p) => p.sexo ?? '—'],
    ['Dueño', (p) => owner(p.duehno)],
    ['Imágenes', (p) => thumbs(Array.isArray(p.img) ? p.img : [])]
  ]
};

function tableMessage(text) {
  const cols = columns[state.resource].length + 2;

  $('#records').innerHTML =
    `<tbody><tr><td class="empty" colspan="${cols}"></td></tr></tbody>`;

  $('#records td').textContent = text;
}

function setHealth(online) {
  $('#api-dot').className = 'dot ' + (online ? 'on' : 'off');
  $('#api-health').textContent =
    (online ? 'Servidor activo en ' : 'Sin conexión con ') + location.host;
}

function fillDatalist(id, items, label) {
  const list = $('#' + id);

  list.replaceChildren(
    ...items.map((item) => {
      const o = document.createElement('option');

      o.value = item.id;
      o.label = label(item);

      return o;
    })
  );
}

async function loadRecords() {
  const resource = state.resource;

  $('#data-title').textContent = resources[resource].name;
  $('#data-file').textContent = resources[resource].file;
  $('#data-count').textContent = '';

  tableMessage('Cargando…');

  const [result, users] = await Promise.all([
    send('GET', '/api/' + resource),
    resource === 'pets' ? send('GET', '/api/users') : null
  ]);

  setHealth(result.status !== 0);

  const userList = resource === 'users' ? result : users;

  if (userList?.ok && Array.isArray(userList.data)) {
    state.users = userList.data;
    fillDatalist('owner-options', state.users, userLabel);
  }

  if (resource !== state.resource) return;

  if (!result.ok || !Array.isArray(result.data)) {
    return tableMessage('No se pudieron cargar los registros.');
  }

  state.records = result.data;

  $('#data-count').textContent =
    result.data.length === 1 ? '1 registro' : `${result.data.length} registros`;

  fillDatalist(
    'id-options',
    result.data,
    resource === 'users'
      ? userLabel
      : (p) => `${p.especie ?? ''} ${p.color ?? ''}`.trim()
  );

  if (!result.data.length) {
    return tableMessage('Sin registros. Crea uno con POST.');
  }

  renderTable(resource, result.data);
}

function renderTable(resource, items) {
  const table = $('#records');
  const head = document.createElement('thead');
  const body = document.createElement('tbody');

  const headRow = document.createElement('tr');

  ['ID', ...columns[resource].map(([title]) => title), ''].forEach((title) => {
    const th = document.createElement('th');
    th.textContent = title;
    headRow.append(th);
  });

  head.append(headRow);

  items.forEach((item) => {
    const row = document.createElement('tr');

    // ID abreviado; al hacer clic se copia completo
    const idCell = document.createElement('td');
    const idBtn = document.createElement('button');

    idBtn.className = 'id-btn';
    idBtn.type = 'button';
    idBtn.title = item.id + ' (clic para copiar)';
    idBtn.textContent = String(item.id).slice(0, 8);
    idBtn.onclick = () => copy(item.id, 'ID copiado');

    idCell.append(idBtn);
    row.append(idCell);

    columns[resource].forEach(([, value]) => {
      const td = document.createElement('td');

      td.append(value(item));
      row.append(td);
    });

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');

    actions.className = 'row-actions';

    [
      ['one', 'Ver'],
      ['update', 'Editar'],
      ['delete', 'Eliminar']
    ].forEach(([op, text]) => {
      const b = document.createElement('button');

      b.type = 'button';
      b.textContent = text;
      if (op === 'delete') b.className = 'danger';
      b.onclick = () => useRecord(item, op);

      actions.append(b);
    });

    actionsCell.append(actions);
    row.append(actionsCell);
    body.append(row);
  });

  table.replaceChildren(head, body);
}

// Carga un registro en el formulario de la operación elegida
function useRecord(item, op) {
  select(state.resource, op);

  $('#f-id').value = item.id;

  if (op === 'update') {
    schemas[state.resource].forEach(([key]) => {
      const el = $('#f-' + key);

      if (el && el.type !== 'file' && item[key] != null) {
        el.value = item[key];
      }
    });
  }

  updatePath();

  $('#request').scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });

  if (op === 'one') {
    $('#request-form').requestSubmit();
  }
}

// ==========================================
// EVENTOS
// ==========================================

document.querySelectorAll('.route[data-op]').forEach((b) => {
  b.addEventListener('click', () => {
    select(b.dataset.resource, b.dataset.op);
  });
});

$('#route-manual').addEventListener('click', showManual);

$('#load-records').onclick = loadRecords;

$('#copy-response').onclick = () => {
  copy(state.lastResponse, 'Respuesta copiada');
};

// ==========================================
// INICIO
// ==========================================

select('users', 'list');
$('#request-form').requestSubmit();
