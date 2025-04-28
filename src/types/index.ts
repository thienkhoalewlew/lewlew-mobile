export interface User {
  id: string;
  username: string;
  email: string;
  profileImage: string;
  bio?: string;
  friendIds: string[];
  friendStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
  pendingRequestId?: string; // ID của lời mời kết bạn đang chờ xử lý
  createdAt: Date;
  token?: string; // JWT token từ backend
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
  getFriendPosts: (friendIds: string[]) => Promise<Post[]>;
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