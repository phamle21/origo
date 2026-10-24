import { useApiClient } from '@/api/client';
import type { CurrentUser, LoginRequest } from '~~/shared/contracts/auth';

export function fetchCurrentUser(): Promise<CurrentUser> {
  return useApiClient()<CurrentUser>('/api/auth/me');
}

export function login(credentials: LoginRequest): Promise<CurrentUser> {
  return useApiClient()<CurrentUser>('/api/auth/login', { method: 'POST', body: credentials });
}

export function logout(): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>('/api/auth/logout', { method: 'POST' });
}

export function updateProfile(name: string): Promise<CurrentUser> {
  return useApiClient()<CurrentUser>('/api/auth/me', { method: 'PATCH', body: { name } });
}

export function changePassword(payload: { currentPassword: string; password: string; passwordConfirmation: string }): Promise<{ ok: true }> {
  return useApiClient()<{ ok: true }>('/api/auth/password', { method: 'PUT', body: payload });
}
