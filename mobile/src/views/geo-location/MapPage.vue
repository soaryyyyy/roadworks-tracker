<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="header-with-logo">
          <div class="header-logo"></div>
          <span class="header-title">Explorer</span>
          <div class="header-spacer"></div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" id="map-content">
      <ion-fab slot="fixed" horizontal="start" vertical="top">
        <ion-fab-button @click="handleLocate">
          <ion-spinner v-if="currentLocationStore.isRefreshingCoords" name="crescent"></ion-spinner>
          <ion-icon v-else :icon="locateOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-fab slot="fixed" horizontal="end" vertical="top">
        <div class="filter-chip" @click="toggleFilter" :class="{ active: showOnlyMyReports }">
          <ion-icon :icon="filterOutline"></ion-icon>
          <span>{{ showOnlyMyReports ? 'Mes signalements' : 'Tous' }}</span>
        </div>
      </ion-fab>

      <div id="map" style="height: 100%; width: 100%;"></div>

      <roadworks-report-modal
        :is-open="isReportModalOpen"
        :coords="selectedCoords"
        @close="isReportModalOpen = false"
        @submitted="handleReportSubmitted"
      />

      <roadworks-report-details-modal
        :is-open="isDetailsModalOpen"
        :report="selectedReport"
        @close="isDetailsModalOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import {
  IonPage, IonHeader, IonToolbar,
  IonContent, loadingController,
  IonFab, IonFabButton,
  IonIcon, IonSpinner
} from '@ionic/vue';

import { locateOutline, filterOutline } from 'ionicons/icons';

import L from 'leaflet';
import { useCurrentLocationStore } from '@/pinia/geo-location/current-location';
import { useRoadworksReportStore } from '@/pinia/geo-location/roadworks-report';
import { defaultMarker } from '@/components/geo-location/icon';
import RoadworksReportModal from '@/components/geo-location/RoadworksReportModal.vue';
import RoadworksReportDetailsModal from '@/components/geo-location/RoadworksReportDetailsModal.vue';
import {
  getStatusLabel,
  getStatusIcon,
  getStatusHexColor,
  getReportStatusLabel,
  formatDateShort,
} from '@/utils/roadworks-utils';

const isGeoLocationModalOpen = ref<boolean>(false);
let map: L.Map | null = null;
let userLocation: L.Marker | null = null;

const isReportModalOpen = ref<boolean>(false);
const selectedCoords = ref<{ lat: number; lng: number } | null>(null);

const currentLocationStore = useCurrentLocationStore();
const reportStore = useRoadworksReportStore();

const showOnlyMyReports = ref<boolean>(false);

const isDetailsModalOpen = ref<boolean>(false);
const selectedReport = ref<any>(null);

const mountMap = async () => {
  const mapLoading = await loadingController.create({
    message: 'Chargement...',
    spinner: 'crescent',
    backdropDismiss: false,
  });

  await mapLoading.present();

  try {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      throw new Error('Élément map non trouvé');
    }

    map = L.map('map', {
      zoomControl: false
    }).setView([-18.9184607, 47.5211293], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    map.on('click', function(e: L.LeafletMouseEvent) {
      if ((e.target as any).options && (e.target as any).options.icon) {
        return;
      }

      map?.setView([e.latlng.lat, e.latlng.lng], 17);

      selectedCoords.value = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };

      isReportModalOpen.value = true;
    });

  } catch (error) {
    console.error('Erreur mountMap:', error);
  } finally {
    await mapLoading.dismiss();
  }
};

const handleLocate = async () => {
  await currentLocationStore.refreshCoords();

  const coords = currentLocationStore.coords;
  if (coords && map) {
    map.setView([coords.lat, coords.lng], 15);
  }
}

const handleReportSubmitted = async () => {
  await reportStore.loadAllReports();
  displayReportsOnMap();
}

const toggleFilter = () => {
  showOnlyMyReports.value = !showOnlyMyReports.value;
  displayReportsOnMap();
}

const displayReportsOnMap = () => {
  if (!map) return;

  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker && layer !== userLocation) {
      map?.removeLayer(layer);
    }
  });

  let reportsToDisplay = reportStore.reports;

  if (showOnlyMyReports.value) {
    reportsToDisplay = reportStore.reports.filter(r => r.userId === reportStore.currentUserId);
  }

  reportsToDisplay.forEach((report) => {
    const statusColor = getStatusHexColor(report.status);
    const markerHtml = getStatusIcon(report.status, statusColor);

    const svgMarkerIcon = L.divIcon({
      html: markerHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: 'emoji-marker',
    });

    const marker = L.marker([report.lat, report.lng], {
      icon: svgMarkerIcon,
    }).addTo(map!);

    const work = (report as any).work;
    const popupContent = `
      <div style="text-align: center; padding: 8px; width: 150px;">
        <strong>${getStatusLabel(report.status)}</strong>
        ${report.description ? `<p style="margin: 4px 0; font-size: 12px;">${report.description}</p>` : ''}
        <div style="margin-top: 6px; font-size: 12px; text-align: left;">
          <div><strong>Date:</strong> ${formatDateShort((report as any).createdAt)}</div>
          <div><strong>Statut:</strong> ${getReportStatusLabel((report as any).reportStatus || 'new')}</div>
          <div><strong>Surface:</strong> ${work?.surface != null ? `${work.surface} m²` : '—'}</div>
          <div><strong>Prix:</strong> ${work?.price != null ? `${Number(work.price).toLocaleString()} Ar` : '—'}</div>
          <div><strong>Entreprise:</strong> ${work?.company || '—'}</div>
        </div>
        <small style="color: #999;">
          ${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}
        </small>
      </div>
    `;

    marker.bindPopup(popupContent);

    marker.on('click', () => {
      map?.setView([report.lat, report.lng], 17);
      selectedReport.value = report;
      isDetailsModalOpen.value = true;
    });
  });
};

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

onMounted(async () => {
  L.Marker.prototype.options.icon = defaultMarker;
  await mountMap();

  await reportStore.loadAllReports({
    onCacheApplied: () => displayReportsOnMap(),
  });
});
</script>

<style scoped>
.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--neutral-white);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--neutral-gray-600);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-chip:active {
  transform: scale(0.95);
}

.filter-chip.active {
  background: var(--primary-color);
  color: var(--neutral-white);
}

.filter-chip ion-icon {
  font-size: 16px;
}
</style>
