async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) {
      throw new Error('Помилка отримання статистики');
    }

    const data = await res.json();
    console.log('ADMIN STATS:', data);

    // Картки статистики
    document.getElementById('users').textContent = data.users ?? 0;
    document.getElementById('clinics').textContent = data.clinics ?? 0;
    document.getElementById('centers').textContent = data.centers ?? 0;
    document.getElementById('trainers').textContent = data.trainers ?? 0;
    document.getElementById('breeders').textContent = data.breeders ?? 0;
    document.getElementById('organizations').textContent = data.organizations ?? 0;

    // Таблиця тварин за типом
    const tbody = document.getElementById('pets-table');
    tbody.innerHTML = '';

    if (!Array.isArray(data.petsByType)) {
      console.warn('petsByType не є масивом:', data.petsByType);
      return;
    }

    data.petsByType.forEach(p => {
      const type = p.type || p.pet_type || 'Не вказано';
      const total = p.total ?? p.count ?? p.c ?? 0;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${type}</td>
        <td>${total}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error('Admin panel error:', error);
    alert('Не вдалося завантажити дані адміністративної панелі');
  }
}

document.addEventListener('DOMContentLoaded', loadStats);
