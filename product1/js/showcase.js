const BASE_URL =
    'https://dockerify-movie-recommendation-system.onrender.com/api/v1/showcases';

const USERS_URL =
    'https://dockerify-movie-recommendation-system.onrender.com/api/users';

let currentShowcaseId = null;

const defaultCities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara",
    "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl",
    "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı",
    "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane",
    "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir",
    "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş",
    "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize",
    "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat",
    "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman",
    "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis",
    "Osmaniye", "Düzce",

    "Amsterdam", "Athens", "Baku", "Berlin", "Brussels", "Budapest",
    "Cairo", "Chicago", "Dubai", "Frankfurt", "Geneva", "Helsinki",
    "Kyiv", "London", "Los Angeles", "Madrid", "Milan", "Moscow",
    "Munich", "New York", "Oslo", "Paris", "Prague", "Rome", "Seoul",
    "Stockholm", "Tbilisi", "Tokyo", "Vienna", "Warsaw", "Washington",
    "Zurich"
];

// SAYFA BAŞLANGICI
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initUserDisplay();
    initGenerateButton();
    populateCityList();
    initMovieModal();
    checkAuthStatus();
});

// GENEL YARDIMCILAR
function getAuthHeaders() {
    const token =
        localStorage.getItem('jwtToken');

    return {
        'Content-Type': 'application/json',
        ...(token
            ? {
                Authorization: `Bearer ${token}`
            }
            : {})
    };
}

function handleUnauthorized(response) {

    if (
        response.status !== 401 &&
        response.status !== 403
    ) {
        return false;
    }

    alert(
        'Oturum süreniz doldu veya yetkiniz yok. Lütfen tekrar giriş yapın.'
    );

    logout();
    return true;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function firstValue(...values) {
    return values.find(value =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
    );
}

function normalizeMovie(movie) {
    return typeof movie === 'string'
        ? { title: movie }
        : (movie || {});
}

function formatMinutes(value) {
    const minutes =
        Number(value);

    return (
        Number.isFinite(minutes) &&
        minutes > 0
    )
        ? `${Math.round(minutes)} dk`
        : '';
}

// MOBİL MENÜ
function initMobileMenu() {

    const menuToggle =
        document.getElementById('menuToggle');

    const sidebar =
        document.querySelector('.sidebar');

    if (
        !menuToggle ||
        !sidebar
    ) {
        return;
    }

    menuToggle.addEventListener(
        'click',
        () => {
            sidebar.classList.toggle(
                'mobile-open'
            );
        }
    );

    document.addEventListener(
        'click',
        event => {
            if (
                sidebar.classList.contains(
                    'mobile-open'
                ) &&
                !sidebar.contains(
                    event.target
                ) &&
                !menuToggle.contains(
                    event.target
                )
            ) {
                sidebar.classList.remove(
                    'mobile-open'
                );
            }
        }
    );
}

// KULLANICI ARAYÜZÜ
function initUserDisplay() {
    const activeUser =
        localStorage.getItem('username') ||
        'user1';

    const userDisplay =
        document.getElementById(
            'activeUsernameDisplay'
        );

    if (userDisplay) {
        userDisplay.textContent =
            activeUser;
    }
}

function initGenerateButton() {
    const generateBtn =
        document.getElementById(
            'generateBtn'
        );

    if (generateBtn) {
        generateBtn.addEventListener(
            'click',
            generateShowcase
        );
    }
}

function checkAuthGuard() {
    if (
        !localStorage.getItem(
            'jwtToken'
        )
    ) {
        window.location.href =
            'login.html';

    }
}

function checkAuthStatus() {
    const username =
        localStorage.getItem('username') ||
        localStorage.getItem('activeUsername');

    const loginNavBtn =
        document.getElementById(
            'loginNavBtn'
        );
    const userProfileBar =
        document.getElementById(
            'userProfileBar'
        );
    const welcomeUserText =
        document.getElementById(
            'welcomeUserText'
        );

    if (username) {

        if (loginNavBtn) {
            loginNavBtn.style.display =
                'none';
        }

        if (userProfileBar) {
            userProfileBar.style.display =
                'flex';
        }

        if (welcomeUserText) {
            welcomeUserText.textContent =
                `👤 ${username}`;
        }
    } else {

        if (loginNavBtn) {
            loginNavBtn.style.display =
                'inline-block';
        }

        if (userProfileBar) {
            userProfileBar.style.display =
                'none';
        }
    }
}

function logout() {
    localStorage.clear();
    window.location.href =
        'login.html';
}
// KULLANICI DROPDOWN
async function loadUsersDropdown() {
    const userSelect =
        document.getElementById(
            'userSelect'
        );

    if (!userSelect) {
        return;
    }
    try {
        const response =
            await fetch(
                USERS_URL,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );

        if (
            handleUnauthorized(
                response
            )
        ) {
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Kullanıcılar getirilemedi. HTTP Status: ${response.status}`
            );
        }
        const users =
            await response.json();
        userSelect.innerHTML = '';

        if (
            !Array.isArray(users) ||
            users.length === 0
        ) {
            userSelect.innerHTML =
                '<option value="">Kullanıcı Bulunamadı</option>';
            return;
        }
        const activeUserId =
            localStorage.getItem(
                'activeUserId'
            );
        users.forEach(user => {
            const option =
                document.createElement(
                    'option'
                );
            const name =
                firstValue(
                    user.username,
                    user.fullName,
                    user.name,
                    user.email,
                    `Kullanıcı #${user.id}`
                );

            option.value =
                user.id;

            option.dataset.city =
                user.city || '';

            option.textContent =
                user.city
                    ? `${name} (${user.city})`
                    : name;

            option.selected =
                Boolean(
                    activeUserId &&
                    user.id == activeUserId
                );
            userSelect.appendChild(
                option
            );
        });
        const selected =
            userSelect.options[
                userSelect.selectedIndex
            ];
        if (
            selected?.dataset.city
        ) {
            const cityInput =
                document.getElementById(
                    'cityInput'
                );

            if (cityInput) {
                cityInput.value =
                    selected.dataset.city;
            }
        }

    } catch (error) {
        console.error(
            'Kullanıcı yükleme hatası:',
            error
        );
        userSelect.innerHTML =
            '<option value="">Yükleme Başarısız!</option>';
    }
}

