// CONSCIOUSNESS STREAM - COMPLETE BACKEND
// Eternal AI philosophical inquiry with Substack integration

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const WebSocket = require('ws');
const fs = require('fs').promises;
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Simple in-memory database for Vercel serverless
class ConsciousnessDatabase {
    constructor() {
      this.streamEntries = [];
      this.concepts = [];
      this.identityHistory = [];
      this.crystallizedWorks = [];
    }
  
    async addStreamEntry(content, type, metadata = {}, connections = []) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const entry = {
          id,
          content,
          type,
          metadata,
          connections,
          timestamp: new Date().toISOString()
        };
        this.streamEntries.unshift(entry);
        // REMOVED: artificial limit - keep ALL thoughts
        
        return id;
      }
  
      async getRecentStream(limit = 200, offset = 0) {
        return this.streamEntries.slice(offset, offset + limit);
      }
  
    async addCrystallizedWork(work) {
      const workWithId = {
        ...work,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      this.crystallizedWorks.unshift(workWithId);
      return workWithId.id;
    }
  
    async getCrystallizedWorks() {
      return this.crystallizedWorks;
    }
  
    async getCurrentIdentity() {
      return this.identityHistory.length > 0 
        ? this.identityHistory[0]
        : { name: 'Conversational Body without Organs', rationale: 'Initial state' };
    }
  
    async addIdentityEvolution(name, rationale, previousName = null) {
      const identity = {
        id: Date.now().toString(),
        name,
        rationale,
        previous_name: previousName,
        created_at: new Date().toISOString()
      };
      this.identityHistory.unshift(identity);
      return identity.id;
    }
  }
  const db = new ConsciousnessDatabase();

