<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="$emit('close')"
    :initial-breakpoint="0.75"
    :breakpoints="[0, 0.75, 1]"
    :backdrop-breakpoint="0.5"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>Signaler l'état de la route</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Fermer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="coords" class="location-info">
        <p><strong>Position:</strong></p>
        <p>Latitude: {{ coords.lat.toFixed(6) }}</p>
        <p>Longitude: {{ coords.lng.toFixed(6) }}</p>
      </div>

      <ion-item>
        <ion-label position="stacked">Type de problème routier</ion-label>
        <ion-select v-model="selectedStatus" placeholder="Choisir un problème">
          <ion-select-option value="pothole">🕳️ Nid-de-poule</ion-select-option>
          <ion-select-option value="blocked_road">🚧 Route barrée</ion-select-option>
          <ion-select-option value="accident">🚨 Accident</ion-select-option>
          <ion-select-option value="construction">🏗️ Travaux</ion-select-option>
          <ion-select-option value="flooding">💧 Inondation</ion-select-option>
          <ion-select-option value="debris">🪨 Débris</ion-select-option>
          <ion-select-option value="poor_surface">⚠️ Mauvaise surface</ion-select-option>
          <ion-select-option value="other">❓ Autre</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">Description (optionnel)</ion-label>
        <ion-input
          v-model="description"
          type="text"
          placeholder="Décrivez le problème..."
          rows="4"
        ></ion-input>
      </ion-item>

      <ion-button
        expand="block"
        @click="handleSubmit"
        :disabled="!selectedStatus || isSubmitting"
      >
        <ion-spinner v-if="isSubmitting" name="crescent" slot="start"></ion-spinner>
        {{ isSubmitting ? 'Envoi en cours...' : 'Signaler' }}
      </ion-button>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButton,
  IonButtons,
  IonSpinner,
  toastController,
} from '@ionic/vue';
import { useRoadworksReportStore } from '@/pinia/geo-location/roadworks-report';

interface Props {
  isOpen: boolean;
  coords: { lat: number; lng: number } | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submitted: [];
}>();

const selectedStatus = ref<string>('');
const description = ref<string>('');
const isSubmitting = ref(false);

const reportStore = useRoadworksReportStore();

const handleSubmit = async () => {
  if (!props.coords || !selectedStatus.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    await reportStore.addReport({
      lat: props.coords.lat,
      lng: props.coords.lng,
      status: selectedStatus.value as any,
      description: description.value || undefined,
    });

    // Reset form
    selectedStatus.value = '';
    description.value = '';

    emit('submitted');
    emit('close');
  } catch (error) {
    console.error('Erreur:', error);
    // Le toast d'erreur est déjà affiché par le store
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.location-info {
  background-color: #f4f4f4;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.location-info p {
  margin: 4px 0;
}
</style>
