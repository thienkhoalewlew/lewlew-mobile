import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Report, CreateReportData, ReportReason, ReportStatus, ReportState } from '../types';
import { reportService } from '../services/reportService';

interface ReportStore extends ReportState {
  // State
  reports: Report[];
  loading: boolean;
  error: string | null;
  
  // Actions
  reportPost: (reportData: CreateReportData) => Promise<boolean>;
  getReports: (page?: number, limit?: number, status?: ReportStatus, reason?: ReportReason) => Promise<void>;
  updateReportStatus: (reportId: string, status: ReportStatus, adminNotes?: string) => Promise<boolean>;
  getReportStats: () => Promise<any>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  reports: [],
  loading: false,
  error: null,
};

export const useReportStore = create<ReportStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      reportPost: async (reportData: CreateReportData) => {
        set({ loading: true, error: null });
        
        try {
          console.log('Report store - Creating report:', reportData);
          
          const result = await reportService.createReport(reportData);
          
          if (result.success) {
            console.log('Report store - Report created successfully');
            
            set({ loading: false });
            return true;
          } else {
            console.error('Report store - Failed to create report:', result.error);
            set({ 
              loading: false, 
              error: result.error || 'Failed to create report'
            });
            return false;
          }
        } catch (error) {
          console.error('Report store - Create report error:', error);
          set({ 
            loading: false, 
            error: 'An error occurred while creating the report'
          });
          return false;
        }
      },

      getReports: async (page = 1, limit = 10, status?: ReportStatus, reason?: ReportReason) => {
        set({ loading: true, error: null });
        
        try {
          const result = await reportService.getReports(page, limit, status, reason);
          
          if (result.success) {
            set({ 
              reports: result.data?.reports || [],
              loading: false
            });
          } else {
            set({ 
              loading: false, 
              error: result.error || 'Failed to get reports'
            });
          }
        } catch (error) {
          console.error('Report store - Get reports error:', error);
          set({ 
            loading: false, 
            error: 'An error occurred while fetching reports'
          });
        }
      },

      updateReportStatus: async (reportId: string, status: ReportStatus, adminNotes?: string) => {
        set({ loading: true, error: null });
        
        try {
          const result = await reportService.updateReportStatus(reportId, status, adminNotes);
          
          if (result.success) {
            // Update the report in the current list
            const { reports } = get();
            const updatedReports = reports.map(report => 
              report.id === reportId 
                ? { ...report, status, reviewedAt: new Date() }
                : report
            );
            
            set({ 
              reports: updatedReports,
              loading: false
            });
            return true;
          } else {
            set({ 
              loading: false, 
              error: result.error || 'Failed to update report status'
            });
            return false;
          }
        } catch (error) {
          console.error('Report store - Update report status error:', error);
          set({ 
            loading: false, 
            error: 'An error occurred while updating report status'
          });
          return false;
        }
      },

      getReportStats: async () => {
        set({ loading: true, error: null });
        
        try {
          const result = await reportService.getReportStats();
          
          if (result.success) {
            set({ loading: false });
            return result.data;
          } else {
            set({ 
              loading: false, 
              error: result.error || 'Failed to get report statistics'
            });
            return null;
          }
        } catch (error) {
          console.error('Report store - Get report stats error:', error);
          set({ 
            loading: false, 
            error: 'An error occurred while fetching report statistics'
          });
          return null;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'report-store',
    }
  )
);

export default useReportStore;
