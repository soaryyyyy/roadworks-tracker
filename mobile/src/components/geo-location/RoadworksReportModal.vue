<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="handleClose"
    :initial-breakpoint="0.85"
    :breakpoints="[0, 0.85, 1]"
    :backdrop-breakpoint="0.5"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>Signaler l'état de la route</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleClose">Fermer</ion-button>
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
          <ion-select-option value="pothole">Nid-de-poule</ion-select-option>
          <ion-select-option value="blocked_road">Route barrée</ion-select-option>
          <ion-select-option value="accident">Accident</ion-select-option>
          <ion-select-option value="construction">Travaux</ion-select-option>
          <ion-select-option value="flooding">Inondation</ion-select-option>
          <ion-select-option value="debris">Débris</ion-select-option>
          <ion-select-option value="poor_surface">Mauvaise surface</ion-select-option>
          <ion-select-option value="other">Autre</ion-select-option>
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

      <!-- Section Photos -->
      <div class="photos-section">
        <ion-label class="photos-label">Photos (optionnel)</ion-label>

        <div class="photos-grid">
          <!-- Photos sélectionnées -->
          <div
            v-for="(photo, index) in photos"
            :key="index"
            class="photo-item"
          >
            <img :src="photo" alt="Photo du problème" />
            <ion-button
              fill="clear"
              size="small"
              class="remove-photo-btn"
              @click="removePhoto(index)"
            >
              <ion-icon :icon="closeCircle" color="danger"></ion-icon>
            </ion-button>
          </div>

          <!-- Bouton ajouter photo -->
          <div
            v-if="photos.length < 5"
            class="add-photo-btn"
            @click="showPhotoOptions"
          >
            <ion-icon :icon="cameraOutline" size="large"></ion-icon>
            <span>Ajouter</span>
          </div>
        </div>

        <p class="photos-hint">{{ photos.length }}/5 photos</p>
      </div>

      <ion-button
        expand="block"
        @click="handleSubmit"
        :disabled="!selectedStatus || isSubmitting"
        class="submit-btn"
      >
        <ion-spinner v-if="isSubmitting" name="crescent" slot="start"></ion-spinner>
        {{ isSubmitting ? 'Envoi en cours...' : 'Signaler' }}
      </ion-button>
    </ion-content>
  </ion-modal>

  <!-- Action Sheet pour choisir la source de la photo -->
  <ion-action-sheet
    :is-open="isActionSheetOpen"
    header="Ajouter une photo"
    :buttons="photoActionButtons"
    @didDismiss="isActionSheetOpen = false"
  ></ion-action-sheet>
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
  IonIcon,
  IonActionSheet,
  toastController,
} from '@ionic/vue';
import { cameraOutline, closeCircle, imageOutline, camera } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
const photos = ref<string[]>([]);
const isSubmitting = ref(false);
const isActionSheetOpen = ref(false);

const reportStore = useRoadworksReportStore();

// Boutons de l'action sheet pour choisir la source de la photo
const photoActionButtons = [
  {
    text: 'Prendre une photo',
    icon: camera,
    handler: () => {
      takePhoto(CameraSource.Camera);
    },
  },
  {
    text: 'Choisir depuis la galerie',
    icon: imageOutline,
    handler: () => {
      takePhoto(CameraSource.Photos);
    },
  },
  {
    text: 'Annuler',
    role: 'cancel',
  },
];

const showPhotoOptions = () => {
  isActionSheetOpen.value = true;
};

const takePhoto = async (source: CameraSource) => {
  try {
    const image = await Camera.getPhoto({
      quality: 70,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source,
      width: 1024,
      height: 1024,
    });

    if (image.dataUrl && photos.value.length < 5) {
      photos.value.push(image.dataUrl);
    }
  } catch (error: any) {
    // L'utilisateur a annulé ou une erreur s'est produite
    if (error.message !== 'User cancelled photos app') {
      console.error('Erreur lors de la capture de la photo:', error);
      const toast = await toastController.create({
        message: 'Erreur lors de la capture de la photo',
        duration: 2000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }
};

const removePhoto = (index: number) => {
  photos.value.splice(index, 1);
};

const resetForm = () => {
  selectedStatus.value = '';
  description.value = '';
  photos.value = [];
};

const handleClose = () => {
  resetForm();
  emit('close');
};

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
      photos: photos.value.length > 0 ? photos.value : undefined,
    });

    // Reset form
    resetForm();

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
  background-color: var(--ion-color-light);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.location-info p {
  margin: 4px 0;
}

/* Section Photos */
.photos-section {
  margin: 16px 0;
  padding: 0 4px;
}

.photos-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-color-medium);
  margin-bottom: 12px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--ion-color-light);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  --padding-start: 0;
  --padding-end: 0;
  margin: 0;
}

.remove-photo-btn ion-icon {
  font-size: 24px;
  background: white;
  border-radius: 50%;
}

.add-photo-btn {
  aspect-ratio: 1;
  border: 2px dashed var(--ion-color-medium);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: var(--ion-color-medium);
  transition: all 0.2s ease;
}

.add-photo-btn:active {
  background-color: var(--ion-color-light);
  border-color: var(--ion-color-primary);
  color: var(--ion-color-primary);
}

.add-photo-btn span {
  font-size: 12px;
}

.photos-hint {
  text-align: center;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 8px;
}

.submit-btn {
  margin-top: 20px;
}
</style>
