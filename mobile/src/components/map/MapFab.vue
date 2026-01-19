<template>
  <ion-fab slot="fixed" vertical="top" horizontal="end">
    <ion-fab-button size="small">
      <ion-icon :icon="mapOutline"></ion-icon>
    </ion-fab-button>

    <ion-fab-list side="bottom">

      <ion-fab-button @click="handleLocateClick">
        <ion-icon :icon="locateOutline"></ion-icon>
      </ion-fab-button>

    </ion-fab-list>
  </ion-fab>
</template>

<script setup lang="ts">
import { 
  IonFab, IonFabButton, IonIcon,
  IonFabList,
} from '@ionic/vue';

import { mapOutline, locateOutline } from 'ionicons/icons';

import { useCurrentLocationStore } from '@/pinia/geolocation';

const currentLocationStore = useCurrentLocationStore();

const handleLocateClick = async () => {
  if (!currentLocationStore.isTracked) {
    await currentLocationStore.startTracking();
  }
};
</script>