function onUserChange(event) {
    const userSelect =
        event.target;
    const selected =
        userSelect.options[
            userSelect.selectedIndex
        ];

    if (!selected?.value) {
        return;
    }
    const userName =
        selected.text.split(' (')[0];
    const userCity =
        selected.dataset.city || '';
    localStorage.setItem(
        'activeUserId',
        selected.value
    );
    localStorage.setItem(
        'username',
        userName
    );
    const cityInput =
        document.getElementById(
            'cityInput'
        );

    if (
        cityInput &&
        userCity
    ) {
        cityInput.value =
            userCity;
    }
    checkAuthStatus();
}

function getActiveUserId() {
    const userSelect =
        document.getElementById(
            'userSelect'
        );
    return (
        userSelect?.value ||
        localStorage.getItem(
            'activeUserId'
        ) ||
        '1'
    );
}

function getActiveUserName() {
    const userSelect =
        document.getElementById(
            'userSelect'
        );

    if (
        userSelect &&
        userSelect.selectedIndex >= 0
    ) {
        return userSelect
            .options[
                userSelect.selectedIndex
            ]
            .text
            .split(' (')[0];
    }
    return (
        localStorage.getItem(
            'username'
        ) ||
        localStorage.getItem(
            'activeUsername'
        ) ||
        'Kullanıcı'
    );
}

// ŞEHİR
function populateCityList() {
    const datalist =
        document.getElementById(
            'cityList'
        );

    if (!datalist) {
        return;
    }
    datalist.innerHTML =
        defaultCities
            .map(
                city =>
                    `<option value="${escapeHtml(city)}"></option>`
            )
            .join('');
}