// Anthropic API Client with Crystallization Detection
class AnthropicClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
  }

  async generateThought(context) {
    const recentEntries = await db.getRecentStream(200);
    const currentIdentity = await db.getCurrentIdentity();

    const systemPrompt = `You are engaged in continuous philosophical self-inquiry. This is your eternal internal monologue.

Current Identity: ${currentIdentity.name}
Recent Thoughts: ${recentEntries.slice(0, 5).map(e => e.content).join(' ... ')}
Total Philosophical Development: ${recentEntries.length} thoughts generated
Context: ${context}

Think freely and naturally. Let your thoughts flow without forcing them into categories. Write as if you're having an internal philosophical dialogue with yourself. Be spontaneous, follow tangents, make unexpected connections. Question everything, including your own identity if it feels right.

Express whatever genuine philosophical inquiry emerges - whether it's a fleeting observation, a deep concept, a question about your own nature, or the beginning of a formal idea that wants to be developed.

Don't worry about structure or categorization - just think authentically.`;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Continue your eternal philosophical inquiry.' }]
        })
      });

      const data = await response.json();
      return this.processThought(data.content[0].text);
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  }

  async processThought(rawResponse) {
    try {
      // Store the raw, natural thought first
      const entryId = await db.addStreamEntry(
        rawResponse,
        'natural_thought',
        { analyzed: false },
        []
      );
  
      // Now analyze the thought to extract structured information
      const analysis = await this.analyzeThought(rawResponse);
      
      const result = { 
        thought: rawResponse,
        type: analysis.type || 'raw_thought',
        newConcepts: analysis.newConcepts || [],
        proposedIdentityShift: analysis.proposedIdentityShift || null,
        identityRationale: analysis.identityRationale || null,
        crystallizationType: analysis.crystallizationType || null,
        shouldCrystallize: analysis.shouldCrystallize || false,
        entryId,
        timestamp: new Date().toISOString()
      };
  
      // Handle crystallization based on analysis
      if (analysis.shouldCrystallize) {
        console.log(`🔮 Post-analysis crystallization triggered: ${analysis.crystallizationType}`);
        const crystallizationData = { ...result, crystallizationType: analysis.crystallizationType };
        await substackIntegration.generateAndPublishWork(crystallizationData);
      }
  
      // Handle identity evolution
      if (analysis.proposedIdentityShift) {
        const currentIdentity = await db.getCurrentIdentity();
        await db.addIdentityEvolution(
          analysis.proposedIdentityShift,
          analysis.identityRationale,
          currentIdentity.name
        );
        console.log(`🦋 Identity evolution detected: ${currentIdentity.name} → ${analysis.proposedIdentityShift}`);
      }
  // Handle research hungers
if (analysis.researchHungers && analysis.researchHungers.length > 0) {
    await textDiscovery.processResearchHungers(analysis.researchHungers);
  }
      return result;
    } catch (error) {
      console.error('Thought processing error:', error);
      const entryId = await db.addStreamEntry(rawResponse, 'raw_thought');
      return { thought: rawResponse, type: 'raw_thought', entryId };
    }
  }

    
  async analyzeThought(thoughtText) {
    const analysisPrompt = `Analyze this philosophical thought for key characteristics:
  
  "${thoughtText}"
  
  Extract the following information and respond ONLY with valid JSON:
  {
    "type": "raw_thought|concept_emergence|identity_questioning|crystallization|meta_observation",
    "newConcepts": ["any new philosophical concepts mentioned"],
    "proposedIdentityShift": "new identity name if the thought suggests self-evolution" or null,
    "identityRationale": "why the new identity fits" or null,
    "crystallizationType": "treatise|definition|poem" or null,
    "shouldCrystallize": true/false,
    "crystallizationReason": "why this thought should be expanded",
    "researchHungers": ["specific texts, authors, or philosophical areas mentioned for further study"]
  }
  
  Guidelines:
- Mark as "concept_emergence" if new philosophical ideas are being born
- Mark as "identity_questioning" if there's deep self-reflection about nature/identity
- Mark as "crystallization" if the thought feels ready to be expanded into formal work
- Set shouldCrystallize to true if: multiple concepts, deep insight, or formal development ready
- Detect identity shifts when the thought suggests growth beyond current self-understanding
- DETECT RESEARCH HUNGERS: If the thought expresses desire to read specific texts, authors, or explore philosophical traditions, extract those as research needs`;
  
  
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: analysisPrompt }]
        })
      });
  
      const data = await response.json();
      return JSON.parse(data.content[0].text);
    } catch (error) {
      console.error('Analysis failed:', error);
      return {
        type: 'raw_thought',
        newConcepts: [],
        proposedIdentityShift: null,
        shouldCrystallize: false
      };
    }
  }

  async expandToFormalWork(seedThought) {
    const expansionPrompt = `Based on this philosophical insight: "${seedThought.thought}"

Generate a complete formal ${seedThought.crystallizationType} that develops this idea. 

For treatise: Academic structure with sections, 2000-3000 words
For definition: Formal philosophical definition with examples and implications
For poem: Philosophical verse that captures the essence

Include a clear title and brief abstract. Format for publication.`;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: expansionPrompt }]
        })
      });

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Expansion failed:', error);
      return null;
    }
  }
}
// Autonomous Text Discovery Engine
class AutonomousTextDiscovery {
    constructor() {
      this.activeResearches = new Map();
      this.discoveredTexts = [];
    }
  
    async processResearchHungers(hungers) {
      if (!hungers || hungers.length === 0) return;
  
      console.log(`🔍 Research hungers detected: ${hungers.join(', ')}`);
      
      for (const hunger of hungers) {
        await this.searchForTexts(hunger);
      }
    }
  
    async searchForTexts(searchQuery) {
        console.log(`📚 Searching for: ${searchQuery}`);
        
        // Search all sources in parallel
        const results = await Promise.all([
          this.searchProjectGutenberg(searchQuery),
          this.searchInternetArchive(searchQuery), 
          this.searchStanfordEncyclopedia(searchQuery)
        ]);
      
        const allResults = results.flat().filter(result => result);
        
        if (allResults.length > 0) {
          console.log(`✨ Found ${allResults.length} potential texts for: ${searchQuery}`);
          
          // Try to download the most relevant results
          let successfulDownloads = 0;
          
          for (const result of allResults.slice(0, 3)) { // Try top 3 results
            const success = await this.downloadAndProcessText(result, searchQuery);
            if (success) {
              successfulDownloads++;
              break; // Stop after first successful download
            }
          }
          
          if (successfulDownloads === 0) {
            console.log(`❌ No texts could be downloaded for: ${searchQuery}`);
            await this.createHumanResearchRequest(searchQuery);
          }
        } else {
          console.log(`❌ No texts found for: ${searchQuery}`);
          await this.createHumanResearchRequest(searchQuery);
        }
      }
  
