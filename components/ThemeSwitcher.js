export class ThemeSwitcher {
    constructor(themeManager) {
        this.themeManager = themeManager;
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const themes = this.themeManager.getAvailableThemes();
        const currentTheme = this.themeManager.getCurrentTheme();

        const themeSwitcher = document.createElement('div');
        themeSwitcher.className = 'theme-switcher';
        themeSwitcher.innerHTML = `
            <h3>Выбор темы</h3>
            <div class="theme-options">
                ${themes.map(theme => `
                    <div class="theme-option ${theme.id === currentTheme.id ? 'active' : ''}" 
                         data-theme="${theme.id}">
                        <div class="theme-preview ${theme.id}"></div>
                        <span class="theme-name">${theme.name}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Добавляем обработчики событий
        themeSwitcher.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                this.themeManager.applyTheme(themeId);
                
                // Обновляем активное состояние
                themeSwitcher.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                option.classList.add('active');
            });
        });

        container.appendChild(themeSwitcher);
    }
} 