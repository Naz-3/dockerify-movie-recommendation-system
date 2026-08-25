const BASE_URL =
    'https://dockerify-movie-recommendation-system.onrender.com/api/v1/showcases';

const USERS_URL =
    'https://dockerify-movie-recommendation-system.onrender.com/api/users';

const CONTENT_URL =
    'https://dockerify-movie-recommendation-system.onrender.com/api/content';

let currentShowcaseId = null;

let contentLibrary = [];


// ======================================================
// ŞEHİRLER
// ======================================================

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
    "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ",
    "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van",
    "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır",
    "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce",

    "Amsterdam", "Athens", "Baku", "Berlin", "Brussels", "Budapest",
    "Cairo", "Chicago", "Dubai", "Frankfurt", "Geneva", "Helsinki",
    "Kyiv", "London", "Los Angeles", "Madrid", "Milan", "Moscow",
    "Munich", "New York", "Oslo", "Paris", "Prague", "Rome", "Seoul",
    "Stockholm", "Tbilisi", "Tokyo", "Vienna", "Warsaw", "Washington",
    "Zurich"
];


// ======================================================
// SAYFA BAŞLANGICI
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    initMobileMenu();

    initUserDisplay();

    initGenerateButton();

    populateCityList();

    initMovieModal();

    checkAuthStatus();

    /*
     * ÖNEMLİ:
     * Diğer içerik sayfalarında poster bilgisi /api/content
     * üzerinden geliyor.
     *
     * user-panel.js içinde kullanılan yapı:
     *
     * item.poster || item.posterUrl
     *
     * Bu nedenle showcase açılırken mevcut content
     * kütüphanesini de yüklüyoruz.
     */
    await loadContentLibrary();

});


// ======================================================
// GENEL YARDIMCILAR
// ======================================================

function getAuthHeaders() {

    const token =
        localStorage.getItem("jwtToken") ||
        localStorage.getItem("token") ||
        "";

    const cleanToken =
        token.startsWith("Bearer ")
            ? token.substring(7)
            : token;

    return {
        "Content-Type": "application/json",

        ...(cleanToken
            ? {
                "Authorization":
                    `Bearer ${cleanToken}`
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
        "Oturum süreniz doldu veya yetkiniz yok. Lütfen tekrar giriş yapın."
    );

    logout();

    return true;

}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function firstValue(...values) {

    return values.find(
        value =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
    );

}


function normalizeMovie(movie) {

    if (
        typeof movie === "string"
    ) {

        return {
            title: movie
        };

    }

    return movie || {};

}


function formatMinutes(value) {

    const minutes =
        Number(value);

    if (
        !Number.isFinite(minutes) ||
        minutes <= 0
    ) {
        return "";
    }

    return `${Math.round(minutes)} dk`;

}


// ======================================================
// MOBİL MENÜ
// ======================================================

function initMobileMenu() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    if (
        !menuToggle ||
        !sidebar
    ) {
        return;
    }


    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "mobile-open"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                sidebar.classList.contains(
                    "mobile-open"
                ) &&
                !sidebar.contains(
                    event.target
                ) &&
                !menuToggle.contains(
                    event.target
                )
            ) {

                sidebar.classList.remove(
                    "mobile-open"
                );

            }

        }
    );

}


// ======================================================
// KULLANICI ARAYÜZÜ
// ======================================================

function initUserDisplay() {

    const activeUser =
        localStorage.getItem(
            "username"
        ) ||
        "user1";


    const userDisplay =
        document.getElementById(
            "activeUsernameDisplay"
        );


    if (userDisplay) {

        userDisplay.textContent =
            activeUser;

    }

}


function initGenerateButton() {

    const generateBtn =
        document.getElementById(
            "generateBtn"
        );


    if (!generateBtn) {
        return;
    }


    generateBtn.addEventListener(
        "click",
        generateShowcase
    );

}


