import { defineStore } from 'pinia';
import { checkNetworkStatus, subscribeToNetworkChanges, NetworkStatus } from '@/services/network';

export const useNetworkStore = defineStore('network', {
  state: () => ({
    isConnected: true,
    connectionType: 'wifi' as string,
    isInitialized: false,
  }),

  getters: {
    hasConnection: (state) => state.isConnected,
    isNetworkInitialized: (state) => state.isInitialized,
  },

  actions: {
    async initializeNetworkMonitoring() {
      if (this.isInitialized) return;

      // Vérifier le statut initial
      const initialStatus = await checkNetworkStatus();
      this.updateStatus(initialStatus);

      // S'abonner aux changements
      subscribeToNetworkChanges((status: NetworkStatus) => {
        this.updateStatus(status);
      });

      this.isInitialized = true;
    },

    updateStatus(status: NetworkStatus) {
      this.isConnected = status.connected;
      this.connectionType = status.connectionType;
    },

    setConnected(connected: boolean) {
      this.isConnected = connected;
    },
  },
});
