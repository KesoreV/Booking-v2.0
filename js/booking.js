// Модуль для страницы бронирования

class BookingPage {
    constructor(app, cafeId) {
        this.app = app;
        this.cafeId = cafeId;
        this.selectedTable = null;
        this.render();
    }

    render() {
        const cafe = window.DB.getCafeById(this.cafeId);
        const cafes = window.DB.getCafes();
        const tables = window.DB.getTablesByCafe(this.cafeId);
        const reviews = window.DB.getReviewsByCafe(this.cafeId).slice(0, 5);
        const stats = window.DB.getCafeStats(this.cafeId);

        const today = new Date().toISOString().split('T')[0];

        // Генерируем статусы столов
        const bookings = window.DB.getBookings();
        const bookedTableIds = bookings
            .filter(b => b.cafe_id === this.cafeId && b.date === today)
            .map(b => b.table_id);

        // Имитация занятости (как в оригинале)
        const seed = Math.floor(Date.now() / 300000) + this.cafeId;
        const tableStatuses = {};
        tables.forEach(t => {
            if (bookedTableIds.includes(t.id)) {
                tableStatuses[t.id] = 'occupied';
            } else {
                const rand = this.seededRandom(seed + t.id);
                tableStatuses[t.id] = rand < 0.6 ? 'free' : rand < 0.9 ? 'occupied' : 'booked';
            }
        });

        // Генерируем HTML для столов
        const tablesHTML = tables.map(t => {
            const status = tableStatuses[t.id];
            const isClickable = status === 'free';
            return `
                <div class="map-element shape-${t.shape} status-${status} table-spot ${t.is_window ? 'window-table' : ''}"
                     style="left: ${t.pos_x}%; top: ${t.pos_y}%; transform: translate(-50%, -50%) rotate(${t.rotation}deg);"
                     data-id="${t.id}"
                     data-seats="${t.seats}"
                     data-number="${t.number}"
                     ${isClickable ? `onclick="bookingPage.selectTable(this)"` : ''}>
                    <span class="table-number">${t.number}</span>
                    <div class="table-tooltip">Стол ${t.number}<br>${t.seats} персон${t.is_window ? '<br>🪟 У окна' : ''}</div>
                </div>
            `;
        }).join('');

        // Генерируем отзывы
        const reviewsHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-author">${r.user_name}</span>
                    <span class="review-rating">${'⭐'.repeat(r.rating)}</span>
                </div>
                <p class="review-text">${r.text}</p>
                <span class="review-date">${r.date}</span>
                ${this.app.currentUser && this.app.currentUser.is_admin ? `
                    <button class="btn-delete-review" onclick="bookingPage.deleteReview(${r.id})" style="margin-top: 10px; padding: 5px 10px; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                ` : ''}
            </div>
        `).join('');

        // Генерируем селектор кафе
        const cafeOptions = cafes.map(c =>
            `<option value="${c.id}" ${c.id === this.cafeId ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        // Генерируем окна в зависимости от кафе
        let windowsHTML = this.getWindowsForCafe(this.cafeId);

        document.getElementById('app').innerHTML = `
            <div class="booking-container">
                <!-- ВЕРХНЯЯ ПАНЕЛЬ -->
                <div class="booking-header-redesigned">
                    <div class="header-main-info">
                        <h1 class="cafe-title">${cafe.name}</h1>
                        <div class="cafe-meta-tags">
                            <span class="meta-tag"><i class="fas fa-utensils"></i> ${cafe.cuisine}</span>
                            <span class="meta-tag"><i class="fas fa-wallet"></i> Чек: ~${cafe.avg_check}₽</span>
                            <span class="meta-tag rating"><i class="fas fa-star"></i> ${stats.avg_rating}</span>
                        </div>
                    </div>

                    <div class="header-actions">
                        <div class="cafe-selector-wrapper">
                            <select id="cafe-selector" onchange="window.location.hash = 'booking/' + this.value;">
                                ${cafeOptions}
                            </select>
                        </div>
                        <button class="btn-menu-dark" onclick="bookingPage.openMenu()">
                            <i class="fas fa-book-open"></i> Меню
                        </button>
                    </div>
                </div>

                <!-- ФИЛЬТРЫ -->
                <div class="filters-bar">
                    <span class="filter-label">Фильтр столов:</span>
                    <div class="filter-options">
                        <button class="filter-pill active" onclick="bookingPage.filterTables('all')">Все</button>
                        <button class="filter-pill" onclick="bookingPage.filterTables(2)">2 чел.</button>
                        <button class="filter-pill" onclick="bookingPage.filterTables(4)">4 чел.</button>
                        <button class="filter-pill" onclick="bookingPage.filterTables(6)">6+ чел.</button>
                        <button class="filter-pill" onclick="bookingPage.filterTables('window')">🪟 У окна</button>
                    </div>
                </div>

                <!-- КАРТА ЗАЛА -->
                <div class="restaurant-map-container">
                    <div class="floor-grid"></div>

                    <!-- Вход -->
                    <div class="map-door" style="bottom: 0; left: 50%; transform: translateX(-50%);">
                        <i class="fas fa-door-open"></i> Вход
                    </div>

                    <!-- Окна -->
                    ${windowsHTML}

                    <!-- Столы -->
                    ${tablesHTML}
                </div>

                <!-- ЛЕГЕНДА -->
                <div class="map-legend">
                    <div class="legend-item"><span class="dot free"></span> Свободно</div>
                    <div class="legend-item"><span class="dot occupied"></span> Занято</div>
                    <div class="legend-item"><span class="dot booked"></span> Забронировано</div>
                    <div class="legend-item"><i class="fas fa-window-maximize" style="color: rgba(135, 206, 235, 0.6);"></i> Окна</div>
                </div>

                <!-- ОТЗЫВЫ -->
                <div class="reviews-section">
                    <h2 style="color:white; margin-bottom: 20px;">Отзывы посетителей</h2>
                    <div class="reviews-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        ${reviewsHTML}
                    </div>
                </div>
            </div>

            <!-- НИЖНЯЯ ПАНЕЛЬ БРОНИРОВАНИЯ -->
            <div class="booking-panel" id="booking-panel">
                <div class="panel-header">
                    <div class="selected-table-info">
                        <span class="label">Выбран стол:</span>
                        <span class="value" id="selected-table-num">№ --</span>
                    </div>
                    <div class="selected-table-seats" id="selected-table-seats">-- мест</div>
                </div>

                <form onsubmit="bookingPage.handleBooking(event)" class="booking-form">
                    <input type="hidden" id="form-table-id">
                    <div class="input-group">
                        <input type="date" id="booking-date" value="${today}" min="${today}" required>
                    </div>
                    <div class="input-group">
                        <input type="time" id="booking-time" value="18:00" required>
                    </div>
                    <button type="submit" class="btn-glow">Забронировать <i class="fas fa-arrow-right"></i></button>
                </form>
            </div>

            <!-- МОДАЛЬНОЕ ОКНО МЕНЮ -->
            <div id="menu-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <span class="close-modal" onclick="bookingPage.closeMenu()">&times;</span>
                    <h2>Меню ресторана</h2>
                    <div class="menu-category">
                        <h3>🍣 Основное</h3>
                        <div class="menu-item"><span>Филадельфия</span><span class="price">590₽</span></div>
                        <div class="menu-item"><span>Калифорния</span><span class="price">450₽</span></div>
                        <div class="menu-item"><span>Стейк рибай</span><span class="price">1290₽</span></div>
                    </div>
                    <div class="menu-category">
                        <h3>🥤 Напитки</h3>
                        <div class="menu-item"><span>Лимонад (0.5)</span><span class="price">250₽</span></div>
                        <div class="menu-item"><span>Эспрессо</span><span class="price">150₽</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    getWindowsForCafe(cafeId) {
        // Разные конфигурации окон для каждого кафе
        let windows = '';

        switch(cafeId) {
            case 1: // Кафе Уют - окна слева и справа
                windows = `
                    <div class="map-window" style="top: 10%; left: 0; width: 5px; height: 30%;">
                        <span class="window-label">Окно</span>
                    </div>
                    <div class="map-window" style="top: 10%; right: 0; width: 5px; height: 30%;">
                        <span class="window-label">Окно</span>
                    </div>
                `;
                break;

            case 2: // Ресторан Вкусняшка - окна по периметру
                windows = `
                    <div class="map-window" style="top: 0; left: 15%; width: 25%; height: 5px;">
                        <span class="window-label">Панорамное окно</span>
                    </div>
                    <div class="map-window" style="top: 0; right: 15%; width: 25%; height: 5px;">
                        <span class="window-label">Панорамное окно</span>
                    </div>
                    <div class="map-window" style="top: 20%; right: 0; width: 5px; height: 40%;">
                        <span class="window-label" style="writing-mode: vertical-rl;">Окно</span>
                    </div>
                `;
                break;

            case 3: // Sky Lounge - панорамные окна по всему периметру
                windows = `
                    <div class="map-window panoramic" style="top: 0; left: 5%; width: 90%; height: 5px;">
                        <span class="window-label">Панорамное остекление</span>
                    </div>
                    <div class="map-window panoramic" style="top: 5%; left: 0; width: 5px; height: 90%;">
                        <span class="window-label" style="writing-mode: vertical-rl; transform: rotate(180deg);">Панорамное остекление</span>
                    </div>
                    <div class="map-window panoramic" style="top: 5%; right: 0; width: 5px; height: 90%;">
                        <span class="window-label" style="writing-mode: vertical-rl;">Панорамное остекление</span>
                    </div>
                `;
                break;

            case 4: // Суши Токио - окна слева и справа
                windows = `
                    <div class="map-window" style="top: 10%; left: 0; width: 5px; height: 70%;">
                        <span class="window-label" style="writing-mode: vertical-rl; transform: rotate(180deg);">Витражное окно</span>
                    </div>
                    <div class="map-window" style="top: 10%; right: 0; width: 5px; height: 70%;">
                        <span class="window-label" style="writing-mode: vertical-rl;">Витражное окно</span>
                    </div>
                `;
                break;

            case 5: // Пицца Мама - окна по углам
                windows = `
                    <div class="map-window" style="top: 0; left: 5%; width: 20%; height: 5px;">
                        <span class="window-label">Окно</span>
                    </div>
                    <div class="map-window" style="top: 0; right: 5%; width: 20%; height: 5px;">
                        <span class="window-label">Окно</span>
                    </div>
                    <div class="map-window" style="bottom: 5%; left: 0; width: 5px; height: 20%;">
                        <span class="window-label" style="writing-mode: vertical-rl; transform: rotate(180deg);">Окно</span>
                    </div>
                    <div class="map-window" style="bottom: 5%; right: 0; width: 5px; height: 20%;">
                        <span class="window-label" style="writing-mode: vertical-rl;">Окно</span>
                    </div>
                `;
                break;
        }

        return windows;
    }

    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    selectTable(element) {
        // Убираем выделение с предыдущего стола
        const prevSelected = document.querySelector('.table-spot.selected');
        if (prevSelected) {
            prevSelected.classList.remove('selected');
        }

        // Выделяем новый стол
        element.classList.add('selected');
        this.selectedTable = element;

        // Показываем панель бронирования
        const panel = document.getElementById('booking-panel');
        panel.classList.add('active');

        document.getElementById('selected-table-num').textContent = '№' + element.dataset.number;
        document.getElementById('selected-table-seats').textContent = element.dataset.seats + ' персон';
        document.getElementById('form-table-id').value = element.dataset.id;
    }

    filterTables(filter) {
        // Обновляем активную кнопку
        document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const tables = document.querySelectorAll('.table-spot');
        tables.forEach(table => {
            const seats = parseInt(table.dataset.seats);
            const isWindow = table.classList.contains('window-table');

            let show = false;
            if (filter === 'all') {
                show = true;
            } else if (filter === 'window') {
                show = isWindow;
            } else if (filter === 6) {
                show = seats >= 6;
            } else {
                show = seats === filter;
            }

            if (show) {
                table.style.opacity = '1';
                table.style.pointerEvents = 'auto';
            } else {
                table.style.opacity = '0.2';
                table.style.pointerEvents = 'none';
            }
        });
    }

    handleBooking(e) {
        e.preventDefault();

        const tableId = parseInt(document.getElementById('form-table-id').value);
        const date = document.getElementById('booking-date').value;
        const time = document.getElementById('booking-time').value;

        if (!tableId) {
            this.app.showAlert('Выберите стол!', 'danger');
            return;
        }

        // Проверяем, не занят ли стол
        const existing = window.DB.getBookingsByDateAndTable(this.cafeId, tableId, date, time);
        if (existing.length > 0) {
            this.app.showAlert('Стол уже занят на это время!', 'danger');
            return;
        }

        // Создаем бронирование
        window.DB.addBooking({
            user_id: this.app.currentUser.id,
            cafe_id: this.cafeId,
            table_id: tableId,
            date: date,
            time: time
        });

        // Начисляем бонусы
        window.DB.updateUser(this.app.currentUser.id, {
            bonus_points: this.app.currentUser.bonus_points + 50
        });
        this.app.currentUser.bonus_points += 50;

        this.app.showAlert('Бронь успешна! +50 бонусов', 'success');
        setTimeout(() => {
            window.location.hash = '#profile';
        }, 1500);
    }

    openMenu() {
        document.getElementById('menu-modal').style.display = 'block';
    }

    closeMenu() {
        document.getElementById('menu-modal').style.display = 'none';
    }

    deleteReview(reviewId) {
        if (confirm('Удалить этот отзыв?')) {
            window.DB.deleteReview(reviewId);
            this.app.showAlert('Отзыв удален', 'success');
            this.render();
        }
    }
}

// Закрытие модалки при клике вне её
window.addEventListener('click', (event) => {
    const modal = document.getElementById('menu-modal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
});
