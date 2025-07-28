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

    const content = chat.choices?.[0]?.message?.content?.trim();

    // Vérifie que la réponse contient un JSON
    if (!content || !content.includes('{') || !content.includes('}')) {
      throw new Error("Contenu IA vide ou mal formé");
    }

    let response;
    try {
      response = JSON.parse(content);
    } catch (err) {
      console.error('❌ Échec du parsing JSON IA :', content);
      return res.status(500).json({ error: 'Réponse IA invalide' });
    }

    res.json(response);
  } catch (err) {
    console.error('❌ Erreur OpenAI :', err.message);
    res.status(500).json({ error: 'Erreur IA' });
  }
});

function buildPrompt(answers) {
  const formattedAnswers = answers.map(a => `- ${a.question} : ${a.answer}`).join('\n');

  return `
Tu es un sommelier IA expert. En analysant les réponses ci-dessous, tu dois recommander un vin réel facilement trouvable sur Vivino, qui correspond parfaitement aux goûts exprimés.

Voici les réponses de l'utilisateur :
${formattedAnswers}

Ta réponse doit obligatoirement être au format JSON strict comme ci-dessous, sans aucun texte autour :

{
  "name": "Nom complet du vin (ex : Château Margaux 2015)",
  "description": "Une phrase élégante qui donne envie (max 25 mots)",
  "grape": "Cépage principal (ex : Pinot Noir, Chardonnay...)",
  "country": "Pays (ex : France, Italie...)",
  "price": "Prix moyen ou fourchette (ex : 25-35€)",
  "url": "Lien direct vers Vivino (https://www.vivino.com/...)"
}

Respecte impérativement ce format et ne réponds que par ce JSON, sans texte en dehors ni retour à la ligne inutile.
`.trim();
}

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Serveur actif sur http://localhost:${port}`);
});
