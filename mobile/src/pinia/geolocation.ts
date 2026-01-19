import { defineStore } from "pinia";
import { usePermissionStore } from "./permission";
import { Geolocation } from "@capacitor/geolocation";
import { isPlatform } from "@ionic/vue";

const useCurrentLocationStore = defineStore('current-location', {
  state: () => ({
    coords: null as { lat: number, lng: number } | null,
    watchId: null as string | null,
  }),

  getters: {
    isTracked: (state) => !!state.watchId,
  },

  actions: {
    async startTracking() {
      if (this.isTracked) {
        return;
      }

      const permissionStore = usePermissionStore();

      if (isPlatform('hybrid')) {
        await permissionStore.requestGeoLocationPermission();
      }
      
      if (permissionStore.isGeoLocationGranted || !isPlatform('hybrid')) {
        this.watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true },
          (position) => {
            if (position) {
              this.coords = { 
                lat: position.coords.latitude, 
                lng: position.coords.longitude 
              };
            }
          }
        );
      }
    },

    async stopTracking() {
      if (this.watchId) {
        await Geolocation.clearWatch({ id: this.watchId });
        this.watchId = null;
      }
    }
  },
});

export { useCurrentLocationStore }