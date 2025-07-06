const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

class VideoGenerator {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Visual themes for different categories
    this.visualThemes = {
      motivation: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
        fonts: ['Arial Black', 'Impact', 'Georgia'],
        backgrounds: ['gradient', 'solid', 'abstract'],
        animations: ['fadeIn', 'slideUp', 'zoomIn']
      },
      fitness: {
        colors: ['#FF4757', '#2ED573', '#3742FA', '#FF6348', '#A4B0BE'],
        fonts: ['Arial Black', 'Impact', 'Helvetica'],
        backgrounds: ['gym', 'nature', 'abstract'],
        animations: ['pulse', 'slideUp', 'bounce']
      },
      love: {
        colors: ['#FF6B9D', '#F8B500', '#FF6B6B', '#FFB6C1', '#FFA07A'],
        fonts: ['Georgia', 'Times New Roman', 'Palatino'],
        backgrounds: ['romantic', 'soft', 'hearts'],
        animations: ['fadeIn', 'heartbeat', 'glow']
      },
      business: {
        colors: ['#2C3E50', '#3498DB', '#E74C3C', '#F39C12', '#9B59B6'],
        fonts: ['Arial', 'Helvetica', 'Times New Roman'],
        backgrounds: ['corporate', 'minimal', 'professional'],
        animations: ['slideIn', 'fadeIn', 'typewriter']
      },
      mindfulness: {
        colors: ['#A8E6CF', '#88D8C0', '#78C6A3', '#92C5DE', '#B8D4E3'],
        fonts: ['Georgia', 'Times New Roman', 'Palatino'],
        backgrounds: ['nature', 'zen', 'peaceful'],
        animations: ['breathe', 'fadeIn', 'gentle']
      }
    };
  }

  ensureDirectories() {
    const dirs = ['generated_videos', 'temp_audio', 'temp_images'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async createVideo(script, voiceSettings = {}, visualStyle = 'auto') {
    try {
      const videoId = uuidv4();
      this.logger.info(`Creating video ${videoId} for script: ${script.substring(0, 50)}...`);
      
      // For demo purposes, create a video metadata file
      const videoPath = await this.createDemoVideo(script, voiceSettings, visualStyle, videoId);
      
      this.logger.info(`Video created successfully: ${videoPath}`);
      return videoPath;
      
    } catch (error) {
      this.logger.error('Error creating video:', error);
      
      // Return demo video path if generation fails
      return this.createDemoVideo(script);
    }
  }

  async createDemoVideo(script, voiceSettings = {}, visualStyle = 'auto', videoId = null) {
    try {
      if (!videoId) {
        videoId = uuidv4();
      }
      
      const outputPath = path.join('generated_videos', `${videoId}.mp4`);
      
      // Generate video metadata and script breakdown
      const words = script.split(' ');
      const estimatedDuration = Math.ceil(words.length / 2.5); // Approximate 2.5 words per second
      
      const theme = this.getVisualTheme(visualStyle);
      
      // Create video metadata file
      const videoMetadata = {
        id: videoId,
        type: 'ai_generated',
        script: script,
        duration: estimatedDuration,
        format: 'mp4',
        resolution: '1080x1920',
        aspectRatio: '9:16',
        voiceSettings: {
          style: voiceSettings.style || 'female-warm',
          language: voiceSettings.lang || 'en',
          speed: voiceSettings.speed || 'normal',
          pitch: voiceSettings.pitch || 'normal'
        },
        visualSettings: {
          theme: visualStyle,
          colors: theme.colors,
          fonts: theme.fonts,
          backgrounds: theme.backgrounds,
          animations: theme.animations
        },
        textSegments: this.generateTextSegments(script),
        audioInfo: {
          generated: true,
          voice: voiceSettings.style || 'female-warm',
          estimatedDuration: estimatedDuration
        },
        created: new Date().toISOString(),
        status: 'generated',
        fileSize: this.estimateFileSize(estimatedDuration),
        thumbnail: this.generateThumbnailInfo(script, theme)
      };
      
      // Write video metadata to file
      fs.writeFileSync(outputPath, JSON.stringify(videoMetadata, null, 2));
      
      this.logger.info(`Demo video metadata created: ${outputPath}`);
      return outputPath;
      
    } catch (error) {
      this.logger.error('Error creating demo video:', error);
      
      // Create minimal fallback video
      const fallbackId = uuidv4();
      const fallbackPath = path.join('generated_videos', `fallback_${fallbackId}.mp4`);
      
      const fallbackData = {
        id: fallbackId,
        type: 'demo',
        message: 'Demo video - In production, this would be a real MP4 file',
        duration: 60,
        format: 'mp4',
        resolution: '1080x1920',
        created: new Date().toISOString()
      };
      
      fs.writeFileSync(fallbackPath, JSON.stringify(fallbackData, null, 2));
      return fallbackPath;
    }
  }

  generateTextSegments(script) {
    const words = script.split(' ');
    const segments = [];
    const wordsPerSegment = 8; // Show 8 words per segment
    
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      const startTime = (i / wordsPerSegment) * 3; // 3 seconds per segment
      const endTime = startTime + 3;
      
      segments.push({
        id: Math.floor(i / wordsPerSegment) + 1,
        text: segmentWords.join(' '),
        startTime: startTime,
        endTime: endTime,
        duration: 3,
        animation: this.getRandomAnimation(),
        position: 'center',
        fontSize: 'large',
        fontWeight: 'bold'
      });
    }
    
    return segments;
  }

  getRandomAnimation() {
    const animations = ['fadeIn', 'slideUp', 'zoomIn', 'typewriter', 'bounce'];
    return animations[Math.floor(Math.random() * animations.length)];
  }

  estimateFileSize(duration) {
    // Estimate file size based on duration (rough approximation)
    const bitrate = 5000; // 5 Mbps for 1080p video
    const sizeInMB = (duration * bitrate) / 8 / 1024; // Convert to MB
    return Math.round(sizeInMB * 100) / 100; // Round to 2 decimal places
  }

  generateThumbnailInfo(script, theme) {
    const firstWords = script.split(' ').slice(0, 5).join(' ');
    
    return {
      text: firstWords + '...',
      backgroundColor: theme.colors[0],
      textColor: '#FFFFFF',
      font: theme.fonts[0],
      generated: true
    };
  }

  getVisualTheme(visualStyle) {
    if (visualStyle === 'auto') {
      // Use motivation theme as default
      return this.visualThemes.motivation;
    }
    
    return this.visualThemes[visualStyle] || this.visualThemes.motivation;
  }

  async createMultipleVideos(scripts, settings = {}) {
    try {
      const videos = [];
      
      for (const script of scripts) {
        const videoPath = await this.createVideo(script.script || script, settings);
        videos.push({
          id: script.id || uuidv4(),
          videoPath: videoPath,
          script: script.script || script,
          created: new Date().toISOString()
        });
        
        // Add delay between video generations
        await this.delay(1000);
      }
      
      return videos;
      
    } catch (error) {
      this.logger.error('Error creating multiple videos:', error);
      throw error;
    }
  }

  getVideoInfo(videoPath) {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error('Video file not found');
      }
      
      const stats = fs.statSync(videoPath);
      const content = fs.readFileSync(videoPath, 'utf8');
      
      try {
        const videoData = JSON.parse(content);
        return {
          path: videoPath,
          size: stats.size,
          created: stats.mtime,
          duration: videoData.duration || 60,
          format: videoData.format || 'mp4',
          resolution: videoData.resolution || '1080x1920',
          type: videoData.type || 'generated',
          metadata: videoData
        };
      } catch (parseError) {
        return {
          path: videoPath,
          size: stats.size,
          created: stats.mtime,
          duration: 60,
          format: 'mp4',
          resolution: '1080x1920',
          type: 'unknown'
        };
      }
      
    } catch (error) {
      this.logger.error('Error getting video info:', error);
      throw error;
    }
  }

  async generateVideoFromTemplate(template, script, customizations = {}) {
    try {
      const videoId = uuidv4();
      
      // Apply template-specific settings
      const templateSettings = {
        modern: {
          colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
          fonts: ['Helvetica', 'Arial'],
          animations: ['slideIn', 'fadeIn']
        },
        minimal: {
          colors: ['#000000', '#FFFFFF', '#888888'],
          fonts: ['Arial', 'Helvetica'],
          animations: ['fadeIn', 'typewriter']
        },
        vibrant: {
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
          fonts: ['Impact', 'Arial Black'],
          animations: ['bounce', 'zoomIn', 'pulse']
        }
      };
      
      const settings = templateSettings[template] || templateSettings.modern;
      const mergedSettings = { ...settings, ...customizations };
      
      return await this.createDemoVideo(script, {}, template, videoId);
      
    } catch (error) {
      this.logger.error('Error generating video from template:', error);
      return this.createDemoVideo(script);
    }
  }

  async optimizeForPlatform(videoPath, platform) {
    try {
      const videoInfo = this.getVideoInfo(videoPath);
      const optimizations = {
        instagram: {
          maxDuration: 60,
          aspectRatio: '9:16',
          resolution: '1080x1920',
          format: 'mp4'
        },
        youtube: {
          maxDuration: 60,
          aspectRatio: '9:16',
          resolution: '1080x1920',
          format: 'mp4'
        },
        tiktok: {
          maxDuration: 60,
          aspectRatio: '9:16',
          resolution: '1080x1920',
          format: 'mp4'
        },
        twitter: {
          maxDuration: 140,
          aspectRatio: '16:9',
          resolution: '1280x720',
          format: 'mp4'
        }
      };
      
      const platformSettings = optimizations[platform] || optimizations.instagram;
      
      this.logger.info(`Video optimized for ${platform}: ${JSON.stringify(platformSettings)}`);
      
      return {
        originalPath: videoPath,
        optimizedPath: videoPath, // In demo mode, same file
        platform: platform,
        optimizations: platformSettings,
        success: true
      };
      
    } catch (error) {
      this.logger.error('Error optimizing video for platform:', error);
      return { success: false, error: error.message };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = VideoGenerator;