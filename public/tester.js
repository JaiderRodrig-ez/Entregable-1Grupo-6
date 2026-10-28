
const $ = (s) => document.querySelector(s);

const state = {
  resource: 'users',
  operation: 'list',
  lastResponse: '',
  records: []
};

const names = {
  users: 'Usuarios',
  pets: 'Mascotas'
};

const operations = [
  { id: 'list', method: 'GET', name: 'Listar todos' },
  { id: 'one', method: 'GET', name: 'Buscar por ID' },
  { id: 'create', method: 'POST', name: 'Crear registro' },
  { id: 'update', method: 'PUT', name: 'Actualizar' },
  { id: 'delete', method: 'DELETE', name: 'Eliminar' }
];

const schemas = {
  users: [
    ['nombre', 'Nombre', 'text'],
    ['apellidos', 'Apellidos', 'text'],
    ['usuario', 'Usuario', 'text'],
    ['contrasenha', 'Contraseña', 'password'],
    ['avatar', 'Avatar (imagen)', 'file']
  ],
  pets: [
    ['especie', 'Especie', 'text'],
    ['color', 'Color', 'text'],
    ['edad', 'Edad', 'number'],
    ['sexo', 'Sexo', 'select'],
    ['duehno', 'ID del dueño (usuario)', 'owner'],
    ['img', 'Imágenes (máximo 5)', 'multi']
  ]
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
  }, 2800);
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function navigate(page) {
  document.querySelectorAll('.nav').forEach((n) => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  document.querySelectorAll('.page').forEach((n) => {
    n.classList.toggle(
      'active',
      n.id === (
        page === 'overview'
          ? 'overview'
          : page === 'playground'
            ? 'playground'
            : 'resource'
      )
    );
  });

  $('#breadcrumb').textContent =
    page === 'overview'
      ? 'Panel general'
      : page === 'playground'
        ? 'Petición libre'
        : names[page];

  if (page === 'users' || page === 'pets') {
    setResource(page);
  }
}

// ==========================================
// RECURSOS: USUARIOS Y MASCOTAS
// ==========================================

function setResource(resource) {
  state.resource = resource;

  $('#tab-users').classList.toggle(
    'active',
    resource === 'users'
  );

  $('#tab-pets').classList.toggle(
    'active',
    resource === 'pets'
  );

  $('#resource-title').textContent = names[resource];

  $('#resource-desc').textContent =
    resource === 'users'
      ? 'Gestiona usuarios, contraseñas protegidas y avatares mediante peticiones HTTP reales.'
      : 'Gestiona mascotas, vincúlalas a usuarios y sube hasta cinco imágenes por petición.';

  $('#records-title').textContent =
    resource === 'users'
      ? 'Usuarios registrados'
      : 'Mascotas registradas';

  $('#breadcrumb').textContent = names[resource];

  selectOperation('list');
  loadRecords();
}

// ==========================================
// SELECCIÓN DE OPERACIONES HTTP
// ==========================================

function selectOperation(id) {
  state.operation = id;

  const op = operations.find((x) => x.id === id);

  $('#operations').innerHTML = operations.map((x) => `
    <button
      class="op ${x.id === id ? 'active' : ''}"
      data-op="${x.id}"
    >
      <span class="verb ${x.method.toLowerCase()}">
        ${x.method}
      </span>
      ${x.name}
    </button>
  `).join('');

  $('#form-title').textContent = op.name;
  $('#method-pill').textContent = op.method;
  $('#method-pill').className = 'method-pill';
  $('#endpoint-method').textContent = op.method;

  $('#endpoint-path').textContent =
    `/api/${state.resource}${
      ['one', 'update', 'delete'].includes(id)
        ? '/:id'
        : ''
    }`;

  $('#fields').innerHTML = '';

  if (['one', 'update', 'delete'].includes(id)) {
    addField('id', 'ID del registro', 'id');
  }

  if (['create', 'update'].includes(id)) {
    schemas[state.resource].forEach((f) => {
      addField(...f);
    });
  }

  if (id === 'list') {
    $('#fields').innerHTML = `
      <p class="note">
        No necesitas enviar parámetros.
        Consulta todos los registros actuales.
      </p>
    `;
  }

  if (id === 'delete') {
    $('#fields').insertAdjacentHTML(
      'beforeend',
      `<p class="note">
        Atención: esta acción elimina el registro en el archivo JSON.
      </p>`
    );
  }
}

// ==========================================
// CREACIÓN DINÁMICA DE CAMPOS
// ==========================================

function addField(key, label, type) {
  const container = document.createElement('div');
  container.className = 'field';

  const lab = document.createElement('label');
  lab.className = 'fieldlabel';
  lab.textContent = label;
  lab.htmlFor = 'f-' + key;

  container.append(lab);

  let el;

  if (type === 'select') {
    el = document.createElement('select');

    const options = [
      ['', 'Seleccionar…'],
      ['macho', 'Macho'],
      ['hembra', 'Hembra']
    ];

    options.forEach(([val, txt]) => {
      const o = document.createElement('option');

      o.value = val;
      o.textContent = txt;

      el.append(o);
    });

  } else if (type === 'owner') {
    el = document.createElement('input');
    el.type = 'text';
    el.setAttribute('list', 'owner-list');
    el.placeholder = 'UUID del usuario propietario';

    const list = document.createElement('datalist');
    list.id = 'owner-list';

    container.append(list);

    fetch('/api/users')
      .then((r) => r.json())
      .then((users) => {
        if (!Array.isArray(users)) return;

        list.replaceChildren();

        users.forEach((u) => {
          const option = document.createElement('option');

          option.value = u.id;
          option.label =
            u.nombre ||
            u.firstname ||
            u.usuario ||
            u.username ||
            u.id;

          list.append(option);
        });
      })
      .catch(() => {});

  } else {
    el = document.createElement('input');

    el.type =
      type === 'id'
        ? 'text'
        : type === 'multi'
          ? 'file'
          : type;

    if (type === 'number') {
      el.min = '0';
    }

    if (type === 'multi') {
      el.multiple = true;
    }

    if (type === 'file' || type === 'multi') {
      el.accept = 'image/png,image/jpeg,image/webp';
    }

    if (type === 'id') {
      el.placeholder = 'Pega aquí el UUID del registro';
    }

    if (type === 'password') {
      el.autocomplete = 'new-password';
    }
  }

  el.id = 'f-' + key;
  el.name = key;

  if (type === 'id') {
    el.required = true;
  }

  if (
    state.operation === 'create' &&
    !['avatar', 'img'].includes(key)
  ) {
    el.required = true;
  }

  if (state.operation === 'create' && key === 'img') {
    el.required = true;
  }

  container.append(el);

  if (type === 'multi') {
    const help = document.createElement('small');

    help.className = 'help';
    help.textContent =
      'Puedes seleccionar hasta 5 imágenes (máximo 5 MB por archivo). En PUT reemplaza las anteriores.';

    container.append(help);
  }

  $('#fields').append(container);
}

// ==========================================
// PETICIONES HTTP
// ==========================================

async function request(method, url, body) {
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method,
      ...(body ? { body } : {})
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = { respuesta: raw };
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      ms: Math.round(performance.now() - start)
    };

  } catch (e) {
    return {
      status: 0,
      ok: false,
      data: {
        error: 'No se pudo conectar con el servidor',
        detalle: e.message
      },
      ms: Math.round(performance.now() - start)
    };
  }
}

