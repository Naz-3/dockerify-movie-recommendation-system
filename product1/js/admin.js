const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";
const ACTOR_API = "https://dockerify-movie-recommendation-system.onrender.com/api/actors";
const USER_API = "https://dockerify-movie-recommendation-system.onrender.com/api/users";

let contents = [];
let movieCount, filmCount, seriesCount, avgRating, table, recentUpdated, featuredActors, dashboardSearch;

// 1. JWT Token Alma (Standartlaştırılmış ve Güvenli)
function getAuthHeaders() {
    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token") || "";
    if (token.startsWith("Bearer ")) {
        token = token.substring(7);
    }
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// 2. Admin Yetki Kontrolü
function checkAdminAuth() {
    let token = localStorage.getItem("jwtToken") || localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || (role && role !== "ADMIN")) {
        alert("Bu sayfaya erişim yetkiniz yok!");
        window.location.href = "showcase.html";
        return false;
    }
    return true;
}

// 3. Yetkisiz Erişim Yönetimi
function handleUnauthorized() {
    alert("Oturum süreniz doldu veya bu işlem için yetkiniz yok.");
    localStorage.clear();
    window.location.href = "login.html";
}

// Sayfa DOM Yüklendiğinde Başlat
document.addEventListener("DOMContentLoaded", () => {
    if (!checkAdminAuth()) return;

    // DOM Elemanlarını Güvenli Şekilde Seç
    movieCount = document.getElementById("movieCount");
    filmCount = document.getElementById("filmCount");
    seriesCount = document.getElementById("seriesCount");
    avgRating = document.getElementById("avgRating");
    table = document.getElementById("contentTable");
    recentUpdated = document.getElementById("recentUpdated");
    featuredActors = document.getElementById("featuredActors");
    dashboardSearch = document.getElementById("dashboardSearch");

    if (dashboardSearch) {
        dashboardSearch.addEventListener("keyup", () => {
            const value = dashboardSearch.value.toLowerCase();
            const filtered = contents.filter(movie =>
                movie.title && movie.title.toLowerCase().includes(value)
            );
            fillTable(filtered);
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }

    loadDashboard();
    loadUsers();
});

// 4. Kullanıcıları Çekme
async function loadUsers() {
    const tableBody = document.getElementById("userTableBody");
    const totalUserCount = document.getElementById("totalUsersCount");

    try {
        const response = await fetch(USER_API, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ff6b6b;">Erişim Yetkisi Yok (401/403). Lütfen tekrar giriş yapın.</td></tr>`;
            return;
        }

        if (!response.ok) throw new Error("HTTP Hata kodu: " + response.status);

        const users = await response.json();

        if (totalUserCount) totalUserCount.textContent = users.length;
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (!users || users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Sistemde kayıtlı kullanıcı bulunamadı.</td></tr>`;
            return;
        }

        users.forEach(user => {
            tableBody.innerHTML += `
                <tr>
                    <td>${user.id}</td>
                    <td><b>${user.username || user.name || '-'}</b></td>
                    <td>${user.email || '-'}</td>
                    <td><span class="role-badge">${user.role || 'USER'}</span></td>
                    <td>
                        <button onclick="deleteUser(${user.id})" class="deleteBtn" style="background:#ff4757; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Sil</button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Kullanıcı Yükleme Hatası:", error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ff6b6b;">Veri çekilemedi: ${error.message}</td></tr>`;
        }
    }
}

// 5. Dashboard Verilerini Çekme
async function loadDashboard() {
    try {
        const response = await fetch(API, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) throw new Error("Dashboard verileri alınamadı.");

        contents = await response.json();
        fillCards();
        fillTable(contents);
        fillRecent();
        await loadFeaturedActors();
    } catch (error) {
        console.error("Dashboard yüklenme hatası:", error);
    }
}

function fillCards() {
    if (!movieCount || !filmCount || !seriesCount || !avgRating) return;

    movieCount.textContent = contents.length;
    filmCount.textContent = contents.filter(x => x.type && x.type.toLowerCase() === "movie").length;
    seriesCount.textContent = contents.filter(x => x.type && x.type.toLowerCase() === "series").length;
    
    const ratings = contents
        .filter(x => x.rating != null)
        .map(x => Number(x.rating));

    if (ratings.length === 0) {
        avgRating.textContent = "0";
        return;
    }

    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    avgRating.textContent = avg.toFixed(1);
}

function fillTable(list) {
    if (!table) return;
    table.innerHTML = "";

    const latest = [...list].reverse().slice(0, 10);

    latest.forEach(movie => {
        let posterSrc = movie.posterUrl || movie.poster_url || movie.poster || movie.imageUrl;

        if (posterSrc && typeof posterSrc === 'string') {
            posterSrc = posterSrc.trim();
            if (posterSrc !== '' && !posterSrc.startsWith('http://') && !posterSrc.startsWith('https://')) {
                posterSrc = `https://image.tmdb.org/t/p/w500${posterSrc}`;
            }
        }

        const posterHtml = (posterSrc && posterSrc !== '')
            ? `<img class="poster" src="${posterSrc}" alt="${movie.title || 'Poster'}" onerror="this.onerror=null; this.src='https://placehold.co/90x135?text=Gorsel+Yok';">`
            : `<div class="poster no-image">🖼️<br>Görsel Yok</div>`;

        const translatedType = typeof t === "function" ? t((movie.type || "").toLowerCase()) : movie.type;
        const editText = typeof t === "function" ? t("edit") : "Düzenle";
        const deleteText = typeof t === "function" ? t("delete") : "Sil";

        table.innerHTML += `
            <tr>
                <td>${posterHtml}</td>
                <td><b>${movie.title || '-'}</b></td>
                <td>${translatedType || '-'}</td>
                <td>${movie.year || '-'}</td>
                <td>⭐ ${movie.rating ?? "-"}</td>
                <td>
                    <button class="editBtn" onclick="editMovie(${movie.id})">${editText}</button>
                    <button class="deleteBtn" onclick="deleteMovie(${movie.id})">${deleteText}</button>
                </td>
            </tr>
        `;
    });
}

function fillRecent() {
    if (!recentUpdated) return;
    recentUpdated.innerHTML = "";

    [...contents]
        .reverse()
        .slice(0, 6)
        .forEach(movie => {
            recentUpdated.innerHTML += `
            <li>
                <div>
                    <b>${movie.title}</b>
                    <br><small>${movie.year}</small>
                </div>
                <span>⭐ ${movie.rating ?? "-"}</span>
            </li>
            `;
        });
}

async function loadFeaturedActors() {
    if (!featuredActors) return;

    try {
        const response = await fetch(`${ACTOR_API}/featured`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) return;

        const actors = await response.json();
        featuredActors.innerHTML = "";

        actors.forEach((actor, index) => {
            let medal = "";
            let cls = "";

            if (index === 0) { medal = "🥇"; cls = "featured-gold"; }
            else if (index === 1) { medal = "🥈"; cls = "featured-silver"; }
            else if (index === 2) { medal = "🥉"; cls = "featured-bronze"; }

            featuredActors.innerHTML += `
            <li>
                <b class="${cls}">${medal} ${actor.name}</b><br>
                <small>🎬 ${actor.contentCount || 0} içerik</small>
            </li>
            `;
        });
    } catch (error) {
        console.error("Öne çıkan oyuncular yüklenirken hata:", error);
    }
}

function editMovie(id) {
    window.location.href = `edit-content.html?id=${id}`;
}

async function deleteMovie(id) {
    if (!confirm("Bu içerik silinsin mi?")) return;

    try {
        const response = await fetch(`${API}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized();
            return;
        }

        if (response.ok) {
            if (typeof showToast === "function") showToast("success", "İçerik başarıyla silindi.");
            loadDashboard();
        } else {
            if (typeof showToast === "function") showToast("error", "İçerik silinemedi.");
        }
    } catch (error) {
        console.error("Silme hatası:", error);
    }
}

async function deleteUser(userId) {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;

    try {
        const response = await fetch(`${USER_API}/${userId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (response.ok) {
            alert("Kullanıcı silindi.");
            loadUsers();
        } else {
            alert("Kullanıcı silinemedi.");
        }
    } catch (error) {
        console.error("Kullanıcı silme hatası:", error);
    }
}

function logout() {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    window.location.href = "login.html";
}