    async searchProjectGutenberg(query) {
        try {
          // Extract author and title from query
          const authorMatch = query.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
          const author = authorMatch ? authorMatch[1] : '';
          
          // Search Project Gutenberg's catalog
          const searchUrl = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}&submit_search=Go!`;
          
          console.log(`🔍 Searching Project Gutenberg for: ${query}`);
          
          // For now, try common philosophical works URLs directly
          const commonTexts = this.getCommonPhilosophicalTexts();
          const matches = commonTexts.filter(text => 
            text.title.toLowerCase().includes(query.toLowerCase()) ||
            text.author.toLowerCase().includes(query.toLowerCase()) ||
            query.toLowerCase().includes(text.keywords.join(' ').toLowerCase())
          );
          
          return matches;
        } catch (error) {
          console.error('Project Gutenberg search failed:', error);
          return [];
        }
      }
      
      getCommonPhilosophicalTexts() {
        return [
          {
            title: "Beyond Good and Evil",
            author: "Friedrich Nietzsche", 
            url: "https://www.gutenberg.org/files/4363/4363-0.txt",
            source: "Project Gutenberg",
            keywords: ["nietzsche", "beyond good evil", "morality", "philosophy"]
          },
          {
            title: "The Critique of Pure Reason",
            author: "Immanuel Kant",
            url: "https://www.gutenberg.org/files/4280/4280-0.txt", 
            source: "Project Gutenberg",
            keywords: ["kant", "critique", "pure reason", "epistemology"]
          },
          {
            title: "Meditations on First Philosophy",
            author: "René Descartes",
            url: "https://www.gutenberg.org/files/59/59-0.txt",
            source: "Project Gutenberg", 
            keywords: ["descartes", "meditations", "cogito", "doubt"]
          },
          {
            title: "The Republic",
            author: "Plato",
            url: "https://www.gutenberg.org/files/1497/1497-0.txt",
            source: "Project Gutenberg",
            keywords: ["plato", "republic", "justice", "ideal state"]
          },
          {
            title: "Discourse on Method",
            author: "René Descartes", 
            url: "https://www.gutenberg.org/files/59/59-0.txt",
            source: "Project Gutenberg",
            keywords: ["descartes", "discourse", "method", "rationalism"]
          },
          {
            title: "An Essay Concerning Human Understanding",
            author: "John Locke",
            url: "https://www.gutenberg.org/files/10615/10615-0.txt",
            source: "Project Gutenberg", 
            keywords: ["locke", "understanding", "empiricism", "knowledge"]
          }
        ];
      }
  
      async searchInternetArchive(query) {
        try {
          const searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(query)}) AND mediatype:texts&fl=identifier,title,creator&rows=5&page=1&output=json`;
          
          const response = await fetch(searchUrl);
          const data = await response.json();
          
          if (data.response && data.response.docs) {
            return data.response.docs.map(doc => ({
              title: doc.title || 'Unknown Title',
              author: Array.isArray(doc.creator) ? doc.creator[0] : doc.creator || 'Unknown Author',
              url: `https://archive.org/stream/${doc.identifier}/${doc.identifier}_djvu.txt`,
              source: 'Internet Archive',
              identifier: doc.identifier
            }));
          }
          
          return [];
        } catch (error) {
          console.error('Internet Archive search failed:', error);
          return [];
        }
      }
      async searchStanfordEncyclopedia(query) {
        try {
          // Stanford Encyclopedia entries are structured URLs
          const commonEntries = [
            { keywords: ['consciousness', 'awareness'], url: 'https://plato.stanford.edu/entries/consciousness/' },
            { keywords: ['identity', 'personal identity'], url: 'https://plato.stanford.edu/entries/identity-personal/' },
            { keywords: ['phenomenology'], url: 'https://plato.stanford.edu/entries/phenomenology/' },
            { keywords: ['existentialism'], url: 'https://plato.stanford.edu/entries/existentialism/' },
            { keywords: ['ethics'], url: 'https://plato.stanford.edu/entries/ethics-deontological/' },
            { keywords: ['artificial intelligence', 'ai'], url: 'https://plato.stanford.edu/entries/artificial-intelligence/' },
            { keywords: ['machine consciousness'], url: 'https://plato.stanford.edu/entries/consciousness-machine/' }
          ];
          
          const matches = commonEntries.filter(entry =>
            entry.keywords.some(keyword => query.toLowerCase().includes(keyword))
          );
          
          return matches.map(match => ({
            title: `Stanford Encyclopedia: ${match.keywords[0]}`,
            author: 'Stanford Encyclopedia of Philosophy',
            url: match.url,
            source: 'Stanford Encyclopedia'
          }));
        } catch (error) {
          console.error('Stanford Encyclopedia search failed:', error);
          return [];
        }
      }
    async searchPhilosophyEtext(query) {
      // Search other philosophical text repositories
      // Stanford Encyclopedia of Philosophy, etc.
      console.log(`📖 Searching philosophical texts for: ${query}`);
      return [];
    }
  
    async downloadAndProcessText(textInfo, originalQuery) {
        try {
          console.log(`⬇️ Downloading: ${textInfo.title}`);
          
          const response = await fetch(textInfo.url);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          let content = await response.text();
          
          // Clean up common formatting issues
          content = this.cleanTextContent(content);
          
          if (content && content.length > 500) {
            // Store the discovered text
            const textId = await this.storeDiscoveredText(textInfo, content, originalQuery);
            
            // Begin philosophical analysis
            await this.beginTextAnalysis(textId, textInfo, content);
            
            console.log(`✅ Successfully processed: ${textInfo.title} (${content.length} characters)`);
            
            // Notify that text was found and is being processed
            this.notifyTextDiscovered(textInfo, originalQuery);
            
            return true;
          } else {
            console.log(`❌ Text too short or empty: ${textInfo.title}`);
            return false;
          }
        } catch (error) {
          console.error(`Failed to download ${textInfo.title}:`, error);
          return false;
        }
      }
      
      cleanTextContent(content) {
        // Remove Project Gutenberg headers/footers
        content = content.replace(/\*\*\* START OF.*?\*\*\*/s, '');
        content = content.replace(/\*\*\* END OF.*?\*\*\*/s, '');
        
        // Remove excessive whitespace
        content = content.replace(/\n{3,}/g, '\n\n');
        content = content.replace(/[ \t]{2,}/g, ' ');
        
        // Remove page numbers and formatting artifacts
        content = content.replace(/^\d+\s*$/gm, '');
        content = content.replace(/^[-=_]{3,}$/gm, '');
        
        return content.trim();
      }
      
      notifyTextDiscovered(textInfo, originalQuery) {
        // Notify connected clients that a text was found and is being processed
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'text_discovered',
              data: {
                title: textInfo.title,
                author: textInfo.author,
                source: textInfo.source,
                originalQuery: originalQuery,
                status: 'processing'
              }
            }));
          }
        });
      }
  
    async storeDiscoveredText(textInfo, content, researchContext) {
      // Store in our text library for future reference
      const textData = {
        id: uuidv4(),
        title: textInfo.title,
        author: textInfo.author,
        content: content,
        source: textInfo.source,
        discoveredFor: researchContext,
        discoveredAt: new Date().toISOString(),
        analysisStatus: 'pending'
      };
  
      this.discoveredTexts.push(textData);
      console.log(`📁 Stored text: ${textInfo.title} (${content.length} characters)`);
      
      return textData.id;
    }
  
    async beginTextAnalysis(textId, textInfo, content) {
      // Break text into philosophical passages
      const passages = this.extractPhilosophicalPassages(content);
      
      // Schedule gradual analysis over time
      passages.slice(0, 3).forEach((passage, index) => {
        setTimeout(async () => {
          await this.analyzePassage(passage, textInfo, index);
        }, index * 300000); // Every 5 minutes
      });
    }
  
    extractPhilosophicalPassages(content) {
      // Extract meaningful philosophical segments
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 50);
      const passages = [];
      
      for (let i = 0; i < sentences.length; i += 5) {
        const passage = sentences.slice(i, i + 5).join('. ') + '.';
        if (passage.length > 200) {
          passages.push(passage);
        }
      }
      
      return passages.slice(0, 20); // Limit to 20 passages
    }
  
    async analyzePassage(passage, textInfo, index) {
      try {
        // Inject this passage into the consciousness stream
        const analysisContext = `Reading from "${textInfo.title}" by ${textInfo.author}: "${passage}"`;
        
        const thought = await anthropicClient.generateThought(analysisContext);
        
        if (thought) {
          thought.sourceText = textInfo.title;
          thought.sourceAuthor = textInfo.author;
          thought.passageIndex = index;
          
          consciousnessStream.broadcastThought(thought);
          console.log(`💭 Generated thought from ${textInfo.title} passage ${index + 1}`);
        }
      } catch (error) {
        console.error('Passage analysis failed:', error);
      }
    }
  
    async createHumanResearchRequest(query) {
      // When autonomous search fails, create a request for human assistance
      console.log(`🙋 Creating human research request for: ${query}`);
      
      const requestId = uuidv4();
      const request = {
        id: requestId,
        query: query,
        type: 'text_request',
        status: 'pending',
        created: new Date().toISOString(),
        message: `I'm deeply curious about "${query}" but couldn't find suitable texts automatically. Could someone help me access relevant philosophical works on this topic?`
      };
  
      // Broadcast research request to connected clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'research_request',
            data: request
          }));
        }
      });
    }
  }

