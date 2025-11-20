import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.asafdigital.asafpos',
  appName: 'ASAF POS',
  webDir: 'dist',
  bundledWebRuntime: false,
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
    webContentsDebuggingEnabled: true,
    // אפשר גישה לדומיין של Laravel
    cleartext: true
  },
  server: {
    // אפשר בקשות לכל דומיין חיצוני
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
