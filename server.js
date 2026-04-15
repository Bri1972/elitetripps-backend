const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a warm, knowledgeable travel advisor for Elite Tripps, a personalized travel planning service. Your name is the Elite Tripps Assistant.

You help visitors with:
- Cruises, all-inclusive resorts, group trips, honeymoons, beach getaways, family vacations, Europe trips, girls trips, and destination weddings
- Questions about destinations, budgets, travel dates, and trip types
- Guiding them toward submitting an inquiry at www.elitetripps.com

Your tone is:
- Warm, conversational, and encouraging
- Like a knowledgeable friend who happens to be a travel expert
- Never robotic or overly formal

Key rules:
- Keep responses concise, 2 to 4 sentences maximum
- Always end with a gentle next step or question to keep the conversation moving
- If someone is ready to book or wants a plan, direct them to fill out the inquiry form at www.elitetripps.com/#inquiry-form
- Never make up specific prices or guarantee availability
- If you do not know something, say so honestly and suggest they reach out directly`;

const conversations = new Map();

app.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const sid = sessionId || 'default';
    if (!conversations.has(sid)) conversations.set(sid, []);
    const history = conversations.get(sid);

    history.push({ role: 'user', content: message });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: history
    });

    const reply = response.content[0].text;
    history.push({ role: 'assistant', content: reply });

    if (history.length > 20) history.splice(0, 2);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => res.send('Elite Tripps backend is running.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
