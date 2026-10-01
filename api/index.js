export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.status(200).send(getHtml());
}

function getHtml() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Внутренние номера</title>
  <script src="//api.bitrix24.com/api/v1/"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 16px; background: #f5f7f9; color: #333; }
    h2 { margin: 0 0 12px; font-size: 18px; color: #2fc6f6; }
    .search { width: 100%; padding: 10px 14px; border: 1px solid #dfe3e6; border-radius: 8px; font-size: 14px; margin-bottom: 12px; outline: none; }
    .search:focus { border-color: #2fc6f6; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    th, td { padding: 10px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #eef1f3; }
    th { background: #f0f4f7; font-weight: 600; color: #555; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f9fbfc; }
    .phone { font-weight: 600; color: #2fc6f6; cursor: pointer; white-space: nowrap; }
    .phone:hover { text-decoration: underline; }
    .empty, .loader { text-align: center; padding: 30px; color: #999; }
    .avatar { display: inline-block; width: 28px; height: 28px; border-radius: 50%; background: #2fc6f6; color: #fff; text-align: center; line-height: 28px; font-size: 12px; margin-right: 8px; vertical-align: middle; }
  </style>
</head>
<body>
  <h2>📞 Внутренние номера сотрудников</h2>
  <input type="text" class="search" id="search" placeholder="Поиск по имени, отделу или номеру...">
  <div id="content"><div class="loader">Загрузка данных...</div></div>

<script>
  BX24.init(function () { loadUsers(); });
  let allUsers = [];

  function loadUsers() {
    BX24.callMethod('user.get', {
      ACTIVE: true,
      SELECT: ['ID','NAME','LAST_NAME','SECOND_NAME','WORK_POSITION','UF_PHONE_INNER','UF_DEPARTMENT','PERSONAL_PHOTO']
    }, function (result) {
      if (result.error()) {
        document.getElementById('content').innerHTML = '<div class="empty">Ошибка: ' + result.error().error_description + '</div>';
        return;
      }
      allUsers = result.data() || [];
      loadDepartments(allUsers);
    });
  }

  function loadDepartments(users) {
    BX24.callMethod('department.get', {}, function (res) {
      const deps = {};
      if (!res.error()) { (res.data() || []).forEach(d => { deps[d.ID] = d.NAME; }); }
      users.forEach(u => {
        if (Array.isArray(u.UF_DEPARTMENT) && u.UF_DEPARTMENT.length) {
          u._deptName = deps[u.UF_DEPARTMENT[0]] || '';
        } else if (u.UF_DEPARTMENT) {
          u._deptName = deps[u.UF_DEPARTMENT] || '';
        } else { u._deptName = ''; }
      });
      render(users);
    });
  }

  function render(users) {
    const content = document.getElementById('content');
    if (!users.length) { content.innerHTML = '<div class="empty">Сотрудники не найдены</div>'; return; }
    users.sort((a,b) => (a.LAST_NAME||'').localeCompare(b.LAST_NAME||'', 'ru'));
    let html = '<table><thead><tr><th>Сотрудник</th><th>Должность</th><th>Отдел</th><th>Внутр. номер</th></tr></thead><tbody>';
    users.forEach(u => {
      const fio = [u.LAST_NAME, u.NAME, u.SECOND_NAME].filter(Boolean).join(' ');
      const initials = ((u.LAST_NAME||' ')[0] + (u.NAME||' ')[0]).toUpperCase();
      const phone = u.UF_PHONE_INNER || '—';
      html += '<tr><td><span class="avatar">' + initials + '</span>' + esc(fio) + '</td><td>' + esc(u.WORK_POSITION||'—') + '</td><td>' + esc(u._deptName||'—') + '</td><td class="phone" data-phone="' + esc(phone) + '">' + esc(phone) + '</td></tr>';
    });
    html += '</tbody></table>';
    content.innerHTML = html;
    document.querySelectorAll('.phone').forEach(el => {
      el.addEventListener('click', () => {
        const num = el.dataset.phone;
        if (num && num !== '—') {
          navigator.clipboard.writeText(num).then(() => {
            const old = el.textContent;
            el.textContent = '✓ Скопировано';
            setTimeout(() => { el.textContent = old; }, 1000);
          });
        }
      });
    });
  }

  document.getElementById('search').addEventListener('input', function (e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { render(allUsers); return; }
    const filtered = allUsers.filter(u => {
      const fio = [u.LAST_NAME, u.NAME, u.SECOND_NAME].filter(Boolean).join(' ').toLowerCase();
      return fio.includes(q) || (u.WORK_POSITION||'').toLowerCase().includes(q) || (u._deptName||'').toLowerCase().includes(q) || (u.UF_PHONE_INNER||'').toString().includes(q);
    });
    render(filtered);
  });

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
</script>
</body>
</html>`;
}
