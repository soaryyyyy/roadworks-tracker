<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="map" href="/tabs/map">
          <ion-icon aria-hidden="true" :icon="locationOutline" />
          <ion-label>Explorer</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon aria-hidden="true" :icon="statsChartOutline" />
          <ion-label>Recap</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" href="/tabs/tab3">
          <ion-icon aria-hidden="true" :icon="personOutline" />
          <ion-label>Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { personOutline, locationOutline, statsChartOutline } from 'ionicons/icons';
</script>

<style scoped>
ion-tab-bar {
  --background: var(--neutral-white);
  border-top: 1px solid var(--neutral-gray-200);
  height: 60px;
  padding-bottom: env(safe-area-inset-bottom, 4px);
}

ion-tab-button {
  --color: var(--neutral-gray-400);
  --color-selected: var(--primary-color);
  font-size: 11px;
  font-weight: 500;
}

ion-tab-button ion-icon {
  font-size: 22px;
  margin-bottom: 2px;
}
</style>
