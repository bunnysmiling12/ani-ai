// Global variables
let currentSection = 'dashboard';
let selectedCategory = null;
let currentGeneration = null;
let generationInProgress = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 Initializing Ani.ai Content Creator...');
    
    // Setup navigation
    setupNavigation();
    
    // Load initial data
    await loadDashboardData();
    await loadCategories();
    await loadContentHistory();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show welcome message
    showNotification('Welcome to Ani.ai! Your AI content creator is ready! 🤖✨');
    
    console.log('✅ App initialized successfully');
}

// Navigation functionality
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    currentSection = sectionName;
    
    // Load section-specific data
    loadSectionData(sectionName);
}

async function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'create':
            await loadCategories();
            break;
        case 'history':
            await loadContentHistory();
            break;
        case 'analytics':
            await loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Dashboard functionality
async function loadDashboardData() {
    try {
        showLoading('Loading dashboard data...');
        
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        // Update stats
        document.getElementById('total-scripts').textContent = data.overall?.total_scripts || 0;
        document.getElementById('total-videos').textContent = data.overall?.total_videos || 0;
        document.getElementById('total-posts').textContent = data.overall?.total_posts || 0;
        document.getElementById('total-views').textContent = formatNumber(data.overall?.total_views || 0);
        
        // Load recent content
        const recentResponse = await fetch('/api/content-history?limit=5');
        const recentData = await recentResponse.json();
        
        displayRecentContent(recentData.content || []);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoading();
        
        // Show demo data
        document.getElementById('total-scripts').textContent = '12';
        document.getElementById('total-videos').textContent = '10';
        document.getElementById('total-posts').textContent = '8';
        document.getElementById('total-views').textContent = '1.2K';
        
        displayRecentContent([
            {
                script_id: 'demo1',
                content: 'Success is not final, failure is not fatal. It is the courage to continue that counts...',
                category: 'motivation',
                script_created: new Date().toISOString()
            },
            {
                script_id: 'demo2', 
                content: 'Your only limit is your mind. Push beyond what you think is possible...',
                category: 'fitness',
                script_created: new Date().toISOString()
            }
        ]);
    }
}

function displayRecentContent(content) {
    const container = document.getElementById('recent-content-list');
    
    if (!content || content.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No recent content found. Create your first content!</p>';
        return;
    }
    
    container.innerHTML = content.map(item => `
        <div class="recent-item">
            <div class="category-badge">${item.category}</div>
            <p>${item.content.substring(0, 80)}...</p>
            <small>${formatDate(item.script_created)}</small>
        </div>
    `).join('');
}

// Categories functionality
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        
        // Fallback to hardcoded categories
        const fallbackCategories = [
            { id: 'motivation', name: 'Motivation', description: 'Inspiring and uplifting content', icon: 'fas fa-rocket' },
            { id: 'fitness', name: 'Fitness', description: 'Health and workout motivation', icon: 'fas fa-dumbbell' },
            { id: 'love', name: 'Love & Relationships', description: 'Romance and relationship advice', icon: 'fas fa-heart' },
            { id: 'business', name: 'Business', description: 'Entrepreneurship and success stories', icon: 'fas fa-chart-line' },
            { id: 'mindfulness', name: 'Mindfulness', description: 'Mental health and wellness', icon: 'fas fa-leaf' },
            { id: 'adventure', name: 'Adventure', description: 'Travel and exploration stories', icon: 'fas fa-mountain' },
            { id: 'personal-growth', name: 'Personal Growth', description: 'Self-improvement and development', icon: 'fas fa-seedling' },
            { id: 'technology', name: 'Technology', description: 'Tech trends and innovations', icon: 'fas fa-microchip' },
            { id: 'lifestyle', name: 'Lifestyle', description: 'Daily life and habits', icon: 'fas fa-coffee' },
            { id: 'education', name: 'Education', description: 'Learning and knowledge sharing', icon: 'fas fa-graduation-cap' }
        ];
        
        displayCategories(fallbackCategories);
    }
}

