"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const poller_service_1 = require("./services/poller.service");
const consumer_service_1 = require("./services/consumer.service");
const whatsapp_service_1 = require("./services/whatsapp.service");
const storage_factory_1 = require("./services/storage.factory");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Social Media Notification API is running');
});
// Accounts API
app.get('/api/accounts', async (req, res) => {
    try {
        const storage = await storage_factory_1.storageFactory.getStorage();
        const accounts = await storage.getMonitoredAccounts();
        res.json(accounts);
    }
    catch (e) {
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
        const storage = await storage_factory_1.storageFactory.getStorage();
        const newAccount = await storage.addMonitoredAccount(username, platform);
        res.json(newAccount);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to create account' });
    }
});
// Groups API
app.get('/api/groups', async (req, res) => {
    const { platform } = req.query;
    try {
        const storage = await storage_factory_1.storageFactory.getStorage();
        const groups = await storage.getNotificationGroups(platform);
        res.json(groups);
    }
    catch (e) {
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
        const storage = await storage_factory_1.storageFactory.getStorage();
        const newGroup = await storage.addNotificationGroup(name, platform, groupId);
        res.json(newGroup);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to create group' });
    }
});
// WhatsApp API
app.get('/api/whatsapp/groups', async (req, res) => {
    try {
        const groups = await whatsapp_service_1.whatsAppService.getGroups();
        res.json(groups);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch WhatsApp groups' });
    }
});
// Start server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Initialize storage connection (will log which one is used)
    await storage_factory_1.storageFactory.getStorage();
    // Start background services
    await consumer_service_1.consumerService.start();
    await poller_service_1.pollerService.startPolling();
});
// Cleanup
process.on('SIGTERM', async () => {
    const storage = await storage_factory_1.storageFactory.getStorage();
    await storage.disconnect();
    process.exit(0);
});
