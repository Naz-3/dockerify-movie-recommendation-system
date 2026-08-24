// Sayfaya Modal HTML Yapısını Otomatik Ekle
document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("detailModalOverlay")) {
        const modalHTML = `
        <div id="detailModalOverlay" class="modal-overlay">
            <div class="detail-modal">
                <button class="modal-close-btn" onclick="closeDetailModal()">&times;</button>
                <div id="modalHero" class="modal-hero">
                    <div class="modal-hero-overlay">
                        <div>
                            <h2 id="modalTitle" style="font-size:28px; font-weight:700;">-</h2>
                            <span id="modalTypeBadge" style="background:#e50914; padding:3px 8px; border-radius:4px; font-size:12px;">MOVIE</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-body">
                    <!-- Kaldığı Dakika / İlerleme Bilgisi -->
                    <div class="watch-status-card">
                        <div style="width: 100%;">
                            <div style="display:flex; justify-content:space-between; font-size:13px; color:#aaa;">
                                <span id="watchTimeText">İzleme Durumu: Kaldığı Dakika 0 / 0 dk</span>
                                <span id="watchPercentText">%0 tamamlandı</span>
                            </div>
                            <div class="progress-track">
                                <div id="modalProgressFill" class="progress-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Sekme Başlıkları -->
                    <div class="modal-tabs">
                        <button class="modal-tab-btn active" onclick="switchModalTab('episodes')">Sezonlar & Bölümler</button>
                        <button class="modal-tab-btn" onclick="switchModalTab('trailers')">Fragmanlar</button>
                        <button class="modal-tab-btn" onclick="switchModalTab('bts')">Sahne Arkası (BTS)</button>
                    </div>

                    <!-- Sekme İçerikleri -->
                    <div id="tab-episodes" class="tab-content active">
                        <div id="episodesList" style="color:#aaa; font-size:14px;">Bölüm verileri yükleniyor...</div>
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
});

// Modal Açma Fonksiyonu
async function openDetailModal(contentId) {
    const overlay = document.getElementById("detailModalOverlay");
    overlay.classList.add("active");

    try {
        const token = localStorage.getItem("jwtToken");
        // Backend'den detay ve kullanıcının izleme geçmişini (watch-progress) alıyoruz
        const res = await fetch(`https://dockerify-movie-recommendation-system.onrender.com/api/content/${contentId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await res.json();

        // Modal Başlık ve Görsel Güncelleme
        document.getElementById("modalTitle").innerText = data.title || "İçerik Detayı";
        document.getElementById("modalTypeBadge").innerText = (data.contentType || "MOVIE").toUpperCase();
        document.getElementById("modalHero").style.backgroundImage = `url('${data.posterUrl || data.bannerUrl}')`;

        // İzlenen Dakika ve Yüzde Hesaplama (Örn: Backend'den watchedMinutes & totalDuration geliyorsa)
        const watched = data.watchedMinutes || 0;
        const total = data.durationMinutes || 120; // Varsayılan süre
        const percent = Math.min(Math.round((watched / total) * 100), 100);

        document.getElementById("watchTimeText").innerText = `Kaldığınız Yer: ${watched}. dk / ${total} dk`;
        document.getElementById("watchPercentText").innerText = `%${percent} İzlendi`;
        document.getElementById("modalProgressFill").style.width = `${percent}%`;

        // Bölüm/Sezon Doldurma
        const epContainer = document.getElementById("episodesList");
        if (data.seasons && data.seasons.length > 0) {
            epContainer.innerHTML = data.seasons.map(s => `
                <div style="margin-bottom:15px; background:rgba(255,255,255,0.02); padding:10px; border-radius:6px;">
                    <h4 style="color:#fff; margin-bottom:8px;">${s.seasonName || 'Sezon 1'}</h4>
                    <p style="font-size:13px; color:#888;">${s.episodesCount || 10} Bölüm Mevcut</p>
                </div>
            `).join("");
        } else {
            epContainer.innerHTML = "<p>Bu içerik bir sinema filmidir veya sezon bilgisi bulunmamaktadır.</p>";
        }

        // Fragmanlar
        const trailerGrid = document.getElementById("trailersGrid");
        trailerGrid.innerHTML = data.trailerUrl 
            ? `<div class="video-card"><iframe src="${data.trailerUrl.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe></div>`
            : "<p style='color:#888;'>Fragman bulunamadı.</p>";

        // Sahne Arkası
        const btsGrid = document.getElementById("btsGrid");
        btsGrid.innerHTML = data.btsUrl 
            ? `<div class="video-card"><iframe src="${data.btsUrl.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe></div>`
            : "<p style='color:#888;'>Sahne arkası görüntüsü mevcut değil.</p>";

    } catch (err) {
        console.error("Detay getirme hatası:", err);
    }
}

function closeDetailModal() {
    document.getElementById("detailModalOverlay").classList.remove("active");
}

function switchModalTab(tabName) {
    document.querySelectorAll(".modal-tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

    event.target.classList.add("active");
    document.getElementById(`tab-${tabName}`).classList.add("active");
}