function checkAuthStatus() {

    const activeUsername =
        localStorage.getItem(
            "username"
        ) ||
        localStorage.getItem(
            "activeUsername"
        );


    const loginNavBtn =
        document.getElementById(
            "loginNavBtn"
        );

    const userProfileBar =
        document.getElementById(
            "userProfileBar"
        );

    const welcomeUserText =
        document.getElementById(
            "welcomeUserText"
        );


    if (activeUsername) {

        if (loginNavBtn) {

            loginNavBtn.style.display =
                "none";

        }

        if (userProfileBar) {

            userProfileBar.style.display =
                "flex";

        }

        if (welcomeUserText) {

            welcomeUserText.textContent =
                `👤 ${activeUsername}`;

        }

    } else {

        if (loginNavBtn) {

            loginNavBtn.style.display =
                "inline-block";

        }

        if (userProfileBar) {

            userProfileBar.style.display =
                "none";

        }

    }

}


function logout() {

    localStorage.clear();

    window.location.href =
        "login.html";

}


// ======================================================
// CONTENT KÜTÜPHANESİNİ YÜKLE
// ======================================================

async function loadContentLibrary() {

    try {

        const response =
            await fetch(
                CONTENT_URL,
                {
                    method: "GET",
                    headers:
                        getAuthHeaders()
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
                `Content API başarısız. HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        contentLibrary =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data?.contents
                    )
                        ? data.contents
                        : []
                );


        console.log(
            "Content kütüphanesi yüklendi:",
            contentLibrary.length
        );


    } catch (error) {

        console.error(
            "Content kütüphanesi yüklenemedi:",
            error
        );

        /*
         * Bu hata showcase'i durdurmuyor.
         * Çünkü /showcases/suggest kendi content
         * objelerini döndürebilir.
         */

        contentLibrary = [];

    }

}


// ======================================================
// SHOWCASE CONTENT'İNİ MEVCUT CONTENT İLE EŞLEŞTİR
// ======================================================

function enrichMovieFromLibrary(
    movie
) {

    const original =
        normalizeMovie(
            movie
        );


    const movieId =
        firstValue(
            original.id,
            original.contentId
        );


    const movieTitle =
        firstValue(
            original.title,
            original.name
        );


    let libraryItem = null;


    /*
     * Önce ID ile eşleştiriyoruz.
     * En güvenilir yöntem bu.
     */

    if (movieId) {

        libraryItem =
            contentLibrary.find(
                item =>
                    String(item.id) ===
                    String(movieId)
            );

    }


    /*
     * ID yoksa başlık üzerinden eşleştiriyoruz.
     */

    if (
        !libraryItem &&
        movieTitle
    ) {

        const normalizedTitle =
            String(
                movieTitle
            )
            .trim()
            .toLowerCase();


        libraryItem =
            contentLibrary.find(
                item => {

                    const title =
                        firstValue(
                            item.title,
                            item.name
                        );


                    return (
                        title &&
                        String(title)
                            .trim()
                            .toLowerCase() ===
                        normalizedTitle
                    );

                }
            );

    }


    /*
     * Library'deki gerçek content bilgisini
     * öneri objesiyle birleştiriyoruz.
     *
     * ÖNERİ OBJESİNDE gelen alanlar öncelikli.
     * Eksik alanlar library'den tamamlanıyor.
     */

    if (libraryItem) {

        return {
            ...libraryItem,
            ...original
        };

    }


    return original;

}


// ======================================================
// KULLANICI DROPDOWN
// ======================================================

async function loadUsersDropdown() {

    const userSelect =
        document.getElementById(
            "userSelect"
        );


    if (!userSelect) {
        return;
    }


    try {

        const response =
            await fetch(
                USERS_URL,
                {
                    method: "GET",
                    headers:
                        getAuthHeaders()
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
                `Kullanıcılar getirilemedi. HTTP ${response.status}`
            );

        }


        const users =
            await response.json();


        userSelect.innerHTML =
            "";


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
                "activeUserId"
            );


        users.forEach(
            user => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    user.id;


                const name =
                    firstValue(
                        user.username,
                        user.fullName,
                        user.name,
                        user.email,
                        `Kullanıcı #${user.id}`
                    );


                const city =
                    user.city
                        ? ` (${user.city})`
                        : "";


                option.textContent =
                    `${name}${city}`;


                option.dataset.city =
                    user.city || "";


                if (
                    activeUserId &&
                    user.id ==
                    activeUserId
                ) {

                    option.selected =
                        true;

                }


                userSelect.appendChild(
                    option
                );

            }
        );


        const selectedOption =
            userSelect.options[
                userSelect.selectedIndex
            ];


        if (
            selectedOption &&
            selectedOption.dataset.city
        ) {

            const cityInput =
                document.getElementById(
                    "cityInput"
                );


            if (cityInput) {

                cityInput.value =
                    selectedOption.dataset.city;

            }

        }


    } catch (error) {

        console.error(
            "Kullanıcı yükleme hatası:",
            error
        );


        userSelect.innerHTML =
            '<option value="">Yükleme Başarısız!</option>';

    }

}


