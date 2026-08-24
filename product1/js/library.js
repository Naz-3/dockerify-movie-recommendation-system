const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";

let grid, searchInput, typeFilter, sortFilter;
let movies = [];

function getAuthHeaders() {
    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
    if (token.startsWith("Bearer ")) {
        token = token.substring(7);
    }
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

function getPosterUrl(movie) {
    const poster = movie.poster || movie.Poster || movie.posterUrl || movie.posterURL || movie.image || "";
    if (!poster) return "https://placehold.co/300x450?text=Poster";
    if (poster.startsWith("/")) return `https://image.tmdb.org/t/p/w500${poster}`;
    return poster;
}

function checkAuthGuard() {
    const token = localStorage.getItem("jwtToken") || localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuthGuard()) return;

    grid = document.getElementById("libraryGrid");
    searchInput = document.getElementById("searchInput");
    typeFilter = document.getElementById("typeFilter");
    sortFilter = document.getElementById("sortFilter");

    if (searchInput) searchInput.addEventListener("keyup", renderMovies);
    if (typeFilter) typeFilter.addEventListener("change", renderMovies);
    if (sortFilter) sortFilter.addEventListener("change", renderMovies);

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "login.html";
        });
    }

    loadMovies();
});

async function loadMovies() {
    try {
        const response = await fetch(API, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error(`Status: ${response.status}`);

        movies = await response.json();
        renderMovies();
    } catch (error) {
        console.error("Film yükleme hatası:", error);
    }
}

function renderMovies() {
    let list = [...movies];
    const search = searchInput ? searchInput.value.toLowerCase() : "";

    if (search !== "") {
        list = list.filter(movie => movie.title && movie.title.toLowerCase().includes(search));
    }

    if (typeFilter && typeFilter.value !== "all") {
        list = list.filter(movie => movie.type && movie.type.toLowerCase() === typeFilter.value);
    }

    if (sortFilter) {
        switch (sortFilter.value) {
            case "title":
                list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
                break;
            case "rating":
                list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case "year":
                list.sort((a, b) => (b.year || 0) - (a.year || 0));
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
        const typeText = typeof t === "function" ? t((movie.type || "").toLowerCase()) : (movie.type || "-");
        const detailsText = typeof t === "function" ? t("details") : "Detaylar";
        const syncText = typeof t === "function" ? t("sync") : "Senkronize Et";
        const deleteText = typeof t === "function" ? t("delete") : "Sil";
        const posterUrl = getPosterUrl(movie);

        let formattedActors = "-";
        if (typeof movie.actors === "string" && movie.actors.trim() !== "") {
            formattedActors = movie.actors;
        } else if (Array.isArray(movie.actors) && movie.actors.length > 0) {
            formattedActors = movie.actors
                .map(actor => typeof actor === "object" ? actor.name : actor)
                .join(", ");
        }

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
                <p>🎭 ${formattedActors}</p>
                <div class="library-actions">
                    <button class="details-btn" onclick="viewDetails(${movie.id})">${detailsText}</button>
                    <div class="action-row">
                        <button class="sync" onclick="syncMovie(${movie.id})">${syncText}</button>
                        <button class="delete" onclick="deleteMovie(${movie.id})">${deleteText}</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
}

function editMovie(id) {
    window.location.href = `edit-content.html?id=${id}`;
}

function viewDetails(id) {
    window.location.href = `content-details.html?id=${id}`;
}

async function deleteMovie(id) {
    if (!confirm("Bu içerik silinsin mi?")) return;

    try {
        const response = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            alert("Bu işlem için yetkiniz yok.");
            return;
        }

        if (!response.ok) throw new Error("Silme işlemi başarısız.");

        loadMovies();
    } catch (error) {
        console.error("Silme hatası:", error);
    }
}

async function syncMovie(id) {
    try {
        const response = await fetch(`${API}/sync/${id}`, {
            method: "PATCH",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            alert("İçerik senkronize edilemedi.");
            return;
        }

        alert("OMDb ile senkronizasyon tamamlandı.");
        loadMovies();
    } catch (error) {
        console.error("Sync hatası:", error);
    }
}