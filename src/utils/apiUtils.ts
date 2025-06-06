import { API_URL } from '../services/api';

/**
 * Kiểm tra kết nối đến backend server
 * @returns Promise<boolean> - true nếu kết nối thành công, false nếu không
 */
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout sau 5 giây
    
    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Backend connection check failed:', error);
    return false;
  }
};

/**
 * Lấy thông báo lỗi phù hợp dựa trên loại lỗi
 * @param error - Lỗi từ API
 * @returns string - Thông báo lỗi người dùng có thể đọc được
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) {
    // Xử lý các thông báo lỗi phổ biến
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      return 'Cannot connect to server. Please check your internet connection.';
    }
    
    if (error.message.includes('timeout')) {
      return 'Server is taking too long to respond. Please try again later.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};
