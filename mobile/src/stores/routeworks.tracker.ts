import { defineStore } from 'pinia';
import routeWorksTracker from '@/services/firebase/routeworks.tracker';
import { fetchAndActivate, getNumber } from "firebase/remote-config";

const useConfigStore = defineStore('routeworks.tracker.config', {
  state: () => ({
    sessionDuration: 3600,
    isConfigLoaded: false
  }),
  actions: {
    async loadRemoteConfig() {
      await fetchAndActivate(routeWorksTracker.remoteConfig);
      this.sessionDuration = getNumber(routeWorksTracker.remoteConfig, 'session_duration');
      this.isConfigLoaded = true;
    }
  }
});

export default { useConfigStore };