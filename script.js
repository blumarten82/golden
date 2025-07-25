// 할 일 데이터 로드 및 저장
function loadTodos() {
  return JSON.parse(localStorage.getItem('todos') || '[]');
}

function saveTodos(todos) {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// 날짜 yyyy-mm-dd 포맷
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// 상태
let todos = loadTodos();
let editingId = null;

// 달력 상태 (현재 연/월)
let calendarYear = (new Date()).getFullYear();
let calendarMonth = (new Date()).getMonth();

// 요소
const todoInput = document.getElementById('todo-input');
const todoDate = document.getElementById('todo-date');
const addBtn = document.getElementById('add-todo-btn');
const listViewBtn = document.getElementById('list-view-btn');
const calendarViewBtn = document.getElementById('calendar-view-btn');
const todoListView = document.getElementById('todo-list-view');
const calendarView = document.getElementById('calendar-view');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');

// 할 일 추가/수정
addBtn.onclick = function() {
  const text = todoInput.value.trim();
  const date = todoDate.value;
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  if (!text) {
    alert('할 일을 입력하세요!');
    return;
  }
  if (editingId) {
    todos = todos.map(t => t.id === editingId ? { ...t, text, date, startTime, endTime } : t);
    editingId = null;
  } else {
    todos.push({
      id: Date.now().toString(),
      text,
      date: formatDate(date),
      startTime,
      endTime
    });
  }
  saveTodos(todos);
  todoInput.value = '';
  todoDate.value = '';
  startTimeInput.value = '';
  endTimeInput.value = '';
  render();
};

todoInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addBtn.onclick();
});

todoDate.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addBtn.onclick();
});

// 리스트 뷰 렌더링
function renderListView() {
  if (!todos.length) {
    todoListView.innerHTML = '<p style="text-align:center;color:#b39ddb;">할 일이 없습니다.</p>';
    return;
  }
  todoListView.innerHTML = '<ul>' + todos.map(todo => `
    <li class="todo-item">
      <span class="todo-text">${todo.text}</span>
      <span class="todo-date">${todo.date || ''}</span>
      <span class="todo-time">${(todo.startTime || '') + (todo.startTime && todo.endTime ? ' ~ ' : '') + (todo.endTime || '')}</span>
      <span class="todo-actions">
        <button onclick="editTodo('${todo.id}')">수정</button>
        <button onclick="deleteTodo('${todo.id}')">삭제</button>
      </span>
    </li>
  `).join('') + '</ul>';
}

// 달력 뷰 렌더링
function renderCalendarHeader() {
  const header = document.getElementById('calendar-header');
  header.style.display = '';
  header.innerHTML = `
    <div class='calendar-header-box'>
      <button id='calendar-prev-btn' class='calendar-arrow'>&lt;</button>
      <span class='calendar-title'>${calendarYear}년 ${calendarMonth + 1}월</span>
      <button id='calendar-next-btn' class='calendar-arrow'>&gt;</button>
    </div>
  `;
  document.getElementById('calendar-prev-btn').onclick = function() {
    calendarMonth--;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
    renderCalendarHeader();
    renderCalendarView();
    document.getElementById('calendar-detail-section').style.display = 'none';
  };
  document.getElementById('calendar-next-btn').onclick = function() {
    calendarMonth++;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
    renderCalendarHeader();
    renderCalendarView();
    document.getElementById('calendar-detail-section').style.display = 'none';
  };
}

