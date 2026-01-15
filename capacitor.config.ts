import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobee.app',
  appName: 'Jobee',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: 'body' as any,
      resizeOnFullScreen: true,
      style: 'dark' as any,
    },
  },
};

export default config;
