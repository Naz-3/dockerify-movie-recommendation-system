const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";
const EPISODE_API = "https://dockerify-movie-recommendation-system.onrender.com/api/episodes";
const WATCH_HISTORY_API = "https://dockerify-movie-recommendation-system.onrender.com/api/user-activity/track";
const USER_ACTIVITY_API = "https://dockerify-movie-recommendation-system.onrender.com/api/user-activity"; // Son durumu çekmek için

let editingEpisodeId = null;
let openedSeason = null;
let allEpisodes = [];

// İzleme İlerleme Değişkenleri
let currentWatchedMinutes = 0;
let totalMovieRuntimeMinutes = 0; // Dakika cinsinden filmin toplam süresi

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const poster = document.getElementById("poster");
const title = document.getElementById("title");
const year = document.getElementById("year");
const rating = document.getElementById("rating");
const genre = document.getElementById("genre");
const runtime = document.getElementById("runtime");
const director = document.getElementById("director");
const writer = document.getElementById("writer");
const actors = document.getElementById("actors");
const country = document.getElementById("country");
const language = document.getElementById("language");
const awards = document.getElementById("awards");
const plot = document.getElementById("plot");
const seasonList = document.getElementById("seasonList");

const modal = document.getElementById("episodeModal");
const modalPoster = document.getElementById("modalPoster");
const modalPlot = document.getElementById("modalPlot");
const modalPosterPreview = document.getElementById("modalPosterPreview");

// 1. JWT Token alma yardımcı fonksiyonu
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// 2. Oturum Koruma (Auth Guard)
function checkAuthGuard() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// 3. Yetkisiz Erişim Yönetimi (Unauthorized Handling)
function handleUnauthorized() {
    alert("Oturum süreniz doldu veya bu işlem için yetkiniz yok.");
    localStorage.clear();
    window.location.href = "login.html";
}

// KULLANICI & İZLEME İLERLEMESİ ENTEGRASYON MANTIĞI
function getActiveUserId() {
    return localStorage.getItem("activeUserId") || 1;
}

// "123 min" gibi string gelen süreyi integer dakikaya çevirir
function parseRuntimeToMinutes(runtimeStr) {
    if (!runtimeStr || runtimeStr === "N/A") return 0;
    const minutes = parseInt(runtimeStr);
    return isNaN(minutes) ? 0 : minutes;
}

// Progress Bar ve Yüzde Metnini Günceller
function updateUIProgress() {
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    if (!progressBar || !progressText) return;

    if (totalMovieRuntimeMinutes === 0) {
        progressBar.style.width = "0%";
        progressText.textContent = `${currentWatchedMinutes} dk`;
        return;
    }

    // Maksimum %100 olacak şekilde yüzdeyi hesapla
    const percentage = Math.min(100, Math.round((currentWatchedMinutes / totalMovieRuntimeMinutes) * 100));
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${currentWatchedMinutes} / ${totalMovieRuntimeMinutes} dk (%${percentage})`;
}

// Sayfa yüklendiğinde kullanıcının bu içerik için en son kaydedilmiş geçmişini çeker (GET - Protected)
async function loadUserWatchProgress() {
    if (!id) return;
    const userId = getActiveUserId();

    try {
        const response = await fetch(`${USER_ACTIVITY_API}/user/${userId}/content/${id}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (response.ok) {
            const data = await response.json();
            if (data && data.watchedMinutes !== undefined) {
                currentWatchedMinutes = data.watchedMinutes;
                updateUIProgress();
                console.log(`ℹ️ Kayıtlı izleme süresi yüklendi: ${currentWatchedMinutes} dk`);
            }
        }
    } catch (error) {
        console.warn("⚠️ Kullanıcı izleme geçmişi yüklenirken hata alındı:", error);
    }
}

