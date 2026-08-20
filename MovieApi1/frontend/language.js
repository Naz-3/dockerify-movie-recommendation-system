const translations = {
    tr: {
        dashboard: "Dashboard", library: "İçerik Yönetimi", newContent: "Yeni İçerik",
        addContent: "İçerik Ekle", actors: "Oyuncular", statistics: "İstatistikler",
        details: "Detayları Gör", import: "İçe Aktar", cancel: "İptal", save: "Kaydet",
        edit: "Düzenle", sync: "Senkronize", delete: "Sil",
        movie: "Film", series: "Dizi", title: "Başlık", year: "Yıl", genre: "Tür",
        action: "İşlem", rating: "IMDb Puanı", runtime: "Süre",
        director: "Yönetmen", leadActors: "Başrol Oyuncuları", description: "Açıklama",
        posterUrl: "Poster URL", allTypes: "Tüm Türler", titleSort: "Başlığa Göre",
        ratingSort: "IMDb Puanı", yearSort: "Yıl", searchTitle: "Başlığa göre ara...",
        searchActor: "Oyuncu ara...", searchDatabase: "Veritabanında içerik ara...",
        imdb: "IMDb:", yearLabel: "Yıl:", genreLabel: "Tür:", directorLabel: "Yönetmen:",
        leadLabel: "Başrol:", runtimeLabel: "Süre:", totalContent: "Toplam İçerik",
        averageImdb: "Ortalama IMDb", contentType: "İçerik Tipi", updateFromOmdb: "OMDb'den Güncelle",
        recentContent: "Son Eklenen İçerikler", manageContent: "İçerikleri Yönet",
        manageActors: "Oyuncuları Yönet", databaseContent: "Veritabanındaki tüm içerikleri yönet.",
        libraryAnalysis: "Kütüphanenin genel analizleri.", contentStatistics: "İstatistikler",
        omdbSearch: "OMDb İçerik Arama", searchMovieSubtitle: "Film veya dizi adını yazmaya başla.",
        dashboardSubtitle: "Film ve dizi yönetim sistemi", recentUpdated: "Son Güncellenenler",
        recentActors: "Son Eklenen Oyuncular", actorSubtitle: "Kütüphanendeki oyuncuları görüntüle.",
        noActors: "Henüz oyuncu bulunamadı.", actorHint: "İçerik ekledikçe oyuncular burada listelenecek.",
        editContent: "İçerik Düzenle", editSubtitle: "Veritabanındaki bilgileri güncelle.",
        genreDistribution: "Tür Dağılımı", deleteContant: "Sil",
        topRated: "En Yüksek IMDb Puanına Sahip İçerikler", noData: "Veri bulunamadı.", 
        actorUpdateError: "Oyuncu güncellenemedi.", actorDeleteError: "Oyuncu silinemedi.", 
        deleteActor: "Oyuncuyu Sil", editActor: "Oyuncuyu Düzenle",
        deleteActorConfirm: "{{name}} oyuncusunu silmek istediğinize emin misiniz?", 
        deleteActorRelated: "Bu oyuncu aşağıdaki içeriklerle ilişkilidir:", 
        deleteActorNoContent: "Bu oyuncuya ait içerik bulunamadı.", cannotUndo: "Bu işlem geri alınamaz.", 
        deleteContent: "İçeriği Sil"
    },
    en: {
        dashboard: "Dashboard", library: "Content Management", newContent: "New Content",
        addContent: "Add Content", actors: "Actors", statistics: "Statistics",
        details: "View Details", import: "Import", cancel: "Cancel", save: "Save",
        edit: "Edit", sync: "Synchronize", delete: "Delete",
        movie: "Movie", series: "Series", title: "Title", year: "Year", genre: "Genre",
        action: "Action", rating: "IMDb Rating", runtime: "Runtime",
        director: "Director", leadActors: "Lead Actors", description: "Description",
        posterUrl: "Poster URL", allTypes: "All Types", titleSort: "By Title",
        ratingSort: "IMDb Rating", yearSort: "Year", searchTitle: "Search by title...",
        searchActor: "Search actors...", searchDatabase: "Search content in the database...",
        imdb: "IMDb:", yearLabel: "Year:", genreLabel: "Genre:", directorLabel: "Director:",
        leadLabel: "Starring:", runtimeLabel: "Runtime:", totalContent: "Total Content",
        averageImdb: "Average IMDb", contentType: "Content Type", updateFromOmdb: "Update from OMDb",
        recentContent: "Recently Added Content", manageContent: "Manage Content",
        manageActors: "Manage Actors", databaseContent: "Manage all content in the database.",
        libraryAnalysis: "General library analytics.", contentStatistics: "Statistics",
        omdbSearch: "OMDb Content Search", searchMovieSubtitle: "Start typing a movie or series title.",
        dashboardSubtitle: "Movie and series management system", recentUpdated: "Recently Updated",
        recentActors: "Recently Added Actors", actorSubtitle: "Browse actors in your library.",
        noActors: "No actors found yet.", actorHint: "Actors will appear here as you add content.",
        editContent: "Edit Content", editSubtitle: "Update the information stored in the database.",
        genreDistribution: "Genre Distribution", deleteContant: "Delete",
        topRated: "Highest Rated IMDb Content", noData: "No data found.",
        actorUpdateError: "Failed to update actor.", actorDeleteError: "Failed to delete actor.",
        deleteActor: "Delete Actor", editActor: "Edit Actor",
        deleteActorConfirm: "Are you sure you want to delete {{name}}?", 
        deleteActorRelated: "This actor is associated with the following content:", 
        deleteActorNoContent: "No content found for this actor.", cannotUndo: "This action cannot be undone.", 
        deleteContent: "Delete Content"
    }
};

