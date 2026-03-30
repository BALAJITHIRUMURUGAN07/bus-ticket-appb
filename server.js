const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, must-revalidate');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

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
    occupancy: 24,
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
    occupancy: 26,
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
    occupancy: 18,
    busType: 'Luxury',
    amenities: ['Panoramic windows', 'Snacks', 'Priority seating'],
    status: 'On time',
    seats: createSeats(34)
  }
];

function findRoute(routeId) {
  return routes.find((route) => route.id === routeId);
}

function calculateFare(route, passengerCount = 1) {
  const loadFactor = route.seats.filter((seat) => seat.booked).length / route.seats.length;
  const distanceFactor = route.distance / 100;
  const classPremium = 1 + (route.baseFare > 28 ? 0.12 : 0.08);
  const aiAdjustment = 1 + Math.min(loadFactor, 0.35);
  const estimatedFare = Math.round(route.baseFare * distanceFactor * classPremium * aiAdjustment * passengerCount);
  return estimatedFare;
}

app.get('/api/schedule', (req, res) => {
  res.json(routes.map((route) => ({
    id: route.id,
    name: route.name,
    from: route.from,
    to: route.to,
    departure: route.departure,
    arrival: route.arrival,
    duration: route.duration,
    distance: route.distance,
    availableSeats: route.seats.filter((seat) => !seat.booked).length,
    totalSeats: route.seats.length,
    baseFare: route.baseFare,
    busType: route.busType,
    amenities: route.amenities,
    status: route.status
  })));
});

app.get('/api/seats', (req, res) => {
  const { routeId } = req.query;
  const route = findRoute(routeId);
  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.json({
    id: route.id,
    name: route.name,
    seats: route.seats
  });
});

app.get('/api/fare-estimate', (req, res) => {
  const { routeId, passengerCount = 1 } = req.query;
  const route = findRoute(routeId);
  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }
  const fare = calculateFare(route, Number(passengerCount));
  res.json({
    routeId: route.id,
    routeName: route.name,
    passengerCount: Number(passengerCount),
    estimatedFare: fare,
    model: 'AI-based dynamic fare estimator'
  });
});

app.post('/api/book', (req, res) => {
  const { routeId, passengerName, seatNumbers = [] } = req.body;
  const route = findRoute(routeId);
  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }
  if (!passengerName || !seatNumbers.length) {
    return res.status(400).json({ error: 'passengerName and seatNumbers are required' });
  }
  const unavailable = seatNumbers.filter((seatNo) => {
    const seat = route.seats.find((s) => s.seatNo === seatNo);
    return !seat || seat.booked;
  });
  if (unavailable.length) {
    return res.status(409).json({ error: 'Some seats are unavailable', unavailable });
  }
  seatNumbers.forEach((seatNo) => {
    const seat = route.seats.find((s) => s.seatNo === seatNo);
    if (seat) seat.booked = true;
  });
  const ticket = {
    ticketId: `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    routeId: route.id,
    routeName: route.name,
    passengerName,
    seats: seatNumbers,
    departure: route.departure,
    arrival: route.arrival,
    bookedAt: new Date().toISOString(),
    totalFare: calculateFare(route, seatNumbers.length)
  };
  res.json({ message: 'Booking confirmed', ticket });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Bus ticket app running on http://localhost:${PORT}`);
});
