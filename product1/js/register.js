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

function setLoading(isLoading, text = "Kayıt Ol") {
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
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) return;

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById("regUsername");
        const emailInput = document.getElementById("regEmail");
        const passwordInput = document.getElementById("regPassword");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        setLoading(true, "Kayıt Yapılıyor...");

        try {
            const response = await fetch("https://dockerify-movie-recommendation-system.onrender.com/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            if (response.ok) {
                showToast("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...", "success");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                let errorMsg = "Kayıt işlemi başarısız.";

                if (response.status === 409 || response.status === 400) {
                    errorMsg = "Bu kullanıcı adı veya e-posta adresi zaten alınmış!";
                    showToast(errorMsg, "warning");
                } else {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    }
                    showToast(errorMsg, "error");
                }
                
                setLoading(false, "Kayıt Ol");
            }
        } catch (error) {
            console.error("Ağ hatası:", error);
            showToast("Sunucuya bağlanırken bir hata oluştu.", "error");
            setLoading(false, "Kayıt Ol");
        }
    });
});