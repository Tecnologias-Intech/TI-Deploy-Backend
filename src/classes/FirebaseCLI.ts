import * as exec from '@actions/exec';
import * as fs from 'fs/promises';
import { Notifications } from './Notifications';
import { TiApi } from './TiApi';
import { BackendDeploymentStatus } from '../enums/backend-deployment-status.enum';

export class FirebaseCLIOperator {
  private serviceAccountPath = 'service-account.json';
  private readonly env: { [key: string]: any };
  private notification = new Notifications('[TI-Deploy/Firebase-Cli]');
  tiApi: TiApi | null = null;

  constructor(tiApi: TiApi) {
    this.env = {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: this.serviceAccountPath,
      CI: 'true'
    };

    this.tiApi = tiApi;
  }

  public async setup(firebaseAccount: string): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.DEPLOY_SETUP });
    this.notification.info('Installing Firebase CLI...');

    try {
      await exec.exec('npm', ['install', '-g', 'firebase-tools@14.15.2'], { env: this.env });
      this.notification.success('Firebase CLI Installed');
    } catch (e) {
      this.notification.error('Error installing Firebase CLI');
      throw e;
    }

    this.notification.info('Writing service credentials...');
    await fs.writeFile(this.serviceAccountPath, firebaseAccount);
    this.notification.success('Service credentials written');
  }

  public async deployFunctions(targetProject: string): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.DEPLOY_BACKEND });

    try {
      this.notification.info(`Deploying functions to ${targetProject}`);
      await exec.exec('firebase', [`use`, targetProject], { env: this.env });
      await exec.exec('firebase', [`projects:list`], { env: this.env });
      await exec.exec('firebase', [
        'deploy',
        '--only', 'functions',
        '--project', targetProject
      ], { env: this.env });

      this.notification.success(`Functions deployed to ${targetProject}`);
    } catch (e) {
      this.notification.error(` Error deploying function to ${targetProject}`);
      throw e;
    }
  }
}
