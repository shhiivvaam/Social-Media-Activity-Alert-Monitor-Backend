import { StorageInterface } from '../interfaces/storage.interface';
import { PostgresStorage } from './storage/postgres.storage';
import { FileStorage } from './storage/file.storage';

class StorageFactory {
    private instance: StorageInterface | null = null;

    async getStorage(): Promise<StorageInterface> {
        if (this.instance) return this.instance;

        // Try Postgres
        try {
            if (!process.env.DATABASE_URL) throw new Error("No DATABASE_URL set");

            console.log('Attempting to connect to PostgreSQL...');
            const postgres = new PostgresStorage();
            await postgres.connect();

            // Simple verification
            await postgres.getMonitoredAccounts();

            this.instance = postgres;
            console.log('Using PostgreSQL Storage.');
        } catch (error) {
            console.warn('-------- WARNING --------');
            console.warn('Failed to connect to PostgreSQL or Prisma error.');
            console.warn('Falling back to File-based local storage (db.json).');
            console.warn('Error detail:', error);
            console.warn('-------------------------');

            const file = new FileStorage();
            await file.connect();
            this.instance = file;
        }

        return this.instance;
    }
}

export const storageFactory = new StorageFactory();