// ==========================================
// MOSTRAR RESPUESTA DE LA API
// ==========================================

function renderResponse(result, url) {
  const badge = $('#response-status');

  badge.textContent = result.status
    ? `${result.status} ${result.ok ? 'OK' : 'ERROR'}`
    : 'SIN CONEXIÓN';

  badge.className =
    'status ' + (result.ok ? 'success' : 'failure');

  $('#duration').textContent = result.ms + ' ms';
  $('#response-url').textContent = url;

  state.lastResponse = JSON.stringify(
    result.data,
    null,
    2
  );

  $('#response-json').textContent = state.lastResponse;
}

// ==========================================
// ENVÍO DEL FORMULARIO
// ==========================================

$('#request-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const op = operations.find(
    (x) => x.id === state.operation
  );

  const form = e.currentTarget;

  const id = form.elements
    .namedItem('id')
    ?.value.trim();

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

        files.forEach((file) => {
          body.append(key, file);
        });

      } else if (el.value.trim()) {
        body.append(key, el.value.trim());
      }
    }
  }

  if (
    state.operation === 'delete' &&
    !confirm('¿Eliminar este registro definitivamente?')
  ) {
    return;
  }

  const btn = $('#send-btn');

  btn.disabled = true;
  btn.textContent = 'Enviando…';

  const result = await request(op.method, url, body);

  renderResponse(result, url);

  btn.disabled = false;
  btn.textContent = '▶ Enviar petición';

  toast(
    result.ok
      ? 'Petición completada'
      : 'La petición devolvió un error'
  );

  if (result.ok && state.operation !== 'one') {
    loadRecords();
  }
});

// ==========================================
// CARGAR Y MOSTRAR REGISTROS
// ==========================================

