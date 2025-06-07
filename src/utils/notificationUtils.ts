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
    };

    // Return translated message if found, otherwise return original message
    return messageMap[message] || message;
  };

  return { translateMessage };
};
