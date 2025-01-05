import config from './config.js';

const weatherApiKey = config.weatherApiKey;
const cities = config.cities;
const googleSheetApiUrl = config.googleSheetApiUrl;

async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fr&appid=${weatherApiKey}`;
  const response = await fetch(url);
  return response.json();
}

async function fetchSunTimes(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return { sunrise, sunset };
}

/**
 * Fonction pour récupérer le saint du jour à partir du fichier saints.json
 */
async function fetchSaintOfTheDay() {
  try {
      // Obtenir la date actuelle
      const today = new Date();
      const day = today.getDate(); // Jour du mois
      const month = today.toLocaleString('default', { month: 'long' }).toLowerCase(); // Mois en français, minuscule

      // Charger le fichier JSON
      const response = await fetch('./js/saints.json');
      if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status} ${response.statusText}`);
      }

      // Lire la réponse sous forme de texte pour le debug
      const responseClone = await response.clone().text();
      //console.log("Contenu brut du JSON :", responseClone); // Debug : Afficher le contenu brut

      const saints = await response.json();

      // Vérifier si le mois existe dans le fichier
      if (!saints[month]) {
          console.error(`Mois "${month}" non trouvé dans le fichier JSON.`);
          return "Saint inconnu";
      }

      // Obtenir l'entrée du saint pour le jour courant
      const saintEntry = saints[month][day - 1]; // day - 1 car les tableaux commencent à l'indice 0
      if (!saintEntry) {
          console.error(`Jour "${day}" non trouvé pour le mois "${month}".`);
          return "Saint inconnu";
      }

      // Récupérer le nom et la catégorie du saint
      const [name, category] = saintEntry;
      return category ? `${category} ${name}` : name; // Combiner catégorie et nom si applicable
  } catch (error) {
      console.error("Erreur lors de la récupération du saint du jour :", error);
      return "Saint non disponible";
  }
}

/**
* Fonction pour afficher le saint du jour dans le DOM
*/
async function displaySaintOfTheDay() {
  const saintOfTheDay = await fetchSaintOfTheDay();
  document.getElementById('saint').textContent = `Saint du jour : ${saintOfTheDay}`;
}


async function displayAdditionalInfo() {
  // Afficher la date du jour
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  document.getElementById('today-date').textContent = `Nous sommes le ${formattedDate}`;

 
}

async function displayWeather() {
  const weatherContainer = document.getElementById('weather-data');

  const weatherDataArray = await Promise.all(
    cities.map(async (city) => {
      const weatherData = await fetchWeather(city);
       // Afficher le lever et coucher du soleil à Paris
      const sunTimes = await fetchSunTimes(city);
      return {
        city,
        description: weatherData.weather[0].description,
        temp: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        sunset: sunTimes.sunset,
        sunrise:  sunTimes.sunrise
      };
    })
  );

  weatherDataArray.sort((a, b) => a.feelsLike - b.feelsLike);

  weatherContainer.innerHTML = '';
  weatherDataArray.forEach(({ city, description, temp, feelsLike,sunset,sunrise }) => {
    const weatherHtml = `
      <p>
        <strong>${city}:</strong> ${description}, 
        ${temp}°C,<br> ressenti ${feelsLike}°C,☼↗ ${sunrise} ☼↘ ${sunset}
      </p>`;
    weatherContainer.innerHTML += weatherHtml;
  });
}

async function fetchWord() {
  const response = await fetch(`${googleSheetApiUrl}?sheet=Mots`);
  const words = await response.json();

  const today = new Date().toISOString().split('T')[0];
  const todayWord = words.find(word => word.date === today);
  const availableWords = words.filter(word => word.date === '');

  let randomWord;
  if (!todayWord) {
    randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    await fetch(`${googleSheetApiUrl}?sheet=Mots`, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mot: randomWord.mot, date: today })
    });
  } else {
    randomWord = todayWord;
  }

  randomWord.date = today;

  return randomWord;
}

async function fetchQuote() {
  const response = await fetch(googleSheetApiUrl);
  const quotes = await response.json();
  
  const today = new Date().toISOString().split('T')[0];
  const todayQuote = quotes.find(quote => {
    const quoteDate = new Date(quote.date);
    return !isNaN(quoteDate) && quoteDate.toISOString().split('T')[0] === today;
  });

  const availableQuotes = quotes.filter(quote => quote.date === '');

  let randomQuote;
  if (!todayQuote) {
    randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    await fetch(googleSheetApiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citation: randomQuote.citation, date: today })
    });
  } else {
    randomQuote = todayQuote;
  }

  randomQuote.date = today;

  return randomQuote;
}


async function displayWord() {
  const wordData = await fetchWord();
  document.getElementById('word-text').textContent = `${wordData.mot}`;
  document.getElementById('word-definition').textContent = `${wordData.definition}`;
}

async function fetchGeneratedImage(text) {
  const response = await fetch('http://localhost:3000/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: text }),
  });
  return response.json();
}

async function displayQuote() {
  const quoteData = await fetchQuote();
  document.getElementById('quote-text').textContent = `"${quoteData.citation}"`;
  document.getElementById('quote-author').textContent = `- ${quoteData.auteur}`;

  const prompt = `une représentation artistique empreinte de sérénité et de joie, sans texte sur l'image, inspirée de la citation : ${quoteData.citation}`;
  const image = await fetchGeneratedImage(prompt);
  document.getElementById('quote-image').src = image.url;
}


async function fetchWordOfTheDay() {
  try {
    const response = await fetch('./js/words.json');
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status} ${response.statusText}`);
    }
    const words = await response.json();

    const dayOfYear = new Date().getDate() - 1; // Jour de l'année (0-364)

    // Vérifiez que les tableaux existent et ne sont pas vides
    if (!words.français || words.français.length === 0) {
      throw new Error("La liste de mots en français est vide ou non disponible.");
    }
    if (!words.thaï || words.thaï.length === 0) {
      throw new Error("La liste de mots en thaï est vide ou non disponible.");
    }
    if (!words.malgache || words.malgache.length === 0) {
      throw new Error("La liste de mots en malgache est vide ou non disponible.");
    }

    // Calcul de l'index avec le modulo pour éviter de dépasser les limites
    const index = dayOfYear % words.français.length;

    console.log("Index calculé :", index);
//    console.log("Mots en français :", words.français);
//    console.log("Mots en thaï :", words.thaï);
//    console.log("Mots en malgache :", words.malgache);

    // Récupérer les mots pour chaque langue avec des vérifications supplémentaires
    const frenchWord = words.français[index] || "Mot introuvable";
    const thaiWord = words.thaï[index]?.word || "Mot introuvable";
    const thaiPronunciation = words.thaï[index]?.pronunciation || "";
    const malagasyWord = words.malgache[index] || "Mot introuvable";



    // Afficher les mots dans le DOM
    document.getElementById('french-word').textContent = frenchWord;
    document.getElementById('thai-word').innerHTML = `${thaiWord} (<span class="pronunciation">${thaiPronunciation}</span>)`;
    document.getElementById('malagasy-word').textContent = malagasyWord;
  } catch (error) {
    console.error("Erreur dans fetchWordOfTheDay :", error);
    document.getElementById('french-word').textContent = "Erreur : mot non disponible";
    document.getElementById('thai-word').textContent = "Erreur : mot non disponible";
    document.getElementById('malagasy-word').textContent = "Erreur : mot non disponible";
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await displayAdditionalInfo();
  await displaySaintOfTheDay();
  await displayWeather();
  await displayWord();
  await fetchWordOfTheDay();
  await displayQuote();
});