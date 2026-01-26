import { defineStore } from "pinia";
import { Geolocation } from "@capacitor/geolocation";
import { PermissionState } from "@capacitor/core";

interface PermissionStoreState {
  status: PermissionState;
}

/**
 * This store is only functionnal for mobile because there is
 * Geolocation.checkPermissions and Geolocation.requestPermissions in it
 * Don't forget to check if isPlatform('hybrid')
 */
const useGeoLocationPermissionStore = defineStore('geo-location-permission', {
  state: (): PermissionStoreState =>  ({
    status: 'prompt',
  }),

  getters: {
    isGranted: (state) => state.status === 'granted',
  },

  actions: {
    async loadStatus() {
      try {
        const status = await Geolocation.checkPermissions();
        this.status = status.location;
      } catch (error) {
        console.log(error);
      }
    },

    async requestPermission() {
      if (!this.isGranted) {
        try {
          const status = await Geolocation.requestPermissions();
          this.status = status.location;
        } catch (error) {
          console.log(error);
        }
      }
    }
  }
});

export { useGeoLocationPermissionStore };