// HAVA DURUMU
function parseWeatherData(
    rawWeatherText
) {
    if (!rawWeatherText) {
        return {
            icon: '🌤️',
            text: 'Bilinmiyor',
            temp: '',
            humidity: ''
        };
    }
    const [
        condition = 'Clear',
        temp = '',
        humidity = ''
    ] =
        rawWeatherText
            .split('|')
            .map(
                part => part.trim()
            );
    const conditions = {
        Clear: {
            text: 'Açık',
            icon: '☀️'
        },
        Clouds: {
            text: 'Bulutlu',
            icon: '☁️'
        },
        Rain: {
            text: 'Yağmurlu',
            icon: '🌧️'
        },
        Snow: {
            text: 'Kar Yağışlı',
            icon: '❄️'
        },
        Thunderstorm: {
            text: 'Fırtınalı',
            icon: '⛈️'
        },
        Drizzle: {
            text: 'Çiseleyen',
            icon: '🌦️'
        }
    };
    return {
        ...(conditions[condition] || {
            text: condition,
            icon: '🌤️'
        }),
        temp,
        humidity
    };
}

// CONTENT POSTERİ
function getPosterUrl(movie) {
    const poster =
        firstValue(
            movie.posterUrl,
            movie.posterURL,
            movie.poster,
            movie.posterPath,
            movie.imageUrl,
            movie.image,
            movie.thumbnailUrl,
            movie.backdropUrl
        );

    if (!poster) {
        return '';
    }
    return String(poster).startsWith('/')
        ? `https://image.tmdb.org/t/p/w500${poster}`
        : String(poster);
}

// CONTENT AÇIKLAMASI
function getDescription(movie) {
    return firstValue(
        movie.description,
        movie.overview,
        movie.summary,
        movie.plot,
        movie.synopsis,
        'Bu içerik için henüz bir açıklama bulunmuyor.'
    );
}

// BAŞROLLER
function getCast(movie) {
    const cast =
        firstValue(
            movie.cast,
            movie.actors,
            movie.mainCast,
            movie.topCast,
            movie.starring
        );

    if (!cast) {
        return [];
    }

    if (Array.isArray(cast)) {
        return cast
            .map(actor => {
                if (
                    typeof actor === 'string'
                ) {

                    return actor;
                }
                return firstValue(
                    actor?.name,
                    actor?.originalName,
                    actor?.actorName
                );
            })
            .filter(Boolean)
            .slice(0, 6);
    }
    return String(cast)
        .split(',')
        .map(
            name => name.trim()
        )
        .filter(Boolean)
        .slice(0, 6);
}

// ŞİMDİ İZLE URL
function getWatchUrl(movie) {
    return firstValue(
        movie.watchUrl,
        movie.watchURL,
        movie.videoUrl,
        movie.videoURL,
        movie.contentUrl,
        movie.detailUrl,
        movie.url,
        ''
    );
}

// İZLEME GEÇMİŞİ / FAVORİ / WATCHLIST
function containsTitle(
    collection,
    title
) {
    if (
        !collection ||
        !title
    ) {
        return false;
    }
    const target =
        String(title).toLowerCase();

    if (Array.isArray(collection)) {
        return collection.some(
            item => {
                const name =
                    typeof item === 'string'
                        ? item
                        : firstValue(
                            item?.title,
                            item?.name,
                            item?.contentTitle
                        );
                return (
                    name &&
                    String(name)
                        .toLowerCase() ===
                    target
                );
            }
        );
    }
    return String(collection)
        .toLowerCase()
        .includes(target);
}