// ======================================================
// KULLANICI DEĞİŞTİR
// ======================================================

function onUserChange(event) {

    const userSelect =
        event.target;


    const selectedOption =
        userSelect.options[
            userSelect.selectedIndex
        ];


    if (
        !selectedOption ||
        !selectedOption.value
    ) {
        return;
    }


    const userId =
        userSelect.value;


    const userName =
        selectedOption.text
            .split(" (")[0];


    const userCity =
        selectedOption.dataset.city;


    localStorage.setItem(
        "activeUserId",
        userId
    );


    localStorage.setItem(
        "username",
        userName
    );


    if (userCity) {

        const cityInput =
            document.getElementById(
                "cityInput"
            );


        if (cityInput) {

            cityInput.value =
                userCity;

        }

    }


    checkAuthStatus();

}


// ======================================================
// AKTİF KULLANICI
// ======================================================

function getActiveUserId() {

    const userSelect =
        document.getElementById(
            "userSelect"
        );


    if (
        userSelect &&
        userSelect.value
    ) {

        return userSelect.value;

    }


    return (
        localStorage.getItem(
            "activeUserId"
        ) ||
        "1"
    );

}


function getActiveUserName() {

    const userSelect =
        document.getElementById(
            "userSelect"
        );


    if (
        userSelect &&
        userSelect.selectedIndex !== -1 &&
        userSelect.options[
            userSelect.selectedIndex
        ]
    ) {

        return userSelect
            .options[
                userSelect.selectedIndex
            ]
            .text
            .split(" (")[0];

    }


    return (
        localStorage.getItem(
            "username"
        ) ||
        localStorage.getItem(
            "activeUsername"
        ) ||
        "Kullanıcı"
    );

}


// ======================================================
// ŞEHİR LİSTESİ
// ======================================================

