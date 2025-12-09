import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Platform } from '@prisma/client';
import { pollerService } from './services/poller.service';
import { consumerService } from './services/consumer.service';
import { whatsAppService } from './services/whatsapp.service';
import { storageFactory } from './services/storage.factory';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Social Media Notification API is running');
});

// Accounts API
app.get('/api/accounts', async (req, res) => {
    try {
        const storage = await storageFactory.getStorage();
        const accounts = await storage.getMonitoredAccounts();
        res.json(accounts);
    } catch (e) {
        res.status(500).json({ error: 'DB Error' });
    }
});

app.post('/api/accounts', async (req, res) => {
    const { username, platform } = req.body;
    if (!username || !platform) {
        res.status(400).json({ error: 'Missing username or platform' });
        return;
    }
    try {
        const storage = await storageFactory.getStorage();
        const newAccount = await storage.addMonitoredAccount(username, platform as Platform);
        res.json(newAccount);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Groups API
app.get('/api/groups', async (req, res) => {
    const { platform } = req.query;
    try {
        const storage = await storageFactory.getStorage();
        const groups = await storage.getNotificationGroups(platform as Platform);
        res.json(groups);
    } catch (e) {
        res.status(500).json({ error: 'DB Error' });
    }
});

app.post('/api/groups', async (req, res) => {
    const { name, platform, groupId } = req.body;
    if (!name || !platform || !groupId) {
        res.status(400).json({ error: 'Missing name, platform or groupId' });
        return;
    }
    try {
        const storage = await storageFactory.getStorage();
        const newGroup = await storage.addNotificationGroup(name, platform as Platform, groupId);
        res.json(newGroup);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// WhatsApp API
app.get('/api/whatsapp/groups', async (req, res) => {
    try {
        const groups = await whatsAppService.getGroups();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch WhatsApp groups' });
    }
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Initialize storage connection (will log which one is used)
    await storageFactory.getStorage();

    // Start background services
    await consumerService.start();
    await pollerService.startPolling();
});

// Cleanup
process.on('SIGTERM', async () => {
    const storage = await storageFactory.getStorage();
    await storage.disconnect();
    process.exit(0);
});