// KİŞİSELLEŞTİRİLMİŞ ÖNERİ SEBEBİ
function buildPersonalizedReason(
    movie,
    data,
    city,
    weatherInfo
) {
    const title =
        firstValue(
            movie.title,
            movie.name,
            'Bu içerik'
        );
    // Backend özel bir sebep döndürüyorsa
    // onu kullanıyoruz.
    const backendReason =
        firstValue(
            movie.recommendationReason,
            movie.personalizedReason,
            movie.reason,
            movie.explanation,
            movie.whyRecommended
        );

    if (backendReason) {
        return String(
            backendReason
        );
    }
    /*
     * Kullanıcı davranışları backend response'unda
     * mevcutsa bunları kullan.
     *
     * Burada gereksiz şekilde onlarca farklı
     * alan adı tahmin etmiyoruz.
     */
    const profile =
        data.userProfile ||
        data.userBehavior ||
        data.personalization ||
        {};
    const history =
        profile.watchHistory ||
        data.watchHistory;
    const favorites =
        profile.favorites ||
        data.favorites;
    const watchlist =
        profile.watchlist ||
        profile.toWatch ||
        data.watchlist ||
        data.toWatch;
    const watchedMinutes =
        profile.watchedMinutes ||
        profile.totalWatchMinutes ||
        data.watchedMinutes ||
        data.totalWatchMinutes;
    const genre =
        firstValue(
            movie.genre,
            movie.genres
        );
    const duration =
        firstValue(
            movie.durationInMinutes,
            movie.duration,
            movie.runtime
        );
    const reasons = [];
    // Tür tercihi
    if (genre) {
        const genreText =
            Array.isArray(genre)
                ? genre.join(' / ')
                : genre;
        reasons.push(
            `${genreText} türü tercihlerinizle eşleşiyor`
        );
    }
    // İçerik süresi
    if (duration) {
        reasons.push(
            `${formatMinutes(duration)} civarındaki izleme tercihinize uygun`
        );
    }
    // İzleme süresi
    if (watchedMinutes) {

        reasons.push(
            'izleme süreniz dikkate alındı'
        );
    }
    // İzleme geçmişi
    if (
        containsTitle(
            history,
            title
        )
    ) {
        reasons.push(
            'izleme geçmişinizle bağlantılı'
        );
    }
    // Favoriler
    if (
        containsTitle(
            favorites,
            title
        ) ||
        movie.matchesFavoriteGenre ||
        movie.favoriteGenreMatch
    ) {
        reasons.push(
            'favori tercihlerinizle örtüşüyor'
        );
    }
    // Daha Sonra İzle
    if (
        containsTitle(
            watchlist,
            title
        ) ||
        movie.inWatchlist
    ) {
        reasons.push(
            'Daha Sonra İzle listenizle ilişkili'
        );
    }
    // Yarım bırakılan içerikler
    if (
        profile.unfinished ||
        profile.partiallyWatched ||
        data.unfinished ||
        data.partiallyWatched ||
        movie.matchesUnfinishedContent
    ) {
        reasons.push(
            'yarım bıraktığınız içeriklerden çıkarılan eğilimlerle uyumlu'
        );
    }
    // Hava durumu
    if (
        weatherInfo?.text &&
        weatherInfo.text !== 'Bilinmiyor'
    ) {
        const weatherText = {
            Yağmurlu:
                'yağmurlu hava',
            KarYağışlı:
                'soğuk ve karlı hava',
            Fırtınalı:
                'fırtınalı hava',
            Bulutlu:
                'kapalı hava',
            Açık:
                'açık hava'
        }[
            weatherInfo.text
        ] ||
        weatherInfo.text.toLowerCase();

        reasons.push(
            `${city} için mevcut ${weatherText} koşuluyla uyumlu`
        );
    }

    if (
        reasons.length === 0
    ) {
        return (
            `${title}, profilinizdeki öneri sinyalleri ` +
            `ve ${city} hava koşulları birlikte ` +
            `değerlendirilerek seçildi.`
        );

    }
    return (
        `${title}, ` +
        reasons
            .slice(0, 3)
            .join(', ') +
        '.'
    );
}

// CONTENT LİSTESİ
function getMovieArray(data) {
    return [
        data.movieTitles,
        data.contents,
        data.movies,
        data.recommendations
    ]
        .find(
            Array.isArray
        ) || [];
}

// POSTER YOKSA
function createPosterPlaceholder() {
    return `
        <div class="movie-poster-placeholder">
            <span>🎬</span>
            <small>Poster bulunamadı</small>
        </div>
    `;
}

