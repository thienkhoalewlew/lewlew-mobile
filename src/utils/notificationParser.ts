/**
 * Parse notification message from backend
 * Backend sends messages in format: "messageKey|param1|param2|..."
 * This function converts it to localized text
 */
export function parseNotificationMessage(message: string, t: any): string {
  // Check if the message is in the new format with pipe separator
  if (message && message.includes('|')) {
    const parts = message.split('|');
    const messageKey = parts[0];
    
    switch (messageKey) {
      case 'friendRequest':
      case 'friendAccept':
      case 'postLike':
      case 'postComment':
      case 'commentLike':
      case 'nearbyPost':
      case 'friendPost':
        return t(`notifications.${messageKey}`);
          case 'reportApproved':
        const reportReason1 = parts[1];
        // First check if we have a direct translation for this report reason
        let translatedReason1 = '';
        try {
          translatedReason1 = t(`posts.reportReasons.${reportReason1}`);
          // If it returns the key itself, we don't have a translation
          if (translatedReason1 === `posts.reportReasons.${reportReason1}`) {
            translatedReason1 = reportReason1; // Fallback to the raw value
          }
        } catch (error) {
          console.warn(`No translation found for report reason: ${reportReason1}`);
          translatedReason1 = reportReason1; // Fallback to the raw value
        }
        return t('notifications.reportApproved', { reportReason: translatedReason1 });
        
      case 'reportRejected':
        const reportReason2 = parts[1];
        const adminNotes = parts[2];
        
        // Get translated reason with fallback
        let translatedReason2 = '';
        try {
          translatedReason2 = t(`posts.reportReasons.${reportReason2}`);
          if (translatedReason2 === `posts.reportReasons.${reportReason2}`) {
            translatedReason2 = reportReason2;
          }
        } catch (error) {
          console.warn(`No translation found for report reason: ${reportReason2}`);
          translatedReason2 = reportReason2;
        }
        
        if (adminNotes) {
          return t('notifications.reportRejectedWithNotes', { 
            reportReason: translatedReason2, 
            adminNotes 
          });
        } else {
          return t('notifications.reportRejected', { reportReason: translatedReason2 });
        }
        
      case 'reportUnderReview':
        const reportReason3 = parts[1];
        
        // Get translated reason with fallback
        let translatedReason3 = '';
        try {
          translatedReason3 = t(`posts.reportReasons.${reportReason3}`);
          if (translatedReason3 === `posts.reportReasons.${reportReason3}`) {
            translatedReason3 = reportReason3;
          }
        } catch (error) {
          console.warn(`No translation found for report reason: ${reportReason3}`);
          translatedReason3 = reportReason3;
        }
        
        return t('notifications.reportUnderReview', { reportReason: translatedReason3 });
        
      case 'postRemoved':
        const removalReason = parts[1];
        if (removalReason) {
          return t(`notifications.postRemovedFor${removalReason.charAt(0).toUpperCase() + removalReason.slice(1)}`);
        }
        return t('notifications.postRemovedForViolation');
        
      case 'friendDelete':
        return t('notifications.friendDelete');
        
      default:
        // For any unknown key format, try to use the key directly as a translation key
        return t(`notifications.${messageKey}`);
    }
  }
  
  // Handle legacy format messages with direct translation mapping
  // Map of backend messages to translation keys
  const messageMap: Record<string, string> = {
    // Vietnamese messages from backend (legacy)
    'đã thích bài viết của bạn': t('notifications.postLike'),
    'đã bình luận bài viết của bạn': t('notifications.postComment'),
    'đã thích bình luận của bạn': t('notifications.commentLike'),
    'đã gửi lời mời kết bạn cho bạn': t('notifications.friendRequest'),
    'đã chấp nhận lời mời kết bạn của bạn': t('notifications.friendAccept'),
    'đã đăng bài gần bạn': t('notifications.nearbyPost'),
    'đã đăng bài viết mới': t('notifications.friendPost'),
    'đã xóa kết bạn với bạn': t('notifications.friendDelete'),
    
    // Legacy English messages (for backward compatibility)
    'has liked your post': t('notifications.postLike'),
    'has commented on your post': t('notifications.postComment'),
    'has liked your comment': t('notifications.commentLike'),
    'has sent you a friend request': t('notifications.friendRequest'),
    'has accepted your friend request': t('notifications.friendAccept'),
    'has posted nearby you': t('notifications.nearbyPost'),
    'has posted a new post': t('notifications.friendPost'),
    'has removed you as a friend': t('notifications.friendDelete'),
    
    // System notification messages for post removal
    'Your post has been removed for violating our community guidelines': t('notifications.postRemovedForViolation'),
    'Your post has been removed for inappropriate content': t('notifications.postRemovedForInappropriateContent'),
    'Your post has been removed for violent content': t('notifications.postRemovedForViolence'),
    'Your post has been removed for graphic content': t('notifications.postRemovedForGore'),
    'Your post has been removed for bloody content': t('notifications.postRemovedForBlood'),
    'Your post has been removed for graphic violence': t('notifications.postRemovedForGraphicViolence'),
    'Your post has been automatically removed due to policy violations detected by our AI system.': t('notifications.postRemovedForAIDetection'),
  };
  
  // Check for exact match
  if (messageMap[message]) {
    return messageMap[message];
  }
  
  // Check for partial matches for report messages that include dynamic content
  for (const [key, value] of Object.entries(messageMap)) {
    if (message && message.includes(key)) {
      return message.replace(key, value);
    }
  }
  
  // Return original message if no translation found
  return message || '';
}
