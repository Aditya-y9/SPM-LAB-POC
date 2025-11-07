const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const predictBtn = document.getElementById('predictBtn');
const resultsSection = document.getElementById('resultsSection');
const changeImageBtn = document.getElementById('changeImageBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');

let selectedFile = null;
let chartInstances = {};

// Click to upload
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

// File input change
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// Change image button
changeImageBtn.addEventListener('click', () => {
    fileInput.click();
});

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }

    selectedFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        previewSection.style.display = 'block';
        predictBtn.disabled = false;
        resultsSection.style.display = 'none';
    };
    
    reader.readAsDataURL(file);
}

// Predict button click
predictBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    predictBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayResults(data);
        } else {
            alert('Prediction failed: ' + (data.detail || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        // Hide loading state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        predictBtn.disabled = false;
    }
});

function displayResults(data) {
    // Set basic result info
    const plantTypeEl = document.getElementById('plantType');
    const diseaseEl = document.getElementById('disease');
    const confidenceEl = document.getElementById('confidence');
    const confidenceBar = document.getElementById('confidenceBar');
    
    if (plantTypeEl) plantTypeEl.textContent = data.plant_type;
    if (diseaseEl) diseaseEl.textContent = data.disease;
    if (confidenceEl) confidenceEl.textContent = `${data.confidence}%`;
    if (confidenceBar) {
        confidenceBar.style.setProperty('--confidence-width', `${data.confidence}%`);
    }
    
    // Destroy existing charts
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances = {};
    
    // Create Pie Chart
    const pieCtx = document.getElementById('probabilityChart');
    if (pieCtx) {
        chartInstances.pieChart = new Chart(pieCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(data.all_probabilities),
                datasets: [{
                    data: Object.values(data.all_probabilities),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(255, 107, 107, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }
    
    // Create Bar Chart
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        chartInstances.barChart = new Chart(barCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Object.keys(data.all_probabilities).map(label => label.split('-')[1]),
                datasets: [{
                    label: 'Confidence %',
                    data: Object.values(data.all_probabilities),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(255, 107, 107, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(118, 75, 162, 1)',
                        'rgba(255, 107, 107, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.y}%`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    // Add recommendations
    const recommendations = getRecommendations(data.plant_type, data.disease);
    const recommendationsContent = document.getElementById('recommendationsContent');
    
    if (recommendationsContent) {
        recommendationsContent.innerHTML = `<ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`;
    }
    
    // Show results section
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function getRecommendations(plantType, disease) {
    const recommendations = {
        'Corn-Common_rust': [
            'Remove and destroy infected leaves immediately',
            'Apply fungicides containing mancozeb or chlorothalonil',
            'Improve air circulation by proper spacing',
            'Use resistant corn varieties for future planting',
            'Monitor plants regularly for early detection'
        ],
        'Potato-Early_blight': [
            'Remove infected lower leaves to reduce spread',
            'Apply copper-based fungicides every 7-10 days',
            'Ensure proper drainage to reduce humidity',
            'Rotate crops with non-solanaceous plants',
            'Mulch around plants to prevent soil splash'
        ],
        'Tomato-Bacterial_spot': [
            'Remove and destroy infected plant material',
            'Apply copper-based bactericides preventively',
            'Avoid overhead watering to reduce leaf wetness',
            'Use disease-free seeds and transplants',
            'Practice crop rotation with 2-3 year intervals'
        ]
    };
    
    const key = `${plantType}-${disease.replace(/ /g, '_')}`;
    return recommendations[key] || [
        'Consult with a local agricultural expert',
        'Remove affected plant parts',
        'Improve plant care and growing conditions',
        'Monitor for disease progression'
    ];
}

function resetDetection() {
    selectedFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    predictBtn.disabled = true;
}

// Make resetDetection globally available
window.resetDetection = resetDetection;

// Navigation Management
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

function navigateToPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    const targetLink = document.querySelector(`[data-page="${pageId}"]`);
    
    if (targetPage) targetPage.classList.add('active');
    if (targetLink) targetLink.classList.add('active');
    
    // Update URL hash
    history.pushState(null, null, `#${pageId}`);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
    }
    
    // Initialize statistics charts if navigating to statistics page
    if (pageId === 'statistics') {
        setTimeout(initializeStatisticsCharts, 100);
    }
}

// Make navigateToPage globally available
window.navigateToPage = navigateToPage;

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        navigateToPage(pageId);
    });
});

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Counter Animation for Hero Stats
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

const statNumbers = document.querySelectorAll('.stat-number[data-target]');
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

statNumbers.forEach(stat => observer.observe(stat));

// Initialize Statistics Page Charts
function initializeStatisticsCharts() {
    // Disease Distribution Chart
    const diseaseDistCtx = document.getElementById('diseaseDistChart');
    if (diseaseDistCtx) {
        const diseaseChart = new Chart(diseaseDistCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Corn - Common Rust', 'Potato - Early Blight', 'Tomato - Bacterial Spot'],
                datasets: [{
                    data: [3247, 3500, 3500],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(255, 107, 107, 0.8)'
                    ],
                    borderColor: '#fff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 13 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000
                }
            }
        });
    }

    // Monthly Trends Chart
    const trendsCtx = document.getElementById('trendsChart');
    if (trendsCtx) {
        const trendsChart = new Chart(trendsCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Total Analyses',
                    data: [450, 520, 680, 750, 820, 950, 1100, 1050, 980, 890, 1020, 1087],
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }, {
                    label: 'Accuracy Rate',
                    data: [92, 93, 94, 94, 95, 95, 96, 96, 95, 96, 96, 95.8],
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: { size: 13 },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += context.datasetIndex === 1 
                                        ? context.parsed.y.toFixed(1) + '%'
                                        : context.parsed.y;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Number of Analyses',
                            font: { size: 13 }
                        },
                        ticks: {
                            callback: (value) => value
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Accuracy Rate (%)',
                            font: { size: 13 }
                        },
                        min: 90,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
}

// Initialize charts when statistics page is viewed
const statisticsPage = document.getElementById('statistics');
if (statisticsPage) {
    const pageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('active')) {
                initializeStatisticsCharts();
                pageObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    pageObserver.observe(statisticsPage);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const targetId = href.substring(1);
            navigateToPage(targetId);
        }
    });
});

// Add scroll effect to navbar
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)';
    }
    
    lastScroll = currentScroll;
});

// Loading animation for page transitions
function showPageLoader() {
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
    
    setTimeout(() => {
        loader.remove();
    }, 500);
}

// Add fade-in animation to elements on scroll
const fadeElements = document.querySelectorAll('.feature-card, .plant-card, .timeline-item');
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
            fadeObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1
});

fadeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeObserver.observe(el);
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1) || 'home';
    navigateToPage(hash);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial page based on hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        navigateToPage(hash);
    }
    
    // Initialize statistics charts if on that page
    if (document.getElementById('statistics') && document.getElementById('statistics').classList.contains('active')) {
        setTimeout(initializeStatisticsCharts, 100);
    }
});

console.log('PlantCare AI initialized successfully! 🌱');
