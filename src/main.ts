import * as core from '@actions/core';
import { FirebaseCLIOperator } from './classes/FirebaseCLI';
import { TiApi } from './classes/TiApi';
import { GithubCLIOperator } from './classes/GithubCLI';
import { YarnCLI } from './classes/YarnCLI';
import { BackendDeploymentStatus } from './enums/backend-deployment-status.enum';

const run = async (): Promise<void> => {
  console.log(`\n\n
    ***********************************
    *****   DEPLOYMENT STARTED    *****
    ***********************************
    \n\n`);

  const newVersion = core.getInput('new-version', { required: true });
  const projectId = core.getInput('project-id', { required: true });
  const deploymentId = core.getInput('deployment-id', { required: true });
  const branchRef = core.getInput('branch');
  const deployPat = core.getInput('deploy-pat', { required: true });
  const botToken = core.getInput('github-token', { required: true });
  const envSecret = core.getInput('env-secret');
  const firebaseServiceAccount = core.getInput('firebase-service-account', { required: true });
  const project = core.getInput('project', { required: true });
  const tiApi = new TiApi({ projectId, deploymentId });

  try {
    await tiApi?.updateDeployment({ updateJobUrl: true });

    const githubCli = new GithubCLIOperator({
      branch: branchRef,
      version: newVersion,
      deployPat,
      botToken,
      tiApi
    });

    await githubCli.newBranch();
    await githubCli.setVersion();

    const yarnCli = new YarnCLI(envSecret, tiApi);
    await yarnCli.install();
    await yarnCli.build();

    const firebaseCLI = new FirebaseCLIOperator(tiApi);
    await firebaseCLI.setup(firebaseServiceAccount);
    await firebaseCLI.deployFunctions(project);

    await githubCli.pushChanges();
    await githubCli.generatePR();
    await githubCli.approvePR();
    await githubCli.mergePR();

    await githubCli.tagAndRelease();
    await tiApi.updateDeployment({ status: BackendDeploymentStatus.DEPLOYED });

    console.log(`\n\n
    ************************************
    *****   DEPLOYMENT FINISHED    *****
    ************************************
    \n\n`);

  } catch (error) {
    let message = '';

    if (error instanceof Error) message = error.message;
    else message = 'An unexpected error occur during execution.';

    await tiApi.updateDeployment({ error: message });
    core.setFailed(message);
  }
};

run();
