import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { User } from '../types';
import { getUserProfileById, sendFriendRequest } from '../services/userService';
import { colors } from '../constants/colors';
import { UserPlus, UserMinus, Clock } from 'lucide-react-native';

interface UserProfileViewProps {
  userId: string;
  onClose?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ userId, onClose }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await getUserProfileById(userId);
        setUser(userData);
        if (!userData) {
          setError('Cant find user');
        }
      } catch (err) {
        setError('Error fetching user profile');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleSendFriendRequest = async () => {
    if (!user) return;
    
    try {
      setIsSendingRequest(true);
      const result = await sendFriendRequest(user.id);
      
      if (result.success) {
        // Cập nhật trạng thái người dùng với friendStatus pending
        setUser(prevUser => {
          if (prevUser) {
            return { ...prevUser, friendStatus: 'pending' };
          }
          return prevUser;
        });
        Alert.alert('Success', 'Friend request sent successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Cant find user'}</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Image source={{ uri: user.profileImage }} style={styles.avatar} />
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        
        {user.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}
      </View>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.friendIds?.length || 0}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
      </View>
      
      {/* Hiển thị trạng thái kết bạn */}
      <View style={styles.friendStatusContainer}>
        {(!user.friendStatus || user.friendStatus === 'none') && (
          <TouchableOpacity 
            style={styles.friendButton}
            onPress={handleSendFriendRequest}
            disabled={isSendingRequest}
          >
            {isSendingRequest ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <UserPlus size={16} color="white" />
                <Text style={styles.friendButtonText}>Add Friend</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        {user.friendStatus === 'pending' && (
          <View style={styles.pendingContainer}>
            <Clock size={16} color="#F59E0B" />
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
        {user.friendStatus === 'accepted' && (
          <TouchableOpacity style={styles.unfriendButton}>
            <UserMinus size={16} color="white" />
            <Text style={styles.friendButtonText}>Remove Friend</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textLight,
  },
  friendStatusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  unfriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  friendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 16,
    color: '#F59E0B',
    marginLeft: 8,
  },
  closeButton: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default UserProfileView; 