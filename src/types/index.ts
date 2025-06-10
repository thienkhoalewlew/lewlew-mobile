export interface User {
  id: string; // ID của người dùng
  username: string; // Tên người dùng
  fullname: string; // Tên đầy đủ của người dùng
  phoneNumber: string; // Số điện thoại của người dùng
  avatar: string; // URL ảnh đại diện
  bio?: string; // Tiểu sử của người dùng (nếu có)
  friendCount: number; // Số lượng bạn bè
  status: 'none' | 'pending' | 'accepted' | 'rejected'; // Trạng thái kết bạn
  requestId?: string; // ID của yêu cầu kết bạn (nếu có)
  isRequestSender?: boolean; // Có phải là người gửi yêu cầu kết bạn không
  createdAt: Date; // Ngày tạo tài khoản
  token?: string; // JWT token từ backend (nếu có)
  phoneVerified?: boolean; // Trạng thái xác minh số điện thoại
  settings?: {
    notificationRadius: number; // Bán kính thông báo (km)
    language: 'en' | 'vi'; // Ngôn ngữ
  };
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
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
  expiresAt?: Date;
  user?: {
    _id: string;
    fullname: string;
    username?: string;
    avatar?: string;
    bio?: string;
  };
}

export interface Comment {
  id: string;
  postId: string;
  user: User;
  text: string;
  image?: string;
  createdAt: string;
}

export interface CreateCommentData {
  postId: string;
  text?: string;
  image?: string;
}

export interface CommentState {
  comments: { [postId: string]: Comment[] };
  loading: boolean;
  error: string | null;
  createComment: (commentData: CreateCommentData) => Promise<boolean>;
  getComments: (postId: string) => Promise<void>;
  deleteComment: (commentId: string, postId: string) => Promise<boolean>;
  clearComments: (postId: string) => void;
  clearError: () => void;
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
  isInitialized: boolean;
  initialize: () => Promise<void>;
  register: (fullName: string, phoneNumber: string, password: string, username: string) => Promise<void>;
  login: (login: string, password: string) => Promise<void>; // login can be phone or username
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
  clearError: () => void;
  fetchUserProfile: () => Promise<void>;
  sendVerificationCode: (phoneNumber: string) => Promise<void>;
  verifyCode: (phoneNumber: string, code: string) => Promise<void>;
  // Forgot Password methods
  sendForgotPasswordCode: (phoneNumber: string) => Promise<void>;
  verifyForgotPasswordCode: (phoneNumber: string, code: string) => Promise<void>;
  resetPassword: (phoneNumber: string, code: string, newPassword: string) => Promise<void>;
}

export interface PostState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  createPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => Promise<Post | null>;
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  getNearbyPosts: (region: Region) => Promise<Post[]>;
  getFriendPosts: () => Promise<Post[]>;
  getUserPosts: (includeExpired?: boolean) => Promise<Post[]>;
  getPostById: (postId: string) => Promise<Post | null>;
}

export interface LocationState {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  currentLocationName: string | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  reverseGeocode: (latitude: number, longitude: number) => Promise<string | null>;
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
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
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

export interface Report {
  id: string;
  postId: string;
  reporterId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  aiAnalysis?: {
    shouldAutoDelete: boolean;
    confidenceScore: number;
    prediction: string;
    analysis: {
      textAnalysis: any;
      imageAnalysis: any;
      metadata: any;
    };
  };
  reviewedBy?: string;
  reviewedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  VIOLENCE = 'violence',
  GORE = 'gore',
  BLOOD = 'blood',
  GRAPHIC_VIOLENCE = 'graphic_violence'
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  AUTO_RESOLVED = 'auto_resolved'
}

export interface CreateReportData {
  postId: string;
  reason: ReportReason;
}

export interface ReportState {
  reports: Report[];
  loading: boolean;
  error: string | null;
  reportPost: (reportData: CreateReportData) => Promise<boolean>;
  clearError: () => void;
}