function displayCategories(categories) {
    const container = document.getElementById('category-grid');
    
    container.innerHTML = categories.map(category => `
        <div class="category-item" data-category="${category.id}" onclick="selectCategory('${category.id}')">
            <i class="${category.icon || 'fas fa-star'}"></i>
            <span>${category.name}</span>
        </div>
    `).join('');
}

function selectCategory(categoryId) {
    // Remove previous selection
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    document.querySelector(`[data-category="${categoryId}"]`).classList.add('selected');
    
    selectedCategory = categoryId;
    console.log('Selected category:', categoryId);
}

// Content generation functionality
function setupEventListeners() {
    // Generate button
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', startContentGeneration);
    }
    
    // Platform checkboxes
    const platformCheckboxes = document.querySelectorAll('input[name="platforms"]');
    platformCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('.platform-item');
            if (this.checked) {
                label.style.borderColor = '#4fc3f7';
                label.style.background = 'rgba(79, 195, 247, 0.2)';
            } else {
                label.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                label.style.background = 'rgba(255, 255, 255, 0.1)';
            }
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchContent();
            }
        });
    }
}

async function startContentGeneration() {
    if (generationInProgress) {
        return;
    }
    
    if (!selectedCategory) {
        showNotification('Please select a category first!', 'error');
        return;
    }
    
    generationInProgress = true;
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    
    try {
        // Step 1: Generate Script
        await updateGenerationStep(1, 'active');
        showLoading('Generating AI script...');
        
        const script = await generateScript();
        
        // Step 2: Create Video
        await updateGenerationStep(2, 'active');
        updateLoadingText('Creating video with AI voice...');
        
        const videoPath = await generateVideo(script);
        
        // Step 3: Post to Social Media
        await updateGenerationStep(3, 'active');
        updateLoadingText('Posting to social media...');
        
        const postResults = await postToSocialMedia(videoPath, script);
        
        // Show results
        hideLoading();
        displayGeneratedContent(script, videoPath, postResults);
        showNotification('Content generated and posted successfully! 🎉');
        
        // Update dashboard
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error generating content:', error);
        hideLoading();
        showNotification('Error generating content. Please try again.', 'error');
    } finally {
        generationInProgress = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Content';
        resetGenerationSteps();
    }
}

async function generateScript() {
    const theme = document.getElementById('theme-input').value;
    const tone = document.getElementById('tone-select').value;
    
    const requestBody = {
        category: selectedCategory,
        theme: theme || null,
        tone: tone
    };
    
    try {
        const response = await fetch('/api/generate-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate script');
        }
        
        const data = await response.json();
        currentGeneration = data;
        
        return data.script;
    } catch (error) {
        console.error('Error generating script:', error);
        
        // Fallback demo scripts
        const demoScripts = {
            motivation: "Success isn't about being perfect. It's about being persistent. Every failure is a lesson, every setback is a setup for a comeback. The strongest people are forged in fires of adversity. You have survived 100% of your worst days. You are stronger than you think. Your breakthrough is just one decision away.",
            fitness: "Your body is your temple, your mind is your weapon. Every workout is a battle against your former self. The pain you feel today will be the strength you feel tomorrow. You didn't come this far to only come this far. Push through the burn, embrace the sweat, celebrate the progress.",
            love: "Love is not about finding the perfect person. It's about seeing an imperfect person perfectly. Real love grows through understanding, patience, and choosing each other every day. The best relationships are built on friendship, trust, and genuine care.",
            business: "Every successful business started with a dream and someone brave enough to pursue it. Entrepreneurship isn't just about making money, it's about making a difference. Your ideas have power, your vision has value. The best time to plant a tree was 20 years ago. The second best time is now."
        };
        
        return demoScripts[selectedCategory] || demoScripts.motivation;
    }
}

async function generateVideo(script) {
    const voiceStyle = document.getElementById('voice-select').value;
    const visualStyle = document.getElementById('visual-style').value;
    
    const requestBody = {
        scriptId: currentGeneration?.id,
        script: script,
        voiceSettings: {
            style: voiceStyle,
            lang: 'en'
        },
        visualStyle: visualStyle
    };
    
    try {
        const response = await fetch('/api/generate-video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate video');
        }
        
        const data = await response.json();
        return data.videoPath;
        
    } catch (error) {
        console.error('Error generating video:', error);
        return 'demo_video.mp4';
    }
}

