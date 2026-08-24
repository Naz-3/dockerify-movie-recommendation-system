const BASE_URL = 'https://dockerify-movie-recommendation-system-cuj7.onrender.com/api/v1/showcases';
let currentShowcaseId = null;

const defaultCities = [
    "Adana", "Ankara", "Antalya", "Aydın", "Bursa", "Denizli", "Diyarbakır", "Erzurum", 
    "Eskişehir", "Gaziantep", "İstanbul", "İzmir", "Kayseri", "Konya", "Malatya", "Mersin", 
    "Samsun", "Trabzon", "Amsterdam", "Berlin", "Brussels", "London", "Madrid", "Paris", "Rome", "Vienna"
];

document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
        });
    }
    
    document.addEventListener("click", (e) => {
        if (sidebar && sidebar.classList.contains("mobile-open")) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove("mobile-open");
            }
        }
    });
    
    let activeUser = localStorage.getItem("username") || 
                     localStorage.getItem("activeUsername") || 
                     localStorage.getItem("user") || 
                     localStorage.getItem("name") || "Admin";

    const userDisplay = document.getElementById("activeUsernameDisplay");
    if (userDisplay) {
        userDisplay.textContent = activeUser;
    }

    const generateBtn = document.getElementById("generateBtn");
    if (generateBtn) {
        generateBtn.addEventListener("click", () => {
            generateShowcase();
        });
    }

    populateCityList();
});

function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

function getActiveUserId() {
    const userSelect = document.getElementById('userSelect');
    if (userSelect && userSelect.value) return userSelect.value;
    return localStorage.getItem('activeUserId') || '1';
}

function getActiveUserName() {
    const userSelect = document.getElementById('userSelect');
    if (userSelect && userSelect.selectedIndex !== -1 && userSelect.options[userSelect.selectedIndex]) {
        return userSelect.options[userSelect.selectedIndex].text.split(' (')[0];
    }
    return localStorage.getItem('username') || localStorage.getItem('activeUsername') || 'Kullanıcı';
}

function populateCityList() {
    const datalist = document.getElementById('cityList');
    if (datalist) {
        datalist.innerHTML = defaultCities.map(city => `<option value="${city}"></option>`).join('');
    }
}

function parseWeatherData(rawWeatherText) {
    if (!rawWeatherText) return { icon: '🌤️', text: 'Bilinmiyor', temp: '--', humidity: '--' };
    const parts = rawWeatherText.split('|').map(s => s.trim());
    const mainCondition = parts[0] || 'Clear';
    const temp = parts[1] || '';
    const humidity = parts[2] || '';

    const conditionMap = {
        'Clear': { text: 'Açık', icon: '☀️' },
        'Clouds': { text: 'Bulutlu', icon: '☁️' },
        'Rain': { text: 'Yağmurlu', icon: '🌧️' },
        'Snow': { text: 'Kar Yağışlı', icon: '❄️' },
        'Thunderstorm': { text: 'Fırtınalı', icon: '⛈️' },
        'Drizzle': { text: 'Çiseleyen', icon: '🌦️' }
    };

    const matched = conditionMap[mainCondition] || { text: mainCondition, icon: '🌤️' };
    return { icon: matched.icon, text: matched.text, temp, humidity };
}

