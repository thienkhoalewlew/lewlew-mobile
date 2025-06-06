import { Notification } from "../types";
import { api } from "./api";
 export const mapBackendNotificationToAppNotification = (backendNotification: any): Notification => {
    // Log để debug
    console.log('Mapping notification:', JSON.stringify(backendNotification));
    
    if (!backendNotification) {
        console.error('Received undefined notification data');
        // Trả về thông báo mặc định nếu dữ liệu không tồn tại
        return {
            id: 'unknown',
            recipientId: '',
            senderId: '',
            type: 'friend_request' as any,
            message: 'Thông báo không xác định',
            read: false,
            createdAt: new Date(),
        };
    }

    // Chuyển đổi _id thành id nếu cần
    const id = backendNotification.id || backendNotification._id;
    
    // Chuyển đổi recipient và sender nếu chúng là objects
    const recipientId = typeof backendNotification.recipient === 'object' ? 
        backendNotification.recipient?._id || '' : 
        backendNotification.recipientId || backendNotification.recipient || '';
    
    // Xử lý đặc biệt cho sender object
    let senderId = '';
    if (typeof backendNotification.sender === 'object') {
        senderId = backendNotification.sender?._id || '';
        // Lấy username nếu có để hiển thị trong message
        if (backendNotification.sender?.username) {
            console.log('Found sender username:', backendNotification.sender.username);
        }
    } else {
        senderId = backendNotification.senderId || backendNotification.sender || '';
    }
      // Map backend notification types to client enum types
    let notificationType;
    switch (backendNotification.type) {
        case 'friend_request':
            notificationType = 'FRIEND_REQUEST';
            break;
        case 'friend_accept':
            notificationType = 'FRIEND_ACCEPTED';
            break;
        case 'like':
            notificationType = 'POST_LIKE';
            break;
        case 'comment':
            notificationType = 'POST_COMMENT';
            break;
        case 'nearby_post':
            notificationType = 'POST_VIRAL';
            break;
        case 'friend_post':
            notificationType = 'FRIEND_POST';
            break;
        default:
            notificationType = 'FRIEND_REQUEST';
    }

    return {
        id: id || '',
        recipientId,
        senderId,
        type: notificationType as any,
        message: backendNotification.message || '',
        read: !!backendNotification.read,
        postId: backendNotification.postId || backendNotification.post,
        commentId: backendNotification.commentId || backendNotification.comment,
        createdAt: backendNotification.createdAt ? new Date(backendNotification.createdAt) : new Date(),
    };
};

export const getNotifications = async (): Promise<Notification[]> => {
    try{
        console.log("Fetching notifications from API...");
        const response = await api.notifications.getNotifications();
        console.log("API response for notifications:", JSON.stringify(response));

        if(response.data){
            const mappedNotifications = Array.isArray(response.data)
                ? response.data.map(mapBackendNotificationToAppNotification)
                : [];
            console.log("Mapped notifications count:", mappedNotifications.length);
            return mappedNotifications;
        }

        console.log("No notification data in response");
        return [];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try{
        const response = await api.notifications.markAsRead(notificationId);
        return !response.error;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
}

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
    try {
        console.log('NotificationService: Starting markAllNotificationsAsRead...');
        const response = await api.notifications.markAllAsRead();
        console.log('NotificationService: markAllAsRead response:', response);
        
        // Check if the response has an error
        if (response.error) {
            console.error('NotificationService: API error:', response.error);
            return false;
        }
        
        // If no error and we have data (success message), consider it successful
        if (response.data) {
            console.log('NotificationService: markAllAsRead successful, received:', response.data);
            return true;
        }
        
        // If no error and no data, still consider it successful (some APIs return empty success)
        console.log('NotificationService: markAllAsRead successful (no data returned)');
        return true;
    } catch (error) {
        console.error("NotificationService: Error marking all notifications as read:", error);
        return false;
    }
}