document.addEventListener("DOMContentLoaded", () => {
    // 1. Şablon HTML Ekleme (Sayfada Modal Yoksa Oluşturur)
    if (!document.getElementById("detailModalOverlay")) {
        const modalHTML = `
        <div id="detailModalOverlay" class="modal-overlay">
            <div class="detail-modal">
                <button class="modal-close-btn" onclick="window.closeDetailModal()">&times;</button>
                <div id="modalHero" class="modal-hero">
                    <div class="modal-hero-overlay">
                        <div>
                            <h2 id="modalTitle" style="font-size:26px; font-weight:700; color:#fff; margin-bottom:4px;">-</h2>
                            <span id="modalTypeBadge" style="background:#e50914; padding:3px 8px; border-radius:4px; font-size:12px; color:#fff;">MOVIE</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-body">
                    <div id="modalMetaInfo" style="margin-bottom:16px; font-size:14px; color:#ccc; line-height:1.5;">
                        <p id="modalDescription" style="margin-bottom:8px; color:#e0e0e0;"></p>
                        <p id="modalCast" style="font-size:13px; color:#999;"></p>
                    </div>

                    <div class="watch-status-card" style="background:rgba(255,255,255,0.04); padding:12px; border-radius:8px; margin-bottom:16px;">
                        <div style="width: 100%;">
                            <div style="display:flex; justify-content:space-between; font-size:13px; color:#aaa; margin-bottom:6px;">
                                <span id="watchTimeText">İzleme Durumu: 0 / 0 dk</span>
                                <span id="watchPercentText">%0 Tamamlandı</span>
                            </div>
                            <input type="range" id="interactiveProgressBar" min="0" max="100" value="0" style="width:100%; cursor:pointer; accent-color:#e50914;" oninput="window.updateModalWatchProgress(this.value)">
                        </div>
                    </div>

                    <div class="modal-tabs" style="display:flex; gap:12px; border-bottom:1px solid #333; margin-bottom:16px; padding-bottom:8px;">
                        <button class="modal-tab-btn active" onclick="window.switchModalTab('episodes', event)">Sezon & Bölümler</button>
                        <button class="modal-tab-btn" onclick="window.switchModalTab('trailers', event)">Fragmanlar</button>
                        <button class="modal-tab-btn" onclick="window.switchModalTab('bts', event)">Sahne Arkası (BTS)</button>
                    </div>

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
});

let activeModalItem = null;

function extractVideoUrl(item, type = 'trailer') {
    if (!item) return null;
    let candidate = type === 'trailer' 
        ? (item.trailerUrl || item.trailer || item.trailerKey || item.youtubeKey || item.youtube_key || item.videoUrl || item.promoUrl)
        : (item.btsUrl || item.behindTheScenesUrl || item.extraUrl || item.btsKey || item.behind_the_scenes);

    const videosList = item.videos?.results || item.videos || item.videoList || [];
    if (!candidate && Array.isArray(videosList) && videosList.length > 0) {
        let targetVideo = type === 'trailer'
            ? (videosList.find(v => v.type?.toLowerCase().includes("trailer") || v.type?.toLowerCase().includes("teaser")) || videosList[0])
            : videosList.find(v => v.type?.toLowerCase().includes("behind") || v.type?.toLowerCase().includes("featurette") || v.type?.toLowerCase().includes("clip"));
        if (targetVideo) candidate = targetVideo.key || targetVideo.youtubeKey || targetVideo.url || targetVideo.id;
    }

    if (!candidate) return null;
    candidate = String(candidate).trim();
    if (candidate.includes('youtube.com/embed/')) return candidate;
    if (candidate.includes('watch?v=')) return candidate.replace('watch?v=', 'embed/').split('&')[0];
    if (candidate.includes('youtu.be/')) return candidate.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
    return !candidate.startsWith('http') ? `https://www.youtube.com/embed/${candidate}` : candidate;
}

// Global olarak çağrılacak Açma Fonksiyonu
window.openDetailModal = async function(contentId) {
    const overlay = document.getElementById("detailModalOverlay");
    if (overlay) overlay.classList.add("active");

    document.getElementById("modalTitle").innerText = "Yükleniyor...";
    document.getElementById("modalDescription").innerText = "";
    document.getElementById("modalCast").innerText = "";
    document.getElementById("episodesList").innerHTML = "<p style='color:#aaa;'>İçerik bilgileri getiriliyor...</p>";
    document.getElementById("trailersGrid").innerHTML = "";
    document.getElementById("btsGrid").innerHTML = "";

    try {
        let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
        if (token.startsWith("Bearer ")) token = token.substring(7);

        const res = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}`, {
            headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        
        if (!res.ok) throw new Error("Detay verisi alınamadı.");
        const data = await res.json();
        activeModalItem = data;

        const typeValue = (data.contentType || data.type || data.genre || '').toUpperCase();
        const isSeries = typeValue.includes('SERIES') || typeValue.includes('TV') || typeValue.includes('DİZİ');

        document.getElementById("modalTitle").innerText = data.title || data.name || "İçerik Detayı";
        document.getElementById("modalTypeBadge").innerText = isSeries ? 'SERIES' : 'MOVIE';

        const episodesTabBtn = document.querySelector(".modal-tab-btn[onclick*='episodes']");
        if (episodesTabBtn) {
            if (isSeries) {
                episodesTabBtn.style.display = "inline-block";
                window.switchModalTab('episodes');
            } else {
                episodesTabBtn.style.display = "none";
                window.switchModalTab('trailers');
            }
        }

        const posterSrc = data.poster || data.posterUrl || data.bannerUrl || data.backdropPath || 'https://placehold.co/300x450?text=G%C3%B6rsel+Yok';
        document.getElementById("modalHero").style.backgroundImage = `url('${posterSrc}')`;

        const overviewText = data.description || data.overview || data.summary || data.synopsis || data.plot;
        document.getElementById("modalDescription").innerText = overviewText || "Bu içerik için özet açıklaması bulunmuyor.";

        const castText = data.cast || data.actors || data.actorsList || data.starring;
        const castElem = document.getElementById("modalCast");
        if (castText && ((Array.isArray(castText) && castText.length > 0) || String(castText).trim() !== '')) {
            castElem.style.display = "block";
            castElem.innerHTML = `<strong>Başroller:</strong> ${Array.isArray(castText) ? castText.map(c => c.name || c).join(', ') : castText}`;
        } else {
            castElem.style.display = "none";
        }

        if (isSeries) {
            let seasonsData = data.seasons || data.seasonList || [];
            let episodesData = data.episodes || data.episodeList || [];

            if (seasonsData.length === 0 && episodesData.length > 0) {
                const grouped = {};
                episodesData.forEach(ep => {
                    const sNum = ep.seasonNumber || ep.season_number || ep.season || 1;
                    if (!grouped[sNum]) grouped[sNum] = [];
                    grouped[sNum].push(ep);
                });
                seasonsData = Object.keys(grouped).map(sNum => ({ name: `${sNum}. Sezon`, episodes: grouped[sNum] }));
            }

            const epContainer = document.getElementById("episodesList");
            if (seasonsData.length > 0) {
                epContainer.innerHTML = seasonsData.map((s, idx) => `
                    <div class="season-accordion-item" style="margin-bottom:10px; background:rgba(255,255,255,0.05); border-radius:8px; overflow:hidden;">
                        <div class="season-header" onclick="window.toggleSeasonAccordion(this)" style="padding:14px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.08);">
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

        let total = data.durationMinutes || data.duration || data.runtime || data.totalMinutes || (isSeries ? 450 : 120);
        const watched = data.watchedMinutes || data.progressMinutes || 0;
        const percent = Math.min(Math.round((watched / total) * 100), 100);

        document.getElementById("interactiveProgressBar").value = percent;
        updateWatchBarUI(watched, total, percent);

        const trailerEmbedUrl = extractVideoUrl(data, 'trailer');
        const btsEmbedUrl = extractVideoUrl(data, 'bts');

        document.getElementById("trailersGrid").innerHTML = trailerEmbedUrl 
            ? `<iframe src="${trailerEmbedUrl}" style="width:100%; aspect-ratio:16/9; border:none; border-radius:8px;" allowfullscreen></iframe>`
            : "<p style='color:#aaa;'>Bu içerik için henüz fragman eklenmemiş.</p>";

        document.getElementById("btsGrid").innerHTML = btsEmbedUrl 
            ? `<iframe src="${btsEmbedUrl}" style="width:100%; aspect-ratio:16/9; border:none; border-radius:8px;" allowfullscreen></iframe>`
            : "<p style='color:#aaa;'>Bu içerik için henüz sahne arkası videosu eklenmemiş.</p>";

    } catch (err) {
        console.error("Detay getirme hatası:", err);
        document.getElementById("modalTitle").innerText = "Hata Oluştu";
    }
};

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
            </div>`;
    }).join('');
}

window.toggleSeasonAccordion = function(headerElem) {
    const currentBody = headerElem.nextElementSibling;
    const isOpening = currentBody.style.display === "none";

    document.querySelectorAll(".season-episodes-list").forEach(list => list.style.display = "none");
    document.querySelectorAll(".acc-icon").forEach(icon => icon.innerText = icon.innerText.replace('▲', '▼'));

    if (isOpening) {
        currentBody.style.display = "block";
        const icon = headerElem.querySelector(".acc-icon");
        if (icon) icon.innerText = icon.innerText.replace('▼', '▲');
    }
};

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
    const overlay = document.getElementById("detailModalOverlay");
    if (overlay) overlay.classList.remove("active");
};

window.switchModalTab = function(tabName, evt) {
    document.querySelectorAll(".modal-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    if (evt && evt.target) {
        evt.target.classList.add("active");
    } else {
        const defaultBtn = document.querySelector(`.modal-tab-btn[onclick*='${tabName}']`);
        if (defaultBtn) defaultBtn.classList.add("active");
    }
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.add("active");
};