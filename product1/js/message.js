let messageOverlay = null;
let currentResolve = null;

function initializeMessageModal() {
    if (messageOverlay) return;

    messageOverlay = document.createElement("div");
    messageOverlay.className = "message-overlay";
    messageOverlay.innerHTML = `
        <div class="message-box">
            <div class="message-icon"></div>
            <div class="message-title"></div>
            <div class="message-text"></div>
            <div class="message-footer">
                <button id="messageOkBtn" data-i18n="ok">Tamam</button>
            </div>
        </div>
    `;
    document.body.appendChild(messageOverlay);

    // Overlay dışına tıklandığında kapatma desteği
    messageOverlay.addEventListener("click", (e) => {
        if (e.target === messageOverlay) {
            closeMessage();
        }
    });

    // ESC tuşuna basıldığında kapatma desteği
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && messageOverlay && messageOverlay.classList.contains("show")) {
            closeMessage();
        }
    });
}

function showMessage(type, title, text) {
    return new Promise(resolve => {
        initializeMessageModal();
        currentResolve = resolve;

        const icon = messageOverlay.querySelector(".message-icon");
        const button = messageOverlay.querySelector("#messageOkBtn");
        const titleElem = messageOverlay.querySelector(".message-title");
        const textElem = messageOverlay.querySelector(".message-text");

        titleElem.textContent = title || "";
        textElem.textContent = text || "";

        // Dil Desteği (i18n) kontrolü
        if (typeof t === "function") {
            button.textContent = t("ok") || "Tamam";
        }

        button.className = "";
        switch (type) {
            case "success":
                icon.textContent = "✅";
                button.classList.add("message-success");
                break;
            case "error":
                icon.textContent = "❌";
                button.classList.add("message-error");
                break;
            case "warning":
                icon.textContent = "⚠️";
                button.classList.add("message-warning");
                break;
            default:
                icon.textContent = "ℹ️";
                button.classList.add("message-info");
        }

        button.onclick = () => {
            closeMessage();
        };

        messageOverlay.classList.add("show");
        button.focus(); // Erişilebilirlik için butona odaklan
    });
}

function closeMessage() {
    if (messageOverlay) {
        messageOverlay.classList.remove("show");
    }
    if (typeof currentResolve === "function") {
        const resolve = currentResolve;
        currentResolve = null;
        resolve(); // Promise'i tamamla
    }
}