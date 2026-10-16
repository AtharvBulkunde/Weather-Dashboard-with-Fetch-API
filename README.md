# WeatherWise — Live Weather Dashboard

A responsive weather dashboard redesigned with a cinematic, dark glassmorphism aesthetic. It uses plain HTML, CSS and JavaScript, so there's no build step or API key to configure.

## Features

- Live current conditions, humidity and wind speed.
- Five-day high/low forecast with condition icons.
- Quick regional snapshots for Nashik and Pune.
- Search for cities worldwide using Open-Meteo geocoding.
- Celsius / Fahrenheit toggle.
- Remembers the last searched city when browser storage is available.
- Responsive layout for desktop, tablet and mobile.
- Loading state, empty/error feedback and accessible labels.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a browser, or serve this folder with a simple local server.
3. Search for a city or use the quick location buttons.

Weather data is fetched from the Open-Meteo Forecast API and its Geocoding API. The hero weather photograph loads from Unsplash and requires an internet connection.

## Project files

- `index.html` — semantic page structure.
- `style.css` — glass panels, visual system, responsive layouts and animations.
- `app.js` — API requests, weather rendering, search, quick locations and unit conversion.

## Data and privacy

No weather API key is required. Your last searched city is stored only in this browser using local storage. No custom backend is needed for this frontend-only version.
