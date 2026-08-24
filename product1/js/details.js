document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get("id");

    if (!contentId) {
        console.error("URL'de 'id' parametresi bulunamadı.");
        return;
    }

    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
    if (token.startsWith("Bearer ")) token = token.substring(7);

    try {
        const response = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}/details`, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Veri çekilemedi: " + response.status);

        const data = await response.json();
        renderAdminDetailsPage(data);
        ensureVideoModalExists();

    } catch (error) {
        console.error("Admin detay yükleme hatası:", error);
    }
});

function renderAdminDetailsPage(data) {
    if (!data) return;

    // --- 1. ÜST BİLGİLER ---
    const posterImg = document.querySelector(".content-poster img") || document.querySelector("img");
    // Java DTO/Entity modelinde poster alanı 'poster' veya büyük harf 'Poster' dönebilir
    if (posterImg && (data.poster || data.Poster)) {
        posterImg.src = data.poster || data.Poster;
    }

    setAdminText("detailTitle", data.title);
    setAdminText("detailYear", data.year);
    setAdminText("detailImdb", data.rating);

    // Java entity'sinde genre string olarak tutuluyor
    setAdminText("detailGenre", data.genre);

    setAdminText("detailDuration", data.runtime ? `${data.runtime}` : null);

    setAdminText("detailDirector", data.director);
    setAdminText("detailWriter", data.writer);

    // Oyuncular (Actors) entity listesinden string'e dönüştürülüyor veya doğrudan gelebiliyor
    const actorsVal = Array.isArray(data.actors) ? data.actors.map(a => a.name || a).join(", ") : data.actors;
    setAdminText("detailCast", actorsVal);

    setAdminText("detailCountry", data.country);
    setAdminText("detailLanguage", data.language);
    setAdminText("detailAwards", data.awards);
    
    // Java tarafında açıklama alanı 'plot' olarak tanımlı
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

    let seasonsData = data.seasons || data.seasonList || [];
    let episodesData = data.episodes || data.episodeList || [];

    if ((!seasonsData || seasonsData.length === 0) && episodesData.length > 0) {
        const grouped = {};
        episodesData.forEach(ep => {
            const sNum = ep.seasonNumber || ep.season_number || ep.season || 1;
            if (!grouped[sNum]) grouped[sNum] = [];
            grouped[sNum].push(ep);
        });
        seasonsData = Object.keys(grouped).map(sNum => ({
            name: `${sNum}. Sezon`,
            seasonNumber: sNum,
            episodes: grouped[sNum]
        }));
    }

    const defaultDarkTrailerKey = "acJWpZvYNK0";

    if (seasonsData && seasonsData.length > 0) {
        seasonsContainer.innerHTML = seasonsData.map((season, idx) => {
            const isFirst = idx === 0;
            const seasonId = `season-content-${idx}`;
            const seasonTrailers = season.trailers || season.videos || data.trailers || [];

            return `
                <div class="season-accordion-item" style="background: #11141a; border: 1px solid #1e232d; border-radius: 8px; margin-top: 12px; overflow: hidden;">
                    
                    <!-- SEZON AKORDEON BUTONU -->
                    <button type="button" class="season-toggle-btn" onclick="toggleSeasonAccordion('${seasonId}', this)" 
                        style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #151922; border: none; cursor: pointer; outline: none;">
                        <span style="color: #9ab; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <span class="arrow-icon" style="display: inline-block; transition: transform 0.2s; transform: ${isFirst ? 'rotate(0deg)' : 'rotate(-90deg)'};">▼</span> 
                            ${season.name || `${idx + 1}. Sezon`}
                        </span>
                        <span style="color: #6a7b95; font-size: 13px; font-weight: 500;">
                            ${(season.episodes ? season.episodes.length : 0)} Bölüm
                        </span>
                    </button>

                    <!-- SEZON İÇERİĞİ (FRAGMANLAR + BÖLÜMLER) -->
                    <div id="${seasonId}" class="season-episodes-container" style="display: ${isFirst ? 'block' : 'none'}; padding: 16px;">
                        
                        <!-- Sezon Fragmanları Paneli -->
                        <div style="margin-bottom: 20px;">
                            <div style="color: #c5d1e0; font-size: 13px; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                                🎬 Sezon Fragmanları & Videoları
                            </div>
                            
                            <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;">
                                ${seasonTrailers.length > 0 ? seasonTrailers.map(tr => `
                                    <div onclick="openVideoModal('${tr.videoUrl || tr.url}', '${tr.title || 'Sezon Videosu'}')" style="min-width: 200px; width: 200px; background: #151922; border: 1px solid #1e232d; border-radius: 6px; overflow: hidden; cursor: pointer;">
                                        <div style="position: relative; height: 110px; background: #0b0d12;">
                                            <img src="${tr.thumbnailUrl || data.poster || 'https://placehold.co/200x110/222/fff?text=Trailer'}" style="width: 100%; height: 100%; object-fit: cover;" />
                                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; background: rgba(229, 9, 20, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px;">▶</div>
                                        </div>
                                        <div style="padding: 6px;">
                                            <p style="color: #fff; font-size: 11px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${tr.title || 'Trailer'}</p>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div onclick="openVideoModal('https://www.youtube.com/embed/${defaultDarkTrailerKey}', '${season.name} Fragman')" style="min-width: 200px; width: 200px; background: #151922; border: 1px solid #1e232d; border-radius: 6px; overflow: hidden; cursor: pointer;">
                                        <div style="position: relative; height: 110px; background: #0b0d12;">
                                            <img src="${data.poster || data.posterUrl || 'https://placehold.co/200x110/222/fff?text=Trailer'}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;" />
                                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 32px; height: 32px; background: rgba(229, 9, 20, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px;">▶</div>
                                        </div>
                                        <div style="padding: 6px;">
                                            <p style="color: #fff; font-size: 11px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${season.name} Fragman</p>
                                        </div>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Bölümler Listesi -->
                        <div style="display: flex; flex-direction: column; gap: 14px;">
                            ${(season.episodes && season.episodes.length > 0) ? season.episodes.map(ep => {
                                const epTitle = ep.title || ep.name || 'Bölüm';
                                const epNum = ep.episodeNumber || ep.episode_number || 1;
                                const epDesc = ep.description || ep.overview || 'Açıklama bulunmuyor.';
                                const epRating = ep.imdbRating || ep.voteAverage || '7.5';
                                const epDuration = ep.durationMinutes || ep.duration || 45;
                                const epImg = ep.stillPath || ep.image || data.poster || 'https://placehold.co/140x90/1e232d/ffffff?text=No+Image';

                                return `
                                    <div style="display: flex; gap: 16px; background: #0b0d12; border: 1px solid #191d26; border-radius: 8px; padding: 12px; align-items: flex-start;">
                                        <img src="${epImg}" alt="${epTitle}" style="width: 140px; height: 90px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" />
                                        <div style="display: flex; flex-direction: column; gap: 6px; flex-grow: 1;">
                                            <h5 style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">
                                                ${epNum}. ${epTitle}
                                            </h5>
                                            <p style="color: #8a99ad; font-size: 12px; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                                ${epDesc}
                                            </p>
                                            <div style="display: flex; align-items: center; gap: 12px; font-size: 11px; color: #f5c518; margin-top: 4px;">
                                                <span>⭐ ${epRating}</span>
                                                <span style="color: #5a6b82;">⏱️ ${epDuration} dk</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<p style="color:#5a6b82; font-size:13px; margin:0;">Bu sezonda gösterilecek bölüm bulunamadı.</p>'}
                        </div>

                    </div>
                </div>
            `;
        }).join('');
    } else {
        seasonsContainer.innerHTML = `
            <div style="background: #11141a; border: 1px solid #1e232d; border-radius: 8px; padding: 20px; margin-top: 15px;">
                <p style="color: #6a7b95; font-size: 14px; margin: 0;">Bu diziye ait henüz sezon veya bölüm bilgisi yüklenmedi.</p>
            </div>
        `;
    }
}

// Akordeon Mantığı
window.toggleSeasonAccordion = function(targetId, btnElement) {
    const allContainers = document.querySelectorAll('.season-episodes-container');
    const allArrows = document.querySelectorAll('.arrow-icon');

    allContainers.forEach(container => {
        if (container.id === targetId) {
            const isCurrentlyHidden = container.style.display === "none";
            allContainers.forEach(c => c.style.display = "none");
            allArrows.forEach(a => a.style.transform = "rotate(-90deg)");

            if (isCurrentlyHidden) {
                container.style.display = "block";
                const currentArrow = btnElement.querySelector('.arrow-icon');
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

function setAdminText(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerText = (value && String(value).trim() !== "" && String(value).trim() !== "null") ? value : "-";
    }
}