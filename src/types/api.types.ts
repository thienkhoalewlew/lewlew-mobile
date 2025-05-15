// Interface cho dữ liệu từ backend
export interface BackendUser {
  id: string;
  fullname: string;
  email: string;
  avatar?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  friends?: BackendUser[];
  friendRequests?: string[];
  settings?: any;
  createdAt: string;
  updatedAt: string;
  token?: string;
}

export interface RegisterResponse {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  token: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  fullName: string;
  token: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
