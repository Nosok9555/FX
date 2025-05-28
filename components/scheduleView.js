export class ScheduleView {
    constructor(date = new Date()) {
        this.date = date;
        this.timeSlots = this.generateTimeSlots();
    }

    generateTimeSlots() {
        const slots = [];
        const startHour = 10; // 10:00
        const endHour = 20;   // 20:00

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute of ['00', '30']) {
                slots.push(`${hour.toString().padStart(2, '0')}:${minute}`);
            }
        }

        return slots;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    render(trainingSessions = [], clients = []) {
        const container = document.createElement('div');
        container.className = 'schedule-view';

        // Создаем заголовок с навигацией
        const header = document.createElement('div');
        header.className = 'schedule-header';
        header.innerHTML = `
            <button class="btn-nav" data-action="prev">←</button>
            <h2>${this.formatDate(this.date)}</h2>
            <button class="btn-nav" data-action="next">→</button>
        `;

        // Создаем сетку времени
        const timeGrid = document.createElement('div');
        timeGrid.className = 'time-grid';

        // Добавляем слоты времени
        this.timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.dataset.time = time;
            
            // Находим тренировки для этого времени
            const sessions = trainingSessions.filter(session => 
                session.date === this.date.toISOString().split('T')[0] && 
                session.time === time
            );

            if (sessions.length > 0) {
                sessions.forEach(session => {
                    const client = clients.find(c => c.id === session.clientId);
                    if (client) {
                        const trainingCard = this.createTrainingCard(session, client);
                        slot.appendChild(trainingCard);
                    }
                });
            } else {
                slot.innerHTML = `<div class="time-label">${time}</div>`;
            }

            timeGrid.appendChild(slot);
        });

        container.appendChild(header);
        container.appendChild(timeGrid);
        this.setupEventListeners(container);
        return container;
    }

    createTrainingCard(session, client) {
        const card = document.createElement('div');
        card.className = 'training-card';
        card.dataset.trainingId = session.id;
        
        // Добавляем цветовую метку клиента
        if (client.color) {
            card.style.borderLeft = `4px solid ${client.color}`;
        }

        const duration = session.duration / 60; // конвертируем минуты в часы
        const endTime = this.calculateEndTime(session.time, session.duration);

        card.innerHTML = `
            <div class="training-info">
                <div class="client-name">${client.name}</div>
                <div class="training-time">${session.time} - ${endTime}</div>
                <div class="training-duration">${duration} ч</div>
                ${session.note ? `<div class="training-note">${session.note}</div>` : ''}
                ${client.trainingType === 'module' ? 
                    `<div class="remaining-trainings">Осталось: ${client.remainingTrainings}</div>` : 
                    ''}
            </div>
            <div class="training-actions">
                <button class="btn-edit" data-action="edit">✏️</button>
                <button class="btn-delete" data-action="delete">🗑️</button>
            </div>
        `;

        return card;
    }

    calculateEndTime(startTime, duration) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }

    setupEventListeners(container) {
        // Навигация по дням
        container.querySelectorAll('.btn-nav').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const newDate = new Date(this.date);
                
                if (action === 'prev') {
                    newDate.setDate(newDate.getDate() - 1);
                } else {
                    newDate.setDate(newDate.getDate() + 1);
                }

                const event = new CustomEvent('dateChange', {
                    detail: { date: newDate }
                });
                container.dispatchEvent(event);
            });
        });

        // Обработка действий с тренировками
        container.querySelectorAll('.training-card').forEach(card => {
            card.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = button.dataset.action;
                    const trainingId = card.dataset.trainingId;

                    const event = new CustomEvent('trainingAction', {
                        detail: { action, trainingId }
                    });
                    container.dispatchEvent(event);
                });
            });
        });
    }
} 