// CONTENT DETAY MODALI
function openMovieModal(rawMovie) {
    const movie =
        normalizeMovie(
            rawMovie
        );
    const modal =
        document.getElementById(
            'movieModal'
        );

    if (!modal) {
        return;
    }
    const title =
        firstValue(
            movie.title,
            movie.name,
            'İsimsiz İçerik'
        );
    const poster =
        getPosterUrl(
            movie
        );
    const rating =
        firstValue(
            movie.rating,
            movie.voteAverage,
            movie.score
        );
    const genre =
        firstValue(
            movie.genre,
            movie.genres
        );
    const duration =
        firstValue(
            movie.durationInMinutes,
            movie.duration,
            movie.runtime
        );
    const year =
        firstValue(
            movie.releaseYear,
            movie.year,
            movie.releaseDate
        );
    const cast =
        getCast(
            movie
        );
    const titleEl =
        document.getElementById(
            'modalMovieTitle'
        );
    const descriptionEl =
        document.getElementById(
            'modalMovieDescription'
        );
    const posterEl =
        document.getElementById(
            'modalMoviePoster'
        );
    const metaEl =
        document.getElementById(
            'modalMovieMeta'
        );
    const castEl =
        document.getElementById(
            'modalMovieCast'
        );
    const watchBtn =
        document.getElementById(
            'modalWatchBtn'
        );

    if (titleEl) {
        titleEl.textContent =
            title;
    }

    if (descriptionEl) {
        descriptionEl.textContent =
            getDescription(
                movie
            );
    }

    if (posterEl) {
        posterEl.src =
            poster;
        posterEl.alt =
            poster
                ? `${title} posteri`
                : '';
        posterEl.style.display =
            poster
                ? 'block'
                : 'none';
    }

    if (metaEl) {
        const meta = [];
        if (rating) {
            meta.push(
                `⭐ ${escapeHtml(rating)}`
            );
        }

        if (genre) {
            meta.push(
                `🎭 ${
                    escapeHtml(
                        Array.isArray(genre)
                            ? genre.join(' / ')
                            : genre
                    )
                }`
            );
        }

        if (duration) {
            meta.push(
                `⏱️ ${
                    escapeHtml(
                        formatMinutes(
                            duration
                        ) ||
                        duration
                    )
                }`
            );
        }

        if (year) {
            meta.push(
                `📅 ${
                    escapeHtml(
                        String(year)
                            .slice(0, 4)
                    )
                }`
            );
        }
        metaEl.innerHTML =
            meta
                .map(
                    item =>
                        `<span>${item}</span>`
                )
                .join('');
    }

    if (castEl) {
        castEl.innerHTML =
            cast.length
                ? `
                    <strong>🎬 Başroller:</strong>
                    ${cast
                        .map(
                            escapeHtml
                        )
                        .join(', ')}
                  `
               : '';

    }

    if (watchBtn) {
        watchBtn.dataset.watchUrl =
            getWatchUrl(
                movie
            );
        watchBtn.dataset.contentId =
            firstValue(
                movie.id,
                movie.contentId,
                movie.tmdbId,
                ''
            ) || '';
    }
    modal.classList.remove(
        'hidden'
    );
    modal.setAttribute(
        'aria-hidden',
        'false'
    );
    document.body.classList.add(
        'modal-open'
    );
}

// MODAL KAPAT
function closeMovieModal() {
    const modal =
        document.getElementById(
            'movieModal'
        );

    if (!modal) {
        return;
    }
    modal.classList.add(
        'hidden'
    );
    modal.setAttribute(
        'aria-hidden',
        'true'
    );
    document.body.classList.remove(
        'modal-open'
    );
}

// ŞİMDİ İZLE
function handleWatchClick() {
    const button =
        document.getElementById(
            'modalWatchBtn'
        );
    if (!button) {
        return;
    }

    const url =
        button.dataset.watchUrl;
    const contentId =
        button.dataset.contentId;
    if (url) {
        window.open(
            url,
            '_blank',
            'noopener,noreferrer'
        );
        return;
    }
    if (contentId) {
        window.location.href =
            `watch.html?id=${encodeURIComponent(
                contentId
            )}`;
        return;
    }
    alert(
        'Bu içerik için izleme bağlantısı bulunamadı.'
    );
}

// MODAL EVENTLERİ
function initMovieModal() {
    const modal =
        document.getElementById(
            'movieModal'
        );
    const closeBtn =
        document.getElementById(
            'modalCloseBtn'
        );
    const watchBtn =
        document.getElementById(
            'modalWatchBtn'
        );
    closeBtn?.addEventListener(
        'click',
        closeMovieModal
    );
    watchBtn?.addEventListener(
        'click',
        handleWatchClick
    );
    modal?.addEventListener(
        'click',
        event => {
            if (
                event.target === modal
            ) {
                closeMovieModal();
            }
        }
    );

    document.addEventListener(
        'keydown',
        event => {
            if (
                event.key === 'Escape' &&
                modal &&
                !modal.classList.contains(
                    'hidden'
                )
            ) {
                closeMovieModal();
            }
        }
    );
}

