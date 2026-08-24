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
    let activeModalItem = null;

    // --- MODAL VE WATCH PROGRESS YAPILARI ---
    
    // Modal DOM HTML Yapısını Dinamik Oluşturma
    if (!document.getElementById("detailModalOverlay")) {
        const modalHTML = `
        <div id="detailModalOverlay" class="modal-overlay">
            <div class="detail-modal">
                <button class="modal-close-btn" onclick="closeDetailModal()">&times;</button>
                <div id="modalHero" class="modal-hero">
                    <div class="modal-hero-overlay">
                        <div>
                            <h2 id="modalTitle" style="font-size:26px; font-weight:700; color:#fff; margin-bottom:4px;">-</h2>
                            <span id="modalTypeBadge" style="background:#e50914; padding:3px 8px; border-radius:4px; font-size:12px; color:#fff;">MOVIE</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-body">
                    <!-- Özet ve Başroller / Kadro Bilgisi -->
                    <div id="modalMetaInfo" style="margin-bottom:16px; font-size:14px; color:#ccc; line-height:1.5;">
                        <p id="modalDescription" style="margin-bottom:8px; color:#e0e0e0;"></p>
                        <p id="modalCast" style="font-size:13px; color:#999;"></p>
                    </div>

                    <!-- Etkileşimli İzleme Durumu Çubuğu -->
                    <div class="watch-status-card" style="background:rgba(255,255,255,0.04); padding:12px; border-radius:8px; margin-bottom:16px;">
                        <div style="width: 100%;">
                            <div style="display:flex; justify-content:space-between; font-size:13px; color:#aaa; margin-bottom:6px;">
                                <span id="watchTimeText">İzleme Durumu: 0 / 0 dk</span>
                                <span id="watchPercentText">%0 Tamamlandı</span>
                            </div>
                            <input type="range" id="interactiveProgressBar" min="0" max="100" value="0" style="width:100%; cursor:pointer; accent-color:#e50914;" oninput="updateModalWatchProgress(this.value)">
                        </div>
                    </div>

                    <!-- Tab Butonları -->
                    <div class="modal-tabs" style="display:flex; gap:12px; border-bottom:1px solid #333; margin-bottom:16px; padding-bottom:8px;">
                        <button class="modal-tab-btn active" onclick="switchModalTab('episodes')">Sezon & Bölümler</button>
                        <button class="modal-tab-btn" onclick="switchModalTab('trailers')">Fragmanlar</button>
                        <button class="modal-tab-btn" onclick="switchModalTab('bts')">Sahne Arkası (BTS)</button>
                    </div>

                    <!-- Tab İçerikleri -->
                    <div id="tab-episodes" class="tab-content active">
                        <div id="episodesList" style="color:#aaa; font-size:14px;">Bölüm bilgisi yükleniyor...</div>
                    </div>
                    
                    <div id="tab-trailers" class="tab-content">
                        <div id="trailersGrid" class="video-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;"></div>
                    </div>

                    <div id="tab-bts" class="tab-content">
                        <div id="btsGrid" class="video-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;"></div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
    }

    // YouTube Embed Link Çıkarıcı Yardımcı Fonksiyon
function extractVideoUrl(item, type = 'trailer') {
    if (!item) return null;

    // 1. Doğrudan Nesne Üzerindeki Olası Tüm Key İsimleri (Admin & Backend Uyumluluğu)
    let candidate = null;
    if (type === 'trailer') {
        candidate = item.trailerUrl || item.trailer || item.trailerKey || item.youtubeKey || item.youtube_key || item.videoUrl || item.promoUrl;
    } else {
        candidate = item.btsUrl || item.behindTheScenesUrl || item.extraUrl || item.btsKey || item.behind_the_scenes;
    }

    // 2. TMDB 'videos' nesnesi veya 'results' dizisi
    const videosList = item.videos?.results || item.videos || item.videoList || [];
    if (!candidate && Array.isArray(videosList) && videosList.length > 0) {
        let targetVideo = null;
        if (type === 'trailer') {
            targetVideo = videosList.find(v => 
                v.type?.toLowerCase().includes("trailer") || 
                v.type?.toLowerCase().includes("teaser")
            ) || videosList[0];
        } else {
            targetVideo = videosList.find(v => 
                v.type?.toLowerCase().includes("behind") || 
                v.type?.toLowerCase().includes("featurette") || 
                v.type?.toLowerCase().includes("clip")
            );
        }
        if (targetVideo) {
            candidate = targetVideo.key || targetVideo.youtubeKey || targetVideo.url || targetVideo.id;
        }
    }

    if (!candidate) return null;

    // 3. YouTube Embed Formatına Dönüştürme
    candidate = String(candidate).trim();
    if (candidate.includes('youtube.com/embed/')) return candidate;
    if (candidate.includes('watch?v=')) return candidate.replace('watch?v=', 'embed/').split('&')[0];
    if (candidate.includes('youtu.be/')) return candidate.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
    
    // Eğer sadece ID ise (örneğin: d9MyW72ELq0)
    if (!candidate.startsWith('http')) {
        return `https://www.youtube.com/embed/${candidate}`;
    }

    return candidate;
}

    // Modal Penceresini Açma ve API Verisini Yükleme
    window.openDetailModal = async function(id) {
        const overlay = document.getElementById("detailModalOverlay");
        if (overlay) overlay.classList.add("active");

        // Yükleniyor durumu
        document.getElementById("modalTitle").innerText = "Yükleniyor...";
        document.getElementById("modalDescription").innerText = "";
        document.getElementById("modalCast").innerText = "";
        document.getElementById("episodesList").innerHTML = "<p style='color:#aaa;'>İçerik bilgileri getiriliyor...</p>";
        document.getElementById("trailersGrid").innerHTML = "";
        document.getElementById("btsGrid").innerHTML = "";

        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error("Detay verisi alınamadı.");

            const item = await response.json();
            activeModalItem = item;

            // Tür Tespiti (Movie / Series)
            const typeValue = (item.contentType || item.type || item.genre || '').toUpperCase();
            const isSeries = typeValue.includes('SERIES') || typeValue.includes('TV') || typeValue.includes('DİZİ');
            
            document.getElementById("modalTitle").innerText = item.title || item.name || 'İçerik Detayı';
            document.getElementById("modalTypeBadge").innerText = isSeries ? 'SERIES' : 'MOVIE';
            
            // FİLMLERDE "SEZON & BÖLÜMLER" TAB'INI GİZLEME
            const episodesTabBtn = document.querySelector(".modal-tab-btn[onclick*='episodes']");
            if (episodesTabBtn) {
                if (isSeries) {
                    episodesTabBtn.style.display = "inline-block";
                    switchModalTab('episodes');
                } else {
                    episodesTabBtn.style.display = "none";
                    switchModalTab('trailers');
                }
            }

            // Poster / Banner Görseli
            const posterSrc = item.poster || item.posterUrl || item.bannerUrl || item.backdropPath || item.backdrop_path || 'https://placehold.co/300x450?text=G%C3%B6rsel+Yok';
            document.getElementById("modalHero").style.backgroundImage = `url('${posterSrc}')`;

            // Özet / Tanıtım Yazısı
            const overviewText = item.description || item.overview || item.summary || item.synopsis || item.plot || item.details;
            document.getElementById("modalDescription").innerText = overviewText ? overviewText : "Bu içerik için özet açıklaması bulunmuyor.";

            // Başroller / Oyuncular Kadrosu
            const castText = item.cast || item.actors || item.actorsList || item.starring || item.credits;
            const castElem = document.getElementById("modalCast");
            if (castText && ((Array.isArray(castText) && castText.length > 0) || String(castText).trim() !== '')) {
                castElem.style.display = "block";
                castElem.innerHTML = `<strong>Başroller:</strong> ${Array.isArray(castText) ? castText.map(c => c.name || c).join(', ') : castText}`;
            } else {
                castElem.style.display = "none";
                castElem.innerHTML = "";
            }

            // Sezon & Bölüm Verilerinin Hazırlanması (Yalnızca Dizi İse)
            if (isSeries) {
                let seasonsData = item.seasons || item.seasonList || [];
                let episodesData = item.episodes || item.episodeList || [];

                if (seasonsData.length === 0 && episodesData.length > 0) {
                    const grouped = {};
                    episodesData.forEach(ep => {
                        const sNum = ep.seasonNumber || ep.season_number || ep.season || 1;
                        if (!grouped[sNum]) grouped[sNum] = [];
                        grouped[sNum].push(ep);
                    });
                    seasonsData = Object.keys(grouped).map(sNum => ({
                        name: `${sNum}. Sezon`,
                        episodes: grouped[sNum]
                    }));
                }

                const epContainer = document.getElementById("episodesList");
                if (seasonsData.length > 0) {
                    epContainer.innerHTML = seasonsData.map((s, idx) => `
                        <div class="season-accordion-item" style="margin-bottom:10px; background:rgba(255,255,255,0.05); border-radius:8px; overflow:hidden;">
                            <div class="season-header" onclick="toggleSeasonAccordion(this)" style="padding:14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.08);">
                                <strong style="color:#fff; font-size:15px;">${s.name || s.title || `${idx + 1}. Sezon`}</strong>
                                <span class="acc-icon" style="color:#aaa; font-size:12px;">${(s.episodes ? s.episodes.length : (s.episodesCount || 0))} Bölüm ▼</span>
                            </div>
                            <div class="season-episodes-list" style="display:none; padding:12px; background:rgba(0,0,0,0.2);">
                                ${renderEpisodes(s.episodes || [])}
                            </div>
                        </div>
                    `).join('');
                } else if (episodesData.length > 0) {
                    epContainer.innerHTML = renderEpisodes(episodesData);
                } else {
                    epContainer.innerHTML = "<p style='color:#aaa;'>Bu diziye ait henüz sezon veya bölüm bilgisi yüklenmedi.</p>";
                }
            }

            // Dinamik İzleme Süresi
            let total = item.durationMinutes || item.duration || item.runtime || item.totalMinutes || (isSeries ? 450 : 120);
            const watched = item.watchedMinutes || item.progressMinutes || 0;
            const percent = Math.min(Math.round((watched / total) * 100), 100);

            document.getElementById("interactiveProgressBar").value = percent;
            updateWatchBarUI(watched, total, percent);

            // FRAGMAN VE BTS VİDEO YÜKLEME
            const trailerEmbedUrl = extractVideoUrl(item, 'trailer');
            const btsEmbedUrl = extractVideoUrl(item, 'bts');

            // Fragman Sekmesi İçeriği
            const trailerGrid = document.getElementById("trailersGrid");
            trailerGrid.innerHTML = trailerEmbedUrl 
                ? `<iframe src="${trailerEmbedUrl}" style="width:100%; aspect-ratio:16/9; border:none; border-radius:8px;" allowfullscreen></iframe>`
                : "<p style='color:#aaa;'>Bu içerik için henüz fragman eklenmemiş.</p>";

            // Sahne Arkası Sekmesi İçeriği
            const btsGrid = document.getElementById("btsGrid");
            btsGrid.innerHTML = btsEmbedUrl 
                ? `<iframe src="${btsEmbedUrl}" style="width:100%; aspect-ratio:16/9; border:none; border-radius:8px;" allowfullscreen></iframe>`
                : "<p style='color:#aaa;'>Bu içerik için henüz sahne arkası videosu eklenmemiş.</p>";

        } catch (error) {
            console.error("Detay Çekme Hatası:", error);
            document.getElementById("modalTitle").innerText = "Hata Oluştu";
        }
    };

    // Bölüm Açıklamalarını Çeken ve Render Eden Fonksiyon
    function renderEpisodes(epList) {
        if (!epList || epList.length === 0) return "<p style='color:#888;'>Bu sezona ait bölüm bulunamadı.</p>";

        return epList.map((ep, idx) => {
            const epStill = ep.stillPath || ep.stillUrl || ep.still_path || ep.poster || 'https://placehold.co/160x90?text=B%C3%B6l%C3%BCm';
            const epOverview = ep.overview || ep.description || ep.summary || ep.plot;
            const duration = ep.durationMinutes || ep.runtime || ep.duration || 45;

            return `
                <div style="display:flex; gap:12px; margin-bottom:12px; padding:10px; background:rgba(255,255,255,0.03); border-radius:6px; align-items:flex-start;">
                    <img src="${epStill.startsWith('/') ? 'https://image.tmdb.org/t/p/w300' + epStill : epStill}" style="width:130px; aspect-ratio:16/9; object-fit:cover; border-radius:4px;" onerror="this.src='https://placehold.co/160x90?text=B%C3%B6l%C3%BCm'">
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="color:#fff; font-size:14px;">${ep.episodeNumber || ep.episode_number || idx + 1}. ${ep.title || ep.name || 'Bölüm'}</strong>
                            <span style="color:#888; font-size:12px;">${duration} dk</span>
                        </div>
                        <p style="font-size:12px; color:#aaa; margin-top:6px; line-height:1.4;">${epOverview ? epOverview : 'Bu bölüm için henüz detaylı özet açıklaması eklenmemiştir.'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Aynı Anda Sadece Tek Sezonu Açan Akordeon Fonksiyonu
    window.toggleSeasonAccordion = function(headerElem) {
        const currentBody = headerElem.nextElementSibling;
        const isOpening = currentBody.style.display === "none";

        // Açık olan tüm diğer sezonları kapat
        document.querySelectorAll(".season-episodes-list").forEach(list => {
            list.style.display = "none";
        });
        document.querySelectorAll(".acc-icon").forEach(icon => {
            icon.innerText = icon.innerText.replace('▲', '▼');
        });

        // Tıklanan sezonu duruma göre aç veya kapat
        if (isOpening) {
            currentBody.style.display = "block";
            const icon = headerElem.querySelector(".acc-icon");
            if (icon) icon.innerText = icon.innerText.replace('▼', '▲');
        }
    };

    // İzleme Çubuğunda Oynama Yapıldığında Çalışan Fonksiyon
    window.updateModalWatchProgress = function(percent) {
        if (!activeModalItem) return;
        const total = activeModalItem.durationMinutes || activeModalItem.totalMinutes || 120;
        const watched = Math.round((percent / 100) * total);
        activeModalItem.watchedMinutes = watched;
        updateWatchBarUI(watched, total, percent);
    };

    function updateWatchBarUI(watched, total, percent) {
        document.getElementById("watchTimeText").innerText = `Kaldığı Yer: ${watched}. dk / ${total} dk`;
        document.getElementById("watchPercentText").innerText = `%${percent} Tamamlandı`;
    }

    window.closeDetailModal = function() {
        document.getElementById("detailModalOverlay").classList.remove("active");
    };

    window.switchModalTab = function(tabName) {
        document.querySelectorAll(".modal-tab-btn").forEach(btn => btn.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

        if (event && event.target && event.target.classList.contains("modal-tab-btn")) {
            event.target.classList.add("active");
        } else {
            const defaultBtn = document.querySelector(`.modal-tab-btn[onclick*='${tabName}']`);
            if (defaultBtn) defaultBtn.classList.add("active");
        }
        
        const targetTab = document.getElementById(`tab-${tabName}`);
        if (targetTab) targetTab.classList.add("active");
    };

    // --- SIDEBAR VE NAVİGASYON ---
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

    function createCard(item) {
        const itemId = Number(item.id);
        const isFav = favorites.includes(itemId);
        const isWatch = watchlist.includes(itemId);

        const posterSrc = item.poster || item.posterUrl || 'https://placehold.co/300x450?text=G%C3%B6rsel+Yok';
        const titleText = item.title || 'İsimsiz İçerik';
        const genreText = item.genre || item.type || 'İçerik';

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