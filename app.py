from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import sqlite3
import math
import random
import time
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = 'super-secret-key-2025'


def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn


# --- ГЕНЕРАЦИЯ ФЕЙКОВЫХ ДАННЫХ ---
R_NAMES = ["Алексей", "Елена", "Дмитрий", "Ольга", "Максим", "Светлана", "Иван", "Мария", "Артем", "Анна", "Кирилл",
           "Татьяна"]
R_TEXTS_POS = ["Отличное место! Очень вкусно.", "Атмосфера супер, придем еще.", "Лучший сервис в городе.",
               "Стейки просто бомба!", "Уютно и тихо, рекомендую."]
R_TEXTS_NEU = ["Неплохо, но долго несли заказ.", "Нормально, на четверку.", "Еда вкусная, но музыка громкая.",
               "Ценник выше среднего, но оно того стоит."]
R_TEXTS_NEG = ["Официант забыл про нас.", "Холодно было сидеть у окна.", "Ожидали большего."]


def generate_reviews(c, cafe_id):
    count = random.randint(5, 15)
    for _ in range(count):
        name = random.choice(R_NAMES)
        rating = random.choices([5, 4, 3, 2], weights=[50, 30, 15, 5])[0]
        text = random.choice(R_TEXTS_POS if rating >= 5 else R_TEXTS_NEU if rating >= 3 else R_TEXTS_NEG)
        days_ago = random.randint(0, 30)
        date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        c.execute("INSERT INTO reviews (cafe_id, user_name, rating, text, date) VALUES (?, ?, ?, ?, ?)",
                  (cafe_id, name, rating, text, date))