function populateCityList() {

    const datalist =
        document.getElementById(
            "cityList"
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
            .join("");

}


// ======================================================
// HAVA DURUMU
// ======================================================

function parseWeatherData(
    rawWeatherText
) {

    if (!rawWeatherText) {

        return {
            icon: "🌤️",
            text: "Bilinmiyor",
            temp: "",
            humidity: ""
        };

    }


    const parts =
        String(
            rawWeatherText
        )
        .split("|")
        .map(
            value =>
                value.trim()
        );


    const condition =
        parts[0] ||
        "Clear";


    const temp =
        parts[1] ||
        "";


    const humidity =
        parts[2] ||
        "";


    const conditionMap = {

        Clear: {
            text: "Açık",
            icon: "☀️"
        },

        Clouds: {
            text: "Bulutlu",
            icon: "☁️"
        },

        Rain: {
            text: "Yağmurlu",
            icon: "🌧️"
        },

        Snow: {
            text: "Kar Yağışlı",
            icon: "❄️"
        },

        Thunderstorm: {
            text: "Fırtınalı",
            icon: "⛈️"
        },

        Drizzle: {
            text: "Çiseleyen",
            icon: "🌦️"
        }

    };


    const matched =
        conditionMap[
            condition
        ] || {
            text: condition,
            icon: "🌤️"
        };


    return {

        icon:
            matched.icon,

        text:
            matched.text,

        temp,

        humidity

    };

}


// ======================================================
// POSTER
// ======================================================

function getPosterUrl(movie) {

    if (
        !movie ||
        typeof movie === "string"
    ) {
        return "";
    }


    /*
     * BURASI DİĞER İÇERİK SAYFALARINDAKİ
     * GERÇEK VERİ YAPISINA GÖRE DÜZENLENDİ.
     *
     * user-panel.js:
     *
     * item.poster || item.posterUrl
     *
     * kullanıyor.
     *
     * Dolayısıyla showcase de öncelikle
     * aynı alanları kullanıyor.
     */

    const poster =
        firstValue(
            movie.poster,
            movie.posterUrl,
            movie.posterURL,

            /*
             * TMDB poster_path doğrudan gelirse
             * bunu da destekliyoruz.
             */

            movie.posterPath,
            movie.poster_path
        );


    if (!poster) {
        return "";
    }


    const value =
        String(poster);


    /*
     * Backend zaten tam URL veriyorsa
     * dokunmuyoruz.
     */

    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        )
    ) {

        return value;

    }


    /*
     * Sadece TMDB path gelirse
     * TMDB CDN adresini tamamlıyoruz.
     */

    if (
        value.startsWith("/")
    ) {

        return (
            "https://image.tmdb.org/t/p/w500" +
            value
        );

    }


    return value;

}


// ======================================================
// CONTENT AÇIKLAMASI
// ======================================================

function getDescription(movie) {

    if (
        !movie ||
        typeof movie === "string"
    ) {

        return (
            "Bu içerik için henüz bir açıklama bulunmuyor."
        );

    }


    return (
        firstValue(
            movie.description,
            movie.overview,
            movie.summary,
            movie.plot,
            movie.synopsis
        ) ||
        "Bu içerik için henüz bir açıklama bulunmuyor."
    );

}


// ======================================================
// BAŞROLLER
// ======================================================

function getCast(movie) {

    if (
        !movie ||
        typeof movie === "string"
    ) {

        return [];

    }


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


    if (
        Array.isArray(cast)
    ) {

        return cast
            .map(
                actor => {

                    if (
                        typeof actor === "string"
                    ) {

                        return actor;

                    }


                    return firstValue(
                        actor?.name,
                        actor?.originalName,
                        actor?.actorName
                    );

                }
            )
            .filter(Boolean)
            .slice(0, 6);

    }


    return String(cast)
        .split(",")
        .map(
            name =>
                name.trim()
        )
        .filter(Boolean)
        .slice(0, 6);

}


// ======================================================
// ŞİMDİ İZLE URL
// ======================================================

function getWatchUrl(movie) {

    if (
        !movie ||
        typeof movie === "string"
    ) {

        return "";

    }


    return (
        firstValue(
            movie.watchUrl,
            movie.watchURL,
            movie.videoUrl,
            movie.videoURL,
            movie.contentUrl,
            movie.detailUrl,
            movie.url
        ) ||
        ""
    );

}


// ======================================================
// COLLECTION İÇİNDE CONTENT ARAMA
// ======================================================

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
        String(title)
            .trim()
            .toLowerCase();


    if (
        Array.isArray(collection)
    ) {

        return collection.some(
            item => {

                const itemTitle =
                    typeof item === "string"
                        ? item
                        : firstValue(
                            item?.title,
                            item?.name,
                            item?.contentTitle
                        );


                return (
                    itemTitle &&
                    String(itemTitle)
                        .trim()
                        .toLowerCase() ===
                    target
                );

            }
        );

    }


    return String(
        collection
    )
        .toLowerCase()
        .includes(target);

}


