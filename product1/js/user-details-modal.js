// Modal Açma Fonksiyonu
async function openContentDetailModal(contentId) {
    const modal = document.getElementById("contentDetailModal") || document.getElementById("detailModal");
    if (!modal) {
        console.error("User detay modalı (DOM) bulunamadı.");
        return;
    }

    // Modal'ı görünür yap
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Arka plan kaymasını engelle

    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
    if (token.startsWith("Bearer ")) token = token.substring(7);

    try {
        const response = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}`, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("İçerik çekilemedi: " + response.status);

        const data = await response.json();
        renderUserModalContent(data);

    } catch (error) {
        console.error("Modal yükleme hatası:", error);
    }
}

// Modal İçeriğini Doldurma
function renderUserModalContent(data) {
    if (!data) return;

    // 1. Kapak ve Başlık Bilgileri
    const bannerImg = document.getElementById("modalBanner") || document.querySelector(".modal-header-img");
    if (bannerImg) {
        bannerImg.src = data.backdropPath || data.bannerUrl || data.poster || data.posterUrl || 'https://placehold.co/800x400/111/fff?text=No+Cover';
    }

    setUserText("modalTitle", data.title || data.name);
    setUserText("modalOverview", data.description || data.overview || data.synopsis);

    // Tür ve Etiket
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

    // 2. Sekme Yapısını ve İçeriğini Oluştur
    setupUserModalTabs(data);
}

// Sekmeler: Sezon & Bölümler, Fragmanlar, Sahne Arkası (BTS)
function setupUserModalTabs(data) {
    const tabContainer = document.getElementById("modalTabBody") || document.querySelector(".modal-tab-body");
    if (!tabContainer) return;

    tabContainer.innerHTML = `
        <!-- Sekme Başlıkları -->
        <div style="display: flex; gap: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 16px; padding-bottom: 8px;">
            <button id="userTabBtnSeasons" onclick="switchUserTab('seasons')" style="background: none; border: none; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; border-bottom: 2px solid #e50914; padding-bottom: 6px;">Sezon & Bölümler</button>
            <button id="userTabBtnTrailer" onclick="switchUserTab('trailer')" style="background: none; border: none; color: #888; font-size: 14px; font-weight: 600; cursor: pointer; padding-bottom: 6px;">Fragmanlar</button>
            <button id="userTabBtnBts" onclick="switchUserTab('bts')" style="background: none; border: none; color: #888; font-size: 14px; font-weight: 600; cursor: pointer; padding-bottom: 6px;">Sahne Arkası (BTS)</button>
        </div>

        <!-- Sekme İçerikleri -->
        <div id="userTabSeasons" style="display: block;"></div>
        <div id="userTabTrailer" style="display: none;"></div>
        <div id="userTabBts" style="display: none;"></div>
    `;

    // A) SEZON & BÖLÜMLER
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
        seasonsData = Object.keys(grouped).map(sNum => ({
            name: `${sNum}. Sezon`,
            seasonNumber: sNum,
            episodes: grouped[sNum]
        }));
    }

    if (seasonsData && seasonsData.length > 0) {
        seasonsBox.innerHTML = seasonsData.map((season, idx) => `
            <div style="background: rgba(255, 255, 255, 0.04); border-radius: 6px; padding: 14px; margin-bottom: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; font-weight: 600; color: #fff;">
                    <span>${season.name || `${idx + 1}. Sezon`}</span>
                    <span style="color: #777; font-size: 12px;">${(season.episodes ? season.episodes.length : 0)} Bölüm ▲</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${(season.episodes && season.episodes.length > 0) ? season.episodes.map(ep => {
                        const epImg = ep.stillPath || ep.image || ep.poster || data.poster || 'https://placehold.co/120x70/222/fff?text=No+Image';
                        return `
                            <div style="display: flex; gap: 12px; background: rgba(0, 0, 0, 0.4); padding: 10px; border-radius: 6px; align-items: center;">
                                <img src="${epImg}" style="width: 100px; height: 60px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" />
                                <div style="flex-grow: 1;">
                                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: #fff;">
                                        <span>${ep.episodeNumber || ep.episode_number || 1}. ${ep.title || ep.name || 'Bölüm'}</span>
                                        <span style="color: #888; font-size: 11px;">${ep.durationMinutes || ep.duration || 45} min dk</span>
                                    </div>
                                    <p style="color: #888; font-size: 11px; margin: 4px 0 0 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                        ${ep.description || ep.overview || 'Açıklama bulunmuyor.'}
                                    </p>
                                </div>
                            </div>
                        `;
                    }).join('') : '<p style="color:#666; font-size:12px; margin:0;">Bu sezona ait bölüm bulunamadı.</p>'}
                </div>
            </div>
        `).join('');
    } else {
        seasonsBox.innerHTML = `<p style="color: #888; font-size: 13px; padding: 10px 0;">Bu diziye ait henüz sezon veya bölüm bilgisi yüklenmedi.</p>`;
    }

    // B) FRAGMANLAR
    const trailerBox = document.getElementById("userTabTrailer");
    const trailerUrl = data.trailerUrl || data.trailer || data.videoUrl;

    if (trailerUrl) {
        let embedUrl = trailerUrl;
        if (trailerUrl.includes("youtube.com/watch?v=")) embedUrl = trailerUrl.replace("watch?v=", "embed/");
        else if (trailerUrl.includes("youtu.be/")) embedUrl = trailerUrl.replace("youtu.be/", "youtube.com/embed/");

        trailerBox.innerHTML = `
            <div style="width: 100%; aspect-ratio: 16/9; margin-top: 10px;">
                <iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allowfullscreen style="border-radius: 6px;"></iframe>
            </div>
        `;
    } else {
        trailerBox.innerHTML = `<p style="color: #888; font-size: 13px; padding: 10px 0;">Bu içerik için fragman eklenmemiş.</p>`;
    }

    // C) SAHNE ARKASI (BTS)
    const btsBox = document.getElementById("userTabBts");
    const btsUrl = data.btsUrl || data.behindTheScenes;

    if (btsUrl) {
        btsBox.innerHTML = `<p style="color: #ccc; font-size: 13px;">Sahne Arkası Videosu: <a href="${btsUrl}" target="_blank" style="color: #e50914;">İzle</a></p>`;
    } else {
        btsBox.innerHTML = `<p style="color: #888; font-size: 13px; padding: 10px 0;">Sahne arkası (BTS) içeriği bulunamadı.</p>`;
    }
}

// User Sekme Değiştirme
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

// Modal Kapatma
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