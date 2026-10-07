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
    setToast(toastData);
  };

  const handleEmitirTiquetera = (cliente) => {
    setPreselectedClient(cliente);
    setActiveTab('tiqueteras');
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          Tiquetera — Sistema Web para Restaurantes · Sprint 1 (HU-R1, HU-R2, HU-R3, HU-R11, HU-R12)
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
