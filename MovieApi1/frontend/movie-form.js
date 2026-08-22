// 1. API Sabitleri ve Değişkenler
const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";

const searchBox = document.getElementById("searchBox");
const results = document.getElementById("searchResults");
const loading = document.getElementById("loading");

let timer = null;
let openedMovie = null;
let selectedMoviesMap = new Map(); // Seçilen filmleri (id/imdbId) tutar

// 2. JWT Token Alma Yardımcı Fonksiyonu
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// 3. Admin Guard Kontrolü
function checkAdminGuard() {
    const token = localStorage.getItem("jwtToken");
    const role = localStorage.getItem("userRole") || localStorage.getItem("activeRole");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    if (role !== "ADMIN" && role !== "ROLE_ADMIN") {
        alert("Bu sayfaya erişim yetkiniz yok!");
        window.location.href = "showcase.html";
        return false;
    }

    return true;
}

function checkAuthStatus() {
    const activeUserId = localStorage.getItem("activeUserId");
    const activeUsername = localStorage.getItem("activeUsername");

    const loginNavBtn = document.getElementById("loginNavBtn");
    const userProfileBar = document.getElementById("userProfileBar");
    const welcomeUserText = document.getElementById("welcomeUserText");

    if (activeUserId && activeUsername) {
        if (loginNavBtn) loginNavBtn.style.display = "none";
        if (userProfileBar) userProfileBar.style.display = "flex";
        if (welcomeUserText) welcomeUserText.textContent = `👤 ${activeUsername}`;
    } else {
        if (loginNavBtn) loginNavBtn.style.display = "inline-block";
        if (userProfileBar) userProfileBar.style.display = "none";
    }
}

// Sayfa Yüklendiğinde
document.addEventListener("DOMContentLoaded", () => {
    if (checkAdminGuard()) {
        checkAuthStatus();
    }
});

// Arama Kutusu Event Listener
if (searchBox) {
    searchBox.addEventListener("keyup", () => {
        clearTimeout(timer);
        const value = searchBox.value.trim();
        if (value.length < 2) {
            results.innerHTML = "";
            selectedMoviesMap.clear();
            removeBulkBar();
            return;
        }

        timer = setTimeout(() => {
            searchMovie(value);
        }, 400);
    });
}

