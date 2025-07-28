import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/recommendation', async (req, res) => {
  const { answers } = req.body;
  const prompt = buildPrompt(answers);

  try {
    const chat = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  temperature: 0.7,
  messages: [{ role: 'user', content: prompt }]
});

    });

    const result = chat.choices[0].message.content.trim();
    let response;

    try {
      response = JSON.parse(result);
    } catch {
      return res.status(500).json({ error: 'Réponse IA invalide' });
    }

    res.json(response);
  } catch (err) {
    console.error('❌ Erreur OpenAI :', err.message);
    res.status(500).json({ error: 'Erreur IA' });
  }
});

function buildPrompt(answers) {
  const essentialInfo = answers.map((a) => `- ${a.question} : ${a.answer}`).join('\n');

  return `
Tu es un sommelier IA expert. En te basant sur les préférences suivantes, propose un vin réellement existant, facilement trouvable sur Vivino, et parfaitement adapté aux goûts de l'utilisateur. Formate ta réponse en JSON, sans explication.

Préférences :
${essentialInfo}

Réponds au format :

{
  "name": "Nom du vin",
  "description": "Phrase élégante qui donne envie",
  "grape": "Cépage principal",
  "country": "Pays",
  "price": "Fourchette de prix",
  "url": "Lien Vivino"
}
`.trim();
}

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Serveur actif sur http://localhost:${port}`);
});
