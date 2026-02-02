document.addEventListener('DOMContentLoaded', function() {
    const cafeSelect = document.getElementById('cafe-select');
    const tableSelect = document.getElementById('table-select');

    if (cafeSelect && tableSelect) {
        cafeSelect.addEventListener('change', function() {
            const cafeId = this.value;
            
            // Анимация загрузки (опционально)
            tableSelect.style.opacity = '0.5';
            
            fetch(`/api/tables/${cafeId}`)
                .then(response => response.json())
                .then(data => {
                    tableSelect.innerHTML = ''; // Очистить текущие опции
                    
                    if (data.length === 0) {
                        const option = document.createElement('option');
                        option.text = "Нет доступных столиков";
                        tableSelect.add(option);
                    } else {
                        data.forEach(table => {
                            const option = document.createElement('option');
                            option.value = table.id;
                            option.text = `Стол №${table.number} (${table.seats} мест)`;
                            tableSelect.add(option);
                        });
                    }
                    tableSelect.style.opacity = '1';
                })
                .catch(error => {
                    console.error('Error fetching tables:', error);
                    tableSelect.style.opacity = '1';
                });
        });
    }

    // Простая анимация появления элементов при скролле (если нужно)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    });

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
});
