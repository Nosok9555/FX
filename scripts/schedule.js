import { addData, getAllData, updateData, deleteData } from './db.js';
import { TrainingForm } from '../components/trainingForm.js';
import { ScheduleView } from '../components/scheduleView.js';

export class ScheduleManager {
    constructor() {
        this.currentDate = new Date();
        this.trainingSessions = [];
        this.clients = [];
    }

    async init() {
        // Инициализация хранилища тренировок в IndexedDB
        const db = await initDB();
        if (!db.objectStoreNames.contains('trainings')) {
            db.createObjectStore('trainings', { keyPath: 'id', autoIncrement: true });
        }
    }

    async loadData() {
        this.trainingSessions = await getAllData('trainings');
        this.clients = await getAllData('clients');
    }

    async addTraining(training) {
        // Проверка на пересечение времени
        const isTimeSlotAvailable = this.checkTimeSlotAvailability(training);
        if (!isTimeSlotAvailable) {
            throw new Error('Выбранное время уже занято');
        }

        // Проверка для клиентов с модульной системой
        const client = this.clients.find(c => c.id === training.clientId);
        if (client && client.trainingType === 'module') {
            if (client.remainingTrainings <= 0) {
                throw new Error('У клиента закончились тренировки');
            }
            // Уменьшаем количество оставшихся тренировок
            await updateData('clients', {
                ...client,
                remainingTrainings: client.remainingTrainings - 1
            });
        }

        const newTraining = await addData('trainings', training);
        this.trainingSessions.push(newTraining);
        return newTraining;
    }

    async updateTraining(training) {
        // Проверка на пересечение времени (исключая текущую тренировку)
        const isTimeSlotAvailable = this.checkTimeSlotAvailability(training, training.id);
        if (!isTimeSlotAvailable) {
            throw new Error('Выбранное время уже занято');
        }

        await updateData('trainings', training);
        const index = this.trainingSessions.findIndex(t => t.id === training.id);
        if (index !== -1) {
            this.trainingSessions[index] = training;
        }
    }

    async deleteTraining(trainingId) {
        const training = this.trainingSessions.find(t => t.id === trainingId);
        if (!training) return;

        // Возвращаем тренировку для клиентов с модульной системой
        const client = this.clients.find(c => c.id === training.clientId);
        if (client && client.trainingType === 'module') {
            await updateData('clients', {
                ...client,
                remainingTrainings: client.remainingTrainings + 1
            });
        }

        await deleteData('trainings', trainingId);
        this.trainingSessions = this.trainingSessions.filter(t => t.id !== trainingId);
    }

    checkTimeSlotAvailability(training, excludeTrainingId = null) {
        const { date, time, duration, clientId } = training;
        const startTime = new Date(`${date}T${time}`);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        return !this.trainingSessions.some(session => {
            if (session.id === excludeTrainingId) return false;
            if (session.date !== date) return false;

            const sessionStart = new Date(`${session.date}T${session.time}`);
            const sessionEnd = new Date(sessionStart.getTime() + session.duration * 60000);

            return (
                (startTime >= sessionStart && startTime < sessionEnd) ||
                (endTime > sessionStart && endTime <= sessionEnd) ||
                (startTime <= sessionStart && endTime >= sessionEnd)
            );
        });
    }

    getTrainingsForDate(date) {
        return this.trainingSessions.filter(session => 
            session.date === date.toISOString().split('T')[0]
        );
    }

    renderSchedule(container) {
        const trainings = this.getTrainingsForDate(this.currentDate);
        const scheduleView = new ScheduleView(this.currentDate);
        const scheduleElement = scheduleView.render(trainings, this.clients);

        // Обработка изменения даты
        scheduleElement.addEventListener('dateChange', (e) => {
            this.currentDate = e.detail.date;
            this.renderSchedule(container);
        });

        // Обработка действий с тренировками
        scheduleElement.addEventListener('trainingAction', async (e) => {
            const { action, trainingId } = e.detail;
            const training = this.trainingSessions.find(t => t.id === trainingId);

            if (action === 'edit') {
                this.showTrainingForm(container, training);
            } else if (action === 'delete') {
                if (confirm('Вы уверены, что хотите удалить эту тренировку?')) {
                    await this.deleteTraining(trainingId);
                    this.renderSchedule(container);
                }
            }
        });

        container.innerHTML = '';
        container.appendChild(scheduleElement);
    }

    showTrainingForm(container, training = null) {
        const form = new TrainingForm(training, this.clients);
        const formElement = form.render();

        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const trainingData = {
                clientId: parseInt(formData.get('clientId')),
                date: formData.get('date'),
                time: formData.get('time'),
                duration: parseInt(formData.get('duration')),
                price: parseFloat(formData.get('price')),
                note: formData.get('note')
            };

            try {
                if (training) {
                    trainingData.id = training.id;
                    await this.updateTraining(trainingData);
                } else {
                    await this.addTraining(trainingData);
                }
                this.renderSchedule(container);
            } catch (error) {
                alert(error.message);
            }
        });

        formElement.addEventListener('cancel', () => {
            this.renderSchedule(container);
        });

        container.innerHTML = '';
        container.appendChild(formElement);
    }
} 