// 4. İçerik Arama (GET - Protected)
async function searchMovie(title) {
    if (loading) loading.style.display = "block";
    results.innerHTML = "";
    selectedMoviesMap.clear();
    removeBulkBar();

    try {
        const response = await fetch(`${API}/search?title=${encodeURIComponent(title)}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        const movies = await response.json();
        if (loading) loading.style.display = "none";

        if (!movies || movies.length === 0) {
            results.innerHTML = `
                <div class="empty">
                    <h2>Sonuç bulunamadı</h2>
                    <p>Aradığınız içerik dış kaynaklarda veya kütüphanede bulunamadı.</p>
                    <button class="confirmBtn" id="btnCustomContent">
                        + Manuel İçerik Oluştur
                    </button>
                </div>
            `;
            const customBtn = document.getElementById("btnCustomContent");
            if (customBtn) {
                customBtn.addEventListener("click", () => {
                    if (typeof openCustomContentModal === "function") {
                        openCustomContentModal(searchBox.value.trim());
                    } else {
                        window.location.href = "movie-form.html";
                    }
                });
            }
            return;
        }

        // Dış kaynaklı içerikleri tespit et
        const externalMovies = movies.filter(m => m.source !== "DATABASE" && (m.imdbId || m.id));

        if (externalMovies.length > 0) {
            renderBulkBar(externalMovies);
        }

        let htmlBuffer = "";
        movies.forEach(movie => {
            htmlBuffer += createCard(movie);
        });

        results.innerHTML = htmlBuffer;

    } catch (error) {
        if (loading) loading.style.display = "none";
        console.error("Arama Hatası:", error);
    }
}

// Bulk Action Bar Bildirimi
function renderBulkBar(externalMovies) {
    let bulkContainer = document.getElementById("bulkActionBar");
    if (!bulkContainer) {
        bulkContainer = document.createElement("div");
        bulkContainer.id = "bulkActionBar";
        bulkContainer.className = "bulk-action-bar";
        results.parentNode.insertBefore(bulkContainer, results);
    }

    bulkContainer.innerHTML = `
        <div class="bulk-info">
            <label class="select-all-label">
                <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this)"> 
                <b>Tüm Dış Kaynakları Seç</b> (${externalMovies.length} İçerik)
            </label>
        </div>
        <button id="btnBulkImport" class="confirmBtn" disabled onclick="importSelectedMovies()">
            ⚡ Seçilenleri Aktar (0)
        </button>
    `;

    window.currentExternalMovies = externalMovies;
}

function removeBulkBar() {
    const bulkContainer = document.getElementById("bulkActionBar");
    if (bulkContainer) bulkContainer.remove();
}

// Kart Şablonu
function createCard(movie) {
    const isExternal = movie.source !== "DATABASE" && (movie.imdbId || movie.id);
    const movieKey = movie.imdbId || String(movie.id);

    let sourceText = "🌐 Dış Kaynak";
    if (movie.source === "DATABASE") {
        sourceText = "📚 Kütüphane";
    } else if (movie.source === "TMDB" || (movie.imdbId && !movie.imdbId.startsWith("tt"))) {
        sourceText = "🌐 TMDb";
    } else if (movie.source === "OMDB" || (movie.imdbId && movie.imdbId.startsWith("tt"))) {
        sourceText = "🌐 OMDb";
    }

    let posterUrl = movie.poster || movie.Poster;
    if (!posterUrl || posterUrl === "N/A") {
        posterUrl = "https://placehold.co/300x450?text=Poster";
    }

    return `
    <div class="search-card ${isExternal ? 'selectable' : ''}">
        ${isExternal ? `
            <div class="card-checkbox-wrapper">
                <input type="checkbox" class="movie-select-cb" data-key="${movieKey}" onchange="onCardSelectChange(this, '${movieKey}')">
            </div>
        ` : ''}
        <img src="${posterUrl}" onerror="this.src='https://placehold.co/300x450?text=Poster'">
        <div class="info">
            <h3>${movie.title || 'İsimsiz'}</h3>
            <p>📅 ${movie.year || '-'}</p>
            <p>🎬 ${movie.type || '-'}</p>
            <p class="source">${sourceText}</p>
            <button class="addMovie" onclick="showDetails(${movie.id || 'null'}, '${movie.imdbId || ''}', '${movie.source}')">
                Detayları Gör
            </button>
        </div>
    </div>
    `;
}

function onCardSelectChange(checkbox, movieKey) {
    if (checkbox.checked) {
        selectedMoviesMap.set(movieKey, true);
    } else {
        selectedMoviesMap.delete(movieKey);
    }
    updateBulkButtonState();
}

function toggleSelectAll(selectAllCb) {
    const checkboxes = document.querySelectorAll(".movie-select-cb");
    selectedMoviesMap.clear();

    checkboxes.forEach(cb => {
        cb.checked = selectAllCb.checked;
        if (selectAllCb.checked) {
            selectedMoviesMap.set(cb.dataset.key, true);
        }
    });

    updateBulkButtonState();
}

function updateBulkButtonState() {
    const btn = document.getElementById("btnBulkImport");
    const selectAllCb = document.getElementById("selectAllCheckbox");
    const count = selectedMoviesMap.size;

    if (btn) {
        btn.disabled = count === 0;
        btn.textContent = `⚡ Seçilenleri Aktar (${count})`;
    }

    if (selectAllCb && window.currentExternalMovies) {
        selectAllCb.checked = count > 0 && count === window.currentExternalMovies.length;
    }
}

// 5. Seçilenleri Toplu İçe Aktarma (POST - Protected)
async function importSelectedMovies() {
    const idsToImport = Array.from(selectedMoviesMap.keys());
    if (idsToImport.length === 0) return;

    if (loading) loading.style.display = "block";

    try {
        const response = await fetch(`${API}/import/bulk`, {
            method: "POST",
            headers: getAuthHeaders(), // JWT Token eklendi
            body: JSON.stringify(idsToImport)
        });

        if (loading) loading.style.display = "none";

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (response.ok) {
            const savedContents = await response.json();
            const count = savedContents.length || idsToImport.length;

            if (typeof showMessage === "function") {
                await showMessage("success", "Aktarım Başarılı", `${count} adet seçili içerik kütüphaneye aktarıldı.`);
            } else {
                alert(`${count} içerik başarıyla aktarıldı!`);
            }

            searchMovie(searchBox.value.trim());
        } else {
            alert("Toplu aktarım sırasında bir hata oluştu.");
        }
    } catch (error) {
        if (loading) loading.style.display = "none";
        console.error("Seçili Import Hatası:", error);
    }
}

// 6. Detay Gösterimi (GET - Protected)
async function showDetails(id, imdbId, source) {
    try {
        let url = (source === "DATABASE" && id && id !== "null")
            ? `${API}/${id}/details`
            : `${API}/details?imdbId=${encodeURIComponent(imdbId)}`;

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        const movie = await response.json();
        openedMovie = movie;
        openModal(movie);
    } catch (e) {
        console.error("Detay Hatası:", e);
    }
}

function openModal(movie) {
    const old = document.getElementById("movieModal");
    if (old) old.remove();

    let posterUrl = movie.poster || movie.Poster;
    if (!posterUrl || posterUrl === "N/A") {
        posterUrl = "https://placehold.co/300x450?text=Poster";
    }

    const isExternal = movie.source !== "DATABASE";

    document.body.insertAdjacentHTML("beforeend", `
        <div class="modal active" id="movieModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${movie.title || 'İsimsiz'}</h2>
                    <span class="closeModal" onclick="closeModal()">&times;</span>
                </div>
                <div class="edit-wrapper">
                    <div class="poster-panel">
                        <img src="${posterUrl}" onerror="this.src='https://placehold.co/300x450?text=Poster'">
                    </div>
                    <div class="form-panel">
                        <p><b>Puan:</b> ⭐ ${movie.rating ?? "-"}</p>
                        <p><b>Yıl:</b> ${movie.year ?? "-"}</p>
                        <p><b>Tür:</b> ${movie.genre ?? "-"}</p>
                        <p><b>Yönetmen:</b> ${movie.director ?? "-"}</p>
                        <p><b>Oyuncular:</b> ${movie.actors ?? "-"}</p>
                        <p><b>Kaynak:</b> ${movie.source === "DATABASE" ? "📚 Kütüphane" : `🌐 ${movie.source || "Dış Kaynak"}`}</p>
                        <br><p>${movie.plot ?? ""}</p>
                        <div class="modal-footer">
                            <button class="cancelBtn" onclick="closeModal()">Kapat</button>
                            ${isExternal ? `
                                <button class="confirmBtn" onclick="importMovie('${movie.imdbId || movie.id}')">
                                    Kütüphaneye Ekle
                                </button>
                            ` : ""}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function closeModal() {
    const modal = document.getElementById("movieModal");
    if (modal) modal.remove();
    openedMovie = null;
}

// 7. Tekli İçerik İçe Aktarma (POST - Protected)
async function importMovie(identifier) {
    try {
        const response = await fetch(`${API}/import?imdbId=${encodeURIComponent(identifier)}`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (response.ok) {
            closeModal();
            searchMovie(searchBox.value.trim());
        } else {
            alert("İçerik içe aktarılamadı.");
        }
    } catch (e) {
        console.error("Tekli Import Hatası:", e);
    }
}

// Oturum Süresi Dolduğunda Yönlendirme Yardımcısı
function handleUnauthorized() {
    alert("Oturum süreniz doldu veya bu işlem için yetkiniz yok.");
    localStorage.clear();
    window.location.href = "login.html";
}