function renderCalendarView() {
  const now = new Date();
  const year = calendarYear;
  const month = calendarMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  let html = '<table class="calendar-table">';
  html += '<thead><tr>';
  ['일','월','화','수','목','금','토'].forEach(d => {
    html += `<th>${d}</th>`;
  });
  html += '</tr></thead><tbody><tr>';

  // 빈칸
  for (let i = 0; i < startDay; i++) html += '<td></td>';

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(new Date(year, month, day));
    const dayTodos = todos.filter(t => t.date === dateStr);
    const isToday = dateStr === formatDate(now);
    html += `<td class="${isToday ? 'today' : ''} calendar-day-cell" data-date="${dateStr}"><div>${day}</div>`;
    if (dayTodos.length) {
      html += '<ul class="calendar-todo-list">';
      dayTodos.forEach(t => {
        html += `<li title="${t.text}">${t.text}
        ${(t.startTime || t.endTime) ? `<span class='calendar-todo-time'>${(t.startTime || '') + (t.startTime && t.endTime ? ' ~ ' : '') + (t.endTime || '')}</span>` : ''}
        </li>`;
      });
      html += '</ul>';
    }
    html += '</td>';
    if ((startDay + day) % 7 === 0 && day !== daysInMonth) html += '</tr><tr>';
  }
  // 마지막 빈칸
  const remain = (startDay + daysInMonth) % 7;
  if (remain) for (let i = remain; i < 7; i++) html += '<td></td>';
  html += '</tr></tbody></table>';
  calendarView.innerHTML = html;

  // 날짜 클릭 이벤트 등록
  document.querySelectorAll('.calendar-day-cell').forEach(td => {
    td.onclick = function() {
      const date = td.getAttribute('data-date');
      // 모든 셀에서 selected 제거
      document.querySelectorAll('.calendar-day-cell.selected').forEach(el => el.classList.remove('selected'));
      // 현재 셀에 selected 추가
      td.classList.add('selected');
      showCalendarDetail(date);
    };
  });
}

function showCalendarDetail(date) {
  const section = document.getElementById('calendar-detail-section');
  section.style.display = '';
  const dayTodos = todos.filter(t => t.date === date);
  let html = `<div class='calendar-detail-box'><h3>${date} 할 일</h3>`;
  if (dayTodos.length) {
    html += '<ul class="calendar-detail-list">';
    dayTodos.forEach(t => {
      html += `<li><b>${t.text}</b> <span>${(t.startTime || '') + (t.startTime && t.endTime ? ' ~ ' : '') + (t.endTime || '')}</span></li>`;
    });
    html += '</ul>';
  } else {
    html += '<p style="color:#b39ddb;">할 일이 없습니다.</p>';
  }
  // 새 할 일 입력창
  html += `<div class='calendar-detail-inputs'>
    <input type='text' id='calendar-detail-input' placeholder='할 일을 입력하세요...'>
    <input type='time' id='calendar-detail-start'>
    <input type='time' id='calendar-detail-end'>
    <button id='calendar-detail-add-btn'>추가</button>
  </div>`;
  html += '</div>';
  section.innerHTML = html;

  // 입력 이벤트
  document.getElementById('calendar-detail-add-btn').onclick = function() {
    const text = document.getElementById('calendar-detail-input').value.trim();
    const startTime = document.getElementById('calendar-detail-start').value;
    const endTime = document.getElementById('calendar-detail-end').value;
    if (!text) {
      alert('할 일을 입력하세요!');
      return;
    }
    todos.push({
      id: Date.now().toString(),
      text,
      date,
      startTime,
      endTime
    });
    saveTodos(todos);
    showCalendarDetail(date);
    renderCalendarView();
  };
  // 선택된 날짜 셀 강조 (달력 갱신 후에도 유지)
  document.querySelectorAll('.calendar-day-cell.selected').forEach(el => el.classList.remove('selected'));
  const selectedTd = document.querySelector(`.calendar-day-cell[data-date='${date}']`);
  if (selectedTd) selectedTd.classList.add('selected');
}

// 뷰 전환
listViewBtn.onclick = function() {
  listViewBtn.classList.add('active');
  calendarViewBtn.classList.remove('active');
  todoListView.style.display = '';
  calendarView.style.display = 'none';
  document.getElementById('calendar-header').style.display = 'none';
  document.getElementById('calendar-detail-section').style.display = 'none';
};
calendarViewBtn.onclick = function() {
  calendarViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
  todoListView.style.display = 'none';
  calendarView.style.display = '';
  renderCalendarHeader();
  renderCalendarView();
  document.getElementById('calendar-detail-section').style.display = 'none';
};

// 수정/삭제 함수 (window에 등록)
window.editTodo = function(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todoInput.value = todo.text;
  todoDate.value = todo.date;
  startTimeInput.value = todo.startTime || '';
  endTimeInput.value = todo.endTime || '';
  editingId = id;
  todoInput.focus();
};

window.deleteTodo = function(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  todos = todos.filter(t => t.id !== id);
  saveTodos(todos);
  render();
};

// 렌더링
function render() {
  if (todoListView.style.display !== 'none') renderListView();
  if (calendarView.style.display !== 'none') renderCalendarView();
}

// 최초 렌더링
render(); 