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
import { Phone, MessageSquare, Lock, ArrowLeft } from 'lucide-react-native';

import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { checkBackendConnection, getErrorMessage } from '../../utils/apiUtils';
import { useTranslation } from '../../i18n';

type ForgotPasswordStep = 'phone' | 'verify' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { 
    sendForgotPasswordCode, 
    verifyForgotPasswordCode, 
    resetPassword, 
    isLoading, 
    error, 
    clearError 
  } = useAuthStore();
  const { t } = useTranslation();
  
  const [step, setStep] = useState<ForgotPasswordStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Error states
  const [phoneError, setPhoneError] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), getErrorMessage(error));
      clearError();
    }
  }, [error]);

  // Validate phone number
  const validatePhone = () => {
    if (!phoneNumber.trim()) {
      setPhoneError(t('auth.phoneRequired'));
      return false;
    } else if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
      setPhoneError(t('auth.phoneInvalid'));
      return false;
    } else {
      setPhoneError('');
      return true;
    }
  };

  // Validate verification code
  const validateVerificationCode = () => {
    if (!verificationCode.trim()) {
      setVerificationCodeError(t('auth.verificationCodeRequired'));
      return false;
    } else if (verificationCode.length !== 6) {
      setVerificationCodeError(t('auth.verificationCodeInvalid'));
      return false;
    } else {
      setVerificationCodeError('');
      return true;
    }
  };

  // Validate new password
  const validateNewPassword = () => {
    let isValid = true;
    
    if (!newPassword) {
      setNewPasswordError(t('auth.newPasswordRequired'));
      isValid = false;
    } else if (newPassword.length < 8) {
      setNewPasswordError(t('auth.newPasswordTooShort'));
      isValid = false;
    } else {
      setNewPasswordError('');
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('auth.passwordsNotMatch'));
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  // Handle send reset code
  const handleSendResetCode = async () => {
    if (!validatePhone()) return;

    try {
      // Check connection first
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        Alert.alert(
          t('auth.connectionError'),
          t('auth.connectionErrorMessage')
        );
        return;
      }

      await sendForgotPasswordCode(phoneNumber);
      setStep('verify');
      
      Alert.alert(
        t('common.success'), 
        t('auth.resetCodeSent'),
        [{ text: t('common.ok') }]
      );

      // Show development mode alert
      if (__DEV__) {
        Alert.alert(
          'Development Mode', 
          'SMS Service is in Development mode.\n\nFixed verification code: 123456\n\nCheck backend console for details.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  // Handle verify code
  const handleVerifyCode = async () => {
    if (!validateVerificationCode()) return;

    try {
      await verifyForgotPasswordCode(phoneNumber, verificationCode);
      setStep('reset');
      
      Alert.alert(
        t('common.success'), 
        t('auth.resetCodeVerified'),
        [{ text: t('common.ok') }]
      );
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (!validateNewPassword()) return;

    try {
      await resetPassword(phoneNumber, verificationCode, newPassword);
      
      Alert.alert(
        t('common.success'), 
        t('auth.resetPasswordSuccess'),
        [
          { 
            text: t('common.ok'), 
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    try {
      await sendForgotPasswordCode(phoneNumber);
      Alert.alert(t('common.success'), t('auth.resetCodeSent'));
    } catch (err) {
      Alert.alert(t('common.error'), getErrorMessage(err));
    }
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'phone') {
      router.back();
    } else if (step === 'verify') {
      setStep('phone');
      setVerificationCode('');
      setVerificationCodeError('');
    } else if (step === 'reset') {
      setStep('verify');
      setNewPassword('');
      setConfirmPassword('');
      setNewPasswordError('');
      setConfirmPasswordError('');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'phone': return t('auth.forgotPasswordTitle');
      case 'verify': return t('auth.enterResetCode');
      case 'reset': return t('auth.createNewPassword');
      default: return t('auth.forgotPasswordTitle');
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'phone': return t('auth.forgotPasswordSubtitle');
      case 'verify': return t('auth.enterResetCodeSubtitle');
      case 'reset': return t('auth.createNewPasswordSubtitle');
      default: return t('auth.forgotPasswordSubtitle');
    }
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
          {/* Header with back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
          </View>
          
          <View style={styles.form}>
            {step === 'phone' && (
              <>
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
                
                <Button
                  title={t('auth.sendResetCode')}
                  onPress={handleSendResetCode}
                  isLoading={isLoading}
                  style={styles.actionButton}
                />
              </>
            )}

            {step === 'verify' && (
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
                  title={t('auth.verifyResetCode')}
                  onPress={handleVerifyCode}
                  isLoading={isLoading}
                  style={styles.actionButton}
                />
                
                <TouchableOpacity onPress={handleResendCode} style={styles.resendButton}>
                  <Text style={styles.resendText}>{t('auth.resendResetCode')}</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'reset' && (
              <>
                <Input
                  label={t('auth.newPassword')}
                  placeholder={t('auth.newPassword')}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  isPassword
                  error={newPasswordError}
                  leftIcon={<Lock size={20} color={colors.textLight} />}
                />
                
                <Input
                  label={t('auth.confirmNewPassword')}
                  placeholder={t('auth.confirmNewPassword')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  error={confirmPasswordError}
                  leftIcon={<Lock size={20} color={colors.textLight} />}
                />
                
                <Button
                  title={t('auth.resetPassword')}
                  onPress={handleResetPassword}
                  isLoading={isLoading}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  actionButton: {
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
    alignItems: 'center',
    padding: 20,
  },
  backToLoginText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
