import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../services/api';

export default function LoginScreen({
  onGoClienteActivar,
  onGoClienteConsulta,
  onOpenServerConfig,
  onShowToast,
}) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      onShowToast?.({ type: 'error', message: 'Ingresa correo y contraseña' });
      return;
    }
    try {
      await login(email.trim(), password);
      onShowToast?.({ type: 'success', message: 'Sesión iniciada' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Credenciales inválidas' });
    }
  };

  return (
    <ScrollView
      contentContainerClassName="flex-grow p-5 justify-center bg-bg"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center mb-6">
        <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center mb-2.5">
          <Text className="text-white text-3xl font-extrabold">T</Text>
        </View>
        <Text className="text-2xl font-extrabold text-ink">Tiquetera</Text>
        <Text className="text-xs text-muted mt-0.5">Control de almuerzos · App Móvil</Text>
      </View>

      <View className="bg-white rounded-2xl border border-border p-4 mb-3">
        <Text className="text-base font-bold text-ink mb-3">Acceso Restaurante / Admin</Text>
        <Text className="text-xs font-semibold text-ink mb-1.5">Correo electrónico</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="restaurante@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-3"
        />
        <Text className="text-xs font-semibold text-ink mb-1.5">Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-4"
        />
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-primary rounded-xl py-3.5 items-center justify-center"
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white font-bold text-sm">Iniciar sesión</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="bg-white rounded-2xl border border-border p-4 mb-3">
        <Text className="text-base font-bold text-ink mb-1.5">Soy Cliente</Text>
        <Text className="text-xs text-muted mb-3">
          Activa tu tiquetera con el código de 6 dígitos o consulta tu saldo y movimientos con tu QR.
        </Text>
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={onGoClienteActivar}
            className="flex-1 bg-white border border-border rounded-xl py-3 items-center"
          >
            <Text className="text-ink font-bold text-xs">Activar código</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onGoClienteConsulta}
            className="flex-1 bg-white border border-border rounded-xl py-3 items-center"
          >
            <Text className="text-ink font-bold text-xs">Consultar QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onOpenServerConfig} className="items-center mt-2 p-2">
        <Text className="text-xs text-muted font-semibold">
          Servidor API: {getApiBaseUrl()}
        </Text>
        <Text className="text-[11px] text-primary mt-0.5">
          Toca para cambiar o probar conexión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
