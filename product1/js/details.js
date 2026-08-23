const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";
const EPISODE_API = "https://dockerify-movie-recommendation-system.onrender.com/api/episodes";
const WATCH_HISTORY_API = "https://dockerify-movie-recommendation-system.onrender.com/api/user-activity/track";
const USER_ACTIVITY_API = "https://dockerify-movie-recommendation-system.onrender.com/api/user-activity";

let editingEpisodeId = null;
let openedSeason = null;
let allEpisodes = [];
let currentSeasonVideos = {}; // Sezon videolarını önbelleğe almak için

let currentWatchedMinutes = 0;
let totalMovieRuntimeMinutes = 0;

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

function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

function checkAuthGuard() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

function handleUnauthorized() {
    alert("Oturum süreniz doldu veya bu işlem için yetkiniz yok.");
    localStorage.clear();
    window.location.href = "login.html";
}

function parseRuntimeToMinutes(runtimeStr) {
    if (!runtimeStr || runtimeStr === "N/A") return 0;
    const minutes = parseInt(runtimeStr);
    return isNaN(minutes) ? 0 : minutes;
}

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

        if (movie.type === "series") {
            allEpisodes = movie.episodes ?? [];
            renderEpisodes();
        }

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

// TMDB Sezon Videolarını Backend API'den çeken fonksiyon
async function fetchSeasonVideos(seasonNumber) {
    if (currentSeasonVideos[seasonNumber]) {
        return currentSeasonVideos[seasonNumber];
    }

    try {
        const response = await fetch(`${API}/${id}/season/${seasonNumber}/videos`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const videos = await response.json();
            currentSeasonVideos[seasonNumber] = videos;
            return videos;
        }
    } catch (error) {
        console.error("Sezon videoları yüklenirken hata oluştu:", error);
    }
    return [];
}

async function renderEpisodes() {
    if (!seasonList) return;
    seasonList.innerHTML = "";
    const grouped = {};
    allEpisodes.forEach(ep => {
        if (!grouped[ep.seasonNumber]) {
            grouped[ep.seasonNumber] = [];
        }
        grouped[ep.seasonNumber].push(ep);
    });

    for (const seasonNumber of Object.keys(grouped)) {
        const seasonItem = document.createElement("div");
        seasonItem.className = "season-item";
        
        const isOpened = openedSeason == seasonNumber;
        
        seasonItem.innerHTML = `
            <div class="season-header">
                <span>
                    ${isOpened ? "▼" : "▶"} Season ${seasonNumber}
                </span>
                <span>${grouped[seasonNumber].length} Bölüm</span>
            </div>
        `;
        
        seasonItem.querySelector(".season-header").onclick = async () => {
            openedSeason = (openedSeason == seasonNumber) ? null : seasonNumber;
            await renderEpisodes();
        };

        if (isOpened) {
            // Sezon Fragman ve Videolar Alanı
            const videos = await fetchSeasonVideos(seasonNumber);
            if (videos && videos.length > 0) {
                const videoWrapper = document.createElement("div");
                videoWrapper.className = "season-videos-wrapper";
                
                let videoCardsHtml = videos.slice(0, 4).map(v => `
                    <div class="video-card">
                        <div>
                            <div class="video-card-title">${v.name}</div>
                            <div class="video-card-type">${v.type} • ${v.site}</div>
                        </div>
                        <button class="watch-video-btn" onclick="openVideoModal('${v.key}', '${v.name.replace(/'/g, "\\'")}')">
                            ▶ İzle
                        </button>
                    </div>
                `).join("");

                videoWrapper.innerHTML = `
                    <div class="season-videos-title">🎬 Sezon Fragmanları & Videoları</div>
                    <div class="video-grid">${videoCardsHtml}</div>
                `;
                seasonItem.appendChild(videoWrapper);
            }

            // Bölümler Listesi
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
    }
}

// Video Modal Fonksiyonları
function openVideoModal(key, title) {
    const videoModal = document.getElementById("videoModal");
    const videoIframe = document.getElementById("videoIframe");
    const videoModalTitle = document.getElementById("videoModalTitle");

    if (videoModal && videoIframe) {
        videoIframe.src = `https://www.youtube.com/embed/${key}?autoplay=1`;
        if (videoModalTitle) videoModalTitle.textContent = title;
        videoModal.classList.remove("hidden");
    }
}

function closeVideoModal() {
    const videoModal = document.getElementById("videoModal");
    const videoIframe = document.getElementById("videoIframe");

    if (videoModal && videoIframe) {
        videoIframe.src = "";
        videoModal.classList.add("hidden");
    }
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

window.onload = () => {
    if (checkAuthGuard()) {
        loadMovie();
    }
};