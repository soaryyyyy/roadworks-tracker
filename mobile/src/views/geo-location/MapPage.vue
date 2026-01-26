<template>
  <ion-page>

    <ion-header>
      <ion-toolbar>
        <ion-title>Explorer</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-fab slot="fixed" horizontal="start" vertical="top">
        
        <ion-fab-button @click="handleLocate">
          <ion-spinner v-if="currentLocationStore.isRefreshingCoords" name="crescent"></ion-spinner>
          <ion-icon v-else :icon="locateOutline"></ion-icon>
        </ion-fab-button>
      
      </ion-fab>

      <div id="map" style="height: 100%; width: 100%;"></div>

      <ion-modal 
        :is-open="isGeoLocationModalOpen" 
        @didDismiss="isGeoLocationModalOpen = false"
        :initial-breakpoint="0.25" 
        :breakpoints="[0, 0.25, 0.8]"
        :backdrop-breakpoint="0.5">
      </ion-modal>

    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { 
  IonPage, IonHeader, IonToolbar, 
  IonTitle, IonContent, loadingController,
  IonModal, IonFab, IonFabButton,
  IonIcon, IonSpinner
} from '@ionic/vue';

import { locateOutline } from 'ionicons/icons';

import L from 'leaflet';
import { useCurrentLocationStore } from '@/pinia/geo-location/current-location';
import { defaultMarker } from '@/components/geo-location/icon';

const isGeoLocationModalOpen = ref<boolean>(false);

let map: L.Map | null = null;
let userLocation: L.Marker | null = null;

const mountMap = async () => {
  const mapLoading = await loadingController.create({
    message: 'Chargement de la carte...',
    spinner: 'crescent',
    backdropDismiss: false,
  });

  await mapLoading.present();

  try {
    map = L.map('map', {
      zoomControl: false
    }).setView([-18.9184607, 47.5211293], 11); // Antananarivo

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  } catch (error) {
    console.error(error);
  } finally {
    await mapLoading.dismiss();
  }
};

const currentLocationStore = useCurrentLocationStore();

const handleLocate = async () => {
  await currentLocationStore.refreshCoords();
}

watch(
  () => currentLocationStore.coords,
  (coords) => { 
    if (!coords) {
      return;
    }

    const { lat, lng } = coords; 
    if (!userLocation && map) {
      userLocation = L.marker([lat, lng]).addTo(map);
      userLocation.bindPopup(
        '<div style="text-align: center;font-weight: bold;">Vous</div>', 
        { closeButton: false }
      );
      userLocation.openPopup();
    } else if (userLocation && map){
      userLocation.setLatLng([lat, lng]);
    }
  },
  { deep: true }
)

onMounted(() => {
  // Make leaflet use the default icon for marker
  L.Marker.prototype.options.icon = defaultMarker;
  mountMap();
});
</script>
