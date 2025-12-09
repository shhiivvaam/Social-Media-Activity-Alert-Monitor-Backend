import { PrismaClient, Platform } from '@prisma/client';
import { StorageInterface, MonitoredAccount, NotificationGroup } from '../../interfaces/storage.interface';

export class PostgresStorage implements StorageInterface {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async connect(): Promise<void> {
        await this.prisma.$connect();
        console.log('Connected to PostgreSQL via Prisma.');
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
    }

    async getMonitoredAccounts(): Promise<MonitoredAccount[]> {
        return this.prisma.monitoredAccount.findMany();
    }

    async addMonitoredAccount(username: string, platform: Platform): Promise<MonitoredAccount> {
        return this.prisma.monitoredAccount.create({
            data: { username, platform }
        });
    }

    async updateLastPostId(accountId: number, lastPostId: string): Promise<void> {
        await this.prisma.monitoredAccount.update({
            where: { id: accountId },
            data: { lastPostId }
        });
    }

    async getNotificationGroups(platform?: Platform): Promise<NotificationGroup[]> {
        return this.prisma.notificationGroup.findMany({
            where: platform ? { platform } : undefined
        });
    }

    async addNotificationGroup(name: string, platform: Platform, groupId: string): Promise<NotificationGroup> {
        return this.prisma.notificationGroup.create({
            data: { name, platform, groupId }
        });
    }
}
