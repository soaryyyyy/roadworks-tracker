import { defineStore } from 'pinia';
import { remoteConfig } from '@/services/firebase/routeworks-tracker';
import { activate, fetchAndActivate, getNumber } from "firebase/remote-config";

const useConfigStore = defineStore('firebase.routeworks-tracker.config', {
  state: () => ({
    sessionDurationMillis: 3_600_000,
  }),

  actions: {
    async loadRemoteConfig() {
      try {
        await fetchAndActivate(remoteConfig);
      } catch (error) { // If we are offline (utiliser cache firebase / default value)
        await activate(remoteConfig);
      } finally {
        const remoteValue = getNumber(remoteConfig, 'session_duration_millis');
        
        if (remoteValue > 0) {
          this.sessionDurationMillis = remoteValue;
        }
      }
    }
  }
});

export { useConfigStore };