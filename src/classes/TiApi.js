"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TiApi = void 0;
const axios_1 = __importDefault(require("axios"));
const Notifications_1 = require("./Notifications");
const getCurrentJobId_1 = require("../functions/getCurrentJobId");
class TiApi {
    constructor({ deploymentId, projectId }) {
        this.notification = new Notifications_1.Notifications('[TI-Deploy/Ti-Api]', {
            info: '🟦',
            success: '🟩',
            warning: '🟨',
            error: '🟥'
        });
        this.deploymentId = '';
        this.projectId = '';
        this.deploymentId = deploymentId;
        this.projectId = projectId;
    }
    updateDeployment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const url = `https://us-central1-tintech-crm.cloudfunctions.net/api/deploy/update-backend/${this.projectId}/${this.deploymentId}`;
            let body = {
                projectId: this.projectId,
                deploymentId: this.deploymentId
            };
            if (data.status)
                body.status = data.status;
            if (data.error)
                body.error = data.error;
            if (data.metadata)
                body = Object.assign(Object.assign({}, body), data.metadata);
            if (data.updateJobUrl) {
                const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
                if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
                    const actionUrl = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
                    const jobId = yield (0, getCurrentJobId_1.getJobId)();
                    body.action = {
                        url: actionUrl,
                        id: +GITHUB_RUN_ID,
                        job: jobId,
                        url2: `${actionUrl}/job/${jobId}`
                    };
                }
                else {
                    this.notification.warning('The environment variables needed to build the job URL could not be obtained');
                }
            }
            this.notification.info(`Calling endpoint ${url} with payload: ${JSON.stringify(body)}`);
            try {
                const res = yield axios_1.default.post(url, body, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                });
                this.notification.success(`Response: ${JSON.stringify(res.data)}`);
            }
            catch (error) {
                if ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) {
                    this.notification.error(`Error calling Intech API: ${error.response.data.message}`);
                }
                else {
                    this.notification.error(`Error calling Intech API: ${error.message}`);
                }
                console.error('Error details:', (_c = error.response) === null || _c === void 0 ? void 0 : _c.data);
            }
        });
    }
}
exports.TiApi = TiApi;
