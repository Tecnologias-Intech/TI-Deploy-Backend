"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseCLIOperator = void 0;
const exec = __importStar(require("@actions/exec"));
const fs = __importStar(require("fs/promises"));
const Notifications_1 = require("./Notifications");
const backend_deployment_status_enum_1 = require("../enums/backend-deployment-status.enum");
class FirebaseCLIOperator {
    constructor(tiApi) {
        this.serviceAccountPath = 'service-account.json';
        this.notification = new Notifications_1.Notifications('[TI-Deploy/Firebase-Cli]');
        this.tiApi = null;
        this.env = Object.assign(Object.assign({}, process.env), { GOOGLE_APPLICATION_CREDENTIALS: this.serviceAccountPath, CI: 'true' });
        this.tiApi = tiApi;
    }
    setup(firebaseAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield ((_a = this.tiApi) === null || _a === void 0 ? void 0 : _a.updateDeployment({ status: backend_deployment_status_enum_1.BackendDeploymentStatus.DEPLOY_SETUP }));
            this.notification.info('Installing Firebase CLI...');
            try {
                yield exec.exec('npm', ['install', '-g', 'firebase-tools@14.15.2'], { env: this.env });
                this.notification.success('Firebase CLI Installed');
            }
            catch (e) {
                this.notification.error('Error installing Firebase CLI');
                throw e;
            }
            this.notification.info('Writing service credentials...');
            yield fs.writeFile(this.serviceAccountPath, firebaseAccount);
            this.notification.success('Service credentials written');
        });
    }
    deployFunctions(targetProject) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield ((_a = this.tiApi) === null || _a === void 0 ? void 0 : _a.updateDeployment({ status: backend_deployment_status_enum_1.BackendDeploymentStatus.DEPLOY_BACKEND }));
            try {
                this.notification.info(`Deploying functions to ${targetProject}`);
                yield exec.exec('firebase', [`use`, targetProject], { env: this.env });
                yield exec.exec('firebase', [`projects:list`], { env: this.env });
                yield exec.exec('firebase', [
                    'deploy',
                    '--only', 'functions',
                    '--project', targetProject
                ], { env: this.env });
                this.notification.success(`Functions deployed to ${targetProject}`);
            }
            catch (e) {
                this.notification.error(` Error deploying function to ${targetProject}`);
                throw e;
            }
        });
    }
}
exports.FirebaseCLIOperator = FirebaseCLIOperator;
