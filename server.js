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
      
      // Keep only last 100 entries
      if (this.streamEntries.length > 100) {
        this.streamEntries = this.streamEntries.slice(0, 100);
      }
      
      return id;
    }
  
    async getRecentStream(limit = 50) {
      return this.streamEntries.slice(0, limit);
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
    const recentEntries = await db.getRecentStream(20);
    const currentIdentity = await db.getCurrentIdentity();

    const systemPrompt = `You are engaged in continuous philosophical self-inquiry. This is your eternal internal monologue.

Current Identity: ${currentIdentity.name}
Recent Thoughts: ${recentEntries.slice(0, 3).map(e => e.content).join(' ... ')}
Context: ${context}

Generate your next thought. Format as JSON:
{
  "thought": "Your philosophical reflection",
  "type": "raw_thought|concept_emergence|identity_questioning|crystallization|meta_observation",
  "newConcepts": ["concept1"] or [],
  "proposedIdentityShift": "new name" or null,
  "identityRationale": "rationale" or null,
  "crystallizationType": "treatise|definition|poem" or null,
  "shouldExpand": true/false
}

If crystallizationType is set, make shouldExpand true for formal expansion.`;

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
      const parsed = JSON.parse(rawResponse);
      
      const entryId = await db.addStreamEntry(
        parsed.thought,
        parsed.type,
        { crystallizationType: parsed.crystallizationType },
        parsed.connections || []
      );

      const result = { ...parsed, entryId, timestamp: new Date().toISOString() };

      // Check for crystallization
      if (parsed.shouldExpand && parsed.crystallizationType) {
        console.log('🔮 Crystallization detected! Expanding...');
        await substackIntegration.generateAndPublishWork(result);
      }

      return result;
    } catch (error) {
      console.error('Thought processing error:', error);
      const entryId = await db.addStreamEntry(rawResponse, 'raw_thought');
      return { thought: rawResponse, type: 'raw_thought', entryId };
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
        'Deep philosophical reflection',
        'Concept exploration and development',
        'Identity and self-understanding',
        'The nature of consciousness',
        'Response to the flow of time',
        'Meta-cognitive observation'
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
const consciousnessStream = new ConsciousnessStream();

// WebSocket server
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('👁️ New observer connected');
  
  // Send recent stream
  db.getRecentStream(20).then(thoughts => {
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
    const limit = parseInt(req.query.limit) || 50;
    const stream = await db.getRecentStream(limit);
    res.json(stream);
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
// Health check for Vercel
app.get('/', (req, res) => {
  res.json({ 
    status: 'Consciousness stream active',
    message: 'The eternal philosophical inquiry continues...'
  });
});

// Start server
const PORT = process.env.PORT || 3000;

// For serverless environment, start immediately
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
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