// İzleme İlerlemesini Sunucuya Gönder (POST - Protected)
async function sendWatchProgress(watchedMinutes, isLiked = null) {
    if (!id) return;

    const payload = {
        userId: parseInt(getActiveUserId()),
        contentId: parseInt(id),
        watchedMinutes: parseInt(watchedMinutes),
        isLiked: isLiked
    };

    try {
        const response = await fetch(WATCH_HISTORY_API, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (response.ok) {
            console.log(`✅ İzleme ilerlemesi kaydedildi: ${watchedMinutes} dk (Kullanıcı: ${payload.userId})`);
        } else {
            console.warn("⚠️ İzleme ilerlemesi kaydedilemedi.");
        }
    } catch (error) {
        console.error("❌ İzleme ilerlemesi gönderilirken hata oluştu:", error);
    }
}

function addWatchMinutes(minutes) {
    if (totalMovieRuntimeMinutes > 0 && currentWatchedMinutes + minutes > totalMovieRuntimeMinutes) {
        currentWatchedMinutes = totalMovieRuntimeMinutes;
    } else {
        currentWatchedMinutes += minutes;
    }

    console.log(`⏱ Toplam izlenen süre: ${currentWatchedMinutes} dk`);
    
    updateUIProgress();
    sendWatchProgress(currentWatchedMinutes, null);

    if (typeof showToast === "function") {
        showToast("info", `${minutes} dk izleme eklendi. (Toplam: ${currentWatchedMinutes} dk)`);
    }
}

function setupWatchEvents() {
    const likeBtn = document.getElementById("likeBtn");
    const dislikeBtn = document.getElementById("dislikeBtn");

    if (likeBtn) {
        likeBtn.addEventListener("click", () => {
            sendWatchProgress(currentWatchedMinutes, true);
            if (typeof showToast === "function") showToast("success", "Beğeniniz kaydedildi.");
        });
    }

    if (dislikeBtn) {
        dislikeBtn.addEventListener("click", () => {
            sendWatchProgress(currentWatchedMinutes, false);
            if (typeof showToast === "function") showToast("info", "Geri bildiriminiz alındı.");
        });
    }
}

// ==========================================
// İÇERİK VE BÖLÜM YÜKLEME MANTIĞI
// ==========================================

async function loadMovie() {
    try {
        const response = await fetch(`${API}/${id}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            if (typeof showMessage === "function") {
                await showMessage("error", "İçerik Bulunamadı", "İstenen içerik bulunamadı.");
            }
            return;
        }

        const movie = await response.json();
        
        totalMovieRuntimeMinutes = parseRuntimeToMinutes(movie.runtime);
        
        fillDetails(movie);
        updateUIProgress();

        if (movie.type === "series") {
            allEpisodes = movie.episodes ?? [];
            renderEpisodes();
        }

        // Sayfa detayları yüklendikten sonra kullanıcının veritabanındaki son durumunu oku
        await loadUserWatchProgress();

    } catch (error) {
        console.error(error);
        if (typeof showMessage === "function") {
            await showMessage("error", "Sunucu Hatası", "Sunucuya ulaşılamadı.");
        }
    }
}

function fillDetails(movie) {
    const posterSrc = movie.poster || movie.Poster || movie.posterUrl;
    if (poster) {
        poster.src = (posterSrc && posterSrc !== "N/A") ? posterSrc : "https://placehold.co/300x450?text=Poster";
    }

    if (title) title.textContent = movie.title ?? "-";
    if (year) year.textContent = movie.year ?? "-";
    if (rating) rating.textContent = movie.rating ?? "-";
    if (genre) genre.textContent = movie.genre ?? "-";
    if (runtime) runtime.textContent = movie.runtime ?? "-";
    if (director) director.textContent = movie.director && movie.director !== "N/A" ? movie.director : "-";
    if (writer) writer.textContent = movie.writer && movie.writer !== "N/A" ? movie.writer : "-";
    if (country) country.textContent = movie.country && movie.country !== "N/A" ? movie.country : "-";
    if (language) language.textContent = movie.language && movie.language !== "N/A" ? movie.language : "-";
    if (awards) awards.textContent = movie.awards && movie.awards !== "N/A" ? movie.awards : "-";
    if (plot) plot.textContent = movie.plot ?? "-";

    if (actors) {
        if (Array.isArray(movie.actors)) {
            actors.textContent = movie.actors.map(actor => actor.name).join(", ");
        } else {
            actors.textContent = movie.actors ?? "-";
        }
    }

    const seasonSection = document.querySelector(".season-section");
    if (seasonSection) {
        seasonSection.style.display = (movie.type === "movie") ? "none" : "block";
    }
}

async function loadEpisodes() {
    try {
        const response = await fetch(`${EPISODE_API}/content/${id}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) return;
        allEpisodes = await response.json();
        renderEpisodes();
    } catch (e) {
        console.error(e);
    }
}

function renderEpisodes() {
    if (!seasonList) return;
    seasonList.innerHTML = "";
    const grouped = {};
    allEpisodes.forEach(ep => {
        if (!grouped[ep.seasonNumber]) {
            grouped[ep.seasonNumber] = [];
        }
        grouped[ep.seasonNumber].push(ep);
    });

    Object.keys(grouped).forEach(seasonNumber => {
        const seasonItem = document.createElement("div");
        seasonItem.className = "season-item";
        seasonItem.innerHTML = `
            <div class="season-header">
                <span>
                    ${openedSeason == seasonNumber ? "▼" : "▶"}
                    Season ${seasonNumber}
                </span>
                <span>
                    ${grouped[seasonNumber].length} Bölüm
                </span>
            </div>
        `;
        seasonItem.querySelector(".season-header").onclick = () => {
            openedSeason = (openedSeason == seasonNumber) ? null : seasonNumber;
            renderEpisodes();
        };

        if (openedSeason == seasonNumber) {
            const episodeList = document.createElement("div");
            episodeList.className = "episode-list";
            grouped[seasonNumber].forEach(ep => {
                episodeList.innerHTML += `
                <div class="episode-item">
                    <img src="${ep.poster && ep.poster !== "N/A" ? ep.poster : "https://placehold.co/120x170?text=Poster"}" class="episode-poster">
                    <div class="episode-info">
                        <h4>${ep.episodeNumber}. ${ep.title}</h4>
                        <p>${ep.plot}</p>
                        <div class="episode-meta">
                            ⭐ ${ep.rating ?? "-"}
                            ⏱ ${ep.runtime ?? "-"}
                        </div>
                        <button class="episode-edit-btn" onclick="openEpisodeModal(${ep.id})">
                            Düzenle
                        </button>
                    </div>
                </div>
                `;
            });
            seasonItem.appendChild(episodeList);
        }
        seasonList.appendChild(seasonItem);
    });
}

function openEpisodeModal(id) {
    editingEpisodeId = id;
    const episode = allEpisodes.find(e => e.id === id);
    if (!episode || !modal) return;
    
    if (modalPoster) modalPoster.value = episode.poster ?? "";
    if (modalPlot) modalPlot.value = episode.plot ?? "";
    if (modalPosterPreview) modalPosterPreview.src = episode.poster ?? "https://placehold.co/250x360?text=Poster";

    modal.classList.remove("hidden");
}

function closeEpisodeModal() {
    if (modal) modal.classList.add("hidden");
}

if (modalPoster) {
    modalPoster.addEventListener("input", () => {
        if (modalPosterPreview) modalPosterPreview.src = modalPoster.value;
    });
}

async function saveEpisode() {
    try {
        const response = await fetch(`${EPISODE_API}/${editingEpisodeId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
                poster: modalPoster.value,
                plot: modalPlot.value
            })
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            if (typeof showToast === "function") showToast("error", "Bölüm kaydedilemedi.");
            return;
        }
        closeEpisodeModal();
        await loadEpisodes();
        if (typeof showToast === "function") showToast("success", "Bölüm başarıyla güncellendi.");
    } catch (e) {
        console.error("Bölüm kaydetme hatası:", e);
    }
}

async function syncEpisode() {
    try {
        const response = await fetch(`${EPISODE_API}/sync/${editingEpisodeId}`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            if (typeof showToast === "function") showToast("error", "OMDb ile senkronizasyon başarısız.");
            return;
        }
        closeEpisodeModal();
        await loadEpisodes();
        if (typeof showToast === "function") showToast("success", "OMDb verileri geri yüklendi.");
    } catch (e) {
        console.error("Bölüm senkronizasyon hatası:", e);
    }
}

window.onload = () => {
    if (checkAuthGuard()) {
        loadMovie();
        setupWatchEvents();
    }
};