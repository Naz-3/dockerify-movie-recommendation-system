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
    // Mobil menü
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
    
    // 1. Kullanıcı adını localStorage'daki olası tüm anahtarlardan arayalım
    let activeUser = localStorage.getItem("username") || 
                     localStorage.getItem("activeUsername") || 
                     localStorage.getItem("user") || 
                     localStorage.getItem("name");

    // 2. Eğer hiçbir yerde kayıtlı değilse ama JWT Token varsa, token'ı okumayı deneyelim
    if (!activeUser) {
        const token = localStorage.getItem("jwtToken");
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const payload = JSON.parse(jsonPayload);
                activeUser = payload.sub || payload.username || payload.name || payload.email || "Admin";
                
                localStorage.setItem("username", activeUser);
            } catch (e) {
                console.error("Token çözülemedi:", e);
                activeUser = "Admin";
            }
        } else {
            activeUser = "Admin";
        }
    }

    // 3. Ekrandaki etikete kullanıcı adını doğrudan yazdıralım
    const userDisplay = document.getElementById("activeUsernameDisplay");
    if (userDisplay) {
        userDisplay.textContent = activeUser;
    }

    // 4. AI Vitrin İsteği Atılırken generateShowcase fonksiyonunu çağır
    const generateBtn = document.getElementById("generateBtn");
    if (generateBtn) {
        generateBtn.addEventListener("click", () => {
            generateShowcase();
        });
    }

    // Şehir Datalist'ini Doldur
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

// Oturum Koruma (Auth Guard)
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
    localStorage.clear();
    window.location.href = "login.html";
}

// Veritabanındaki kullanıcıları dropdown'a yükleyen fonksiyon
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
            userSelect.innerHTML = '';

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
                option.dataset.city = user.city || '';

                if (activeUserId && user.id == activeUserId) {
                    option.selected = true;
                }

                userSelect.appendChild(option);
            });

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

        const userDisplay = document.getElementById("activeUsernameDisplay");
        if (userDisplay) {
            userDisplay.textContent = userName;
        }

        if (userCity) {
            const cityInput = document.getElementById('cityInput');
            if (cityInput) cityInput.value = userCity;
        }

        checkAuthStatus();
    }
}

function getActiveUserId() {
    const userSelect = document.getElementById('userSelect');
    if (userSelect && userSelect.value) {
        return userSelect.value;
    }
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
        datalist.innerHTML = defaultCities
            .map(city => `<option value="${city}"></option>`)
            .join('');
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

    return {
        icon: matched.icon,
        text: matched.text,
        temp: temp,
        humidity: humidity
    };
}

// Film isimlerine göre şık ve gerçekçi poster eşleme (Eğer API'den poster gelmezse)
// Film isimlerine göre gerçekçi ve doğru poster eşleme
function getFallbackPoster(title) {
    const t = title.toLowerCase();
    if (t.includes('batman')) return 'https://image.tmdb.org/t/p/w500/covqqqcdGNWz8DV15zeCWzOXvR0.jpg';
    if (t.includes('13 reasons')) return 'https://image.tmdb.org/t/p/w500/iJc5q5F1pU4tLqB7w6n9n4m3p0a.jpg'; // Alternatif popüler poster
    if (t.includes('fall of the house of usher')) return 'https://image.tmdb.org/t/p/w500/yQxWw8E454VlQ874t32s1nK2A81.jpg';
    if (t.includes('harry potter')) return 'https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg';
    if (t.includes('dark')) return 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg';
    if (t.includes('inception')) return 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg';
    if (t.includes('interstellar')) return 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg';
    
    // Eğer doğrudan dizi/film ismi varsa TMDB arama posterlerinden güvenli bir havuz kullanalım
    return `https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop`;
}

// Detay Modalını Sayfaya Otomatik Ekleyen Fonksiyon
function ensureDetailModalExists() {
    if (document.getElementById('movieDetailModal')) return;

    const modalHTML = `
        <div id="movieDetailModal" class="movie-modal-overlay hidden">
            <div class="movie-modal-content">
                <button class="modal-close-btn" onclick="closeMovieDetails()">✕</button>
                <div class="modal-body-wrapper">
                    <img id="modalPoster" src="" alt="Poster" />
                    <div class="modal-info">
                        <h3 id="modalTitle">Film Adı</h3>
                        <div id="modalMeta" class="modal-meta-badges"></div>
                        <p id="modalDescription">AI analizi ve içerik detayları burada yer almaktadır...</p>
                        <div class="modal-actions">
                            <button class="btn-primary" onclick="alert('İçerik listenize eklendi!')">🎬 Listeme Ekle</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Detay Penceresini Açma
function openMovieDetails(title, rating, genre, duration, posterUrl) {
    ensureDetailModalExists();
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalPoster').src = posterUrl;
    document.getElementById('modalMeta').innerHTML = `<span>⭐ ${rating}</span> <span>🎭 ${genre}</span> <span>⏱️ ${duration} dk</span>`;
    document.getElementById('modalDescription').innerText = `"${title}" içeriği, yapay zeka direktörümüz tarafından mevcut hava koşullarınız ve geçmiş izleme tercihleriniz analiz edilerek bu hafta için özel olarak önerilmiştir.`;
    
    document.getElementById('movieDetailModal').classList.remove('hidden');
}

// Detay Penceresini Kapatma
function closeMovieDetails() {
    const modal = document.getElementById('movieDetailModal');
    if (modal) modal.classList.add('hidden');
}

// Kart oluşturma döngüsü içerisindeki güncellenmiş kısım:
movieTitles.forEach((movie, index) => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const title = typeof movie === 'string' ? movie : (movie.title || movie.name || 'İsimsiz İçerik');
    const posterUrl = getFallbackPoster(title);
    const rating = movie.rating || '8.4';
    const genre = movie.genre || 'Fantastik / Macera';
    const duration = movie.durationInMinutes || movie.duration || '135';

    // Karta tıklandığında artık hata sayfasına gitmek yerine modal açılacak
    card.addEventListener('click', () => {
        openMovieDetails(title, rating, genre, duration, posterUrl);
    });

    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${posterUrl}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop'" />
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
            headers: getAuthHeaders()
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
                    
                    const title = typeof movie === 'string' ? movie : (movie.title || movie.name || 'İsimsiz İçerik');
                    
                    const posterUrl = (typeof movie === 'object' && (movie.poster || movie.posterUrl || movie.backdropPath)) 
                        ? (movie.poster || movie.posterUrl || movie.backdropPath) 
                        : getFallbackPoster(title);

                    const rating = movie.rating || '8.4';
                    const genre = movie.genre || 'Fantastik / Macera';
                    const duration = movie.durationInMinutes || movie.duration || '135';
                    const movieId = movie.id || index + 1;

                    // Karta tıklandığında detay sayfasına yönlendirme
                    card.addEventListener('click', () => {
                        window.location.href = `movie-detail.html?id=${movieId}&title=${encodeURIComponent(title)}`;
                    });

                    card.innerHTML = `
                        <div class="movie-poster-container">
                            <img src="${posterUrl}" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop'" />
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
        console.error('Hata:', error);
        alert('Vitrin oluşturulurken bir hata meydana geldi!');
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
        const response = await fetch(`${BASE_URL}/${currentShowcaseId}/approve`, {
            method: 'POST',
            headers: getAuthHeaders()
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