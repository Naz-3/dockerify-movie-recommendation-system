const BASE_URL = 'https://dockerify-movie-recommendation-system.onrender.com/api/v1/showcases';
const USERS_URL = 'https://dockerify-movie-recommendation-system.onrender.com/api/users';
let currentShowcaseId = null;

// Popüler Türkiye & Dünya Şehirleri Listesi
const defaultCities = [
    // Türkiye (Öne Çıkanlar & İller)
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta",
    "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
    "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
    "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat",
    "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın",
    "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce",
    // Popüler Dünya Şehirleri
    "Amsterdam", "Athens", "Baku", "Berlin", "Brussels", "Budapest", "Cairo", "Chicago", 
    "Dubai", "Frankfurt", "Geneva", "Helsinki", "Kyiv", "London", "Los Angeles", "Madrid", 
    "Milan", "Moscow", "Munich", "New York", "Oslo", "Paris", "Prague", "Rome", "Seoul", 
    "Stockholm", "Tbilisi", "Tokyo", "Vienna", "Warsaw", "Washington", "Zurich"
];

document.addEventListener("DOMContentLoaded", () => {
    //mobil menu
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-open");
        });
    }
    // Sayfa dışı tıklamada mobil sidebar'ı kapat
    document.addEventListener("click", (e) => {
        if (sidebar && sidebar.classList.contains("mobile-open")) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove("mobile-open");
            }
        }
    });
    
    // 1. LocalStorage'dan giriş yapan kullanıcının adını al
    const activeUser = localStorage.getItem("username") || "Kullanıcı"; 

    // 2. Ekrandaki etikete doğrudan kullanıcı adını yazdır
    const userDisplay = document.getElementById("activeUsernameDisplay");
    if (userDisplay) {
        userDisplay.textContent = activeUser;
    }

    // 3. AI Vitrin İsteği Atılırken generateShowcase fonksiyonunu çağır
    const generateBtn = document.getElementById("generateBtn");
    if (generateBtn) {
        generateBtn.addEventListener("click", () => {
            generateShowcase();
        });
    }

    // Şehir Datalist'ini Doldur (Varsa)
    populateCityList();
});

// JWT Token alma yardımcı fonksiyonu
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// Oturum Koruma (Auth Guard) - Token yoksa login sayfasına yönlendirir
function checkAuthGuard() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "login.html";
    }
}

// Oturum durumunu ve arayüzü kontrol eden fonksiyon
function checkAuthStatus() {
    const activeUsername = localStorage.getItem("username") || localStorage.getItem("activeUsername");

    const loginNavBtn = document.getElementById("loginNavBtn");
    const userProfileBar = document.getElementById("userProfileBar");
    const welcomeUserText = document.getElementById("welcomeUserText");

    if (activeUsername) {
        if (loginNavBtn) loginNavBtn.style.display = "none";
        if (userProfileBar) userProfileBar.style.display = "flex";
        if (welcomeUserText) welcomeUserText.textContent = `👤 ${activeUsername}`;
    } else {
        if (loginNavBtn) loginNavBtn.style.display = "inline-block";
        if (userProfileBar) userProfileBar.style.display = "none";
    }
}

// Oturumu kapatıp login sayfasına yönlendiren fonksiyon
function logout() {
    localStorage.clear(); // Tüm oturum verilerini (jwtToken, username, userRole vb.) temizler
    window.location.href = "login.html";
}

// Veritabanındaki kullanıcıları dropdown'a yükleyen fonksiyon (Korumalı API)
async function loadUsersDropdown() {
    const userSelect = document.getElementById('userSelect');
    
    try {
        const response = await fetch(USERS_URL, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            alert("Oturum süreniz doldu veya yetkiniz yok. Lütfen tekrar giriş yapın.");
            logout();
            return;
        }

        if (!response.ok) throw new Error(`Kullanıcılar getirilemedi. HTTP Status: ${response.status}`);

        const users = await response.json();

        if (userSelect) {
            userSelect.innerHTML = ''; // "Kullanıcılar yükleniyor..." seçeneğini temizle

            if (!Array.isArray(users) || users.length === 0) {
                userSelect.innerHTML = '<option value="">Kullanıcı Bulunamadı</option>';
                return;
            }

            const activeUserId = localStorage.getItem('activeUserId');
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;

                const name = user.username || user.fullName || user.name || user.email || `Kullanıcı #${user.id}`;
                const city = user.city ? ` (${user.city})` : '';

                option.textContent = `${name}${city}`;
                option.dataset.city = user.city || ''; // Şehir bilgisini option üzerinde saklıyoruz

                // Eğer hafızadaki kullanıcı id ile eşleşirse seçili getir
                if (activeUserId && user.id == activeUserId) {
                    option.selected = true;
                }

                userSelect.appendChild(option);
            });

            // Seçili kullanıcının şehir bilgisini doldur
            const selectedOpt = userSelect.options[userSelect.selectedIndex];
            if (selectedOpt && selectedOpt.dataset.city) {
                const cityInput = document.getElementById('cityInput');
                if (cityInput) cityInput.value = selectedOpt.dataset.city;
            }
        }
    } catch (error) {
        console.error('Kullanıcı yükleme hatası:', error);
        if (userSelect) {
            userSelect.innerHTML = '<option value="">Yükleme Başarısız!</option>';
        }
    }
}

