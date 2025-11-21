import { BackendDeploymentStatus } from '../enums/backend-deployment-status.enum';

export interface TiApiUpdateDeployment {
  status?: BackendDeploymentStatus,
  error?: string,
  metadata?: Record<string, any>,
  updateJobUrl?: boolean,
}
