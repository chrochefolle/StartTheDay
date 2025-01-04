import config from './config.js';

const weatherApiKey = config.weatherApiKey;
const cities = config.cities;
const googleSheetApiUrl = config.googleSheetApiUrl;


async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fr&appid=${weatherApiKey}`;
  const response = await fetch(url);
  return response.json();
}

async function displayWeather() {
  const weatherContainer = document.getElementById('weather-data');
  for (const city of cities) {
    const weatherData = await fetchWeather(city);
    const weatherRoundTemp = Math.round(weatherData.main.temp);
    const weatherFeltTemp = Math.round(weatherData.main.feels_like);

    const weatherHtml = `
      <p>
        <strong>${city}:</strong> ${weatherData.weather[0].description}, 
        ${weatherRoundTemp}°C,<br> ressenti ${weatherFeltTemp}°C
      </p>`;
    weatherContainer.innerHTML += weatherHtml;
  }
}

async function fetchQuote() {
  const response = await fetch(googleSheetApiUrl);
  const quotes = await response.json();
  
  const today = new Date().toISOString().split('T')[0];
  const todayQuote = quotes.find(quote => {
    const quoteDate = new Date(quote.date);
    console.log(quoteDate);
    return !isNaN(quoteDate) && quoteDate.toISOString().split('T')[0] === today;
  });
  console.log(todayQuote);
  const availableQuotes = quotes.filter(quote => quote.date === '');

  let randomQuote;
  if (!todayQuote) {
    randomQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    console.log(randomQuote.citation);
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

async function displayQuote() {
  const quoteData = await fetchQuote();
  console.log(quoteData);
  document.getElementById('quote-text').textContent = `"${quoteData.citation}"`;
  document.getElementById('quote-author').textContent = `- ${quoteData.auteur}`;

  const prompt = `une représentation artistique empreinte de sérénité et de joie, sans texte sur l'image, inspirée de la citation : ${quoteData.citation}`;
  console.log(prompt);
  const image = await fetchGeneratedImage(prompt);
  document.getElementById('quote-image').src = image.url;
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

async function displayWord() {
  const wordData = await fetchWord();
  document.getElementById('word-text').textContent = `${wordData.mot}`;
  document.getElementById('word-definition').textContent = `${wordData.definition}`;
}

async function fetchGeneratedImage(text) {
    const response = await fetch('http://localhost:3000/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    });
    return response.json();
  }

document.addEventListener('DOMContentLoaded', async () => {
  await displayWeather();
  await displayQuote();
  await displayWord();
});