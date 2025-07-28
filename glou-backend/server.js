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
  const preferences = answers.map(a => `- ${a.question} : ${a.answer}`).join('\n');

  return `
Tu es un sommelier virtuel haut de gamme. Ton rôle est de conseiller un vin parfaitement adapté à l'utilisateur, en tenant compte de ses goûts, de ses habitudes et de ses attentes.

Voici les réponses de l’utilisateur :
${preferences}

Ta mission : analyser ces réponses comme un expert et recommander un vin réel, disponible sur Vivino, qui va **épater**, **séduire** et **correspondre parfaitement** à ce profil.

Tu dois :
- Identifier un vin pertinent, cohérent, pas hors budget.
- Rédiger une **description élégante, percutante et personnalisée**, comme un sommelier qui veut vraiment faire plaisir. Sois convaincant, jamais générique.
- Fournir un lien Vivino **valide et direct**, sans encodage bizarre.
- Formater ta réponse en **JSON lisible**, sans texte autour.

Réponds dans ce format précis :

{
  "name": "Nom complet du vin",
  "description": "Recommandation personnalisée, élégante, engageante (2 à 3 phrases).",
  "grape": "Cépage principal",
  "country": "Pays d’origine",
  "price": "Fourchette de prix estimée (ex : 15-20€)",
  "url": "Lien direct vers la page Vivino"
}
`.trim();
}


const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`✅ Serveur actif sur http://localhost:${port}`);
});
