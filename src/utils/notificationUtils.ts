import { useTranslation } from '../i18n';
import { parseNotificationMessage } from './notificationParser';

/**
 * @deprecated Use parseNotificationMessage from notificationParser.ts instead
 * 
 * Translates notification messages from backend to the user's selected language
 * Supports both Vietnamese and English messages from backend
 * @param message The notification message from the backend
 * @returns The translated message based on the user's language setting
 */
export const translateNotificationMessage = (message: string): string => {
  const { t } = useTranslation();
  console.warn('translateNotificationMessage is deprecated. Use parseNotificationMessage from notificationParser.ts instead');
  return parseNotificationMessage(message, t);
};

/**
 * @deprecated Use parseNotificationMessage from notificationParser.ts instead
 * 
 * Hook version that can be used in React components
 * @param message The notification message from the backend
 * @returns The translated message based on the user's language setting
 */
export const useNotificationMessageTranslation = () => {
  const { t } = useTranslation();
  console.warn('useNotificationMessageTranslation is deprecated. Use parseNotificationMessage from notificationParser.ts instead');
  
  const translateMessage = (message: string): string => {
    return parseNotificationMessage(message, t);
  };
  
  return { translateMessage };
};