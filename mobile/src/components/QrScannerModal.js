import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { extractQrToken } from '../utils/qr';

export default function QrScannerModal({ visible, onClose, onScan }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  const handleBarcodeScanned = ({ data }) => {
    if (scanned) return;
    const token = extractQrToken(data);
    if (!token) return;
    setScanned(true);
    onScan(token);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-900">
        <View className="pt-12 pb-4 px-5 flex-row justify-between items-center bg-gray-800">
          <Text className="text-white text-lg font-bold">Escanear código QR</Text>
          <TouchableOpacity onPress={onClose} className="px-3.5 py-2 bg-primary rounded-xl">
            <Text className="text-white font-semibold">Cerrar</Text>
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-gray-200 text-base text-center">
              Comprobando permiso de cámara...
            </Text>
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 justify-center items-center p-6">
            <Text className="text-gray-200 text-base text-center mb-4">
              Se necesita permiso para usar la cámara y escanear el QR de la tiquetera.
            </Text>
            <TouchableOpacity onPress={requestPermission} className="bg-primary px-5 py-3 rounded-xl">
              <Text className="text-white font-bold text-base">Permitir cámara</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center">
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
            <View className="w-60 h-60 border-4 border-primary rounded-2xl bg-transparent" />
            <Text className="absolute bottom-12 text-white bg-black/70 px-4 py-2 rounded-full text-xs">
              Apunta la cámara al código QR de la tiquetera
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