const genreTranslations = {
    Action: "Aksiyon", Adventure: "Macera", Animation: "Animasyon",
    Biography: "Biyografi", Comedy: "Komedi", Crime: "Suç",
    Documentary: "Belgesel", Drama: "Dram", Family: "Aile",
    Fantasy: "Fantastik", History: "Tarih", Horror: "Korku",
    Music: "Müzik", Musical: "Müzikal", Mystery: "Gizem",
    Romance: "Romantik", "Sci-Fi": "Bilim Kurgu", Sport: "Spor",
    Thriller: "Gerilim", War: "Savaş", Western: "Vahşi Batı"
};

const translatedPlotCache = new Map();
let isTranslating = false; // MutationObserver sonsuz döngü koruması

function currentLanguage() {
    return localStorage.getItem("movieAdminLanguage") || "tr";
}

function t(key) {
    const actorLabels = {
        tr: {
            actorContentCount: "Yer Aldığı İçerik",
            highestImdb: "En Yüksek IMDb",
            mostPopular: "En Popüler",
            filmography: "Filmografi",
            viewFilmography: "Filmografiyi Gör",
            avatar: "Avatar"
        },
        en: {
            actorContentCount: "Appearances",
            highestImdb: "Highest IMDb",
            mostPopular: "Most Popular",
            filmography: "Filmography",
            viewFilmography: "View Filmography",
            avatar: "Avatar"
        }
    };

    const lang = currentLanguage();
    return translations[lang]?.[key] || actorLabels[lang]?.[key] || key;
}

function translateGenres(genre) {
    if (currentLanguage() !== "tr" || !genre || genre === "N/A") return genre;
    return genre.split(",").map(item => genreTranslations[item.trim()] || item.trim()).join(", ");
}

function decodeHtml(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
}

async function translatePlot(text) {
    if (currentLanguage() !== "tr" || !text || text === "N/A") return text;
    if (translatedPlotCache.has(text)) return translatedPlotCache.get(text);

    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|tr`
        );
        if (!response.ok) throw new Error("Translation request failed");

        const result = await response.json();
        const value = result.responseData?.translatedText
            ? decodeHtml(result.responseData.translatedText)
            : text;
        translatedPlotCache.set(text, value);
        return value;
    } catch (error) {
        console.warn("Plot translation failed; showing the original text.", error);
        return text;
    }
}

async function localizeMovieDetails(movie) {
    if (currentLanguage() !== "tr") return movie;

    return {
        ...movie,
        Genre: translateGenres(movie.Genre),
        Plot: await translatePlot(movie.Plot)
    };
}

function translateValue(value, language) {
    const key = Object.keys(translations.tr).find(item =>
        translations.tr[item] === value || translations.en[item] === value
    );
    if (key) return translations[language][key];

    const pair = Object.keys(translations.tr).find(item =>
        value.includes(translations.tr[item]) || value.includes(translations.en[item])
    );
    if (!pair) return value;

    return value
        .replace(translations.tr[pair], translations[language][pair])
        .replace(translations.en[pair], translations[language][pair]);
}

function translatePage() {
    if (isTranslating) return;
    isTranslating = true;

    const language = currentLanguage();
    document.documentElement.lang = language;

    document.querySelectorAll("body *").forEach(element => {
        if (element.closest(".language-switcher") || element.children.length > 0) return;
        if (element.matches(".search-card h3, .library-card h3, .modal-header h2, #contentTable *, #topRatedTable *, #actorsGrid *, #recentUpdated *, #recentActors *, .modal .edit-wrapper *")) return;
        const text = element.textContent.trim();
        const translated = translateValue(text, language);
        if (translated !== text) element.textContent = translated;
    });

    document.querySelectorAll("input[placeholder]").forEach(input => {
        input.placeholder = translateValue(input.placeholder, language);
    });

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const localizedText = t(element.dataset.i18n);
        if (element.textContent !== localizedText) {
            element.textContent = localizedText;
        }
    });

    const selector = document.getElementById("languageSelect");
    if (selector) selector.value = language;

    isTranslating = false;
}

function addLanguageSelector() {
    if (document.querySelector(".language-switcher")) return;

    const control = document.createElement("div");
    control.className = "language-switcher";
    control.innerHTML = `
        <label for="languageSelect">🌐 Türkçe / English</label>
        <select id="languageSelect" aria-label="Dil seçimi">
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
        </select>
    `;
    document.body.append(control);

    const selector = control.querySelector("select");
    selector.value = currentLanguage();
    selector.addEventListener("change", event => {
        localStorage.setItem("movieAdminLanguage", event.target.value);
        translatePage();
        window.dispatchEvent(new CustomEvent("languagechange"));
    });
}

// Dom yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
    addLanguageSelector();
    translatePage();

    new MutationObserver(() => {
        if (!isTranslating) translatePage();
    }).observe(document.body, { childList: true, subtree: true });
});