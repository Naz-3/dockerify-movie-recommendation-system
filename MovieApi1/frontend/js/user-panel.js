document.addEventListener("DOMContentLoaded", async () => {
    const BASE_URL = "https://dockerify-movie-recommendation-system.onrender.com/api/content";

    function getAuthHeaders() {
        const token = localStorage.getItem("jwtToken");
        return {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
        };
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { username: "user1" };
    const usernameElem = document.getElementById("activeUsername");
    if (usernameElem) usernameElem.innerText = currentUser.username;

    let favorites = JSON.parse(localStorage.getItem("user_favorites")) || [];
    let watchlist = JSON.parse(localStorage.getItem("user_watchlist")) || [];
    let currentData = [];

    window.toggleFavorite = function(id) {
        id = Number(id);
        if (favorites.includes(id)) {
            favorites = favorites.filter(favId => favId !== id);
        } else {
            favorites.push(id);
        }
        localStorage.setItem("user_favorites", JSON.stringify(favorites));
        refreshUI();
    };

    window.toggleWatchlist = function(id) {
        id = Number(id);
        if (watchlist.includes(id)) {
            watchlist = watchlist.filter(wId => wId !== id);
        } else {
            watchlist.push(id);
        }
        localStorage.setItem("user_watchlist", JSON.stringify(watchlist));
        refreshUI();
    };

    function refreshUI() {
        const path = window.location.pathname;

        if (path.includes("favorites.html")) {
            const favMovies = currentData.filter(m => favorites.includes(m.id));
            renderGrid(document.getElementById("favoritesGrid"), favMovies, "Henüz favori içeriğiniz yok.");
        } else if (path.includes("watchlist.html")) {
            const watchMovies = currentData.filter(m => watchlist.includes(m.id));
            renderGrid(document.getElementById("watchlistGrid"), watchMovies, "Daha sonra izlenecek içeriğiniz yok.");
        } else if (path.includes("search.html")) {
            renderGrid(document.getElementById("searchResultsGrid"), currentData);
        } else if (path.includes("latest.html")) {
            renderGrid(document.getElementById("latestGrid"), currentData);
        }
    }

    function createCard(item) {
        const itemId = Number(item.id);
        const isFav = favorites.includes(itemId);
        const isWatch = watchlist.includes(itemId);

        const posterSrc = item.poster || item.posterUrl || 'https://via.placeholder.com/300x450?text=G%C3%B6rsel+Yok';
        const titleText = item.title || 'İsimsiz İçerik';
        const genreText = item.genre || item.type || 'İçerik';

        return `
            <div class="media-card" data-id="${itemId}">
                <img src="${posterSrc}" alt="${titleText}" class="poster" onerror="this.src='https://via.placeholder.com/300x450?text=G%C3%B6rsel+Yok'">
                <div class="card-body">
                    <h4>${titleText}</h4>
                    <span class="genre">${genreText}</span>
                    <div class="card-actions">
                        <button class="btn-action ${isFav ? 'active-fav' : ''}" onclick="toggleFavorite(${itemId})">
                            ${isFav ? '💖 Favoride' : '❤️ Favori'}
                        </button>
                        <button class="btn-action ${isWatch ? 'active-watch' : ''}" onclick="toggleWatchlist(${itemId})">
                            ${isWatch ? '✅ Eklendi' : '📌 İzle'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderGrid(container, items, emptyText = "Görüntülenecek içerik bulunamadı.") {
        if (!container) return;
        if (!items || items.length === 0) {
            container.innerHTML = `<p style="color:#8b93a3">${emptyText}</p>`;
            return;
        }
        container.innerHTML = items.map(item => createCard(item)).join('');
    }

    async function initPage() {
        const path = window.location.pathname;
        let targetGridId = "";

        if (path.includes("search.html")) targetGridId = "searchResultsGrid";
        else if (path.includes("latest.html")) targetGridId = "latestGrid";
        else if (path.includes("favorites.html")) targetGridId = "favoritesGrid";
        else if (path.includes("watchlist.html")) targetGridId = "watchlistGrid";

        const gridElem = document.getElementById(targetGridId);
        if (!gridElem) return;

        try {
            const response = await fetch(BASE_URL, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Veri çekilemedi.");

            currentData = await response.json();

            if (path.includes("latest.html")) {
                currentData.sort((a, b) => b.id - a.id);
            }

            refreshUI();
        } catch (error) {
            console.error("Hata:", error);
            gridElem.innerHTML = '<p style="color:#ef4444">Veriler veritabanından yüklenirken bir sorun oluştu.</p>';
        }
    }

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", async () => {
            const query = document.getElementById("searchInput").value.trim();
            if (!query) {
                initPage();
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/search?title=${encodeURIComponent(query)}`, {
                    headers: getAuthHeaders()
                });
                if (!response.ok) throw new Error("Arama başarısız.");

                currentData = await response.json();
                refreshUI();
            } catch (error) {
                console.error("Arama Hatasi:", error);
            }
        });
    }

    window.logout = function() {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("currentUser");
        window.location.href = "login.html"; 
    };

    initPage();
});