require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}
app.use(cors(corsOptions)) // Use this after the variable declaration

app.use(bodyParser.json());

app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).send({ error: 'Le prompt est requis.' });
  }

  console.log(prompt);
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024"
    });

    const imageUrl = response.data[0].url; // Vérifiez la structure de la réponse
    res.send({ url: imageUrl });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).send({ error: 'Erreur lors de la génération de l\'image.' });
  }
});

app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});