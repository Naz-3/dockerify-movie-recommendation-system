document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear(); // Token ve userRole temizlenir
            window.location.href = "login.html";
        });
    }
});
(function () {
    const role = localStorage.getItem("userRole");
    const path = window.location.pathname;

    const adminPages = [
        "index.html",
        "statistics.html", 
        "movie-form.html", 
        "edit-content.html", 
        "actors.html",
        "library.html"
    ];
    
    const userPages = [
        "showcase.html"
    ];

    const currentPage = path.split("/").pop() || "index.html";

    // 1. Giriş yapmamış kullanıcı kontrolü
    if (!role && currentPage !== "login.html" && currentPage !== "register.html") {
        window.location.href = "login.html";
        return;
    }

    // 2. USER, ADMIN sayfasına girmeye çalışırsa yönlendir
    if (role === "USER" && adminPages.some(page => currentPage.endsWith(page))) {
        alert("Bu sayfaya erişim yetkiniz yok!");
        window.location.href = "showcase.html";
        return;
    }

    // 3. ADMIN, USER sayfasına girmeye çalışırsa yönlendir
    if (role === "ADMIN" && userPages.some(page => currentPage.endsWith(page))) {
        window.location.href = "index.html";
        return;
    }
})();