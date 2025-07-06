const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cron = require('node-cron');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import custom modules
const ContentGenerator = require('./services/contentGenerator');
const VideoGenerator = require('./services/videoGenerator');
const SocialMediaManager = require('./services/socialMediaManager');
const Database = require('./services/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('.'));

// Initialize services
const contentGenerator = new ContentGenerator();
const videoGenerator = new VideoGenerator();
const socialMediaManager = new SocialMediaManager();
const database = new Database();

// Routes

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate story script
app.post('/api/generate-script', async (req, res) => {
  try {
    const { category, theme, tone } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    logger.info(`Generating script for category: ${category}, theme: ${theme}, tone: ${tone}`);
    
    const script = await contentGenerator.generateScript(category, theme, tone);
    
    // Save to database
    const scriptId = await database.saveScript(script, category, theme, tone);
    
    res.json({
      id: scriptId,
      script: script,
      category: category,
      theme: theme,
      tone: tone,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error generating script:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

// Generate video from script
app.post('/api/generate-video', async (req, res) => {
  try {
    const { scriptId, script, voiceSettings, visualStyle } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }

    logger.info(`Generating video for script ID: ${scriptId}`);
    
    const videoPath = await videoGenerator.createVideo(script, voiceSettings, visualStyle);
    
    // Save video info to database
    await database.saveVideo(scriptId, videoPath, voiceSettings, visualStyle);
    
    res.json({
      videoPath: videoPath,
      message: 'Video generated successfully'
    });
    
  } catch (error) {
    logger.error('Error generating video:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

// Get all categories
app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 'motivation', name: 'Motivation', description: 'Inspiring and uplifting content' },
    { id: 'fitness', name: 'Fitness', description: 'Health and workout motivation' },
    { id: 'love', name: 'Love & Relationships', description: 'Romance and relationship advice' },
    { id: 'business', name: 'Business', description: 'Entrepreneurship and success stories' },
    { id: 'mindfulness', name: 'Mindfulness', description: 'Mental health and wellness' },
    { id: 'adventure', name: 'Adventure', description: 'Travel and exploration stories' },
    { id: 'personal-growth', name: 'Personal Growth', description: 'Self-improvement and development' },
    { id: 'technology', name: 'Technology', description: 'Tech trends and innovations' },
    { id: 'lifestyle', name: 'Lifestyle', description: 'Daily life and habits' },
    { id: 'education', name: 'Education', description: 'Learning and knowledge sharing' }
  ];
  
  res.json(categories);
});

// Auto-post to social media
app.post('/api/auto-post', async (req, res) => {
  try {
    const { videoPath, platforms, caption, scheduledTime } = req.body;
    
    if (!videoPath || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'Video path and platforms are required' });
    }

    logger.info(`Auto-posting to platforms: ${platforms.join(', ')}`);
    
    const results = await socialMediaManager.postToMultiplePlatforms(
      videoPath,
      platforms,
      caption,
      scheduledTime
    );
    
    res.json({
      success: true,
      results: results,
      message: 'Content posted successfully'
    });
    
  } catch (error) {
    logger.error('Error auto-posting:', error);
    res.status(500).json({ error: 'Failed to post content' });
  }
});

// Get user's content history
app.get('/api/content-history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const history = await database.getContentHistory(page, limit);
    
    res.json(history);
    
  } catch (error) {
    logger.error('Error fetching content history:', error);
    res.status(500).json({ error: 'Failed to fetch content history' });
  }
});

// Get analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await database.getAnalytics();
    
    res.json(analytics);
    
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Download video
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'generated_videos', filename);
  
  res.download(filePath, (err) => {
    if (err) {
      logger.error('Error downloading file:', err);
      res.status(404).json({ error: 'File not found' });
    }
  });
});

// Configure social media accounts
app.post('/api/configure-social', async (req, res) => {
  try {
    const { platform, credentials } = req.body;
    
    await socialMediaManager.configurePlatform(platform, credentials);
    
    res.json({ success: true, message: 'Platform configured successfully' });
    
  } catch (error) {
    logger.error('Error configuring social media:', error);
    res.status(500).json({ error: 'Failed to configure platform' });
  }
});

// Schedule automated content generation
cron.schedule('0 */6 * * *', async () => {
  logger.info('Running automated content generation...');
  
  try {
    // Get random category
    const categories = ['motivation', 'fitness', 'business', 'mindfulness', 'personal-growth'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    // Generate script
    const script = await contentGenerator.generateScript(randomCategory);
    const scriptId = await database.saveScript(script, randomCategory);
    
    // Generate video
    const videoPath = await videoGenerator.createVideo(script);
    await database.saveVideo(scriptId, videoPath);
    
    // Auto-post to configured platforms
    await socialMediaManager.autoPost(videoPath, script);
    
    logger.info('Automated content generation completed');
    
  } catch (error) {
    logger.error('Error in automated content generation:', error);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
database.initialize().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Ani.ai Content Creator server running on port ${PORT}`);
    logger.info(`🌐 Access your application at: http://localhost:${PORT}`);
  });
}).catch(error => {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = app;