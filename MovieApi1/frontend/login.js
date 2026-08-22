document.addEventListener("DOMContentLoaded", () => {
    // 1. ZATEN GİRİŞ YAPILMIŞ MI KONTROLÜ (Auto-Redirect)
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
    const errorMessage = document.getElementById("errorMessage");

    if (!loginForm) return;

    // 2. FORM SUBMIT HANDLER
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Input değerlerini al ve boşlukları temizle
        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        // Hata alanını temizle
        if (errorMessage) {
            errorMessage.style.display = "none";
            errorMessage.textContent = "";
        }

        try {
            // login.js içindeki fetch kısmı
            const response = await fetch("https://dockerify-movie-recommendation-system.onrender.com/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                // Backend tam olarak 'username' ve 'password' bekliyor
                body: JSON.stringify({ username: username, password: password })
            });

            // 3. BAŞARILI YANIT DURUMU (HTTP 200-299)
            if (response.ok) {
                const data = await response.json();

                // Backend'den dönen Token ve Role bilgilerini localStorage'a kaydediyoruz
                if (data.token) {
                    localStorage.setItem("jwtToken", data.token);
                }
                if (data.role) {
                    localStorage.setItem("userRole", data.role);
                }

                // Kullanıcının rolüne göre ilgili sayfaya yönlendirme yapıyoruz
                if (data.role === "ADMIN" || data.role === "ROLE_ADMIN") {
                    window.location.href = "admin.html";
                } else {
                    window.location.href = "showcase.html";
                }

            } else {
                // 4. BAŞARISIZ YANIT DURUMU (HTTP 401, 400, 404, 500 vb.)
                const contentType = response.headers.get("content-type");
                let errorMessageText = "Giriş başarısız. Kullanıcı adı veya şifre hatalı.";

                // Backend JSON yanıt döndüyse (ör. {"message": "..."})
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    errorMessageText = errorData.message || errorMessageText;
                } else {
                    // Backend düz metin gönderdiyse (ör. Spring Security'nin varsayılan "Bad credentials" yanıtı)
                    const textError = await response.text(); 
                    if (textError) errorMessageText = textError;
                }

                // Hata mesajını ekrana bas
                if (errorMessage) {
                    errorMessage.textContent = errorMessageText;
                    errorMessage.style.display = "block";
                }
            }
        } catch (error) {
            // 5. SADECE AĞ VEYA SUNUCUYA HİÇ ULAŞILAMAMA DURUMU (Network Errors)
            console.error("Ağ veya Sunucu Hatası:", error);
            if (errorMessage) {
                errorMessage.textContent = "Sunucuya bağlanırken bir hata oluştu. Lütfen backend'in çalıştığından emin olun.";
                errorMessage.style.display = "block";
            }
        }
    });
});