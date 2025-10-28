document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("analysisForm");
    const input = document.getElementById("youtubeLinkInput");
    const loading = document.getElementById("loadingIndicator");
    const errorDiv = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorDiv.classList.add("hidden");
        loading.classList.remove("hidden");

        try {
            const response = await fetch("/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ youtube_url: input.value })
            });

            const data = await response.json();
            loading.classList.add("hidden");

            if (!response.ok) {
                errorText.textContent = data.error || "Unknown error occurred.";
                errorDiv.classList.remove("hidden");
                return;
            }

            console.log("✅ Analysis Result:", data);
            // TODO: tampilkan hasil ke dashboard (data binding bisa kamu lanjutin di sini)

        } catch (err) {
            loading.classList.add("hidden");
            errorText.textContent = err.message;
            errorDiv.classList.remove("hidden");
        }
    });
});
