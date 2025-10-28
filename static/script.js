document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("analysisForm");
    const input = document.getElementById("youtubeLinkInput");
    const loading = document.getElementById("loadingIndicator");
    const errorDiv = document.getElementById("errorMessage");
    const errorText = document.getElementById("errorText");
    const landingPage = document.getElementById("landingPage");
    const dashboardPage = document.getElementById("dashboardPage");

    // dashboard elements
    const videoTitle = document.getElementById("videoTitle");
    const videoThumbnail = document.getElementById("videoThumbnail");
    const totalLikes = document.getElementById("totalLikes");
    const totalComments = document.getElementById("totalComments");
    const highlightPositive = document.getElementById("highlightPositive");
    const highlightNegative = document.getElementById("highlightNegative");
    const highlightLiked = document.getElementById("highlightLiked");
    const commentsTableBody = document.getElementById("commentsTableBody");

    let sentimentChart, emotionChart;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorDiv.classList.add("hidden");
        loading.classList.remove("hidden");
        // window.lastAnalyzedData = data;

        try {
            const response = await fetch("/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ youtube_url: input.value })
            });

            const data = await response.json();
            loading.classList.add("hidden");

            if (!response.ok) {
                errorText.textContent = data.error || "Unknown error";
                errorDiv.classList.remove("hidden");
                return;
            }

            // Switch to dashboard view
            landingPage.classList.add("hidden");
            dashboardPage.classList.remove("hidden");
            setTimeout(() => dashboardPage.classList.add("active"), 50);

            // Update video info
            videoTitle.textContent = data.title;
            videoThumbnail.src = data.thumbnail;
            totalLikes.textContent = data.total_likes.toLocaleString();
            totalComments.textContent = data.total_comments.toLocaleString();

            // Highlights
            highlightPositive.querySelector("p").textContent = `"${data.highlights.positive}"`;
            highlightNegative.querySelector("p").textContent = `"${data.highlights.negative}"`;
            highlightLiked.querySelector("p").textContent = `"${data.highlights.liked}"`;

            // Charts
            updateSentimentChart(data.sentiment_percent);
            updateEmotionChart(data.emotion_percent);

            // Comments
            renderComments(data.comments);

        } catch (err) {
            loading.classList.add("hidden");
            errorText.textContent = err.message;
            errorDiv.classList.remove("hidden");
        }
    });

    // ===============================
    // 🔙 Tombol Back ke Landing Page
    // ===============================
    const backButton = document.getElementById("backButton");
    backButton.addEventListener("click", () => {
        dashboardPage.classList.add("opacity-0");
        setTimeout(() => {
            dashboardPage.classList.add("hidden");
            landingPage.classList.remove("hidden");
            setTimeout(() => landingPage.classList.remove("opacity-0"), 50);
        }, 400);
    });
    // ===============================

    function updateSentimentChart(sentiment) {
    const ctx = document.getElementById("sentimentChart");
    if (sentimentChart) sentimentChart.destroy();

    sentimentChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Positive", "Negative", "Neutral"],
            datasets: [{
                data: [sentiment.positive, sentiment.negative, sentiment.neutral],
                backgroundColor: ["#10B981", "#EF4444", "#9CA3AF"],
                borderColor: "#0f172a",
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            cutout: "75%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#cbd5e1",
                        font: { size: 13, weight: 500 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.parsed}%`
                    }
                }
            }
        }
    });

    const total = (sentiment.positive + sentiment.negative + sentiment.neutral).toFixed(0);
    const center = document.querySelector("#sentimentChart").parentNode.querySelector(".absolute");
    if (center) center.innerHTML = `<span class="text-3xl font-semibold text-white">${total}%</span><p class="text-slate-400 text-sm">Total</p>`;
    }

    function updateEmotionChart(emotions) {
    const ctx = document.getElementById("emotionChart");
    if (emotionChart) emotionChart.destroy();

    emotionChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(emotions),
            datasets: [{
                label: "Emotion %",
                data: Object.values(emotions),
                backgroundColor: [
                    "#60A5FA", "#34D399", "#F472B6", "#FBBF24",
                    "#A78BFA", "#F87171", "#38BDF8"
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}%` } }
            },
            scales: {
                x: {
                    ticks: { color: "#cbd5e1", font: { size: 12 } },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: "#64748b", font: { size: 12 }, stepSize: 20 },
                    grid: { color: "rgba(148,163,184,0.1)" },
                    beginAtZero: true
                }
            }
        }
    });}

    // =============== COMMENT FILTERING & SORTING ===============
    const sentimentFilter = document.getElementById("sentimentFilter");
    const sortOrder = document.getElementById("sortOrder");
    const commentSearch = document.getElementById("commentSearch");
    let allComments = [];

    function renderComments(comments) {
        allComments = comments; // simpan semua komentar
        applyFilters();
    }

    function applyFilters() {
        let filtered = [...allComments];
        const filterValue = sentimentFilter.value;
        const sortValue = sortOrder.value;
        const searchValue = commentSearch.value.toLowerCase();

        // Filter sentiment
        if (filterValue !== "all") {
            filtered = filtered.filter(c => c.sentiment.toLowerCase() === filterValue);
        }

        // Filter by text
        if (searchValue) {
            filtered = filtered.filter(c => c.text.toLowerCase().includes(searchValue));
        }

        // Sort
        if (sortValue === "likes") {
            filtered.sort((a, b) => b.likes - a.likes);
        } else if (sortValue === "newest") {
            filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
        } else if (sortValue === "oldest") {
            filtered.sort((a, b) => new Date(a.time) - new Date(b.time));
        }

        // Render hasil
        commentsTableBody.innerHTML = "";
        if (filtered.length === 0) {
            commentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500 dark:text-slate-400">No comments found.</td></tr>`;
            return;
        }

        filtered.forEach(c => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="p-4 text-slate-800 dark:text-slate-200">${c.text}</td>
                <td class="p-4 capitalize text-slate-600 dark:text-slate-400">${c.sentiment}</td>
                <td class="p-4">${c.likes}</td>
                <td class="p-4 text-slate-500 text-sm">${new Date(c.time).toLocaleString()}</td>
            `;
            commentsTableBody.appendChild(row);
        });
    }

    // Event listeners
    [sentimentFilter, sortOrder, commentSearch].forEach(el => {
        el.addEventListener("input", applyFilters);
    });

    


});
