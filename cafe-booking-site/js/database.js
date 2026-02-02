// Модуль для работы с localStorage как с базой данных

class Database {
    constructor() {
        this.initDatabase();
    }

    initDatabase() {
        // Проверяем, есть ли уже данные
        if (!localStorage.getItem('cafes')) {
            this.seedInitialData();
        }
    }

    seedInitialData() {
        // Инициализируем начальные данные
        const cafes = [
            {
                id: 1,
                name: "Кафе «Уют»",
                address: "ул. Ленина, 10",
                cuisine: "Европейская",
                is_24h: false,
                avg_check: 1200,
                tags: "Wi-Fi,Тихо,Завтраки",
                image: "1.png"
            },
            {
                id: 2,
                name: "Ресторан «Вкусняшка»",
                address: "пр. Победы, 5",
                cuisine: "Итальянская",
                is_24h: true,
                avg_check: 2500,
                tags: "Вино,Пицца,Живая музыка",
                image: "2.png"
            },
            {
                id: 3,
                name: "Sky Lounge",
                address: "Башня Федерация",
                cuisine: "Лаундж",
                is_24h: true,
                avg_check: 5000,
                tags: "Панорама,VIP,Кальян",
                image: "3.png"
            },
            {
                id: 4,
                name: "Суши Токио",
                address: "ул. Мира, 22",
                cuisine: "Азиатская",
                is_24h: true,
                avg_check: 1500,
                tags: "Суши,Быстро,Доставка",
                image: "4.png"
            },
            {
                id: 5,
                name: "Пицца Мама",
                address: "ул. Советская, 7",
                cuisine: "Семейная",
                is_24h: false,
                avg_check: 900,
                tags: "Детская комната,Аниматоры",
                image: "5.png"
            }
        ];

        // Генерируем столы для каждого кафе
        const tables = this.generateTables();

        // Генерируем отзывы
        const reviews = this.generateReviews();

        // Сохраняем в localStorage
        localStorage.setItem('cafes', JSON.stringify(cafes));
        localStorage.setItem('tables', JSON.stringify(tables));
        localStorage.setItem('reviews', JSON.stringify(reviews));
        localStorage.setItem('bookings', JSON.stringify([]));

        // Создаем админа по умолчанию (admin / admin123)
        const adminUser = {
            id: 0,
            username: "Администратор",
            email: "admin",
            password: "admin123",
            bonus_points: 0,
            is_admin: true
        };
        const users = [adminUser];
        localStorage.setItem('users', JSON.stringify(users));
    }

    generateTables() {
        const tables = [];
        let tableId = 1;

        // Кафе 1: Классическая сетка
        for (let r = 0; r < 3; r++) {
            for (let col = 0; col < 4; col++) {
                tables.push({
                    id: tableId++,
                    cafe_id: 1,
                    number: `${r + 1}-${col + 1}`,
                    seats: r === 1 ? 4 : 2,
                    pos_x: 15 + col * 23,
                    pos_y: 20 + r * 28,
                    shape: 'rect',
                    rotation: 0,
                    is_window: col === 0 || col === 3
                });
            }
        }

        // Кафе 2: Смешанная планировка с VIP зоной
        for (let i = 0; i < 4; i++) {
            tables.push({
                id: tableId++,
                cafe_id: 2,
                number: `A${i + 1}`,
                seats: 4,
                pos_x: 15,
                pos_y: 15 + i * 22,
                shape: 'rect',
                rotation: 0,
                is_window: i === 0 || i === 3
            });
            tables.push({
                id: tableId++,
                cafe_id: 2,
                number: `B${i + 1}`,
                seats: 2,
                pos_x: 40,
                pos_y: 15 + i * 22,
                shape: 'round',
                rotation: 0,
                is_window: false
            });
        }
        tables.push({
            id: tableId++,
            cafe_id: 2,
            number: 'VIP',
            seats: 8,
            pos_x: 80,
            pos_y: 70,
            shape: 'square',
            rotation: 0,
            is_window: true
        });

        // Кафе 3: Круговая планировка (Sky Lounge)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 2 * Math.PI;
            tables.push({
                id: tableId++,
                cafe_id: 3,
                number: `R${i + 1}`,
                seats: 2,
                pos_x: Math.round(50 + 30 * Math.cos(angle)),
                pos_y: Math.round(50 + 30 * Math.sin(angle)),
                shape: 'round',
                rotation: 0,
                is_window: true
            });
        }
        tables.push(
            { id: tableId++, cafe_id: 3, number: 'V1', seats: 6, pos_x: 10, pos_y: 10, shape: 'square', rotation: 45, is_window: true },
            { id: tableId++, cafe_id: 3, number: 'V2', seats: 6, pos_x: 90, pos_y: 10, shape: 'square', rotation: -45, is_window: true },
            { id: tableId++, cafe_id: 3, number: 'V3', seats: 6, pos_x: 10, pos_y: 90, shape: 'square', rotation: -45, is_window: true },
            { id: tableId++, cafe_id: 3, number: 'V4', seats: 6, pos_x: 90, pos_y: 90, shape: 'square', rotation: 45, is_window: true }
        );

