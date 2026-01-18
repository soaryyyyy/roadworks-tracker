import { isPlatform } from "@ionic/vue";
import { Geolocation } from "@capacitor/geolocation";

const setupGeoLocationPermissions = async () => {
  if (isPlatform('hybrid')) {
    const permission = await Geolocation.checkPermissions();

    if (permission.location !== 'granted') {
      const permission = await Geolocation.requestPermissions();
      
      if (permission.location !== 'granted') {
        // Permission refusee
      }
    }
  }
};

export { setupGeoLocationPermissions };