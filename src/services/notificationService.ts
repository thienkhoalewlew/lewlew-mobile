import { Notification } from "../types";
import { api } from "./api";
export const mapBackendNotificationToAppNotification = (backendNotification: any): Notification => {
    if (!backendNotification) {
        console.error('❌ Received undefined notification data');
        // Trả về thông báo mặc định nếu dữ liệu không tồn tại
        return {
            id: 'unknown',
            recipientId: '',
            senderId: '',
            type: 'FRIEND_REQUEST' as any,
            message: 'Thông báo không xác định',
            read: false,
            createdAt: new Date(),
        };
    }

    // Chuyển đổi _id thành id nếu cần
    const id = backendNotification.id || backendNotification._id || '';
    
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
            // Found sender username
        }
    } else {
        senderId = backendNotification.senderId || backendNotification.sender || '';
    }

    // Xử lý đặc biệt cho postId để đảm bảo nó là một chuỗi
    let postId = '';
    if (backendNotification.postId) {
        if (typeof backendNotification.postId === 'object') {
            // Nếu postId là một đối tượng, lấy id hoặc _id của nó
            postId = backendNotification.postId.id || backendNotification.postId._id || '';
        } else {
            // Nếu đã là chuỗi, sử dụng trực tiếp
            postId = String(backendNotification.postId);
        }
    } else if (backendNotification.post) {
        // Trường hợp sử dụng trường 'post' thay vì 'postId'
        if (typeof backendNotification.post === 'object') {
            postId = backendNotification.post.id || backendNotification.post._id || '';
        } else {
            postId = String(backendNotification.post);
        }
    }

    // Tương tự xử lý cho commentId
    let commentId = '';
    if (backendNotification.commentId) {
        if (typeof backendNotification.commentId === 'object') {
            commentId = backendNotification.commentId.id || backendNotification.commentId._id || '';
        } else {
            commentId = String(backendNotification.commentId);
        }
    } else if (backendNotification.comment) {
        if (typeof backendNotification.comment === 'object') {
            commentId = backendNotification.comment.id || backendNotification.comment._id || '';
        } else {
            commentId = String(backendNotification.comment);
        }
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
        case 'comment_like':
            notificationType = 'COMMENT_LIKE';
            break;
        case 'nearby_post':
            notificationType = 'POST_VIRAL';
            break;
        case 'friend_post':
            notificationType = 'FRIEND_POST';
            break;
        case 'post_removed':
            notificationType = 'SYSTEM_NOTIFICATION';
            break;
        case 'report_approved':
            notificationType = 'SYSTEM_NOTIFICATION';
            break;
        case 'report_rejected':
            notificationType = 'SYSTEM_NOTIFICATION';
            break;
        case 'report_under_review':
            notificationType = 'SYSTEM_NOTIFICATION';
            break;
        default:
            console.warn('⚠️ Unknown notification type:', backendNotification.type);
            notificationType = 'FRIEND_REQUEST';
    }

    return {
        id: id || '',
        recipientId,
        senderId,
        type: notificationType as any,
        message: backendNotification.message || 'newNotification',
        read: !!backendNotification.read,
        postId: postId,
        commentId: commentId,
        createdAt: backendNotification.createdAt ? new Date(backendNotification.createdAt) : new Date(),
    };
};

export const getNotifications = async (): Promise<Notification[]> => {
    try{
        const response = await api.notifications.getNotifications();

        if(response.data){
            const mappedNotifications = Array.isArray(response.data)
                ? response.data
                    .filter(notif => notif && (notif.id || notif._id)) // Filter out invalid notifications
                    .map(mapBackendNotificationToAppNotification)
                : [];
            return mappedNotifications;        }
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
        return false;
    }
}

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
    try {
        const response = await api.notifications.markAllAsRead();
        
        // Check if the response has an error
        if (response.error) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}