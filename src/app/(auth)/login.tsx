import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Phone, Lock } from 'lucide-react-native';

import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { checkBackendConnection, getErrorMessage } from '../../utils/apiUtils';
import { useTranslation } from '../../i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('auth.loginError'), getErrorMessage(error));
      clearError();
    }
  }, [error]);
  
  // Kiểm tra kết nối với backend khi màn hình được tải
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        Alert.alert(
          t('auth.connectionError'),
          t('auth.connectionErrorMessage'),
          [{ text: t('common.ok') }]
        );
      }
    };
    
    checkConnection();
  }, []);

  const validateForm = () => {
    let isValid = true;
    
    // Phone number validation
    if (!phoneNumber.trim()) {
      setPhoneError(t('auth.phoneRequired'));
      isValid = false;
    } else if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      setPhoneError(t('auth.phoneInvalid'));
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError(t('auth.passwordRequired'));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t('auth.passwordTooShort'));
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      try {
        // Kiểm tra kết nối trước khi đăng nhập
        const isConnected = await checkBackendConnection();
        if (!isConnected) {
          Alert.alert(
            t('auth.connectionError'),
            t('auth.connectionErrorMessage')
          );
          return;
        }
        
        await login(phoneNumber, password);
      } catch (err) {
        Alert.alert(t('auth.loginError'), getErrorMessage(err));
      }
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>
          </View>
          
          <View style={styles.form}>
            <Input
              label={t('auth.phoneNumber')}
              placeholder={t('auth.enterPhoneNumber')}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
              error={phoneError}
              leftIcon={<Phone size={20} color={colors.textLight} />}
            />
            
            <Input
              label={t('auth.password')}
              placeholder={t('auth.enterPassword')}
              value={password}
              onChangeText={setPassword}
              isPassword
              error={passwordError}
              leftIcon={<Lock size={20} color={colors.textLight} />}
            />
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>
            
            <Button
              title={t('auth.signIn')}
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.loginButton}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.dontHaveAccount')}</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerText}>{t('auth.signUp')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  footerText: {
    color: colors.textLight,
    marginRight: 4,
  },
  registerText: {
    color: colors.primary,
    fontWeight: '600',
  },
});