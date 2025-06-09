import { api } from './api';
import { CreateReportData, Report, ReportReason, ReportStatus } from '../types';

/**
 * Report Service - Handles all report-related API calls
 */
class ReportService {
  
  /**
   * Create a new report for a post
   */
  async createReport(reportData: CreateReportData): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
      console.log('Report service - Creating report:', reportData);
      
      const response = await api.reports.createReport({
        postId: reportData.postId,
        reason: reportData.reason,
      });

      if (response.error) {
        console.error('Report service - Create report error:', response.error);
        return { success: false, error: response.error };
      }

      console.log('Report service - Report created successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Report service - Create report error:', error);
      return { success: false, error: 'Failed to create report' };
    }
  }

  /**
   * Get all reports (Admin only)
   */
  async getReports(
    page: number = 1, 
    limit: number = 10, 
    status?: ReportStatus, 
    reason?: ReportReason
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.reports.getReports(page, limit, status, reason);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Report service - Get reports error:', error);
      return { success: false, error: 'Failed to get reports' };
    }
  }

  /**
   * Get report statistics (Admin only)
   */
  async getReportStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await api.reports.getReportStats();

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Report service - Get report stats error:', error);
      return { success: false, error: 'Failed to get report statistics' };
    }
  }

  /**
   * Update report status (Admin only)
   */
  async updateReportStatus(
    reportId: string, 
    status: ReportStatus, 
    adminNotes?: string
  ): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
      const response = await api.reports.updateReportStatus(reportId, status, adminNotes);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Report service - Update report status error:', error);
      return { success: false, error: 'Failed to update report status' };
    }
  }

  /**
   * Get report details by ID (Admin only)
   */
  async getReportById(reportId: string): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
      const response = await api.reports.getReportById(reportId);

      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Report service - Get report by ID error:', error);
      return { success: false, error: 'Failed to get report details' };
    }
  }  /**
   * Get human-readable report reason text
   */  getReasonText(reason: ReportReason): string {
    const reasonTexts = {
      [ReportReason.INAPPROPRIATE_CONTENT]: 'Inappropriate Content',
      [ReportReason.VIOLENCE]: 'Violence or Dangerous Content',
      [ReportReason.GORE]: 'Gore or Blood',
      [ReportReason.BLOOD]: 'Blood Content',
      [ReportReason.GRAPHIC_VIOLENCE]: 'Graphic Violence',
    };
    return reasonTexts[reason] || 'Unknown';
  }

  /**
   * Get human-readable status text
   */
  getStatusText(status: ReportStatus): string {
    const statusTexts = {
      [ReportStatus.PENDING]: 'Pending Review',
      [ReportStatus.UNDER_REVIEW]: 'Under Review',
      [ReportStatus.RESOLVED]: 'Resolved',
      [ReportStatus.REJECTED]: 'Rejected',
      [ReportStatus.AUTO_RESOLVED]: 'Auto Resolved',
    };
    return statusTexts[status] || 'Unknown';
  }
}

// Export a singleton instance
export const reportService = new ReportService();
export default reportService;
