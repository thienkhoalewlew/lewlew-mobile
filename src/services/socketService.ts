import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';
import { Notification } from '../types';
import { mapBackendNotificationToAppNotification } from './notificationService';

type NotificationCallback = (notification: Notification) => void;

class SocketService {
  private socket: Socket | null = null;
  private notificationCallbacks: NotificationCallback[] = [];
  /**
   * Khởi tạo kết nối socket
   * @param token JWT token của người dùng
   */
  connect(token: string): void {
    // Ngắt kết nối hiện tại nếu có
    this.disconnect();

    // Kiểm tra token
    if (!token) {
      console.error('Socket connect: Token không được cung cấp, không thể kết nối');
      return;
    }

  // Giải mã JWT token để kiểm tra
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(jsonPayload);
        if (!payload.userId && !payload.sub) {
        console.error('Socket connect: Token không chứa userId hoặc sub trong payload');
      }
    } catch (error) {
      console.error('Socket connect: Lỗi giải mã token:', error);
    }

    // Tạo kết nối mới
    const socketUrl = API_URL.replace('/api', '');
    
    this.socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Xử lý sự kiện kết nối
    this.socket.on('connect', () => {
      // Socket connected successfully
    });
    
    // Xử lý lỗi kết nối
    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connect_error:', error.message);
    });

    // Xử lý sự kiện nhận thông báo
    this.socket.on('notification', (notificationData) => {
      const notification = mapBackendNotificationToAppNotification(notificationData);
      
      // Gọi các callback đã đăng ký
      this.notificationCallbacks.forEach((callback) => {
        callback(notification);
      });
    });

    // Xử lý sự kiện ngắt kết nối
    this.socket.on('disconnect', () => {
      // Socket disconnected
    });

    // Xử lý lỗi
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  /**
   * Ngắt kết nối socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Trạng thái kết nối hiện tại
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Đăng ký một callback xử lý khi có thông báo mới
   * @param callback Hàm callback nhận notification
   */
  onNotification(callback: NotificationCallback): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Hủy đăng ký một callback
   * @param callback Hàm callback cần hủy
   */
  offNotification(callback: NotificationCallback): void {
    this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
  }
}

// Export một instance duy nhất của SocketService
export const socketService = new SocketService();