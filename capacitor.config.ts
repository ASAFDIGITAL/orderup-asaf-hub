import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.8f7fa3b393cb4056aaf1cc6ad7d519ac',
  appName: 'ASAF POS',
  webDir: 'dist',
  server: {
    url: 'https://8f7fa3b3-93cb-4056-aaf1-cc6ad7d519ac.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
