export enum BackendDeploymentStatus {
  PENDING = 'pending',
  SETTING_VERSION = 'setting_version',
  INSTALLING_DEPS = 'installing_deps',
  BUILD_APP = 'build_app',
  DEPLOY_SETUP = 'deploy_setup',
  DEPLOY_BACKEND = 'deploy_backend',
  GENERATE_PR = 'generate_pr',
  APPROVE_PR = 'approve_pr',
  MERGE_PR = 'merge_pr',
  GENERATE_RELEASE_N_TAG = 'generate_release_n_tag',
  DEPLOYED = 'deployed',
}
