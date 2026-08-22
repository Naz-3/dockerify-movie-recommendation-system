const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";

const token = localStorage.getItem("jwtToken");
const role = localStorage.getItem("userRole");

if (!token || role !== "ADMIN") {
    alert("Bu sayfaya erişim yetkiniz yok!");
    window.location.href = "showcase.html"; // Admin değilse vitrine geri at
}

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const title = document.getElementById("title");
const year = document.getElementById("year");
const genre = document.getElementById("genre");
const type = document.getElementById("type");
const rating = document.getElementById("rating");
const runtime = document.getElementById("runtime");
const director = document.getElementById("director");
const writer = document.getElementById("writer");
const producer = document.getElementById("producer");
const country = document.getElementById("country");
const language = document.getElementById("language");
const awards = document.getElementById("awards");
const actors = document.getElementById("actors");
const plot = document.getElementById("plot");
const poster = document.getElementById("poster");
const posterPreview = document.getElementById("posterPreview");

window.onload = () => {
    loadMovie();
};

// JWT Token alma yardımcı fonksiyonu
function getAuthHeaders() {
    const token = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

// Oturum Koruma (Auth Guard) - Token yoksa login sayfasına yönlendirir
function checkAuthGuard() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        window.location.href = "login.html";
    }
}

async function loadMovie() {
    try {
        console.log("ID:", id);

        const response = await fetch(`${API}/${id}`);
        console.log("Status:", response.status);

        const movie = await response.json();
        console.log(movie);

        fillForm(movie);
    }

    catch (error) {
        console.error(error);
        await showMessage(
            "error",
            "Yükleme Başarısız",
            "İçerik yüklenemedi."
        );
    }
}

function fillForm(movie) {

    title.value = movie.title ?? "";
    year.value = movie.year ?? "";
    genre.value = movie.genre ?? "";
    type.value = movie.type ?? "movie";
    rating.value = movie.rating ?? "";
    runtime.value = movie.runtime ?? "";
    director.value = movie.director ?? "";
    writer.value = movie.writer ?? "";
    producer.value = movie.producer ?? "";
    country.value = movie.country ?? "";
    language.value = movie.language ?? "";
    awards.value = movie.awards ?? "";
    actors.value = Array.isArray(movie.actors)
        ? movie.actors.map(actor => actor.name).join(", ")
        : (movie.actors ?? "");

    plot.value = movie.plot ?? "";
    poster.value = movie.Poster ?? "";
    producer.value = movie.producer && movie.producer !== "N/A"
        ? movie.producer
        : "";
    writer.value = movie.writer === "N/A" ? "" : (movie.writer ?? "");
    country.value = movie.country === "N/A" ? "" : (movie.country ?? "");
    language.value = movie.language === "N/A" ? "" : (movie.language ?? "");
    awards.value = movie.awards === "N/A" ? "" : (movie.awards ?? "");
    director.value = movie.director === "N/A" ? "" : (movie.director ?? "");

    posterPreview.src =
        movie.Poster ||
        "https://placehold.co/300x450?text=Poster";

}
poster.addEventListener("keyup", () => {

    if (poster.value.trim() !== "") {
        posterPreview.src = poster.value;
    }
});
posterPreview.onerror = function () {
    this.src = "https://placehold.co/300x450?text=Poster";
};

async function saveMovie() {
    const body = {
        title: title.value,
        year: Number(year.value),
        genre: genre.value,
        type: type.value,
        rating: Number(rating.value),
        runtime: runtime.value,
        director: director.value,
        writer: writer.value,
        producer: producer.value,
        country: country.value,
        language: language.value,
        awards: awards.value,
        actors: actors.value
            .split(",")
            .map(name => ({ name: name.trim() })),
        plot: plot.value,
        poster: poster.value
};

    try {
        const response = await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            await showMessage(
                "error",
                "Güncelleme Başarısız",
                "İçerik güncellenemedi."
            );
            return;
        }

        await showMessage(
            "success",
            "Güncelleme Başarılı",
            "İçerik başarıyla güncellendi."
        );
        window.location.href = "library.html";
    }

    catch (error) {
        console.error(error);
        await showMessage(
            "error",
            "Sunucu Hatası",
            "Sunucuya ulaşılamadı."
        );
    }
}

async function refreshOmdb() {

    try {
        const response = await fetch(`${API}/sync/${id}`, {
            method: "PATCH"
        });

        if (!response.ok) {
            await showMessage(
            "error",
            "OMDb Güncellemesi Başarısız",
            "Veriler OMDb'den alınamadı."
        );
            return;
        }

        const movie = await response.json();
        fillForm(movie);
        await showMessage(
            "success",
            "OMDb Güncellendi",
            "İçerik başarıyla OMDb ile senkronize edildi."
        );
    }

    catch (error) {
        console.error(error);
        await showMessage(
            "error",
            "Sunucu Hatası",
            "Sunucuya ulaşılamadı."
        );
    }
}