import fs from 'fs';
import path from 'path';
import { StorageInterface, MonitoredAccount, NotificationGroup } from '../../interfaces/storage.interface';
import { Platform } from '@prisma/client';

const DB_FILE = process.env.DB_FILE_PATH || path.join(__dirname, '../../../db.json');

interface DBData {
    monitoredAccounts: MonitoredAccount[];
    notificationGroups: NotificationGroup[];
}

export class FileStorage implements StorageInterface {
    private data: DBData;

    constructor() {
        this.data = this.load();
    }

    async connect(): Promise<void> {
        console.log('FileStorage connected (using local JSON file).');
    }

    async disconnect(): Promise<void> {
        // No-op for file
    }

    private load(): DBData {
        if (fs.existsSync(DB_FILE)) {
            const content = fs.readFileSync(DB_FILE, 'utf-8');
            if (content.trim()) {
                return JSON.parse(content);
            }
        }
        return { monitoredAccounts: [], notificationGroups: [] };
    }

    private save() {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    }

    async getMonitoredAccounts(): Promise<MonitoredAccount[]> {
        return this.data.monitoredAccounts;
    }

    async addMonitoredAccount(username: string, platform: Platform): Promise<MonitoredAccount> {
        const newAccount: MonitoredAccount = {
            id: Date.now(),
            username,
            platform,
            createdAt: new Date().toISOString()
        };
        this.data.monitoredAccounts.push(newAccount);
        this.save();
        return newAccount;
    }

    async updateLastPostId(accountId: number, lastPostId: string): Promise<void> {
        const account = this.data.monitoredAccounts.find(a => a.id === accountId);
        if (account) {
            account.lastPostId = lastPostId;
            this.save();
        }
    }

    async getNotificationGroups(platform?: Platform): Promise<NotificationGroup[]> {
        if (platform) {
            return this.data.notificationGroups.filter(g => g.platform === platform);
        }
        return this.data.notificationGroups;
    }

    async addNotificationGroup(name: string, platform: Platform, groupId: string): Promise<NotificationGroup> {
        const newGroup: NotificationGroup = {
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