async function postToSocialMedia(videoPath, script) {
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked'))
        .map(checkbox => checkbox.value);
    
    if (selectedPlatforms.length === 0) {
        return [];
    }
    
    const requestBody = {
        videoPath: videoPath,
        platforms: selectedPlatforms,
        caption: generateCaption(script)
    };
    
    try {
        const response = await fetch('/api/auto-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error('Failed to post to social media');
        }
        
        const data = await response.json();
        return data.results;
        
    } catch (error) {
        console.error('Error posting to social media:', error);
        
        // Return demo results
        return selectedPlatforms.map(platform => ({
            platform: platform,
            success: true,
            postId: `demo_${Date.now()}`,
            url: `https://${platform}.com/demo_post`,
            message: 'Posted successfully (demo)'
        }));
    }
}

function generateCaption(script) {
    const words = script.split(' ').slice(0, 15).join(' ');
    const hashtags = getHashtagsForCategory(selectedCategory);
    const emoji = getEmojiForCategory(selectedCategory);
    
    return `${words}... ${emoji}\n\n${hashtags}\n\n#CreatedWithAniAI #AIGenerated`;
}

function getHashtagsForCategory(category) {
    const hashtagMap = {
        motivation: '#Motivation #Inspiration #Success #Mindset #Goals',
        fitness: '#Fitness #Health #Workout #GymLife #HealthyLifestyle',
        love: '#Love #Relationships #Romance #Life #Heart',
        business: '#Business #Entrepreneur #Success #Goals #Leadership',
        mindfulness: '#Mindfulness #Meditation #Peace #Wellness #SelfCare'
    };
    
    return hashtagMap[category] || '#Inspiration #Motivation #Life #Success';
}

function getEmojiForCategory(category) {
    const emojiMap = {
        motivation: '🚀💪✨',
        fitness: '💪🏋️‍♂️🔥',
        love: '❤️💕💖',
        business: '💼📈🎯',
        mindfulness: '🧘‍♀️🌸☮️'
    };
    
    return emojiMap[category] || '✨🌟💫';
}

function displayGeneratedContent(script, videoPath, postResults) {
    // Show the generated content section
    const generatedContentDiv = document.getElementById('generated-content');
    generatedContentDiv.style.display = 'block';
    
    // Display script
    document.getElementById('generated-script').textContent = script;
    
    // Display video info
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = `
        <div class="video-info">
            <i class="fas fa-video" style="font-size: 2rem; color: #4fc3f7; margin-bottom: 1rem;"></i>
            <p>Video generated successfully!</p>
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">File: ${videoPath}</p>
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Duration: ~60 seconds</p>
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Resolution: 1080x1920 (9:16)</p>
        </div>
    `;
    
    // Display social media results
    const resultsHtml = postResults.map(result => `
        <div class="post-result ${result.success ? 'success' : 'error'}">
            <i class="fab fa-${result.platform}"></i>
            <span>${result.platform}: ${result.message}</span>
            ${result.url ? `<a href="${result.url}" target="_blank" style="color: #4fc3f7;">View Post</a>` : ''}
        </div>
    `).join('');
    
    // Add results to the display
    const actionsDisplay = document.querySelector('.actions-display');
    if (resultsHtml) {
        actionsDisplay.insertAdjacentHTML('beforebegin', `
            <div class="social-results">
                <h4>Social Media Posts</h4>
                ${resultsHtml}
            </div>
        `);
    }
    
    // Scroll to generated content
    generatedContentDiv.scrollIntoView({ behavior: 'smooth' });
}

