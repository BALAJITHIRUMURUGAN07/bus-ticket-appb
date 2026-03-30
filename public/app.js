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

let routes = [];
let currentSeats = [];
let selectedSeats = [];
let currentRouteId = '';

function createFallbackSeats(count = 32) {
  return Array.from({ length: count }, (_, index) => ({
    seatNo: `${index + 1}`,
    booked: false,
    class: index < 4 ? 'Premium' : 'Standard'
  }));
}

const fallbackRoutes = [
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
    seats: createFallbackSeats(32)
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
    seats: createFallbackSeats(36)
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
    seats: createFallbackSeats(34)
  }
];

async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
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
      <p><strong>Seats:</strong> ${route.availableSeats}/${route.totalSeats} available</p>
      <p><strong>Bus type:</strong> ${route.busType || 'Standard'}</p>
      <p><strong>Status:</strong> ${route.status || 'On time'}</p>
      <p><strong>Amenities:</strong> ${route.amenities?.join(', ') || 'Standard amenities'}</p>
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
  if (!routeId) {
    return;
  }
  if (routeSelect.querySelector(`option[value="${routeId}"]`)) {
    routeSelect.value = routeId;
  }
  if (bookingRoute.querySelector(`option[value="${routeId}"]`)) {
    bookingRoute.value = routeId;
  }
  if (estimateRoute.querySelector(`option[value="${routeId}"]`)) {
    estimateRoute.value = routeId;
  }
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

async function loadRoutes() {
  const data = await fetchJSON('/api/schedule');
  if (!data) {
    routes = fallbackRoutes;
    renderSchedule(routes);
    populateSelects();
    currentRouteId = routes[0]?.id || '';
    setDefaultRouteValues(currentRouteId);
    if (currentRouteId) {
      loadSeats(currentRouteId);
    }
    return;
  }
  routes = data;
  renderSchedule();
  populateSelects();
  currentRouteId = routes[0]?.id || '';
  setDefaultRouteValues(currentRouteId);
  if (currentRouteId) {
    loadSeats(currentRouteId);
  }
}

async function loadSeats(routeId) {
  if (!routeId) {
    seatMap.innerHTML = '<div class="empty-state">Please select a route to view seats.</div>';
    return;
  }
  currentRouteId = routeId;
  const localRoute = routes.find((route) => route.id === routeId && Array.isArray(route.seats));
  if (localRoute) {
    currentSeats = localRoute.seats;
    selectedSeats = [];
    updateSelectedSeats();
    renderSeatMap();
    return;
  }
  const data = await fetchJSON(`/api/seats?routeId=${routeId}`);
  if (!data || !Array.isArray(data.seats)) {
    seatMap.innerHTML = '<div class="empty-state">Unable to load seat availability. Try again later.</div>';
    return;
  }
  currentSeats = data.seats;
  selectedSeats = [];
  updateSelectedSeats();
  renderSeatMap();
}

async function estimateFare(routeId, passengerCount) {
  if (!routeId) {
    estimateResult.textContent = 'Select a route to estimate fare.';
    return;
  }
  const data = await fetchJSON(`/api/fare-estimate?routeId=${routeId}&passengerCount=${passengerCount}`);
  if (!data || data.error) {
    estimateResult.textContent = data?.error || 'Unable to estimate fare at the moment.';
    return;
  }
  estimateResult.innerHTML = `
    <p><strong>${data.routeName}</strong></p>
    <p>Seats: ${data.passengerCount}</p>
    <p><strong>Estimated Fare:</strong> $${data.estimatedFare}</p>
    <p class="muted">AI-based demand and occupancy model applied</p>
  `;
}

async function bookSeats(event) {
  event.preventDefault();
  if (!selectedSeats.length) {
    alert('Select one or more available seats first.');
    return;
  }
  const payload = {
    routeId: bookingRoute.value,
    passengerName: passengerNameInput.value.trim(),
    seatNumbers: selectedSeats
  };
  if (!payload.passengerName) {
    alert('Please enter passenger name.');
    return;
  }
  const response = await fetch('/api/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || 'Booking failed.');
    return;
  }
  ticketCard.classList.remove('hidden');
  ticketCard.innerHTML = `
    <h3>Ticket Confirmed</h3>
    <p><strong>Ticket ID:</strong> ${data.ticket.ticketId}</p>
    <p><strong>Passenger:</strong> ${data.ticket.passengerName}</p>
    <p><strong>Route:</strong> ${data.ticket.routeName}</p>
    <p><strong>Seats:</strong> ${data.ticket.seats.join(', ')}</p>
    <p><strong>Departure:</strong> ${data.ticket.departure}</p>
    <p><strong>Arrival:</strong> ${data.ticket.arrival}</p>
    <p><strong>Total Fare:</strong> $${data.ticket.totalFare}</p>
  `;
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
  }
});

bookingForm.addEventListener('submit', bookSeats);
estimateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  estimateFare(estimateRoute.value, Number(seatCountInput.value));
});

loadRoutes();
