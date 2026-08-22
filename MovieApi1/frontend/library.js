// 1. API Sabitleri ve Başlangıç Değişkenleri
const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";

const grid = document.getElementById("libraryGrid");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");

let movies = [];

// 2. JWT Token alma yardımcı fonksiyonu
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// 3. Poster URL yardımcı fonksiyonu
function getPosterUrl(movie) {
    const poster =
        movie.poster ||
        movie.Poster ||
        movie.posterUrl ||
        movie.posterURL ||
        movie.image ||
        "";

    // Poster bilgisi yoksa placeholder göster
    if (!poster) {
        return "https://placehold.co/300x450?text=Poster";
    }

    // TMDB sadece "/xxxxx.jpg" şeklinde path gönderiyorsa
    if (poster.startsWith("/")) {
        return `https://image.tmdb.org/t/p/w500${poster}`;
    }

    // Zaten tam URL ise olduğu gibi kullan
    return poster;
}

// 4. Oturum Koruma (Auth Guard) - Token yoksa login sayfasına yönlendirir
function checkAuthGuard() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "login.html";
    }
}

// 5. Sayfa Yüklendiğinde Oturum Kontrolü ve Veri Çekme
window.onload = () => {
    checkAuthGuard();
    loadMovies();
};

// 6. İçerikleri Getiren Fonksiyon (GET - Protected)
async function loadMovies() {
    try {
        const response = await fetch(API, {
            method: "GET",
            headers: getAuthHeaders()
        });

        // Oturum geçersiz veya süresi dolmuşsa
        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(`İçerikler yüklenemedi. HTTP Status: ${response.status}`);
        }

        movies = await response.json();
        renderMovies();

    } catch (error) {
        console.error("Film yükleme hatası:", error);
    }
}

// 7. İçerikleri Arayüzde Listeleyen Fonksiyon
function renderMovies() {
    let list = [...movies];
    const search = searchInput ? searchInput.value.toLowerCase() : "";

    if (search !== "") {
        list = list.filter(movie =>
            movie.title && movie.title.toLowerCase().includes(search)
        );
    }

    if (typeFilter && typeFilter.value !== "all") {
        list = list.filter(movie =>
            movie.type &&
            movie.type.toLowerCase() === typeFilter.value
        );
    }

    if (sortFilter) {
        switch (sortFilter.value) {

            case "title":
                list.sort((a, b) =>
                    (a.title || "").localeCompare(b.title || "")
                );
                break;

            case "rating":
                list.sort((a, b) =>
                    (b.rating || 0) - (a.rating || 0)
                );
                break;

            case "year":
                list.sort((a, b) =>
                    (b.year || 0) - (a.year || 0)
                );
                break;
        }
    }

    if (!grid) return;

    grid.innerHTML = "";

    if (list.length === 0) {
        grid.innerHTML = `
        <div class="empty">
            <h2>Sonuç bulunamadı</h2>
            <p>Filtrelere uygun içerik yok.</p>
        </div>
        `;
        return;
    }

    list.forEach(movie => {

        // Çeviri fonksiyonu t() yoksa çökmemesi için güvenli kontrol
        const typeText =
            typeof t === "function"
                ? t((movie.type || "").toLowerCase())
                : (movie.type || "-");

        const detailsText =
            typeof t === "function"
                ? t("details")
                : "Detaylar";

        const syncText =
            typeof t === "function"
                ? t("sync")
                : "Senkronize Et";

        const deleteText =
            typeof t === "function"
                ? t("deleteContant")
                : "Sil";

        // Poster URL'sini güvenli şekilde oluştur
        const posterUrl = getPosterUrl(movie);

        grid.innerHTML += `
        <div class="library-card">

            <img 
                src="${posterUrl}" 
                alt="${movie.title || "Poster"}"
                class="library-poster"
                onerror="this.onerror=null; this.src='https://placehold.co/300x450?text=Poster';"
            >

            <div class="library-info">

                <h3>${movie.title || "İsimsiz"}</h3>

                <p>📅 ${movie.year ?? "-"}</p>

                <p>🎬 ${typeText}</p>

                <p>⭐ ${movie.rating ?? "-"}</p>

                <p>🎭 ${
                    Array.isArray(movie.actors)
                        ? movie.actors.map(actor => actor.name).join(", ")
                        : "-"
                }</p>

                <div class="library-actions">

                    <button 
                        class="details-btn" 
                        onclick="viewDetails(${movie.id})">
                        ${detailsText}
                    </button>

                    <div class="action-row">

                        <button 
                            class="sync" 
                            onclick="syncMovie(${movie.id})">
                            ${syncText}
                        </button>

                        <button 
                            class="delete" 
                            onclick="deleteMovie(${movie.id})">
                            ${deleteText}
                        </button>

                    </div>

                </div>
            </div>
        </div>
        `;
    });
}

// 8. Event Listener'lar
if (searchInput) searchInput.addEventListener("keyup", renderMovies);
if (typeFilter) typeFilter.addEventListener("change", renderMovies);
if (sortFilter) sortFilter.addEventListener("change", renderMovies);

// 9. Yönlendirme Fonksiyonları
function editMovie(id) {
    window.location.href = `edit-content.html?id=${id}`;
}

function viewDetails(id) {
    window.location.href = `content-details.html?id=${id}`;
}

// 10. İçerik Silme Fonksiyonu (DELETE - Protected)
async function deleteMovie(id) {
    if (!confirm("Bu içerik silinsin mi?")) return;

    try {
        const response = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            alert("Bu işlem için yetkiniz yok veya oturumunuz doldu.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Silme işlemi başarısız.");
        }

        loadMovies();

    } catch (error) {
        console.error("Silme hatası:", error);
    }
}

// 11. Senkronizasyon Fonksiyonu (PATCH - Protected)
async function syncMovie(id) {
    try {
        const response = await fetch(`${API}/sync/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            alert("Bu işlem için yetkiniz yok.");
            return;
        }

        if (!response.ok) {
            if (typeof showMessage === "function") {
                await showMessage(
                    "error",
                    "İçe Aktarma Başarısız",
                    "İçerik içe aktarılamadı."
                );
            } else {
                alert("İçerik içe aktarılamadı.");
            }

            return;
        }

        if (typeof showMessage === "function") {
            await showMessage(
                "success",
                "Senkronizasyon Tamamlandı",
                "Bölüm OMDb ile başarıyla senkronize edildi."
            );
        } else {
            alert("Bölüm OMDb ile başarıyla senkronize edildi.");
        }

        loadMovies();

    } catch (error) {
        console.error("Sync hatası:", error);

        if (typeof showMessage === "function") {
            await showMessage(
                "error",
                "Sunucu Hatası",
                "Sunucuya ulaşılamadı."
            );
        } else {
            alert("Sunucuya ulaşılamadı.");
        }
    }
}