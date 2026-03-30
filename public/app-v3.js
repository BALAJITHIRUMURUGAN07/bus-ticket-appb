const scheduleList = document.getElementById('schedule-list');
const routeSearchInput = document.getElementById('route-search');
const routeSelect = document.getElementById('route-select');
const bookingRoute = document.getElementById('booking-route');
const estimateRoute = document.getElementById('estimate-route');
const seatMap = document.getElementById('seat-map');
const selectedSeatsEl = document.getElementById('selected-seats');
const bookingForm = document.getElementById('booking-form');
const estimateForm = document.getElementById('estimate-form');
const estimateResult = document.getElementById('estimate-result');
const ticketCard = document.getElementById('ticket-card');
const refreshSeatsButton = document.getElementById('refresh-seats');
const seatCountInput = document.getElementById('seat-count');
const passengerNameInput = document.getElementById('passenger-name');
const statusOutput = document.getElementById('status-output');

function createSeats(count = 32) {
  return Array.from({ length: count }, (_, index) => ({
    seatNo: `${index + 1}`,
    booked: false,
    class: index < 4 ? 'Premium' : 'Standard'
  }));
}

const routes = [
  {
    id: 'B100',
    name: 'City A → City B',
    from: 'City A',
    to: 'City B',
    departure: '08:00',
    arrival: '12:10',
    duration: '4h 10m',
    distance: 250,
    baseFare: 25,
    availableSeats: 32,
    totalSeats: 32,
    busType: 'Deluxe',
    amenities: ['Wi-Fi', 'AC', 'Recliner seats'],
    status: 'On time',
    seats: createSeats(32)
  },
  {
    id: 'B200',
    name: 'City C → City D',
    from: 'City C',
    to: 'City D',
    departure: '09:30',
    arrival: '14:00',
    duration: '4h 30m',
    distance: 310,
    baseFare: 30,
    availableSeats: 36,
    totalSeats: 36,
    busType: 'Express',
    amenities: ['Charging ports', 'Refreshments', 'Extra legroom'],
    status: 'Boarding soon',
    seats: createSeats(36)
  },
  {
    id: 'B300',
    name: 'City E → City F',
    from: 'City E',
    to: 'City F',
    departure: '13:00',
    arrival: '17:20',
    duration: '4h 20m',
    distance: 280,
    baseFare: 28,
    availableSeats: 34,
    totalSeats: 34,
    busType: 'Luxury',
    amenities: ['Panoramic windows', 'Snacks', 'Priority seating'],
    status: 'On time',
    seats: createSeats(34)
  }
];

let currentSeats = [];
let selectedSeats = [];
let currentRouteId = '';

function showStatus(message, type = 'info') {
  if (!statusOutput) return;
  statusOutput.textContent = message;
  statusOutput.className = `status-message ${type}`;
}

function clearStatus() {
  if (!statusOutput) return;
  statusOutput.textContent = '';
  statusOutput.className = 'status-message hidden';
}

