# Configuration du Projet

## Étapes pour Configurer les Variables Sensibles

1. Créez un fichier `config.js` dans le dossier principal :
   ```javascript
   const config = {
     weatherApiKey: 'VOTRE_CLE_API',
     cities: ['Niort', 'Toul', 'Paris', 'Nonthaburi', 'Antsirabe'],
     googleSheetApiUrl: 'https://script.google.com/macros/s/VOTRE_URL/exec'
   };

   export default config;

   ---

### Avantages
1. Les informations sensibles restent en local et ne sont pas partagées sur Git.
2. Les collaborateurs peuvent facilement configurer leur environnement grâce à la documentation.