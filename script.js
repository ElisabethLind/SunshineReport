// ORF Wetter App - JavaScript

// API Endpoints
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const suggestionsList = document.getElementById('suggestions');
const weatherDisplay = document.getElementById('weather-display');
const errorDisplay = document.getElementById('error-display');
const errorMessage = document.getElementById('error-message');
const loadingDisplay = document.getElementById('loading');

// Weather code to description and icon mapping
const weatherCodes = {
    0: { description: 'Klar', icon: '☀️' },
    1: { description: 'Überwiegend klar', icon: '🌤️' },
    2: { description: 'Teilweise bewölkt', icon: '⛅' },
    3: { description: 'Bewölkt', icon: '☁️' },
    45: { description: 'Nebel', icon: '🌫️' },
    48: { description: 'Reifnebel', icon: '🌫️' },
    51: { description: 'Leichter Nieselregen', icon: '🌦️' },
    53: { description: 'Nieselregen', icon: '🌦️' },
    55: { description: 'Starker Nieselregen', icon: '🌧️' },
    56: { description: 'Gefrierender Nieselregen', icon: '🌧️' },
    57: { description: 'Starker gefrierender Nieselregen', icon: '🌧️' },
    61: { description: 'Leichter Regen', icon: '🌧️' },
    63: { description: 'Regen', icon: '🌧️' },
    65: { description: 'Starker Regen', icon: '🌧️' },
    66: { description: 'Gefrierender Regen', icon: '🌧️' },
    67: { description: 'Starker gefrierender Regen', icon: '🌧️' },
    71: { description: 'Leichter Schneefall', icon: '🌨️' },
    73: { description: 'Schneefall', icon: '🌨️' },
    75: { description: 'Starker Schneefall', icon: '❄️' },
    77: { description: 'Schneekörner', icon: '🌨️' },
    80: { description: 'Leichte Regenschauer', icon: '🌦️' },
    81: { description: 'Regenschauer', icon: '🌧️' },
    82: { description: 'Starke Regenschauer', icon: '⛈️' },
    85: { description: 'Leichte Schneeschauer', icon: '🌨️' },
    86: { description: 'Starke Schneeschauer', icon: '❄️' },
    95: { description: 'Gewitter', icon: '⛈️' },
    96: { description: 'Gewitter mit leichtem Hagel', icon: '⛈️' },
    99: { description: 'Gewitter mit Hagel', icon: '⛈️' }
};

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show/hide functions
function showLoading() {
    loadingDisplay.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    errorDisplay.classList.add('hidden');
}

function hideLoading() {
    loadingDisplay.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    errorMessage.textContent = message;
    errorDisplay.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
}

function showWeather() {
    hideLoading();
    errorDisplay.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');
}

// Search for locations
async function searchLocations(query) {
    if (query.length < 2) {
        suggestionsList.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(
            `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=5&language=de&format=json`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            displaySuggestions(data.results);
        } else {
            suggestionsList.innerHTML = '';
        }
    } catch (error) {
        console.error('Fehler bei der Ortssuche:', error);
        suggestionsList.innerHTML = '';
    }
}

// Display location suggestions
function displaySuggestions(locations) {
    suggestionsList.innerHTML = locations.map(location => {
        const country = location.country || '';
        const admin1 = location.admin1 || '';
        const subText = [admin1, country].filter(Boolean).join(', ');
        
        return `
            <li class="suggestion-item" 
                data-lat="${location.latitude}" 
                data-lon="${location.longitude}"
                data-name="${location.name}"
                data-country="${country}"
                data-admin="${admin1}">
                <div class="location-main">${location.name}</div>
                <div class="location-sub">${subText}</div>
            </li>
        `;
    }).join('');

    // Add click handlers to suggestions
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = item.dataset.lat;
            const lon = item.dataset.lon;
            const name = item.dataset.name;
            const admin = item.dataset.admin;
            const country = item.dataset.country;
            
            locationInput.value = name;
            suggestionsList.innerHTML = '';
            
            fetchWeather(lat, lon, name, admin, country);
        });
    });
}

// Fetch weather data
async function fetchWeather(lat, lon, locationName, admin, country) {
    showLoading();

    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m',
            timezone: 'auto'
        });

        const response = await fetch(`${WEATHER_API}?${params}`);
        const data = await response.json();

        if (data.current) {
            displayWeather(data, locationName, admin, country);
        } else {
            showError('Keine Wetterdaten verfügbar.');
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Wetterdaten:', error);
        showError('Fehler beim Laden der Wetterdaten. Bitte versuchen Sie es erneut.');
    }
}

// Display weather data
function displayWeather(data, locationName, admin, country) {
    const current = data.current;
    const weatherCode = current.weather_code;
    const weatherInfo = weatherCodes[weatherCode] || { description: 'Unbekannt', icon: '❓' };

    // Update location name
    const locationParts = [locationName, admin, country].filter(Boolean);
    const displayLocation = locationParts.slice(0, 2).join(', ');
    document.getElementById('location-name').textContent = displayLocation;

    // Update date
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('weather-date').textContent = now.toLocaleDateString('de-AT', options);

    // Update weather icon and description
    document.getElementById('weather-icon').textContent = weatherInfo.icon;
    document.getElementById('weather-description').textContent = weatherInfo.description;

    // Update temperature
    document.getElementById('temperature').textContent = Math.round(current.temperature_2m);

    // Update details
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('cloud-cover').textContent = `${current.cloud_cover}%`;

    showWeather();
}

// Handle search button click
function handleSearch() {
    const query = locationInput.value.trim();
    if (query.length >= 2) {
        searchLocations(query);
    }
}

// Event Listeners
locationInput.addEventListener('input', debounce((e) => {
    searchLocations(e.target.value.trim());
}, 300));

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

searchBtn.addEventListener('click', handleSearch);

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        suggestionsList.innerHTML = '';
    }
});

// Load Wien as default on page load (optional)
window.addEventListener('load', () => {
    // Optional: Load default location
    // fetchWeather(48.2082, 16.3738, 'Wien', 'Wien', 'Österreich');
});



