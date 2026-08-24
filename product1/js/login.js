// Global Toast Bildirim Fonksiyonu
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Buton Loading State Yönetimi
function setLoading(isLoading, text = "Giriş Yap") {
    const btn = document.getElementById("submitBtn");
    const spinner = document.getElementById("btnSpinner");
    const btnText = document.getElementById("btnText");

    if (!btn) return;

    if (isLoading) {
        btn.disabled = true;
        if (spinner) spinner.style.display = "inline-block";
        if (btnText) btnText.innerText = text;
    } else {
        btn.disabled = false;
        if (spinner) spinner.style.display = "none";
        if (btnText) btnText.innerText = text;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. ZATEN GİRİŞ YAPILMIŞ MI KONTROLÜ
    const existingToken = localStorage.getItem("jwtToken");
    const existingRole = localStorage.getItem("userRole");

    if (existingToken) {
        if (existingRole === "ADMIN" || existingRole === "ROLE_ADMIN") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "showcase.html";
        }
        return;
    }

    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    // 2. FORM SUBMIT
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        setLoading(true, "Giriş Yapılıyor...");

        try {
            const response = await fetch("https://dockerify-movie-recommendation-system.onrender.com/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();

                if (data.token) localStorage.setItem("jwtToken", data.token);
                if (data.role) localStorage.setItem("userRole", data.role);

                showToast("Giriş başarılı! Yönlendiriliyorsunuz...", "success");

                setTimeout(() => {
                    if (data.role === "ADMIN" || data.role === "ROLE_ADMIN") {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "showcase.html";
                    }
                }, 1200);

            } else {
                let errorMessageText = "Giriş başarısız. Kullanıcı adı veya şifre hatalı.";
                
                if (response.status === 401) {
                    errorMessageText = "Hatalı kullanıcı adı veya şifre!";
                } else {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        errorMessageText = errorData.message || errorMessageText;
                    }
                }

                showToast(errorMessageText, "error");
                setLoading(false, "Giriş Yap");
            }
        } catch (error) {
            console.error("Ağ veya Sunucu Hatası:", error);
            showToast("Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.", "error");
            setLoading(false, "Giriş Yap");
        }
    });
});