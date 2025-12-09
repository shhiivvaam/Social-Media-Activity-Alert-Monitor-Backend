"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresStorage = void 0;
const client_1 = require("@prisma/client");
class PostgresStorage {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async connect() {
        await this.prisma.$connect();
        console.log('Connected to PostgreSQL via Prisma.');
    }
    async disconnect() {
        await this.prisma.$disconnect();
    }
    async getMonitoredAccounts() {
        return this.prisma.monitoredAccount.findMany();
    }
    async addMonitoredAccount(username, platform) {
        return this.prisma.monitoredAccount.create({
            data: { username, platform }
        });
    }
    async updateLastPostId(accountId, lastPostId) {
        await this.prisma.monitoredAccount.update({
            where: { id: accountId },
            data: { lastPostId }
        });
    }
    async getNotificationGroups(platform) {
        return this.prisma.notificationGroup.findMany({
            where: platform ? { platform } : undefined
        });
    }
    async addNotificationGroup(name, platform, groupId) {
        return this.prisma.notificationGroup.create({
            data: { name, platform, groupId }
        });
    }
}
exports.PostgresStorage = PostgresStorage;
