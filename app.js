/* WeatherWise — live weather dashboard
   API: Open-Meteo forecast + geocoding (no API key required).
*/
const $ = (selector) => document.querySelector(selector);
const form = $('#search-form');
const input = $('#city-input');
const errorMsg = $('#error-msg');
const loader = $('#loader');
const unitToggle = $('#unit-toggle');
const forecastGrid = $('#forecast-grid');

const DEFAULT_CITIES = [
  { id: 'card-nashik', name: 'Nashik', country: 'Maharashtra, India', lat: 19.9975, lon: 73.7898 },
  { id: 'card-pune', name: 'Pune', country: 'Maharashtra, India', lat: 18.5204, lon: 73.8567 },
];

const WEATHER_CODES = {
  0: { desc: 'Clear sky', icon: '☀️', summary: 'Clear skies overhead. A beautiful moment to get outside.' },
  1: { desc: 'Mainly clear', icon: '🌤️', summary: 'Mostly clear skies, with just a little cloud in the distance.' },
  2: { desc: 'Partly cloudy', icon: '⛅', summary: 'A mix of sunshine and passing clouds across the sky.' },
  3: { desc: 'Overcast', icon: '☁️', summary: 'Cloud cover stretches across the sky today.' },
  45: { desc: 'Fog', icon: '🌫️', summary: 'Mist and fog may reduce visibility. Take care on the road.' },
  48: { desc: 'Rime fog', icon: '🌫️', summary: 'Foggy conditions are lingering. Allow a little extra travel time.' },
  51: { desc: 'Light drizzle', icon: '🌦️', summary: 'Light drizzle in the air. A light layer may come in handy.' },
  53: { desc: 'Drizzle', icon: '🌦️', summary: 'A little drizzle is in the forecast. Keep an eye on the sky.' },
  55: { desc: 'Dense drizzle', icon: '🌧️', summary: 'Persistent drizzle outside. Consider carrying an umbrella.' },
  61: { desc: 'Slight rain', icon: '🌧️', summary: 'Light rain nearby. A good time to keep your umbrella close.' },
  63: { desc: 'Moderate rain', icon: '🌧️', summary: 'Steady rain is around. Plan a little extra time for your journey.' },
  65: { desc: 'Heavy rain', icon: '🌧️', summary: 'Heavy rain conditions. Stay alert and travel carefully.' },
  71: { desc: 'Slight snow', icon: '🌨️', summary: 'Light snow is reported in the area.' },
  73: { desc: 'Moderate snow', icon: '🌨️', summary: 'Snowy conditions are in the forecast. Dress warmly.' },
  75: { desc: 'Heavy snow', icon: '❄️', summary: 'Heavy snow may affect travel. Check local advisories.' },
  80: { desc: 'Rain showers', icon: '🌦️', summary: 'Showers may come and go. Keep an umbrella nearby.' },
  81: { desc: 'Heavy showers', icon: '🌧️', summary: 'Heavier showers are possible. Plan your outdoor time carefully.' },
  82: { desc: 'Violent showers', icon: '⛈️', summary: 'Intense showers are reported. Take care and seek shelter if needed.' },
  95: { desc: 'Thunderstorm', icon: '⛈️', summary: 'Thunderstorms are possible. Head indoors if thunder approaches.' },
  96: { desc: 'Thunderstorm + hail', icon: '⛈️', summary: 'Stormy conditions with possible hail. Stay somewhere sheltered.' },
  99: { desc: 'Severe thunderstorm', icon: '⛈️', summary: 'Severe thunderstorm conditions are reported. Follow local weather guidance.' },
};

const state = {
  unit: 'C',
  selectedPlace: null,
  selectedWeather: null,
  defaults: {},
  requestId: 0,
};

function weatherInfo(code) {
  return WEATHER_CODES[code] || { desc: 'Conditions unavailable', icon: '🌡️', summary: 'Current conditions are available, but the description is not yet mapped.' };
}

function displayTemp(celsius) {
  const number = state.unit === 'F' ? (celsius * 9 / 5) + 32 : celsius;
  return Math.round(number);
}

function dateLabel(dateString, options) {
  // API dates are local calendar dates. Using noon avoids timezone day shifts.
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString(undefined, options);
}

function setLoader(visible) {
  loader.classList.toggle('hidden', !visible);
}

function showError(message = '') {
  errorMsg.textContent = message;
}

