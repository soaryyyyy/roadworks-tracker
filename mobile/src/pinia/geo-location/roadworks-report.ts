import { defineStore } from 'pinia';
import { Geolocation } from '@capacitor/geolocation';
import { auth } from '@/services/firebase/routeworks-tracker';
import {
  addRoadworksReport,
  getAllRoadworksReports,
  RoadworksReportData,
  RoadworksReportWithId,
} from '@/services/firebase/roadworks-reports';
import { showToast } from '@/utils/ui';
import { alertCircleOutline } from 'ionicons/icons';

export interface RoadworksReport extends RoadworksReportWithId {}

export const useRoadworksReportStore = defineStore('roadworks-report', {
  state: () => ({
    reports: [] as RoadworksReport[],
    isSubmitting: false,
    isLoading: false,
    error: null as string | null,
    currentUserId: null as string | null,
  }),

  actions: {
    async addReport(report: Omit<RoadworksReportData, 'userId' | 'createdAt' | 'updatedAt'>) {
      this.isSubmitting = true;
      this.error = null;

      try {
        const newReport = await addRoadworksReport(report);

        this.reports.push(newReport);
        this.currentUserId = newReport.userId || null;

        showToast('Signalement enregistré avec succès!', 2000, alertCircleOutline, 'success', 'top');

        return newReport;
      } catch (error: any) {
        const message = error?.message || 'Erreur lors de l\'enregistrement du signalement';
        this.error = message;

        showToast(message, 3000, alertCircleOutline, 'danger', 'top');

        throw error;
      } finally {
        this.isSubmitting = false;
      }
    },

    async loadAllReports() {
      this.isLoading = true;
      this.error = null;

      try {
        // Récupérer l'ID utilisateur actuel
        const userId = auth.currentUser?.uid;
        if (userId) {
          this.currentUserId = userId;
        }

        this.reports = await getAllRoadworksReports();
        console.log(`📍 ${this.reports.length} signalements chargés depuis Firebase`);
        console.log(`👤 User ID: ${this.currentUserId}`);
      } catch (error: any) {
        const message = error?.message || 'Erreur lors du chargement des signalements';
        this.error = message;

        console.error('❌ Erreur:', message);
      } finally {
        this.isLoading = false;
      }
    },

    getReports() {
      return this.reports;
    },

    clearError() {
      this.error = null;
    },
  },
});
