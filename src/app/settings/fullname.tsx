import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import { Button } from '../../components/Button';

export default function UpdateFullnameScreen() {
  const router = useRouter();
  const { currentUser, updateFullname, isLoading } = useUserStore();
  const [fullname, setFullname] = useState('');

  const handleUpdateFullname = async () => {
    if (!fullname.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    try {
      await updateFullname(fullname.trim());
      Alert.alert('Success', 'Full name updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update full name');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Update Full Name</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Current fullname display */}
        <View style={styles.currentValueContainer}>
          <Text style={styles.label}>Current full name</Text>
          <Text style={styles.currentValue}>{currentUser?.fullname || 'Not set'}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New full name</Text>
          <TextInput
            style={styles.input}
            value={fullname}
            onChangeText={setFullname}
            placeholder="Enter new full name"
            placeholderTextColor={colors.textLight}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <Button
          title="Update Full Name"
          onPress={handleUpdateFullname}
          style={styles.button}
          isLoading={isLoading}
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
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  currentValueContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    marginTop: 8,
  },
}); 