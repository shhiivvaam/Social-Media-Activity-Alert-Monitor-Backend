"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageFactory = void 0;
const postgres_storage_1 = require("./storage/postgres.storage");
const file_storage_1 = require("./storage/file.storage");
class StorageFactory {
    constructor() {
        this.instance = null;
    }
    async getStorage() {
        if (this.instance)
            return this.instance;
        // Try Postgres
        try {
            if (!process.env.DATABASE_URL)
                throw new Error("No DATABASE_URL set");
            console.log('Attempting to connect to PostgreSQL...');
            const postgres = new postgres_storage_1.PostgresStorage();
            await postgres.connect();
            // Simple verification
            await postgres.getMonitoredAccounts();
            this.instance = postgres;
            console.log('Using PostgreSQL Storage.');
        }
        catch (error) {
            console.warn('-------- WARNING --------');
            console.warn('Failed to connect to PostgreSQL or Prisma error.');
            console.warn('Falling back to File-based local storage (db.json).');
            console.warn('Error detail:', error);
            console.warn('-------------------------');
            const file = new file_storage_1.FileStorage();
            await file.connect();
            this.instance = file;
        }
        return this.instance;
    }
}
exports.storageFactory = new StorageFactory();
