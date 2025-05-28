export class TrainingForm {
    constructor(training = null, clients = []) {
        this.training = training;
        this.clients = clients;
    }

    render() {
        const form = document.createElement('form');
        form.className = 'training-form';
        form.dataset.trainingId = this.training?.id || '';

        const content = `
            <div class="form-group">
                <label for="clientSelect">Клиент *</label>
                <select id="clientSelect" name="clientId" required>
                    <option value="">Выберите клиента</option>
                    ${this.clients.map(client => `
                        <option value="${client.id}" 
                            ${this.training?.clientId === client.id ? 'selected' : ''}
                            data-type="${client.trainingType}"
                            data-remaining="${client.remainingTrainings || 0}"
                            data-price="${client.pricePerTraining || 0}">
                            ${client.name} 
                            ${client.trainingType === 'module' ? 
                                `(Осталось: ${client.remainingTrainings})` : 
                                ''}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label for="trainingDate">Дата *</label>
                <input type="date" id="trainingDate" name="date" required
                    value="${this.training?.date || new Date().toISOString().split('T')[0]}">
            </div>

            <div class="form-group">
                <label for="trainingTime">Время начала *</label>
                <select id="trainingTime" name="time" required>
                    ${this.generateTimeOptions()}
                </select>
            </div>

            <div class="form-group">
                <label for="trainingDuration">Продолжительность *</label>
                <select id="trainingDuration" name="duration" required>
                    <option value="60" ${this.training?.duration === 60 ? 'selected' : ''}>1 час</option>
                    <option value="90" ${this.training?.duration === 90 ? 'selected' : ''}>1.5 часа</option>
                    <option value="120" ${this.training?.duration === 120 ? 'selected' : ''}>2 часа</option>
                </select>
            </div>

            <div class="form-group price-group" style="display: none;">
                <label for="trainingPrice">Стоимость (₽) *</label>
                <input type="number" id="trainingPrice" name="price" min="0" step="100"
                    value="${this.training?.price || ''}" required>
            </div>

            <div class="form-group">
                <label for="trainingNote">Заметка</label>
                <textarea id="trainingNote" name="note" 
                    placeholder="Дополнительная информация о тренировке">${this.training?.note || ''}</textarea>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-save">
                    ${this.training ? 'Сохранить изменения' : 'Записать на тренировку'}
                </button>
                <button type="button" class="btn-cancel">Отмена</button>
            </div>
        `;

        form.innerHTML = content;
        this.setupEventListeners(form);
        return form;
    }

    generateTimeOptions() {
        const options = [];
        const startHour = 10; // 10:00
        const endHour = 20;   // 20:00

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute of ['00', '30']) {
                const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                const selected = this.training?.time === time ? 'selected' : '';
                options.push(`<option value="${time}" ${selected}>${time}</option>`);
            }
        }

        return options.join('');
    }

    setupEventListeners(form) {
        const clientSelect = form.querySelector('#clientSelect');
        const priceGroup = form.querySelector('.price-group');
        const priceInput = form.querySelector('#trainingPrice');

        // Обработка выбора клиента
        clientSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const trainingType = selectedOption.dataset.type;
            const remainingTrainings = parseInt(selectedOption.dataset.remaining);
            const pricePerTraining = parseFloat(selectedOption.dataset.price);

            // Показываем/скрываем поле цены
            priceGroup.style.display = trainingType === 'single' ? 'block' : 'none';

            // Устанавливаем цену для модульных клиентов
            if (trainingType === 'module') {
                priceInput.value = pricePerTraining;
            }

            // Проверяем количество оставшихся тренировок
            if (trainingType === 'module' && remainingTrainings <= 0) {
                alert('У клиента закончились тренировки в блоке');
                clientSelect.value = '';
            }
        });

        // Обработка отправки формы
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const trainingData = Object.fromEntries(formData.entries());
            
            // Добавляем ID для редактирования
            if (this.training?.id) {
                trainingData.id = this.training.id;
            }

            // Конвертируем числовые значения
            trainingData.duration = parseInt(trainingData.duration);
            trainingData.price = parseFloat(trainingData.price);
            trainingData.clientId = parseInt(trainingData.clientId);

            // Вызываем событие с данными формы
            const event = new CustomEvent('trainingFormSubmit', {
                detail: trainingData
            });
            form.dispatchEvent(event);
        });

        // Обработка отмены
        form.querySelector('.btn-cancel').addEventListener('click', () => {
            const event = new CustomEvent('trainingFormCancel');
            form.dispatchEvent(event);
        });
    }
} 