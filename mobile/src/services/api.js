const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL || 'http://equipo-1-eleV-n-dev.apolobyte.online/api').replace(/\/+$/, '');

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Error ${res.status}: ${res.statusText}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  return handleResponse(res);
}

export const api = {

  // HU-R1: Inicio de Sesión
  login: (email, password) =>
    request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  // HU-R2: Clientes
  getClientes: (restauranteId = 'REST-1') =>
    request(
      restauranteId
        ? `/clientes?restaurante_id=${encodeURIComponent(restauranteId)}`
        : '/clientes'
    ),

  createCliente: ({ nombre, identificacion, telefono, restaurante_id = 'REST-1' }) =>
    request('/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        identificacion,
        telefono: telefono || null,
        restaurante_id,
      }),
    }),

  // HU-R3 & HU-R4: Tiqueteras
  getTiqueteras: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
    if (filters.cliente_nombre) params.append('cliente_nombre', filters.cliente_nombre);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fecha_creacion) params.append('fecha_creacion', filters.fecha_creacion);
    if (filters.restaurante_id) params.append('restaurante_id', filters.restaurante_id);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request(`/tiqueteras${q}`);
  },

  createTiquetera: ({ cliente_id, total_almuerzos, restaurante_id = 'REST-1' }) =>
    request('/tiqueteras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id,
        total_almuerzos: Number(total_almuerzos),
        restaurante_id,
      }),
    }),

  deleteTiquetera: (id) =>
    request(`/tiqueteras/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // HU-R12: Código de activación
  getCodigoActivacion: (id) =>
    request(`/tiqueteras/${encodeURIComponent(id)}/codigo-activacion`),

  reemitirCodigoActivacion: (id) =>
    request(`/tiqueteras/${encodeURIComponent(id)}/reemitir-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }),

  // HU-R5, HU-R6, HU-R7: QR, PIN y Rejilla
  getTiqueteraByQr: (qrToken) =>
    request(`/tiqueteras/qr/${encodeURIComponent(qrToken)}`),

  validarPin: ({ qr_token, pin }) =>
    request('/tiqueteras/validar-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_token, pin }),
    }),

  getRejilla: (qrToken) =>
    request(`/rejilla/${encodeURIComponent(qrToken)}`),

  // HU-R8, HU-R9, HU-R10: Consumos e Historial
  registrarConsumo: ({ tiquetera_id, pin, usuario_id, cuadros_seleccionados }) =>
    request('/consumos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tiquetera_id,
        pin,
        usuario_id,
        cantidad: cuadros_seleccionados.length,
        cuadros_seleccionados,
      }),
    }),

  revertirConsumo: ({ consumo_id, usuario_id, cuadro_deseleccionado, motivo }) =>
    request('/consumos/reversa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumo_id, usuario_id, cuadro_deseleccionado, motivo }),
    }),

  getHistorial: (tiqueteraId, fecha) => {
    const q = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
    return request(`/consumos/tiquetera/${encodeURIComponent(tiqueteraId)}${q}`);
  },

  // HU-R11 & SUPER_ADMIN
  getUsers: (restauranteId) => {
    const q = restauranteId ? `?restaurante_id=${encodeURIComponent(restauranteId)}` : '';
    return request(`/users${q}`);
  },

  createUser: ({ name, email, password, restaurante_id }) =>
    request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, restaurante_id }),
    }),

  getRestaurantes: () => request('/users/restaurantes'),

  createRestaurante: ({ name, email, password, precio_tiquetera = 0 }) =>
    request('/users/restaurantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, precio_tiquetera }),
    }),

  updateRestaurante: (id, payload) =>
    request(`/users/restaurantes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  deleteRestaurante: (id) =>
    request(`/users/restaurantes/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  adminGetPines: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.restaurante_id) params.append('restaurante_id', filters.restaurante_id);
    if (filters.tiquetera_id) params.append('tiquetera_id', filters.tiquetera_id);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request(`/tiqueteras/admin/pines${q}`);
  },

  adminCambiarPinTiquetera: (id, nuevo_pin) =>
    request(`/tiqueteras/${encodeURIComponent(id)}/admin-pin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevo_pin }),
    }),

  adminCambiarEstadoTiquetera: (id, estado) =>
    request(`/tiqueteras/${encodeURIComponent(id)}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    }),

  adminDeleteTiquetera: (id) =>
    request(`/tiqueteras/${encodeURIComponent(id)}?admin=true`, { method: 'DELETE' }),

  // HU-C1, HU-C2, HU-C3, HU-C4, HU-C5: Flujo Cliente
  activarTiquetera: ({ codigo_activacion, pin }) =>
    request('/tiqueteras/activar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_activacion, pin }),
    }),

  regenerarPin: ({ qr_token, pin_anterior, nuevo_pin }) =>
    request('/tiqueteras/regenerar-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_token, pin_anterior, nuevo_pin }),
    }),

  getVistaPublica: (qrToken) =>
    request(`/tiqueteras/public/qr/${encodeURIComponent(qrToken)}`),
};

export default api;