function renderSchedule(routesToRender = routes) {
  scheduleList.innerHTML = '';
  if (!routesToRender.length) {
    scheduleList.innerHTML = '<div class="empty-state">No routes match your search. Try a different city or route.</div>';
    return;
  }
  routesToRender.forEach((route) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${route.name}</h3>
      <p><strong>From:</strong> ${route.from}</p>
      <p><strong>To:</strong> ${route.to}</p>
      <p><strong>Departure:</strong> ${route.departure}</p>
      <p><strong>Arrival:</strong> ${route.arrival}</p>
      <p><strong>Distance:</strong> ${route.distance} km</p>
      <p><strong>Base fare:</strong> ₹${route.baseFare} per seat</p>
      <p><strong>Seats:</strong> ${route.availableSeats}/${route.totalSeats} available</p>
      <p><strong>Bus type:</strong> ${route.busType}</p>
      <p><strong>Status:</strong> ${route.status}</p>
      <p><strong>Amenities:</strong> ${route.amenities.join(', ')}</p>
      <div class="button-group">
        <button class="button-small" data-route="${route.id}">View seats</button>
        <button class="button-small" data-estimate="${route.id}">Estimate fare</button>
      </div>
    `;
    scheduleList.appendChild(card);
  });
}

function populateSelects() {
  [routeSelect, bookingRoute, estimateRoute].forEach((select) => {
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a route';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    routes.forEach((route) => {
      const option = document.createElement('option');
      option.value = route.id;
      option.textContent = `${route.name} (${route.from} → ${route.to})`;
      select.appendChild(option);
    });
  });
}

function updateSelectedSeats() {
  selectedSeatsEl.textContent = selectedSeats.length ? selectedSeats.join(', ') : 'None';
}

function renderSeatMap() {
  seatMap.innerHTML = '';
  if (!currentSeats.length) {
    seatMap.innerHTML = '<div class="empty-state">Select a route to view seat availability.</div>';
    return;
  }
  currentSeats.forEach((seat) => {
    const seatEl = document.createElement('button');
    seatEl.type = 'button';
    seatEl.textContent = seat.seatNo;
    seatEl.className = `seat ${seat.booked ? 'booked' : 'available'}`;
    if (!seat.booked) {
      seatEl.addEventListener('click', () => {
        const index = selectedSeats.indexOf(seat.seatNo);
        if (index === -1) {
          selectedSeats.push(seat.seatNo);
          seatEl.classList.add('selected');
        } else {
          selectedSeats.splice(index, 1);
          seatEl.classList.remove('selected');
        }
        updateSelectedSeats();
      });
    }
    seatMap.appendChild(seatEl);
  });
}

function setDefaultRouteValues(routeId) {
  if (!routeId) return;
  [routeSelect, bookingRoute, estimateRoute].forEach((select) => {
    if (select.querySelector(`option[value="${routeId}"]`)) {
      select.value = routeId;
    }
  });
}

function applyRouteFilter(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    renderSchedule();
    return;
  }
  const matches = routes.filter((route) => {
    const text = `${route.id} ${route.name} ${route.from} ${route.to}`.toLowerCase();
    return text.includes(normalized);
  });
  renderSchedule(matches);
}

function loadRoutes() {
  clearStatus();
  renderSchedule();
  populateSelects();
  currentRouteId = routes[0]?.id || '';
  setDefaultRouteValues(currentRouteId);
  if (currentRouteId) {
    loadSeats(currentRouteId);
  }
}

function loadSeats(routeId) {
  if (!routeId) {
    showStatus('Please select a route first.', 'error');
    return;
  }
  clearStatus();
  currentRouteId = routeId;
  const route = routes.find((item) => item.id === routeId);
  if (!route) {
    showStatus('Route not found.', 'error');
    return;
  }
  currentSeats = route.seats;
  selectedSeats = [];
  updateSelectedSeats();
  renderSeatMap();
}

function estimateFare(routeId, passengerCount) {
  if (!routeId) {
    estimateResult.textContent = 'Select a route to estimate fare.';
    return;
  }
  const route = routes.find((item) => item.id === routeId);
  if (!route) {
    estimateResult.textContent = 'Route not found.';
    return;
  }
  const bookedCount = route.seats.filter((seat) => seat.booked).length;
  const loadFactor = bookedCount / route.seats.length;
  const demandFactor = 1 + Math.min(loadFactor, 0.35);
  const estimate = Math.round(route.baseFare * (route.distance / 100) * demandFactor * passengerCount);
  estimateResult.innerHTML = `
    <p><strong>${route.name}</strong></p>
    <p>Seats: ${passengerCount}</p>
    <p><strong>Estimated Fare:</strong> ₹${estimate}</p>
    <p class="muted">AI-style dynamic estimate based on demand and occupancy.</p>
  `;
}

function bookSeats(event) {
  event.preventDefault();
  if (!selectedSeats.length) {
    showStatus('Select at least one seat before booking.', 'error');
    return;
  }
  const routeId = bookingRoute.value;
  const passengerName = passengerNameInput.value.trim();
  if (!routeId || !passengerName) {
    showStatus('Please select a route and enter the passenger name.', 'error');
    return;
  }
  const route = routes.find((item) => item.id === routeId);
  if (!route) {
    showStatus('Selected route is invalid.', 'error');
    return;
  }
  const unavailable = selectedSeats.filter((seatNo) => {
    const seat = route.seats.find((item) => item.seatNo === seatNo);
    return !seat || seat.booked;
  });
  if (unavailable.length) {
    showStatus(`Seat(s) ${unavailable.join(', ')} are already booked.`, 'error');
    return;
  }
  selectedSeats.forEach((seatNo) => {
    const seat = route.seats.find((item) => item.seatNo === seatNo);
    if (seat) seat.booked = true;
  });
  const totalFare = selectedSeats.length * route.baseFare;
  ticketCard.classList.remove('hidden');
  ticketCard.innerHTML = `
    <h3>Ticket Confirmed</h3>
    <p><strong>Ticket ID:</strong> T-${Date.now()}</p>
    <p><strong>Passenger:</strong> ${passengerName}</p>
    <p><strong>Route:</strong> ${route.name}</p>
    <p><strong>Seats:</strong> ${selectedSeats.join(', ')}</p>
    <p><strong>Departure:</strong> ${route.departure}</p>
    <p><strong>Arrival:</strong> ${route.arrival}</p>
    <p><strong>Total Fare:</strong> ₹${totalFare}</p>
  `;
  showStatus('Booking confirmed! Ticket generated below.', 'info');
  loadRoutes();
}

scheduleList.addEventListener('click', (event) => {
  const routeId = event.target.dataset.route;
  const estimateId = event.target.dataset.estimate;
  if (routeId) {
    loadSeats(routeId);
    setDefaultRouteValues(routeId);
  }
  if (estimateId) {
    setDefaultRouteValues(estimateId);
    estimateFare(estimateId, Number(seatCountInput.value));
  }
});

routeSearchInput.addEventListener('input', (event) => {
  applyRouteFilter(event.target.value);
});

routeSelect.addEventListener('change', (event) => {
  if (event.target.value) {
    loadSeats(event.target.value);
    setDefaultRouteValues(event.target.value);
  }
});

bookingRoute.addEventListener('change', (event) => {
  if (event.target.value) {
    loadSeats(event.target.value);
    setDefaultRouteValues(event.target.value);
  }
});

estimateRoute.addEventListener('change', (event) => {
  if (event.target.value) {
    estimateFare(event.target.value, Number(seatCountInput.value));
  }
});

seatCountInput.addEventListener('input', () => {
  if (estimateRoute.value) {
    estimateFare(estimateRoute.value, Number(seatCountInput.value));
  }
});

refreshSeatsButton.addEventListener('click', () => {
  if (routeSelect.value) {
    loadSeats(routeSelect.value);
    showStatus('Seat availability refreshed.', 'info');
  }
});

bookingForm.addEventListener('submit', bookSeats);
estimateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  estimateFare(estimateRoute.value, Number(seatCountInput.value));
});

loadRoutes();
