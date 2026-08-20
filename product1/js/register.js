document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const errorMessage = document.getElementById("errorMessage");

    if (!registerForm) return;

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById("regUsername");
        const emailInput = document.getElementById("regEmail");
        const passwordInput = document.getElementById("regPassword");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        // Hata kutusunu temizle
        if (errorMessage) {
            errorMessage.style.display = "none";
            errorMessage.textContent = "";
        }

        try {
            const response = await fetch("http://backend:8080/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            });

            if (response.ok) {
                alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
                window.location.href = "login.html";
            } else {
                const contentType = response.headers.get("content-type");
                let errorMsg = "Kayıt işlemi başarısız.";

                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } else {
                    const textError = await response.text();
                    if (textError) errorMsg = textError;
                }

                if (errorMessage) {
                    errorMessage.textContent = errorMsg;
                    errorMessage.style.display = "block";
                }
            }
        } catch (error) {
            console.error("Ağ hatası:", error);
            if (errorMessage) {
                errorMessage.textContent = "Sunucuya bağlanırken bir hata oluştu.";
                errorMessage.style.display = "block";
            }
        }
    });
});