document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("analysisForm");
    const youtubeLinkInput = document.getElementById("youtubeLinkInput");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const errorMessage = document.getElementById("errorMessage");
    const dashboardPage = document.getElementById("dashboardPage");
    const landingPage = document.getElementById("landingPage");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const youtubeURL = youtubeLinkInput.value.trim();
        if (!youtubeURL) return;

        // tampilkan loading
        loadingIndicator.classList.remove("hidden");
        errorMessage.classList.add("hidden");

        try {
            const res = await fetch("/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ youtube_url: youtubeURL }),
            });

            const data = await res.json();
            loadingIndicator.classList.add("hidden");

            if (!res.ok) {
                document.getElementById("errorText").textContent = data.error || "Something went wrong.";
                errorMessage.classList.remove("hidden");
                return;
            }

            // ganti ke dashboard
            landingPage.classList.add("hidden");
            dashboardPage.classList.remove("hidden");

            // tampilkan hasil
            document.getElementById("videoTitle").textContent = data.title;
            document.getElementById("videoThumbnail").src = data.thumbnail;
            document.getElementById("totalLikes").textContent = data.total_likes;
            document.getElementById("totalComments").textContent = data.total_comments;

            // isi tabel komentar
            const tableBody = document.getElementById("commentsTableBody");
            tableBody.innerHTML = "";

            data.comments.forEach(c => {
                const row = `
                    <tr>
                        <td class="p-4 text-sm text-slate-700 dark:text-slate-300">${c.text}</td>
                        <td class="p-4 text-sm">${c.sentiment}</td>
                        <td class="p-4 text-sm">${c.likes}</td>
                        <td class="p-4 text-sm">${new Date(c.time).toLocaleString()}</td>
                    </tr>`;
                tableBody.insertAdjacentHTML("beforeend", row);
            });

            // update chart.js di sini (kalau kamu mau)

        } catch (err) {
            loadingIndicator.classList.add("hidden");
            document.getElementById("errorText").textContent = err.message;
            errorMessage.classList.remove("hidden");
        }
    });
});
