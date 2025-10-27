
// =================================
// VANILLA JAVASCRIPT
// =================================

'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- CHART.JS INSTANCES ---
    let sentimentChartInstance;
    let emotionChartInstance;

    // --- STATE ---
    let currentCommentsData = [];
    let currentAnalysisData = {};

    // --- DOM ELEMENT SELECTORS ---
    const landingPage = document.getElementById('landingPage');
    const dashboardPage = document.getElementById('dashboardPage');
    const analysisForm = document.getElementById('analysisForm');
    const youtubeLinkInput = document.getElementById('youtubeLinkInput');
    const analyzeButton = document.getElementById('analyzeButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
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
    
    // Download Button
    const downloadReportBtn = document.getElementById('downloadReportBtn');

    // --- PAGE/STATE LOGIC ---

    /**
     * Handles the form submission to start analysis.
     */
    async function handleAnalyze(e) {
        e.preventDefault();
        const videoUrl = youtubeLinkInput.value;

        if (!videoUrl) return;
        
        // Show loading state
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.classList.add('flex');
        analyzeButton.disabled = true;
        analyzeButton.querySelector('span').innerText = 'Analyzing...';
        errorMessage.classList.add('hidden'); // Hide old errors

        try {
            // --- MOCK API CALL ---
            // Replace this with your actual fetch call
            const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: videoUrl })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();

            // ---------------------
            
            /* // --- REAL API CALL (example) ---
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoUrl })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Server error: ${response.status}`);
            }
            const data = await response.json();
            */
            
            // Store data globally
            currentAnalysisData = data;
            currentCommentsData = data.comments || [];

            // Populate and show dashboard
            populateDashboard(data);
            landingPage.classList.add('hidden');
            dashboardPage.classList.remove('hidden');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            showError(error.message || 'Failed to fetch analysis. Please try again.');
        } finally {
            // Hide loading state
            loadingIndicator.classList.add('hidden');
            loadingIndicator.classList.remove('flex');
            analyzeButton.disabled = false;
            analyzeButton.querySelector('span').innerText = 'Analyze';
        }
    }
    
    /**
     * MOCK API FUNCTION - Simulates a fetch call
     * Remove this and use a real fetch in handleAnalyze
     */
    function mockApiCall(url) {
        console.log("Simulating API call for:", url);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // You can uncomment this to test error handling
                // if (url.includes("fail")) {
                //     reject(new Error("Invalid YouTube URL. Please check and try again."));
                // }
                
                resolve({
                  "video_title": "Introducing the Future of AI: A New Breakthrough",
                  "video_thumbnail": "https://placehold.co/600x400/3A3AFF/FFFFFF?text=Video+Thumbnail",
                  "total_comments": 1520,
                  "total_likes": 31050, // Changed for formatting
                  "sentiment_summary": {"positive": 65, "neutral": 20, "negative": 15},
                  "emotions": {"joy": 45, "anger": 10, "sadness": 8, "surprise": 15, "fear": 7, "neutral": 15},
                  "most_positive_comment": "This video made my day! Truly revolutionary.",
                  "most_negative_comment": "Worst content I've seen in a while. Unsubscribed.",
                  "most_liked_comment": "Great work! This is the kind of content we need.",
                  "comments": [
                    {"text": "Loved it! Absolutely fantastic.", "sentiment": "positive", "likes": 34, "time": "2 hours ago"},
                    {"text": "Not my type of video, sorry.", "sentiment": "negative", "likes": 3, "time": "1 day ago"},
                    {"text": "It was... okay. Nothing special.", "sentiment": "neutral", "likes": 12, "time": "5 hours ago"},
                    {"text": "Great work! This is the kind of content we need.", "sentiment": "positive", "likes": 58, "time": "3 hours ago"},
                    {"text": "Mind-blowing! 🤯 The future is here.", "sentiment": "positive", "likes": 22, "time": "1 hour ago"}
                  ]
                });
            }, 2500); // 2.5 second delay
        });
    }
    
    /**
     * Shows an error message on the landing page.
     * @param {string} message - The error message to display.
     */
    function showError(message) {
        errorText.innerText = message;
        errorMessage.classList.remove('hidden');
    }

    /**
     * Returns to the landing page from the dashboard.
     */
    function goHome() {
        dashboardPage.classList.add('hidden');
        landingPage.classList.remove('hidden');
        analysisForm.reset(); // Clear input field

        // Destroy charts to free up memory and prevent errors
        if (sentimentChartInstance) {
            sentimentChartInstance.destroy();
        }
        if (emotionChartInstance) {
            emotionChartInstance.destroy();
        }
        
        // Clear state
        currentCommentsData = [];
        currentAnalysisData = {};
    }

    /**
     * Fills the dashboard with data from the API.
     * @param {object} data - The analysis data from the backend.
     */
    function populateDashboard(data) {
        // Video Info
        videoThumbnail.src = data.video_thumbnail || 'https://placehold.co/600x400/3A3AFF/FFFFFF?text=No+Thumbnail';
        videoTitle.innerText = data.video_title || 'Video Title Not Found';

        // Summary Cards
        totalComments.innerText = formatNumber(data.total_comments || 0);
        totalLikes.innerText = formatNumber(data.total_likes || 0);

        // Highlights
        highlightPositive.querySelector('p').innerText = `"${data.most_positive_comment || 'N/A'}"`;
        highlightNegative.querySelector('p').innerText = `"${data.most_negative_comment || 'N/A'}"`;
        highlightLiked.querySelector('p').innerText = `"${data.most_liked_comment || 'N/A'}"`;
        
        // Populate Table
        renderCommentsTable(currentCommentsData);
        
        // Create Charts
        createCharts(data);
    }
    
    /**
     * Renders the comments table based on filters and sorting.
     * @param {Array} comments - The list of comment objects.
     */
    function renderCommentsTable(comments) {
        const textFilter = filterCommentText.value.toLowerCase();
        const sentimentFilter = filterSentiment.value; // Already lowercase from HTML
        const sortBy = sortComments.value;
        
        let filteredComments = [...comments];
        
        // 1. Filter
        filteredComments = filteredComments.filter(comment => {
            const matchesText = comment.text.toLowerCase().includes(textFilter);
            const matchesSentiment = !sentimentFilter || comment.sentiment.toLowerCase() === sentimentFilter;
            return matchesText && matchesSentiment;
        });
        
        // 2. Sort
        if (sortBy === 'likes') {
            filteredComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        }
        // 'default' order is just the filtered list from the API.
        
        // 3. Render
        commentsTableBody.innerHTML = ''; // Clear existing table
        if (filteredComments.length === 0) {
              commentsTableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500 dark:text-slate-400">No comments found matching filters.</td></tr>`;
              return;
        }
        
        filteredComments.forEach(comment => {
            const sentimentLower = (comment.sentiment || 'neutral').toLowerCase();
            const sentimentClass = 
                sentimentLower === 'positive' ? 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
                sentimentLower === 'negative' ? 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300' :
                'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300';
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-black/5 dark:hover:bg-white/5 transition-colors';
            row.innerHTML = `
                <td class="p-4 text-sm text-slate-700 dark:text-slate-300 max-w-sm" title="${comment.text}"><div class="truncate">${comment.text}</div></td>
                <td class="p-4 text-sm">
                    <span class="px-2 py-1 rounded-full text-xs font-medium capitalize ${sentimentClass}">
                        ${sentimentLower}
                    </span>
                </td>
                <td class="p-4 text-sm text-slate-600 dark:text-slate-400">${formatNumber(comment.likes || 0)}</td>
                <td class="p-4 text-sm text-slate-500 dark:text-slate-500">${comment.time || 'N/A'}</td>
            `;
            commentsTableBody.appendChild(row);
        });
    }

    /**
     * Formats a number into a compact "k" or "M" format.
     * @param {number} num - The number to format.
     */
    function formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return (num || 0).toLocaleString();
    }
    
    // --- CHART.JS LOGIC ---
    
    /**
     * Sets global Chart.js defaults for dark/light mode.
     * @param {boolean} isDark - If dark mode is active.
     */
    function setChartDefaults(isDark) {
        const tickColor = isDark ? '#9ca3af' : '#475569'; // gray-400 / gray-600
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        Chart.defaults.color = tickColor;
        Chart.defaults.borderColor = gridColor;
        Chart.defaults.plugins.tooltip.backgroundColor = isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        Chart.defaults.plugins.tooltip.titleColor = isDark ? '#e2e8f0' : '#0f172a';
        Chart.defaults.plugins.tooltip.bodyColor = isDark ? '#e2e8f0' : '#0f172a';
        Chart.defaults.plugins.tooltip.borderColor = '#00D1FF';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.boxPadding = 4;
    }

    /**
     * Creates both sentiment and emotion charts.
     * @param {object} data - The analysis data from the backend.
     */
    function createCharts(data) {
        const isDark = document.documentElement.classList.contains('dark');
        setChartDefaults(isDark);
        
        createSentimentChart(data.sentiment_summary || { neutral: 100 });
        createEmotionChart(data.emotions || { neutral: 100 });
        
        // Update total label on sentiment chart
        const totalSentiment = Object.values(data.sentiment_summary || {total: 100}).reduce((a, b) => a + b, 0);
        sentimentTotal.querySelector('span:first-child').innerText = `${totalSentiment}%`;
        sentimentTotal.querySelector('span:last-child').innerText = 'Total';
    }

    /**
     * Creates the Sentiment Doughnut Chart.
     * @param {object} sentimentSummary - e.g., {"positive": 65, "neutral": 20, "negative": 15}
     */
    function createSentimentChart(sentimentSummary) {
        const ctx = document.getElementById('sentimentChart').getContext('2d');
        
        const labels = Object.keys(sentimentSummary);
        const values = Object.values(sentimentSummary);
        const colors = labels.map(label => {
            if (label.toLowerCase() === 'positive') return '#22c55e'; // green-500
            if (label.toLowerCase() === 'negative') return '#ef4444'; // red-500
            return '#6b7280'; // gray-500
        });

        if (sentimentChartInstance) {
            sentimentChartInstance.destroy();
        }

        sentimentChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)), // Capitalize
                datasets: [{
                    data: values,
                    backgroundColor: colors,
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
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Creates the Emotion Bar Chart.
     * @param {object} emotionSummary - e.g., {"joy": 45, "anger": 10, ...}
     */
    function createEmotionChart(emotionSummary) {
        const ctx = document.getElementById('emotionChart').getContext('2d');

        const sortedEmotions = Object.entries(emotionSummary).sort(([,a],[,b]) => b-a);
        const labels = sortedEmotions.map(([key]) => key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize
        const values = sortedEmotions.map(([,value]) => value);
        
        if (emotionChartInstance) {
            emotionChartInstance.destroy();
        }
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, '#00D1FF');
        gradient.addColorStop(1, '#3A3AFF');

        emotionChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Emotion %',
                    data: values,
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
                        display: false,
                        grid: { display: false },
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw}%`;
                            }
                        }
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
            // Re-create charts to apply new defaults
            if (currentAnalysisData.sentiment_summary) {
                  createCharts(currentAnalysisData);
            }
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
    
    // --- DOWNLOAD REPORT LOGIC ---
    
    /**
     * Converts the comments data to a CSV string.
     */
    function convertToCSV(comments) {
        const headers = ['Comment', 'Sentiment', 'Likes', 'Time'];
        const rows = comments.map(comment => 
            [
                `"${(comment.text || '').replace(/"/g, '""')}"`, // Escape double quotes
                comment.sentiment || 'N/A',
                comment.likes || 0,
                comment.time || 'N/A'
            ].join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    }
    
    /**
     * Triggers a browser download for the CSV file.
     */
    function downloadCSV() {
        if (!currentCommentsData || currentCommentsData.length === 0) {
            // You can replace this with a custom modal
            alert('No data to download. Please analyze a video first.');
            return;
        }
        
        const csv = convertToCSV(currentCommentsData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const title = (currentAnalysisData.video_title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.setAttribute('href', url);
            link.setAttribute('download', `yt_emotion_analysis_${title}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // --- INITIALIZE ---
    initDarkMode();
    
    // Add all event listeners
    analysisForm.addEventListener('submit', handleAnalyze);
    backButton.addEventListener('click', goHome);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    downloadReportBtn.addEventListener('click', downloadCSV);
    
    // Add listeners for table filters
    const updateTable = () => renderCommentsTable(currentCommentsData);
    filterCommentText.addEventListener('input', updateTable);
    filterSentiment.addEventListener('change', updateTable);
    sortComments.addEventListener('change', updateTable);
});