import { defineStore } from "pinia";
import { Geolocation } from "@capacitor/geolocation";
import { isPlatform } from "@ionic/vue";
import { locateOutline } from "ionicons/icons";

import { useGeoLocationPermissionStore } from "./permission";
import { showToast } from "@/utils/ui";

// https://capacitorjs.com/docs/apis/geolocation#errors
const CAP_GEO_ERR_MSG: Record<string, string> = {
  'OS-PLUG-GLOC-0002': "Erreur lors de l'obtention de la position.",
  'OS-PLUG-GLOC-0003': "La permission de localisation a été refusée.",
  'OS-PLUG-GLOC-0004': "Paramètres d'entrée invalides pour getCurrentPosition.",
  'OS-PLUG-GLOC-0005': "Paramètres d'entrée invalides pour watchPosition.", 
  'OS-PLUG-GLOC-0006': "Paramètres d'entrée invalides pour clearWatch.",
  'OS-PLUG-GLOC-0007': "Les services de localisation sont désactivés.",
  'OS-PLUG-GLOC-0008': "L'accès à la localisation est restreint sur cet appareil.",
  'OS-PLUG-GLOC-0009': "La demande d'activation de la localisation a été refusée.",
  'OS-PLUG-GLOC-0010': "Délai d'attente (timeout) dépassé.",
  'OS-PLUG-GLOC-0011': "La valeur du timeout doit être positive.",
  'OS-PLUG-GLOC-0012': "Identifiant de suivi (WatchId) introuvable.",
  'OS-PLUG-GLOC-0013': "L'identifiant de suivi (WatchId) est requis.",
  'OS-PLUG-GLOC-0014': "Erreur Google Play Services (résoluble par l'utilisateur).",
  'OS-PLUG-GLOC-0015': "Erreur critique Google Play Services.",
  'OS-PLUG-GLOC-0016': "Erreur de configuration des paramètres de localisation.",
  'OS-PLUG-GLOC-0017': "Impossible de localiser : réseau et GPS sont tous deux désactivés."
};

const useCurrentLocationStore = defineStore('current-geo-location', {
  state: () => ({
    coords: null as { lat: number, lng: number } | null,
    isRefreshingCoords: false,
  }),

  actions: {
    async refreshCoords() {
      this.isRefreshingCoords = true;

      const permissionStore = useGeoLocationPermissionStore();

      if (isPlatform('hybrid')) { // Only there for debugging while using web platform
        await permissionStore.requestPermission();
      }
      
      if (permissionStore.isGranted || !isPlatform('hybrid')) { // Only there for debugging while using web platform
        try {
          const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, });

          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (lat !== undefined && lng !== undefined) {
            this.coords = { lat, lng }
          }
        } catch (error: any) {
          const code = error?.code as string;
          const message = CAP_GEO_ERR_MSG[code] || 
            error?.message ||
            'Une erreur inconnue est survenue.'

          showToast(message, 5000, locateOutline, 'danger', 'middle');
        }
      }

      this.isRefreshingCoords = false;
    },
  },
});

export { useCurrentLocationStore }