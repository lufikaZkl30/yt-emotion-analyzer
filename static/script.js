document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("analysisForm");
  const input = document.getElementById("youtubeLinkInput");
  const loading = document.getElementById("loadingIndicator");
  const errorBox = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");
  const analyzeButton = document.getElementById("analyzeButton");
  let comments = [];

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const number = (value) => Number(value || 0).toLocaleString("id-ID");
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>\"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.add("hidden");
    loading.classList.remove("hidden");
    analyzeButton.disabled = true;

    try {
      const response = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: input.value.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analisis gagal.");
      renderAnalysis(data);
      document
        .getElementById("analisis-section")
        .scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      errorText.textContent =
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke Flask.";
      errorBox.classList.remove("hidden");
    } finally {
      loading.classList.add("hidden");
      analyzeButton.disabled = false;
    }
  });

  function renderAnalysis(data) {
    const sentiment = data.sentiment_percent || {};
    const emotions = data.emotion_percent || {};
    const positive = Number(sentiment.positive || 0);
    const negative = Number(sentiment.negative || 0);
    const dominant = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];
    const net = positive - negative;

    document.getElementById("videoThumbnail").src = data.thumbnail;
    setText("videoTitle", data.title);
    setText("totalLikes", number(data.total_likes));
    setText("totalComments", number(data.total_comments));
    setText("netScore", `${net >= 0 ? "+" : ""}${net.toFixed(1)}`);
    setText(
      "sentimentScore",
      `${((positive + (100 - negative)) / 2).toFixed(1)}`,
    );
    setText("positivePercent", `${positive.toFixed(1)}%`);
    setText(
      "dominantEmotion",
      dominant ? `${dominant[0]} ${Number(dominant[1]).toFixed(1)}%` : "-",
    );
    setText(
      "positiveHighlight",
      data.highlights?.positive || "Tidak ada komentar positif.",
    );
    setText(
      "negativeHighlight",
      data.highlights?.negative || "Tidak ada komentar negatif.",
    );
    setText(
      "analysisStatus",
      `${number(data.total_comments)} komentar dianalisis (maks. 500)`,
    );
    setText(
      "summaryText",
      `Audiens menunjukkan ${positive >= 50 ? "respons yang dominan positif" : "respons yang beragam"} dengan ${positive.toFixed(1)}% sentimen positif dan ${negative.toFixed(1)}% sentimen negatif. ${dominant ? `Emosi dominan adalah ${dominant[0]}.` : ""}`,
    );

    comments = Array.isArray(data.comments) ? data.comments : [];
    renderCategories();
    renderSpectrum(emotions);
    applyFilters();
  }

  function renderCategories() {
    ["positive", "neutral", "negative"].forEach((sentiment) => {
      const items = comments.filter(
        (comment) => comment.sentiment === sentiment,
      );
      setText(
        `${sentiment}Count`,
        `${items.length.toLocaleString("id-ID")} komentar`,
      );
      document.getElementById(`${sentiment}Comments`).innerHTML =
        items
          .slice(0, 2)
          .map(
            (comment) =>
              `<div class="comment-mini"><strong>${escapeHtml(comment.emotion || sentiment)}</strong>${escapeHtml(comment.text)}</div>`,
          )
          .join("") || '<div class="comment-mini">Belum ada komentar.</div>';
    });
  }

  function renderSpectrum(emotions) {
    const entries = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    document.getElementById("emotionSpectrum").innerHTML =
      entries
        .map(
          ([emotion, value]) =>
            `<div class="emotion-row"><div class="emotion-line"><span>${escapeHtml(emotion)}</span><span>${Number(value).toFixed(1)}%</span></div><div class="bar"><i style="width:${Math.min(100, Number(value))}%"></i></div></div>`,
        )
        .join("") || "<p>Belum ada data emosi.</p>";
  }

  function applyFilters() {
    const filter = document.getElementById("sentimentFilter").value;
    const search = document
      .getElementById("commentSearch")
      .value.toLowerCase()
      .trim();
    const order = document.getElementById("sortOrder").value;
    const filtered = comments.filter(
      (comment) =>
        (filter === "all" || comment.sentiment === filter) &&
        (!search || comment.text.toLowerCase().includes(search)),
    );
    if (order === "likes") filtered.sort((a, b) => b.likes - a.likes);
    if (order === "newest")
      filtered.sort((a, b) => new Date(b.time) - new Date(a.time));
    if (order === "oldest")
      filtered.sort((a, b) => new Date(a.time) - new Date(b.time));
    document.getElementById("commentsTableBody").innerHTML =
      filtered
        .map(
          (comment) =>
            `<tr><td>${escapeHtml(comment.text)}</td><td><span class="badge badge-${comment.sentiment}">${escapeHtml(comment.sentiment)}</span></td><td>${number(comment.likes)}</td><td>${new Date(comment.time).toLocaleString("id-ID")}</td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="4">Tidak ada komentar yang cocok.</td></tr>';
  }

  ["sentimentFilter", "sortOrder", "commentSearch"].forEach((id) =>
    document.getElementById(id).addEventListener("input", applyFilters),
  );

  document
    .getElementById("downloadReportBtn")
    .addEventListener("click", async () => {
      try {
        const response = await fetch("/download-report", { method: "POST" });
        if (!response.ok) throw new Error("Download gagal.");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(await response.blob());
        link.download = "YTEmotionReport.xlsx";
        link.click();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Download gagal.");
      }
    });
});