// Kullanıcı dropdown seçimi değiştiğinde çalışan tetikleyici
function onUserChange(e) {
    const userSelect = e.target;
    const selectedOption = userSelect.options[userSelect.selectedIndex];

    if (selectedOption && selectedOption.value) {
        const userId = userSelect.value;
        const userName = selectedOption.text.split(' (')[0];
        const userCity = selectedOption.dataset.city;

        localStorage.setItem('activeUserId', userId);
        localStorage.setItem('username', userName);

        // Sol üstteki aktif kullanıcı adını anında güncelle
        const userDisplay = document.getElementById("activeUsernameDisplay");
        if (userDisplay) {
            userDisplay.textContent = userName;
        }

        if (userCity) {
            const cityInput = document.getElementById('cityInput');
            if (cityInput) cityInput.value = userCity;
        }

        checkAuthStatus(); // Oturum alanını güncelle
    }
}

// LocalStorage'dan aktif kullanıcı ID'sini alan yardımcı fonksiyon
function getActiveUserId() {
    const userSelect = document.getElementById('userSelect');
    if (userSelect && userSelect.value) {
        return userSelect.value;
    }
    return localStorage.getItem('activeUserId') || '1';
}

// LocalStorage veya Select elementinden kullanıcı adını alan yardımcı fonksiyon
function getActiveUserName() {
    const userSelect = document.getElementById('userSelect');
    if (userSelect && userSelect.selectedIndex !== -1 && userSelect.options[userSelect.selectedIndex]) {
        return userSelect.options[userSelect.selectedIndex].text.split(' (')[0];
    }
    return localStorage.getItem('username') || localStorage.getItem('activeUsername') || 'Kullanıcı';
}

// City List Datalist İçeriğini Oluşturan Fonksiyon
function populateCityList() {
    const datalist = document.getElementById('cityList');
    if (datalist) {
        datalist.innerHTML = defaultCities
            .map(city => `<option value="${city}"></option>`)
            .join('');
    }
}

// Weather metninden ikon ve Türkçe karşılık türeten yardımcı fonksiyon
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

    return {
        icon: matched.icon,
        text: matched.text,
        temp: temp,
        humidity: humidity
    };
}

// Vitrin Önerisi Oluşturma (Korumalı API)
async function generateShowcase() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput ? cityInput.value.trim() : '';
    
    const userId = getActiveUserId();
    const selectedUserName = getActiveUserName();

    if (!city) {
        alert('Lütfen bir şehir adı giriniz!');
        return;
    }

    const loading = document.getElementById('loading');
    const previewCard = document.getElementById('previewCard');

    if (loading) loading.classList.remove('hidden');
    if (previewCard) previewCard.classList.add('hidden');

    try {
        const response = await fetch(`${BASE_URL}/suggest?city=${encodeURIComponent(city)}&userId=${userId}`, {
            method: 'GET',
            headers: getAuthHeaders() // JWT Token header'a ekleniyor
        });
        
        if (response.status === 401 || response.status === 403) {
            alert("Oturum süreniz doldu veya yetkiniz yok. Lütfen tekrar giriş yapın.");
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`API isteği başarısız oldu. HTTP Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

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

            const movieTitles = data.movieTitles || data.contents || data.movies || [];

            if (Array.isArray(movieTitles) && movieTitles.length > 0) {
                movieTitles.forEach((movie, index) => {
                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    
                    const posterUrl = (typeof movie === 'object' && (movie.poster || movie.posterUrl || movie.backdropPath)) 
                        ? (movie.poster || movie.posterUrl || movie.backdropPath) 
                        : 'https://placehold.co/300x450/111/fff?text=No+Poster';

                    const title = typeof movie === 'string' ? movie : (movie.title || movie.name || 'İsimsiz İçerik');
                    const rating = movie.rating || 'N/A';
                    const genre = movie.genre || 'Fantastik / Macera';
                    const duration = movie.durationInMinutes || movie.duration || '120';

                    card.innerHTML = `
                        <div class="movie-poster-container">
                            <img src="${posterUrl}" alt="${title}" />
                        </div>
                        <div class="movie-card-content">
                            <div>
                                <div class="movie-header">
                                    <span class="movie-number">#${index + 1} Öneri</span>
                                    <span class="movie-rating">⭐ ${rating}</span>
                                </div>
                                <div class="movie-title" title="${title}">${title}</div>
                                <div class="movie-meta">
                                    <span>🎭 ${genre}</span>
                                    <span>⏱️ ${duration} dk</span>
                                </div>
                            </div>
                            
                            <div class="movie-tag-wrapper">
                                <span class="movie-tag">🎯 Kişiselleştirilmiş Skor ℹ️</span>
                                <div class="tooltip-text">
                                    <div class="tooltip-header">🧠 AI Algoritma Analizi</div>
                                    <ul class="tooltip-list">
                                        <li>👤 <strong>Kullanıcı:</strong> ${selectedUserName} profil geçmişine uygun.</li>
                                        <li>🌤️ <strong>Hava Durumu:</strong> ${city} (${weatherInfo.text}, ${weatherInfo.temp}) ortamına ideal.</li>
                                        <li>🎭 <strong>Tür & Süre:</strong> Favori <em>${genre}</em> türü ve ~${duration} dk izleme alışkanlığı.</li>
                                    </ul>
                                </div>
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
        console.error('Hata:', error);
        alert('Vitrin oluşturulurken bir hata meydana geldi!');
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

// Vitrin Onaylama (Korumalı API)
async function approveShowcase() {
    if (!currentShowcaseId) {
        alert('Onaylanacak bir vitrin bulunamadı!');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/${currentShowcaseId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders() // JWT Token header'a ekleniyor
        });

        if (response.status === 401 || response.status === 403) {
            alert("Oturum süreniz doldu veya bu işlem için yetkiniz yok.");
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
        console.error('Hata:', error);
        alert('Sunucuya bağlanılamadı!');
    }
}