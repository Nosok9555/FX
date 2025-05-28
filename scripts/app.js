// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
                
                // Проверяем обновления Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Новый Service Worker установлен, можно показать уведомление
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(error => console.log('ServiceWorker registration failed:', error));
    });
}

// Показ уведомления об обновлении
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <p>Доступно обновление приложения</p>
        <button onclick="window.location.reload()">Обновить</button>
    `;
    document.body.appendChild(notification);
}

// Обработка PWA-событий
window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем автоматическое отображение промпта
    e.preventDefault();
    // Сохраняем событие для использования позже
    window.deferredPrompt = e;
    
    // Показываем кнопку установки
    showInstallButton();
});

// Показ кнопки установки
function showInstallButton() {
    const installButton = document.createElement('button');
    installButton.className = 'install-button';
    installButton.textContent = 'Установить приложение';
    installButton.addEventListener('click', async () => {
        if (!window.deferredPrompt) return;
        
        // Показываем промпт установки
        window.deferredPrompt.prompt();
        
        // Ждем ответа пользователя
        const { outcome } = await window.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // Очищаем сохраненный промпт
        window.deferredPrompt = null;
        
        // Удаляем кнопку
        installButton.remove();
    });
    
    document.body.appendChild(installButton);
}

// Import modules
import { initDB } from './db.js';
import { ClientsManager } from './clients.js';
import { ScheduleManager } from './schedule.js';
import { FinanceManager } from './finance.js';
import { FinanceView } from '../components/financeView.js';
import { ThemeManager } from '../themes/index.js';
import { ThemeSwitcher } from '../components/ThemeSwitcher.js';

// App state
const state = {
    currentPage: 'home',
    isOnline: navigator.onLine,
    currentClient: null
};

// Initialize managers
const clientsManager = new ClientsManager();
const scheduleManager = new ScheduleManager();
const financeManager = new FinanceManager();
const themeManager = new ThemeManager();
const themeSwitcher = new ThemeSwitcher(themeManager);
const financeView = new FinanceView();

// Initialize app
async function initApp() {
    try {
        console.log('Initializing app...');
        await initDB();
        
        // Initialize managers
        clientsManager = new ClientsManager();
        scheduleManager = new ScheduleManager();
        financeManager = new FinanceManager();
        themeManager = new ThemeManager();
        themeSwitcher = new ThemeSwitcher(themeManager);
        financeView = new FinanceView();
        
        await clientsManager.init();
        await scheduleManager.init();
        await financeManager.init();
        
        await clientsManager.loadData();
        await scheduleManager.loadData();
        await financeManager.loadData();
        
        setupNavigation();
        loadPage(state.currentPage);
        setupOnlineDetection();
        console.log('App initialization complete.');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Ошибка инициализации приложения. Пожалуйста, обновите страницу.');
    }
}

// Setup navigation
function setupNavigation() {
    console.log('Setting up navigation...');
    const navItems = document.querySelectorAll('.nav-item');
    console.log(`Found ${navItems.length} navigation items.`);
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            console.log(`Navigation item clicked: ${page}`);
            state.currentPage = page;
            loadPage(page);
            
            // Обновление активного состояния в навигации
            navItems.forEach(navItem => navItem.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Обновляем URL без перезагрузки страницы
            const url = new URL(window.location);
            url.searchParams.set('page', page);
            window.history.pushState({}, '', url);
        });
    });
    console.log('Navigation setup complete.');
}

// Load page content
async function loadPage(page) {
    console.log(`Loading page: ${page}...`);
    const content = document.getElementById('content');
    if (!content) {
        console.error('Content container not found');
        showError('Ошибка: Не найден контейнер для контента.');
        return;
    }
    console.log('Content container found.');
    
    switch (page) {
        case 'home':
            content.innerHTML = `
                <div class="dashboard">
                    <div class="schedule-section">
                        <h2>Расписание на сегодня</h2>
                        <div id="today-schedule"></div>
                    </div>
                    <div class="clients-section">
                        <h2>Последние клиенты</h2>
                        <div id="recent-clients"></div>
                    </div>
                </div>
            `;
            await scheduleManager.renderSchedule('today-schedule');
            await clientsManager.renderClientList('recent-clients', { limit: 5 });
            break;
            
        case 'schedule':
            content.innerHTML = '<div id="schedule-view"></div>';
            await scheduleManager.renderSchedule('schedule-view');
            break;
            
        case 'clients':
            content.innerHTML = `
                <div class="clients-page">
                    <div class="filters">
                        <input type="text" id="client-search" placeholder="Поиск клиентов...">
                        <select id="client-type-filter">
                            <option value="all">Все типы</option>
                            <option value="single">Разовые</option>
                            <option value="module">Модульные</option>
                        </select>
                    </div>
                    <div id="clients-list"></div>
                </div>
            `;
            setupFilters();
            await clientsManager.renderClientList('clients-list');
            break;
            
        case 'finance':
            content.innerHTML = '<div id="finance-view"></div>';
            const financeData = financeManager.getFinanceData();
            financeView.render('finance-view', financeData);
            break;
            
        case 'settings':
            content.innerHTML = `
                <div class="settings-section">
                    <h2>Настройки</h2>
                    <div id="theme-settings"></div>
                    <div class="setting-item">
                        <span>Версия приложения:</span>
                        <span>1.0.0</span>
                    </div>
                    <div class="setting-item">
                        <span>Статус:</span>
                        <span class="status ${state.isOnline ? 'online' : 'offline'}">
                            ${state.isOnline ? 'Онлайн' : 'Офлайн'}
                        </span>
                    </div>
                </div>
            `;
            themeSwitcher.render('theme-settings');
            break;
    }
}

// Setup filters
function setupFilters() {
    const searchInput = document.getElementById('client-search');
    const typeFilter = document.getElementById('client-type-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clientsManager.applyFilters({
                name: e.target.value,
                type: typeFilter.value
            });
        });
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            clientsManager.applyFilters({
                name: searchInput.value,
                type: e.target.value
            });
        });
    }
}

// Show client form
function showClientForm(client = null) {
    const content = document.getElementById('content');
    content.innerHTML = '<div id="client-form"></div>';
    
    const form = new ClientForm(client);
    form.render('client-form');
    
    form.onSubmit = async (formData) => {
        if (client) {
            await clientsManager.updateClient(client.id, formData);
        } else {
            await clientsManager.addClient(formData);
        }
        loadPage('clients');
    };
    
    form.onCancel = () => {
        loadPage('clients');
    };
}

// Setup online/offline detection
function setupOnlineDetection() {
    window.addEventListener('online', () => {
        state.isOnline = true;
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.classList.replace('offline', 'online');
            statusElement.textContent = 'Онлайн';
        }
    });
    
    window.addEventListener('offline', () => {
        state.isOnline = false;
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            statusElement.classList.replace('online', 'offline');
            statusElement.textContent = 'Офлайн';
        }
    });
}

// Обработка глубоких ссылок
window.addEventListener('popstate', () => {
    const url = new URL(window.location);
    const page = url.searchParams.get('page') || 'home';
    state.currentPage = page;
    loadPage(page);
    
    // Обновляем активное состояние в навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
});

// Start the app
document.addEventListener('DOMContentLoaded', initApp); 