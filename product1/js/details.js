document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get("id");
    console.log("Gelen İçerik ID:", contentId);

    if (!contentId) {
        console.error("URL'de 'id' parametresi bulunamadı.");
        return;
    }

    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
    if (token.startsWith("Bearer ")) token = token.substring(7);

    try {
        const url = `https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}/details`;
        console.log("İstek atılan URL:", url);

        const response = await fetch(url, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        });

        console.log("Response Status:", response.status);

        if (!response.ok) throw new Error("Veri çekilemedi: " + response.status);

        const data = await response.json();
        console.log("Backend'den gelen veri:", data);
        
        renderAdminDetailsPage(data);
        ensureVideoModalExists();

    } catch (error) {
        console.error("Admin detay yükleme hatası:", error);
    }
});

function renderAdminDetailsPage(data) {
    if (!data) return;

    // --- 1. ÜST BİLGİLER ---
    const posterImg = document.querySelector(".content-poster img") || document.querySelector(".poster-panel img") || document.querySelector("img");
    if (posterImg && (data.poster || data.Poster)) {
        posterImg.src = data.poster || data.Poster;
    }

    setAdminText("detailTitle", data.title);
    setAdminText("detailYear", data.year);
    setAdminText("detailImdb", data.rating);

    setAdminText("detailGenre", data.genre);
    setAdminText("detailDuration", data.runtime ? `${data.runtime}` : null);

    setAdminText("detailDirector", data.director);
    setAdminText("detailWriter", data.writer);

    const actorsVal = Array.isArray(data.actors) ? data.actors.map(a => a.name || a).join(", ") : data.actors;
    setAdminText("detailCast", actorsVal);

    setAdminText("detailCountry", data.country);
    setAdminText("detailLanguage", data.language);
    setAdminText("detailAwards", data.awards);
    
    setAdminText("detailDescription", data.plot || data.description);

    // --- 2. SEZONLAR, FRAGMAN KARTLARI VE AKORDEON ---
    renderAccordionSeasonsWithTrailers(data);
}

