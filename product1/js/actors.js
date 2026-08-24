const API = "https://dockerify-movie-recommendation-system.onrender.com/api/actors";

let editingActorId = null;
let deletingActorId = null;

const actorSearch = document.getElementById("actorSearch");
const actorsGrid = document.getElementById("actorsGrid");

let actors = [];

// 1. JWT Token alma yardımcı fonksiyonu
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// 2. Oturum Koruma (Auth Guard)
function checkAuthGuard() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// 3. Yetkisiz Erişim / Süresi Dolan Token Yönetimi
function handleUnauthorized() {
    alert("Oturum süreniz doldu veya bu işlem için yetkiniz yok.");
    localStorage.clear();
    window.location.href = "login.html";
}

function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

function initials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function renderActors() {
    if (!actorSearch || !actorsGrid) return;

    const query = actorSearch.value.trim().toLocaleLowerCase("tr");
    const filtered = actors.filter(actor =>
        actor.name.toLocaleLowerCase("tr").includes(query)
    );

    if (filtered.length === 0) {
        actorsGrid.innerHTML = `
            <div class="empty-actors">
                <h2>${typeof t === "function" ? t("noActors") : "Henüz oyuncu bulunamadı."}</h2>
                <p>${typeof t === "function" ? t("actorHint") : "İçerik ekledikçe oyuncular burada listelenecek."}</p>
            </div>
        `;
        return;
    }

    actorsGrid.innerHTML = filtered.map(actor => {
        // Backend DTO isim farklılıklarına karşı esnek okuma
        const movieCount = actor.movieCount ?? actor.totalMovies ?? 0;
        const seriesCount = actor.seriesCount ?? actor.totalSeries ?? 0;
        const highestRating = actor.highestRating ?? actor.topRating ?? "-";
        const topMovieTitle = actor.topMovie?.title || actor.topMovieTitle || actor.mostPopularMovie || "-";

        return `
        <article class="actor-card">
            <div class="actor-info">
                <h3>${escapeHtml(actor.name)}</h3>
                <div class="actor-stats">
                    <p>🎬 <b>${typeof t === "function" ? t("movie") : "Film"}:</b> ${movieCount}</p>
                    <p>📺 <b>${typeof t === "function" ? t("series") : "Dizi"}:</b> ${seriesCount}</p>
                    <p>⭐ <b>${typeof t === "function" ? t("highestImdb") : "En Yüksek IMDb"}:</b> ${highestRating}</p>
                    <p>🏆 <b>${typeof t === "function" ? t("mostPopular") : "En Popüler"}:</b> ${escapeHtml(topMovieTitle)}</p>
                </div>
                <div class="actor-actions">
                    <button class="primary-btn" onclick="showFilmography(${actor.id})">
                        ${typeof t === "function" ? t("viewFilmography") : "Filmografiyi Gör"}
                    </button>
                    <button class="icon-btn" onclick="editActor(${actor.id})">
                        ${typeof t === "function" ? t("edit") : "Düzenle"}
                    </button>
                    <button class="icon-btn danger" onclick="deleteActor(${actor.id})">
                        ${typeof t === "function" ? t("deleteActor") : "Sil"}
                    </button>
                </div>
            </div>
        </article>
        `;
    }).join("");
}

function showFilmography(actorId) {
    const actor = actors.find(a => a.id === actorId);
    if (!actor) return;
    document.getElementById("actorFilmographyModal")?.remove();

    const filmographyList = actor.filmography || actor.contents || [];
    const filmography = filmographyList.map(movie => `
        <li>
            <span>${escapeHtml(movie.title)}</span>
            <strong>⭐ ${movie.rating ?? movie.imdbRating ?? "-"}</strong>
            <small>
                ${escapeHtml(movie.year ?? movie.releaseYear ?? "-")}
                ·
                ${typeof t === "function" ? t(movie.type?.toLowerCase() || "movie") : movie.type}
            </small>
        </li>
    `).join("");

    document.body.insertAdjacentHTML("beforeend", `
        <div class="actor-modal" id="actorFilmographyModal" onclick="closeFilmography(event)">
            <section class="actor-filmography-modal" onclick="event.stopPropagation()">
                <header>
                    <div>
                        <p>${typeof t === "function" ? t("filmography") : "Filmografi"}</p>
                        <h2>${escapeHtml(actor.name)}</h2>
                    </div>
                    <button class="filmography-close" onclick="closeFilmography()">&times;</button>
                </header>
                <ul>
                    ${filmography || "<li>Herhangi bir içerik bulunamadı.</li>"}
                </ul>
            </section>
        </div>
    `);
}

