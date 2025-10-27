// --- MOCK DATA ---
const MOCK_ANALYSIS_DATA = {
    videoInfo: {
        title: "Introducing the Future of AI: A New Breakthrough",
        thumbnail: "https://placehold.co/600x400/3A3AFF/FFFFFF?text=Video+Thumbnail",
        totalComments: 1245,
        totalLikes: 34200,
    },
    sentimentData: [
        { name: 'Positive', value: 747, color: '#22c55e' }, // green-500
        { name: 'Negative', value: 249, color: '#ef4444' }, // red-500
        { name: 'Neutral', value: 249, color: '#6b7280' },  // gray-500
    ],
    emotionData: [
        { name: 'Joy', value: 410 },
        { name: 'Surprise', value: 230 },
        { name: 'Anticipation', value: 180 },
        { name: 'Trust', value: 150 },
        { name: 'Sadness', value: 90 },
        { name: 'Anger', value: 85 },
        { name: 'Disgust', value: 50 },
        { name: 'Fear', value: 50 },
    ],
    comments: [
        { id: 1, text: "This is absolutely mind-blowing! 🤯 The future is here.", sentiment: 'Positive', likes: 152, time: '2 hours ago', timestamp: Date.now() - 2 * 3600 * 1000 },
        { id: 2, text: "I'm not convinced. Seems like a lot of hype without real substance.", sentiment: 'Negative', likes: 45, time: '1 hour ago', timestamp: Date.now() - 1 * 3600 * 1000 },
        { id: 3, text: "It's an interesting concept, but I'll wait to see the final product.", sentiment: 'Neutral', likes: 78, time: '3 hours ago', timestamp: Date.now() - 3 * 3600 * 1000 },
        { id: 4, text: "Wow, I'm speechless. This will change everything!", sentiment: 'Positive', likes: 210, time: '5 hours ago', timestamp: Date.now() - 5 * 3600 * 1000 },
        { id: 5, text: "Honestly, this looks dangerous. The ethical implications are huge.", sentiment: 'Negative', likes: 62, time: '2 hours ago', timestamp: Date.now() - 2 * 3600 * 1000 - 1000 },
        { id: 6, text: "The presentation was very clear. Good job.", sentiment: 'Neutral', likes: 30, time: '45 minutes ago', timestamp: Date.now() - 45 * 60 * 1000 },
        { id: 7, text: "I've been waiting for something like this! Take my money! 💰", sentiment: 'Positive', likes: 95, time: '1 day ago', timestamp: Date.now() - 24 * 3600 * 1000 },
    ],
    highlighted: {
        positive: { text: "Wow, I'm speechless. This will change everything!", likes: 210 },
        negative: { text: "Honestly, this looks dangerous. The ethical implications are huge.", likes: 62 },
        liked: { text: "Wow, I'm speechless. This will change everything!", likes: 210 },
    },
};

// --- CHART.JS INSTANCES ---
let sentimentChartInstance;
let emotionChartInstance;

