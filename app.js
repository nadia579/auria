// Key under which all data is stored in localStorage
const STORAGE_KEY = 'auria.data';

// Weekday labels shown in the calendar header (UI text stays in Italian)
const WEEKDAYS = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];

// Shape of the empty "database", used the first time the app is opened
function emptyData() {
  return {
    version: 1,
    cycles: [],
    days: {},
    attacks: [],
    settings: { cycleLength: 28, periodLength: 5, lock: { enabled: false } }
  };
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    return emptyData();
  } else {
    return JSON.parse(saved);
  }
}

function saveData(data) {
  const serialized = JSON.stringify(data);
  localStorage.setItem(STORAGE_KEY, serialized);
}

function monthCells(year, month) {
  // First day of the month
  const first = new Date(year, month, 1);

  // Column of day 1 (mon=0 ... sun=6) = number of empty cells needed
  const blanks = (first.getDay() + 6) % 7;

  // Number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // The list to fill, initially empty
  const cells = [];

  // Empty cells first: adds "blanks" times a null
  for (let i = 0; i < blanks; i++) {
    cells.push(null);
  }

  // Then the days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  return cells;
}

function renderCalendar(year, month) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const title = document.getElementById('month-title');
  title.textContent = new Date(year, month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calendar');
  grid.innerHTML = '';

  const cells = monthCells(year, month);

  for (const weekday of WEEKDAYS) {
    const cell = document.createElement('div');
    cell.className = 'weekday';
    cell.textContent = weekday;
    grid.appendChild(cell);
  }

  for (const day of cells) {
    const cell = document.createElement('div');
    cell.textContent = day;
    if (year === currentYear && month === currentMonth && day === currentDay) {
      cell.className = 'today';
    }
    grid.appendChild(cell);
  }
}

// Shows the next month
function nextMonth() {
  shownMonth++;               
  if (shownMonth > 11) {     
    shownMonth = 0;     
    shownYear++;           
  }
  renderCalendar(shownYear, shownMonth);
}

// Shows the previous month
function prevMonth() {
  shownMonth--;            
  if (shownMonth < 0) {   
    shownMonth = 11;  
    shownYear--;
  }
  renderCalendar(shownYear, shownMonth);
}

// Startup: load data and keep it in a global variable
// Startup: load data and keep it in a global variable
let data = loadData();
console.log('Data loaded:', data);

// Calendar state: which month is currently shown (starts from today)
const today = new Date();
let shownYear = today.getFullYear();
let shownMonth = today.getMonth();

// Arrow buttons: on click, call the function (passed without parentheses)
document.getElementById('prev-month').addEventListener('click', prevMonth);
document.getElementById('next-month').addEventListener('click', nextMonth);

renderCalendar(shownYear, shownMonth);