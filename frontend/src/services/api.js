const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper para procesar respuestas de la API
 */
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

export const api = {
  // ==========================================
  // HU-R1: Inicio de Sesión
  // ==========================================
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  // ==========================================
  // HU-R2: Registro y Consulta de Clientes
  // ==========================================
  async getClientes(restauranteId = 'REST-1') {
    const url = restauranteId
      ? `${API_BASE_URL}/clientes?restaurante_id=${encodeURIComponent(restauranteId)}`
      : `${API_BASE_URL}/clientes`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async createCliente({ nombre, identificacion, telefono, restaurante_id = 'REST-1' }) {
    const res = await fetch(`${API_BASE_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        identificacion,
        telefono: telefono || null,
        restaurante_id,
      }),
    });
    return handleResponse(res);
  },

  async getClienteById(id) {
    const res = await fetch(`${API_BASE_URL}/clientes/${encodeURIComponent(id)}`);
    return handleResponse(res);
  },

  // ==========================================
  // HU-R3 & HU-R4: Creación y Listado de Tiqueteras
  // ==========================================
  async getTiqueteras(filters = {}) {
    const params = new URLSearchParams();
    if (filters.cliente_id) params.append('cliente_id', filters.cliente_id);
    if (filters.cliente_nombre) params.append('cliente_nombre', filters.cliente_nombre);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fecha_creacion) params.append('fecha_creacion', filters.fecha_creacion);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/tiqueteras${queryString}`);
    return handleResponse(res);
  },

  async createTiquetera({ cliente_id, total_almuerzos, restaurante_id = 'REST-1' }) {
    const res = await fetch(`${API_BASE_URL}/tiqueteras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id,
        total_almuerzos: Number(total_almuerzos),
        restaurante_id,
      }),
    });
    return handleResponse(res);
  },

  // ==========================================
  // HU-R12: Entrega de Código de Activación & Reemisión
  // ==========================================
  async getCodigoActivacion(id) {
    const res = await fetch(`${API_BASE_URL}/tiqueteras/${encodeURIComponent(id)}/codigo-activacion`);
    return handleResponse(res);
  },

  async reemitirCodigoActivacion(id) {
    const res = await fetch(`${API_BASE_URL}/tiqueteras/${encodeURIComponent(id)}/reemitir-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  // ==========================================
  // HU-R11: Gestión de Usuarios del Restaurante
  // ==========================================
  async getUsers() {
    const res = await fetch(`${API_BASE_URL}/users`);
    return handleResponse(res);
  },

  async createUser({ name, email, password }) {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },
};

export default api;
