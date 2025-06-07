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
import { User, Phone, Lock, MessageSquare, AtSign } from 'lucide-react-native';

import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { checkBackendConnection, getErrorMessage } from '../../utils/apiUtils';
import { useTranslation } from '../../i18n';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, sendVerificationCode, verifyCode, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const { t } = useTranslation();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  
  const [fullNameError, setFullNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');

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
    
    // Username validation
    if (!username.trim()) {
      setUsernameError(t('auth.usernameRequired'));
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError(t('auth.usernameTooShort'));
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError(t('auth.usernameInvalid'));
      isValid = false;
    } else {
      setUsernameError('');
    }
    
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
        
        // Gửi mã xác thực SMS
        await sendVerificationCode(phoneNumber);
        setStep('verify');
        
        // Hiển thị thông báo development mode
        if (__DEV__) {
          Alert.alert(
            'Development Mode', 
            'SMS Service đang ở chế độ Development.\n\nMã xác thực cố định: 123456\n\nKiểm tra console backend để xem chi tiết.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        Alert.alert(t('auth.registrationError'), getErrorMessage(err));
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setVerificationCodeError(t('auth.verificationCodeRequired'));
      return;
    }

    if (verificationCode.length !== 6) {
      setVerificationCodeError(t('auth.verificationCodeInvalid'));
      return;
    }

    try {
      // Xác thực mã và đăng ký
      await verifyCode(phoneNumber, verificationCode);
      await register(fullName, phoneNumber, password, username);
    } catch (err) {
      Alert.alert(t('auth.verificationError'), getErrorMessage(err));
    }
  };

  const handleResendCode = async () => {
    try {
      await sendVerificationCode(phoneNumber);
      Alert.alert(t('auth.success'), t('auth.verificationCodeSent'));
    } catch (err) {
      Alert.alert(t('auth.error'), getErrorMessage(err));
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
            <Text style={styles.title}>
              {step === 'register' ? t('register.createAccount') : t('auth.verifyPhone')}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'register' ? t('register.signUpToGetStarted') : t('auth.enterVerificationCode')}
            </Text>
          </View>
          
          <View style={styles.form}>
            {step === 'register' ? (
              <>
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
                  label={t('auth.username')}
                  placeholder={t('auth.enterUsername')}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  error={usernameError}
                  leftIcon={<AtSign size={20} color={colors.textLight} />}
                />
                
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
                  title={t('auth.sendVerificationCode')}
                  onPress={handleRegister}
                  isLoading={isLoading}
                  style={styles.registerButton}
                />
              </>
            ) : (
              <>
                <Input
                  label={t('auth.verificationCode')}
                  placeholder={t('auth.enterVerificationCode')}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  error={verificationCodeError}
                  leftIcon={<MessageSquare size={20} color={colors.textLight} />}
                />
                
                <Button
                  title={t('auth.verifyAndRegister')}
                  onPress={handleVerifyCode}
                  isLoading={isLoading}
                  style={styles.registerButton}
                />
                
                <TouchableOpacity onPress={handleResendCode} style={styles.resendButton}>
                  <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          <View style={styles.footer}>
            {step === 'register' && (
              <>
                <Text style={styles.footerText}>{t('register.alreadyHaveAnAccount')}</Text>
                <TouchableOpacity onPress={handleLogin}>
                  <Text style={styles.loginText}>{t('register.signIn')}</Text>
                </TouchableOpacity>
              </>
            )}
            {step === 'verify' && (
              <TouchableOpacity onPress={() => setStep('register')}>
                <Text style={styles.loginText}>{t('auth.backToRegister')}</Text>
              </TouchableOpacity>
            )}
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
  resendButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
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