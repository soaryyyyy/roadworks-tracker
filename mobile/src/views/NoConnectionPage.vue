<template>
  <ion-page>
    <ion-content fullscreen class="center">
      <ion-icon :icon="wifiOutline" class="icon" />

      <h2>Pas de connexion</h2>
      <p>Vérifiez votre connexion Internet.</p>

      <ion-button expand="block" @click="retry">
        Réessayer
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonButton, IonIcon } from '@ionic/vue'
import { wifiOutline } from 'ionicons/icons'

const retry = () => {
  window.location.reload();
}
</script>

<style scoped>
.center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 20px;
}

.icon {
  font-size: 64px;
  color: #ef873d;
}

h2 {
  margin: 0;
}

p {
  opacity: 0.8;
}
</style>
