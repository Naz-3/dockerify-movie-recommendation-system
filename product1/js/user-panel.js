document.addEventListener("DOMContentLoaded", async () => {
    const BASE_URL = "https://dockerify-movie-recommendation-system.onrender.com/api/content";

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

    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { username: "User" };
    const usernameElem = document.getElementById("activeUsername");
    if (usernameElem) usernameElem.innerText = currentUser.username;

    let favorites = JSON.parse(localStorage.getItem("user_favorites")) || [];
    let watchlist = JSON.parse(localStorage.getItem("user_watchlist")) || [];
    let currentData = [];

    // --- MODAL VE WATCH PROGRESS YAPILARI ---
    
    // Modal DOM HTML Otomatik Oluşturma
    if (!document.getElementById("detailModalOverlay")) {
        const modalHTML = `
        <div id="detailModalOverlay" class="modal-overlay">
            <div class="detail-modal">
                <button class="modal-close-btn" onclick="closeDetailModal()">&times;</button>
                <div id="modalHero" class="modal-hero">
                    <div class="modal-hero-overlay">
                        <div>
                            <h2 id="modalTitle" style="font-size:26px; font-weight:700; color:#fff;">-</h2>
                            <span id="modalTypeBadge" style="background:#e50914; padding:3px 8px; border-radius:4px; font-size:12px; color:#fff;">MOVIE</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-body">
                    <div class="watch-status-card">
                        <div style="width: 100%;">
                            <div style="display:flex; justify-content:space-between; font-size:13px; color:#aaa;">
                                <span id="watchTimeText">İzleme Durumu: 0 / 0 dk</span>
                                <span id="watchPercentText">%0 tamamlandı</span>
                            </div>
                            <div class="progress-track">
                                <div id="modalProgressFill" class="progress-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-tabs">
                        <button class="modal-tab-btn active" onclick="switchModalTab('episodes')">Sezon & Bölümler</button>
                        <button class="modal-tab-btn" onclick="switchModalTab('trailers')">Fragmanlar</button>
                        <button class="modal-tab-btn" onclick="switchModalTab('bts')">Sahne Arkası (BTS)</button>
                    </div>

                    <div id="tab-episodes" class="tab-content active">
                        <div id="episodesList" style="color:#aaa; font-size:14px;">Bölüm bilgisi yükleniyor...</div>
                    </div>
                    
                    <div id="tab-trailers" class="tab-content">
                        <div id="trailersGrid" class="video-grid"></div>
                    </div>

                    <div id="tab-bts" class="tab-content">
                        <div id="btsGrid" class="video-grid"></div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
    }

    // Modal Penceresini Açma (API'den Detay Verisini Çekerek)
    window.openDetailModal = async function(id) {
        const overlay = document.getElementById("detailModalOverlay");
        if (overlay) overlay.classList.add("active");

        // Yükleniyor durumunu göster
        document.getElementById("modalTitle").innerText = "Yükleniyor...";
        document.getElementById("episodesList").innerHTML = "<p style='color:#aaa;'>Bölüm bilgileri çekiliyor...</p>";
        document.getElementById("trailersGrid").innerHTML = "";
        document.getElementById("btsGrid").innerHTML = "";

        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error("Detay verisi alınamadı.");

            const item = await response.json();

            // Başlık ve Tip
            document.getElementById("modalTitle").innerText = item.title || 'İçerik Detayı';
            document.getElementById("modalTypeBadge").innerText = (item.genre || item.type || item.contentType || 'MOVIE').toUpperCase();
            
            // Poster / Banner Görseli
            const posterSrc = item.poster || item.posterUrl || item.bannerUrl || 'https://placehold.co/300x450?text=G%C3%B6rsel+Yok';
            document.getElementById("modalHero").style.backgroundImage = `url('${posterSrc}')`;

            // İzlenme Hesabı
            const watched = item.watchedMinutes || item.progressMinutes || 0;
            const total = item.durationMinutes || item.totalMinutes || 120;
            const percent = Math.min(Math.round((watched / total) * 100), 100);

            document.getElementById("watchTimeText").innerText = `Kaldığı Yer: ${watched}. dk / ${total} dk`;
            document.getElementById("watchPercentText").innerText = `%${percent} Tamamlandı`;
            document.getElementById("modalProgressFill").style.width = `${percent}%`;

            // Sezon & Bölümler Listesi
            const epContainer = document.getElementById("episodesList");
            const seasonsData = item.seasons || item.seasonList || [];
            const episodesData = item.episodes || item.episodeList || [];

            if (seasonsData.length > 0) {
                epContainer.innerHTML = seasonsData.map(s => `
                    <div style="margin-bottom:12px; background:rgba(255,255,255,0.05); padding:12px; border-radius:8px;">
                        <strong style="color:#fff; font-size:15px;">${s.name || s.title || 'Sezon'}</strong>
                        <p style="font-size:13px; color:#aaa; margin-top:4px;">${s.episodesCount || (s.episodes ? s.episodes.length : 0)} Bölüm</p>
                    </div>
                `).join('');
            } else if (episodesData.length > 0) {
                epContainer.innerHTML = episodesData.map((ep, idx) => `
                    <div style="margin-bottom:8px; background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:#fff; font-size:14px;">${idx + 1}. ${ep.title || ep.name || 'Bölüm'}</span>
                        <span style="color:#888; font-size:12px;">${ep.duration || '45 dk'}</span>
                    </div>
                `).join('');
            } else {
                epContainer.innerHTML = "<p style='color:#aaa;'>Bu içerik bir filmdir veya bölüm verisi eklenmemiştir.</p>";
            }

            // Fragmanlar
            const trailerGrid = document.getElementById("trailersGrid");
            const trailerUrl = item.trailerUrl || item.trailer;
            trailerGrid.innerHTML = trailerUrl 
                ? `<iframe src="${trailerUrl.replace('watch?v=', 'embed/')}" style="width:100%; aspect-ratio:16/9; border:none; border-radius:8px;" allowfullscreen></iframe>`
                : "<p style='color:#aaa;'>Fragman bulunamadı.</p>";

            // Sahne Arkası (BTS)
            const btsGrid = document.getElementById("btsGrid");
            const btsUrl = item.btsUrl || item.behindTheScenesUrl;
            btsGrid.innerHTML = btsUrl 
                ? `<iframe src="${btsUrl.replace('watch?v=', 'embed/')}" style="width:100%; aspect-ratio:16/9; border:none; border-radius:8px;" allowfullscreen></iframe>`
                : "<p style='color:#aaa;'>Sahne arkası çekim videosu bulunamadı.</p>";

        } catch (error) {
            console.error("Detay Çekme Hatası:", error);
            document.getElementById("modalTitle").innerText = "Hata Oluştu";
            document.getElementById("episodesList").innerHTML = "<p style='color:#ef4444;'>İçerik detayları veritabanından yüklenemedi.</p>";
        }
    };

    window.closeDetailModal = function() {
        document.getElementById("detailModalOverlay").classList.remove("active");
    };

    window.switchModalTab = function(tabName) {
        document.querySelectorAll(".modal-tab-btn").forEach(btn => btn.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

        if (event && event.target) {
            event.target.classList.add("active");
        }
        document.getElementById(`tab-${tabName}`).classList.add("active");
    };

    // --- SIDEBAR VE NAVIGASYON ---
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
        const path = window.location.pathname.toLowerCase();

        if (path.includes("favorites")) {
            const favMovies = currentData.filter(m => favorites.includes(Number(m.id)));
            renderGrid(document.getElementById("favoritesGrid"), favMovies, "Henüz favori içeriğiniz yok.");
        } else if (path.includes("watchlist")) {
            const watchMovies = currentData.filter(m => watchlist.includes(Number(m.id)));
            renderGrid(document.getElementById("watchlistGrid"), watchMovies, "Daha sonra izlenecek içeriğiniz yok.");
        } else if (path.includes("search")) {
            renderGrid(document.getElementById("searchResultsGrid"), currentData);
        } else if (path.includes("latest") || path.includes("library")) {
            renderGrid(document.getElementById("latestGrid"), currentData);
        }
    }

    // Kart Oluşturucu
    function createCard(item) {
        const itemId = Number(item.id);
        const isFav = favorites.includes(itemId);
        const isWatch = watchlist.includes(itemId);

        const posterSrc = item.poster || item.posterUrl || 'https://placehold.co/300x450?text=G%C3%B6rsel+Yok';
        const titleText = item.title || 'İsimsiz İçerik';
        const genreText = item.genre || item.type || 'İçerik';

        // İzlenme Yüzdesi
        const watched = item.watchedMinutes || 0;
        const total = item.durationMinutes || 120;
        const watchedPercent = Math.min(Math.round((watched / total) * 100), 100);

        return `
            <div class="media-card" data-id="${itemId}" onclick="openDetailModal(${itemId})">
                <div class="watch-progress-bar" style="width: ${watchedPercent}%;"></div>
                <img src="${posterSrc}" alt="${titleText}" class="poster" onerror="this.src='https://placehold.co/300x450?text=G%C3%B6rsel+Yok'">
                <div class="card-body">
                    <h4>${titleText}</h4>
                    <span class="genre">${genreText}</span>
                    <div class="card-actions" onclick="event.stopPropagation();">
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
        const path = window.location.pathname.toLowerCase();
        let targetGridId = "";

        if (path.includes("search")) targetGridId = "searchResultsGrid";
        else if (path.includes("latest")) targetGridId = "latestGrid";
        else if (path.includes("favorites")) targetGridId = "favoritesGrid";
        else if (path.includes("watchlist")) targetGridId = "watchlistGrid";

        const gridElem = document.getElementById(targetGridId);

        try {
            const response = await fetch(BASE_URL, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Veri çekilemedi. Status: " + response.status);

            currentData = await response.json();

            if (path.includes("latest")) {
                currentData.sort((a, b) => b.id - a.id);
            }

            refreshUI();
        } catch (error) {
            console.error("Hata:", error);
            if (gridElem) {
                gridElem.innerHTML = '<p style="color:#ef4444">Veriler veritabanından yüklenirken bir sorun oluştu.</p>';
            }
        }
    }

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", async () => {
            const queryInput = document.getElementById("searchInput");
            const query = queryInput ? queryInput.value.trim() : "";
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
                console.error("Arama Hatası:", error);
            }
        });
    }

    window.logout = function() {
        localStorage.clear();
        window.location.href = "login.html"; 
    };

    initPage();
});