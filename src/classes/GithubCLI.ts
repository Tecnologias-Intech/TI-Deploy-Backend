import * as exec from '@actions/exec';
import * as github from '@actions/github';
import fs from 'fs/promises';
import { GitHub } from '@actions/github/lib/utils';
import { Notifications } from './Notifications';
import { TiApi } from './TiApi';
import { BackendDeploymentStatus } from '../enums/backend-deployment-status.enum';

export class GithubCLIOperator {
  branch = '';
  version = '';
  versionBranch = '';

  owner = '';
  repo = '';
  prNumber = 0;

  patOctokit: InstanceType<typeof GitHub> | null = null;
  botOctokit: InstanceType<typeof GitHub> | null = null;

  private notification = new Notifications('[TI-Deploy/Github-Cli]');
  tiApi: TiApi | null = null;

  constructor({
    branch,
    version,
    deployPat,
    botToken,
    tiApi
  }: {
    branch: string,
    version: string,
    deployPat: string
    botToken: string,
    tiApi: TiApi
  }) {
    this.branch = branch;
    this.version = version;
    this.versionBranch = `version-update-${this.version}`;

    this.owner = github.context.repo.owner;
    this.repo = github.context.repo.repo;

    this.patOctokit = github.getOctokit(deployPat);
    this.botOctokit = github.getOctokit(botToken);
    this.tiApi = tiApi;
  }

  public async newBranch(): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.SETTING_VERSION });

    try {
      this.notification.info(`Setting up new branch ${this.versionBranch}`);
      await exec.exec('git', ['fetch', 'origin', this.branch]);
      await exec.exec('git', ['checkout', '-b', this.versionBranch, `origin/${this.branch}`]);

    } catch (e) {
      this.notification.error(`Could not create new branch`);
      throw e;
    }
  }

  public async setVersion(): Promise<void> {
    try {
      this.notification.info(`Setting up new version ${this.version} into .version`);
      await fs.writeFile('.version', this.version, 'utf8');
    } catch (e) {
      this.notification.error(`Could not set new version`);
      throw e;
    }
  }

  public async pushChanges(): Promise<void> {
    try {
      this.notification.info(`Setting up bot credentials`);
      await exec.exec('git', ['config', 'user.name', 'github-actions[bot]']);
      await exec.exec('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
    } catch (e) {
      this.notification.error(`Could not set bot credentials`);
      throw e;
    }

    try {
      this.notification.info(`Generating commit and pushing changes`);
      await exec.exec('git', ['add', '.version']);
      await exec.exec('git', ['commit', '-m', `New version release: v${this.version}`]);
      await exec.exec('git', ['push', '-f', 'origin', this.versionBranch]);

    } catch (e) {
      this.notification.error(`Could not push changes`);
      throw e;
    }
  }

  public async generatePR(): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.GENERATE_PR });
    
    try {
      this.notification.info(`Generating new pull request`);
      const prTitle = `New release v${this.version}`;
      const prBody = `This PR updated version to ${this.version} on production.`;

      const prResponse = await this.botOctokit!.rest.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: prTitle,
        head: this.versionBranch,
        base: this.branch,
        body: prBody
      });

      this.prNumber = prResponse.data.number;
      const prUrl = prResponse.data.html_url;
      this.notification.success(`Pull request generated: ${prUrl}`);
    } catch (e) {
      this.notification.error(`Pull request not generated`);
      throw e;
    }
  }

  public async approvePR(): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.APPROVE_PR });

    try {
      this.notification.info(`Approving pull request - ${this.prNumber}`);
      await this.patOctokit!.rest.pulls.createReview({
        owner: this.owner,
        repo: this.repo,
        pull_number: this.prNumber,
        event: 'APPROVE'
      });
      this.notification.success(`Pull request approved`);
    } catch (e) {
      this.notification.error(`Pull request not approved`);
      throw e;
    }
  }

  public async mergePR(): Promise<void> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.MERGE_PR });

    try {
      this.notification.info(`Merging pull request - ${this.prNumber}`);
      await this.patOctokit!.rest.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: this.prNumber,
        merge_method: 'merge'
      });
      this.notification.success(`Pull request merged`);
    } catch (e) {
      this.notification.error(`Pull request not merged`);
      throw e;
    }
  }

  public async tagAndRelease(): Promise<{ id: number, url: string }> {
    await this.tiApi?.updateDeployment({ status: BackendDeploymentStatus.GENERATE_RELEASE_N_TAG });

    const tagName = `v${this.version}`;

    try {
      this.notification.info(`Creating and pushing Git Tag: ${tagName}`);
      await exec.exec('git', ['tag', tagName]);
      await exec.exec('git', ['push', 'origin', tagName]);

      this.notification.success(`Tag ${tagName} created and pushed.`);
    } catch (e) {
      this.notification.error('Could not create or push Git Tag. Aborting Release.');
      throw e;
    }

    try {
      this.notification.info(`Creating GitHub Release for ${tagName}`);
      const releaseName = `Release ${tagName}`;
      const releaseBody = `Manual release\n- Deployment from ${this.branch}\n- Version update to ${this.version}`;

      const releaseResponse = await this.botOctokit!.rest.repos.createRelease({
        owner: this.owner,
        repo: this.repo,
        tag_name: tagName,
        name: releaseName,
        body: releaseBody,
        draft: false,
        prerelease: false,
        target_commitish: this.branch
      });

      const releaseId = releaseResponse.data.id;
      const releaseUrl = releaseResponse.data.html_url;

      await this.tiApi?.updateDeployment({
        metadata: {
          release: {
            id: releaseId,
            url: releaseUrl
          }
        }
      });

      this.notification.success(`Release generated: ${releaseUrl}`);
      return { id: releaseId, url: releaseUrl };

    } catch (e) {
      this.notification.error('Could not create GitHub Release.');
      throw e;
    }
  }
}
