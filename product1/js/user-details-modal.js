// Kartlardan gelen çağrıyı modal açma fonksiyonuna bağlar
window.openDetailModal = function(contentId) {
    openContentDetailModal(contentId);
};

// Modal Açma Fonksiyonu
async function openContentDetailModal(contentId) {
    const modal = document.getElementById("contentDetailModal") || document.getElementById("detailModal");
    if (!modal) {
        console.error("User detay modalı (DOM) bulunamadı.");
        return;
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
    if (token.startsWith("Bearer ")) token = token.substring(7);

    try {
        const headers = {
            "Authorization": token ? `Bearer ${token}` : "",
            "Content-Type": "application/json"
        };

        // 1. Ana İçerik Detayını Çek
        const response = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}`, { headers });
        if (!response.ok) throw new Error("İçerik çekilemedi: " + response.status);

        const data = await response.json();

        // 2. Bölümleri Ayrı Endpoint'ten Çek ve 'data.episodes' İçine Ekle (Açıklamalar Dahil)
        try {
            const episodesResponse = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/episodes/content/${contentId}`, { headers });
            if (episodesResponse.ok) {
                const episodesData = await episodesResponse.json();
                data.episodes = episodesData;
            } else {
                data.episodes = [];
            }
        } catch (epError) {
            console.warn("Kullanıcı modalı bölüm çekme hatası:", epError);
            data.episodes = [];
        }

        console.log("Backend'den Gelen Birleştirilmiş İçerik Verisi:", data);
        renderUserModalContent(data);
        ensureUserVideoModalExists();

    } catch (error) {
        console.error("Modal yükleme hatası:", error);
    }
}

// Modal İçeriğini Doldurma
function renderUserModalContent(data) {
    if (!data) return;

    // Kapak ve Başlık Bilgileri
    const bannerImg = document.getElementById("modalBanner") || document.querySelector(".modal-header-img");
    if (bannerImg) {
        bannerImg.src = data.backdropPath || data.bannerUrl || data.poster || data.posterUrl || 'https://placehold.co/800x400/111/fff?text=No+Cover';
    }

    setUserText("modalTitle", data.title || data.name);
    setUserText("modalOverview", data.description || data.overview || data.plot || data.synopsis);

    const typeBadge = document.getElementById("modalTypeBadge");
    if (typeBadge) {
        typeBadge.innerText = (data.type || data.category || "SERIES").toUpperCase();
    }

    // İlerleme Çubuğu (Kaldığı Yer)
    const progressText = document.getElementById("modalProgressText");
    const progressBar = document.getElementById("modalProgressBar");
    const watchMinutes = data.watchedMinutes || 0;
    const totalMinutes = data.durationMinutes || data.totalDuration || 450;
    const percent = Math.min(100, Math.round((watchMinutes / totalMinutes) * 100));

    if (progressText) progressText.innerText = `Kaldığı Yer: ${watchMinutes}. dk / ${totalMinutes} dk (%${percent} Tamamlandı)`;
    if (progressBar) progressBar.style.width = `${percent}%`;

    // Sekme Yapısı
    setupUserModalTabs(data);
}

