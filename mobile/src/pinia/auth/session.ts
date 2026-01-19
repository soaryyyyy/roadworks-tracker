import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';

export const useAuthSessionStore = defineStore('auth', {
  state: () => ({
    expirationDate: null as number | null,
  }),

  getters: {
    isExpired: (state) => {
      if (!state.expirationDate) {
        return true;
      }
      return Date.now() >= state.expirationDate;
    },
  },

  actions: {
    async loadSession() {
      const { value } = await Preferences.get({ key: 'session_expiration_date' });
      if (value) {
        this.expirationDate = Number(value);
      }
    },

    async setSession(expiresAt: number) {
      this.expirationDate = expiresAt;
      
      await Preferences.set({
        key: 'session_expiration_date',
        value: expiresAt.toString()
      });
    },

    async clearSession() {
      this.expirationDate = null;
      await Preferences.remove({ key: 'session_expiration_date' });
    }
  }
});