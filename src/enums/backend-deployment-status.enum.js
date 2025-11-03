"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendDeploymentStatus = void 0;
var BackendDeploymentStatus;
(function (BackendDeploymentStatus) {
    BackendDeploymentStatus["PENDING"] = "pending";
    BackendDeploymentStatus["INSTALLING_DEPS"] = "installing_deps";
    BackendDeploymentStatus["BUILD_APP"] = "build_app";
    BackendDeploymentStatus["DEPLOY_SETUP"] = "deploy_setup";
    BackendDeploymentStatus["DEPLOY_BACKEND"] = "deploy_backend";
    BackendDeploymentStatus["GENERATE_PR"] = "generate_pr";
    BackendDeploymentStatus["APPROVE_PR"] = "approve_pr";
    BackendDeploymentStatus["MERGE_PR"] = "merge_pr";
    BackendDeploymentStatus["GENERATE_RELEASE_N_TAG"] = "generate_release_n_tag";
    BackendDeploymentStatus["DEPLOYED"] = "deployed";
})(BackendDeploymentStatus || (exports.BackendDeploymentStatus = BackendDeploymentStatus = {}));
