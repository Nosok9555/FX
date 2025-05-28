import { addData, getAllData, updateData, deleteData } from './db.js';

export class FinanceManager {
    constructor() {
        this.trainings = [];
        this.clients = [];
        this.currentPeriod = {
            start: new Date(),
            end: new Date(),
            type: 'day' // day, week, month
        };
    }

    async init() {
        // Инициализация хранилища для финансовых данных
        await this.loadData();
    }

    async loadData() {
        // Загрузка тренировок и клиентов
        this.trainings = await getAllData('trainings') || [];
        this.clients = await getAllData('clients') || [];
    }

    // Расчет стоимости тренировки
    calculateTrainingCost(training) {
        const client = this.clients.find(c => c.id === training.clientId);
        if (!client) return 0;

        if (client.type === 'single') {
            return client.price || 0;
        } else if (client.type === 'module') {
            return (client.modulePrice / client.moduleSize) || 0;
        }
        return 0;
    }

    // Получение финансовых данных за период
    getFinanceData(period = this.currentPeriod) {
        const filteredTrainings = this.filterTrainingsByPeriod(period);
        
        return {
            summary: this.calculateSummary(filteredTrainings),
            dailyStats: this.calculateDailyStats(filteredTrainings),
            clientStats: this.calculateClientStats(filteredTrainings),
            operations: this.getOperations(filteredTrainings)
        };
    }

    // Фильтрация тренировок по периоду
    filterTrainingsByPeriod(period) {
        return this.trainings.filter(training => {
            const trainingDate = new Date(training.date);
            return trainingDate >= period.start && trainingDate <= period.end;
        });
    }

    // Расчет общей статистики
    calculateSummary(trainings) {
        const completedTrainings = trainings.filter(t => t.status === 'completed');
        const totalIncome = completedTrainings.reduce((sum, t) => sum + this.calculateTrainingCost(t), 0);
        
        return {
            totalIncome,
            totalTrainings: completedTrainings.length,
            singleTrainings: completedTrainings.filter(t => {
                const client = this.clients.find(c => c.id === t.clientId);
                return client?.type === 'single';
            }).length,
            moduleTrainings: completedTrainings.filter(t => {
                const client = this.clients.find(c => c.id === t.clientId);
                return client?.type === 'module';
            }).length,
            averageCheck: completedTrainings.length ? 
                totalIncome / completedTrainings.length : 0,
            clientsToday: new Set(completedTrainings
                .filter(t => new Date(t.date).toDateString() === new Date().toDateString())
                .map(t => t.clientId)).size
        };
    }

    // Расчет ежедневной статистики
    calculateDailyStats(trainings) {
        const dailyStats = {};
        
        trainings.forEach(training => {
            if (training.status !== 'completed') return;
            
            const date = new Date(training.date).toDateString();
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    income: 0,
                    trainings: 0,
                    date: new Date(training.date)
                };
            }
            
            dailyStats[date].income += this.calculateTrainingCost(training);
            dailyStats[date].trainings++;
        });
        
        return Object.values(dailyStats).sort((a, b) => a.date - b.date);
    }

    // Расчет статистики по клиентам
    calculateClientStats(trainings) {
        const clientStats = {};
        
        trainings.forEach(training => {
            if (training.status !== 'completed') return;
            
            const client = this.clients.find(c => c.id === training.clientId);
            if (!client) return;
            
            if (!clientStats[client.id]) {
                clientStats[client.id] = {
                    clientId: client.id,
                    clientName: client.name,
                    totalIncome: 0,
                    trainings: 0,
                    remainingTrainings: client.type === 'module' ? 
                        client.moduleSize - client.usedTrainings : 0
                };
            }
            
            clientStats[client.id].totalIncome += this.calculateTrainingCost(training);
            clientStats[client.id].trainings++;
        });
        
        return Object.values(clientStats);
    }

    // Получение списка операций
    getOperations(trainings) {
        return trainings
            .filter(t => t.status === 'completed')
            .map(training => {
                const client = this.clients.find(c => c.id === training.clientId);
                return {
                    id: training.id,
                    date: new Date(training.date),
                    clientName: client?.name || 'Неизвестный клиент',
                    duration: training.duration,
                    type: client?.type || 'single',
                    cost: this.calculateTrainingCost(training)
                };
            })
            .sort((a, b) => b.date - a.date);
    }

    // Установка периода
    setPeriod(start, end, type) {
        this.currentPeriod = { start, end, type };
    }

    // Экспорт данных
    exportData(format = 'json') {
        const data = this.getFinanceData();
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data);
        }
    }

    // Конвертация в CSV
    convertToCSV(data) {
        const headers = ['Дата', 'Клиент', 'Тип', 'Длительность', 'Стоимость'];
        const rows = data.operations.map(op => [
            op.date.toLocaleDateString(),
            op.clientName,
            op.type === 'single' ? 'Разовая' : 'Модульная',
            op.duration,
            op.cost
        ]);
        
        return [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
    }
} 