// Sekmeler: Sezon & Bölümler, Fragmanlar, Sahne Arkası (BTS)
function setupUserModalTabs(data) {
    const tabContainer = document.getElementById("modalTabBody") || document.querySelector(".modal-tab-body");
    if (!tabContainer) return;

    tabContainer.innerHTML = `
        <div style="display: flex; gap: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 16px; padding-bottom: 8px;">
            <button id="userTabBtnSeasons" onclick="switchUserTab('seasons')" style="background: none; border: none; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; border-bottom: 2px solid #e50914; padding-bottom: 6px;">Sezon & Bölümler</button>
            <button id="userTabBtnTrailer" onclick="switchUserTab('trailer')" style="background: none; border: none; color: #888; font-size: 14px; font-weight: 600; cursor: pointer; padding-bottom: 6px;">Fragmanlar</button>
            <button id="userTabBtnBts" onclick="switchUserTab('bts')" style="background: none; border: none; color: #888; font-size: 14px; font-weight: 600; cursor: pointer; padding-bottom: 6px;">Sahne Arkası (BTS)</button>
        </div>

        <div id="userTabSeasons" style="display: block;"></div>
        <div id="userTabTrailer" style="display: none;"></div>
        <div id="userTabBts" style="display: none;"></div>
    `;

    // A) SEZON & BÖLÜMLER (SADECE AKORDEON + BÖLÜMLER)
    const seasonsBox = document.getElementById("userTabSeasons");
    let seasonsData = data.seasons || data.seasonList || [];
    let episodesData = data.episodes || data.episodeList || [];

    if ((!seasonsData || seasonsData.length === 0) && episodesData.length > 0) {
        const grouped = {};
        episodesData.forEach(ep => {
            const sNum = ep.seasonNumber || ep.season_number || ep.season || 1;
            if (!grouped[sNum]) grouped[sNum] = [];
            grouped[sNum].push(ep);
        });
        seasonsData = Object.keys(grouped).sort((a, b) => a - b).map(sNum => ({
            name: `${sNum}. Sezon`,
            seasonNumber: sNum,
            episodes: grouped[sNum]
        }));
    }

    if (seasonsData && seasonsData.length > 0) {
        seasonsBox.innerHTML = seasonsData.map((season, idx) => {
            const isFirst = idx === 0;
            const seasonId = `user-season-content-${idx}`;
            // Eğer sezonun kendi içinde bölümleri yoksa ama genel episodes dizisinde bu sezona ait bölüm varsa eşitleyelim
            const seasonEpisodes = season.episodes && season.episodes.length > 0 
                ? season.episodes 
                : (data.episodes ? data.episodes.filter(ep => (ep.seasonNumber || ep.season || 1) === (season.seasonNumber || idx + 1)) : []);

            return `
                <div style="background: #11141a; border: 1px solid #1e232d; border-radius: 8px; margin-bottom: 12px; overflow: hidden;">
                    <button type="button" onclick="toggleUserSeasonAccordion('${seasonId}', this)" 
                        style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #151922; border: none; cursor: pointer; outline: none;">
                        <span style="color: #9ab; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <span class="user-arrow-icon" style="display: inline-block; transition: transform 0.2s; transform: ${isFirst ? 'rotate(0deg)' : 'rotate(-90deg)'};">▼</span> 
                            ${season.name || `${idx + 1}. Sezon`}
                        </span>
                        <span style="color: #6a7b95; font-size: 13px; font-weight: 500;">
                            ${seasonEpisodes.length} Bölüm
                        </span>
                    </button>

                    <div id="${seasonId}" class="user-season-episodes-container" style="display: ${isFirst ? 'block' : 'none'}; padding: 14px;">
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${seasonEpisodes.length > 0 ? seasonEpisodes.map(ep => {
                                const epImg = ep.stillPath || ep.image || ep.poster || data.poster || 'https://placehold.co/120x70/222/fff?text=No+Image';
                                const epDesc = ep.plot || ep.description || ep.overview || ep.synopsis;
                                
                                return `
                                    <div style="display: flex; gap: 12px; background: rgba(0, 0, 0, 0.4); padding: 10px; border-radius: 6px; align-items: center; border: 1px solid #191d26;">
                                        <img src="${epImg}" style="width: 110px; height: 70px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" />
                                        <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px;">
                                            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #fff;">
                                                <span>${ep.episodeNumber || ep.episode_number || 1}. ${ep.title || ep.name || 'Bölüm'}</span>
                                                <span style="color: #888; font-size: 11px;">⏱️ ${ep.durationMinutes || ep.duration || 45} min</span>
                                            </div>
                                            <p style="color: #8a99ad; font-size: 11px; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                                ${epDesc && epDesc.trim() !== "" ? epDesc : 'Açıklama bulunmuyor.'}
                                            </p>
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<p style="color:#666; font-size:12px; margin:0;">Bu sezona ait bölüm bulunamadı.</p>'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        seasonsBox.innerHTML = `<p style="color: #888; font-size: 13px; padding: 10px 0;">Bu diziye ait henüz sezon veya bölüm bilgisi yüklenmedi.</p>`;
    }

    // B) FRAGMANLAR TABI
    const trailerBox = document.getElementById("userTabTrailer");
    let allTrailers = [];

    if (data.trailerKey) {
        allTrailers.push({
            title: (data.title || "İçerik") + " Fragman",
            videoUrl: data.trailerKey
        });
    }

    const videoList = data.videos || data.results || data.trailerList;
    if (Array.isArray(videoList)) {
        videoList.forEach(vid => {
            if (vid.key && (vid.type === "Trailer" || vid.type === "Teaser" || !vid.type)) {
                allTrailers.push({
                    title: vid.name || "Fragman",
                    videoUrl: vid.key
                });
            }
        });
    }

    if (allTrailers.length > 0) {
        trailerBox.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; margin-top: 10px;">
                ${allTrailers.map(tr => {
                    let vUrl = tr.videoUrl;
                    if (!vUrl.includes("http") && !vUrl.includes("/")) {
                        vUrl = `https://www.youtube.com/embed/${vUrl}`;
                    }
                    const thumb = data.poster || 'https://placehold.co/220x120/222/fff?text=Trailer';
                    
                    return `
                        <div onclick="openUserVideoModal('${vUrl}', '${tr.title}')" style="background: #151922; border: 1px solid #1e232d; border-radius: 8px; overflow: hidden; cursor: pointer;">
                            <div style="position: relative; height: 120px; background: #0b0d12;">
                                <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" />
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 36px; height: 36px; background: rgba(229, 9, 20, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px;">▶</div>
                            </div>
                            <div style="padding: 10px;">
                                <p style="color: #fff; font-size: 12px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${tr.title}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        const searchTitle = encodeURIComponent((data.title || "Movie") + " official trailer");
        trailerBox.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; display: flex; flex-direction: column; gap: 12px; align-items: center;">
                <p style="color: #888; font-size: 13px; margin: 0;">Bu içerik için sisteme kayıtlı bir fragman bulunmuyor.</p>
                <a href="https://www.youtube.com/results?search_query=${searchTitle}" target="_blank" 
                   style="background: #e50914; color: #fff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                    ▶ YouTube'da Fragman Ara
                </a>
            </div>
        `;
    }

    // C) SAHNE ARKASI (BTS) TABI
    const btsBox = document.getElementById("userTabBts");
    const btsSource = data.btsKey || data.btsUrl || data.behindTheScenes;

    if (btsSource && btsSource !== "null" && btsSource !== "undefined") {
        let btsEmbed = btsSource;
        if (!btsSource.includes("http") && !btsSource.includes("/")) {
            btsEmbed = `https://www.youtube.com/embed/${btsSource}`;
        }
        btsBox.innerHTML = `
            <div style="width: 100%; aspect-ratio: 16/9; margin-top: 10px;">
                <iframe width="100%" height="100%" src="${btsEmbed}" frameborder="0" allowfullscreen style="border-radius: 6px;"></iframe>
            </div>
        `;
    } else {
        const btsSearch = encodeURIComponent((data.title || "Movie") + " behind the scenes");
        btsBox.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; display: flex; flex-direction: column; gap: 12px; align-items: center;">
                <p style="color: #888; font-size: 13px; margin: 0;">Sahne arkası içeriği bulunamadı.</p>
                <a href="https://www.youtube.com/results?search_query=${btsSearch}" target="_blank" 
                   style="background: #222; color: #fff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; border: 1px solid #444; display: inline-flex; align-items: center; gap: 8px;">
                    🔍 YouTube'da Sahne Arkası Ara
                </a>
            </div>
        `;
    }
}

// Akordeon Mantığı (Tek Sezon Açık Kalır)
window.toggleUserSeasonAccordion = function(targetId, btnElement) {
    const allContainers = document.querySelectorAll('.user-season-episodes-container');
    const allArrows = document.querySelectorAll('.user-arrow-icon');

    allContainers.forEach(container => {
        if (container.id === targetId) {
            const isCurrentlyHidden = container.style.display === "none";
            allContainers.forEach(c => c.style.display = "none");
            allArrows.forEach(a => a.style.transform = "rotate(-90deg)");

            if (isCurrentlyHidden) {
                container.style.display = "block";
                const currentArrow = btnElement.querySelector('.user-arrow-icon');
                if (currentArrow) currentArrow.style.transform = "rotate(0deg)";
            }
        }
    });
};

// Kullanıcı Video Oynatma Modalı
function ensureUserVideoModalExists() {
    if (document.getElementById("userCustomVideoModal")) return;

    const modalHTML = `
        <div id="userCustomVideoModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:99999; justify-content:center; align-items:center;">
            <div style="background:#11141a; border:1px solid #1e232d; border-radius:10px; width:90%; max-width:700px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.8);">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#151922; border-bottom:1px solid #1e232d;">
                    <h4 id="userModalVideoTitle" style="color:#fff; font-size:14px; margin:0;">Video Oynatıcı</h4>
                    <button onclick="closeUserVideoModal()" style="background:none; border:none; color:#8a99ad; font-size:16px; cursor:pointer;">✕</button>
                </div>
                <div style="position:relative; width:100%; aspect-ratio:16/9; background:#000;">
                    <iframe id="userModalVideoIframe" src="" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.openUserVideoModal = function(url, title) {
    const modal = document.getElementById("userCustomVideoModal");
    const iframe = document.getElementById("userModalVideoIframe");
    const titleEl = document.getElementById("userModalVideoTitle");

    if (!modal || !iframe) return;

    let embedUrl = url || "";
    if (embedUrl.includes("watch?v=")) embedUrl = embedUrl.replace("watch?v=", "embed/");
    else if (embedUrl.includes("youtu.be/")) embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");

    iframe.src = embedUrl;
    if (titleEl) titleEl.innerText = title || "Fragman";
    modal.style.display = "flex";
};

window.closeUserVideoModal = function() {
    const modal = document.getElementById("userCustomVideoModal");
    const iframe = document.getElementById("userModalVideoIframe");
    if (modal) modal.style.display = "none";
    if (iframe) iframe.src = "";
};

// Kullanıcı Sekme Değiştirme
window.switchUserTab = function(tabName) {
    const tabs = ['seasons', 'trailer', 'bts'];
    tabs.forEach(t => {
        const content = document.getElementById(`userTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
        const btn = document.getElementById(`userTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (content && btn) {
            if (t === tabName) {
                content.style.display = "block";
                btn.style.color = "#fff";
                btn.style.borderBottom = "2px solid #e50914";
            } else {
                content.style.display = "none";
                btn.style.color = "#888";
                btn.style.borderBottom = "none";
            }
        }
    });
};

function closeContentDetailModal() {
    const modal = document.getElementById("contentDetailModal") || document.getElementById("detailModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

function setUserText(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = value || "";
}