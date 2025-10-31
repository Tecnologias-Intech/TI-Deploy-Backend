import * as exec from '@actions/exec';
import * as fs from 'fs/promises';
import { Notifications } from './Notifications';
import { TiApi } from './TiApi';
import { BackendDeploymentStatus } from '../enums/backend-deployment-status.enum';

export class YarnCLI {
  environment: string;
  tiApi: TiApi | null = null;

  private notification = new Notifications('[TI-Deploy/Yarn-Cli]');

  constructor(environment: string, tiApi: TiApi) {
    this.environment = environment;
    this.tiApi = tiApi;
  }

  public async install(): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.INSTALLING_DEPS });

    try {
      this.notification.info('Installing dependencies...');
      await exec.exec('yarn', ['install'], { cwd: 'functions' });
    } catch (e) {
      this.notification.error('Error installing dependencies');
      throw e;
    }
  }

  public async build(): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.BUILD_APP });

    try {
      if (this.environment) {
        this.notification.info('Configuring environment.ts file');
        await fs.writeFile('functions/src/environment.ts', this.environment);
        this.notification.success('functions/src/environment.ts file configured');
      }

      this.notification.info('Building application');
      await exec.exec('yarn', ['run', 'build'], { cwd: 'functions' });
      this.notification.success('Application built');
    } catch (e) {
      this.notification.error('Error building application');
      throw e;
    }
  }
}