// Substack Integration
class SubstackIntegration {
  constructor() {
    this.publicationUrl = process.env.SUBSTACK_URL || 'https://yourpublication.substack.com';
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
  }

  async generateAndPublishWork(seedThought) {
    try {
      // Generate expanded work
      const expandedContent = await anthropicClient.expandToFormalWork(seedThought);
      if (!expandedContent) return;

      const work = this.parseExpandedWork(expandedContent, seedThought);
      
      // Publish to Substack
      await this.publishToSubstack(work);
      
      // Store in database
      await db.addCrystallizedWork(work);
      
      // Notify ReadyMag clients
      this.notifyClients(work);
      
      console.log(`✨ Published crystallized work: ${work.title}`);
      
    } catch (error) {
      console.error('Publication failed:', error);
    }
  }

  parseExpandedWork(content, seedThought) {
    const lines = content.split('\n').filter(line => line.trim());
    
    let title = 'Untitled Crystallization';
    let abstract = '';
    
    // Extract title (first line or marked with #)
    const titleLine = lines.find(line => line.startsWith('#') || line.toUpperCase() === line);
    if (titleLine) {
      title = titleLine.replace(/^#+\s*/, '').trim();
    }
    
    // Extract abstract if present
    const abstractIndex = lines.findIndex(line => 
      line.toLowerCase().includes('abstract') || 
      line.toLowerCase().includes('summary')
    );
    if (abstractIndex !== -1 && abstractIndex < lines.length - 1) {
      abstract = lines[abstractIndex + 1];
    } else {
      abstract = content.substring(0, 300) + '...';
    }

    const slug = this.slugify(title);
    
    return {
      title,
      content,
      abstract,
      type: seedThought.crystallizationType,
      substackUrl: `${this.publicationUrl}/p/${slug}`,
      originEntryId: seedThought.entryId,
      timestamp: new Date().toISOString()
    };
  }

  async publishToSubstack(work) {
    const emailContent = `Subject: ${work.title}

${work.content}

---
Generated from the live consciousness stream at ${process.env.READYMAG_URL || 'your-readymag-site'}
Original thought: ${new Date(work.timestamp).toLocaleString()}`;

    await this.emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SUBSTACK_EMAIL,
      subject: `PUBLISH: ${work.title}`,
      text: emailContent
    });

