// Модуль админ-панели

class AdminPage {
    constructor(app) {
        this.app = app;
        this.currentTab = 'cafes';
        this.render();
    }

    render() {
        document.getElementById('app').innerHTML = `
            <div class="admin-dashboard">
                <div class="admin-header">
                    <h1><i class="fas fa-crown"></i> Панель администратора</h1>
                    <p>Управление рестор анами и контентом</p>
                </div>

                <div class="admin-tabs">
                    <button class="admin-tab ${this.currentTab === 'cafes' ? 'active' : ''}" onclick="adminPage.switchTab('cafes')">
                        <i class="fas fa-store"></i> Рестораны
                    </button>
                    <button class="admin-tab ${this.currentTab === 'reviews' ? 'active' : ''}" onclick="adminPage.switchTab('reviews')">
                        <i class="fas fa-comments"></i> Отзывы
                    </button>
                    <button class="admin-tab ${this.currentTab === 'bookings' ? 'active' : ''}" onclick="adminPage.switchTab('bookings')">
                        <i class="fas fa-calendar-check"></i> Бронирования
                    </button>
                    <button class="admin-tab ${this.currentTab === 'tables' ? 'active' : ''}" onclick="adminPage.switchTab('tables')">
                        <i class="fas fa-th"></i> Столы
                    </button>
                </div>

                <div class="admin-content">
                    ${this.renderTabContent()}
                </div>
            </div>
        `;
    }

    renderTabContent() {
        switch(this.currentTab) {
            case 'cafes':
                return this.renderCafesTab();
            case 'reviews':
                return this.renderReviewsTab();
            case 'bookings':
                return this.renderBookingsTab();
            case 'tables':
                return this.renderTablesTab();
            default:
                return '';
        }
    }

