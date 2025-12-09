import { Platform } from '@prisma/client';

export interface MonitoredAccount {
    id: number;
    username: string;
    platform: Platform;
    lastPostId?: string | null;
    createdAt: Date | string;
}

export interface NotificationGroup {
    id: number;
    name: string;
    platform: Platform;
    groupId: string;
    createdAt: Date | string;
}

export interface StorageInterface {
    connect(): Promise<void>;
    disconnect(): Promise<void>;

    // Accounts
    getMonitoredAccounts(): Promise<MonitoredAccount[]>;
    addMonitoredAccount(username: string, platform: Platform): Promise<MonitoredAccount>;
    updateLastPostId(accountId: number, lastPostId: string): Promise<void>;

    // Groups
    getNotificationGroups(platform?: Platform): Promise<NotificationGroup[]>;
    addNotificationGroup(name: string, platform: Platform, groupId: string): Promise<NotificationGroup>;
}