// ======================================================
// KİŞİSELLEŞTİRİLMİŞ ÖNERİ SEBEBİ
// ======================================================

function buildPersonalizedReason(
    movie,
    data,
    city,
    weatherInfo
) {

    const title =
        firstValue(
            movie?.title,
            movie?.name,
            "Bu içerik"
        );


    /*
     * Backend doğrudan öneri sebebi
     * gönderiyorsa onu kullan.
     */

    const backendReason =
        firstValue(
            movie?.recommendationReason,
            movie?.personalizedReason,
            movie?.reason,
            movie?.explanation,
            movie?.whyRecommended
        );


    if (backendReason) {

        return String(
            backendReason
        );

    }


    const profile =
        firstValue(
            data?.userProfile,
            data?.userSignals,
            data?.userBehavior,
            data?.personalization,
            data?.userHistory
        ) || {};


    const history =
        firstValue(
            profile.watchHistory,
            profile.history,
            data?.watchHistory,
            data?.history
        );


    const favorites =
        firstValue(
            profile.favorites,
            profile.favoriteContents,
            data?.favorites,
            data?.favoriteContents
        );


    const watchlist =
        firstValue(
            profile.watchlist,
            profile.toWatch,
            data?.watchlist,
            data?.toWatch
        );


    const unfinished =
        firstValue(
            profile.unfinished,
            profile.partiallyWatched,
            data?.unfinished,
            data?.partiallyWatched
        );


    const watchTime =
        firstValue(
            profile.totalWatchMinutes,
            profile.watchedMinutes,
            profile.watchDuration,
            data?.totalWatchMinutes,
            data?.watchedMinutes
        );


    const genre =
        firstValue(
            movie?.genre,
            movie?.genres
        );


    const duration =
        firstValue(
            movie?.durationInMinutes,
            movie?.duration,
            movie?.runtime
        );


    const reasons = [];


    /*
     * FAVORİLER
     */

    if (
        containsTitle(
            favorites,
            title
        ) ||
        movie?.matchesFavoriteGenre ||
        movie?.favoriteGenreMatch
    ) {

        reasons.push(
            "favori tercihlerinizle örtüşüyor"
        );

    }


    /*
     * DAHA SONRA İZLE
     */

    if (
        containsTitle(
            watchlist,
            title
        ) ||
        movie?.inWatchlist
    ) {

        reasons.push(
            "Daha Sonra İzle listenizle ilişkili"
        );

    }


    /*
     * İZLEME GEÇMİŞİ
     */

    if (
        containsTitle(
            history,
            title
        )
    ) {

        reasons.push(
            "izleme geçmişinizle bağlantılı"
        );

    }


    /*
     * YARIM BIRAKILAN İÇERİKLER
     */

    if (
        (
            Array.isArray(
                unfinished
            ) &&
            unfinished.length > 0
        ) ||
        movie?.matchesUnfinishedContent
    ) {

        reasons.push(
            "yarım bıraktığınız içeriklerden çıkarılan eğilimlerle uyumlu"
        );

    }


    /*
     * TOPLAM İZLEME SÜRESİ
     */

    if (watchTime) {

        reasons.push(
            `toplam ${formatMinutes(watchTime)} izleme alışkanlığınız dikkate alındı`
        );

    }


    /*
     * TÜR
     */

    if (genre) {

        const genreText =
            Array.isArray(genre)
                ? genre.join(" / ")
                : genre;


        reasons.push(
            `${genreText} türü tercihlerinizle eşleşiyor`
        );

    }


    /*
     * İÇERİK SÜRESİ
     */

    if (duration) {

        reasons.push(
            `${formatMinutes(duration)} civarındaki içerik sürenize uygun`
        );

    }


    /*
     * HAVA DURUMU
     */

    if (
        weatherInfo?.text &&
        weatherInfo.text !==
            "Bilinmiyor"
    ) {

        const weatherMap = {

            Yağmurlu:
                "yağmurlu hava",

            "Kar Yağışlı":
                "soğuk ve karlı hava",

            Fırtınalı:
                "fırtınalı hava",

            Bulutlu:
                "kapalı hava",

            Açık:
                "açık hava",

            Çiseleyen:
                "çiseleyen hava"

        };


        const weatherReason =
            weatherMap[
                weatherInfo.text
            ] ||
            weatherInfo.text.toLowerCase();


        reasons.push(
            `${city} için mevcut ${weatherReason} koşulları`
        );

    }


    /*
     * En fazla üç sinyal gösteriyoruz.
     */

    const selectedReasons =
        reasons.slice(0, 3);


    if (
        selectedReasons.length === 0
    ) {

        return (
            `${title}, izleme alışkanlıklarınız ` +
            `ve ${city} için mevcut hava ` +
            `koşulları birlikte değerlendirilerek önerildi.`
        );

    }


    if (
        selectedReasons.length === 1
    ) {

        return (
            `${title}, ` +
            `${selectedReasons[0]} ` +
            `olduğu için size önerildi.`
        );

    }


    return (
        `${title}, ` +
        `${selectedReasons
            .slice(0, 2)
            .join(" ve ")} ` +
        `olduğu için size önerildi.`
    );

}


