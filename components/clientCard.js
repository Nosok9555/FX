export class ClientCard {
    constructor(client) {
        this.client = client;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.dataset.clientId = this.client.id;
        
        // Добавляем цветовую метку
        if (this.client.color) {
            card.style.borderLeft = `4px solid ${this.client.color}`;
        }

        const content = `
            <div class="client-info">
                <h3 class="client-name">${this.client.name}</h3>
                ${this.client.phone ? `<p class="client-phone">${this.client.phone}</p>` : ''}
                <div class="client-type">
                    <span class="badge ${this.client.trainingType}">
                        ${this.client.trainingType === 'single' ? 'Разовая' : 'Модульная'}
                    </span>
                    ${this.client.trainingType === 'module' ? 
                        `<span class="remaining">Осталось: ${this.client.remainingTrainings}</span>` : 
                        ''}
                </div>
                ${this.client.note ? `<p class="client-note">${this.client.note}</p>` : ''}
            </div>
            <div class="client-actions">
                <button class="btn-edit" data-action="edit">✏️</button>
                <button class="btn-history" data-action="history">📊</button>
            </div>
        `;

        card.innerHTML = content;
        return card;
    }
} 