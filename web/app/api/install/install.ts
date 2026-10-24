import { useApiClient } from '@/api/client';
import type { InstallRequest, InstallStatus } from '~~/shared/contracts/install';

export function fetchInstallStatus(): Promise<InstallStatus> {
  return useApiClient()<InstallStatus>('/api/install/status');
}

export function install(payload: InstallRequest): Promise<{ email: string }> {
  return useApiClient()<{ email: string }>('/api/install', { method: 'POST', body: payload });
}
