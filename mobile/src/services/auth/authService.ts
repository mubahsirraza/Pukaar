
import { apiRequest } from '../api/apiClient';
import { tokenStorage } from './tokenStorage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CITIZEN' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

interface ProfileResponse {
  success: boolean;
  user: AuthUser;
}

interface ApiMessageResponse {
  success: boolean;
  message: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  token: string;
  newPassword: string;
}

async function saveAuthentication(
  data: AuthResponse
): Promise<AuthUser> {
  await tokenStorage.saveToken(data.token);
  return data.user;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthUser> {
    const response = await apiRequest<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        body: data,
      }
    );

    return saveAuthentication(response);
  },

  async login(data: LoginData): Promise<AuthUser> {
    const response = await apiRequest<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: data,
      }
    );

    return saveAuthentication(response);
  },

  async forgotPassword(email: string): Promise<ApiMessageResponse> {
    return apiRequest<ApiMessageResponse>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: {
          email: email.trim().toLowerCase(),
        },
      }
    );
  },

  async resetPassword(
    data: ResetPasswordData
  ): Promise<ApiMessageResponse> {
    return apiRequest<ApiMessageResponse>(
      '/auth/reset-password',
      {
        method: 'POST',
        body: {
          token: data.token,
          newPassword: data.newPassword,
        },
      }
    );
  },

  async getMe(): Promise<AuthUser> {
    const response = await apiRequest<ProfileResponse>(
      '/auth/me',
      {
        authenticated: true,
      }
    );

    return response.user;
  },

  async logout(): Promise<void> {
    await tokenStorage.removeToken();
  },

  async getToken(): Promise<string | null> {
    return tokenStorage.getToken();
  },
};
