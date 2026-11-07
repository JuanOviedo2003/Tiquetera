import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { copyToClipboard } from '../utils/qr';
import {
  Store,
  Plus,
  Mail,
  Shield,
  Users,
  Loader2,
  LogOut,
  CheckCircle2,
  KeyRound,
  History,
  ArrowLeft,
  Trash2,
  DollarSign,
  Power,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Ticket,
  RefreshCw,
  Edit3,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';

function formatCurrency(val) {
  const num = Number(val || 0);
  return num.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

function formatDateTime(iso) {
  if (!iso) return 'Sin registro';
  return String(iso).slice(0, 19).replace('T', ' ');
}

export default function SuperAdminView({ onShowToast }) {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('restaurantes'); // 'restaurantes' | 'pines'

  // Listado de restaurantes
  const [restaurantes, setRestaurantes] = useState([]);
  const [loadingRestaurantes, setLoadingRestaurantes] = useState(true);

  // Detalle de un restaurante seleccionado
  const [selectedRestauranteId, setSelectedRestauranteId] = useState(null);
  const [restTiqueteras, setRestTiqueteras] = useState([]);
  const [loadingRestDetalle, setLoadingRestDetalle] = useState(false);
  const [filtroEstadoTiq, setFiltroEstadoTiq] = useState('');
  const [busquedaTiqRest, setBusquedaTiqRest] = useState('');

  // Formulario de edición de credenciales y precio dentro del detalle del restaurante
  const [editRestForm, setEditRestForm] = useState({
    name: '',
    email: '',
    password: '',
    precio_tiquetera: 0,
  });
  const [savingRestUpdate, setSavingRestUpdate] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // Modal: Crear nuevo restaurante
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    precio_tiquetera: '',
  });
  const [creatingRest, setCreatingRest] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Modal: Confirmar eliminación de restaurante
  const [restAEliminar, setRestAEliminar] = useState(null);
  const [deletingRest, setDeletingRest] = useState(false);

  // Modal: Confirmar eliminación de tiquetera (cualquier estado)
  const [tiqAEliminar, setTiqAEliminar] = useState(null);
  const [deletingTiq, setDeletingTiq] = useState(false);
  const [updatingTiqId, setUpdatingTiqId] = useState(null);

  // Gestión y trazabilidad de PINes
  const [pinesData, setPinesData] = useState({ tiqueteras: [], historial: [] });
  const [loadingPines, setLoadingPines] = useState(false);
  const [filtroRestPin, setFiltroRestPin] = useState('');
  const [busquedaPin, setBusquedaPin] = useState('');
  const [visiblePins, setVisiblePins] = useState({});
  const [copiedPinId, setCopiedPinId] = useState(null);

  // Modal: Cambiar PIN desde Admin
  const [tiqParaCambioPin, setTiqParaCambioPin] = useState(null);
  const [nuevoPinAdmin, setNuevoPinAdmin] = useState('');
  const [savingPinAdmin, setSavingPinAdmin] = useState(false);
  const [errorPinAdmin, setErrorPinAdmin] = useState(null);

  // Modal: Ver trazabilidad de PIN de una tiquetera específica
  const [tiqHistorialModal, setTiqHistorialModal] = useState(null);

  const userName = user?.nombre || user?.name || 'Superusuario';
  const userInitial = userName.charAt(0).toUpperCase();

  const selectedRestaurante =
    restaurantes.find((r) => String(r.id) === String(selectedRestauranteId)) || null;

  const fetchRestaurantes = useCallback(async () => {
    setLoadingRestaurantes(true);
    try {
      const data = await api.getRestaurantes();
      setRestaurantes(data || []);
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Error de Lectura',
        message: err.message || 'No se pudieron consultar los perfiles de restaurantes',
      });
    } finally {
      setLoadingRestaurantes(false);
    }
  }, [onShowToast]);

  const fetchPinesYHistorial = useCallback(
    async (restauranteIdParam = '') => {
      setLoadingPines(true);
      try {
        const data = await api.adminGetPines(
          restauranteIdParam ? { restaurante_id: restauranteIdParam } : {}
        );
        setPinesData({
          tiqueteras: data?.tiqueteras || [],
          historial: data?.historial || [],
        });
      } catch (err) {
        onShowToast?.({
          type: 'error',
          title: 'Error de Consulta',
          message: err.message || 'No se pudo cargar la trazabilidad de PINes',
        });
      } finally {
        setLoadingPines(false);
      }
    },
    [onShowToast]
  );

  const fetchRestauranteTiqueteras = useCallback(
    async (restauranteId) => {
      if (!restauranteId) return;
      setLoadingRestDetalle(true);
      try {
        const data = await api.adminGetPines({ restaurante_id: restauranteId });
        setRestTiqueteras(data?.tiqueteras || []);
      } catch (err) {
        onShowToast?.({
          type: 'error',
          title: 'Error al cargar tiqueteras',
          message: err.message || 'No se pudieron cargar las tiqueteras del restaurante',
        });
      } finally {
        setLoadingRestDetalle(false);
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    fetchRestaurantes();
    fetchPinesYHistorial();
  }, [fetchRestaurantes, fetchPinesYHistorial]);

  const handleOpenRestaurante = (rest) => {
    setSelectedRestauranteId(rest.id);
    setEditRestForm({
      name: rest.name || '',
      email: rest.email || '',
      password: '',
      precio_tiquetera: rest.precio_tiquetera ?? 0,
    });
    setFiltroEstadoTiq('');
    setBusquedaTiqRest('');
    fetchRestauranteTiqueteras(rest.restaurante_id);
  };

  const handleCreateRestaurante = async (e) => {
    e.preventDefault();
    if (
      !createFormData.name.trim() ||
      !createFormData.email.trim() ||
      !createFormData.password.trim()
    ) {
      setCreateError('Por favor completa el nombre del restaurante, correo y contraseña');
      return;
    }

    setCreatingRest(true);
    setCreateError(null);
    try {
      await api.createRestaurante({
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        password: createFormData.password,
        precio_tiquetera: Number(createFormData.precio_tiquetera || 0),
      });
      onShowToast?.({
        type: 'success',
        title: 'Restaurante Creado',
        message: `El perfil y las credenciales para "${createFormData.name}" fueron habilitados correctamente.`,
      });
      setIsCreateModalOpen(false);
      setCreateFormData({ name: '', email: '', password: '', precio_tiquetera: '' });
      fetchRestaurantes();
    } catch (err) {
      setCreateError(err.message || 'No fue posible registrar el restaurante');
    } finally {
      setCreatingRest(false);
    }
  };

  const handleSaveRestauranteChanges = async (e) => {
    e.preventDefault();
    if (!selectedRestaurante) return;

    setSavingRestUpdate(true);
    try {
      const payload = {
        name: editRestForm.name.trim(),
        email: editRestForm.email.trim(),
        precio_tiquetera: Number(editRestForm.precio_tiquetera || 0),
      };
      if (editRestForm.password.trim()) {
        payload.password = editRestForm.password.trim();
      }

      const updated = await api.updateRestaurante(selectedRestaurante.id, payload);
      setRestaurantes((prev) =>
        prev.map((r) => (String(r.id) === String(updated.id) ? updated : r))
      );
      setEditRestForm((prev) => ({ ...prev, password: '' }));

      onShowToast?.({
        type: 'success',
        title: 'Restaurante Actualizado',
        message: 'Se guardaron los cambios de credenciales y precio de tiquetera.',
      });
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Error al Actualizar',
        message: err.message || 'No se pudieron guardar los cambios del restaurante',
      });
    } finally {
      setSavingRestUpdate(false);
    }
  };

  const handleToggleRestauranteActivo = async (rest) => {
    if (!rest) return;
    setTogglingActive(true);
    try {
      const nextActive = !rest.active;
      const updated = await api.updateRestaurante(rest.id, { active: nextActive });
      setRestaurantes((prev) =>
        prev.map((r) => (String(r.id) === String(updated.id) ? updated : r))
      );
      onShowToast?.({
        type: 'success',
        title: nextActive ? 'Restaurante Activado' : 'Restaurante Desactivado',
        message: nextActive
          ? `El acceso para "${updated.name}" fue habilitado nuevamente.`
          : `El acceso para "${updated.name}" y su equipo fue suspendido.`,
      });
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Error de Estado',
        message: err.message || 'No se pudo cambiar el estado del restaurante',
      });
    } finally {
      setTogglingActive(false);
    }
  };

  const handleConfirmDeleteRestaurante = async () => {
    if (!restAEliminar) return;
    setDeletingRest(true);
    try {
      await api.deleteRestaurante(restAEliminar.id);
      onShowToast?.({
        type: 'success',
        title: 'Restaurante Eliminado',
        message: `El restaurante "${restAEliminar.name}" y sus registros asociados fueron eliminados.`,
      });
      if (String(selectedRestauranteId) === String(restAEliminar.id)) {
        setSelectedRestauranteId(null);
      }
      setRestAEliminar(null);
      fetchRestaurantes();
      fetchPinesYHistorial();
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Error al Eliminar',
        message: err.message || 'No se pudo eliminar el restaurante',
      });
    } finally {
      setDeletingRest(false);
    }
  };

  const handleCambiarEstadoTiquetera = async (tiq, nuevoEstado) => {
    if (!tiq || tiq.estado === nuevoEstado) return;
    setUpdatingTiqId(tiq.id);
    try {
      await api.adminCambiarEstadoTiquetera(tiq.id, nuevoEstado);
      onShowToast?.({
        type: 'success',
        title: 'Estado de Tiquetera Actualizado',
        message: `La tiquetera de ${tiq.cliente_nombre || 'Cliente'} pasó a estado ${nuevoEstado}.`,
      });
      if (selectedRestaurante?.restaurante_id) {
        fetchRestauranteTiqueteras(selectedRestaurante.restaurante_id);
      }
      fetchRestaurantes();
      fetchPinesYHistorial();
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Error al Cambiar Estado',
        message: err.message || 'No se pudo actualizar el estado de la tiquetera',
      });
    } finally {
      setUpdatingTiqId(null);
    }
  };

  const handleConfirmDeleteTiquetera = async () => {
    if (!tiqAEliminar) return;
    setDeletingTiq(true);
    try {
      await api.adminDeleteTiquetera(tiqAEliminar.id);
      onShowToast?.({
        type: 'success',
        title: 'Tiquetera Eliminada',
        message: `La tiquetera de ${tiqAEliminar.cliente_nombre || 'Cliente'} fue eliminada por el administrador.`,
      });
      setTiqAEliminar(null);
      if (selectedRestaurante?.restaurante_id) {
        fetchRestauranteTiqueteras(selectedRestaurante.restaurante_id);
      }
      fetchRestaurantes();
      fetchPinesYHistorial();
    } catch (err) {
      onShowToast?.({
        type: 'error',
        title: 'Error al Eliminar Tiquetera',
        message: err.message || 'No se pudo eliminar la tiquetera',
      });
    } finally {
      setDeletingTiq(false);
    }
  };

  const handleOpenModalCambiarPin = (tiq) => {
    setTiqParaCambioPin(tiq);
    setNuevoPinAdmin(tiq.pin_actual || '');
    setErrorPinAdmin(null);
  };

  const handleConfirmCambiarPinAdmin = async (e) => {
    e.preventDefault();
    if (!tiqParaCambioPin) return;
    const cleanPin = nuevoPinAdmin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorPinAdmin('El PIN debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    setSavingPinAdmin(true);
    setErrorPinAdmin(null);
    try {
      await api.adminCambiarPinTiquetera(tiqParaCambioPin.id, cleanPin);
      onShowToast?.({
        type: 'success',
        title: 'PIN Actualizado por Admin',
        message: `Nuevo PIN (${cleanPin}) asignado a la tiquetera de ${tiqParaCambioPin.cliente_nombre}.`,
      });
      setTiqParaCambioPin(null);
      setNuevoPinAdmin('');
      if (selectedRestaurante?.restaurante_id) {
        fetchRestauranteTiqueteras(selectedRestaurante.restaurante_id);
      }
      fetchPinesYHistorial();
    } catch (err) {
      setErrorPinAdmin(err.message || 'No se pudo actualizar el PIN');
    } finally {
      setSavingPinAdmin(false);
    }
  };

  const togglePinVisibility = (tiqId) => {
    setVisiblePins((prev) => ({ ...prev, [tiqId]: !prev[tiqId] }));
  };

  const handleCopyPin = async (tiqId, pinValue) => {
    if (!pinValue) return;
    try {
      await copyToClipboard(pinValue);
      setCopiedPinId(tiqId);
      onShowToast?.({
        type: 'success',
        title: 'PIN Copiado',
        message: `PIN ${pinValue} copiado al portapapeles.`,
      });
      setTimeout(() => setCopiedPinId(null), 2000);
    } catch {
      onShowToast?.({
        type: 'error',
        title: 'Aviso',
        message: 'No fue posible copiar el PIN.',
      });
    }
  };

  // Filtrado de tiqueteras dentro de un restaurante
  const tiqueterasRestFiltradas = restTiqueteras.filter((t) => {
    if (filtroEstadoTiq && t.estado !== filtroEstadoTiq) return false;
    if (busquedaTiqRest.trim()) {
      const q = busquedaTiqRest.trim().toLowerCase();
      const matchNombre = (t.cliente_nombre || '').toLowerCase().includes(q);
      const matchId = (t.id || '').toLowerCase().includes(q);
      const matchCodigo = (t.codigo_activacion || '').toLowerCase().includes(q);
      if (!matchNombre && !matchId && !matchCodigo) return false;
    }
    return true;
  });

  // Filtrado en la vista global de PINes
  const tiqueterasPinFiltradas = (pinesData.tiqueteras || []).filter((t) => {
    if (filtroRestPin && t.restaurante_id !== filtroRestPin) return false;
    if (busquedaPin.trim()) {
      const q = busquedaPin.trim().toLowerCase();
      const matchCliente = (t.cliente_nombre || '').toLowerCase().includes(q);
      const matchRest = (t.restaurante_nombre || '').toLowerCase().includes(q);
      const matchPin = (t.pin_actual || '').includes(q);
      const matchQr = (t.qr_token || '').toLowerCase().includes(q);
      if (!matchCliente && !matchRest && !matchPin && !matchQr) return false;
    }
    return true;
  });

  const historialPinFiltrado = (pinesData.historial || []).filter((h) => {
    if (filtroRestPin && h.restaurante_id !== filtroRestPin) return false;
    if (busquedaPin.trim()) {
      const q = busquedaPin.trim().toLowerCase();
      const matchCliente = (h.cliente_nombre || '').toLowerCase().includes(q);
      const matchRest = (h.restaurante_nombre || '').toLowerCase().includes(q);
      const matchPinNuevo = (h.pin_nuevo || '').includes(q);
      const matchPinAnt = (h.pin_anterior || '').includes(q);
      if (!matchCliente && !matchRest && !matchPinNuevo && !matchPinAnt) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9F5F1] text-[#333333] flex flex-col selection:bg-[#FF6B47] selection:text-white">
      {/* Header del Superusuario */}
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#E5DED4] backdrop-blur-md">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 h-16">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/favicon.svg?v=3"
                alt="Logo Tiquetera"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-sm shadow-[#FF6B47]/25 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-xl font-semibold tracking-tight text-[#333333] font-display truncate">
                    Tiquetera
                  </span>
                </div>
                <div className="text-[11px] text-[#64829E] flex items-center gap-1 truncate font-medium">
                  <Shield className="w-3 h-3 text-[#FF6B47] shrink-0" />
                  <span className="truncate">Superadministrador</span>
                </div>
              </div>
            </div>

            {/* Navegación Desktop del Superusuario */}
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveSection('restaurantes');
                }}
                className={`h-10 sm:h-11 flex items-center gap-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  activeSection === 'restaurantes'
                    ? 'bg-[#FF6B47] text-white border-[#FF6B47] shadow-sm shadow-[#FF6B47]/25'
                    : 'bg-[#F9F5F1] text-[#333333]/80 border-[#E5DED4] hover:text-[#333333]'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Restaurantes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSection('pines');
                  fetchPinesYHistorial();
                }}
                className={`h-10 sm:h-11 flex items-center gap-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  activeSection === 'pines'
                    ? 'bg-[#FF6B47] text-white border-[#FF6B47] shadow-sm shadow-[#FF6B47]/25'
                    : 'bg-[#F9F5F1] text-[#333333]/80 border-[#E5DED4] hover:text-[#333333]'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>PINes y Trazabilidad</span>
              </button>
            </nav>

            {/* Perfil y Cerrar Sesión con altura uniforme h-10 sm:h-11 */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div
                className="h-10 sm:h-11 flex items-center gap-2 bg-[#F9F5F1] px-2.5 sm:px-3.5 rounded-xl border border-[#E5DED4]"
                title={`Sesión iniciada: ${userName}`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#FF6B47]/15 text-[#FF6B47] flex items-center justify-center font-bold text-xs shrink-0">
                  {userInitial}
                </div>
                <div className="text-left max-w-[95px] sm:max-w-[140px]">
                  <div className="text-[11px] sm:text-xs font-semibold text-[#333333] leading-tight truncate">
                    {userName}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#64829E] flex items-center gap-1 leading-tight font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64829E] shrink-0" />
                    <span className="truncate">Superusuario</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="h-10 sm:h-11 flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-semibold text-[#333333]/80 hover:text-[#FF6B47] bg-[#F9F5F1] hover:bg-[#FF6B47]/10 border border-[#E5DED4] hover:border-[#FF6B47]/40 transition-all cursor-pointer shrink-0"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cuerpo principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-10 space-y-6">
        {activeSection === 'restaurantes' && !selectedRestaurante && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] tracking-tight font-display">
                  Perfiles de Restaurantes
                </h1>
                <p className="text-xs sm:text-sm text-[#64829E] mt-1">
                  Ingresa a cualquier restaurante para editar sus credenciales, activarlo/desactivarlo, configurar el precio por tiquetera y administrar sus tiqueteras
                </p>
              </div>

              <button
                onClick={() => {
                  setCreateError(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FF6B47] hover:bg-[#E85A37] text-white font-semibold text-sm shadow-md shadow-[#FF6B47]/25 transition-all cursor-pointer shrink-0 touch-press"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Restaurante</span>
              </button>
            </div>

            {loadingRestaurantes ? (
              <div className="p-12 text-center text-[#64829E] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#FF6B47]" />
                <p className="text-sm">Cargando perfiles de restaurantes...</p>
              </div>
            ) : restaurantes.length === 0 ? (
              <div className="bistro-card p-10 text-center">
                <Store className="w-12 h-12 text-[#64829E] mx-auto mb-3" />
                <h3 className="text-base font-semibold text-[#333333] font-display">
                  No hay restaurantes registrados
                </h3>
                <p className="text-xs sm:text-sm text-[#64829E] mt-1 max-w-sm mx-auto">
                  Crea el primer perfil de restaurante asignándole un correo electrónico, contraseña y precio por tiquetera.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {restaurantes.map((rest) => {
                  const resTiq = rest.resumen_tiqueteras || {
                    total: 0,
                    activas: 0,
                    finalizadas: 0,
                    pendientes: 0,
                    valor_estimado_total: 0,
                  };
                  const isActivo = rest.active !== false;

                  return (
                    <div
                      key={rest.id}
                      className={`bistro-card p-5 transition-all flex flex-col justify-between border ${
                        isActivo
                          ? 'border-[#E5DED4] hover:border-[#FF6B47]/50'
                          : 'border-[#FF6B47]/30 bg-[#F9F5F1]/70 opacity-90'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-[#FF6B47]/15 text-[#FF6B47] flex items-center justify-center font-bold text-base shrink-0 font-display">
                              <Store className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-[#333333] truncate font-display">
                                {rest.name}
                              </h3>
                              <div className="text-xs text-[#64829E] flex items-center gap-1.5 mt-0.5 truncate">
                                <Mail className="w-3.5 h-3.5 text-[#64829E] shrink-0" />
                                <span className="truncate">{rest.email}</span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide border shrink-0 ${
                              isActivo
                                ? 'bg-[#64829E]/15 text-[#64829E] border-[#64829E]/30'
                                : 'bg-[#FF6B47]/15 text-[#FF6B47] border-[#FF6B47]/30'
                            }`}
                          >
                            {isActivo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        {/* Resumen de tiqueteras del restaurante */}
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="bg-[#F9F5F1] rounded-xl p-2.5 border border-[#E5DED4] text-center">
                            <span className="text-[10px] text-[#64829E] font-medium block">
                              Activas
                            </span>
                            <span className="text-base font-bold text-[#64829E] font-display">
                              {resTiq.activas}
                            </span>
                          </div>
                          <div className="bg-[#F9F5F1] rounded-xl p-2.5 border border-[#E5DED4] text-center">
                            <span className="text-[10px] text-[#64829E] font-medium block">
                              Finalizadas
                            </span>
                            <span className="text-base font-bold text-[#333333] font-display">
                              {resTiq.finalizadas}
                            </span>
                          </div>
                          <div className="bg-[#F9F5F1] rounded-xl p-2.5 border border-[#E5DED4] text-center">
                            <span className="text-[10px] text-[#64829E] font-medium block">
                              Por Activar
                            </span>
                            <span className="text-base font-bold text-[#FF6B47] font-display">
                              {resTiq.pendientes}
                            </span>
                          </div>
                        </div>

                        {/* Precio por tiquetera y equipo */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5DED4] text-xs">
                          <div className="flex items-center gap-1.5 text-[#333333] font-medium">
                            <DollarSign className="w-3.5 h-3.5 text-[#FF6B47]" />
                            <span>
                              Precio tiquetera:{' '}
                              <strong>{formatCurrency(rest.precio_tiquetera)}</strong>
                            </span>
                          </div>

                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#F9F5F1] text-[#64829E] border border-[#E5DED4] flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#FF6B47]" />
                            <span>{rest.total_equipo || 1} equipo</span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E5DED4] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenRestaurante(rest)}
                          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer touch-press"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Administrar Restaurante</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRestAEliminar(rest)}
                          className="p-2.5 rounded-xl bg-[#F9F5F1] hover:bg-[#FF6B47]/15 text-[#64829E] hover:text-[#FF6B47] border border-[#E5DED4] transition-colors cursor-pointer"
                          title="Eliminar restaurante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VISTA DETALLADA DE UN RESTAURANTE SELECCIONADO */}
        {activeSection === 'restaurantes' && selectedRestaurante && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRestauranteId(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F9F5F1] text-[#333333] border border-[#E5DED4] text-xs font-semibold transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#FF6B47]" />
                  <span>Volver</span>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] font-display">
                      {selectedRestaurante.name}
                    </h1>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase border ${
                        selectedRestaurante.active !== false
                          ? 'bg-[#64829E]/15 text-[#64829E] border-[#64829E]/30'
                          : 'bg-[#FF6B47]/15 text-[#FF6B47] border-[#FF6B47]/30'
                      }`}
                    >
                      {selectedRestaurante.active !== false ? 'Activo' : 'Desactivado'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64829E] font-mono">
                    ID: {selectedRestaurante.restaurante_id} · Correo: {selectedRestaurante.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={togglingActive}
                  onClick={() => handleToggleRestauranteActivo(selectedRestaurante)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    selectedRestaurante.active !== false
                      ? 'bg-white hover:bg-[#FF6B47]/10 text-[#333333] border-[#E5DED4]'
                      : 'bg-[#64829E] hover:bg-[#526E88] text-white border-[#64829E]'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>
                    {selectedRestaurante.active !== false
                      ? 'Desactivar Restaurante'
                      : 'Activar Restaurante'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRestAEliminar(selectedRestaurante)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF6B47]/10 hover:bg-[#FF6B47] text-[#FF6B47] hover:text-white border border-[#FF6B47]/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Restaurante</span>
                </button>
              </div>
            </div>

            {/* Resumen de Tiqueteras y Valor Estimado según el Precio de Tiquetera */}
            {(() => {
              const precioUnit = Number(
                editRestForm.precio_tiquetera ?? selectedRestaurante.precio_tiquetera ?? 0
              );
              const totalCount = restTiqueteras.length;
              const activasCount = restTiqueteras.filter((t) => t.estado === 'ACTIVA').length;
              const finalizadasCount = restTiqueteras.filter(
                (t) => t.estado === 'FINALIZADA'
              ).length;
              const pendientesCount = restTiqueteras.filter(
                (t) => t.estado === 'PENDIENTE'
              ).length;

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bistro-card p-4">
                    <span className="text-xs text-[#64829E] font-medium block">
                      Tiqueteras Activas
                    </span>
                    <p className="text-2xl font-bold text-[#64829E] font-display mt-1">
                      {activasCount}
                    </p>
                    <span className="text-[11px] text-[#333333]/75 block mt-1">
                      Valor: <strong>{formatCurrency(activasCount * precioUnit)}</strong>
                    </span>
                  </div>

                  <div className="bistro-card p-4">
                    <span className="text-xs text-[#64829E] font-medium block">
                      Tiqueteras Finalizadas
                    </span>
                    <p className="text-2xl font-bold text-[#333333] font-display mt-1">
                      {finalizadasCount}
                    </p>
                    <span className="text-[11px] text-[#333333]/75 block mt-1">
                      Valor: <strong>{formatCurrency(finalizadasCount * precioUnit)}</strong>
                    </span>
                  </div>

                  <div className="bistro-card p-4">
                    <span className="text-xs text-[#64829E] font-medium block">
                      Por Activar (Pendientes)
                    </span>
                    <p className="text-2xl font-bold text-[#FF6B47] font-display mt-1">
                      {pendientesCount}
                    </p>
                    <span className="text-[11px] text-[#333333]/75 block mt-1">
                      Valor: <strong>{formatCurrency(pendientesCount * precioUnit)}</strong>
                    </span>
                  </div>

                  <div className="bistro-card p-4 bg-[#FF6B47]/5 border-[#FF6B47]/30">
                    <span className="text-xs text-[#FF6B47] font-semibold block">
                      Total Tiqueteras ({totalCount})
                    </span>
                    <p className="text-2xl font-bold text-[#333333] font-display mt-1">
                      {formatCurrency(totalCount * precioUnit)}
                    </p>
                    <span className="text-[11px] text-[#64829E] block mt-1">
                      Precio unitario: {formatCurrency(precioUnit)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Formulario de edición de Credenciales (Correo, Contraseña) y Precio por Tiquetera */}
            <form onSubmit={handleSaveRestauranteChanges} className="bistro-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DED4] pb-3">
                <div>
                  <h2 className="text-base font-semibold text-[#333333] font-display">
                    Credenciales de Acceso y Precio de Tiquetera
                  </h2>
                  <p className="text-xs text-[#64829E]">
                    Modifica el correo, cambia la contraseña o define el valor de cada tiquetera para visualizar las métricas del restaurante
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#333333] mb-1">
                    Nombre del Restaurante *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRestForm.name}
                    onChange={(e) => setEditRestForm({ ...editRestForm, name: e.target.value })}
                    className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#FF6B47]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#333333] mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={editRestForm.email}
                    onChange={(e) => setEditRestForm({ ...editRestForm, email: e.target.value })}
                    className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#FF6B47]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#333333] mb-1">
                    Nueva Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={editRestForm.password}
                    onChange={(e) =>
                      setEditRestForm({ ...editRestForm, password: e.target.value })
                    }
                    placeholder="Dejar vacío para conservar"
                    className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/60 focus:outline-none focus:border-[#FF6B47]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#333333] mb-1">
                    Precio por Tiquetera (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={editRestForm.precio_tiquetera}
                    onChange={(e) =>
                      setEditRestForm({ ...editRestForm, precio_tiquetera: e.target.value })
                    }
                    placeholder="Ej. 150000"
                    className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] focus:outline-none focus:border-[#FF6B47]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingRestUpdate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 touch-press"
                >
                  {savingRestUpdate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Guardar Cambios del Restaurante</span>
                </button>
              </div>
            </form>

            {/* Listado y Control Total de Tiqueteras del Restaurante */}
            <div className="bistro-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DED4] pb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#333333] font-display">
                    Tiqueteras del Restaurante ({tiqueterasRestFiltradas.length})
                  </h2>
                  <p className="text-xs text-[#64829E]">
                    Como Superadministrador puedes cambiar el estado de cualquier tiquetera, gestionar su PIN o eliminarla independientemente de su estado
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#64829E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={busquedaTiqRest}
                      onChange={(e) => setBusquedaTiqRest(e.target.value)}
                      placeholder="Buscar cliente o código..."
                      className="bg-[#F9F5F1] border border-[#E5DED4] rounded-xl pl-8 pr-3 py-2 text-xs text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47]"
                    />
                  </div>

                  <select
                    value={filtroEstadoTiq}
                    onChange={(e) => setFiltroEstadoTiq(e.target.value)}
                    className="bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-semibold text-[#333333] focus:outline-none focus:border-[#FF6B47]"
                  >
                    <option value="">Todos los estados</option>
                    <option value="ACTIVA">Activas</option>
                    <option value="PENDIENTE">Por Activar (Pendientes)</option>
                    <option value="FINALIZADA">Finalizadas</option>
                  </select>
                </div>
              </div>

              {loadingRestDetalle ? (
                <div className="py-10 text-center text-[#64829E] flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF6B47]" />
                  <span className="text-xs">Cargando tiqueteras...</span>
                </div>
              ) : tiqueterasRestFiltradas.length === 0 ? (
                <div className="py-10 text-center text-[#64829E] text-xs">
                  No se encontraron tiqueteras para este restaurante con los filtros seleccionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiqueterasRestFiltradas.map((tiq) => {
                    const isPinShown = Boolean(visiblePins[tiq.id]);
                    return (
                      <div
                        key={tiq.id}
                        className="p-4 rounded-2xl bg-[#F9F5F1] border border-[#E5DED4] flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-[#333333] font-display">
                                {tiq.cliente_nombre || 'Cliente'}
                              </h4>
                              <p className="text-[11px] text-[#64829E] font-mono">
                                ID: {tiq.id}
                              </p>
                            </div>

                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase border ${
                                tiq.estado === 'ACTIVA'
                                  ? 'bg-[#64829E]/15 text-[#64829E] border-[#64829E]/30'
                                  : tiq.estado === 'PENDIENTE'
                                  ? 'bg-[#FF6B47]/15 text-[#FF6B47] border-[#FF6B47]/30'
                                  : 'bg-white text-[#333333] border-[#E5DED4]'
                              }`}
                            >
                              {tiq.estado}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-[#E5DED4]">
                            <div>
                              <span className="text-[10px] text-[#64829E] block">
                                Almuerzos Disponibles
                              </span>
                              <strong className="text-sm text-[#333333] font-display">
                                {tiq.almuerzos_disponibles} / {tiq.total_almuerzos}
                              </strong>
                            </div>

                            <div>
                              <span className="text-[10px] text-[#64829E] block">PIN Actual</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-[#333333]">
                                  {tiq.pin_actual
                                    ? isPinShown
                                      ? tiq.pin_actual
                                      : '••••••'
                                    : 'Sin activar'}
                                </span>
                                {tiq.pin_actual && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => togglePinVisibility(tiq.id)}
                                      className="text-[#64829E] hover:text-[#333333] cursor-pointer"
                                      title={isPinShown ? 'Ocultar PIN' : 'Ver PIN'}
                                    >
                                      {isPinShown ? (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      ) : (
                                        <Eye className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPin(tiq.id, tiq.pin_actual)}
                                      className="text-[#64829E] hover:text-[#FF6B47] cursor-pointer"
                                      title="Copiar PIN"
                                    >
                                      {copiedPinId === tiq.id ? (
                                        <Check className="w-3.5 h-3.5 text-[#64829E]" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Control para cambiar estado libremente */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] font-semibold text-[#64829E]">
                              Cambiar estado:
                            </span>
                            <div className="flex items-center gap-1">
                              {['PENDIENTE', 'ACTIVA', 'FINALIZADA'].map((est) => (
                                <button
                                  key={est}
                                  type="button"
                                  disabled={updatingTiqId === tiq.id || tiq.estado === est}
                                  onClick={() => handleCambiarEstadoTiquetera(tiq, est)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                                    tiq.estado === est
                                      ? 'bg-[#333333] text-white border-[#333333]'
                                      : 'bg-white hover:bg-[#FF6B47]/10 text-[#333333] border-[#E5DED4]'
                                  }`}
                                >
                                  {est}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-[#E5DED4] flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenModalCambiarPin(tiq)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#64829E]/15 text-[#333333] border border-[#E5DED4] text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <KeyRound className="w-3 h-3 text-[#FF6B47]" />
                              <span>Cambiar PIN</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setTiqHistorialModal(tiq)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#64829E]/15 text-[#64829E] border border-[#E5DED4] text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <History className="w-3 h-3" />
                              <span>Trazabilidad ({tiq.historial_pin?.length || 0})</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setTiqAEliminar(tiq)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FF6B47]/10 hover:bg-[#FF6B47] text-[#FF6B47] hover:text-white border border-[#FF6B47]/30 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: GESTIÓN Y TRAZABILIDAD DE PINES DE USUARIOS */}
        {activeSection === 'pines' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#333333] tracking-tight font-display">
                  Gestión y Trazabilidad de PINes
                </h1>
                <p className="text-xs sm:text-sm text-[#64829E] mt-1">
                  Consulta los PINes actuales de las tiqueteras, modifícalos en caso de olvido y audita el historial completo de cambios de PIN
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchPinesYHistorial()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#64829E] hover:bg-[#526E88] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPines ? 'animate-spin' : ''}`} />
                <span>Actualizar Trazabilidad</span>
              </button>
            </div>

            {/* Filtros de búsqueda */}
            <div className="bistro-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#64829E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaPin}
                  onChange={(e) => setBusquedaPin(e.target.value)}
                  placeholder="Buscar por nombre del comensal, restaurante, PIN o token QR..."
                  className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47]"
                />
              </div>

              <select
                value={filtroRestPin}
                onChange={(e) => setFiltroRestPin(e.target.value)}
                className="bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#333333] focus:outline-none focus:border-[#FF6B47]"
              >
                <option value="">Todos los restaurantes</option>
                {restaurantes.map((r) => (
                  <option key={r.id} value={r.restaurante_id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Directorio de PINes Actuales por Tiquetera */}
            <div className="bistro-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DED4] pb-3">
                <div>
                  <h2 className="text-base font-semibold text-[#333333] font-display">
                    PINes Actuales de Tiqueteras ({tiqueterasPinFiltradas.length})
                  </h2>
                  <p className="text-xs text-[#64829E]">
                    Visualiza el PIN vigente de cada usuario, desbloquea intentos fallidos o asigna un nuevo PIN
                  </p>
                </div>
              </div>

              {loadingPines ? (
                <div className="py-10 text-center text-[#64829E] flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#FF6B47]" />
                  <span className="text-xs">Cargando directorio de PINes...</span>
                </div>
              ) : tiqueterasPinFiltradas.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64829E]">
                  No hay tiqueteras registradas para los criterios seleccionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tiqueterasPinFiltradas.map((tiq) => {
                    const isPinShown = Boolean(visiblePins[tiq.id]);
                    return (
                      <div
                        key={tiq.id}
                        className="p-4 rounded-2xl bg-[#F9F5F1] border border-[#E5DED4] flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-[#333333] truncate font-display">
                                {tiq.cliente_nombre}
                              </h3>
                              <p className="text-[11px] text-[#64829E] truncate">
                                Restaurante: <strong>{tiq.restaurante_nombre}</strong>
                              </p>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase border shrink-0 ${
                                tiq.estado === 'ACTIVA'
                                  ? 'bg-[#64829E]/15 text-[#64829E] border-[#64829E]/30'
                                  : tiq.estado === 'PENDIENTE'
                                  ? 'bg-[#FF6B47]/15 text-[#FF6B47] border-[#FF6B47]/30'
                                  : 'bg-white text-[#333333] border-[#E5DED4]'
                              }`}
                            >
                              {tiq.estado}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-[#E5DED4] flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-[#64829E] block uppercase font-semibold">
                                PIN Personal Actual
                              </span>
                              <span className="text-lg font-mono font-bold text-[#333333] tracking-widest">
                                {tiq.pin_actual
                                  ? isPinShown
                                    ? tiq.pin_actual
                                    : '••••••'
                                  : 'No asignado'}
                              </span>
                            </div>

                            {tiq.pin_actual && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => togglePinVisibility(tiq.id)}
                                  className="p-2 rounded-lg bg-[#F9F5F1] text-[#64829E] hover:text-[#333333] cursor-pointer"
                                  title={isPinShown ? 'Ocultar PIN' : 'Mostrar PIN'}
                                >
                                  {isPinShown ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPin(tiq.id, tiq.pin_actual)}
                                  className="p-2 rounded-lg bg-[#F9F5F1] text-[#64829E] hover:text-[#FF6B47] cursor-pointer"
                                  title="Copiar PIN"
                                >
                                  {copiedPinId === tiq.id ? (
                                    <Check className="w-4 h-4 text-[#64829E]" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="text-[11px] text-[#64829E] space-y-0.5">
                            <p>
                              Último cambio:{' '}
                              <strong className="text-[#333333]">
                                {formatDateTime(tiq.fecha_regeneracion_pin || tiq.fecha_activacion)}
                              </strong>
                            </p>
                            <p>
                              Cambios registrados:{' '}
                              <strong className="text-[#333333]">
                                {tiq.historial_pin?.length || 0}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-[#E5DED4] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModalCambiarPin(tiq)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold transition-all cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Cambiar PIN</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTiqHistorialModal(tiq)}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-[#64829E]/15 text-[#64829E] border border-[#E5DED4] text-xs font-semibold transition-all cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Trazabilidad</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bitácora Global de Trazabilidad de Cambios de PIN */}
            <div className="bistro-card p-5 sm:p-6 space-y-4">
              <div className="border-b border-[#E5DED4] pb-3">
                <h2 className="text-base font-semibold text-[#333333] font-display">
                  Bitácora de Trazabilidad de Cambios de PIN ({historialPinFiltrado.length})
                </h2>
                <p className="text-xs text-[#64829E]">
                  Registro histórico auditable con el PIN anterior, el nuevo PIN, fecha exacta y quién realizó el cambio
                </p>
              </div>

              {historialPinFiltrado.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64829E]">
                  Aún no se han registrado eventos de creación o cambio de PIN.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historialPinFiltrado.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-[#333333]">
                            {item.cliente_nombre}
                          </span>
                          <span className="text-[11px] text-[#64829E]">
                            ({item.restaurante_nombre})
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                              item.origen === 'SUPER_ADMIN'
                                ? 'bg-[#FF6B47]/15 text-[#FF6B47]'
                                : item.origen === 'ACTIVACION'
                                ? 'bg-[#64829E]/15 text-[#64829E]'
                                : 'bg-white text-[#333333] border border-[#E5DED4]'
                            }`}
                          >
                            {item.origen === 'SUPER_ADMIN'
                              ? 'Cambiado por Admin'
                              : item.origen === 'ACTIVACION'
                              ? 'Activación Inicial'
                              : 'Cambiado por Cliente'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64829E] font-mono">
                          Fecha: {formatDateTime(item.fecha_hora)} · Tiquetera: {item.tiquetera_id}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#E5DED4] self-start sm:self-center">
                        <div className="text-center">
                          <span className="text-[9px] text-[#64829E] block uppercase">
                            PIN Anterior
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#64829E]">
                            {item.pin_anterior || '—'}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#FF6B47]" />
                        <div className="text-center">
                          <span className="text-[9px] text-[#64829E] block uppercase">
                            PIN Nuevo
                          </span>
                          <span className="font-mono text-xs font-bold text-[#333333]">
                            {item.pin_nuevo}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Crear Perfil de Restaurante */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !creatingRest && setIsCreateModalOpen(false)}
        title="Crear Perfil de Restaurante"
      >
        <form onSubmit={handleCreateRestaurante} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs font-medium">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Nombre del restaurante *
            </label>
            <input
              type="text"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              placeholder="Ej. Restaurante La Casona"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Correo electrónico de acceso *
            </label>
            <input
              type="email"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              placeholder="admin@lacasona.com"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1">
              Precio de cada tiquetera (COP - opcional)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={createFormData.precio_tiquetera}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, precio_tiquetera: e.target.value })
              }
              placeholder="Ej. 150000"
              className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-sm text-[#333333] placeholder-[#64829E]/70 focus:outline-none focus:border-[#FF6B47] focus:ring-1 focus:ring-[#FF6B47]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5DED4]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64829E] hover:text-[#333333] hover:bg-[#F9F5F1] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creatingRest}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#FF6B47] hover:bg-[#E85A37] text-white shadow-md shadow-[#FF6B47]/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-press"
            >
              {creatingRest ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Crear Restaurante</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cambiar PIN de Tiquetera desde Admin */}
      <Modal
        isOpen={Boolean(tiqParaCambioPin)}
        onClose={() => !savingPinAdmin && setTiqParaCambioPin(null)}
        title="Asignar o Cambiar PIN de Tiquetera"
        maxWidth="max-w-md"
      >
        {tiqParaCambioPin && (
          <form onSubmit={handleConfirmCambiarPinAdmin} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] text-xs space-y-1">
              <p>
                Comensal: <strong className="text-[#333333]">{tiqParaCambioPin.cliente_nombre}</strong>
              </p>
              <p>
                PIN Actual:{' '}
                <strong className="font-mono text-[#FF6B47]">
                  {tiqParaCambioPin.pin_actual || 'Sin asignar'}
                </strong>
              </p>
            </div>

            {errorPinAdmin && (
              <div className="p-3 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 text-[#FF6B47] text-xs font-medium">
                {errorPinAdmin}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Nuevo PIN de 6 dígitos *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={nuevoPinAdmin}
                onChange={(e) => setNuevoPinAdmin(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="w-full bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-center text-2xl tracking-[0.4em] font-mono text-[#333333] focus:outline-none focus:border-[#FF6B47]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DED4]">
              <button
                type="button"
                onClick={() => setTiqParaCambioPin(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64829E] hover:text-[#333333] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPinAdmin || nuevoPinAdmin.length !== 6}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
              >
                {savingPinAdmin ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>Guardar PIN</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Historial de Trazabilidad de PIN de una Tiquetera */}
      <Modal
        isOpen={Boolean(tiqHistorialModal)}
        onClose={() => setTiqHistorialModal(null)}
        title="Trazabilidad de Cambios de PIN"
      >
        {tiqHistorialModal && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] text-xs space-y-1">
              <p>
                Comensal:{' '}
                <strong className="text-[#333333]">{tiqHistorialModal.cliente_nombre}</strong>
              </p>
              <p>
                PIN Vigente:{' '}
                <strong className="font-mono text-[#FF6B47]">
                  {tiqHistorialModal.pin_actual || 'Sin asignar'}
                </strong>
              </p>
            </div>

            {!tiqHistorialModal.historial_pin || tiqHistorialModal.historial_pin.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64829E]">
                No hay cambios de PIN registrados para esta tiquetera.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {tiqHistorialModal.historial_pin.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-[#F9F5F1] border border-[#E5DED4] flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#333333] block">
                        {h.origen === 'SUPER_ADMIN'
                          ? 'Modificado por Superusuario'
                          : h.origen === 'ACTIVACION'
                          ? 'Activación Inicial'
                          : 'Regenerado por Cliente'}
                      </span>
                      <span className="text-[11px] text-[#64829E] font-mono">
                        {formatDateTime(h.fecha_hora)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono bg-white px-3 py-1.5 rounded-lg border border-[#E5DED4]">
                      <span className="text-[#64829E]">{h.pin_anterior || '—'}</span>
                      <ArrowRight className="w-3 h-3 text-[#FF6B47]" />
                      <strong className="text-[#333333]">{h.pin_nuevo}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar eliminación de Restaurante */}
      <Modal
        isOpen={Boolean(restAEliminar)}
        onClose={() => !deletingRest && setRestAEliminar(null)}
        title="Eliminar Restaurante"
        maxWidth="max-w-md"
      >
        {restAEliminar && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 flex items-start gap-2.5 text-xs text-[#333333]">
              <AlertTriangle className="w-5 h-5 text-[#FF6B47] shrink-0 mt-0.5" />
              <div>
                ¿Estás seguro de eliminar el restaurante{' '}
                <strong>{restAEliminar.name}</strong> ({restAEliminar.email})? Se eliminarán sus
                usuarios, clientes y tiqueteras asociadas.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DED4]">
              <button
                type="button"
                onClick={() => setRestAEliminar(null)}
                disabled={deletingRest}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64829E] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingRest}
                onClick={handleConfirmDeleteRestaurante}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {deletingRest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Sí, Eliminar Restaurante</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar eliminación de Tiquetera desde Admin */}
      <Modal
        isOpen={Boolean(tiqAEliminar)}
        onClose={() => !deletingTiq && setTiqAEliminar(null)}
        title="Eliminar Tiquetera (Modo Administrador)"
        maxWidth="max-w-md"
      >
        {tiqAEliminar && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#FF6B47]/10 border border-[#FF6B47]/30 flex items-start gap-2.5 text-xs text-[#333333]">
              <AlertTriangle className="w-5 h-5 text-[#FF6B47] shrink-0 mt-0.5" />
              <div>
                Vas a eliminar la tiquetera de{' '}
                <strong>{tiqAEliminar.cliente_nombre || 'Cliente'}</strong> que se encuentra en
                estado <strong>{tiqAEliminar.estado}</strong>. Esta acción no se puede deshacer.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5DED4]">
              <button
                type="button"
                onClick={() => setTiqAEliminar(null)}
                disabled={deletingTiq}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64829E] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingTiq}
                onClick={handleConfirmDeleteTiquetera}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6B47] hover:bg-[#E85A37] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {deletingTiq ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Sí, Eliminar Tiquetera</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Barra fija inferior en móvil para alternar entre Restaurantes y PINes */}
      <nav
        aria-label="Navegación móvil del superusuario"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-[#E5DED4] backdrop-blur-xl pb-safe shadow-[0_-4px_20px_rgba(51,51,51,0.05)]"
      >
        <div className="grid grid-cols-2 max-w-md mx-auto py-1">
          <button
            type="button"
            onClick={() => setActiveSection('restaurantes')}
            className={`flex flex-col items-center justify-center py-2 px-1 transition-colors cursor-pointer ${
              activeSection === 'restaurantes' ? 'text-[#FF6B47]' : 'text-[#64829E]'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl ${
                activeSection === 'restaurantes' ? 'bg-[#FF6B47]/15' : ''
              }`}
            >
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold mt-0.5">Restaurantes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection('pines');
              fetchPinesYHistorial();
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 transition-colors cursor-pointer ${
              activeSection === 'pines' ? 'text-[#FF6B47]' : 'text-[#64829E]'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl ${
                activeSection === 'pines' ? 'bg-[#FF6B47]/15' : ''
              }`}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold mt-0.5">PINes y Trazabilidad</span>
          </button>
        </div>
      </nav>

      <footer className="hidden md:block border-t border-[#E5DED4] bg-white/60 py-5 text-center text-xs text-[#64829E]">
        <p>Tiquetera — Control de almuerzos para restaurantes</p>
      </footer>
    </div>
  );
}
