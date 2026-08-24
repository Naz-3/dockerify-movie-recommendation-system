document.addEventListener("DOMContentLoaded", async () => {
    // 1. URL'den id parametresini al (Örn: content-details.html?id=30)
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get("id");

    if (!contentId) {
        console.error("URL üzerinde 'id' parametresi bulunamadı.");
        alert("Geçersiz içerik ID'si!");
        return;
    }

    // Token Hazırlığı
    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
    if (token.startsWith("Bearer ")) {
        token = token.substring(7);
    }

    try {
        // 2. API Endpoint'ine İstek At
        const response = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}`, {
            headers: {
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("İçerik verisi çekilemedi. Status: " + response.status);
        }

        const data = await response.json();
        console.log("Backend'den Dönen İçerik Verisi:", data);

        // Sayfa Alanlarını Doldur
        renderAdminContentDetails(data);

    } catch (error) {
        console.error("Detay Yükleme Hatası:", error);
    }
});

function renderAdminContentDetails(data) {
    if (!data) return;

    // --- 1. GÖRSEL VE BAŞLIK ---
    const posterImg = document.getElementById("detailPoster") || document.querySelector(".content-poster img") || document.querySelector("img");
    if (posterImg) {
        posterImg.src = data.poster || data.posterUrl || data.bannerUrl || data.backdropPath || 'https://placehold.co/300x450?text=G%C3%B6rsel+Yok';
    }

    setElementText(["detailTitle", "contentTitle"], data.title || data.name);
    setElementText(["detailYear", "contentYear"], data.releaseYear || data.year || (data.firstAirDate ? data.firstAirDate.substring(0, 4) : null));
    setElementText(["detailImdb", "contentImdb"], data.imdbRating || data.voteAverage || data.rating || data.imdbScore);

    // --- 2. DETAY TABLOSU / DETAY ALANLARI (Tire Görünen Yerler) ---
    
    // Tür (Genre)
    const genreVal = Array.isArray(data.genres) ? data.genres.map(g => g.name || g).join(", ") : (data.genre || data.category || data.type);
    setElementText(["detailGenre", "contentGenre"], genreVal);

    // Süre (Duration)
    const durationVal = data.durationMinutes || data.duration || data.runtime || data.totalMinutes;
    setElementText(["detailDuration", "contentDuration"], durationVal ? `${durationVal} dk` : null);

    // Yönetmen (Director)
    setElementText(["detailDirector", "contentDirector"], data.director || data.directors);

    // Yazar (Writer)
    setElementText(["detailWriter", "contentWriter"], data.writer || data.writers || data.creator || data.createdBy);

    // Oyuncular (Cast / Actors)
    const castVal = Array.isArray(data.cast) ? data.cast.map(c => c.name || c).join(", ") : (data.cast || data.actors || data.starring);
    setElementText(["detailCast", "contentCast"], castVal);

    // Ülke (Country)
    const countryVal = Array.isArray(data.country) ? data.country.join(", ") : (data.country || data.productionCountries);
    setElementText(["detailCountry", "contentCountry"], countryVal);

    // Dil (Language)
    const langVal = Array.isArray(data.language) ? data.language.join(", ") : (data.language || data.spokenLanguages || data.originalLanguage);
    setElementText(["detailLanguage", "contentLanguage"], langVal);

    // Ödüller (Awards)
    setElementText(["detailAwards", "contentAwards"], data.awards || data.award);

    // Açıklama (Description / Plot)
    setElementText(["detailDescription", "contentDescription"], data.description || data.overview || data.summary || data.synopsis || data.plot);


    // --- 3. SEZONLAR VE BÖLÜMLER (Boş Kalan Alanın Doldurulması) ---
    
    // Ekran görüntündeki "Sezonlar" yazısının altına hedefleniyoruz
    let seasonsContainer = document.getElementById("seasonsContainer") || document.getElementById("seasonsList");
    
    // Eğer ID ile kapsayıcı bulunamadıysa, "Sezonlar" başlığını taşıyan elementi bulup hemen altına container ekliyoruz
    if (!seasonsContainer) {
        const headings = Array.from(document.querySelectorAll("h2, h3, h4, div, span"));
        const seasonHeader = headings.find(el => el.innerText.trim().toLowerCase() === "sezonlar");
        
        if (seasonHeader) {
            let nextContainer = seasonHeader.nextElementSibling;
            if (!nextContainer || nextContainer.tagName !== "DIV") {
                nextContainer = document.createElement("div");
                seasonHeader.parentNode.insertBefore(nextContainer, seasonHeader.nextSibling);
            }
            seasonsContainer = nextContainer;
            seasonsContainer.id = "seasonsContainer";
        }
    }

    if (!seasonsContainer) {
        console.warn("Sezonlar için uygun DOM elementi bulunamadı.");
        return;
    }

    // Backend'den Veri Çekme Kontrolleri (Dark dışındaki Scooby-Doo gibi içerikler için)
    let seasonsData = data.seasons || data.seasonList || [];
    let episodesData = data.episodes || data.episodeList || [];

    // Eğer seasons boş geldiyse ama tek parça episodes geldiyse seasonNumber'a göre grupla
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

    // Ekran Oluşturma
    if (seasonsData && seasonsData.length > 0) {
        seasonsContainer.innerHTML = seasonsData.map((season, idx) => `
            <div class="season-block" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 16px; margin-top: 12px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="color: #e50914; font-size: 16px; font-weight: 600; margin: 0;">${season.name || `${idx + 1}. Sezon`}</h4>
                    <span style="color: #888; font-size: 12px;">${(season.episodes ? season.episodes.length : 0)} Bölüm</span>
                </div>
                <div class="episodes-list" style="display: flex; flex-direction: column; gap: 8px;">
                    ${(season.episodes && season.episodes.length > 0) ? season.episodes.map(ep => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #ccc;">
                            <div>
                                <strong style="color: #fff; margin-right: 8px;">S${ep.seasonNumber || season.seasonNumber || 1}E${ep.episodeNumber || ep.episode_number || ep.episodeIndex || '-'}:</strong>
                                <span>${ep.title || ep.name || 'Bölüm'}</span>
                            </div>
                            <div style="color: #777; font-size: 12px;">
                                ${ep.durationMinutes || ep.duration || ep.runtime || 45} dk
                            </div>
                        </div>
                    `).join('') : '<p style="color:#666; font-size:12px; margin:0;">Bu sezonda gösterilecek bölüm bulunamadı.</p>'}
                </div>
            </div>
        `).join('');
    } else {
        seasonsContainer.innerHTML = `
            <div style="padding: 16px; background: rgba(255,255,255,0.02); border-radius: 6px; margin-top: 12px;">
                <p style="color: #888; font-size: 14px; margin: 0;">Bu içerik (ID: ${data.id}) için henüz veritabanında tanımlanmış sezon veya bölüm verisi bulunmuyor.</p>
            </div>
        `;
    }
}

// Yardımcı Fonksiyon: HTML'deki ID'leri eşleştirip text değerlerini basar
function setElementText(elementIds, value) {
    let target = null;
    for (const id of elementIds) {
        const el = document.getElementById(id);
        if (el) {
            target = el;
            break;
        }
    }

    if (target) {
        if (value !== undefined && value !== null && String(value).trim() !== "" && String(value).trim() !== "null") {
            target.innerText = value;
        } else {
            target.innerText = "-";
        }
    }
}