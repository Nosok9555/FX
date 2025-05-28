export class ClientForm {
    constructor(client = null) {
        this.client = client;
    }

    render() {
        const form = document.createElement('form');
        form.className = 'client-form';
        form.dataset.clientId = this.client?.id || '';

        const content = `
            <div class="form-group">
                <label for="clientName">Имя *</label>
                <input type="text" id="clientName" name="name" required 
                    value="${this.client?.name || ''}" 
                    placeholder="Введите имя клиента">
            </div>

            <div class="form-group">
                <label for="clientPhone">Телефон</label>
                <input type="tel" id="clientPhone" name="phone" 
                    value="${this.client?.phone || ''}" 
                    placeholder="+7 (___) ___-__-__">
            </div>

            <div class="form-group">
                <label for="trainingType">Тип тренировок *</label>
                <select id="trainingType" name="trainingType" required>
                    <option value="single" ${this.client?.trainingType === 'single' ? 'selected' : ''}>
                        Разовая
                    </option>
                    <option value="module" ${this.client?.trainingType === 'module' ? 'selected' : ''}>
                        Модульная
                    </option>
                </select>
            </div>

            <div class="form-group module-fields" style="display: ${this.client?.trainingType === 'module' ? 'block' : 'none'}">
                <label for="totalTrainings">Количество тренировок в блоке</label>
                <input type="number" id="totalTrainings" name="totalTrainings" min="1"
                    value="${this.client?.totalTrainings || ''}">
                
                <label for="blockPrice">Стоимость блока</label>
                <input type="number" id="blockPrice" name="blockPrice" min="0"
                    value="${this.client?.blockPrice || ''}">
                
                <label for="remainingTrainings">Осталось тренировок</label>
                <input type="number" id="remainingTrainings" name="remainingTrainings" min="0"
                    value="${this.client?.remainingTrainings || ''}">
            </div>

            <div class="form-group">
                <label for="clientColor">Цветовая метка</label>
                <input type="color" id="clientColor" name="color" 
                    value="${this.client?.color || '#ffffff'}">
            </div>

            <div class="form-group">
                <label for="clientNote">Примечание</label>
                <textarea id="clientNote" name="note" 
                    placeholder="Дополнительная информация о клиенте">${this.client?.note || ''}</textarea>
            </div>

            <div class="form-actions">
                <button type="submit" class="btn-save">${this.client ? 'Сохранить' : 'Добавить'}</button>
                <button type="button" class="btn-cancel">Отмена</button>
            </div>
        `;

        form.innerHTML = content;
        this.setupEventListeners(form);
        return form;
    }

    setupEventListeners(form) {
        // Обработка изменения типа тренировок
        const trainingTypeSelect = form.querySelector('#trainingType');
        const moduleFields = form.querySelector('.module-fields');

        trainingTypeSelect.addEventListener('change', (e) => {
            moduleFields.style.display = e.target.value === 'module' ? 'block' : 'none';
            if (e.target.value === 'single') {
                form.querySelector('#remainingTrainings').value = '';
            }
        });

        // Обработка отправки формы
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const clientData = Object.fromEntries(formData.entries());
            
            // Добавляем ID для редактирования
            if (this.client?.id) {
                clientData.id = this.client.id;
            }

            // Конвертируем числовые значения
            if (clientData.trainingType === 'module') {
                clientData.totalTrainings = parseInt(clientData.totalTrainings);
                clientData.blockPrice = parseFloat(clientData.blockPrice);
                clientData.remainingTrainings = parseInt(clientData.remainingTrainings);
                clientData.pricePerTraining = clientData.blockPrice / clientData.totalTrainings;
            }

            // Вызываем событие с данными формы
            const event = new CustomEvent('clientFormSubmit', {
                detail: clientData
            });
            form.dispatchEvent(event);
        });

        // Обработка отмены
        form.querySelector('.btn-cancel').addEventListener('click', () => {
            const event = new CustomEvent('clientFormCancel');
            form.dispatchEvent(event);
        });
    }
} 