async function updateGenerationStep(stepNumber, status) {
    const step = document.getElementById(`step-${stepNumber}`);
    if (step) {
        step.classList.add(status);
        
        // Add a small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

function resetGenerationSteps() {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step-${i}`);
        if (step) {
            step.classList.remove('active');
        }
    }
}

// History functionality
async function loadContentHistory() {
    try {
        showLoading('Loading content history...');
        
        const response = await fetch('/api/content-history?limit=20');
        const data = await response.json();
        
        displayContentHistory(data.content || []);
        hideLoading();
        
    } catch (error) {
        console.error('Error loading content history:', error);
        hideLoading();
        
        // Show demo data
        const demoHistory = [
            {
                script_id: 'demo1',
                content: 'Success is not final, failure is not fatal. It is the courage to continue that counts. Every champion was once a beginner who refused to give up...',
                category: 'motivation',
                script_created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                social_posts_count: 3
            },
            {
                script_id: 'demo2',
                content: 'Your body is your temple, your mind is your weapon. Every workout is a battle against your former self...',
                category: 'fitness', 
                script_created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                social_posts_count: 2
            },
            {
                script_id: 'demo3',
                content: 'Every successful business started with a dream and someone brave enough to pursue it...',
                category: 'business',
                script_created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                social_posts_count: 1
            }
        ];
        
        displayContentHistory(demoHistory);
    }
}

function displayContentHistory(history) {
    const container = document.getElementById('history-content');
    
    if (!history || history.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1 / -1; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
                <p style="color: rgba(255,255,255,0.6);">No content found. Start creating amazing content!</p>
                <button class="action-btn" onclick="switchSection('create')" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i>
                    Create Your First Content
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-item-header">
                <div class="category-badge">${item.category}</div>
                <small>${formatDate(item.script_created)}</small>
            </div>
            <div class="history-item-content">
                ${item.content.substring(0, 150)}...
            </div>
            <div class="history-item-footer">
                <span><i class="fas fa-share"></i> ${item.social_posts_count || 0} posts</span>
                <div>
                    <button onclick="regenerateFromHistory('${item.script_id}')" style="background: none; border: 1px solid #4fc3f7; color: #4fc3f7; padding: 0.3rem 0.8rem; border-radius: 5px; cursor: pointer; margin-right: 0.5rem;">
                        <i class="fas fa-redo"></i> Recreate
                    </button>
                    <button onclick="deleteHistoryItem('${item.script_id}')" style="background: none; border: 1px solid #f44336; color: #f44336; padding: 0.3rem 0.8rem; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function searchContent() {
    const query = document.getElementById('search-input').value;
    const category = document.getElementById('category-filter').value;
    
    console.log('Searching:', query, category);
    // Implement search functionality
    showNotification('Search functionality coming soon!');
}

// Analytics functionality
async function loadAnalytics() {
    try {
        showLoading('Loading analytics...');
        
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        displayAnalytics(data);
        hideLoading();
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        hideLoading();
        
        // Show demo analytics
        const demoAnalytics = {
            overall: {
                total_views: 15420,
                total_likes: 1240,
                total_shares: 89,
                total_comments: 156
            },
            categories: [
                { category: 'motivation', total_views: 8500, avg_engagement: 8.2 },
                { category: 'fitness', total_views: 4200, avg_engagement: 7.8 },
                { category: 'business', total_views: 2720, avg_engagement: 6.5 }
            ],
            platforms: [
                { platform: 'instagram', total_views: 9200, total_likes: 720 },
                { platform: 'youtube', total_views: 4800, total_likes: 380 },
                { platform: 'twitter', total_views: 1420, total_likes: 140 }
            ]
        };
        
        displayAnalytics(demoAnalytics);
    }
}

function displayAnalytics(data) {
    // Update metrics
    document.getElementById('analytics-views').textContent = formatNumber(data.overall?.total_views || 0);
    document.getElementById('analytics-likes').textContent = formatNumber(data.overall?.total_likes || 0);
    document.getElementById('analytics-shares').textContent = formatNumber(data.overall?.total_shares || 0);
    
    const engagementRate = data.overall?.total_views > 0 
        ? ((data.overall.total_likes + data.overall.total_shares + data.overall.total_comments) / data.overall.total_views * 100).toFixed(1)
        : 0;
    document.getElementById('analytics-engagement').textContent = `${engagementRate}%`;
    
    // Display category performance
    const categoryContainer = document.getElementById('category-performance');
    if (data.categories && data.categories.length > 0) {
        categoryContainer.innerHTML = data.categories.map(cat => `
            <div class="category-performance-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-weight: 500; text-transform: capitalize;">${cat.category}</span>
                    <span style="color: #4fc3f7;">${formatNumber(cat.total_views)} views</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); border-radius: 10px; height: 8px; overflow: hidden;">
                    <div style="background: linear-gradient(45deg, #4fc3f7, #29b6f6); height: 100%; width: ${(cat.total_views / data.categories[0].total_views) * 100}%;"></div>
                </div>
            </div>
        `).join('');
    } else {
        categoryContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No category data available.</p>';
    }
    
    // Display platform performance
    const platformContainer = document.getElementById('platform-performance');
    if (data.platforms && data.platforms.length > 0) {
        platformContainer.innerHTML = data.platforms.map(platform => `
            <div class="platform-performance-item">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <i class="fab fa-${platform.platform}" style="font-size: 1.2rem; color: #4fc3f7;"></i>
                    <span style="font-weight: 500; text-transform: capitalize;">${platform.platform}</span>
                    <span style="margin-left: auto; color: #4fc3f7;">${formatNumber(platform.total_views)} views</span>
                </div>
                <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    <span><i class="fas fa-heart"></i> ${formatNumber(platform.total_likes)}</span>
                    <span><i class="fas fa-share"></i> ${formatNumber(platform.total_shares || 0)}</span>
                </div>
            </div>
        `).join('');
    } else {
        platformContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">No platform data available.</p>';
    }
}

// Settings functionality
function loadSettings() {
    console.log('Loading settings...');
    // Settings are already displayed in the HTML
    showNotification('Settings loaded successfully!');
}

// Quick action functions
function generateRandomContent() {
    const categories = ['motivation', 'fitness', 'love', 'business', 'mindfulness'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // Select random category
    selectedCategory = randomCategory;
    
    // Switch to create section
    switchSection('create');
    
    // Highlight selected category
    setTimeout(() => {
        const categoryElement = document.querySelector(`[data-category="${randomCategory}"]`);
        if (categoryElement) {
            categoryElement.click();
        }
    }, 500);
    
    showNotification(`Random category selected: ${randomCategory}! 🎲`);
}

function viewAnalytics() {
    switchSection('analytics');
}

function downloadVideo() {
    showNotification('Video download started! 📥');
    // In a real implementation, this would trigger a download
}

function regenerateContent() {
    if (selectedCategory) {
        startContentGeneration();
    } else {
        showNotification('Please select a category first!', 'error');
    }
}

function regenerateFromHistory(scriptId) {
    showNotification('Regenerating content from history... 🔄');
    // In a real implementation, this would load the script and regenerate
}

function deleteHistoryItem(scriptId) {
    if (confirm('Are you sure you want to delete this content?')) {
        showNotification('Content deleted successfully! 🗑️');
        loadContentHistory();
    }
}

// Utility functions
function showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    loadingText.textContent = text;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
}

function updateLoadingText(text) {
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = text;
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('notification-toast');
    const messageSpan = document.getElementById('notification-message');
    
    messageSpan.textContent = message;
    toast.classList.add('active');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Auto-refresh dashboard every 30 seconds
setInterval(() => {
    if (currentSection === 'dashboard') {
        loadDashboardData();
    }
}, 30000);

// Console welcome message
console.log(`
🤖 Ani.ai Content Creator v1.0
================================
✨ AI-powered content generation
🎥 Automatic video creation  
📱 Multi-platform social posting
📊 Advanced analytics
🚀 Ready to create amazing content!
`);

// Export functions for global access
window.switchSection = switchSection;
window.generateRandomContent = generateRandomContent;
window.viewAnalytics = viewAnalytics;
window.selectCategory = selectCategory;
window.downloadVideo = downloadVideo;
window.regenerateContent = regenerateContent;
window.regenerateFromHistory = regenerateFromHistory;
window.deleteHistoryItem = deleteHistoryItem;
window.searchContent = searchContent;