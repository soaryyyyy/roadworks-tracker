import { defineStore } from 'pinia';
import { remoteConfig } from '@/services/firebase/routeworks.tracker';
import { fetchAndActivate, getNumber } from "firebase/remote-config";

const useConfigStore = defineStore('routeworks.tracker.config', {
  state: () => ({
    sessionDurationMillis: 3_600_000,
    isConfigLoaded: false
  }),
  actions: {
    async loadRemoteConfig() {
      await fetchAndActivate(remoteConfig);
      this.sessionDurationMillis = getNumber(remoteConfig, 'session_duration_millis');
      this.isConfigLoaded = true;
    }
  }
});

export { useConfigStore };