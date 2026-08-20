document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "login.html";
        });
    }
});

(function () {
    const rawRole = localStorage.getItem("userRole");
    const role = rawRole ? rawRole.trim().toUpperCase() : null;

    // URL'den sadece dosya adını al
    const rawPath = window.location.pathname.split("?")[0].split("#")[0];
    let currentPage = rawPath.split("/").pop();

    // Dizin boşsa (örnek: http://localhost:8080/) role göre varsayılan sayfaya yönlendir
    if (!currentPage || currentPage === "") {
        if (role === "ADMIN") {
            window.location.href = "index.html";
        } else {
            window.location.href = "showcase.html";
        }
        return;
    }

    // 1. Giriş yapmamış kullanıcıyı Login'e at
    if (!role && currentPage !== "login.html" && currentPage !== "register.html") {
        window.location.href = "login.html";
        return;
    }

    // SADECE ADMIN'İN GİREBİLECEĞİ SAYFALAR
    const adminOnlyPages = [
        "index.html",
        "statistics.html", 
        "movie-form.html", 
        "edit-content.html", 
        "actors.html",
        "library.html"
    ];

    // 2. KULLANICI (USER) ADMIN SAYFASINA GİRMEYE ÇALIŞIRSA -> showcase.html'e YÖNLENDİR
    if (role === "USER" && adminOnlyPages.includes(currentPage)) {
        window.location.href = "showcase.html";
        return;
    }
})();