import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plansmart.ai',
  appName: 'PlanSmart AI',
  webDir: 'out',
  server: {
    url: 'http://192.168.0.102:9002',
    cleartext: true
  }
};

export default config;