function validateCity(city) {
  if (!city || city.trim().length < 2) return 'Enter a city name with at least 2 characters.';
  if (!/^[\p{L}\p{M}\s.'’-]+$/u.test(city.trim())) return 'Use a city name with letters, spaces, apostrophes or hyphens.';
  return null;
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('The location service is unavailable. Please try again.');
  const data = await response.json();
  if (!data.results?.length) throw new Error(`We couldn't find “${city}”. Try another city name.`);
  return data.results[0];
}

async function fetchWeather(latitude, longitude, days = 5) {
  const url = 'https://api.open-meteo.com/v1/forecast?' +
    new URLSearchParams({
      latitude, longitude,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: days,
    });
  const response = await fetch(url);
  if (!response.ok) throw new Error('The weather service is temporarily unavailable. Please try again.');
  return response.json();
}

function setTodayDate() {
  $('#current-date').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function renderCurrent(place, weather) {
  const current = weather.current;
  const info = weatherInfo(current.weather_code);
  const daily = weather.daily;
  state.selectedPlace = place;
  state.selectedWeather = weather;

  $('#city-name').textContent = place.name;
  $('#top-location').textContent = [place.name, place.admin1, place.country].filter(Boolean).join(', ');
  $('#hero-country').textContent = (place.country || 'LOCAL FORECAST').toUpperCase();
  $('#current-temp').textContent = displayTemp(current.temperature_2m);
  $('#current-desc').textContent = info.desc;
  $('#weather-symbol').textContent = info.icon;
  $('#hero-summary').textContent = info.summary;
  $('#today-high').textContent = displayTemp(daily.temperature_2m_max[0]) + '°';
  $('#today-low').textContent = displayTemp(daily.temperature_2m_min[0]) + '°';
  $('#humidity-value').textContent = Math.round(current.relative_humidity_2m);
  $('#humidity-bar').style.width = Math.max(0, Math.min(100, current.relative_humidity_2m)) + '%';
  $('#humidity-note').textContent = current.relative_humidity_2m >= 70
    ? 'High moisture in the air' : current.relative_humidity_2m <= 35
      ? 'Drier air right now' : 'Relative humidity';
  $('#wind-value').textContent = Math.round(current.wind_speed_10m);
  $('#wind-note').textContent = current.wind_speed_10m >= 25 ? 'Breezy — take care outside' : 'Current wind conditions';
  $('#condition-value').textContent = info.desc;
  $('#condition-note').textContent = 'Current local conditions';
  $('#insight-label').textContent = 'Current outlook';
  $('#insight-value').textContent = info.desc;
  $('#hero-feels').textContent = 'LIVE';
  renderForecast(weather);
  document.querySelectorAll('.place-link').forEach((button) => {
    button.classList.toggle('active', button.dataset.city.toLowerCase() === place.name.toLowerCase());
  });
}

function renderForecast(weather) {
  forecastGrid.innerHTML = '';
  const daily = weather.daily;
  daily.time.slice(0, 5).forEach((day, index) => {
    const info = weatherInfo(daily.weather_code[index]);
    const label = index === 0 ? 'Today' : dateLabel(day, { weekday: 'short' });
    const card = document.createElement('article');
    card.className = 'forecast-day' + (index === 0 ? ' today' : '');
    card.innerHTML = `
      <p class="day-name">${label}</p>
      <div class="day-icon" aria-hidden="true">${info.icon}</div>
      <p class="day-condition">${info.desc}</p>
      <div class="forecast-temperatures"><span>${displayTemp(daily.temperature_2m_max[index])}°</span><span class="low">${displayTemp(daily.temperature_2m_min[index])}°</span></div>
    `;
    forecastGrid.appendChild(card);
  });
}

function renderDefaultCard(city, weather) {
  const card = document.getElementById(city.id);
  if (!card) return;
  state.defaults[city.name] = { city, weather };
  const current = weather.current;
  const daily = weather.daily;
  const info = weatherInfo(current.weather_code);
  card.querySelector('.temp').textContent = displayTemp(current.temperature_2m) + '°';
  card.querySelector('.desc').textContent = info.desc;
  const snapshotIcon = card.querySelector('.snapshot-icon');
  if (snapshotIcon) snapshotIcon.textContent = info.icon;

  const strip = card.querySelector('.mini-forecast');
  strip.replaceChildren();
  daily.time.slice(0, 5).forEach((day, index) => {
    const dayInfo = weatherInfo(daily.weather_code[index]);
    const label = index === 0 ? 'Today' : dateLabel(day, { weekday: 'short' });
    const element = document.createElement('div');
    element.className = 'mini';
    element.innerHTML = `
      <span>${label}</span>
      <span class="mini-icon" aria-hidden="true">${dayInfo.icon}</span>
      <span class="hi">${displayTemp(daily.temperature_2m_max[index])}°</span>
      <span class="lo">${displayTemp(daily.temperature_2m_min[index])}°</span>
    `;
    strip.appendChild(element);
  });
}

async function loadDefaultCities() {
  await Promise.all(DEFAULT_CITIES.map(async (city) => {
    try {
      const weather = await fetchWeather(city.lat, city.lon, 5);
      renderDefaultCard(city, weather);
    } catch (error) {
      console.error('Could not load weather for ' + city.name, error);
      const card = document.getElementById(city.id);
      if (card) card.querySelector('.desc').textContent = 'Unavailable';
    }
  }));
}

async function searchCity(city) {
  const validation = validateCity(city);
  if (validation) { showError(validation); return; }
  const requestId = ++state.requestId;
  showError();
  setLoader(true);
  try {
    const place = await geocodeCity(city);
    const weather = await fetchWeather(place.latitude, place.longitude, 5);
    if (requestId !== state.requestId) return;
    renderCurrent(place, weather);
    localStorage.setItem('weatherwise-last-city', place.name);
    input.value = place.name;
  } catch (error) {
    if (requestId === state.requestId) showError(error.message || 'Unable to load this city right now.');
    console.error(error);
  } finally {
    if (requestId === state.requestId) setLoader(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  searchCity(input.value.trim());
});

document.querySelectorAll('.place-link').forEach((button) => {
  button.addEventListener('click', () => searchCity(button.dataset.city));
});

unitToggle.addEventListener('click', () => {
  state.unit = state.unit === 'C' ? 'F' : 'C';
  unitToggle.innerHTML = state.unit === 'C' ? '°C <span>/</span> °F' : '°F <span>/</span> °C';
  unitToggle.setAttribute('aria-label', state.unit === 'C' ? 'Switch temperature unit to Fahrenheit' : 'Switch temperature unit to Celsius');
  if (state.selectedPlace && state.selectedWeather) renderCurrent(state.selectedPlace, state.selectedWeather);
  Object.values(state.defaults).forEach(({ city, weather }) => renderDefaultCard(city, weather));
});

setTodayDate();
loadDefaultCities().then(() => {
  let lastCity = '';
  try { lastCity = localStorage.getItem('weatherwise-last-city') || ''; } catch (_) { /* storage may be unavailable */ }
  const initialCity = lastCity || 'Nashik';
  input.value = initialCity;
  searchCity(initialCity);
});
