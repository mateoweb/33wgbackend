import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/recommendation', async (req, res) => {
  const { answers } = req.body;
  const prompt = buildPrompt(answers);

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const response = JSON.parse(chat.choices[0].message.content);
    res.json(response);
  } catch (err) {
    console.error('Erreur OpenAI :', err.message);
    res.status(500).json({ error: 'Erreur IA' });
  }
});

function buildPrompt(answers) {
  const formatted = answers.map(a => `- ${a.question} : ${a.answer}`).join('\n');

  return `
Tu es un sommelier IA expert en recommandations personnalisées. Voici les réponses de l'utilisateur :
${formatted}

Analyse-les et propose un vin réel, adapté, bluffant, selon ces critères. Réponds au format JSON suivant :

{
  "name": "Nom complet du vin",
  "description": "Une phrase élégante et vendeuse",
  "grape": "Cépage principal",
  "country": "Pays",
  "price": "Prix estimé ou fourchette",
  "url": "https://www.vivino.com/..."
}
`.trim();
}

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Serveur actif sur http://localhost:${port}`);
});
