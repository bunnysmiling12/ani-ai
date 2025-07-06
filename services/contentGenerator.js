const OpenAI = require('openai');
const winston = require('winston');

class ContentGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'demo-key-for-testing'
    });
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
    
    // Predefined story templates for demo/fallback
    this.demoScripts = {
      motivation: [
        "You wake up every morning with a choice. Today, you can be the person who makes excuses, or the person who makes progress. Every champion was once a beginner who refused to give up. Your dreams are not too big, you just need to grow into them. The only impossible journey is the one you never begin. Take that first step today.",
        "Success isn't about being perfect. It's about being persistent. Every failure is a lesson, every setback is a setup for a comeback. The strongest people are forged in fires of adversity. You have survived 100% of your worst days. You are stronger than you think. Your breakthrough is just one decision away.",
        "The difference between ordinary and extraordinary is that little extra. While others sleep, you can dream. While others quit, you can persist. Your potential is limitless, your possibilities endless. Today is the day you stop waiting and start creating. The world needs what you have to offer."
      ],
      fitness: [
        "Your body is your temple, your mind is your weapon. Every workout is a battle against your former self. The pain you feel today will be the strength you feel tomorrow. You didn't come this far to only come this far. Push through the burn, embrace the sweat, celebrate the progress. Champions are made in the gym.",
        "Fitness isn't about being better than someone else. It's about being better than you were yesterday. Every rep counts, every step matters. Your only competition is the person you were yesterday. Strong bodies build strong minds. Transform your body, transform your life.",
        "The hardest part about working out is showing up. But once you start, magic happens. Endorphins flow, confidence grows, limits dissolve. You are capable of more than you know. Your body can stand almost anything. It's your mind you have to convince."
      ],
      love: [
        "Love is not about finding the perfect person. It's about seeing an imperfect person perfectly. Real love grows through understanding, patience, and choosing each other every day. The best relationships are built on friendship, trust, and genuine care. Love is a choice, not just a feeling.",
        "In a world full of temporary connections, be someone's forever. Love deeply, laugh often, forgive quickly. The greatest gift you can give someone is your time, attention, and genuine care. True love is when someone accepts your past, supports your present, and encourages your future.",
        "Love yourself first, and everything else falls into line. Self-love is not selfish, it's essential. You can't pour from an empty cup. When you love yourself, you teach others how to love you. Your relationship with yourself sets the tone for every other relationship."
      ],
      business: [
        "Every successful business started with a dream and someone brave enough to pursue it. Entrepreneurship isn't just about making money, it's about making a difference. Your ideas have power, your vision has value. The best time to plant a tree was 20 years ago. The second best time is now.",
        "Business is not just about profit, it's about purpose. Success comes to those who dare to begin. Every expert was once a beginner, every pro was once an amateur. Your network is your net worth. Build relationships, create value, serve others. Success will follow.",
        "The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy guaranteed to fail is not taking risks. Innovation distinguishes between a leader and a follower. Your business is a reflection of your beliefs. Believe in your vision."
      ],
      mindfulness: [
        "Peace comes from within. Do not seek it without. In the stillness of the mind, you find your true self. Mindfulness is about being present, not perfect. Every breath is a new beginning, every moment a fresh start. Your thoughts create your reality. Choose them wisely.",
        "The present moment is the only time over which we have dominion. Yesterday is history, tomorrow is a mystery, today is a gift. That's why it's called the present. Meditation is not about stopping thoughts, it's about observing them. Find your center.",
        "Mindfulness is a way of befriending ourselves and our experience. It's about paying attention to what's happening right now with kindness and curiosity. When you change the way you look at things, the things you look at change. Inner peace is the new success."
      ]
    };
  }

  async generateScript(category, theme = null, tone = 'inspirational') {
    try {
      this.logger.info(`Generating script for category: ${category}`);
      
      // If OpenAI API is not available, use demo scripts
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key-for-testing') {
        return this.getDemoScript(category);
      }
      
      const prompt = this.buildPrompt(category, theme, tone);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a master storyteller and content creator. Create engaging, motivational, and inspiring short-form video scripts that captivate audiences and drive engagement. Focus on emotional connection and clear, impactful messaging."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      });
      
      const script = response.choices[0].message.content.trim();
      
      // Validate script length (should be 50-60 seconds when spoken)
      const wordCount = script.split(' ').length;
      if (wordCount < 80 || wordCount > 120) {
        return this.adjustScriptLength(script, wordCount);
      }
      
      this.logger.info(`Generated script with ${wordCount} words`);
      return script;
      
    } catch (error) {
      this.logger.error('Error generating script with OpenAI:', error);
      
      // Fallback to demo scripts if OpenAI fails
      return this.getDemoScript(category);
    }
  }

  buildPrompt(category, theme, tone) {
    const categoryPrompts = {
      motivation: "Create an inspiring motivational story that empowers people to overcome challenges and achieve their goals.",
      fitness: "Create a motivational fitness story that inspires people to stay healthy, workout, and maintain an active lifestyle.",
      love: "Create a heartwarming story about love, relationships, and meaningful connections between people.",
      business: "Create an inspiring business story about entrepreneurship, success, and achieving professional goals.",
      mindfulness: "Create a peaceful, calming story about mindfulness, meditation, and finding inner peace.",
      adventure: "Create an exciting adventure story that inspires people to explore, travel, and try new experiences.",
      'personal-growth': "Create a story about personal development, self-improvement, and becoming the best version of yourself.",
      technology: "Create an engaging story about technology, innovation, and how tech improves our lives.",
      lifestyle: "Create a story about living a fulfilling, balanced lifestyle and making positive daily choices.",
      education: "Create an inspiring story about learning, growth, and the power of knowledge and education."
    };
    
    const basePrompt = categoryPrompts[category] || categoryPrompts.motivation;
    
    let prompt = `${basePrompt}
    
    Requirements:
    - Script should be exactly 50-60 seconds when spoken (approximately 80-120 words)
    - Use a ${tone} tone
    - Include a strong emotional hook in the first 5 seconds
    - Create a clear story arc with beginning, middle, and end
    - End with a powerful call-to-action or inspiring message
    - Use simple, conversational language
    - Include vivid imagery and emotional triggers
    - Make it shareable and memorable`;
    
    if (theme) {
      prompt += `\n- Focus specifically on the theme: ${theme}`;
    }
    
    return prompt;
  }

  getDemoScript(category) {
    const scripts = this.demoScripts[category] || this.demoScripts.motivation;
    const randomIndex = Math.floor(Math.random() * scripts.length);
    return scripts[randomIndex];
  }

  adjustScriptLength(script, currentWordCount) {
    const targetWordCount = 100; // Aim for middle of 80-120 range
    
    if (currentWordCount < 80) {
      // Script is too short, add more content
      return script + " Remember, every great achievement starts with a decision to try. Your journey to success begins with a single step. Believe in yourself and take action today.";
    } else if (currentWordCount > 120) {
      // Script is too long, trim it
      const words = script.split(' ');
      return words.slice(0, 120).join(' ') + '.';
    }
    
    return script;
  }

  async generateMultipleScripts(category, count = 5) {
    try {
      const scripts = [];
      
      for (let i = 0; i < count; i++) {
        const script = await this.generateScript(category);
        scripts.push({
          id: i + 1,
          script: script,
          category: category,
          timestamp: new Date().toISOString()
        });
        
        // Add delay to respect API rate limits
        await this.delay(1000);
      }
      
      return scripts;
      
    } catch (error) {
      this.logger.error('Error generating multiple scripts:', error);
      throw error;
    }
  }

  async generateTrendingScript(category) {
    try {
      // Add trending elements to the script
      const trendingElements = [
        "viral moment", "trending now", "everyone's talking about", 
        "breakthrough discovery", "game-changing insight", "life hack"
      ];
      
      const randomElement = trendingElements[Math.floor(Math.random() * trendingElements.length)];
      
      return await this.generateScript(category, randomElement, 'energetic');
      
    } catch (error) {
      this.logger.error('Error generating trending script:', error);
      return this.getDemoScript(category);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateScript(script) {
    const wordCount = script.split(' ').length;
    const hasHook = script.length > 0 && script.split('.')[0].length < 100;
    const hasCallToAction = script.toLowerCase().includes('you') || script.toLowerCase().includes('your');
    
    return {
      valid: wordCount >= 80 && wordCount <= 120 && hasHook && hasCallToAction,
      wordCount: wordCount,
      hasHook: hasHook,
      hasCallToAction: hasCallToAction
    };
  }
}

module.exports = ContentGenerator;