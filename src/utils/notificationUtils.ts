import { useTranslation } from '../i18n';

/**
 * Translates notification messages from backend (English) to the user's selected language
 * @param message The notification message from the backend (in English)
 * @returns The translated message based on the user's language setting
 */
export const translateNotificationMessage = (message: string): string => {
  const { t } = useTranslation();
  
  // Map of backend English messages to translation keys
  const messageMap: Record<string, string> = {
    'has liked your post': t('notifications.hasLikedYourPost'),
    'has commented on your post': t('notifications.hasCommentedOnYourPost'),
    'has sent you a friend request': t('notifications.hasSentYouAFriendRequest'),
    'has accepted your friend request': t('notifications.hasAcceptedYourFriendRequest'),
    'has posted nearby you': t('notifications.hasPostedNearbyYou'),
    'has posted a new post': t('notifications.hasPostedANewPost'),
    // System notification messages for post removal
    'Your post has been removed for violating our community guidelines': t('notifications.postRemovedForViolation'),
    'Your post has been removed for inappropriate content': t('notifications.postRemovedForInappropriateContent'),
    'Your post has been removed for violent content': t('notifications.postRemovedForViolence'),
    'Your post has been removed for graphic content': t('notifications.postRemovedForGore'),
    'Your post has been removed for bloody content': t('notifications.postRemovedForBlood'),
    'Your post has been removed for graphic violence': t('notifications.postRemovedForGraphicViolence'),
    'Your post has been automatically removed due to policy violations detected by our AI system.': t('notifications.postRemovedForAIDetection'),
    // Report status messages (partial - these are combined with reason)
    'is being reviewed by our moderation team. We\'ll notify you once it\'s resolved.': t('notifications.reportUnderReview'),
    'has been reviewed and the content has been removed. Thank you for helping keep our community safe.': t('notifications.reportApproved'),
    'has been reviewed and determined not to violate our community guidelines.': t('notifications.reportRejected'),
  };

  // Return translated message if found, otherwise return original message
  return messageMap[message] || message;
};

/**
 * Hook version that can be used in React components
 * @param message The notification message from the backend (in English)
 * @returns The translated message based on the user's language setting
 */
export const useNotificationMessageTranslation = () => {
  const { t } = useTranslation();
  const translateMessage = (message: string): string => {
    // Map of backend English messages to translation keys
    const messageMap: Record<string, string> = {
      'has liked your post': t('notifications.hasLikedYourPost'),
      'has commented on your post': t('notifications.hasCommentedOnYourPost'),
      'has sent you a friend request': t('notifications.hasSentYouAFriendRequest'),
      'has accepted your friend request': t('notifications.hasAcceptedYourFriendRequest'),
      'has posted nearby you': t('notifications.hasPostedNearbyYou'),
      'has posted a new post': t('notifications.hasPostedANewPost'),
      // System notification messages for post removal
      'Your post has been removed for violating our community guidelines': t('notifications.postRemovedForViolation'),
      'Your post has been removed for inappropriate content': t('notifications.postRemovedForInappropriateContent'),
      'Your post has been removed for violent content': t('notifications.postRemovedForViolence'),
      'Your post has been removed for graphic content': t('notifications.postRemovedForGore'),
      'Your post has been removed for bloody content': t('notifications.postRemovedForBlood'),
      'Your post has been removed for graphic violence': t('notifications.postRemovedForGraphicViolence'),
      'Your post has been automatically removed due to policy violations detected by our AI system.': t('notifications.postRemovedForAIDetection'),
      // Report status messages (partial - these are combined with reason)
      'is being reviewed by our moderation team. We\'ll notify you once it\'s resolved.': t('notifications.reportUnderReview'),
      'has been reviewed and the content has been removed. Thank you for helping keep our community safe.': t('notifications.reportApproved'),
      'has been reviewed and determined not to violate our community guidelines.': t('notifications.reportRejected'),
    };

    // Return translated message if found, otherwise return original message
    return messageMap[message] || message;
  };

  return { translateMessage };
};
