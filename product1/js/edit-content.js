const API = "https://dockerify-movie-recommendation-system.onrender.com/api/content";

const token = localStorage.getItem("jwtToken");
const role = localStorage.getItem("userRole");

if (!token || role !== "ADMIN") {
    alert("Bu sayfaya erişim yetkiniz yok!");
    window.location.href = "showcase.html";
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
    if (!id) {
        showMessage("error", "Hata", "İçerik Kimliği (ID) bulunamadı.");
        return;
    }
    loadMovie();
};

function getAuthHeaders() {
    const jwtToken = localStorage.getItem("jwtToken");
    return {
        "Content-Type": "application/json",
        "Authorization": jwtToken ? `Bearer ${jwtToken}` : ""
    };
}

async function loadMovie() {
    try {
        const response = await fetch(`${API}/${id}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP Hata koda: ${response.status}`);
        }

        const movie = await response.json();
        fillForm(movie);
    } catch (error) {
        console.error("Yükleme Hatası:", error);
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
    
    director.value = movie.director === "N/A" ? "" : (movie.director ?? "");
    writer.value = movie.writer === "N/A" ? "" : (movie.writer ?? "");
    producer.value = (movie.producer && movie.producer !== "N/A") ? movie.producer : "";
    country.value = movie.country === "N/A" ? "" : (movie.country ?? "");
    language.value = movie.language === "N/A" ? "" : (movie.language ?? "");
    awards.value = movie.awards === "N/A" ? "" : (movie.awards ?? "");

    actors.value = Array.isArray(movie.actors)
        ? movie.actors.map(actor => typeof actor === 'object' ? actor.name : actor).join(", ")
        : (movie.actors ?? "");

    plot.value = movie.plot ?? "";
    
    // Poster verisini hem 'poster' hem 'Poster' ihtimaline karşı denetler
    const posterUrl = movie.poster || movie.Poster || "";
    poster.value = posterUrl;
    posterPreview.src = posterUrl !== "" ? posterUrl : "https://placehold.co/300x450?text=Poster";
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
    const actorArray = actors.value
        .split(",")
        .map(name => name.trim())
        .filter(name => name !== "")
        .map(name => ({ name: name }));

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
        actors: actorArray,
        plot: plot.value,
        poster: poster.value
    };

    try {
        const response = await fetch(`${API}/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
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
    } catch (error) {
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
            method: "PATCH",
            headers: getAuthHeaders()
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
    } catch (error) {
        console.error(error);
        await showMessage(
            "error",
            "Sunucu Hatası",
            "Sunucuya ulaşılamadı."
        );
    }
}