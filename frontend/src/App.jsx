import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import LoginView from './views/LoginView';
import TiqueterasView from './views/TiqueterasView';
import ClientesView from './views/ClientesView';
import UsuariosView from './views/UsuariosView';

function DashboardContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('tiqueteras');
  const [preselectedClient, setPreselectedClient] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (toastData) => {
    // Generate unique id and clean timestamp to force fresh render and animations
    setToast({
      ...toastData,
      id: Date.now(),
    });
  };

  const handleEmitirTiquetera = (cliente) => {
    setPreselectedClient(cliente);
    setActiveTab('tiqueteras');
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#0e1015] text-[#f4f1ea] flex flex-col selection:bg-[#e0533c] selection:text-white">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 md:pb-10">
        {activeTab === 'tiqueteras' && (
          <TiqueterasView
            preselectedClient={preselectedClient}
            onClearPreselectedClient={() => setPreselectedClient(null)}
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

      <footer className="hidden md:block border-t border-[#1f2430] py-5 text-center text-xs text-slate-400">
        <p>
          Tiquetera — Sistema Operativo de Control de Almuerzos y Pases para Restaurante
        </p>
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
