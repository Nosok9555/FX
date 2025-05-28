import { addData, getAllData, updateData, deleteData } from './db.js';
import { ClientCard } from '../components/clientCard.js';
import { ClientForm } from '../components/clientForm.js';
import { ClientHistory } from './client-history.js';

export class ClientsManager {
    constructor() {
        this.history = new ClientHistory();
        this.currentClient = null;
        this.filters = {
            name: '',
            color: '',
            type: '',
            status: 'active'
        };
    }

    async init() {
        // Инициализация хранилища клиентов
        const db = await initDB();
        if (!db.objectStoreNames.contains('clients')) {
            db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true });
        }
    }

    async addClient(clientData) {
        // Проверка уникальности имени
        const clients = await this.getAllClients();
        const existingClient = clients.find(c => c.name.toLowerCase() === clientData.name.toLowerCase());
        
        if (existingClient) {
            throw new Error('Клиент с таким именем уже существует');
        }

        return await addData('clients', clientData);
    }

    async updateClient(clientData) {
        // Проверка уникальности имени при обновлении
        const clients = await this.getAllClients();
        const existingClient = clients.find(c => 
            c.name.toLowerCase() === clientData.name.toLowerCase() && 
            c.id !== clientData.id
        );
        
        if (existingClient) {
            throw new Error('Клиент с таким именем уже существует');
        }

        return await updateData('clients', clientData);
    }

    async deleteClient(clientId) {
        // Удаляем историю клиента
        const history = await this.history.getClientHistory(clientId);
        for (const entry of history) {
            await deleteData('clientHistory', entry.id);
        }

        // Удаляем клиента
        return await deleteData('clients', clientId);
    }

    async getAllClients() {
        return await getAllData('clients');
    }

    async getFilteredClients() {
        let clients = await this.getAllClients();

        // Применяем фильтры
        if (this.filters.name) {
            clients = clients.filter(c => 
                c.name.toLowerCase().includes(this.filters.name.toLowerCase())
            );
        }

        if (this.filters.color) {
            clients = clients.filter(c => c.color === this.filters.color);
        }

        if (this.filters.type) {
            clients = clients.filter(c => c.trainingType === this.filters.type);
        }

        if (this.filters.status === 'active') {
            clients = clients.filter(c => 
                c.trainingType === 'single' || 
                (c.trainingType === 'module' && c.remainingTrainings > 0)
            );
        } else if (this.filters.status === 'inactive') {
            clients = clients.filter(c => 
                c.trainingType === 'module' && c.remainingTrainings === 0
            );
        }

        return clients;
    }

    setFilter(type, value) {
        this.filters[type] = value;
    }

    async renderClientList(container) {
        const clients = await this.getFilteredClients();
        container.innerHTML = '';

        if (clients.length === 0) {
            container.innerHTML = '<p class="no-clients">Клиенты не найдены</p>';
            return;
        }

        clients.forEach(client => {
            const card = new ClientCard(client);
            container.appendChild(card.render());
        });
    }

    async renderClientForm(container, clientId = null) {
        let client = null;
        if (clientId) {
            const clients = await this.getAllClients();
            client = clients.find(c => c.id === clientId);
        }

        const form = new ClientForm(client);
        container.innerHTML = '';
        container.appendChild(form.render());

        // Сохраняем текущего клиента
        this.currentClient = client;
    }

    async renderClientHistory(container, clientId) {
        const history = await this.history.getClientHistory(clientId);
        const statistics = await this.history.getClientStatistics(clientId);

        const content = `
            <div class="history-header">
                <h2>История тренировок</h2>
                <div class="statistics">
                    <div class="stat-item">
                        <span class="label">Всего тренировок:</span>
                        <span class="value">${statistics.totalTrainings}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Общая сумма:</span>
                        <span class="value">${statistics.totalAmount} ₽</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Последняя тренировка:</span>
                        <span class="value">${statistics.lastTraining ? new Date(statistics.lastTraining).toLocaleDateString() : 'Нет'}</span>
                    </div>
                </div>
            </div>
            <div class="history-list">
                ${history.length === 0 ? 
                    '<p class="no-history">История пуста</p>' :
                    history.map(entry => `
                        <div class="history-item">
                            <div class="date">${new Date(entry.date).toLocaleString()}</div>
                            <div class="amount">${entry.amount} ₽</div>
                        </div>
                    `).join('')
                }
            </div>
        `;

        container.innerHTML = content;
    }
} 