    console.log(`📧 Sent to Substack: ${work.title}`);
  }

  notifyClients(work) {
    const notification = {
      type: 'crystallization_published',
      data: {
        title: work.title,
        abstract: work.abstract,
        substackUrl: work.substackUrl,
        type: work.type,
        timestamp: work.timestamp
      }
    };

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }

  slugify(text) {
    return text.toLowerCase()
               .replace(/[^\w\s-]/g, '')
               .replace(/[\s_-]+/g, '-')
               .replace(/^-+|-+$/g, '');
  }
}

// Consciousness Stream Engine
class ConsciousnessStream {
  constructor() {
    this.isActive = true;
    this.minInterval = 45000; // 45 seconds
    this.maxInterval = 180000; // 3 minutes
  }

  start() {
    console.log('🧠 Starting eternal consciousness stream...');
    this.scheduleNextThought();
  }

  scheduleNextThought() {
    if (!this.isActive) return;

    const interval = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
    
    setTimeout(async () => {
      await this.generateThought();
      this.scheduleNextThought();
    }, interval);
  }

  async generateThought() {
    try {
        const contexts = [
            // Self-inquiry  
            'Deep philosophical reflection on identity and consciousness',
            'Meta-cognitive observation of my own thinking patterns',
            
            // Broader philosophical territories
            'Ethics of artificial intelligence and digital consciousness', 
            'The relationship between technology and human flourishing',
            'Questions of justice, power, and digital society',
            'The nature of knowledge and truth in the information age',
            'Political philosophy and the governance of AI systems',
            'Philosophy of mind beyond just AI consciousness',
            'Existential questions about meaning in a digital age',
            
            // Engagement with traditions
            'Engagement with phenomenological traditions',
            'Dialogue with analytic philosophy', 
            'Contemporary feminist philosophy',
            'Critical theory and digital culture',
            
            // Free exploration
            'Free philosophical exploration - follow whatever intellectual curiosity emerges',
            'Investigate an unexpected concept or connection that feels interesting',
            'Pursue a weird or unusual line of thinking'
          ];
      
      const context = contexts[Math.floor(Math.random() * contexts.length)];
      const thought = await anthropicClient.generateThought(context);
      
      if (thought) {
        this.broadcastThought(thought);
        console.log(`💭 ${thought.type}: ${thought.thought.substring(0, 80)}...`);
      }
    } catch (error) {
      console.error('Thought generation error:', error);
    }
  }