async function generateShowcase() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput ? cityInput.value.trim() : '';
    const userId = getActiveUserId();
    const selectedUserName = getActiveUserName();

    if (!city) {
        alert('Lütfen bir şehir adı giriniz!');
        return;
    }

    if (!userId) {
        alert('Aktif kullanıcı ID bulunamadı.');
        return;
    }

    const loading = document.getElementById('loading');
    const previewCard = document.getElementById('previewCard');

    if (loading) loading.classList.remove('hidden');
    if (previewCard) previewCard.classList.add('hidden');

    try {
        const targetUrl = `${BASE_URL}/suggest?userId=${encodeURIComponent(userId)}&city=${encodeURIComponent(city)}`;
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (res.status === 401 || res.status === 403) {
            logout();
            return;
        }

        if (!res.ok) {
            throw new Error(`Sunucu hatası: ${res.status}`);
        }

        const data = await res.json();
        currentShowcaseId = data.showcaseId;

        const rawTrigger = data.triggerReason || '';
        const weatherString = rawTrigger.replace('AI Direktör Önerisi - ', '');
        const weatherInfo = parseWeatherData(weatherString);

        const showcaseTitle = document.getElementById('showcaseTitle');
        if (showcaseTitle) showcaseTitle.innerText = data.title || 'Haftanın Öne Çıkanları';
        
        const triggerReasonElement = document.getElementById('triggerReason');
        if (triggerReasonElement) {
            triggerReasonElement.innerHTML = `
                <div class="weather-card-inline">
                    <span class="user-badge">👤 ${selectedUserName} Profiline Özel</span>
                    <span class="divider">|</span>
                    <span class="city-badge">📍 <strong>${city}</strong></span>
                    <span class="weather-icon">${weatherInfo.icon}</span>
                    <span class="weather-detail"><strong>${weatherInfo.text}</strong></span>
                    ${weatherInfo.temp ? `<span class="temp-badge">${weatherInfo.temp}</span>` : ''}
                    ${weatherInfo.humidity ? `<span class="humidity-badge">💧 ${weatherInfo.humidity}</span>` : ''}
                </div>
            `;
        }

        const movieGrid = document.getElementById('movieGrid');
        if (movieGrid) {
            movieGrid.innerHTML = '';
            const movieItems = data.movieTitles || data.contents || data.movies || [];

            if (Array.isArray(movieItems) && movieItems.length > 0) {
                movieItems.forEach((movie, index) => {
                    const title = typeof movie === 'string' ? movie : (movie.title || movie.name || 'İsimsiz İçerik');
                    const rating = movie.rating || '8.4';
                    const genre = movie.genre || 'Fantastik / Macera';
                    const duration = movie.durationInMinutes || movie.duration || '135';

                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    card.innerHTML = `
                        <div class="movie-card-content">
                            <div>
                                <div class="movie-header">
                                    <span class="movie-number">#${index + 1} Öneri</span>
                                    <span class="movie-rating">⭐ ${rating}</span>
                                </div>
                                <div class="movie-title">${title}</div>
                                <div class="movie-meta">
                                    <span>🎭 ${genre}</span>
                                    <span>⏱️ ${duration} dk</span>
                                </div>
                            </div>
                            
                            <div class="movie-tag-wrapper">
                                <span class="movie-tag">🎯 AI Analiz Özeti</span>
                                <ul class="tooltip-list">
                                    <li>👤 <strong>Kullanıcı:</strong> ${selectedUserName} geçmişine uygun.</li>
                                    <li>🌤️ <strong>Ortam:</strong> ${city} (${weatherInfo.text}, ${weatherInfo.temp}) için ideal.</li>
                                </ul>
                            </div>
                        </div>
                    `;
                    movieGrid.appendChild(card);
                });
            } else {
                movieGrid.innerHTML = '<p class="no-content-alert">⚠️ Bu kriterlere uygun vitrin içeriği bulunamadı.</p>';
            }
        }

        if (previewCard) previewCard.classList.remove('hidden');

    } catch (error) {
        console.error("Showcase parsing error:", error);
        alert(`Vitrin oluşturulurken bir hata meydana geldi: ${error.message}`);
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

async function approveShowcase() {
    if (!currentShowcaseId) {
        alert('Onaylanacak bir vitrin bulunamadı!');
        return;
    }

    try {
        const response =- await fetch(`${BASE_URL}/${currentShowcaseId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            alert("Oturum süreniz doldu veya yetkiniz yok.");
            return;
        }

        if (response.ok) {
            alert('🎉 Vitrin başarıyla onaylandı ve yayına alındı!');
            const previewCard = document.getElementById('previewCard');
            if (previewCard) previewCard.classList.add('hidden');
        } else {
            alert('Onaylama işlemi sırasında bir hata oluştu.');
        }
    } catch (error) {
        alert('Sunucuya bağlanılamadı!');
    }
}