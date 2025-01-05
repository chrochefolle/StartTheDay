const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs'); // Pour écrire dans un fichier
const { exec } = require('child_process');

async function capturePage() {
  const browser = await puppeteer.launch({
    headless: true,  // Pas d'interface graphique
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Pour éviter des problèmes sur certains serveurs
  });

  const page = await browser.newPage();

  // Créer un fichier pour stocker les erreurs de la console
  const errorLogPath = path.join(__dirname, 'console-errors.txt');
  const errorLogStream = fs.createWriteStream(errorLogPath, { flags: 'a' }); // Ouvrir en mode "append"

  // Ajouter un gestionnaire pour les messages de la console
  page.on('console', (msg) => {
    const msgText = msg.text();
    console.log(msgText);  // Affiche dans la console
    errorLogStream.write(`${new Date().toISOString()} - ${msgText}\n`);  // Sauvegarde dans le fichier
  });

  // Définir les dimensions pour un format mobile
  await page.setViewport({
    width: 375,    // Largeur d'un smartphone type iPhone 6
    height: 667,   // Hauteur d'un smartphone type iPhone 6
    isMobile: true,  // Mode mobile
  });

  // Ouvrir la page web à capturer
  await page.goto('http://localhost:8080/StartOfTheDay/', {
    waitUntil: 'networkidle2', // Attendre que la page soit complètement chargée
  });

  // Attendre un certain temps (en millisecondes)
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 90000)));

  // Définir le chemin de destination
  const userHome = process.env.HOME || process.env.USERPROFILE; // Dossier utilisateur
  const photosDir = path.join(userHome, 'Pictures'); // Dossier "Photos" (~/Pictures)

  // Ajouter un horodatage au nom du fichier
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Remplace ":" et "." par "-"
  const filePath = path.join(photosDir, `screenshot-${timestamp}.png`);

  // Capturer la page en image (au format PNG)
  await page.screenshot({
    path: filePath, // Enregistrer dans le fichier
    fullPage: true, // Capturer toute la page
  });

  console.log(`Page capturée avec succès dans : ${filePath}`);

  // Importer l'image dans Photos (macOS uniquement)
  exec(`osascript -e 'tell application "Photos" to import POSIX file "${filePath}"'`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'import dans Photos : ${error.message}`);
      return;
    }
    console.log('Image importée dans Photos avec succès !');
  });

  await browser.close();
  errorLogStream.end(); // Fermer le fichier après la fin
}

capturePage().catch(console.error);