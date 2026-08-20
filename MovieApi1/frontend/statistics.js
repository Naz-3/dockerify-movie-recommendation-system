// 1. API ve Yetki Kontrolleri
const API = "http://backend:8080/api/content";

let genreChart;
let currentContents = [];

// JWT Token alma yardımcı fonksiyonu
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// Oturum ve Admin Yetki Kontrolü (Admin Guard)
function checkAdminGuard() {
    const token = localStorage.getItem("jwtToken");
    const role = localStorage.getItem("userRole") || localStorage.getItem("activeRole");

    // Token yoksa veya Rol Admin değilsa engelle
    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    if (role !== "ADMIN" && role !== "ROLE_ADMIN") {
        alert("Bu sayfaya erişim yetkiniz yok!");
        window.location.href = "showcase.html"; // Admin değilse vitrine geri at
        return false;
    }

    return true;
}

// 2. Sayfa Yüklendiğinde Oturum ve Yetki Kontrolü
document.addEventListener("DOMContentLoaded", () => {
    if (checkAdminGuard()) {
        loadStatistics();
    }
});

// 3. İstatistik Verilerini Getiren Fonksiyon (GET - Protected)
async function loadStatistics() {
    try {
        const response = await fetch(API, {
            method: "GET",
            headers: getAuthHeaders() // JWT Token eklendi
        });

        // Yetkisiz veya Oturumu Düşmüş Kullanıcı Kontrolü
        if (response.status === 401 || response.status === 403) {
            alert("Oturum süreniz doldu veya yetkiniz yok.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error("İstatistik verileri yüklenemedi.");

        const contents = await response.json();
        currentContents = contents;
        calculateStatistics(contents);
    }
    catch (err) {
        console.error("İstatistik yükleme hatası:", err);
    }
}

// 4. İstatistik Hesaplama Fonksiyonu
function calculateStatistics(contents) {
    const totalElem = document.getElementById("totalContent");
    const movieElem = document.getElementById("movieCount");
    const seriesElem = document.getElementById("seriesCount");
    const avgElem = document.getElementById("averageRating");

    if (totalElem) totalElem.textContent = contents.length;

    const movies = contents.filter(x => (x.type || "").toLowerCase() === "movie");
    const series = contents.filter(x => (x.type || "").toLowerCase() === "series");

    if (movieElem) movieElem.textContent = movies.length;
    if (seriesElem) seriesElem.textContent = series.length;

    const ratings = contents
        .map(x => Number(x.rating))
        .filter(x => !isNaN(x));

    const average =
        ratings.length === 0
            ? 0
            : ratings.reduce((a, b) => a + b, 0) / ratings.length;

    if (avgElem) avgElem.textContent = average.toFixed(1);

    createTopRated(contents);
    createCharts(contents);
}

function countBy(contents, getValues) {
    return contents.reduce((counts, content) => {
        getValues(content).forEach(value => {
            const name = value?.trim() || "Belirtilmemiş";
            counts[name] = (counts[name] || 0) + 1;
        });
        return counts;
    }, {});
}

function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: "#b9c0cc",
                    padding: 16,
                    font: { family: "Segoe UI", size: 13 }
                }
            }
        }
    };
}

// 5. Grafik Oluşturma (Chart.js)
function createCharts(contents) {
    const chartCanvas = document.getElementById("genreChart");
    if (typeof Chart === "undefined" || !chartCanvas) return;

    const genreCounts = countBy(contents, content =>
        content.genre ? content.genre.split(",") : ["Belirtilmemiş"]
    );
    const genres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

    genreChart?.destroy();

    genreChart = new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: genres.map(([name]) => name),
            datasets: [{
                label: "İçerik Sayısı",
                data: genres.map(([, count]) => count),
                backgroundColor: "rgba(237, 150, 84, .75)",
                borderColor: "#ed9654",
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            ...chartOptions(),
            scales: {
                x: {
                    ticks: { color: "#b9c0cc" },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#b9c0cc", precision: 0 },
                    grid: { color: "rgba(185, 192, 204, .12)" }
                }
            }
        }
    });
}

// 6. En Yüksek Puanlılar Tablosu
function createTopRated(contents) {
    const table = document.getElementById("topRatedTable");
    if (!table) return;

    table.innerHTML = "";
    const sorted = [...contents]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);

    sorted.forEach(movie => {
        table.innerHTML += `
        <tr>
            <td>${movie.title || 'İsimsiz'}</td>
            <td>${movie.genre || 'Belirtilmemiş'}</td>
            <td>⭐ ${movie.rating ?? '-'}</td>
        </tr>
        `;
    });
}

// Dil Değişim Event'i
window.addEventListener("languagechange", () => {
    if (currentContents.length) calculateStatistics(currentContents);
});