// --- DOM ELEMENT SELECTORS ---
const landingPage = document.getElementById('landingPage');
const dashboardPage = document.getElementById('dashboardPage');
const analysisForm = document.getElementById('analysisForm');
const analyzeButton = document.getElementById('analyzeButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const backButton = document.getElementById('backButton');
const darkModeToggle = document.getElementById('darkModeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

// Dashboard Data Elements
const videoThumbnail = document.getElementById('videoThumbnail');
const videoTitle = document.getElementById('videoTitle');
const totalComments = document.getElementById('totalComments');
const totalLikes = document.getElementById('totalLikes');
const highlightPositive = document.getElementById('highlightPositive');
const highlightNegative = document.getElementById('highlightNegative');
const highlightLiked = document.getElementById('highlightLiked');
const commentsTableBody = document.getElementById('commentsTableBody');
const sentimentTotal = document.getElementById('sentimentTotal');

// Filter/Sort Elements
const filterCommentText = document.getElementById('filterCommentText');
const filterSentiment = document.getElementById('filterSentiment');
const sortComments = document.getElementById('sortComments');


// --- PAGE/STATE LOGIC ---

/**
 * Handles the form submission to start analysis.
 */
function handleAnalyze(e) {
    e.preventDefault();
    
    // Show loading state
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
    analyzeButton.disabled = true;

    // Simulate API call
    setTimeout(() => {
        // Hide loading state
        loadingIndicator.classList.add('hidden');
        loadingIndicator.classList.remove('flex');
        analyzeButton.disabled = false;

        // Populate and show dashboard
        populateDashboard(MOCK_ANALYSIS_DATA);
        landingPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        
        // Clear input
        analysisForm.reset();
    }, 2500);
}

/**
 * Returns to the landing page from the dashboard.
 */
function goHome() {
    dashboardPage.classList.add('hidden');
    landingPage.classList.remove('hidden');

    // Destroy charts to free up memory and prevent errors
    if (sentimentChartInstance) {
        sentimentChartInstance.destroy();
    }
    if (emotionChartInstance) {
        emotionChartInstance.destroy();
    }
}

/**
 * Fills the dashboard with data.
 */
function populateDashboard(data) {
    // Video Info
    videoThumbnail.src = data.videoInfo.thumbnail;
    videoTitle.innerText = data.videoInfo.title;

    // Summary Cards
    totalComments.innerText = data.videoInfo.totalComments.toLocaleString();
    totalLikes.innerText = (data.videoInfo.totalLikes / 1000).toFixed(1) + 'k';

    // Highlights
    highlightPositive.querySelector('p:first-of-type').innerText = `"${data.highlighted.positive.text}"`;
    highlightPositive.querySelector('p:last-of-type').innerText = `${data.highlighted.positive.likes} Likes`;
    
    highlightNegative.querySelector('p:first-of-type').innerText = `"${data.highlighted.negative.text}"`;
    highlightNegative.querySelector('p:last-of-type').innerText = `${data.highlighted.negative.likes} Likes`;
    
    highlightLiked.querySelector('p:first-of-type').innerText = `"${data.highlighted.liked.text}"`;
    highlightLiked.querySelector('p:last-of-type').innerText = `${data.highlighted.liked.likes} Likes`;
    
    // Populate Table
    renderCommentsTable();
    
    // Create Charts
    createCharts(data);
}

/**
 * Renders the comments table based on filters and sorting.
 */
function renderCommentsTable() {
    const textFilter = filterCommentText.value.toLowerCase();
    const sentimentFilter = filterSentiment.value;
    const sortBy = sortComments.value;
    
    let comments = [...MOCK_ANALYSIS_DATA.comments];
    
    // 1. Filter
    comments = comments.filter(comment => {
        const matchesText = comment.text.toLowerCase().includes(textFilter);
        const matchesSentiment = !sentimentFilter || comment.sentiment === sentimentFilter;
        return matchesText && matchesSentiment;
    });
    
    // 2. Sort
    if (sortBy === 'likes') {
        comments.sort((a, b) => b.likes - a.likes);
    } else {
        // Default sort by time (newest first)
        comments.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // 3. Render
    commentsTableBody.innerHTML = ''; // Clear existing table
    if (comments.length === 0) {
            commentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500 dark:text-slate-400">No comments found.</td></tr>`;
            return;
    }
    
    comments.forEach(comment => {
        const sentimentClass = 
            comment.sentiment === 'Positive' ? 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
            comment.sentiment === 'Negative' ? 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300' :
            'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300';
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-black/5 dark:hover:bg-white/5 transition-colors';
        row.innerHTML = `
            <td class="p-4 text-sm text-slate-700 dark:text-slate-300 max-w-sm truncate">${comment.text}</td>
            <td class="p-4 text-sm">
                <span class="px-2 py-1 rounded-full text-xs font-medium ${sentimentClass}">
                    ${comment.sentiment}
                </span>
            </td>
            <td class="p-4 text-sm text-slate-600 dark:text-slate-400">${comment.likes}</td>
            <td class="p-4 text-sm text-slate-500 dark:text-slate-500">${comment.time}</td>
        `;
        commentsTableBody.appendChild(row);
    });
}

// --- CHART.JS LOGIC ---

/**
 * Sets global Chart.js defaults for dark/light mode.
 */
function setChartDefaults(isDark) {
    const tickColor = isDark ? '#9ca3af' : '#475569'; // gray-400 / gray-600
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    Chart.defaults.color = tickColor;
    Chart.defaults.borderColor = gridColor;
}

/**
 * Creates both sentiment and emotion charts.
 */
function createCharts(data) {
    const isDark = document.documentElement.classList.contains('dark');
    setChartDefaults(isDark);
    
    createSentimentChart(data.sentimentData);
    createEmotionChart(data.emotionData);
    
    // Update total label
    sentimentTotal.querySelector('span:first-child').innerText = data.videoInfo.totalComments.toLocaleString();
}

/**
 * Creates the Sentiment Doughnut Chart.
 */
function createSentimentChart(data) {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    
    // Destroy old chart if it exists
    if (sentimentChartInstance) {
        sentimentChartInstance.destroy();
    }

    sentimentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: data.map(d => d.color),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(2, 6, 23, 0.8)', // slate-950
                    titleColor: '#e2e8f0', // slate-200
                    bodyColor: '#e2e8f0',
                    borderColor: '#00D1FF',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    boxPadding: 4
                }
            }
        }
    });
}

/**
 * Creates the Emotion Bar Chart.
 */
function createEmotionChart(data) {
    const ctx = document.getElementById('emotionChart').getContext('2d');

    // Destroy old chart if it exists
    if (emotionChartInstance) {
        emotionChartInstance.destroy();
    }
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
    gradient.addColorStop(0, '#3A3AFF');
    gradient.addColorStop(1, '#00D1FF');

    emotionChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Emotion Count',
                data: data.map(d => d.value),
                backgroundColor: gradient,
                borderRadius: 4,
                barThickness: 15,
            }]
        },
        options: {
            indexAxis: 'y', // Makes it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: false, // Hide X-axis
                    grid: {
                        display: false
                    },
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(2, 6, 23, 0.8)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#00D1FF',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                }
            }
        }
    });
}

// --- DARK MODE LOGIC ---

/**
 * Toggles dark mode and updates charts.
 */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeIcons(isDark);
    
    // Re-render charts with new default colors
    if (dashboardPage.classList.contains('hidden') === false) {
        setChartDefaults(isDark);
        if (sentimentChartInstance) sentimentChartInstance.update();
        if (emotionChartInstance) emotionChartInstance.update();
    }
}

/**
 * Updates sun/moon icon visibility.
 */
function updateDarkModeIcons(isDark) {
    if (isDark) {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
}

/**
 * Initializes dark mode from localStorage or system preference.
 */
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                    (localStorage.getItem('darkMode') === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.classList.toggle('dark', isDark);
    updateDarkModeIcons(isDark);
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    
    analysisForm.addEventListener('submit', handleAnalyze);
    backButton.addEventListener('click', goHome);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Add listeners for table filters
    filterCommentText.addEventListener('input', renderCommentsTable);
    filterSentiment.addEventListener('change', renderCommentsTable);
    sortComments.addEventListener('change', renderCommentsTable);
});
