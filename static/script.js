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
    renderInsights(data, sentiment, emotions, positive, negative, dominant);
    applyFilters();
  }

  function renderInsights(
    data,
    sentiment,
    emotions,
    positive,
    negative,
    dominant,
  ) {
    const neutral = Number(sentiment.neutral || 0);
    const total = Number(data.total_comments || comments.length);
    const topicBars = [
      ["Positif", positive, "#6366f1"],
      ["Netral / inquiry", neutral, "#2f9d95"],
      ["Kritis", negative, "#756396"],
    ];
    document.getElementById("topicBars").innerHTML = topicBars
      .map(
        ([label, value, color]) =>
          `<div class="insight-bar"><div class="insight-bar-label"><span>#${label}</span><span>${Number(value).toFixed(1)}%</span></div><div class="insight-bar-track"><div class="insight-bar-fill" style="width:${Math.min(100, Number(value))}%;background:${color}"></div></div></div>`,
      )
      .join("");
    setText(
      "topicInsight",
      `${number(total)} komentar dipetakan ke dalam tiga pola respons untuk video "${data.title}".`,
    );
    setText(
      "topicFoot",
      `Net score: ${positive - negative >= 0 ? "+" : ""}${(positive - negative).toFixed(1)} · berdasarkan ${number(total)} komentar`,
    );
    setText("positiveTag", `${positive.toFixed(1)}% positif`);
    setText("negativeTag", `${negative.toFixed(1)}% area friksi`);
    setText(
      "positiveFoot",
      `${number(comments.filter((comment) => comment.sentiment === "positive").length)} komentar positif terdeteksi`,
    );
    setText(
      "negativeFoot",
      `${number(comments.filter((comment) => comment.sentiment === "negative").length)} komentar kritis terdeteksi`,
    );
    renderInsightComments(
      "positiveInsightList",
      comments
        .filter((comment) => comment.sentiment === "positive")
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3),
      "positive",
    );
    renderInsightComments(
      "negativeInsightList",
      comments
        .filter((comment) => comment.sentiment === "negative")
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3),
      "negative",
    );
    if (dominant)
      setText(
        "insightDescription",
        `Sintesis ${number(total)} komentar · emosi dominan ${dominant[0]} (${Number(dominant[1]).toFixed(1)}%).`,
      );
  }

  function renderInsightComments(id, items, type) {
    const container = document.getElementById(id);
    container.innerHTML =
      items
        .map(
          (comment) =>
            `<div class="insight-item ${type === "negative" ? "negative-item" : ""}"><strong>${escapeHtml(comment.emotion || type)}</strong><span>${escapeHtml(comment.text)}</span></div>`,
        )
        .join("") ||
      `<p>Belum ada komentar ${type === "positive" ? "positif" : "negatif"}.</p>`;
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
