export class FinanceView {
    constructor() {
        this.charts = {};
    }

    render(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="finance-view">
                ${this.createHeader()}
                ${this.createStatsSection(data.summary)}
                ${this.createChartsSection()}
                ${this.createClientsSection(data.clientStats)}
                ${this.createOperationsSection(data.operations)}
            </div>
        `;

        this.initCharts(data);
    }

    createHeader() {
        return `
            <div class="finance-header">
                <div class="period-selector">
                    <button class="period-btn active" data-period="day">День</button>
                    <button class="period-btn" data-period="week">Неделя</button>
                    <button class="period-btn" data-period="month">Месяц</button>
                </div>
                <div class="view-actions">
                    <button class="btn-export" data-format="json">Экспорт JSON</button>
                    <button class="btn-export" data-format="csv">Экспорт CSV</button>
                </div>
            </div>
        `;
    }

    createStatsSection(summary) {
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">Общий доход</div>
                    <div class="stat-value">${this.formatMoney(summary.totalIncome)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Всего тренировок</div>
                    <div class="stat-value">${summary.totalTrainings}</div>
                    <div class="stat-subtitle">
                        ${summary.singleTrainings} разовых / ${summary.moduleTrainings} модульных
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Средний чек</div>
                    <div class="stat-value">${this.formatMoney(summary.averageCheck)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Клиентов сегодня</div>
                    <div class="stat-value">${summary.clientsToday}</div>
                </div>
            </div>
        `;
    }

    createChartsSection() {
        return `
            <div class="charts-grid">
                <div class="chart-container">
                    <h3 class="chart-title">Доход по дням</h3>
                    <canvas id="incomeChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3 class="chart-title">Тренировки по дням</h3>
                    <canvas id="trainingsChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3 class="chart-title">Распределение по типам</h3>
                    <canvas id="typesChart"></canvas>
                </div>
            </div>
        `;
    }

    createClientsSection(clientStats) {
        return `
            <div class="clients-section">
                <h3>Статистика по клиентам</h3>
                <div class="clients-grid">
                    ${clientStats.map(client => `
                        <div class="client-card">
                            <div class="client-header">
                                <span class="client-name">${client.clientName}</span>
                                <span class="client-income">${this.formatMoney(client.totalIncome)}</span>
                            </div>
                            <div class="client-stats">
                                <div class="stat-item">
                                    <span class="label">Тренировок:</span>
                                    <span class="value">${client.trainings}</span>
                                </div>
                                ${client.remainingTrainings > 0 ? `
                                    <div class="stat-item">
                                        <span class="label">Осталось:</span>
                                        <span class="value">${client.remainingTrainings}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createOperationsSection(operations) {
        return `
            <div class="operations-section">
                <h3>Последние операции</h3>
                <div class="operations-list">
                    ${operations.map(op => `
                        <div class="operation-item">
                            <div class="operation-info">
                                <div class="operation-date">${op.date.toLocaleDateString()}</div>
                                <div class="operation-client">${op.clientName}</div>
                                <div class="operation-type">${op.type === 'single' ? 'Разовая' : 'Модульная'}</div>
                            </div>
                            <div class="operation-details">
                                <div class="operation-duration">${op.duration} мин</div>
                                <div class="operation-amount">${this.formatMoney(op.cost)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    initCharts(data) {
        // График дохода
        this.charts.income = new Chart(
            document.getElementById('incomeChart'),
            {
                type: 'bar',
                data: {
                    labels: data.dailyStats.map(stat => 
                        stat.date.toLocaleDateString()
                    ),
                    datasets: [{
                        label: 'Доход',
                        data: data.dailyStats.map(stat => stat.income),
                        backgroundColor: '#2196F3'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

        // График тренировок
        this.charts.trainings = new Chart(
            document.getElementById('trainingsChart'),
            {
                type: 'line',
                data: {
                    labels: data.dailyStats.map(stat => 
                        stat.date.toLocaleDateString()
                    ),
                    datasets: [{
                        label: 'Количество тренировок',
                        data: data.dailyStats.map(stat => stat.trainings),
                        borderColor: '#4CAF50',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

        // График распределения по типам
        this.charts.types = new Chart(
            document.getElementById('typesChart'),
            {
                type: 'pie',
                data: {
                    labels: ['Разовые', 'Модульные'],
                    datasets: [{
                        data: [
                            data.summary.singleTrainings,
                            data.summary.moduleTrainings
                        ],
                        backgroundColor: ['#FFC107', '#2196F3']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    }

    updateCharts(data) {
        if (this.charts.income) {
            this.charts.income.data.labels = data.dailyStats.map(stat => 
                stat.date.toLocaleDateString()
            );
            this.charts.income.data.datasets[0].data = data.dailyStats.map(stat => 
                stat.income
            );
            this.charts.income.update();
        }

        if (this.charts.trainings) {
            this.charts.trainings.data.labels = data.dailyStats.map(stat => 
                stat.date.toLocaleDateString()
            );
            this.charts.trainings.data.datasets[0].data = data.dailyStats.map(stat => 
                stat.trainings
            );
            this.charts.trainings.update();
        }

        if (this.charts.types) {
            this.charts.types.data.datasets[0].data = [
                data.summary.singleTrainings,
                data.summary.moduleTrainings
            ];
            this.charts.types.update();
        }
    }
} 