        // Кафе 4: Суши бар с барными стойками
        for (let i = 0; i < 4; i++) {
            tables.push({
                id: tableId++,
                cafe_id: 4,
                number: `L${i + 1}`,
                seats: 4,
                pos_x: 10,
                pos_y: 15 + i * 22,
                shape: 'rect',
                rotation: 0,
                is_window: true
            });
            tables.push({
                id: tableId++,
                cafe_id: 4,
                number: `R${i + 1}`,
                seats: 4,
                pos_x: 90,
                pos_y: 15 + i * 22,
                shape: 'rect',
                rotation: 0,
                is_window: true
            });
        }
        for (let i = 0; i < 3; i++) {
            tables.push({
                id: tableId++,
                cafe_id: 4,
                number: `C${i + 1}`,
                seats: 2,
                pos_x: 50,
                pos_y: 25 + i * 22,
                shape: 'round',
                rotation: 90,
                is_window: false
            });
        }

        // Кафе 5: Семейное с большим центральным столом
        tables.push({
            id: tableId++,
            cafe_id: 5,
            number: 'Big1',
            seats: 10,
            pos_x: 50,
            pos_y: 50,
            shape: 'rect',
            rotation: 0,
            is_window: false
        });
        for (let i = 1; i <= 4; i++) {
            tables.push({
                id: tableId++,
                cafe_id: 5,
                number: `${i}`,
                seats: 4,
                pos_x: i % 2 ? 20 : 80,
                pos_y: i < 3 ? 20 : 80,
                shape: 'rect',
                rotation: i % 2 === 0 ? 45 : -45,
                is_window: true
            });
        }

