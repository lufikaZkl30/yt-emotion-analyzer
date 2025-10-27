// static/script.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("analyze-form");
  const videoUrlInput = document.getElementById("video-url");
  const status = document.getElementById("status");
  const landing = document.getElementById("landing");
  const dashboard = document.getElementById("dashboard");

  const thumb = document.getElementById("thumb");
  const titleEl = document.getElementById("title");
  const totalCommentsEl = document.getElementById("total-comments");
  const totalLikesEl = document.getElementById("total-likes");
  const mostPos = document.getElementById("most-positive");
  const mostNeg = document.getElementById("most-negative");
  const mostLiked = document.getElementById("most-liked");
  const commentsBody = document.getElementById("comments-body");

  let sentimentChart = null;
  let emotionChart = null;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = videoUrlInput.value.trim();
    if (!url) return alert("Paste YouTube URL first.");

    status.classList.remove("hidden");
    status.textContent = "Processing...";

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!resp.ok) throw new Error("Server error");

      const data = await resp.json();
      renderDashboard(data);
      landing.classList.add("hidden");
      dashboard.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      alert("Gagal menganalisis. Cek console.");
    } finally {
      status.classList.add("hidden");
    }
  });

  function renderDashboard(data) {
    const { videoInfo, sentimentData, emotionData, comments, highlighted } = data;

    // basic info
    thumb.src = videoInfo.thumbnail || "";
    titleEl.textContent = videoInfo.title || "Untitled";
    totalCommentsEl.textContent = (videoInfo.totalComments || 0).toLocaleString();
    totalLikesEl.textContent = (videoInfo.totalLikes || 0).toLocaleString();

    // highlights
    mostPos.textContent = `Most Positive: "${highlighted.positive.text}" — ${highlighted.positive.likes} likes`;
    mostNeg.textContent = `Most Negative: "${highlighted.negative.text}" — ${highlighted.negative.likes} likes`;
    mostLiked.textContent = `Most Liked: "${highlighted.liked.text}" — ${highlighted.liked.likes} likes`;

    // comments table
    commentsBody.innerHTML = "";
    comments.forEach(c => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-white/3 transition-colors";
      tr.innerHTML = `
        <td class="p-2 align-top">${escapeHtml(c.text)}</td>
        <td class="p-2 align-top"><span class="px-2 py-1 rounded-full text-xs ${c.sentiment==='Positive'?'bg-green-600/20 text-green-300':c.sentiment==='Negative'?'bg-red-600/20 text-red-300':'bg-gray-600/20 text-gray-300'}">${c.sentiment}</span></td>
        <td class="p-2 align-top">${c.likes}</td>
        <td class="p-2 align-top">${c.time}</td>
      `;
      commentsBody.appendChild(tr);
    });

    // sentiment chart (pie)
    const sentCtx = document.getElementById("sentimentChart").getContext("2d");
    const sentLabels = sentimentData.map(d => d.name);
    const sentValues = sentimentData.map(d => d.value);
    const sentColors = sentimentData.map(d => d.color || '#888');

    if (sentimentChart) { sentimentChart.destroy(); }
    sentimentChart = new Chart(sentCtx, {
      type: 'doughnut',
      data: {
        labels: sentLabels,
        datasets: [{ data: sentValues, backgroundColor: sentColors, borderWidth: 0 }]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { color: '#cfe7ff' } } },
        cutout: '65%'
      }
    });

    // emotion chart (horizontal bar)
    const emoCtx = document.getElementById("emotionChart").getContext("2d");
    const emoLabels = emotionData.map(d => d.name);
    const emoValues = emotionData.map(d => d.value);
    if (emotionChart) { emotionChart.destroy(); }
    emotionChart = new Chart(emoCtx, {
      type: 'bar',
      data: {
        labels: emoLabels,
        datasets: [{ label: 'Count', data: emoValues, backgroundColor: function(ctx) {
          // gradient-like by index
          const index = ctx.dataIndex;
          const base1 = 'rgba(58,58,255,0.9)';
          const base2 = 'rgba(0,209,255,0.9)';
          return index % 2 === 0 ? base1 : base2;
        } }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: '#cfe7ff' } }, y: { ticks: { color: '#cfe7ff' } } }
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function (m) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m];
    });
  }

});
