"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = exports.Platform = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_FILE = path_1.default.join(__dirname, '../../db.json');
var Platform;
(function (Platform) {
    Platform["INSTAGRAM"] = "INSTAGRAM";
    Platform["TWITTER"] = "TWITTER";
})(Platform || (exports.Platform = Platform = {}));
class DBService {
    constructor() {
        this.data = this.load();
    }
    load() {
        if (fs_1.default.existsSync(DB_FILE)) {
            return JSON.parse(fs_1.default.readFileSync(DB_FILE, 'utf-8'));
        }
        return { monitoredAccounts: [], notificationGroups: [] };
    }
    save() {
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    }
    getMonitoredAccounts() {
        return this.data.monitoredAccounts;
    }
    getNotificationGroups(platform) {
        return this.data.notificationGroups.filter(g => g.platform === platform);
    }
    addMonitoredAccount(username, platform) {
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
    updateLastPostId(accountId, lastPostId) {
        const account = this.data.monitoredAccounts.find(a => a.id === accountId);
        if (account) {
            account.lastPostId = lastPostId;
            this.save();
        }
    }
    addNotificationGroup(name, platform, groupId) {
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
exports.dbService = new DBService();
