import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  User, 
  Mail, 
  Lock, 
  MapPin,
  Bell,
  Globe,
  LucideIcon
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { useTranslation } from '../i18n';

// Define types for settings items
type BaseSettingItem = {
  icon: LucideIcon;
  label: string;
};

type NavigationSettingItem = BaseSettingItem & {
  onPress: () => void;
  value?: never;
  input?: never;
  toggle?: never;
};

type InputSettingItem = BaseSettingItem & {
  value: string;
  input: React.ReactNode;
  onPress?: never;
  toggle?: never;
};

type ToggleSettingItem = BaseSettingItem & {
  value: boolean;
  toggle: React.ReactNode;
  onPress?: never;
  input?: never;
};

type SettingItem = NavigationSettingItem | InputSettingItem | ToggleSettingItem;

type SettingsSection = {
  title: string;
  items: SettingItem[];
};

export default function SettingsScreen() {
  const router = useRouter();
  const { currentUser, updateUserSettings, isLoading, getCurrentUserProfile } = useUserStore();
  const { language, setLanguage, t } = useTranslation();
  
  // Initialize with null to indicate unloaded state
  const [notificationRadius, setNotificationRadius] = useState<string | null>(null);
  const [pushNotifications, setPushNotifications] = useState<boolean | null>(null);
  const [emailNotifications, setEmailNotifications] = useState<boolean | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'vi'>(language);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Load settings when screen mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Starting to load settings...');
        
        // First load current user to get latest backend data
        const user = await getCurrentUserProfile();
        console.log('Loaded user from backend:', user?.settings);
        if (user?.settings) {
          console.log('Setting values from backend:', {
            radius: user.settings.notificationRadius,
            push: user.settings.pushNotifications,
            email: user.settings.emailNotifications,
            language: user.settings.language
          });
          
          setNotificationRadius(user.settings.notificationRadius.toString());
          setPushNotifications(user.settings.pushNotifications);
          setEmailNotifications(user.settings.emailNotifications);
          setSelectedLanguage(user.settings.language || 'vi');
        } else {
          // If no settings in backend, set defaults
          console.log('No settings found in backend, using defaults');
          setNotificationRadius('5');
          setPushNotifications(true);
          setEmailNotifications(true);
          setSelectedLanguage('vi');
        }      } catch (error) {
        console.error('Error loading settings:', error);
        // Set defaults on error
        setNotificationRadius('5');
        setPushNotifications(true);
        setEmailNotifications(true);
        setSelectedLanguage('vi');
        Alert.alert(t('common.error'), t('settings.settingsLoadError'));
      }
    };

    // Load settings immediately when screen opens
    loadSettings();
  }, []); // Empty dependency array to only run on mount
  // Update form when currentUser changes
  useEffect(() => {
    if (currentUser?.settings) {
      console.log('Updating form from currentUser change:', currentUser.settings);
      setNotificationRadius(currentUser.settings.notificationRadius.toString());
      setPushNotifications(currentUser.settings.pushNotifications);
      setEmailNotifications(currentUser.settings.emailNotifications);
      setSelectedLanguage(currentUser.settings.language);
    }
  }, [currentUser]);

  // Show loading state while initial values are being fetched
  if (notificationRadius === null || pushNotifications === null || emailNotifications === null) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('settings.loadingSettings')}</Text>
      </View>
    );
  }

  const handleUpdateSettings = async () => {
    try {
      const radius = parseInt(notificationRadius);
      if (isNaN(radius) || radius < 1 || radius > 50) {
        Alert.alert(t('settings.invalidRadius'), t('settings.radiusRangeError'));
        return;
      }      const newSettings = {
        notificationRadius: radius,
        pushNotifications,
        emailNotifications,
        language: selectedLanguage
      };

      console.log('Current settings before update:', currentUser?.settings);
      console.log('Submitting new settings:', newSettings);

      // Update settings in backend
      await updateUserSettings(newSettings);

      // Force reload user profile
      const updatedUser = await getCurrentUserProfile();
      
      if (!updatedUser?.settings) {
        throw new Error('Failed to verify updated settings');
      }

      // Verify the settings were actually updated
      console.log('Settings after update:', updatedUser.settings);
        // Update local state to match new settings
      setNotificationRadius(updatedUser.settings.notificationRadius.toString());
      setPushNotifications(updatedUser.settings.pushNotifications);
      setEmailNotifications(updatedUser.settings.emailNotifications);
      setSelectedLanguage(updatedUser.settings.language);
      
      // Update app language if changed
      if (selectedLanguage !== language) {
        setLanguage(selectedLanguage);
      }      Alert.alert(t('common.success'), t('settings.settingsUpdated'), [
        {
          text: t('common.ok'),
          onPress: () => {
            // After alert is dismissed, verify settings are still correct
            console.log('Final settings check:', {
              current: updatedUser.settings,
              local: {
                notificationRadius: parseInt(notificationRadius),
                pushNotifications,
                emailNotifications
              }
            });
            // Navigate directly to profile screen
            router.push('/profile');
          }
        }
      ]);
    } catch (error) {
      console.error('Settings update error:', error);
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to update settings'
      );}
  };

  const languageOptions = [
    { value: 'vi' as const, label: t('settings.vietnamese') },
    { value: 'en' as const, label: t('settings.english') },
  ];

  const handleLanguageSelect = (lang: 'en' | 'vi') => {
    setSelectedLanguage(lang);
    setShowLanguagePicker(false);
  };
  const settingsOptions: SettingsSection[] = [
    {
      title: t('profile.profile'),
      items: [
        {
          icon: User,
          label: t('profile.editProfile'),
          onPress: () => router.push('/settings/fullname'),
        },
        {
          icon: Mail,
          label: t('auth.email'),
          onPress: () => router.push('/settings/email'),
        },
        {
          icon: Lock,
          label: t('profile.changePassword'),
          onPress: () => router.push('/settings/password'),
        },
      ],
    },
    {
      title: t('settings.notifications'),
      items: [
        {
          icon: MapPin,
          label: t('settings.notificationRadius'),
          value: notificationRadius,
          input: (
            <TextInput
              style={styles.radiusInput}
              value={notificationRadius}
              onChangeText={setNotificationRadius}
              keyboardType="numeric"
              placeholder="Radius in km"
            />
          ),
        },
        {
          icon: Bell,
          label: t('settings.pushNotifications'),
          value: pushNotifications,
          toggle: (
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          ),
        },
        {
          icon: Mail,
          label: t('settings.emailNotifications'),
          value: emailNotifications,
          toggle: (
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          ),        },
      ],
    },
    {
      title: t('settings.language'),
      items: [
        {
          icon: Globe,
          label: t('settings.language'),
          onPress: () => setShowLanguagePicker(true),
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const isNavigationItem = 'onPress' in item;
    const isInputItem = 'input' in item;
    const isToggleItem = 'toggle' in item;

    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={isNavigationItem ? item.onPress : undefined}
        disabled={!isNavigationItem}
      >
        <View style={styles.settingItemLeft}>
          <item.icon size={20} color={colors.text} />
          <Text style={styles.settingItemLabel}>{item.label}</Text>
        </View>
        {isInputItem && item.input}
        {isToggleItem && item.toggle}
        {isNavigationItem && (
          <ChevronLeft 
            size={20} 
            color={colors.textLight} 
            style={{ transform: [{ rotate: '180deg' }] }} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/profile')}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.settings')}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleUpdateSettings}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {settingsOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <React.Fragment key={itemIndex}>
                {renderSettingItem(item)}
              </React.Fragment>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            
            {languageOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.languageOption,
                  selectedLanguage === option.value && styles.selectedLanguageOption
                ]}
                onPress={() => handleLanguageSelect(option.value)}
              >
                <Text style={[
                  styles.languageOptionText,
                  selectedLanguage === option.value && styles.selectedLanguageOptionText
                ]}>
                  {option.label}
                </Text>
                {selectedLanguage === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemLabel: {
    fontSize: 16,
    color: colors.text,
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    textAlign: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },  loadingText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLanguageOption: {
    backgroundColor: colors.primary + '20',
  },
  languageOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedLanguageOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.text,
  },
});