import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Mail, Lock, ArrowRight, KeyRound, QrCode, Store } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import TiqueteraLogo from '../components/TiqueteraLogo';

export default function LoginScreen({
  onGoClienteActivar,
  onGoClienteConsulta,
  onShowToast,
}) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      onShowToast?.({ type: 'error', message: 'Por favor completa todos los campos' });
      return;
    }
    try {
      await login(email.trim(), password);
      onShowToast?.({ type: 'success', message: 'Sesión iniciada' });
    } catch (err) {
      onShowToast?.({
        type: 'error',
        message: err.message || 'Credenciales no válidas para este restaurante',
      });
    }
  };

  return (
    <ScrollView
      contentContainerClassName="flex-grow p-5 justify-center bg-bg"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-7">
        <View className="mb-3.5 shadow-sm">
          <TiqueteraLogo size={64} />
        </View>
        <Text className="text-3xl font-semibold text-ink tracking-tight">Tiquetera</Text>
        <Text className="text-xs text-slate-blue mt-1 font-medium">
          Control de almuerzos para restaurantes
        </Text>
      </View>

      <View className="bg-white rounded-3xl border border-border p-6 mb-4 shadow-sm">
        <Text className="text-xs font-semibold text-ink mb-1.5">Correo electrónico</Text>
        <View className="flex-row items-center bg-bg border border-border rounded-xl px-3.5 mb-4">
          <Mail size={16} color="#64829E" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ejemplo@restaurante.com"
            placeholderTextColor="#64829E"
            keyboardType="email-address"
            autoCapitalize="none"
            className="flex-1 py-2.5 pl-2.5 text-sm text-ink"
          />
        </View>

        <Text className="text-xs font-semibold text-ink mb-1.5">Contraseña de acceso</Text>
        <View className="flex-row items-center bg-bg border border-border rounded-xl px-3.5 mb-5">
          <Lock size={16} color="#64829E" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64829E"
            secureTextEntry
            className="flex-1 py-2.5 pl-2.5 text-sm text-ink"
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-primary rounded-2xl py-3.5 px-4 flex-row items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFF" />
              <Text className="text-white font-semibold text-sm">Verificando acceso...</Text>
            </>
          ) : (
            <>
              <Text className="text-white font-semibold text-sm">Ingresar a Terminal</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Cuentas de demostración disponibles */}
        <View className="mt-5 pt-4 border-t border-border">
          <View className="flex-row items-center gap-1.5 mb-2.5">
            <KeyRound size={14} color="#FF6B47" />
            <Text className="text-xs font-semibold text-slate-blue">
              Cuentas de demostración disponibles:
            </Text>
          </View>
          <View className="gap-2">
            <TouchableOpacity
              onPress={() => handleQuickDemo('admin@tiquetera.com', 'admin123')}
              className="p-2.5 rounded-xl bg-bg border border-primary/35"
            >
              <Text className="text-xs font-bold text-primary">Superusuario</Text>
              <Text className="text-[11px] text-slate-blue">admin@tiquetera.com</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickDemo('prueba@gmail.com', '1234')}
              className="p-2.5 rounded-xl bg-bg border border-border"
            >
              <Text className="text-xs font-bold text-ink">Restaurante Demo</Text>
              <Text className="text-[11px] text-slate-blue">prueba@gmail.com</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleQuickDemo('cocina@tiquetera.com', 'cocina123')}
              className="p-2.5 rounded-xl bg-bg border border-border"
            >
              <Text className="text-xs font-bold text-ink">Cocina & Servicio</Text>
              <Text className="text-[11px] text-slate-blue">cocina@tiquetera.com</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-3xl border border-border p-5">
        <Text className="text-sm font-semibold text-ink mb-1">Portal del Cliente</Text>
        <Text className="text-xs text-slate-blue mb-3.5">
          Activa tu tiquetera con tu código de 6 dígitos o consulta tu saldo con el QR.
        </Text>
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={onGoClienteActivar}
            className="flex-1 bg-bg border border-border rounded-xl py-3 flex-row items-center justify-center gap-1.5"
          >
            <KeyRound size={15} color="#FF6B47" />
            <Text className="text-ink font-semibold text-xs">Activar código</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onGoClienteConsulta}
            className="flex-1 bg-bg border border-border rounded-xl py-3 flex-row items-center justify-center gap-1.5"
          >
            <QrCode size={15} color="#64829E" />
            <Text className="text-ink font-semibold text-xs">Consultar QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-center gap-1.5">
        <Store size={14} color="#64829E" />
        <Text className="text-xs text-slate-blue font-medium">
          Tiquetera — Control de almuerzos para restaurantes
        </Text>
      </View>
    </ScrollView>
  );
}