async function loadRecords() {
  const resource = state.resource;
  const target = $('#records');

  target.innerHTML = `
    <div class="empty">
      Consultando registros…
    </div>
  `;

  const result = await request(
    'GET',
    '/api/' + resource
  );

  if (resource !== state.resource) return;

  if (!result.ok || !Array.isArray(result.data)) {
    target.innerHTML = `
      <div class="empty">
        No fue posible cargar registros.
      </div>
    `;
    return;
  }

  state.records = result.data;

  if (!result.data.length) {
    target.innerHTML = `
      <div class="empty">
        No hay registros todavía.
        Utiliza POST para crear el primero.
      </div>
    `;
    return;
  }

  target.replaceChildren();

  result.data.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'record';

    const top = document.createElement('div');
    top.className = 'record-top';

    const icon = document.createElement('div');
    icon.className = 'record-icon';

    icon.textContent =
      resource === 'users' ? '♙' : '♧';

    top.append(icon);
    card.append(top);

    // Título del registro
    const title = document.createElement('h4');

    title.textContent =
      resource === 'users'
        ? `${item.nombre || item.firstname || ''} ${
            item.apellidos || item.lastname || ''
          }`.trim() ||
          item.usuario ||
          item.username ||
          'Usuario'
        : `${item.especie || 'Mascota'} · ${
            item.color || 'Sin color'
          }`;

    card.append(title);

    // Información secundaria
    const sub = document.createElement('p');

    sub.textContent =
      resource === 'users'
        ? '@' + (
            item.usuario ||
            item.username ||
            'sin usuario'
          )
        : `Edad: ${item.edad ?? '—'} · Sexo: ${
            item.sexo || '—'
          }`;

    card.append(sub);

    // ID del registro
    const id = document.createElement('code');
    id.textContent = item.id;

    card.append(id);

    // Imágenes asociadas
    const images =
      resource === 'users'
        ? (item.avatar ? [item.avatar] : [])
        : (Array.isArray(item.img) ? item.img : []);

    images
      .filter((x) =>
        typeof x === 'string' &&
        x.startsWith('/img/')
      )
      .slice(0, 2)
      .forEach((src) => {
        const im = document.createElement('img');

        im.src = src;
        im.alt = 'Imagen guardada';
        im.loading = 'lazy';

        card.append(im);
      });

    // Botones de acciones
    const actions = document.createElement('div');
    actions.className = 'record-buttons';

    const buttons = [
      ['one', 'Ver'],
      ['update', 'Editar'],
      ['delete', 'Eliminar']
    ];

    buttons.forEach(([action, text]) => {
      const b = document.createElement('button');

      b.textContent = text;

      b.onclick = () => {
        selectOperation(action);

        $('#f-id').value = item.id;

        if (action === 'update') {
          schemas[resource].forEach(([key]) => {
            const el = $('#f-' + key);

            if (
              el &&
              el.type !== 'file' &&
              item[key] != null
            ) {
              el.value = item[key];
            }
          });
        }

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      };

      actions.append(b);
    });

    card.append(actions);
    target.append(card);
  });
}

// ==========================================
// EVENTOS DE NAVEGACIÓN Y BOTONES
// ==========================================

$('#operations').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-op]');

  if (btn) {
    selectOperation(btn.dataset.op);
  }
});

document.querySelectorAll('.nav').forEach((b) => {
  b.addEventListener('click', () => {
    navigate(b.dataset.page);
  });
});

document.querySelectorAll('[data-go]').forEach((b) => {
  b.addEventListener('click', () => {
    navigate(b.dataset.go);
  });
});

$('#tab-users').onclick = () => setResource('users');
$('#tab-pets').onclick = () => setResource('pets');

$('#load-records').onclick = loadRecords;

$('#refresh-list').onclick = () => {
  selectOperation('list');
  $('#request-form').requestSubmit();
};

// Copiar respuesta JSON
$('#copy-response').onclick = () => {
  navigator.clipboard
    .writeText(state.lastResponse)
    .then(() => toast('JSON copiado'))
    .catch(() => toast('No se pudo copiar'));
};

// ==========================================
// PLAYGROUND: PETICIONES HTTP LIBRES
// ==========================================

$('#free-send').onclick = async () => {
  const method = $('#free-method').value;
  const url = $('#free-path').value.trim();

  if (!url.startsWith('/') || url.startsWith('//')) {
    return toast('La ruta debe comenzar con /');
  }

  let body;

  const raw = $('#free-body').value.trim();

  if (
    raw &&
    method !== 'GET' &&
    method !== 'DELETE'
  ) {
    try {
      body = JSON.stringify(JSON.parse(raw));
    } catch {
      return toast('JSON inválido');
    }
  }

  const t = performance.now();

  try {
    const response = await fetch(url, {
      method,
      headers: body
        ? { 'Content-Type': 'application/json' }
        : {},
      body
    });

    const txt = await response.text();

    let parsed;

    try {
      parsed = JSON.parse(txt);
    } catch {
      parsed = txt;
    }

    $('#free-response').textContent =
      typeof parsed === 'string'
        ? parsed
        : JSON.stringify(parsed, null, 2);

    $('#free-status').textContent =
      `${response.status} · ${
        Math.round(performance.now() - t)
      } ms`;

    $('#free-status').className =
      'status ' + (
        response.ok ? 'success' : 'failure'
      );

  } catch (e) {
    $('#free-response').textContent = e.message;
    $('#free-status').textContent = 'SIN CONEXIÓN';
    $('#free-status').className = 'status failure';
  }
};

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================

fetch('/api/users')
  .then((r) => {
    $('#api-health').textContent =
      r.ok ? 'Conectada' : 'Error ' + r.status;
  })
  .catch(() => {
    $('#api-health').textContent = 'Desconectada';
  });

navigate('overview');