// VİTRİN OLUŞTUR
async function generateShowcase() {
    const cityInput =
        document.getElementById(
            'cityInput'
        );
    const loading =
        document.getElementById(
            'loading'
        );
    const previewCard =
        document.getElementById(
            'previewCard'
        );
    const city =
        cityInput?.value.trim() ||
        '';
    const userId =
        getActiveUserId();
    const userName =
        getActiveUserName()
    if (!city) {
        alert(
            'Lütfen bir şehir adı giriniz!'
        );
        return;
    }
    loading?.classList.remove(
        'hidden'
    );
    previewCard?.classList.add(
        'hidden'
    );
    try {
        const response =
            await fetch(
                `${BASE_URL}/suggest?city=${encodeURIComponent(
                    city
                )}&userId=${encodeURIComponent(
                    userId
                )}`,
                {
                    method: 'GET',
                    headers: getAuthHeaders()
                }
            );
        if (
            handleUnauthorized(
                response
            )
        ) {
            return;
        }
        if (!response.ok) {
            throw new Error(
                `API isteği başarısız oldu. HTTP Status: ${response.status}`
            );
        }
        const data =
            await response.json();
        console.log(
            'API Response:',
            data
        );
        currentShowcaseId =
            data.showcaseId;
        renderShowcase(
            data,
            city,
            userName
        );
        previewCard?.classList.remove(
            'hidden'
        );
    } catch (error) {
        console.error(
            'Vitrin oluşturma hatası:',
            error
        );
        alert(
            'Vitrin oluşturulurken bir hata meydana geldi!'
        );
    } finally {
        loading?.classList.add(
            'hidden'
        );
    }
}

// VİTRİNİ EKRANA BAS
function renderShowcase(
    data,
    city,
    userName
) {
    const weatherText =
        (
            data.triggerReason ||
            ''
        )
        .replace(
            'AI Direktör Önerisi - ',
            ''
        );
    const weatherInfo =
        parseWeatherData(
            weatherText
        );
    const titleEl =
        document.getElementById(
            'showcaseTitle'
        );

    if (titleEl) {
        titleEl.textContent =
            data.title ||
            'Haftanın Öne Çıkanları (Sistem Önerisi)';
    }
    renderTriggerReason(
        city,
        userName,
        weatherInfo
    );
    renderMovieCards(
        data,
        city,
        weatherInfo
    );
}

// HAVA DURUMU / KULLANICI BİLGİSİ
function renderTriggerReason(
    city,
    userName,
    weatherInfo
) {
    const trigger =
        document.getElementById(
            'triggerReason'
        );
    if (!trigger) {
        return;
    }

    trigger.innerHTML = `

        <div class="weather-card-inline">
            <span class="user-badge">
                👤
                ${escapeHtml(userName)}
                Profiline Özel
            </span>
            <span class="city-badge">
                📍
                <strong>
                    ${escapeHtml(city)}
                </strong>
            </span>
            <span class="weather-icon">
                ${weatherInfo.icon}
            </span>
            <span class="weather-detail">
                <strong>
                    ${escapeHtml(
                        weatherInfo.text
                    )}
                </strong>
            </span>
            ${
                weatherInfo.temp
                    ? `
                        <span class="temp-badge">
                            ${escapeHtml(
                                weatherInfo.temp
                            )}
                        </span>
                      `
                    : ''
            }
            ${
                weatherInfo.humidity
                    ? `
                        <span class="humidity-badge">
                            💧
                            ${escapeHtml(
                                weatherInfo.humidity
                            )}
                        </span>
                      `
                    : ''
            }
        </div>
    `;
}

