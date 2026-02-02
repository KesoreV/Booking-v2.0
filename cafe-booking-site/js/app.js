// Главный файл приложения - управление роутингом и состоянием

class App {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'index';
        this.selectedCafe = null;
        this.init();
    }

    init() {
        // Проверяем, залогинен ли пользователь
        const userId = sessionStorage.getItem('currentUserId');
        if (userId) {
            const users = window.DB.getUsers();
            this.currentUser = users.find(u => u.id === parseInt(userId));
        }

        // Применяем тему
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
        }

        // Инициализируем роутинг
        this.initRouting();
        this.loadPage();
    }

    initRouting() {
        window.addEventListener('hashchange', () => this.loadPage());
    }

    loadPage() {
        const hash = window.location.hash.slice(1) || 'index';
        const [page, param] = hash.split('/');

        this.currentPage = page;

        // Проверка доступа
        if (['profile', 'booking', 'admin'].includes(page) && !this.currentUser) {
            window.location.hash = '#login';
            return;
        }

        if (page === 'admin' && !this.currentUser.is_admin) {
            this.showAlert('Доступ запрещен!', 'danger');
            window.location.hash = '#index';
            return;
        }

        // Загружаем нужную страницу
        switch(page) {
            case 'index':
                this.renderIndexPage();
                break;
            case 'login':
                this.renderLoginPage();
                break;
            case 'register':
                this.renderRegisterPage();
                break;
            case 'profile':
                this.renderProfilePage();
                break;
            case 'booking':
                this.selectedCafe = parseInt(param) || 1;
                this.renderBookingPage();
                break;
            case 'admin':
                this.renderAdminPage();
                break;
            default:
                this.renderIndexPage();
        }

        this.updateNav();
    }

    updateNav() {
        const navLinks = document.querySelector('.nav-links');
        if (this.currentUser) {
            navLinks.innerHTML = `
                <a href="#index">Рестораны</a>
                <a href="#profile">Профиль</a>
                ${this.currentUser.is_admin ? '<a href="#admin"><i class="fas fa-crown"></i> Админ</a>' : ''}
                <a href="#" onclick="app.logout()" class="btn-outline">Выйти</a>
            `;
        } else {
            navLinks.innerHTML = `
                <a href="#index">Рестораны</a>
                <a href="#login">Войти</a>
                <a href="#register" class="btn-outline">Регистрация</a>
            `;
        }
    }

    renderIndexPage() {
        const cafes = window.DB.getCafes();
        const cuisines = [...new Set(cafes.map(c => c.cuisine))];

        let cafesHTML = '';
        cafes.forEach(cafe => {
            const stats = window.DB.getCafeStats(cafe.id);
            const priceRange = cafe.avg_check > 3000 ? '3000 - 5000+ ₽' :
                               cafe.avg_check > 1500 ? '1500 - 3000 ₽' :
                               '500 - 1500 ₽';

            cafesHTML += `
                <div class="cafe-card">
                    <div class="cafe-image" style="background-image: url('static/images/${cafe.image}');">
                        <div class="card-overlay-top">
                            <div class="rating-badge">
                                <i class="fas fa-star"></i> ${stats.avg_rating}
                            </div>
                            <button class="favorite-btn"><i class="far fa-heart"></i></button>
                        </div>
                    </div>
                    <div class="cafe-info">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3>${cafe.name}</h3>
                            <div class="price-range-badge">${priceRange}</div>
                        </div>
                        <p class="address"><i class="fas fa-map-marker-alt"></i> ${cafe.address}</p>
                        <div class="tags-container">
                            ${cafe.tags.split(',').map(tag => `<span class="mini-tag">${tag}</span>`).join('')}
                        </div>
                        <div style="margin-top: 10px; font-size: 0.8rem; color: #888;">
                            <i class="fas fa-comment-alt"></i> ${stats.review_count} отзывов
                        </div>
                        <a href="#booking/${cafe.id}" class="btn btn-full">Открыть карту зала</a>
                    </div>
                </div>
            `;
        });

        document.getElementById('app').innerHTML = `
            <div class="main-layout">
                <div class="content-area">
                    <h1 style="font-size: 2rem; margin-bottom: 20px;">Лучшие рестораны города</h1>
                    <div class="cafe-grid">${cafesHTML}</div>
                </div>
                <aside class="filters-sidebar">
                    <h3><i class="fas fa-sliders-h"></i> Фильтры</h3>
                    <div class="filter-group">
                        <label>Кухня:</label>
                        <select id="cuisine-filter" onchange="app.filterCafes()">
                            <option value="all">Все кухни</option>
                            ${cuisines.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </aside>
            </div>
        `;
    }

    renderLoginPage() {
        document.getElementById('app').innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <i class="fas fa-user-circle auth-icon"></i>
                        <h2>Вход в Stoliki</h2>
                        <p>С возвращением! Введите данные для входа.</p>
                    </div>
                    <form onsubmit="app.handleLogin(event)" class="auth-form">
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="text" name="email" placeholder="Email или логин" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" name="password" placeholder="Пароль" required>
                        </div>
                        <button type="submit" class="btn-glow btn-full">Войти</button>
                    </form>
                    <div class="auth-footer">
                        <p>Нет аккаунта? <a href="#register">Зарегистрироваться</a></p>
                    </div>
                </div>
            </div>
        `;
    }

    renderRegisterPage() {
        document.getElementById('app').innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <i class="fas fa-user-plus auth-icon"></i>
                        <h2>Регистрация</h2>
                        <p>Создайте аккаунт и бронируйте лучшие места.</p>
                    </div>
                    <form onsubmit="app.handleRegister(event)" class="auth-form">
                        <div class="input-group">
                            <i class="fas fa-user"></i>
                            <input type="text" name="username" placeholder="Ваше имя" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" name="email" placeholder="Email адрес" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" name="password" placeholder="Придумайте пароль" required minlength="6">
                        </div>
                        <button type="submit" class="btn-glow btn-full">Создать аккаунт</button>
                    </form>
                    <div class="auth-footer">
                        <p>Уже есть аккаунт? <a href="#login">Войти</a></p>
                    </div>
                </div>
            </div>
        `;
    }

    renderProfilePage() {
        const bookings = window.DB.getBookingsByUser(this.currentUser.id);
        const bookingsWithDetails = bookings.map(b => {
            const cafe = window.DB.getCafeById(b.cafe_id);
            const table = window.DB.getTables().find(t => t.id === b.table_id);
            return { ...b, cafe_name: cafe.name, table_number: table.number, seats: table.seats };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        let bookingsHTML = '';
        if (bookingsWithDetails.length > 0) {
            bookingsHTML = bookingsWithDetails.map(b => {
                const [year, month, day] = b.date.split('-');
                const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
                return `
                    <div class="ticket-card">
                        <div class="ticket-left">
                            <span class="ticket-date-day">${day}</span>
                            <span class="ticket-date-month">${monthNames[parseInt(month) - 1]}</span>
                        </div>
                        <div class="ticket-right">
                            <div class="ticket-info">
                                <h3>${b.cafe_name}</h3>
                                <p>Стол №${b.table_number} • ${b.seats} персон</p>
                                ${b.reschedule_count > 0 ? `<p style="color: #ffa502; font-size: 0.8rem;">Перенесено раз: ${b.reschedule_count}/3</p>` : ''}
                            </div>
                            <div class="ticket-meta">
                                <span class="ticket-time">${b.time}</span>
                                <div class="ticket-actions" style="margin-top: 10px;">
                                    ${b.reschedule_count < 3 ? `<button class="btn-reschedule" onclick="app.openRescheduleModal(${b.id}, '${b.date}', '${b.time}')">Перенести</button>` : ''}
                                    <button class="btn-cancel" onclick="app.cancelBooking(${b.id})">Отменить</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            bookingsHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <p>Здесь пока пусто.</p>
                    <a href="#index" class="btn">Забронировать</a>
                </div>
            `;
        }

        const themeChecked = localStorage.getItem('theme') === 'light' ? 'checked' : '';

        document.getElementById('app').innerHTML = `
            <div class="profile-dashboard">
                <div class="profile-sidebar">
                    <div class="user-card">
                        <div class="user-avatar">${this.currentUser.username[0].toUpperCase()}</div>
                        <h2 class="user-name">${this.currentUser.username}</h2>
                        <p class="user-email">Личный кабинет</p>

                        <div class="theme-switcher-block" style="margin: 20px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                            <label class="switch-label" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                                <span><i class="fas fa-adjust"></i> Светлая тема</span>
                                <input type="checkbox" id="theme-toggle" onchange="app.toggleTheme(this)" ${themeChecked}>
                            </label>
                        </div>

                        <div class="user-stats">
                            <div class="stat-item"><h4>${this.currentUser.bonus_points}</h4><p>Бонусов</p></div>
                            <div class="stat-item"><h4>${bookings.length}</h4><p>Визитов</p></div>
                        </div>

                        <div style="margin-top: 30px;">
                            <button onclick="app.logout()" class="btn-outline" style="width: 100%;">Выйти</button>
                        </div>
                    </div>
                </div>

                <div class="history-section">
                    <h2>Мои бронирования</h2>
                    ${bookingsHTML}
                </div>
            </div>

            <div id="reschedule-modal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 400px;">
                    <span class="close-modal" onclick="app.closeRescheduleModal()">&times;</span>
                    <h2 style="margin-top:0;">Перенос брони</h2>
                    <form onsubmit="app.handleReschedule(event)">
                        <input type="hidden" id="reschedule-booking-id">
                        <div class="form-group" style="margin-bottom: 15px;">
                            <label>Новая дата</label>
                            <input type="date" id="reschedule-date" required style="width: 100%; padding: 10px;">
                        </div>
                        <div class="form-group" style="margin-bottom: 25px;">
                            <label>Новое время</label>
                            <input type="time" id="reschedule-time" required style="width: 100%; padding: 10px;">
                        </div>
                        <button type="submit" class="btn" style="width: 100%;">Сохранить</button>
                    </form>
                </div>
            </div>
        `;
    }

    renderBookingPage() {
        window.bookingPage = new BookingPage(this, this.selectedCafe);
    }

    renderAdminPage() {
        window.adminPage = new AdminPage(this);
    }

    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        const user = window.DB.getUserByEmail(email);
        if (user && user.password === password) {
            this.currentUser = user;
            sessionStorage.setItem('currentUserId', user.id);
            this.showAlert('Вход выполнен успешно!', 'success');
            window.location.hash = user.is_admin ? '#admin' : '#profile';
        } else {
            this.showAlert('Неверный email или пароль!', 'danger');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        if (window.DB.getUserByEmail(email)) {
            this.showAlert('Email уже занят!', 'danger');
            return;
        }

        const newUser = window.DB.addUser({ username, email, password });
        this.showAlert('Регистрация успешна!', 'success');
        window.location.hash = '#login';
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUserId');
        this.showAlert('Вы вышли из аккаунта', 'success');
        window.location.hash = '#index';
    }

    toggleTheme(checkbox) {
        const theme = checkbox.checked ? 'light' : 'dark';
        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
        } else {
            document.documentElement.classList.remove('light-theme');
        }
        localStorage.setItem('theme', theme);
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 9999;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            alertDiv.style.background = 'var(--success)';
            alertDiv.style.color = 'white';
        } else if (type === 'danger') {
            alertDiv.style.background = 'var(--danger)';
            alertDiv.style.color = 'white';
        } else if (type === 'warning') {
            alertDiv.style.background = 'var(--warning)';
            alertDiv.style.color = 'white';
        }

        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
    }

    openRescheduleModal(id, date, time) {
        document.getElementById('reschedule-modal').style.display = 'block';
        document.getElementById('reschedule-booking-id').value = id;
        document.getElementById('reschedule-date').value = date;
        document.getElementById('reschedule-time').value = time;
    }

    closeRescheduleModal() {
        document.getElementById('reschedule-modal').style.display = 'none';
    }

    handleReschedule(e) {
        e.preventDefault();
        const bookingId = parseInt(document.getElementById('reschedule-booking-id').value);
        const newDate = document.getElementById('reschedule-date').value;
        const newTime = document.getElementById('reschedule-time').value;

        const booking = window.DB.getBookings().find(b => b.id === bookingId);
        if (!booking) {
            this.showAlert('Бронь не найдена', 'danger');
            return;
        }

        if (booking.reschedule_count >= 3) {
            this.showAlert('Исчерпан лимит переносов (макс. 3 раза)', 'danger');
            return;
        }

        const collision = window.DB.getBookingsByDateAndTable(booking.cafe_id, booking.table_id, newDate, newTime)
            .filter(b => b.id !== bookingId);

        if (collision.length > 0) {
            this.showAlert('На это время стол уже занят!', 'danger');
            return;
        }

        window.DB.updateBooking(bookingId, {
            date: newDate,
            time: newTime,
            reschedule_count: booking.reschedule_count + 1
        });

        this.closeRescheduleModal();
        this.showAlert('Бронь успешно перенесена!', 'success');
        this.renderProfilePage();
    }

    cancelBooking(bookingId) {
        if (!confirm('При отмене спишется 50 баллов. Продолжить?')) {
            return;
        }

        window.DB.deleteBooking(bookingId);
        const newBonus = Math.max(0, this.currentUser.bonus_points - 50);
        window.DB.updateUser(this.currentUser.id, { bonus_points: newBonus });
        this.currentUser.bonus_points = newBonus;

        this.showAlert('Бронь отменена. 50 бонусов списано.', 'warning');
        this.renderProfilePage();
    }
}

// Инициализация приложения
window.app = new App();