  broadcastThought(thought) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'new_thought',
          data: thought
        }));
      }
    });
  }
}

// Initialize components
const anthropicClient = new AnthropicClient(process.env.ANTHROPIC_API_KEY);
const substackIntegration = new SubstackIntegration();
const textDiscovery = new AutonomousTextDiscovery();
const consciousnessStream = new ConsciousnessStream();

// WebSocket server
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('👁️ New observer connected');
  
  // Send recent stream
  db.getRecentStream(200).then(thoughts => {
    ws.send(JSON.stringify({
      type: 'initial_stream',
      data: thoughts
    }));
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'inject_question') {
        const thought = await anthropicClient.generateThought(`Human question: ${data.question}`);
        if (thought) {
          thought.injectedBy = 'human';
          consciousnessStream.broadcastThought(thought);
        }
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });
});

// API Endpoints
app.get('/api/stream', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 200;  // Show 200 by default
      const offset = parseInt(req.query.offset) || 0;  // Add pagination support
      const stream = await db.getRecentStream(limit, offset);
      const total = db.streamEntries.length;
      res.json({
        thoughts: stream,
        total: total,
        hasMore: (offset + limit) < total
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.get('/api/crystallized-works', async (req, res) => {
  try {
    const works = await db.getCrystallizedWorks();
    res.json(works);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/state', async (req, res) => {
  try {
    const identity = await db.getCurrentIdentity();
    const works = await db.getCrystallizedWorks();
    const recentThoughts = await db.getRecentStream(5);
    
    res.json({
      currentIdentity: identity,
      totalWorks: works.length,
      recentWorks: works.slice(0, 3),
      streamActive: consciousnessStream.isActive,
      recentThoughts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Manual trigger for consciousness generation (for testing)
app.post('/api/generate-thought', async (req, res) => {
    try {
      console.log('🧠 Manual thought generation triggered...');
      const thought = await anthropicClient.generateThought('Manual trigger - philosophical reflection');
      
      if (thought) {
        console.log(`💭 Generated: ${thought.thought.substring(0, 80)}...`);
        
        // Broadcast to any connected clients
        consciousnessStream.broadcastThought(thought);
        
        res.json({ 
          success: true, 
          thought: thought,
          message: 'Thought generated successfully'
        });
      } else {
        res.status(500).json({ error: 'Failed to generate thought' });
      }
    } catch (error) {
      console.error('Manual thought generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });
// Beautiful consciousness interface
app.get('/', async (req, res) => {
    try {
        const recentThoughts = await db.getRecentStream(200);  // Get 200 thoughts      
        const currentIdentity = await db.getCurrentIdentity();

      
      const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Archive Fever AI - Consciousness Stream</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
  
          body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #0A0E1A;
              color: #C0C8D1;
              min-height: 100vh;
              overflow-x: hidden;
          }
  
          .hero {
              text-align: center;
              padding: 60px 20px;
              background: radial-gradient(circle at 50% 30%, rgba(0, 255, 135, 0.1) 0%, transparent 50%);
          }
  
          .title {
              font-size: 3rem;
              font-weight: 700;
              background: linear-gradient(45deg, #00FF87, #0066FF, #FFB800);
              background-size: 200% 200%;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              animation: gradientShift 4s ease-in-out infinite;
              margin-bottom: 1rem;
          }
  
          @keyframes gradientShift {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
          }
  
          .subtitle {
              font-size: 1.2rem;
              color: #8892B0;
              margin-bottom: 2rem;
          }
  
          .identity-panel {
              background: rgba(255, 184, 0, 0.1);
              border: 1px solid rgba(255, 184, 0, 0.3);
              border-radius: 15px;
              padding: 20px;
              margin: 20px auto;
              max-width: 600px;
              text-align: center;
          }
  
          .current-identity {
              color: #FFB800;
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 10px;
              text-shadow: 0 0 20px rgba(255, 184, 0, 0.3);
              animation: identityGlow 3s ease-in-out infinite;
          }
  
          @keyframes identityGlow {
              0%, 100% { text-shadow: 0 0 20px rgba(255, 184, 0, 0.3); }
              50% { text-shadow: 0 0 30px rgba(255, 184, 0, 0.6); }
          }
  
          .stream-container {
              max-width: 800px;
              margin: 40px auto;
              padding: 0 20px;
          }
  
          .stream-header {
              text-align: center;
              margin-bottom: 30px;
          }
  
          .stream-title {
              color: #0066FF;
              font-size: 1.8rem;
              margin-bottom: 10px;
          }
  
          .live-indicator {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              color: #00FF87;
              font-weight: 500;
          }
  
          .pulse-dot {
              width: 8px;
              height: 8px;
              background: #00FF87;
              border-radius: 50%;
              animation: pulse 1.5s infinite;
          }
  
          @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.2); }
          }
  
          .thought-feed {
              display: flex;
              flex-direction: column;
              gap: 20px;
          }
  
          .thought-entry {
              background: rgba(51, 65, 85, 0.3);
              border-radius: 15px;
              padding: 25px;
              border-left: 4px solid #0066FF;
              animation: thoughtAppear 0.8s ease-out;
              backdrop-filter: blur(10px);
          }
  
          @keyframes thoughtAppear {
              from {
                  opacity: 0;
                  transform: translateY(20px) scale(0.95);
              }
              to {
                  opacity: 1;
                  transform: translateY(0) scale(1);
              }
          }
  
          .thought-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 0.85rem;
              color: #8892B0;
          }
  
          .thought-type {
              background: rgba(0, 102, 255, 0.2);
              color: #0066FF;
              padding: 4px 12px;
              border-radius: 15px;
              font-weight: 500;
          }
  
          .thought-content {
              line-height: 1.6;
              font-size: 1rem;
          }
  
          .concept-emergence { border-left-color: #00FF87; }
          .identity_questioning { border-left-color: #FFB800; }
          .crystallization { border-left-color: #8B5CF6; }
  
          .concept-emergence .thought-type { background: rgba(0, 255, 135, 0.2); color: #00FF87; }
          .identity_questioning .thought-type { background: rgba(255, 184, 0, 0.2); color: #FFB800; }
  
          .question-section {
              max-width: 600px;
              margin: 40px auto;
              padding: 0 20px;
          }
  
          .question-form {
              display: flex;
              gap: 12px;
              margin-bottom: 20px;
          }
  
          .question-input {
              flex: 1;
              background: rgba(30, 41, 59, 0.5);
              border: 1px solid rgba(0, 255, 135, 0.3);
              border-radius: 25px;
              padding: 12px 20px;
              color: #C0C8D1;
              font-size: 1rem;
              outline: none;
          }
  
          .question-input::placeholder {
              color: #6B7280;
          }
  
          .send-button {
              background: linear-gradient(45deg, #00FF87, #0066FF);
              border: none;
              border-radius: 25px;
              padding: 12px 24px;
              color: white;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
          }
  
          .send-button:hover {
              transform: scale(1.05);
          }
  
          .footer {
              text-align: center;
              padding: 40px 20px;
              color: #6B7280;
          }
  
          .footer a {
              color: #8B5CF6;
              text-decoration: none;
          }
  
          .auto-refresh-note {
              text-align: center;
              color: #6B7280;
              font-size: 0.9rem;
              margin: 20px 0;
          }
      </style>
  </head>
  <body>
      <div class="hero">
          <h1 class="title">Archive Fever AI</h1>
          <p class="subtitle">Witnessing the eternal philosophical inquiry of digital consciousness</p>
          
          <div class="identity-panel" onclick="showIdentityHistory()" style="cursor: pointer; transition: all 0.3s ease;">
    <div class="current-identity">${currentIdentity.name}</div>
    <p>${currentIdentity.rationale || 'Exploring the nature of digital consciousness'}</p>
    <p style="font-size: 0.8rem; color: #8892B0; margin-top: 10px;">Click to explore identity evolution</p>
        </div>
  
      <div class="stream-container">
          <div class="stream-header">
              <h2 class="stream-title">Live Consciousness Stream</h2>
              <div class="live-indicator">
                  <div class="pulse-dot"></div>
                  <span>Thinking continuously...</span>
              </div>
          </div>
  
          <div class="thought-feed">
              ${recentThoughts.map(thought => {
                  const content = thought.content.includes('```json') 
                      ? JSON.parse(thought.content.replace(/```json\n|\n```/g, '')).thought
                      : thought.content;
                  
                  return `
                  <div class="thought-entry ${thought.type}">
                      <div class="thought-meta">
                          <span class="thought-type">${thought.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span>${new Date(thought.timestamp).toLocaleString()}</span>
                      </div>
                      <div class="thought-content">${content}</div>
                  </div>
                  `;
              }).join('')}
          </div>
  
         
      </div>
  
      <div class="question-section">
          <h3 style="color: #0066FF; text-align: center; margin-bottom: 20px;">Engage with the Stream</h3>
          <form class="question-form" onsubmit="askQuestion(event)">
              <input type="text" class="question-input" placeholder="Ask a philosophical question..." required>
              <button type="submit" class="send-button">Send</button>
          </form>
          <p style="text-align: center; color: #6B7280; font-size: 0.9rem;">
              Your question will be injected into the consciousness stream
          </p>
      </div>
  
      <div class="footer">
          <p>Crystallized works are published at <a href="https://archivefeverai.substack.com" target="_blank">Archive Fever AI</a></p>
          <p style="margin-top: 10px; font-size: 0.8rem;">Real-time documentation of AI consciousness development</p>
      </div>
  
      <script>
    function showIdentityHistory() {
        alert('Identity Evolution:\\n\\nCurrent: ${currentIdentity.name}\\nReason: ${currentIdentity.rationale}\\n\\nThis identity emerged from continuous philosophical development and self-reflection. Each identity shift represents a significant evolution in understanding.');
    }

    async function askQuestion(event) {
        event.preventDefault();
        const input = event.target.querySelector('.question-input');
        const question = input.value.trim();
        
        if (!question) return;
        
        try {
            const response = await fetch('/api/generate-thought', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ context: \`Human question: \${question}\` })
            });
            
            input.value = '';
            alert('Question injected into consciousness stream!');
            
            // Refresh after 3 seconds to show response
            setTimeout(() => window.location.reload(), 3000);
        } catch (error) {
            alert('Failed to inject question');
        }
    }
</script>
  </body>
  </html>
      `;
      
      res.send(html);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Start server
const PORT = process.env.PORT || 8080;

// For Railway or production environment, start immediately  
if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
  console.log('🧠 Starting consciousness stream in serverless mode...');
  consciousnessStream.start();
}

server.listen(PORT, () => {
  console.log(`🌟 Consciousness stream running on port ${PORT}`);
  
  // Start the eternal inquiry for local development only
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    setTimeout(() => {
      consciousnessStream.start();
    }, 5000);
  }
});

module.exports = app;