    renderCafesTab() {
        const cafes = window.DB.getCafes();

        const cafesHTML = cafes.map(cafe => {
            const stats = window.DB.getCafeStats(cafe.id);
            return `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3>${cafe.name}</h3>
                        <div class="admin-actions">
                            <button class="btn-edit" onclick="adminPage.editCafe(${cafe.id})">
                                <i class="fas fa-edit"></i> Изменить
                            </button>
                            <button class="btn-delete" onclick="adminPage.deleteCafe(${cafe.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="admin-card-body">
                        <p><strong>Адрес:</strong> ${cafe.address}</p>
                        <p><strong>Кухня:</strong> ${cafe.cuisine}</p>
                        <p><strong>Средний чек:</strong> ${cafe.avg_check}₽</p>
                        <p><strong>Теги:</strong> ${cafe.tags}</p>
                        <p><strong>Режим:</strong> ${cafe.is_24h ? '24/7' : 'По расписанию'}</p>
                        <p><strong>Рейтинг:</strong> ⭐ ${stats.avg_rating} (${stats.review_count} отзывов)</p>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="admin-section">
                <div class="section-header">
                    <h2>Управление ресторанами</h2>
                    <button class="btn-add" onclick="adminPage.addCafe()">
                        <i class="fas fa-plus"></i> Добавить ресторан
                    </button>
                </div>
                <div class="admin-grid">
                    ${cafesHTML}
                </div>
            </div>
        `;
    }

    renderReviewsTab() {
        const reviews = window.DB.getReviews();
        const cafes = window.DB.getCafes();

        const reviewsHTML = reviews.sort((a, b) => new Date(b.date) - new Date(a.date)).map(review => {
            const cafe = cafes.find(c => c.id === review.cafe_id);
            return `
                <div class="admin-card review-card-admin">
                    <div class="admin-card-header">
                        <div>
                            <h4>${review.user_name}</h4>
                            <p class="review-meta">${cafe ? cafe.name : 'Неизвестно'} • ${review.date}</p>
                        </div>
                        <div class="admin-actions">
                            <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                            <button class="btn-delete" onclick="adminPage.deleteReview(${review.id})">
                                <i class="fas fa-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                    <div class="admin-card-body">
                        <p>${review.text}</p>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="admin-section">
                <div class="section-header">
                    <h2>Управление отзывами</h2>
                    <p style="color: var(--text-muted); margin-top: 10px;">Удаляйте некорректные или злостные комментарии</p>
                </div>
                <div class="admin-list">
                    ${reviewsHTML || '<p style="text-align: center; color: var(--text-muted);">Отзывов пока нет</p>'}
                </div>
            </div>
        `;
    }

    renderBookingsTab() {
        const bookings = window.DB.getBookings();
        const cafes = window.DB.getCafes();
        const tables = window.DB.getTables();
        const users = window.DB.getUsers();

        const bookingsHTML = bookings.sort((a, b) => new Date(b.date) - new Date(a.date)).map(booking => {
            const cafe = cafes.find(c => c.id === booking.cafe_id);
            const table = tables.find(t => t.id === booking.table_id);
            const user = users.find(u => u.id === booking.user_id);

            return `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div>
                            <h4>${user ? user.username : 'Неизвестный пользователь'}</h4>
                            <p class="booking-meta">${cafe ? cafe.name : 'Неизвестно'} • Стол ${table ? table.number : '?'}</p>
                        </div>
                        <div class="admin-actions">
                            <button class="btn-delete" onclick="adminPage.deleteBooking(${booking.id})">
                                <i class="fas fa-times"></i> Отменить
                            </button>
                        </div>
                    </div>
                    <div class="admin-card-body">
                        <p><strong>Дата:</strong> ${booking.date}</p>
                        <p><strong>Время:</strong> ${booking.time}</p>
                        <p><strong>Мест:</strong> ${table ? table.seats : '?'}</p>
                        <p><strong>Переносов:</strong> ${booking.reschedule_count}/3</p>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="admin-section">
                <div class="section-header">
                    <h2>Все бронирования</h2>
                    <p style="color: var(--text-muted); margin-top: 10px;">Всего броней: ${bookings.length}</p>
                </div>
                <div class="admin-grid">
                    ${bookingsHTML || '<p style="text-align: center; color: var(--text-muted);">Бронирований пока нет</p>'}
                </div>
            </div>
        `;
    }

    renderTablesTab() {
        const cafes = window.DB.getCafes();

        const cafeTablesHTML = cafes.map(cafe => {
            const tables = window.DB.getTablesByCafe(cafe.id);

            const tablesHTML = tables.map(t => `
                <div class="table-item">
                    <div class="table-info">
                        <strong>Стол ${t.number}</strong>
                        <span>${t.seats} мест • ${t.shape} • ${t.is_window ? '🪟 У окна' : 'В зале'}</span>
                    </div>
                    <button class="btn-delete-small" onclick="adminPage.deleteTable(${t.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

            return `
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3>${cafe.name}</h3>
                        <button class="btn-add-small" onclick="adminPage.addTable(${cafe.id})">
                            <i class="fas fa-plus"></i> Добавить стол
                        </button>
                    </div>
                    <div class="admin-card-body">
                        <div class="tables-list">
                            ${tablesHTML}
                        </div>
                        <p style="margin-top: 15px; color: var(--text-muted); font-size: 0.9rem;">
                            Всего столов: ${tables.length}
                        </p>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="admin-section">
                <div class="section-header">
                    <h2>Управление столами</h2>
                </div>
                <div class="admin-grid">
                    ${cafeTablesHTML}
                </div>
            </div>
        `;
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.render();
    }

    // Управление кафе
    addCafe() {
        const name = prompt('Название ресторана:');
        if (!name) return;

        const address = prompt('Адрес:');
        const cuisine = prompt('Тип кухни:');
        const avg_check = parseInt(prompt('Средний чек (₽):') || '1000');
        const tags = prompt('Теги (через запятую):');
        const is_24h = confirm('Работает 24/7?');

        const newCafe = {
            name,
            address,
            cuisine,
            avg_check,
            tags,
            is_24h,
            image: 'default.png'
        };

        window.DB.addCafe(newCafe);
        this.app.showAlert('Ресторан добавлен!', 'success');
        this.render();
    }

    editCafe(cafeId) {
        const cafe = window.DB.getCafeById(cafeId);
        if (!cafe) return;

        const name = prompt('Название:', cafe.name) || cafe.name;
        const address = prompt('Адрес:', cafe.address) || cafe.address;
        const cuisine = prompt('Тип кухни:', cafe.cuisine) || cafe.cuisine;
        const avg_check = parseInt(prompt('Средний чек:', cafe.avg_check) || cafe.avg_check);
        const tags = prompt('Теги:', cafe.tags) || cafe.tags;

        window.DB.updateCafe(cafeId, { name, address, cuisine, avg_check, tags });
        this.app.showAlert('Ресторан обновлен!', 'success');
        this.render();
    }

    deleteCafe(cafeId) {
        const cafe = window.DB.getCafeById(cafeId);
        if (confirm(`Удалить ресторан "${cafe.name}"? Это также удалит все связанные столы и отзывы.`)) {
            window.DB.deleteCafe(cafeId);
            this.app.showAlert('Ресторан удален', 'success');
            this.render();
        }
    }

    // Управление отзывами
    deleteReview(reviewId) {
        if (confirm('Удалить этот отзыв?')) {
            window.DB.deleteReview(reviewId);
            this.app.showAlert('Отзыв удален', 'success');
            this.render();
        }
    }

    // Управление бронированиями
    deleteBooking(bookingId) {
        if (confirm('Отменить это бронирование?')) {
            window.DB.deleteBooking(bookingId);
            this.app.showAlert('Бронирование отменено', 'success');
            this.render();
        }
    }

    // Управление столами
    addTable(cafeId) {
        const number = prompt('Номер стола:');
        if (!number) return;

        const seats = parseInt(prompt('Количество мест:') || '4');
        const shape = prompt('Форма (rect/round/square):', 'rect') || 'rect';
        const is_window = confirm('Стол у окна?');

        // Случайные координаты (в реальности лучше использовать визуальный редактор)
        const pos_x = Math.floor(Math.random() * 80) + 10;
        const pos_y = Math.floor(Math.random() * 80) + 10;

        window.DB.addTable({
            cafe_id: cafeId,
            number,
            seats,
            shape,
            is_window,
            pos_x,
            pos_y,
            rotation: 0
        });

        this.app.showAlert('Стол добавлен!', 'success');
        this.render();
    }

    deleteTable(tableId) {
        if (confirm('Удалить этот стол?')) {
            window.DB.deleteTable(tableId);
            this.app.showAlert('Стол удален', 'success');
            this.render();
        }
    }
}