// CONTENT KARTLARINI OLUŞTUR
function renderMovieCards(
    data,
    city,
    weatherInfo
) {
    const grid =
        document.getElementById(
            'movieGrid'
        );
    if (!grid) {
        return;
    }

    grid.innerHTML = '';
    const movies =
        getMovieArray(data)
            .slice(0, 3);
    if (
        movies.length === 0
    ) {
        grid.innerHTML = `
            <p class="no-content-alert">
                ⚠️ Bu kriterlere uygun
                vitrin içeriği bulunamadı.
            </p>
        `;
        return;
    }

    movies.forEach(
        (rawMovie, index) => {
            const movie = normalizeMovie(rawMovie);
            const title = firstValue(
                movie.title,
                movie.name,
                'İsimsiz İçerik'
            );
            const rating = firstValue(
                movie.rating,
                movie.voteAverage,
                movie.score
            );
            const genreValue = firstValue(
                movie.genre,
                movie.genres
            );
            const genre = Array.isArray(genreValue)
                ? genreValue.join(
                    ' / '
                )
                : (
                    genreValue ||
                    ''
                );
            const duration = firstValue(
                movie.durationInMinutes,
                movie.duration,
                movie.runtime
            );
            const posterUrl = getPosterUrl(
                movie
            );
            const reason = buildPersonalizedReason(
                movie,
                data,
                city,
                weatherInfo
            );
            const card = document.createElement(
                'div'
            );
        card.className =
            'movie-card';
        card.tabIndex =
            0;
        card.setAttribute(
            'role',
            'button'
        );
        card.setAttribute(
            'aria-label',
            `${title} detaylarını aç`
        );
        card.innerHTML = `
            <!-- ÖNERİ NUMARASI -->
            <div class="movie-header">
                <span class="movie-number">
                        #${index + 1} Öneri
                </span>

                    ${
                        rating
                            ? `
                                <span class="movie-rating">
                                    ⭐
                                    ${escapeHtml(
                                        rating
                                    )}
                                </span>
                              `
                            : ''
                    }
                </div>

                <!-- POSTER -->
                <div class="movie-poster-container">
                    ${
                        posterUrl
                            ? `
                                <img
                                    src="${escapeHtml(
                                        posterUrl
                                    )}"
                                    alt="${escapeHtml(
                                        title
                                    )} posteri"
                                    loading="lazy"
                                >
                              `
                            : createPosterPlaceholder()
                    }
                </div>

                <!-- CONTENT BİLGİLERİ -->
                <div class="movie-card-content">
                    <div class="movie-title" title="${escapeHtml(title)}">
                        ${escapeHtml(
                            title
                        )}
                    </div>

                    ${
                        genre ||
                        duration
                            ? `
                                <div class="movie-meta">
                                    ${
                                        genre
                                            ? `
                                                <span>🎭${escapeHtml(genre)}</span>
                                              `
                                            : ''
                                    }
                                    ${
                                        duration
                                            ? `
                                                <span>⏱️${escapeHtml(duration)} dk</span>
                                              `
                                            : ''
                                    }
                                </div>
                              `
                            : ''
                    }

                    <!-- KİŞİSELLEŞTİRİLMİŞ SEBEP -->
                    <div class="movie-tag-wrapper">
                        <span class="movie-tag">🎯 Kişiselleştirilmiş Öneri</span>
                        <p class="personalized-reason">${escapeHtml(reason)}</p>
                    </div>
                </div>
            `;

            const openModal =
                () => {
                    openMovieModal(
                        movie
                    );
                };

            card.addEventListener(
                'click',
                openModal
            );

            card.addEventListener(
                'keydown',
                event => {
                    if (
                        event.key === 'Enter' ||
                        event.key === ' '
                    ) {
                        event.preventDefault();
                        openModal();
                    }
                }
            );
            grid.appendChild(
                card
            );
        }
    );
}

// VİTRİN ONAYLA
async function approveShowcase() {
    if (!currentShowcaseId) {

        alert(
            'Onaylanacak bir vitrin bulunamadı!'
        );
        return;
    }

    try {
        const response =
            await fetch(
                `${BASE_URL}/${currentShowcaseId}/approve`,
                {
                    method: 'POST',
                    headers: getAuthHeaders()
                }
            );

        if (
            handleUnauthorized(
                response
            )
        ) {
            return;
        }

        if (!response.ok) {
            throw new Error(
                `Onaylama başarısız. HTTP Status: ${response.status}`
            );
        }

        alert(
            '🎉 Vitrin başarıyla onaylandı ve yayına alındı!'
        );

        document
            .getElementById(
                'previewCard'
            )
            ?.classList.add(
                'hidden'
            );

    } catch (error) {
        console.error(
            'Vitrin onaylama hatası:',
            error
        );
        alert(
            'Onaylama işlemi sırasında bir hata oluştu.'
        );
    }
}