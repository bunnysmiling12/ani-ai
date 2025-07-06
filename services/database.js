const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '..', 'ani_ai.db');
    this.db = null;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }

  async initialize() {
    try {
      this.db = new sqlite3.Database(this.dbPath);
      await this.createTables();
      this.logger.info('Database initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing database:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      // Scripts table
      `CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        theme TEXT,
        tone TEXT,
        word_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Videos table
      `CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        script_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        duration INTEGER,
        format TEXT DEFAULT 'mp4',
        resolution TEXT DEFAULT '1080x1920',
        voice_settings TEXT,
        visual_style TEXT,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (script_id) REFERENCES scripts (id)
      )`,
      
      // Social media posts table
      `CREATE TABLE IF NOT EXISTS social_posts (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        post_id TEXT,
        url TEXT,
        caption TEXT,
        status TEXT DEFAULT 'pending',
        posted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos (id)
      )`,
      
      // Analytics table
      `CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        engagement_rate REAL DEFAULT 0,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES social_posts (id)
      )`,
      
      // Content performance table
      `CREATE TABLE IF NOT EXISTS content_performance (
        id TEXT PRIMARY KEY,
        script_id TEXT NOT NULL,
        category TEXT NOT NULL,
        total_views INTEGER DEFAULT 0,
        total_likes INTEGER DEFAULT 0,
        total_shares INTEGER DEFAULT 0,
        total_comments INTEGER DEFAULT 0,
        average_engagement REAL DEFAULT 0,
        performance_score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (script_id) REFERENCES scripts (id)
      )`,
      
      // User preferences table
      `CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY,
        preference_key TEXT NOT NULL,
        preference_value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.runQuery(table);
    }

    this.logger.info('Database tables created successfully');
  }

  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async saveScript(content, category, theme = null, tone = 'inspirational') {
    try {
      const id = uuidv4();
      const wordCount = content.split(' ').length;
      
      await this.runQuery(
        `INSERT INTO scripts (id, content, category, theme, tone, word_count) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, content, category, theme, tone, wordCount]
      );
      
      this.logger.info(`Script saved: ${id}`);
      return id;
      
    } catch (error) {
      this.logger.error('Error saving script:', error);
      throw error;
    }
  }

  async saveVideo(scriptId, filePath, voiceSettings = null, visualStyle = null) {
    try {
      const id = uuidv4();
      const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
      const fileSize = stats ? stats.size : 0;
      
      await this.runQuery(
        `INSERT INTO videos (id, script_id, file_path, voice_settings, visual_style, file_size) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id, 
          scriptId, 
          filePath, 
          JSON.stringify(voiceSettings), 
          visualStyle, 
          fileSize
        ]
      );
      
      this.logger.info(`Video saved: ${id}`);
      return id;
      
    } catch (error) {
      this.logger.error('Error saving video:', error);
      throw error;
    }
  }

  async saveSocialPost(videoId, platform, postId, url, caption, status = 'posted') {
    try {
      const id = uuidv4();
      
      await this.runQuery(
        `INSERT INTO social_posts (id, video_id, platform, post_id, url, caption, status, posted_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [id, videoId, platform, postId, url, caption, status]
      );
      
      this.logger.info(`Social post saved: ${id} on ${platform}`);
      return id;
      
    } catch (error) {
      this.logger.error('Error saving social post:', error);
      throw error;
    }
  }

  async getContentHistory(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT 
          s.id as script_id,
          s.content,
          s.category,
          s.theme,
          s.tone,
          s.created_at as script_created,
          v.id as video_id,
          v.file_path,
          v.duration,
          v.created_at as video_created,
          COUNT(sp.id) as social_posts_count
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        LEFT JOIN social_posts sp ON v.id = sp.video_id
        GROUP BY s.id, v.id
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const content = await this.allQuery(query, [limit, offset]);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM scripts`;
      const countResult = await this.getQuery(countQuery);
      
      return {
        content: content,
        pagination: {
          page: page,
          limit: limit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      };
      
    } catch (error) {
      this.logger.error('Error getting content history:', error);
      throw error;
    }
  }

  async getAnalytics() {
    try {
      // Get overall stats
      const overallStats = await this.getQuery(`
        SELECT 
          COUNT(DISTINCT s.id) as total_scripts,
          COUNT(DISTINCT v.id) as total_videos,
          COUNT(DISTINCT sp.id) as total_posts,
          SUM(COALESCE(a.views, 0)) as total_views,
          SUM(COALESCE(a.likes, 0)) as total_likes,
          SUM(COALESCE(a.shares, 0)) as total_shares,
          SUM(COALESCE(a.comments, 0)) as total_comments
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        LEFT JOIN social_posts sp ON v.id = sp.video_id
        LEFT JOIN analytics a ON sp.id = a.post_id
      `);
      
      // Get category performance
      const categoryStats = await this.allQuery(`
        SELECT 
          s.category,
          COUNT(DISTINCT s.id) as script_count,
          COUNT(DISTINCT v.id) as video_count,
          COUNT(DISTINCT sp.id) as post_count,
          SUM(COALESCE(a.views, 0)) as total_views,
          AVG(COALESCE(a.engagement_rate, 0)) as avg_engagement
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        LEFT JOIN social_posts sp ON v.id = sp.video_id
        LEFT JOIN analytics a ON sp.id = a.post_id
        GROUP BY s.category
        ORDER BY total_views DESC
      `);
      
      // Get platform performance
      const platformStats = await this.allQuery(`
        SELECT 
          sp.platform,
          COUNT(sp.id) as post_count,
          SUM(COALESCE(a.views, 0)) as total_views,
          SUM(COALESCE(a.likes, 0)) as total_likes,
          AVG(COALESCE(a.engagement_rate, 0)) as avg_engagement
        FROM social_posts sp
        LEFT JOIN analytics a ON sp.id = a.post_id
        GROUP BY sp.platform
        ORDER BY total_views DESC
      `);
      
      // Get recent activity
      const recentActivity = await this.allQuery(`
        SELECT 
          s.category,
          v.created_at,
          sp.platform,
          sp.status,
          a.views,
          a.likes
        FROM scripts s
        JOIN videos v ON s.id = v.script_id
        LEFT JOIN social_posts sp ON v.id = sp.video_id
        LEFT JOIN analytics a ON sp.id = a.post_id
        ORDER BY v.created_at DESC
        LIMIT 20
      `);
      
      return {
        overall: overallStats,
        categories: categoryStats,
        platforms: platformStats,
        recent: recentActivity,
        generated_at: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  async updateAnalytics(postId, platform, metrics) {
    try {
      const id = uuidv4();
      
      await this.runQuery(
        `INSERT INTO analytics (id, post_id, platform, views, likes, shares, comments, engagement_rate) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          postId,
          platform,
          metrics.views || 0,
          metrics.likes || 0,
          metrics.shares || 0,
          metrics.comments || 0,
          metrics.engagement_rate || 0
        ]
      );
      
      this.logger.info(`Analytics updated for post: ${postId}`);
      return id;
      
    } catch (error) {
      this.logger.error('Error updating analytics:', error);
      throw error;
    }
  }

  async getTopPerformingContent(limit = 10) {
    try {
      const query = `
        SELECT 
          s.id,
          s.content,
          s.category,
          s.created_at,
          SUM(COALESCE(a.views, 0)) as total_views,
          SUM(COALESCE(a.likes, 0)) as total_likes,
          AVG(COALESCE(a.engagement_rate, 0)) as avg_engagement
        FROM scripts s
        JOIN videos v ON s.id = v.script_id
        JOIN social_posts sp ON v.id = sp.video_id
        LEFT JOIN analytics a ON sp.id = a.post_id
        GROUP BY s.id
        ORDER BY total_views DESC, total_likes DESC
        LIMIT ?
      `;
      
      return await this.allQuery(query, [limit]);
      
    } catch (error) {
      this.logger.error('Error getting top performing content:', error);
      throw error;
    }
  }

  async searchContent(query, category = null) {
    try {
      let sql = `
        SELECT 
          s.id,
          s.content,
          s.category,
          s.theme,
          s.tone,
          s.created_at,
          v.file_path
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        WHERE s.content LIKE ?
      `;
      
      const params = [`%${query}%`];
      
      if (category) {
        sql += ` AND s.category = ?`;
        params.push(category);
      }
      
      sql += ` ORDER BY s.created_at DESC`;
      
      return await this.allQuery(sql, params);
      
    } catch (error) {
      this.logger.error('Error searching content:', error);
      throw error;
    }
  }

  async getUserPreferences() {
    try {
      const preferences = await this.allQuery(`
        SELECT preference_key, preference_value 
        FROM user_preferences
      `);
      
      const result = {};
      preferences.forEach(pref => {
        result[pref.preference_key] = pref.preference_value;
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Error getting user preferences:', error);
      return {};
    }
  }

  async setUserPreference(key, value) {
    try {
      // Check if preference exists
      const existing = await this.getQuery(
        `SELECT id FROM user_preferences WHERE preference_key = ?`,
        [key]
      );
      
      if (existing) {
        // Update existing preference
        await this.runQuery(
          `UPDATE user_preferences 
           SET preference_value = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE preference_key = ?`,
          [value, key]
        );
      } else {
        // Insert new preference
        await this.runQuery(
          `INSERT INTO user_preferences (id, preference_key, preference_value) 
           VALUES (?, ?, ?)`,
          [uuidv4(), key, value]
        );
      }
      
      this.logger.info(`User preference updated: ${key} = ${value}`);
      
    } catch (error) {
      this.logger.error('Error setting user preference:', error);
      throw error;
    }
  }

  async getContentByCategory(category, limit = 20) {
    try {
      const query = `
        SELECT 
          s.id,
          s.content,
          s.category,
          s.theme,
          s.tone,
          s.created_at,
          v.file_path,
          COUNT(sp.id) as social_posts_count
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        LEFT JOIN social_posts sp ON v.id = sp.video_id
        WHERE s.category = ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ?
      `;
      
      return await this.allQuery(query, [category, limit]);
      
    } catch (error) {
      this.logger.error('Error getting content by category:', error);
      throw error;
    }
  }

  async getDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's stats
      const todayStats = await this.getQuery(`
        SELECT 
          COUNT(DISTINCT s.id) as scripts_today,
          COUNT(DISTINCT v.id) as videos_today,
          COUNT(DISTINCT sp.id) as posts_today
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        LEFT JOIN social_posts sp ON v.id = sp.video_id
        WHERE DATE(s.created_at) = ?
      `, [today]);
      
      // Get overall totals
      const totalStats = await this.getQuery(`
        SELECT 
          COUNT(DISTINCT s.id) as total_scripts,
          COUNT(DISTINCT v.id) as total_videos,
          COUNT(DISTINCT sp.id) as total_posts
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        LEFT JOIN social_posts sp ON v.id = sp.video_id
      `);
      
      // Get recent content
      const recentContent = await this.allQuery(`
        SELECT 
          s.id,
          s.content,
          s.category,
          s.created_at,
          v.file_path
        FROM scripts s
        LEFT JOIN videos v ON s.id = v.script_id
        ORDER BY s.created_at DESC
        LIMIT 5
      `);
      
      return {
        today: todayStats,
        totals: totalStats,
        recent: recentContent
      };
      
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.logger.info('Database connection closed');
    }
  }
}

module.exports = Database;