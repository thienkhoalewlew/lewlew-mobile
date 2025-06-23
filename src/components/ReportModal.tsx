import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ReportReason } from '../types';
import { useReportStore } from '../store/reportStore';
import { useTranslation } from '../i18n';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postAuthor?: string;
  onReportSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  postId,
  postAuthor,
  onReportSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [step, setStep] = useState<'reason' | 'success'>('reason');
  
  const { reportPost, loading } = useReportStore();
  const { t } = useTranslation();
  const REPORT_REASONS = [
    { 
      key: ReportReason.INAPPROPRIATE_CONTENT, 
      label: t('posts.reportReasons.inappropriate_content'), 
      description: t('posts.reportReasons.inappropriate_contentDescription') 
    },
    { 
      key: ReportReason.SPAM, 
      label: t('posts.reportReasons.spam'), 
      description: t('posts.reportReasons.spamDescription') 
    },
    { 
      key: ReportReason.VIOLENCE, 
      label: t('posts.reportReasons.violence'), 
      description: t('posts.reportReasons.violenceDescription') 
    },
    { 
      key: ReportReason.GORE, 
      label: t('posts.reportReasons.gore'), 
      description: t('posts.reportReasons.goreDescription') 
    },
    { 
      key: ReportReason.BLOOD, 
      label: t('posts.reportReasons.blood'), 
      description: t('posts.reportReasons.bloodDescription') 
    },
    { 
      key: ReportReason.GRAPHIC_VIOLENCE, 
      label: t('posts.reportReasons.graphicViolence'), 
      description: t('posts.reportReasons.graphicViolenceDescription') 
    },
  ];
  const handleReasonSelect = async (reason: ReportReason) => {
    setSelectedReason(reason);
    
    const success = await reportPost({
      postId,
      reason: reason,
    });
    if (success) {
      setStep('success');
      setTimeout(() => {
        handleClose();
        // Call the success callback after closing
        if (onReportSuccess) {
          onReportSuccess();
        }
      }, 2000);
    } else {
      Alert.alert(t('common.error'), t('posts.reportError'));
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setStep('reason');
    onClose();
  };
  const renderReasonSelection = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('posts.reportModalTitle')}</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      {postAuthor && (
        <Text style={styles.subtitle}>
          {t('posts.reportModalTitle')} {postAuthor}
        </Text>
      )}
      
      <Text style={styles.description}>
        {t('posts.reportReason')} {t('posts.reportReasonHelper')}
      </Text>
      
      <ScrollView style={styles.reasonsList}>
        {REPORT_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.key}
            style={[styles.reasonItem, loading && styles.reasonItemDisabled]}
            onPress={() => handleReasonSelect(reason.key)}
            disabled={loading}
          >
            <View style={styles.reasonContent}>
              <Text style={styles.reasonLabel}>{reason.label}</Text>
              <Text style={styles.reasonDescription}>{reason.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
        </ScrollView>
        {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('posts.reportSubmit')}...</Text>
        </View>
      )}
    </View>
  );
  const renderSuccess = () => (
    <View style={styles.container}>
      <View style={styles.successContent}>
        <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
        <Text style={styles.successTitle}>{t('posts.reportSuccess')}</Text>
        <Text style={styles.successMessage}>
          {t('posts.reportSuccessMessage')}
        </Text>
      </View>
    </View>
  );
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modal}>
        {step === 'reason' && renderReasonSelection()}
        {step === 'success' && renderSuccess()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  reasonsList: {
    flex: 1,
  },  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    borderRadius: 12,
  },
  reasonItemDisabled: {
    opacity: 0.5,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ReportModal;
