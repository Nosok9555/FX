import { addData, getAllData, updateData } from './db.js';

const HISTORY_STORE = 'clientHistory';

export class ClientHistory {
    constructor() {
        this.init();
    }

    async init() {
        // Инициализация хранилища истории
        const db = await initDB();
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
            db.createObjectStore(HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
        }
    }

    async addTraining(clientId, trainingData) {
        const historyEntry = {
            clientId,
            date: new Date().toISOString(),
            ...trainingData
        };

        // Добавляем запись в историю
        await addData(HISTORY_STORE, historyEntry);

        // Если клиент модульный, списываем тренировку
        const client = await this.getClient(clientId);
        if (client.trainingType === 'module' && client.remainingTrainings > 0) {
            client.remainingTrainings--;
            await updateData('clients', client);
        }

        return historyEntry;
    }

    async getClientHistory(clientId) {
        const allHistory = await getAllData(HISTORY_STORE);
        return allHistory.filter(entry => entry.clientId === clientId);
    }

    async getClientStatistics(clientId) {
        const history = await this.getClientHistory(clientId);
        
        return {
            totalTrainings: history.length,
            totalAmount: history.reduce((sum, entry) => sum + (entry.amount || 0), 0),
            lastTraining: history.length > 0 ? history[history.length - 1].date : null
        };
    }

    async getClient(clientId) {
        const clients = await getAllData('clients');
        return clients.find(client => client.id === clientId);
    }
} 