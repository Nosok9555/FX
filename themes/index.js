export class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'Светлая',
                class: 'theme-light'
            },
            dark: {
                name: 'Тёмная',
                class: 'theme-dark'
            },
            neutral: {
                name: 'Нейтральная',
                class: 'theme-neutral'
            },
            contrast: {
                name: 'Контрастная',
                class: 'theme-contrast'
            }
        };
        
        this.currentTheme = localStorage.getItem('selectedTheme') || 'light';
        this.init();
    }

    init() {
        // Применяем сохраненную тему при инициализации
        this.applyTheme(this.currentTheme);
        
        // Добавляем обработчик изменения системной темы
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('selectedTheme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    getAvailableThemes() {
        return Object.entries(this.themes).map(([id, theme]) => ({
            id,
            name: theme.name
        }));
    }

    getCurrentTheme() {
        return {
            id: this.currentTheme,
            name: this.themes[this.currentTheme].name
        };
    }

    applyTheme(themeId) {
        if (!this.themes[themeId]) return;

        // Удаляем все классы тем
        Object.values(this.themes).forEach(theme => {
            document.documentElement.classList.remove(theme.class);
        });

        // Добавляем класс выбранной темы
        document.documentElement.classList.add(this.themes[themeId].class);
        
        // Сохраняем выбранную тему
        this.currentTheme = themeId;
        localStorage.setItem('selectedTheme', themeId);

        // Обновляем цветовую схему для мета-тега
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', getComputedStyle(document.documentElement)
                .getPropertyValue('--bg-color').trim());
        }

        // Обновляем графики, если они есть
        this.updateCharts();
    }

    updateCharts() {
        // Обновляем цвета графиков при смене темы
        const charts = document.querySelectorAll('canvas');
        charts.forEach(canvas => {
            const chart = Chart.getChart(canvas);
            if (chart) {
                const textColor = getComputedStyle(document.documentElement)
                    .getPropertyValue('--text-color').trim();
                
                chart.options.plugins.legend.labels.color = textColor;
                chart.options.scales?.x?.ticks?.color = textColor;
                chart.options.scales?.y?.ticks?.color = textColor;
                chart.update();
            }
        });
    }
} 