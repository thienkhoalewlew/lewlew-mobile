/**
 * Parse notification message from backend
 * Backend sends messages in format: "messageKey|param1|param2|..."
 * This function converts it to localized text
 */
export function parseNotificationMessage(message: string, t: any, notificationType?: string): string {
  // Handle empty or undefined messages
  if (!message) {
    return t('notifications.newNotification');
  }

  // Special handling based on notification type for post removal
  if (notificationType === 'post_removed' || notificationType === 'SYSTEM_NOTIFICATION') {
    // This is a post removal notification, not a report approval
    if (/report.*approved|approved.*report|handled/i.test(message)) {
      return t('notifications.postRemovedForViolation');
    }
  }

  // Check if the message is in the new format with pipe separator
  if (message.includes('|')) {
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
        const translatedMessage = t(`notifications.${messageKey}`);
        return translatedMessage || message;
        
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
        const fallbackTranslation = t(`notifications.${messageKey}`);
        return fallbackTranslation !== `notifications.${messageKey}` ? fallbackTranslation : message;
    }
  }

  // Handle simple message keys without pipe separator
  if (message && typeof message === 'string') {
    // Try direct translation first
    const directTranslation = t(`notifications.${message}`);
    if (directTranslation !== `notifications.${message}`) {
      return directTranslation;
    }
  }

  // Special handling for post removal messages
  if (message === 'Report approved and handled') {
    // Check if this is actually a post removal notification based on type
    if (notificationType === 'post_removed' || notificationType === 'SYSTEM_NOTIFICATION') {
      return t('notifications.postRemovedForViolation');
    } else {
      return t('notifications.reportApprovedSimple');
    }
  }
  
  if (message === 'Report rejected') {
    return t('notifications.reportRejectedSimple');
  }
  
  if (message === 'Report under review') {
    return t('notifications.reportUnderReviewSimple');
  }

  // Handle variations of messages using pattern matching
  if (/report.*approved|approved.*report|handled/i.test(message)) {
    // Check notification type to determine if this is post removal or report approval
    if (notificationType === 'post_removed' || notificationType === 'SYSTEM_NOTIFICATION') {
      return t('notifications.postRemovedForViolation');
    } else {
      return t('notifications.reportApprovedSimple');
    }
  }
  
  if (/report.*rejected|rejected.*report/i.test(message)) {
    return t('notifications.reportRejectedSimple');
  }
  
  if (/report.*review|review.*report/i.test(message)) {
    return t('notifications.reportUnderReviewSimple');
  }

  // If no translation found, check if it's a simple key
  if (message && !message.includes(' ') && !message.includes('|')) {
    const keyTranslation = t(`notifications.${message}`);
    if (keyTranslation !== `notifications.${message}`) {
      return keyTranslation;
    }
  }

  // Return original message if no translation found, with fallback
  return message || t('notifications.newNotification');
}
