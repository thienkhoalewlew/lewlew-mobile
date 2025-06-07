import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { User, Mail, Lock } from 'lucide-react-native';

import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { checkBackendConnection, getErrorMessage } from '../../utils/apiUtils';
import { useTranslation } from '../../i18n';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      Alert.alert(t('auth.registrationError'), getErrorMessage(error));
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
    
    // Email validation
    if (!email.trim()) {
      setEmailError(t('auth.emailRequired'));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t('auth.emailInvalid'));
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError(t('auth.passwordRequired'));
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError(t('auth.passwordTooShortRegister'));
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.passwordsNotMatch'));
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        // Kiểm tra kết nối trước khi đăng ký
        const isConnected = await checkBackendConnection();
        if (!isConnected) {
          Alert.alert(
            t('auth.connectionError'),
            t('auth.connectionErrorMessage')
          );
          return;
        }
        
        // Sử dụng fullName cho backend
        await register(fullName, email, password);
      } catch (err) {
        Alert.alert(t('auth.registrationError'), getErrorMessage(err));
      }
    }
  };

  const handleLogin = () => {
    router.push('/login');
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
            <Text style={styles.title}>{t('register.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('register.signUpToGetStarted')}</Text>
          </View>
          
          <View style={styles.form}>
            <Input
              label={t('register.fullName')}
              placeholder={t('register.enterYourFullName')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              error={fullNameError}
              leftIcon={<User size={20} color={colors.textLight} />}
            />
            
            <Input
              label={t('register.email')}
              placeholder={t('register.enterYourEmail')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
              leftIcon={<Mail size={20} color={colors.textLight} />}
            />
            
            <Input
              label={t('register.password')}
              placeholder={t('register.createAPassword')}
              value={password}
              onChangeText={setPassword}
              isPassword
              error={passwordError}
              leftIcon={<Lock size={20} color={colors.textLight} />}
            />
            
            <Input
              label={t('register.confirmPassword')}
              placeholder={t('register.confirmYourPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              error={confirmPasswordError}
              leftIcon={<Lock size={20} color={colors.textLight} />}
            />
            
            <Button
              title={t('register.signUp')}
              onPress={handleRegister}
              isLoading={isLoading}
              style={styles.registerButton}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('register.alreadyHaveAnAccount')}</Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginText}>{t('register.signIn')}</Text>
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
  registerButton: {
    marginTop: 16,
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
  loginText: {
    color: colors.primary,
    fontWeight: '600',
  },
});