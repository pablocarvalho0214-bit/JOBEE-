import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobee.app',
  appName: 'Jobee',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      style: 'dark',
    },
  },
};

export default config;
