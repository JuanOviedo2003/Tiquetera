import './global.css';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ticket, ScanLine, Users, UserCheck, LogOut, Store } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import TiqueteraLogo from './src/components/TiqueteraLogo';
import LoginScreen from './src/screens/LoginScreen';
import ActivacionScreen from './src/screens/ActivacionScreen';
import ClienteTiqueteraScreen from './src/screens/ClienteTiqueteraScreen';
import TiqueterasScreen from './src/screens/TiqueterasScreen';
import ConsumoScreen from './src/screens/ConsumoScreen';
import ClientesScreen from './src/screens/ClientesScreen';
import UsuariosScreen from './src/screens/UsuariosScreen';
import SuperAdminScreen from './src/screens/SuperAdminScreen';

const TABS = [
  { key: 'tiqueteras', label: 'Tiqueteras', Icon: Ticket },
  { key: 'consumo', label: 'Consumo', Icon: ScanLine },
  { key: 'clientes', label: 'Clientes', Icon: Users },
  { key: 'usuarios', label: 'Equipo', Icon: UserCheck },
];

function MainApp() {
  const { isAuthenticated, isSuperAdmin, initializing, logout, user } = useAuth();
  const [publicRoute, setPublicRoute] = useState(null);
  const [activeTab, setActiveTab] = useState('tiqueteras');
  const [qrParaConsumo, setQrParaConsumo] = useState(null);
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

  const userName = user?.nombre || user?.name || user?.email || 'Restaurante';
  const userInitial = userName.charAt(0).toUpperCase();

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
        onShowToast={showToast}
      />
    );
  } else if (isSuperAdmin) {
    content = <SuperAdminScreen onShowToast={showToast} />;
  } else {
    content = (
      <View className="flex-1">
        {/* Top Header Bar */}
        <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-border">
          <View className="flex-row items-center gap-2.5 flex-1">
            <TiqueteraLogo size={38} />
            <View>
              <Text className="text-lg font-semibold text-ink">Tiquetera</Text>
              <View className="flex-row items-center gap-1">
                <Store size={12} color="#64829E" />
                <Text className="text-[11px] text-slate-blue font-medium">
                  Control de Restaurante
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-2 bg-bg px-2.5 py-1.5 rounded-xl border border-border">
              <View className="w-6 h-6 rounded-lg bg-slate-blue/15 items-center justify-center">
                <Text className="text-xs font-bold text-slate-blue">{userInitial}</Text>
              </View>
              <View className="max-w-[80px]">
                <Text className="text-[11px] font-semibold text-ink" numberOfLines={1}>
                  {userName}
                </Text>
                <View className="flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-slate-blue" />
                  <Text className="text-[9px] text-slate-blue font-medium">Activo</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={logout}
              className="p-2.5 rounded-xl bg-bg border border-border"
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={16} color="#333333" />
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

        {/* Bottom Navigation Dock */}
        <View className="flex-row bg-white border-t border-border px-2 py-1.5">
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                className="flex-1 items-center justify-center py-1.5"
              >
                <View
                  className={`p-1.5 rounded-xl ${active ? 'bg-primary/15' : ''}`}
                >
                  <Icon size={20} color={active ? '#FF6B47' : '#64829E'} />
                </View>
                <Text
                  className={`text-[11px] mt-0.5 ${
                    active ? 'text-primary font-bold' : 'text-slate-blue font-medium'
                  }`}
                >
                  {label}
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
            toast.type === 'error' ? 'bg-primary' : 'bg-slate-blue'
          }`}
        >
          <Text className="text-white font-bold text-center text-xs">{toast.message}</Text>
        </View>
      )}
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
