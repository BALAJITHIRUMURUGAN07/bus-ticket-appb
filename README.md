# Bus Ticket Booking App

A simple bus ticket booking web application with:
- seat booking
- live schedule display
- seat availability and seat map
- ticket generation after booking
- AI-based fare estimator

## Run locally

1. Open a terminal in this folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser.

## Features

- `GET /api/schedule` - list all bus routes and live capacity
- `GET /api/seats?routeId=...` - load seat layout and availability
- `GET /api/fare-estimate?routeId=...&passengerCount=...` - AI-style fare estimate
- `POST /api/book` - book seats and receive ticket details

## Notes

This app uses an in-memory route data model, so bookings reset when the server restarts. It is a good starting point for adding persistence and real backend logic.
