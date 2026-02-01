<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="header-with-logo">
          <div class="header-logo"></div>
          <span class="header-title">Récapitulatif</span>
          <div class="header-spacer"></div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ summary.nbPoints }}</span>
          <span class="stat-label">Points</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ Math.round(summary.totalSurface) }}</span>
          <span class="stat-label">m² Total</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ formatBudget(summary.totalBudget) }}</span>
          <span class="stat-label">Budget</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ progressPercent }}%</span>
          <span class="stat-label">Avancement</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-header">
          <span>Progression globale</span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Status Cards -->
      <div class="status-section">
        <h3>Par statut</h3>
        <div class="status-grid">
          <div class="status-item status-item--new">
            <div class="status-item__icon">
              <ion-icon :icon="addCircleOutline"></ion-icon>
            </div>
            <div class="status-item__info">
              <span class="status-item__value">{{ summary.states.new }}</span>
              <span class="status-item__label">Nouveau</span>
            </div>
          </div>

          <div class="status-item status-item--progress">
            <div class="status-item__icon">
              <ion-icon :icon="timerOutline"></ion-icon>
            </div>
            <div class="status-item__info">
              <span class="status-item__value">{{ summary.states.in_progress }}</span>
              <span class="status-item__label">En cours</span>
            </div>
          </div>

          <div class="status-item status-item--done">
            <div class="status-item__icon">
              <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
            </div>
            <div class="status-item__info">
              <span class="status-item__value">{{ summary.states.completed }}</span>
              <span class="status-item__label">Terminé</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="reportStore.error" class="error-message">
        {{ reportStore.error }}
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
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

const formatBudget = (value: number) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  return value.toString();
};

const handleRefresh = async (ev: CustomEvent) => {
  try {
    await reportStore.loadAllReports();
  } finally {
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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  background: var(--neutral-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: center;
  border: 1px solid var(--neutral-gray-100);
}

.stat-value {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--neutral-dark);
}

.stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--neutral-gray-500);
  margin-top: 2px;
}

.progress-section {
  background: var(--neutral-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--neutral-gray-100);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--neutral-gray-600);
}

.progress-percent {
  font-weight: 600;
  color: var(--primary-color);
}

.progress-bar {
  height: 8px;
  background: var(--neutral-gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.status-section {
  margin-bottom: var(--spacing-lg);
}

.status-section h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--neutral-dark);
  margin-bottom: var(--spacing-md);
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--neutral-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  border: 1px solid var(--neutral-gray-100);
}

.status-item__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-item__icon ion-icon {
  font-size: 20px;
}

.status-item--new .status-item__icon {
  background: rgba(245, 166, 35, 0.1);
  color: var(--primary-color);
}

.status-item--progress .status-item__icon {
  background: rgba(245, 158, 11, 0.1);
  color: var(--status-warning);
}

.status-item--done .status-item__icon {
  background: rgba(16, 185, 129, 0.1);
  color: var(--status-success);
}

.status-item__info {
  flex: 1;
}

.status-item__value {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--neutral-dark);
}

.status-item__label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--neutral-gray-500);
}
</style>
