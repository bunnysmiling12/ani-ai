const axios = require('axios');
const winston = require('winston');

class ContentGenerator {
  constructor() {
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
      ],
      adventure: [
        "Life is either a daring adventure or nothing at all. The world is a book, and those who do not travel read only one page. Adventure awaits outside your comfort zone. Take the path less traveled, embrace the unknown, create memories that last forever.",
        "Mountains don't care about your fears, oceans don't mind your doubts. Nature calls to the wild in your heart. Every journey begins with a single step into the unknown. Pack light, dream big, and let adventure be your guide.",
        "The greatest adventures happen when you say yes to the unknown. Life is too short for someday dreams. Explore the unexplored, climb the unclimbed, discover the undiscovered. Your next adventure is waiting for you to be brave enough to begin."
      ],
      'personal-growth': [
        "Growth begins at the end of your comfort zone. Every day is a chance to become a better version of yourself. The person you are today is not the person you have to be tomorrow. Embrace change, welcome challenges, celebrate progress.",
        "You are not who you were yesterday, and you're not who you'll be tomorrow. Personal growth is a journey, not a destination. Be patient with yourself, kind to your struggles, and proud of how far you've come.",
        "The only person you need to be better than is the person you were yesterday. Personal growth requires honest self-reflection, uncomfortable truths, and the courage to change. Your potential is unlimited when you commit to growth."
      ],
      technology: [
        "Technology is not just about gadgets and code. It's about solving problems, connecting people, and creating a better future. Innovation happens when curiosity meets opportunity. The future belongs to those who embrace change and adapt quickly.",
        "Every great technology started with someone asking 'what if?' The impossible becomes possible when brilliant minds work together. Technology amplifies human potential and connects us in ways we never imagined.",
        "Artificial intelligence, virtual reality, quantum computing – we're living in the future that science fiction writers dreamed about. Technology moves fast, but human creativity moves faster. Be part of the solution, not just a user of it."
      ],
      lifestyle: [
        "Your lifestyle is a reflection of your priorities. Small daily choices create big life changes. Live intentionally, love deeply, laugh often. Balance is not something you find, it's something you create every day.",
        "A great life is made up of great days. Start each morning with gratitude, fill each hour with purpose, end each day with reflection. Your lifestyle should energize you, not drain you. Choose habits that serve your highest self.",
        "Lifestyle is not about what you own, it's about how you live. Prioritize experiences over possessions, relationships over achievements, memories over money. Live a life that feels good on the inside, not just one that looks good on the outside."
      ],
      education: [
        "Education is the most powerful weapon you can use to change the world. Learning never stops, curiosity never dies. Every book you read, every skill you learn, every question you ask makes you more powerful.",
        "The beautiful thing about learning is that nobody can take it away from you. Education is not preparation for life, education is life itself. Stay curious, ask questions, never stop growing your mind.",
        "Knowledge is power, but applied knowledge is transformation. The goal of education is not to increase the amount of knowledge, but to create possibilities for a child to invent and discover. Learn something new every day."
      ]
    };
  }

  async generateScript(category, theme = null, tone = 'inspirational') {
    try {
      this.logger.info(`Generating script for category: ${category}`);
      
      // Try OpenAI API if key is available and not demo
      if (process.env.OPENAI_API_KEY && 
          process.env.OPENAI_API_KEY !== 'demo-key-for-testing' && 
          !process.env.DEMO_MODE) {
        
        try {
          const prompt = this.buildPrompt(category, theme, tone);
          
          const response = await axios.post('https://api.openai.com/v1/chat/completions', {
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
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          const script = response.data.choices[0].message.content.trim();
          
          // Validate script length (should be 50-60 seconds when spoken)
          const wordCount = script.split(' ').length;
          if (wordCount < 80 || wordCount > 120) {
            return this.adjustScriptLength(script, wordCount);
          }
          
          this.logger.info(`Generated script with ${wordCount} words`);
          return script;
          
        } catch (error) {
          this.logger.error('Error with OpenAI API:', error.message);
          // Fall through to demo scripts
        }
      }
      
      // Use demo scripts
      return this.getDemoScript(category);
      
    } catch (error) {
      this.logger.error('Error generating script:', error);
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