def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    # 1. Users (Добавил theme)
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 username TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
                 bonus_points INTEGER DEFAULT 0,
                 theme TEXT DEFAULT 'dark')''')
    # 2. Cafes
    c.execute('''CREATE TABLE IF NOT EXISTS cafes (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 name TEXT NOT NULL, address TEXT NOT NULL, cuisine TEXT NOT NULL, is_24h INTEGER DEFAULT 0,
                 avg_check INTEGER DEFAULT 1500, tags TEXT DEFAULT "")''')
    # 3. Reviews
    c.execute('''CREATE TABLE IF NOT EXISTS reviews (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 cafe_id INTEGER, user_name TEXT, rating INTEGER, text TEXT, date TEXT,
                 FOREIGN KEY(cafe_id) REFERENCES cafes(id))''')
    # 4. Tables
    c.execute('''CREATE TABLE IF NOT EXISTS tables (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 cafe_id INTEGER, number TEXT NOT NULL, seats INTEGER NOT NULL,
                 pos_x INTEGER DEFAULT 0, pos_y INTEGER DEFAULT 0,
                 shape TEXT DEFAULT 'rect', rotation INTEGER DEFAULT 0,
                 FOREIGN KEY(cafe_id) REFERENCES cafes(id))''')
    # 5. Bookings
    c.execute('''CREATE TABLE IF NOT EXISTS bookings (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 user_id INTEGER, cafe_id INTEGER, table_id INTEGER,
                 date TEXT NOT NULL, time TEXT NOT NULL,
                 reschedule_count INTEGER DEFAULT 0,
                 FOREIGN KEY(user_id) REFERENCES users(id))''')

    c.execute("SELECT COUNT(*) FROM cafes")
    if c.fetchone()[0] == 0:
        cafes_data = [
            ("Кафе «Уют»", "ул. Ленина, 10", "Европейская", 0, 1200, "Wi-Fi,Тихо,Завтраки"),
            ("Ресторан «Вкусняшка»", "пр. Победы, 5", "Итальянская", 1, 2500, "Вино,Пицца,Живая музыка"),
            ("Sky Lounge", "Башня Федерация", "Лаундж", 1, 5000, "Панорама,VIP,Кальян"),
            ("Суши Токио", "ул. Мира, 22", "Азиатская", 1, 1500, "Суши,Быстро,Доставка"),
            ("Пицца Мама", "ул. Советская, 7", "Семейная", 0, 900, "Детская комната,Аниматоры")
        ]
        for idx, cafe in enumerate(cafes_data):
            c.execute("INSERT INTO cafes (name, address, cuisine, is_24h, avg_check, tags) VALUES (?, ?, ?, ?, ?, ?)",
                      cafe)
            generate_reviews(c, idx + 1)

            cafe_id = idx + 1
            tables = []
            if cafe_id == 1:
                for r in range(3):
                    for col in range(4): tables.append(
                        (f"{r + 1}-{col + 1}", 4 if r == 1 else 2, 10 + col * 25, 15 + r * 30, "rect", 0))
            elif cafe_id == 2:
                for i in range(4): tables.extend(
                    [(f"A{i}", 4, 10, 10 + i * 20, "rect", 0), (f"B{i}", 2, 30, 10 + i * 20, "round", 0)])
                tables.extend(
                    [(f"C{i}", 6, 55 + i * 20, 75, "rect", 90) for i in range(2)] + [("VIP", 8, 85, 75, "square", 0)])
            elif cafe_id == 3:
                for i in range(8):
                    angle = (i / 8) * 2 * math.pi
                    tables.append(
                        (f"R{i + 1}", 2, int(50 + 35 * math.cos(angle) - 5), int(50 + 35 * math.sin(angle) - 5),
                         "round", 0))
                tables.extend(
                    [("V1", 6, 5, 5, "square", 45), ("V2", 6, 85, 5, "square", -45), ("V3", 6, 5, 85, "square", -45),
                     ("V4", 6, 85, 85, "square", 45)])
            elif cafe_id == 4:
                for i in range(5): tables.extend(
                    [(f"L{i}", 4, 5, 10 + i * 18, "rect", 0), (f"R{i}", 4, 85, 10 + i * 18, "rect", 0)])
                for i in range(3): tables.append((f"C{i}", 2, 45, 20 + i * 25, "round", 90))
            else:
                tables = [("Big1", 10, 50, 50, "rect", 0)] + [
                    (f"{i}", 4, 15 if i % 2 else 85, 15 if i < 3 else 85, "rect", 45 if i % 2 == 0 else -45) for i in
                    range(1, 5)]

            for t in tables:
                c.execute(
                    "INSERT INTO tables (cafe_id, number, seats, pos_x, pos_y, shape, rotation) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (cafe_id, t[0], t[1], t[2], t[3], t[4], t[5]))
    conn.commit()
    conn.close()


# --- ROUTES ---
@app.route('/')
def index():
    conn = get_db_connection()
    cafes = conn.execute("""
        SELECT c.*, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
        FROM cafes c LEFT JOIN reviews r ON c.id = r.cafe_id GROUP BY c.id
    """).fetchall()
    cuisines = conn.execute("SELECT DISTINCT cuisine FROM cafes").fetchall()
    conn.close()
    return render_template('index.html', cafes=cafes, cuisines=cuisines)


@app.route('/booking', methods=['GET', 'POST'])
def booking():
    if 'user_id' not in session: return redirect(url_for('login'))
    conn = get_db_connection()

    if request.method == 'POST':
        cafe_id, table_id = request.form['cafe_id'], request.form['table_id']
        date, time_str = request.form['date'], request.form['time']

        if not table_id:
            flash('Выберите стол!', 'danger')
        else:
            if conn.execute("SELECT id FROM bookings WHERE cafe_id=? AND table_id=? AND date=? AND time=?",
                            (cafe_id, table_id, date, time_str)).fetchone():
                flash('Стол занят!', 'danger')
            else:
                conn.execute("INSERT INTO bookings (user_id, cafe_id, table_id, date, time) VALUES (?, ?, ?, ?, ?)",
                             (session['user_id'], cafe_id, table_id, date, time_str))
                conn.execute("UPDATE users SET bonus_points = bonus_points + 50 WHERE id = ?", (session['user_id'],))
                conn.commit()
                flash('Бронь успешна! +50 бонусов', 'success')
                return redirect(url_for('profile'))

    selected_cafe_id = request.args.get('cafe', 1)
    current_cafe = conn.execute("SELECT * FROM cafes WHERE id=?", (selected_cafe_id,)).fetchone()
    cafes = conn.execute("SELECT id, name FROM cafes").fetchall()
    tables = conn.execute("SELECT * FROM tables WHERE cafe_id=?", (selected_cafe_id,)).fetchall()
    reviews = conn.execute("SELECT * FROM reviews WHERE cafe_id=? ORDER BY date DESC LIMIT 5",
                           (selected_cafe_id,)).fetchall()

    today = datetime.now().strftime('%Y-%m-%d')
    real_bookings = [r['table_id'] for r in conn.execute("SELECT table_id FROM bookings WHERE cafe_id=? AND date=?",
                                                         (selected_cafe_id, today)).fetchall()]

    seed = int(time.time() // 300)
    random.seed(seed + int(selected_cafe_id))
    table_statuses = {}
    for t in tables:
        t_id = t['id']
        if t_id in real_bookings:
            table_statuses[t_id] = 'occupied'
        else:
            rand = random.random()
            table_statuses[t_id] = 'free' if rand < 0.6 else 'occupied' if rand < 0.9 else 'booked'

    conn.close()
    return render_template('booking.html', current_cafe=current_cafe, all_cafes=cafes, tables=tables,
                           table_statuses=table_statuses, today=today, reviews=reviews)


@app.route('/cancel_booking/<int:booking_id>')
def cancel_booking(booking_id):
    if 'user_id' not in session: return redirect(url_for('login'))
    conn = get_db_connection()
    booking = conn.execute("SELECT * FROM bookings WHERE id=? AND user_id=?",
                           (booking_id, session['user_id'])).fetchone()
    if booking:
        conn.execute("DELETE FROM bookings WHERE id=?", (booking_id,))
        current_bonus = conn.execute("SELECT bonus_points FROM users WHERE id=?", (session['user_id'],)).fetchone()[0]
        new_bonus = max(0, current_bonus - 50)
        conn.execute("UPDATE users SET bonus_points = ? WHERE id=?", (new_bonus, session['user_id']))
        conn.commit()
        flash('Бронь отменена. 50 бонусов списано.', 'warning')
    else:
        flash('Ошибка отмены.', 'danger')
    conn.close()
    return redirect(url_for('profile'))


@app.route('/reschedule', methods=['POST'])
def reschedule():
    if 'user_id' not in session: return redirect(url_for('login'))
    booking_id = request.form['booking_id']
    new_date = request.form['new_date']
    new_time = request.form['new_time']
    conn = get_db_connection()
    booking = conn.execute("SELECT * FROM bookings WHERE id=? AND user_id=?",
                           (booking_id, session['user_id'])).fetchone()
    if booking:
        if booking['reschedule_count'] >= 3:
            flash('Вы исчерпали лимит переносов (макс. 3 раза).', 'danger')
        else:
            collision = conn.execute(
                "SELECT id FROM bookings WHERE cafe_id=? AND table_id=? AND date=? AND time=? AND id!=?",
                (booking['cafe_id'], booking['table_id'], new_date, new_time, booking_id)).fetchone()
            if collision:
                flash('На это время стол уже занят!', 'danger')
            else:
                conn.execute("UPDATE bookings SET date=?, time=?, reschedule_count=reschedule_count+1 WHERE id=?",
                             (new_date, new_time, booking_id))
                conn.commit()
                flash('Бронь успешно перенесена!', 'success')
    else:
        flash('Бронь не найдена.', 'danger')
    conn.close()
    return redirect(url_for('profile'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        conn = get_db_connection()
        try:
            conn.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                         (request.form['username'], request.form['email'], request.form['password']))
            conn.commit()
            flash('Регистрация успешна!', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Email занят!', 'danger')
        finally:
            conn.close()
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE email=? AND password=?",
                            (request.form['email'], request.form['password'])).fetchone()
        conn.close()
        if user:
            session['user_id'] = user['id']
            session['username'] = user['username']
            return redirect(url_for('profile'))
        else:
            flash('Ошибка входа!', 'danger')
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))


@app.route('/set_theme', methods=['POST'])
def set_theme():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    theme = request.json.get('theme')
    conn = get_db_connection()
    conn.execute("UPDATE users SET theme = ? WHERE id = ?", (theme, session['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/profile')
def profile():
    if 'user_id' not in session: return redirect(url_for('login'))
    conn = get_db_connection()
    user = conn.execute("SELECT bonus_points, theme FROM users WHERE id=?", (session['user_id'],)).fetchone()

    if user is None:
        session.clear()
        conn.close()
        return redirect(url_for('login'))

    bookings = conn.execute("""
        SELECT b.id as booking_id, b.date, b.time, b.reschedule_count, 
               c.name as cafe_name, t.number as table_number, t.seats 
        FROM bookings b JOIN cafes c ON b.cafe_id = c.id JOIN tables t ON b.table_id = t.id 
        WHERE b.user_id = ? ORDER BY b.date DESC""", (session['user_id'],)).fetchall()

    conn.close()
    return render_template('profile.html', username=session['username'], bookings=bookings,
                           bonuses=user['bonus_points'], current_theme=user['theme'])


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
