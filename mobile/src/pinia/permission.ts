import { defineStore } from "pinia";
import { Geolocation } from "@capacitor/geolocation";
import { PermissionState } from "@capacitor/core";
import { isPlatform } from "@ionic/vue";

interface PermissionStoreState {
  geoLocationStatus: PermissionState;
}

/**
 * This store is only functionnal for mobile because there is
 * Geolocation.checkPermissions and Geolocation.requestPermissions in it
 * Don't forget to check if isPlatform('hybrid')
 */
const usePermissionStore = defineStore('permission', {
  state: (): PermissionStoreState =>  ({
    geoLocationStatus: 'prompt',
  }),

  getters: {
    isGeoLocationGranted: (state) => state.geoLocationStatus === 'granted',
  },

  actions: {
    async loadGeoLocationStatus() {
      try {
        const status = await Geolocation.checkPermissions();
        this.geoLocationStatus = status.location;
      } catch (error) {
        console.log(error);
      }
    },

    async requestGeoLocationPermission() {
      if (!this.isGeoLocationGranted) {
        try {
          const status = await Geolocation.requestPermissions();
          this.geoLocationStatus = status.location;
        } catch (error) {
          console.log(error);
        }
      }
    }
  }
});

export { usePermissionStore };