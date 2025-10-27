const apiKey = "047b0776a2054b763a68d63566beab61";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
// NEW: API endpoint for 5-day forecast [Req 41]
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

// Existing selectors
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");

// NEW: Selectors for new elements
const forecastCardsContainer = document.querySelector(".forecast-cards");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// Helper function to show/hide sections and display errors
function showError(message) {
    document.querySelector(".error p").innerHTML = message;
    document.querySelector(".error").style.display = "block";
    document.querySelector(".weather").style.display = "none";
    document.querySelector(".forecast-container").style.display = "none"; // Hide forecast on error
}

function showWeather() {
    document.querySelector(".error").style.display = "none";
    document.querySelector(".weather").style.display = "block";
    document.querySelector(".forecast-container").style.display = "block"; // Show forecast on success
}

// Helper function to get weather icon path
function getWeatherIconPath(weatherMain) {
    if (weatherMain == "Clouds") {
        return "images/clouds.png";
    } else if (weatherMain == "Clear") {
        return "images/clear.png";
    } else if (weatherMain == "Rain") {
        return "images/rain.png";
    } else if (weatherMain == "Drizzle") {
        return "images/drizzle.png";
    } else if (weatherMain == "Mist") {
        return "images/mist.png";
    } else {
        // Default icon if condition is not matched (e.g., Snow, Haze)
        return "images/clear.png"; 
    }
}

// Function to display the current weather data
function displayCurrentWeather(data) {
    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
    weatherIcon.src = getWeatherIconPath(data.weather[0].main);
}

// NEW: Function to display the 5-day forecast [Req 41, 43, 46]
function displayForecast(data) {
    forecastCardsContainer.innerHTML = ""; // Clear previous forecast

    // The API returns data every 3 hours. We filter to get one forecast per day.
    // We'll pick the forecast closest to noon (12:00:00) for each day.
    const dailyForecasts = data.list.filter(item => {
        return item.dt_txt.includes("12:00:00");
    });

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: 'short' });

        const card = document.createElement("div");
        card.classList.add("forecast-card");

        card.innerHTML = `
            <p class="forecast-date">${dayName}</p>
            <img src="${getWeatherIconPath(day.weather[0].main)}" alt="Weather Icon">
            <p class="forecast-temp">${Math.round(day.main.temp)}°c</p>
            <p class="forecast-humidity">${day.main.humidity}%</p>
        `;
        forecastCardsContainer.appendChild(card);
    });
}

// --- NEW: Local Storage Functions ---

// [Req 55]
function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
    
    // Prevent duplicates (case-insensitive)
    const normalizedCity = city.toLowerCase();
    history = history.filter(item => item.toLowerCase() !== normalizedCity);

    // Add new city to the beginning of the array
    history.unshift(city);
    
    // Keep history list to a reasonable size (e.g., 10 items)
    if (history.length > 3) {
        history.pop();
    }

    localStorage.setItem("weatherHistory", JSON.stringify(history));
    displayHistory();
}

// [Req 57]
function displayHistory() {
    historyList.innerHTML = ""; // Clear current list
    let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

    history.forEach(city => {
        const li = document.createElement("li");
        li.textContent = city;
        // [Req 58] Add click event to search for this city again
        li.addEventListener("click", () => {
            searchBox.value = city; // Optional: put city back in search box
            checkWeather(city);
        });
        historyList.appendChild(li);
    });
}

// [Req 61]
function clearHistory() {
    localStorage.removeItem("weatherHistory");
    displayHistory(); // Re-render the (now empty) list
}

// --- Main Weather Function ---

async function checkWeather(city) {
    
    // [Req 52] Prevent blank searches
    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    try {
        // Fetch both current weather and forecast data concurrently
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(apiUrl + city + `&appid=${apiKey}`),
            fetch(forecastApiUrl + city + `&appid=${apiKey}`)
        ]);

        // [Req 51] Check if *either* request failed (e.g., 404 Not Found)
        if (!currentResponse.ok || !forecastResponse.ok) {
            showError("City not found. Please try again.");
            return;
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        // --- Success ---
        
        // 1. Display data
        displayCurrentWeather(currentData); // [Req 40]
        displayForecast(forecastData);     // [Req 41]
        
        // 2. Show weather sections
        showWeather();

        // 3. Save to history (use name from API for correct capitalization)
        saveToHistory(currentData.name);

    } catch (error) {
        console.error("Fetch error:", error);
        showError("An error occurred. Please check your connection.");
    }
}

// --- Event Listeners ---

// Search button click
searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value.trim()); // .trim() removes whitespace
});

// Allow pressing "Enter" in the search box
searchBox.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        checkWeather(searchBox.value.trim());
    }
});

// Clear history button click
clearHistoryBtn.addEventListener("click", clearHistory);

// Load history from local storage on page load
document.addEventListener("DOMContentLoaded", displayHistory);

// (The extra '}' from your original file has been removed) 