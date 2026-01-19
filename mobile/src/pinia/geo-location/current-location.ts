import { defineStore } from "pinia";
import { useGeoLocationPermissionStore } from "./permission";
import { Geolocation } from "@capacitor/geolocation";
import { isPlatform } from "@ionic/vue";
import { showToast } from "@/utils/ui";
import { locateOutline } from "ionicons/icons";

const useCurrentLocationStore = defineStore('current-geo-location', {
  state: () => ({
    coords: null as { lat: number, lng: number } | null,
    watchId: null as string | null,
    isWatchLoading: false,
  }),

  getters: {
    isTracked: (state) => !!state.watchId,
  },

  actions: {
    async startTracking() {
      if (this.isTracked || this.isWatchLoading) return;
      
      this.isWatchLoading = true;

      const permissionStore = useGeoLocationPermissionStore();

      if (isPlatform('hybrid')) { // Only there for debugging while using web platform
        await permissionStore.requestPermission();
      }
      
      if (permissionStore.isGranted || 
          !isPlatform('hybrid')) { // Only there for debugging while using web platform
        this.watchId = await Geolocation.watchPosition(
          { 
            enableHighAccuracy: true,
            timeout: 10_000,
            maximumAge: 0,
          },

          (position, error: any) => {
            this.isWatchLoading = false;

            if (error) {
              this.startTracking();
              
              const ERROR_MESSAGES: Record<number, string> = {
                1: "Accès refusé. Activez la localisation dans les réglages.",
                2: "Signal GPS introuvable. Vérifiez vos paramètres.",
                3: "Délai dépassé. La localisation a échoué."
              };

              const message = ERROR_MESSAGES[error.code] || 
                "Une erreur inconnue est survenue.";

              showToast(message, 5000, locateOutline, 'danger', 'bottom');

              return;
            }

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