// ======================================================
// SHOWCASE CONTENT ARRAY
// ======================================================

function getMovieArray(data) {

    return [

        data?.contents,

        data?.movies,

        data?.recommendations,

        data?.movieTitles

    ].find(
        Array.isArray
    ) || [];

}


// ======================================================
// POSTER PLACEHOLDER
// ======================================================

function createPosterPlaceholder() {

    return `
        <div class="movie-poster-placeholder">

            <span>🎬</span>

            <small>
                Poster bulunamadı
            </small>

        </div>
    `;

}


// ======================================================
// CONTENT DETAY MODALI
// ======================================================

function openMovieModal(
    rawMovie
) {

    const movie =
        enrichMovieFromLibrary(
            rawMovie
        );


    const modal =
        document.getElementById(
            "movieModal"
        );


    if (!modal) {
        return;
    }


    const title =
        firstValue(
            movie.title,
            movie.name,
            "İsimsiz İçerik"
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
            movie.releaseDate,
            movie.firstAirDate
        );


    const cast =
        getCast(
            movie
        );


    const titleEl =
        document.getElementById(
            "modalMovieTitle"
        );


    const descriptionEl =
        document.getElementById(
            "modalMovieDescription"
        );


    const posterEl =
        document.getElementById(
            "modalMoviePoster"
        );


    const metaEl =
        document.getElementById(
            "modalMovieMeta"
        );


    const castEl =
        document.getElementById(
            "modalMovieCast"
        );


    const watchBtn =
        document.getElementById(
            "modalWatchBtn"
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
            poster || "";


        posterEl.alt =
            poster
                ? `${title} posteri`
                : "";


        posterEl.style.display =
            poster
                ? "block"
                : "none";

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
                        Array.isArray(
                            genre
                        )
                            ? genre.join(
                                " / "
                            )
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
                            .substring(0, 4)
                    )
                }`
            );

        }


        metaEl.innerHTML =
            meta
                .map(
                    value =>
                        `<span>${value}</span>`
                )
                .join("");

    }


    if (castEl) {

        castEl.innerHTML =
            cast.length
                ? `
                    <strong>
                        🎬 Başroller:
                    </strong>

                    ${cast
                        .map(
                            escapeHtml
                        )
                        .join(", ")}
                `
                : "";

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
                movie.tmdbId
            ) || "";

    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


// ======================================================
// MODAL KAPAT
// ======================================================

function closeMovieModal() {

    const modal =
        document.getElementById(
            "movieModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


// ======================================================
// ŞİMDİ İZLE
// ======================================================

function handleWatchClick() {

    const button =
        document.getElementById(
            "modalWatchBtn"
        );


    if (!button) {
        return;
    }


    const watchUrl =
        button.dataset.watchUrl;


    const contentId =
        button.dataset.contentId;


    if (watchUrl) {

        window.open(
            watchUrl,
            "_blank",
            "noopener,noreferrer"
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
        "Bu içerik için izleme bağlantısı bulunamadı."
    );

}


// ======================================================
// MODAL EVENTLERİ
// ======================================================

function initMovieModal() {

    const modal =
        document.getElementById(
            "movieModal"
        );


    const closeBtn =
        document.getElementById(
            "modalCloseBtn"
        );


    const watchBtn =
        document.getElementById(
            "modalWatchBtn"
        );


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            closeMovieModal
        );

    }


    if (watchBtn) {

        watchBtn.addEventListener(
            "click",
            handleWatchClick
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeMovieModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal &&
                !modal.classList.contains(
                    "hidden"
                )
            ) {
                closeMovieModal();
            }
        }
    );
}

// SHOWCASE OLUŞTUR
async function generateShowcase() {
    const cityInput =
        document.getElementById(
            "cityInput"
        );

    const city =
        cityInput?.value.trim() ||
        "";

    const userId =
        getActiveUserId();

    const selectedUserName =
        getActiveUserName();

    if (!city) {
        alert(
            "Lütfen bir şehir adı giriniz!"
        );
        return;
    }

    const loading =
        document.getElementById(
            "loading"
        );

    const previewCard =
        document.getElementById(
            "previewCard"
        );

    loading?.classList.remove(
        "hidden"
    );

    previewCard?.classList.add(
        "hidden"
    );

    try {

        /*ÖNCE ÖNERİ ENDPOINTİ*/
        const response =
            await fetch(
                `${BASE_URL}/suggest?city=${encodeURIComponent(
                    city
                )}&userId=${encodeURIComponent(
                    userId
                )}`,
                {
                    method: "GET",
                    headers:
                        getAuthHeaders()
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
            "Showcase API Response:",
            data
        );

        currentShowcaseId =
            data.showcaseId;

        /* HAVA DURUMU*/
        const rawWeather =
            (
                data.triggerReason ||
                ""
            )
            .replace(
                "AI Direktör Önerisi - ",
                ""
            );

        const weatherInfo =
            parseWeatherData(
                rawWeather
            );

        /*BAŞLIK*/
        const titleEl =
            document.getElementById(
                "showcaseTitle"
            );

        if (titleEl) {

            titleEl.textContent =
                data.title ||
                "Haftanın Öne Çıkanları (Sistem Önerisi)";
        }

        /*HAVA DURUMU PANELİ*/
        const trigger =
            document.getElementById(
                "triggerReason"
            );

        if (trigger) {

            trigger.innerHTML = `

                <div class="weather-card-inline">
                    <span class="user-badge">
                        👤
                        ${escapeHtml(
                            selectedUserName
                        )}
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
                            : ""
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
                            : ""
                    }
                </div>
            `;
        }

        /*ÖNERİLER*/
        const grid =
            document.getElementById(
                "movieGrid"
            );

        if (!grid) {
            return;
        }

        grid.innerHTML =
            "";

        const rawMovies =
            getMovieArray(
                data
            );

        if (
            rawMovies.length === 0
        ) {

            grid.innerHTML = `
                <p class="no-content-alert">
                    ⚠️ Bu kriterlere uygun
                    vitrin içeriği bulunamadı.
                </p>
            `;

            previewCard?.classList.remove(
                "hidden"
            );
            return;
        }

        rawMovies
            .slice(0, 3)
            .forEach(
                (rawMovie, index) => {
                    const movie =
                        enrichMovieFromLibrary(
                            rawMovie
                        );

                    const title =
                        firstValue(
                            movie.title,
                            movie.name,
                            "İsimsiz İçerik"
                        );

                    const rating =
                        firstValue(
                            movie.rating,
                            movie.voteAverage,
                            movie.score
                        );

                    const genreValue =
                        firstValue(
                            movie.genre,
                            movie.genres
                        );

                    const genre =
                        Array.isArray(
                            genreValue
                        )
                            ? genreValue.join(
                                " / "
                            )
                            : (
                                genreValue ||
                                ""
                            );

                    const duration =
                        firstValue(
                            movie.durationInMinutes,
                            movie.duration,
                            movie.runtime
                        );

                    const posterUrl =
                        getPosterUrl(
                            movie
                        );

                    const reason =
                        buildPersonalizedReason(
                            movie,
                            data,
                            city,
                            weatherInfo
                        );

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "movie-card";

                    card.tabIndex =
                        0;

                    card.setAttribute(
                        "role",
                        "button"
                    );

                    card.setAttribute(
                        "aria-label",
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
                                    : ""
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
                                            onerror="
                                                this.style.display='none';
                                                this.parentElement.innerHTML='<div class=&quot;movie-poster-placeholder&quot;><span>🎬</span><small>Poster yüklenemedi</small></div>';
                                            "
                                        >
                                      `
                                    : createPosterPlaceholder()
                            }
                        </div>

                        <!-- CONTENT BİLGİLERİ -->
                        <div class="movie-card-content">
                            <div
                                class="movie-title"
                                title="${escapeHtml(
                                    title
                                )}"
                            >
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
                                                        <span>
                                                            🎭
                                                            ${escapeHtml(
                                                                genre
                                                            )}
                                                        </span>
                                                      `
                                                    : ""
                                            }

                                            ${
                                                duration
                                                    ? `
                                                        <span>
                                                            ⏱️
                                                            ${escapeHtml(
                                                                duration
                                                            )} dk
                                                        </span>
                                                      `
                                                    : ""
                                            }
                                        </div>
                                      `
                                    : ""
                            }

                            <!-- KİŞİSELLEŞTİRİLMİŞ ÖNERİ -->
                            <div class="movie-tag-wrapper">
                                <span class="movie-tag">
                                    🎯
                                    Kişiselleştirilmiş Öneri
                                </span>
                                <p class="personalized-reason">
                                    ${escapeHtml(
                                        reason
                                    )}
                                </p>
                            </div>
                        </div>
                    `;
                    /*CONTENT'E TIKLANINCA MODAL*/
                    const openDetails =
                        () => {
                            openMovieModal(
                                movie
                            );
                        };

                    card.addEventListener(
                        "click",
                        openDetails
                    );

                    card.addEventListener(
                        "keydown",
                        event => {
                            if (
                                event.key ===
                                    "Enter" ||
                                event.key ===
                                    " "
                            ) {
                                event.preventDefault();
                                openDetails();
                            }
                        }
                    );

                    grid.appendChild(
                        card
                    );
                }
            );

        previewCard?.classList.remove(
            "hidden"
        );

    } catch (error) {

        console.error(
            "Showcase oluşturma hatası:",
            error
        );

        alert(
            "Vitrin oluşturulurken bir hata meydana geldi!"
        );

    } finally {
        loading?.classList.add(
            "hidden"
        );
    }
}

// SHOWCASE ONAYLA
async function approveShowcase() {
    if (!currentShowcaseId) {
        alert(
            "Onaylanacak bir vitrin bulunamadı!"
        );
        return;
    }

    try {

        const response =
            await fetch(
                `${BASE_URL}/${currentShowcaseId}/approve`,
                {
                    method: "POST",
                    headers:
                        getAuthHeaders()
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
                `Onaylama başarısız. HTTP ${response.status}`
            );
        }

        alert(
            "🎉 Vitrin başarıyla onaylandı ve yayına alındı!"
        );

        const previewCard =
            document.getElementById(
                "previewCard"
            );

        previewCard?.classList.add(
            "hidden"
        );

    } catch (error) {

        console.error(
            "Vitrin onaylama hatası:",
            error
        );

        alert(
            "Onaylama işlemi sırasında bir hata oluştu."
        );
    }
}