function closeFilmography(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById("actorFilmographyModal")?.remove();
}

async function loadActors() {
    try {
        const response = await fetch(API, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`Oyuncu listesi alınamadı (HTTP ${response.status})`);
        }

        actors = await response.json();
        renderActors();
    } catch (error) {
        console.error("LOAD ACTORS ERROR:", error);
        if (actorsGrid) {
            actorsGrid.innerHTML = `
                <div class="empty-actors">
                    <h2>Hata oluştu</h2>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
        }
    }
}

function editActor(actorId) {
    const actor = actors.find(a => a.id === actorId);
    if (!actor) return;
    editingActorId = actorId;
    
    const input = document.getElementById("editActorName");
    const modal = document.getElementById("editActorModal");
    if (input) input.value = actor.name;
    if (modal) modal.style.display = "flex";
}

function closeEditModal() {
    editingActorId = null;
    const modal = document.getElementById("editActorModal");
    if (modal) modal.style.display = "none";
}

async function saveActor() {
    const input = document.getElementById("editActorName");
    const name = input ? input.value.trim() : "";
    if (!name || !editingActorId) return;

    try {
        const response = await fetch(`${API}/${editingActorId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: name })
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error("Oyuncu güncellenemedi.");

        closeEditModal();
        await loadActors();

        if (typeof showMessage === "function") {
            await showMessage("success", "Başarılı", "Oyuncu güncellendi.");
        }
    } catch (err) {
        console.error(err);
        if (typeof showMessage === "function") {
            await showMessage("error", "Güncelleme Başarısız", "Oyuncu güncellenemedi.");
        }
    }
}

function closeDeleteModal() {
    deletingActorId = null;
    const modal = document.getElementById("deleteActorModal");
    if (modal) modal.style.display = "none";
}

function deleteActor(actorId) {
    const actor = actors.find(a => a.id === actorId);
    if (!actor) return;
    deletingActorId = actorId;

    const nameElem = document.getElementById("deleteActorName");
    const msgElem = document.getElementById("deleteActorMessage");
    const moviesElem = document.getElementById("deleteActorMovies");
    const modal = document.getElementById("deleteActorModal");

    if (nameElem) nameElem.textContent = actor.name;
    if (msgElem) {
        msgElem.innerHTML = `<strong>${escapeHtml(actor.name)}</strong> oyuncusunu silmek istediğinize emin misiniz?<br><br>Bu oyuncu aşağıdaki içeriklerle ilişkilidir:`;
    }
    if (moviesElem) {
        const filmography = actor.filmography || actor.contents || [];
        moviesElem.innerHTML = filmography.length > 0
            ? filmography.map(movie => `<div class="delete-movie-item">🎬 ${escapeHtml(movie.title)}</div>`).join("")
            : `<div class="delete-movie-item">İlişkili içerik yok.</div>`;
    }
    if (modal) modal.style.display = "flex";
}

async function confirmDeleteActor() {
    if (!deletingActorId) return;

    try {
        const response = await fetch(`${API}/${deletingActorId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error("Silme başarısız.");

        closeDeleteModal();
        await loadActors();

        if (typeof showMessage === "function") {
            await showMessage("success", "Başarılı", "Oyuncu silindi.");
        }
    } catch (e) {
        console.error(e);
        if (typeof showMessage === "function") {
            await showMessage("error", "Silme Başarısız", "Oyuncu silinemedi.");
        }
    }
}

// Event Listener Tanımlamaları
if (actorSearch) actorSearch.addEventListener("input", renderActors);
window.addEventListener("languagechange", renderActors);

document.getElementById("cancelDeleteBtn")?.addEventListener("click", closeDeleteModal);
document.getElementById("confirmDeleteBtn")?.addEventListener("click", confirmDeleteActor);

// Yükleme Başlangıcı
if (checkAuthGuard()) {
    loadActors();
}