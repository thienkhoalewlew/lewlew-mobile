import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Save } from 'lucide-react-native';

import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { useTranslation } from '../../i18n';

export default function EditProfileScreen() {
  const router = useRouter();
  const { currentUser, updateFullname, updateUsername, isLoading } = useUserStore();
  const { t } = useTranslation();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullname || '');
      setUsername(currentUser.username || '');
    }
  }, [currentUser]);

  const validateForm = () => {
    let isValid = true;

    // Full name validation
    if (!fullName.trim()) {
      setFullNameError(t('auth.fullNameRequired'));
      isValid = false;
    } else if (fullName.length < 2) {
      setFullNameError(t('auth.fullNameTooShort'));
      isValid = false;
    } else {
      setFullNameError('');
    }

    // Username validation
    if (!username.trim()) {
      setUsernameError(t('auth.usernameRequired'));
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError(t('auth.usernameTooShort'));
      isValid = false;    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError(t('profile.usernameInvalidChars'));
      isValid = false;
    } else {
      setUsernameError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      // Update fullname if changed
      if (fullName !== currentUser?.fullname) {
        await updateFullname(fullName);
      }

      // Update username if changed
      if (username !== currentUser?.username) {
        await updateUsername(username);
      }
      Alert.alert(t('common.success'), t('profile.profileUpdatedSuccessfully'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (error) {
         Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('profile.profileUpdateError')
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.editProfile')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Save size={24} color={isLoading ? colors.textLight : colors.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <Input
          label={t('profile.fullName')}
          placeholder={t('profile.enterFullName')}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          error={fullNameError}
        />

        <Input
          label={t('profile.username')}
          placeholder={t('profile.chooseUsername')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          error={usernameError}
        />

        <Text style={styles.note}>
          {t('profile.usernameNote')}
        </Text>
      </ScrollView>      <View style={styles.footer}>
        <Button
          title={t('profile.saveChanges')}
          onPress={handleSave}
          isLoading={isLoading}
          style={styles.saveButton}
        />
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  note: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    width: '100%',
  },
});
