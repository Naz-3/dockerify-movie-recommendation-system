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
        const response = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}`, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Veri çekilemedi: " + response.status);

        const data = await response.json();
        renderAdminDetailsPage(data);

    } catch (error) {
        console.error("Hata:", error);
    }
});

function renderAdminDetailsPage(data) {
    if (!data) return;

    // --- 1. ÜST BİLGİ ALANLARI (ADMIN TASARIMI) ---
    const posterImg = document.querySelector(".content-poster img") || document.querySelector("img");
    if (posterImg && (data.poster || data.posterUrl)) {
        posterImg.src = data.poster || data.posterUrl;
    }

    setAdminText("detailTitle", data.title || data.name);
    setAdminText("detailYear", data.releaseYear || data.year || (data.firstAirDate ? data.firstAirDate.substring(0, 4) : null));
    setAdminText("detailImdb", data.imdbRating || data.voteAverage || data.rating);

    const genreVal = Array.isArray(data.genres) ? data.genres.map(g => g.name || g).join(", ") : (data.genre || data.category);
    setAdminText("detailGenre", genreVal);

    const durationVal = data.durationMinutes || data.duration || data.runtime;
    setAdminText("detailDuration", durationVal ? `${durationVal} dk` : null);

    setAdminText("detailDirector", data.director);
    setAdminText("detailWriter", data.writer || data.creator);

    const castVal = Array.isArray(data.cast) ? data.cast.map(c => c.name || c).join(", ") : (data.cast || data.actors);
    setAdminText("detailCast", castVal);

    setAdminText("detailCountry", Array.isArray(data.country) ? data.country.join(", ") : data.country);
    setAdminText("detailLanguage", Array.isArray(data.language) ? data.language.join(", ") : data.language);
    setAdminText("detailAwards", data.awards);
    setAdminText("detailDescription", data.description || data.overview || data.synopsis);

    // --- 2. SEZON VE BÖLÜM KARTLARI (EKRAN GÖRÜNTÜSÜNDEKİ TASARIM) ---
    renderSeasonsAndEpisodes(data);
}

function renderSeasonsAndEpisodes(data) {
    let seasonsContainer = document.getElementById("seasonsContainer") || document.querySelector(".seasons-section");

    if (!seasonsContainer) {
        const headings = Array.from(document.querySelectorAll("h2, h3, h4, span, div"));
        const seasonHeader = headings.find(el => el.innerText.trim().toLowerCase() === "sezonlar");
        if (seasonHeader) seasonsContainer = seasonHeader.parentElement;
    }

    if (!seasonsContainer) return;

    let seasonsData = data.seasons || data.seasonList || [];
    let episodesData = data.episodes || data.episodeList || [];

    // Eğer seasons listesi yoksa ama episodes geldiyse grupla
    if ((!seasonsData || seasonsData.length === 0) && episodesData.length > 0) {
        const grouped = {};
        episodesData.forEach(ep => {
            const sNum = ep.seasonNumber || ep.season_number || ep.season || 1;
            if (!grouped[sNum]) grouped[sNum] = [];
            grouped[sNum].push(ep);
        });
        seasonsData = Object.keys(grouped).map(sNum => ({
            name: `Season ${sNum}`,
            seasonNumber: sNum,
            episodes: grouped[sNum]
        }));
    }

    if (seasonsData && seasonsData.length > 0) {
        seasonsContainer.innerHTML = seasonsData.map((season, idx) => `
            <div style="background: #11141a; border: 1px solid #1e232d; border-radius: 10px; padding: 20px; margin-top: 15px; margin-bottom: 20px;">
                <!-- Sezon Başlığı ve Toplam Bölüm Sayısı -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                    <div style="color: #9ab; font-size: 14px; font-weight: 600;">
                        ▼ ${season.name || `Season ${idx + 1}`}
                    </div>
                    <div style="color: #6a7b95; font-size: 13px; font-weight: 500;">
                        ${(season.episodes ? season.episodes.length : 0)} Bölüm
                    </div>
                </div>

                <!-- Bölüm Kartları Listesi -->
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${(season.episodes && season.episodes.length > 0) ? season.episodes.map(ep => {
                        const epTitle = ep.title || ep.name || 'Untitled Episode';
                        const epNum = ep.episodeNumber || ep.episode_number || ep.episodeIndex || '-';
                        const epDesc = ep.description || ep.overview || ep.summary || 'Açıklama bulunamadı.';
                        const epRating = ep.imdbRating || ep.voteAverage || ep.rating || '7.5';
                        const epDate = ep.airDate || ep.releaseDate || ep.formattedDate || '01 Jan 2020';
                        const epDuration = ep.durationMinutes || ep.duration || ep.runtime || 22;
                        const epImg = ep.stillPath || ep.image || ep.poster || data.poster || 'https://placehold.co/180x110/1e232d/ffffff?text=No+Image';

                        return `
                            <div style="display: flex; gap: 16px; background: #0b0d12; border: 1px solid #191d26; border-radius: 8px; padding: 12px; align-items: flex-start;">
                                <!-- Sol Bölüm Görseli -->
                                <img src="${epImg}" alt="${epTitle}" style="width: 140px; height: 90px; object-fit: cover; border-radius: 6px; flex-shrink: 0;" />
                                
                                <!-- Sağ Detay Bilgileri -->
                                <div style="display: flex; flex-direction: column; gap: 6px; flex-grow: 1;">
                                    <h5 style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">
                                        ${epNum}. ${epTitle}
                                    </h5>
                                    
                                    <p style="color: #8a99ad; font-size: 12px; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                        ${epDesc}
                                    </p>

                                    <!-- Bölüm Meta Bilgileri (Puan, Tarih, Süre) -->
                                    <div style="display: flex; align-items: center; gap: 12px; font-size: 11px; color: #f5c518; margin-top: 4px;">
                                        <span>⭐ ${epRating}</span>
                                        <span style="color: #5a6b82;">📅 ${epDate}</span>
                                        <span style="color: #5a6b82;">⏱️ ${epDuration} min</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('') : '<p style="color:#5a6b82; font-size:13px; margin:0;">Bu sezonda gösterilecek bölüm bulunamadı.</p>'}
                </div>
            </div>
        `).join('');
    } else {
        seasonsContainer.innerHTML = `
            <div style="background: #11141a; border: 1px solid #1e232d; border-radius: 8px; padding: 20px; margin-top: 15px;">
                <p style="color: #6a7b95; font-size: 14px; margin: 0;">Bu diziye ait henüz sezon veya bölüm bilgisi yüklenmedi.</p>
            </div>
        `;
    }
}

function setAdminText(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerText = (value && String(value).trim() !== "" && String(value).trim() !== "null") ? value : "-";
    }
}