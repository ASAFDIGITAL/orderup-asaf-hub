import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.asafdigital.asafpos',
  appName: 'ASAF POS',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://8f7fa3b3-93cb-4056-aaf1-cc6ad7d519ac.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    BluetoothLe: {
      displayStrings: {
        scanning: 'מחפש מכשירים...',
        cancel: 'ביטול',
        availableDevices: 'מכשירים זמינים',
        noDeviceFound: 'לא נמצאו מכשירים'
      }
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