function renderAccordionSeasonsWithTrailers(data) {
    let seasonsContainer = document.getElementById("seasonsContainer") || document.querySelector(".seasons-section");

    if (!seasonsContainer) {
        const headings = Array.from(document.querySelectorAll("h2, h3, h4, span, div"));
        const seasonHeader = headings.find(el => el.innerText.trim().toLowerCase() === "sezonlar");
        if (seasonHeader) seasonsContainer = seasonHeader.parentElement;
    }

    if (!seasonsContainer) return;

    // Backend'den gelen olası sezon, bölüm veya video listelerini alalım
    let seasonsData = data.seasons || data.seasonList || data.seasonsList || data.contentSeasons || [];
    let episodesData = data.episodes || data.episodeList || data.episodesList || [];
    let globalVideos = data.videos || data.trailers || [];

    // Eğer hiç sezon yok ama global videolar (konsolda gördüğümüz 'videos' dizisi) varsa, 
    // bunları otomatik olarak "1. Sezon" ve altındaki videolar/fragmanlar haline getirelim.
    if ((!seasonsData || seasonsData.length === 0) && globalVideos.length > 0) {
        seasonsData = [
            {
                name: "1. Sezon",
                seasonNumber: 1,
                trailers: globalVideos.map(v => ({
                    title: v.name || v.title || "Video",
                    videoUrl: v.key ? `https://www.youtube.com/embed/${v.key}` : (v.url || v.videoUrl),
                    thumbnailUrl: v.key ? `https://img.youtube.com/vi/${v.key}/hqdefault.jpg` : data.poster,
                    type: v.type || "Trailer"
                })),
                episodes: [] // Bölüm yoksa boş bırakıyoruz, kullanıcı yeni medya ekleyebilir
            }
        ];
    }

    // Eğer hala sezon verisi oluşmadıysa ama içerik bir series/movie ise boş bir 1. Sezon oluşturalım ki kullanıcı "Yeni Medya Ekle" diyebilsin
    if (!seasonsData || seasonsData.length === 0) {
        seasonsData = [
            {
                name: "1. Sezon",
                seasonNumber: 1,
                trailers: [],
                episodes: []
            }
        ];
    }

    const defaultDarkTrailerKey = "acJWpZvYNK0";

    if (seasonsData && seasonsData.length > 0) {
        seasonsContainer.innerHTML = seasonsData.map((season, idx) => {
            const isFirst = idx === 0;
            const seasonId = `season-content-${idx}`;
            const seasonTrailers = season.trailers || season.videos || [];

            return `
                <div class="season-item">
                    
                    <!-- SEZON AKORDEON BUTONU -->
                    <div class="season-header" onclick="toggleSeasonAccordion('${seasonId}', this)">
                        <span>
                            <span class="arrow-icon" style="display: inline-block; transition: transform 0.2s; transform: ${isFirst ? 'rotate(0deg)' : 'rotate(-90deg)'};">▼</span> 
                            ${season.name || season.title || `${idx + 1}. Sezon`}
                        </span>
                        <span style="color: var(--text2); font-size: 13px; font-weight: 500;">
                            ${(season.episodes ? season.episodes.length : 0)} Bölüm
                        </span>
                    </div>

                    <!-- SEZON İÇERİĞİ (FRAGMANLAR + BÖLÜMLER) -->
                    <div id="${seasonId}" class="season-episodes-container" style="display: ${isFirst ? 'block' : 'none'};">
                        
                        <!-- Sezon Fragmanları ve Videoları Alanı -->
                        <div class="season-videos-wrapper">
                            <div class="season-videos-title">
                                🎬 Sezon Fragmanları & Videoları
                            </div>
                            
                            <div class="video-grid">
                                ${seasonTrailers.length > 0 ? seasonTrailers.map(tr => `
                                    <div class="video-card" onclick="openVideoModal('${tr.videoUrl || tr.url}', '${tr.title || 'Sezon Videosu'}')">
                                        <div class="video-thumbnail-container">
                                            <img src="${tr.thumbnailUrl || data.poster || 'https://placehold.co/200x110/222/fff?text=Trailer'}" class="video-thumbnail" />
                                            <div class="play-overlay">
                                                <div class="play-icon-circle">▶</div>
                                            </div>
                                        </div>
                                        <div class="video-card-body">
                                            <div class="video-card-title">${tr.title || 'Trailer'}</div>
                                            <span class="video-card-badge">${tr.type || 'Trailer'}</span>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div class="video-card" onclick="openVideoModal('https://www.youtube.com/embed/${defaultDarkTrailerKey}', '${season.name || 'Sezon'} Fragman')">
                                        <div class="video-thumbnail-container">
                                            <img src="${data.poster || data.posterUrl || 'https://placehold.co/200x110/222/fff?text=Trailer'}" class="video-thumbnail" style="opacity: 0.8;" />
                                            <div class="play-overlay">
                                                <div class="play-icon-circle">▶</div>
                                            </div>
                                        </div>
                                        <div class="video-card-body">
                                            <div class="video-card-title">${season.name || 'Sezon'} Fragman</div>
                                            <span class="video-card-badge">Fragman</span>
                                        </div>
                                    </div>
                                `}

                                <!-- Yeni Medya Ekle Kartı -->
                                <div class="video-card add-media-card" onclick="openAddMediaModal(${season.seasonNumber || idx + 1})">
                                    <div class="add-media-inner">
                                        <div class="add-media-icon">+</div>
                                        <div class="add-media-text">Yeni Medya Ekle</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Bölümler Listesi -->
                        <div class="episode-list">
                            ${(season.episodes && season.episodes.length > 0) ? season.episodes.map(ep => {
                                const epTitle = ep.title || ep.name || 'Bölüm';
                                const epNum = ep.episodeNumber || ep.episode_number || 1;
                                const epDesc = ep.description || ep.overview || 'Açıklama bulunmuyor.';
                                const epRating = ep.imdbRating || ep.voteAverage || '7.5';
                                const epDuration = ep.durationMinutes || ep.duration || 45;
                                const epImg = ep.stillPath || ep.image || data.poster || 'https://placehold.co/140x90/1e232d/ffffff?text=No+Image';

                                return `
                                    <div class="episode-item">
                                        <img src="${epImg}" alt="${epTitle}" class="episode-poster" />
                                        <div class="episode-info">
                                            <h4 style="color: #fff; font-size: 15px;">${epNum}. ${epTitle}</h4>
                                            <p>${epDesc}</p>
                                            <div class="episode-meta">
                                                <span>⭐ ${epRating}</span>
                                                <span>⏱️ ${epDuration} dk</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<div style="padding: 20px; color:#5a6b82; font-size:13px;">Bu sezonda gösterilecek bölüm bulunamadı.</div>'}
                        </div>

                    </div>
                </div>
            `;
        }).join('');
    }
}

// Akordeon Mantığı
window.toggleSeasonAccordion = function(targetId, headerElement) {
    const allContainers = document.querySelectorAll('.season-episodes-container');
    const allArrows = document.querySelectorAll('.arrow-icon');

    allContainers.forEach(container => {
        if (container.id === targetId) {
            const isCurrentlyHidden = container.style.display === "none";
            allContainers.forEach(c => c.style.display = "none");
            allArrows.forEach(a => a.style.transform = "rotate(-90deg)");

            if (isCurrentlyHidden) {
                container.style.display = "block";
                const currentArrow = headerElement.querySelector('.arrow-icon');
                if (currentArrow) currentArrow.style.transform = "rotate(0deg)";
            }
        }
    });
};

// Video Oynatıcı Modalı
function ensureVideoModalExists() {
    if (document.getElementById("customVideoPlayerModal")) return;

    const modalHTML = `
        <div id="customVideoPlayerModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center;">
            <div style="background:#11141a; border:1px solid #1e232d; border-radius:10px; width:90%; max-width:750px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.8);">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:#151922; border-bottom:1px solid #1e232d;">
                    <h4 id="modalVideoTitle" style="color:#fff; font-size:15px; margin:0;">Video Oynatıcı</h4>
                    <button onclick="closeVideoModal()" style="background:none; border:none; color:#8a99ad; font-size:18px; cursor:pointer;">✕</button>
                </div>
                <div style="position:relative; width:100%; aspect-ratio:16/9; background:#000;">
                    <iframe id="modalVideoIframe" src="" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.openVideoModal = function(url, title) {
    const modal = document.getElementById("customVideoPlayerModal");
    const iframe = document.getElementById("modalVideoIframe");
    const titleEl = document.getElementById("modalVideoTitle");

    if (!modal || !iframe) return;

    let embedUrl = url || "";
    if (embedUrl.includes("watch?v=")) embedUrl = embedUrl.replace("watch?v=", "embed/");
    else if (embedUrl.includes("youtu.be/")) embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");

    iframe.src = embedUrl;
    if (titleEl) titleEl.innerText = title || "Fragman";
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};

window.closeVideoModal = function() {
    const modal = document.getElementById("customVideoPlayerModal");
    const iframe = document.getElementById("modalVideoIframe");
    if (modal) modal.style.display = "none";
    if (iframe) iframe.src = "";
    document.body.style.overflow = "auto";
};

// Yeni Medya Ekle Modal Tetikleyicisi (Gerekirse özelleştirilebilir)
window.openAddMediaModal = function(seasonNumber) {
    const addMediaModal = document.getElementById("addMediaModal");
    if (addMediaModal) {
        addMediaModal.classList.remove("hidden");
    } else {
        console.log("Medya ekleme modalı tetiklendi. Sezon:", seasonNumber);
    }
};

function setAdminText(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerText = (value && String(value).trim() !== "" && String(value).trim() !== "null") ? value : "-";
    }
}