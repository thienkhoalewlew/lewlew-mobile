export interface User {
  id: string; // ID của người dùng
  username: string; // Tên người dùng
  fullname: string; // Tên đầy đủ của người dùng
  email: string; // Email của người dùng
  avatar: string; // URL ảnh đại diện
  bio?: string; // Tiểu sử của người dùng (nếu có)
  friendCount: number; // Số lượng bạn bè
  status: 'none' | 'pending' | 'accepted' | 'rejected'; // Trạng thái kết bạn
  requestId?: string; // ID của yêu cầu kết bạn (nếu có)
  createdAt: Date; // Ngày tạo tài khoản
  token?: string; // JWT token từ backend (nếu có)
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  likes: string[];
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  userId: string;
  postId: string;
  text: string;
  createdAt: Date;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface AuthState { 
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  clearError: () => void;
  fetchUserProfile: () => Promise<void>;
}

export interface PostState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  createPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => Promise<Post | null>;
  likePost: (postId: string, userId: string) => void;
  unlikePost: (postId: string, userId: string) => void;
  addComment: (postId: string, userId: string, text: string) => void;
  deletePost: (postId: string) => void;
  getNearbyPosts: (region: Region) => Promise<Post[]>;
  getFriendPosts: () => Promise<Post[]>;
  getUserPosts: () => Promise<Post[]>;
}

export interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
}

export interface FriendState {
  friends: User[];
  isLoading: boolean;
  error: string | null;
  addFriend: (friendId: string) => void;
  removeFriend: (friendId: string) => void;
  getFriends: (userId: string) => User[];
}

export interface Notification{
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

export enum NotificationType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  POST_VIRAL = 'POST_VIRAL',
  FRIEND_POST = 'FRIEND_POST',
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  socket: any | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  initializeSocket: (token: string) => void;
  disconnectSocket: () => void;
  addNotification: (notification: Notification) => void;
}