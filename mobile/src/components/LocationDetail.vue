<template>
  <ion-content class="ion-padding">
    <div v-if="data">
      <ion-text color="primary">
        <h3>{{ data.latitude.toFixed(5) }}, {{ data.longitude.toFixed(5) }}</h3>
      </ion-text>
    </div>
  </ion-content>
</template>

<script setup lang="ts">

import { 
  IonContent, IonText
} from '@ionic/vue';

import { LocationData } from '@/views/map/MapPage.vue';

defineProps<{
  data?: LocationData
}>();
</script>