        return tables;
    }

    generateReviews() {
        const names = ["Алексей", "Елена", "Дмитрий", "Ольга", "Максим", "Светлана", "Иван", "Мария", "Артем", "Анна", "Кирилл", "Татьяна"];
        const posTexts = ["Отличное место! Очень вкусно.", "Атмосфера супер, придем еще.", "Лучший сервис в городе.", "Стейки просто бомба!", "Уютно и тихо, рекомендую."];
        const neuTexts = ["Неплохо, но долго несли заказ.", "Нормально, на четверку.", "Еда вкусная, но музыка громкая.", "Ценник выше среднего, но оно того стоит."];
        const negTexts = ["Официант забыл про нас.", "Холодно было сидеть у окна.", "Ожидали большего."];

        const reviews = [];
        let reviewId = 1;

        for (let cafeId = 1; cafeId <= 5; cafeId++) {
            const count = Math.floor(Math.random() * 10) + 5;
            for (let i = 0; i < count; i++) {
                const rating = [5, 5, 5, 4, 4, 3, 2][Math.floor(Math.random() * 7)];
                const texts = rating >= 5 ? posTexts : rating >= 3 ? neuTexts : negTexts;
                const text = texts[Math.floor(Math.random() * texts.length)];
                const daysAgo = Math.floor(Math.random() * 30);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);

                reviews.push({
                    id: reviewId++,
                    cafe_id: cafeId,
                    user_name: names[Math.floor(Math.random() * names.length)],
                    rating: rating,
                    text: text,
                    date: date.toISOString().split('T')[0]
                });
            }
        }

        return reviews;
    }

    // CRUD операции для пользователей
    getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    addUser(user) {
        const users = this.getUsers();
        user.id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        user.bonus_points = 0;
        user.is_admin = false;
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    // CRUD операции для кафе
    getCafes() {
        return JSON.parse(localStorage.getItem('cafes') || '[]');
    }

    getCafeById(id) {
        const cafes = this.getCafes();
        return cafes.find(c => c.id === parseInt(id));
    }

    addCafe(cafe) {
        const cafes = this.getCafes();
        cafe.id = cafes.length > 0 ? Math.max(...cafes.map(c => c.id)) + 1 : 1;
        cafes.push(cafe);
        localStorage.setItem('cafes', JSON.stringify(cafes));
        return cafe;
    }

    updateCafe(cafeId, updates) {
        const cafes = this.getCafes();
        const index = cafes.findIndex(c => c.id === cafeId);
        if (index !== -1) {
            cafes[index] = { ...cafes[index], ...updates };
            localStorage.setItem('cafes', JSON.stringify(cafes));
            return cafes[index];
        }
        return null;
    }

    deleteCafe(cafeId) {
        const cafes = this.getCafes();
        const filtered = cafes.filter(c => c.id !== cafeId);
        localStorage.setItem('cafes', JSON.stringify(filtered));

        const tables = this.getTables().filter(t => t.cafe_id !== cafeId);
        localStorage.setItem('tables', JSON.stringify(tables));

        const reviews = this.getReviews().filter(r => r.cafe_id !== cafeId);
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }

    // CRUD операции для столов
    getTables() {
        return JSON.parse(localStorage.getItem('tables') || '[]');
    }

    getTablesByCafe(cafeId) {
        const tables = this.getTables();
        return tables.filter(t => t.cafe_id === parseInt(cafeId));
    }

    addTable(table) {
        const tables = this.getTables();
        table.id = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
        tables.push(table);
        localStorage.setItem('tables', JSON.stringify(tables));
        return table;
    }

    updateTable(tableId, updates) {
        const tables = this.getTables();
        const index = tables.findIndex(t => t.id === tableId);
        if (index !== -1) {
            tables[index] = { ...tables[index], ...updates };
            localStorage.setItem('tables', JSON.stringify(tables));
            return tables[index];
        }
        return null;
    }

    deleteTable(tableId) {
        const tables = this.getTables();
        const filtered = tables.filter(t => t.id !== tableId);
        localStorage.setItem('tables', JSON.stringify(filtered));
    }

    // CRUD операции для отзывов
    getReviews() {
        return JSON.parse(localStorage.getItem('reviews') || '[]');
    }

    getReviewsByCafe(cafeId) {
        const reviews = this.getReviews();
        return reviews.filter(r => r.cafe_id === parseInt(cafeId));
    }

    deleteReview(reviewId) {
        const reviews = this.getReviews();
        const filtered = reviews.filter(r => r.id !== reviewId);
        localStorage.setItem('reviews', JSON.stringify(filtered));
    }

    // CRUD операции для бронирований
    getBookings() {
        return JSON.parse(localStorage.getItem('bookings') || '[]');
    }

    getBookingsByUser(userId) {
        const bookings = this.getBookings();
        return bookings.filter(b => b.user_id === userId);
    }

    addBooking(booking) {
        const bookings = this.getBookings();
        booking.id = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
        booking.reschedule_count = 0;
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return booking;
    }

    deleteBooking(bookingId) {
        const bookings = this.getBookings();
        const filtered = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem('bookings', JSON.stringify(filtered));
    }

    updateBooking(bookingId, updates) {
        const bookings = this.getBookings();
        const index = bookings.findIndex(b => b.id === bookingId);
        if (index !== -1) {
            bookings[index] = { ...bookings[index], ...updates };
            localStorage.setItem('bookings', JSON.stringify(bookings));
            return bookings[index];
        }
        return null;
    }

    getBookingsByDateAndTable(cafeId, tableId, date, time) {
        const bookings = this.getBookings();
        return bookings.filter(b =>
            b.cafe_id === cafeId &&
            b.table_id === tableId &&
            b.date === date &&
            b.time === time
        );
    }

    // Статистика для кафе
    getCafeStats(cafeId) {
        const reviews = this.getReviewsByCafe(cafeId);
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 5.0;
        return {
            avg_rating: avgRating.toFixed(1),
            review_count: reviews.length
        };
    }
}

// Экспортируем синглтон
window.DB = new Database();
