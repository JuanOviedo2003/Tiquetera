import './global.css';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import ActivacionScreen from './src/screens/ActivacionScreen';
import ClienteTiqueteraScreen from './src/screens/ClienteTiqueteraScreen';
import TiqueterasScreen from './src/screens/TiqueterasScreen';
import ConsumoScreen from './src/screens/ConsumoScreen';
import ClientesScreen from './src/screens/ClientesScreen';
import UsuariosScreen from './src/screens/UsuariosScreen';
import SuperAdminScreen from './src/screens/SuperAdminScreen';
import ServerConfigModal from './src/components/ServerConfigModal';

const TABS = [
  { key: 'tiqueteras', label: 'Tiqueteras' },
  { key: 'consumo', label: 'Consumo' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'usuarios', label: 'Usuarios' },
];

function MainApp() {
  const { isAuthenticated, isSuperAdmin, initializing, logout, user } = useAuth();
  const [publicRoute, setPublicRoute] = useState(null);
  const [activeTab, setActiveTab] = useState('tiqueteras');
  const [qrParaConsumo, setQrParaConsumo] = useState(null);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((t) => {
    setToast(t);
    setTimeout(() => {
      setToast((curr) => (curr === t ? null : curr));
    }, 3200);
  }, []);

  if (initializing) {
    return (
      <View className="flex-1 justify-center items-center bg-bg">
        <ActivityIndicator size="large" color="#FF6B47" />
      </View>
    );
  }

  let content = null;

  if (publicRoute?.mode === 'activar') {
    content = (
      <ActivacionScreen
        onBack={() => setPublicRoute(null)}
        onOpenTiquetera={(qrToken) => setPublicRoute({ mode: 'consulta', qrToken })}
        onShowToast={showToast}
      />
    );
  } else if (publicRoute?.mode === 'consulta') {
    content = (
      <ClienteTiqueteraScreen
        initialQrToken={publicRoute.qrToken || ''}
        onBack={() => setPublicRoute(null)}
        onShowToast={showToast}
      />
    );
  } else if (!isAuthenticated) {
    content = (
      <LoginScreen
        onGoClienteActivar={() => setPublicRoute({ mode: 'activar' })}
        onGoClienteConsulta={() => setPublicRoute({ mode: 'consulta', qrToken: '' })}
        onOpenServerConfig={() => setServerModalOpen(true)}
        onShowToast={showToast}
      />
    );
  } else if (isSuperAdmin) {
    content = <SuperAdminScreen onShowToast={showToast} />;
  } else {
    content = (
      <View className="flex-1">
        <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-border">
          <View>
            <Text className="text-lg font-extrabold text-ink">Tiquetera</Text>
            <Text className="text-[11px] text-muted">{user?.name || user?.email}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setServerModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-bg border border-border"
            >
              <Text className="text-xs font-bold text-ink">API</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={logout}
              className="px-2.5 py-1.5 rounded-lg bg-bg border border-border"
            >
              <Text className="text-xs font-bold text-red-600">Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1">
          {activeTab === 'tiqueteras' && (
            <TiqueterasScreen
              onAbrirConsumo={(qr) => {
                setQrParaConsumo(qr);
                setActiveTab('consumo');
              }}
              onShowToast={showToast}
            />
          )}
          {activeTab === 'consumo' && (
            <ConsumoScreen
              initialQrToken={qrParaConsumo}
              onClearInitialQr={() => setQrParaConsumo(null)}
              onShowToast={showToast}
            />
          )}
          {activeTab === 'clientes' && <ClientesScreen onShowToast={showToast} />}
          {activeTab === 'usuarios' && <UsuariosScreen onShowToast={showToast} />}
        </View>

        <View className="flex-row bg-white border-t border-border p-2 gap-1.5">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  active ? 'bg-primary-light' : ''
                }`}
              >
                <Text
                  className={`text-xs ${
                    active ? 'text-primary font-extrabold' : 'text-muted font-semibold'
                  }`}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <StatusBar style="dark" />
      {content}

      {toast && (
        <View
          className={`absolute top-14 left-4 right-4 p-3.5 rounded-xl shadow-md ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          <Text className="text-white font-bold text-center text-xs">{toast.message}</Text>
        </View>
      )}

      <ServerConfigModal
        visible={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
        onSaved={(url) => showToast({ type: 'success', message: `API: ${url}` })}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
