import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import LoginView from './views/LoginView';
import TiqueterasView from './views/TiqueterasView';
import ClientesView from './views/ClientesView';
import ConsumoView from './views/ConsumoView';
import UsuariosView from './views/UsuariosView';
import SuperAdminView from './views/SuperAdminView';
import ActivacionView from './views/ActivacionView';
import ClienteTiqueteraView from './views/ClienteTiqueteraView';
import { extractQrToken } from './utils/qr';

/**
 * RNF-02 & RNF-08: Separación estricta de rutas por rol (consola restaurante vs vista pública del cliente).
 */
function parseRouteFromUrl() {
  if (typeof window === 'undefined') return { mode: 'restaurante' };
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Ruta pública de consulta del QR (HU-C3, HU-C4, HU-C5)
  if (path.startsWith('/tiquetera/') || path.startsWith('/qr/') || params.get('qr')) {
    const token = extractQrToken(params.get('qr') || path);
    if (token) {
      return { mode: 'cliente-tiquetera', qrToken: token };
    }
  }

  // Ruta pública de activación de tiquetera (HU-C1, HU-C2)
  if (path.startsWith('/activar') || params.has('codigo') || params.has('activar')) {
    return {
      mode: 'cliente-activar',
      codigo: params.get('codigo') || '',
    };
  }

  return { mode: 'restaurante' };
}

function DashboardContent() {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const [route, setRoute] = useState(parseRouteFromUrl);
  const [activeTab, setActiveTab] = useState('tiqueteras');
  const [preselectedClient, setPreselectedClient] = useState(null);
  const [qrParaConsumo, setQrParaConsumo] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handlePopState = () => setRoute(parseRouteFromUrl());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showToast = (toastData) => {
    setToast({
      ...toastData,
      id: Date.now(),
    });
  };

  const navigateToActivar = (codigo = '') => {
    const cleanCode = typeof codigo === 'string' ? codigo : '';
    const nextUrl = cleanCode ? `/activar?codigo=${encodeURIComponent(cleanCode)}` : '/activar';
    window.history.pushState({}, '', nextUrl);
    setRoute({ mode: 'cliente-activar', codigo: cleanCode });
  };

  const navigateToClienteTiquetera = (qrToken) => {
    const cleanToken = extractQrToken(qrToken);
    if (!cleanToken) return;
    window.history.pushState({}, '', `/tiquetera/${encodeURIComponent(cleanToken)}`);
    setRoute({ mode: 'cliente-tiquetera', qrToken: cleanToken });
  };

  const handleEmitirTiquetera = (cliente) => {
    setPreselectedClient(cliente);
    setActiveTab('tiqueteras');
  };

  const handleAbrirConsumo = (qrToken) => {
    setQrParaConsumo(qrToken);
    setActiveTab('consumo');
  };

  // Rutas públicas independientes del cliente (/activar y /tiquetera/:qrToken)
  if (route.mode === 'cliente-activar') {
    return (
      <>
        <ActivacionView
          key={route.codigo || 'activar'}
          initialCodigo={route.codigo}
          onOpenTiquetera={navigateToClienteTiquetera}
          onShowToast={showToast}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  if (route.mode === 'cliente-tiquetera') {
    return (
      <>
        <ClienteTiqueteraView
          qrToken={route.qrToken}
          onGoToActivar={() => navigateToActivar('')}
          onShowToast={showToast}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  if (isSuperAdmin) {
    return (
      <>
        <SuperAdminView onShowToast={showToast} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F9F5F1] text-[#333333] flex flex-col selection:bg-[#FF6B47] selection:text-white">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-10">
        {activeTab === 'tiqueteras' && (
          <TiqueterasView
            preselectedClient={preselectedClient}
            onClearPreselectedClient={() => setPreselectedClient(null)}
            onShowToast={showToast}
            onAbrirConsumo={handleAbrirConsumo}
          />
        )}

        {activeTab === 'consumo' && (
          <ConsumoView
            initialQrToken={qrParaConsumo}
            onClearInitialQr={() => setQrParaConsumo(null)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientesView
            onEmitirTiquetera={handleEmitirTiquetera}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'usuarios' && (
          <UsuariosView onShowToast={showToast} />
        )}
      </main>

      <footer className="hidden md:block border-t border-[#E5DED4] bg-white/60 py-5 text-center text-xs text-[#64829E]">
        <p>Tiquetera — Control de almuerzos para restaurantes</p>
      </footer>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
