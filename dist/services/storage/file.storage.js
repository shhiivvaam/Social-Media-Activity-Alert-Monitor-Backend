"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_FILE = process.env.DB_FILE_PATH || path_1.default.join(__dirname, '../../../db.json');
class FileStorage {
    constructor() {
        this.data = this.load();
    }
    async connect() {
        console.log('FileStorage connected (using local JSON file).');
    }
    async disconnect() {
        // No-op for file
    }
    load() {
        if (fs_1.default.existsSync(DB_FILE)) {
            const content = fs_1.default.readFileSync(DB_FILE, 'utf-8');
            if (content.trim()) {
                return JSON.parse(content);
            }
        }
        return { monitoredAccounts: [], notificationGroups: [] };
    }
    save() {
        fs_1.default.mkdirSync(path_1.default.dirname(DB_FILE), { recursive: true });
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    }
    async getMonitoredAccounts() {
        return this.data.monitoredAccounts;
    }
    async addMonitoredAccount(username, platform) {
        const newAccount = {
            id: Date.now(),
            username,
            platform,
            createdAt: new Date().toISOString()
        };
        this.data.monitoredAccounts.push(newAccount);
        this.save();
        return newAccount;
    }
    async updateLastPostId(accountId, lastPostId) {
        const account = this.data.monitoredAccounts.find(a => a.id === accountId);
        if (account) {
            account.lastPostId = lastPostId;
            this.save();
        }
    }
    async getNotificationGroups(platform) {
        if (platform) {
            return this.data.notificationGroups.filter(g => g.platform === platform);
        }
        return this.data.notificationGroups;
    }
    async addNotificationGroup(name, platform, groupId) {
        const newGroup = {
            id: Date.now(),
            name,
            platform,
            groupId,
            createdAt: new Date().toISOString()
        };
        this.data.notificationGroups.push(newGroup);
        this.save();
        return newGroup;
    }
}
exports.FileStorage = FileStorage;
