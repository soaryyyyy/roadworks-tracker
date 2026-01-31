<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div style="display: flex; align-items: center; width: 100%; justify-content: space-between; padding: 0 var(--spacing-md);">
          <div style="width: 40px; height: 40px; background: url('/logo-clean.png') center / contain no-repeat;"></div>
          <ion-title style="flex-grow: 1; text-align: center; margin: 0;">Récapitulatif</ion-title>
          <div style="width: 40px;"></div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Recap actuel</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div class="metric">
                  <div class="metric__label">Nb de points</div>
                  <div class="metric__value">{{ summary.nbPoints }}</div>
                </div>
              </ion-col>
              <ion-col size="6">
                <div class="metric">
                  <div class="metric__label">Total surface</div>
                  <div class="metric__value">{{ Math.round(summary.totalSurface) }} m²</div>
                </div>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="6">
                <div class="metric">
                  <div class="metric__label">Total budget</div>
                  <div class="metric__value">{{ summary.totalBudget.toLocaleString() }} Ar</div>
                </div>
              </ion-col>
              <ion-col size="6">
                <div class="metric">
                  <div class="metric__label">Avancement</div>
                  <div class="metric__value">{{ progressPercent }}%</div>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>Vue d'ensemble</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="4">
                <div class="status-card status-card--primary">
                  <ion-icon :icon="addCircleOutline" style="font-size: 28px; margin-bottom: 8px;"></ion-icon>
                  <div class="status-card__label">Nouveau</div>
                  <div class="status-card__value">{{ summary.states.new }}</div>
                </div>
              </ion-col>
              <ion-col size="4">
                <div class="status-card status-card--warning">
                  <ion-icon :icon="timerOutline" style="font-size: 28px; margin-bottom: 8px; color: var(--status-warning);"></ion-icon>
                  <div class="status-card__label">En cours</div>
                  <div class="status-card__value">{{ summary.states.in_progress }}</div>
                </div>
              </ion-col>
              <ion-col size="4">
                <div class="status-card status-card--success">
                  <ion-icon :icon="checkmarkDoneOutline" style="font-size: 28px; margin-bottom: 8px; color: var(--status-success);"></ion-icon>
                  <div class="status-card__label">Terminé</div>
                  <div class="status-card__value">{{ summary.states.completed }}</div>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <ion-card v-if="reportStore.error">
        <ion-card-content class="error">
          {{ reportStore.error }}
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
} from '@ionic/vue';
import { addCircleOutline, timerOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { useRoadworksReportStore } from '@/pinia/geo-location/roadworks-report';

const reportStore = useRoadworksReportStore();

const summary = computed(() => {
  return reportStore.reports.reduce(
    (acc, report: any) => {
      const state = (report.reportStatus ?? 'new') as 'new' | 'in_progress' | 'completed';
      acc.states[state] = (acc.states[state] ?? 0) + 1;
      acc.nbPoints += 1;
      acc.totalSurface += Number(report.work?.surface ?? 0);
      acc.totalBudget += Number(report.work?.price ?? 0);
      if (state === 'completed') {
        acc.completed += 1;
      }
      return acc;
    },
    {
      states: {
        new: 0,
        in_progress: 0,
        completed: 0,
      } as Record<'new' | 'in_progress' | 'completed', number>,
      nbPoints: 0,
      totalSurface: 0,
      totalBudget: 0,
      completed: 0,
    }
  );
});

const progressPercent = computed(() => {
  return summary.value.nbPoints
    ? Math.round((summary.value.completed / summary.value.nbPoints) * 100)
    : 0;
});

const handleRefresh = async (ev: CustomEvent) => {
  try {
    await reportStore.loadAllReports();
  } finally {
    // Ionic's refresher exposes a `complete()` method.
    (ev.target as any)?.complete?.();
  }
};

onMounted(async () => {
  if (reportStore.reports.length === 0) {
    await reportStore.loadAllReports();
  }
});
</script>

<style scoped>
.metric__label {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.metric__value {
  font-size: 22px;
  font-weight: 700;
}

.status-card {
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  background: var(--ion-color-light);
}

.status-card--primary {
  border: 1px solid var(--ion-color-primary);
}

.status-card--warning {
  border: 1px solid var(--ion-color-warning);
}

.status-card--success {
  border: 1px solid var(--ion-color-success);
}

.status-card__label {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
}

.status-card__value {
  font-size: 18px;
  font-weight: 700;
}

.error {
  color: var(--ion-color-danger);
}
</style>
