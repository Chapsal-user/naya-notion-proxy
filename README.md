# Naya Notion Proxy 🔥

API proxy serverless pour connecter Naya X (GPT custom) à Notion sans limitations de taille.

## 🎯 Problème résolu

L'API Notion officielle retourne une erreur `ResponseTooLargeError` pour les documents volumineux (>5000 mots). Ce proxy lit les documents en chunks et les résume intelligemment pour ChatGPT.

## ⚡ Fonctionnalités

- ✅ **Recherche intelligente** : Trouve et lit le contenu complet des pages
- ✅ **Lecture récursive** : Gère les blocs imbriqués à tous les niveaux
- ✅ **Résumé automatique** : Condense les documents >5000 mots
- ✅ **Extraction ciblée** : Trouve des sections par mots-clés
- ✅ **Pas de limite de taille** : Documents de 10 000+ mots supportés
- ✅ **Déploiement gratuit** : Serverless sur Vercel

## 🛠️ Stack Technique

- **Runtime** : Node.js 18+
- **Framework** : Vercel Serverless Functions
- **API Client** : @notionhq/client v2.2.15
- **Déploiement** : Vercel (gratuit)

## 📁 Structure

```
naya-notion-proxy/
├── api/
│   ├── search.js      # Recherche + lecture complète
│   ├── read.js        # Lecture page spécifique
│   └── extract.js     # Extraction par mots-clés
├── package.json
├── vercel.json
└── GUIDE_DEPLOIEMENT.md
```

## 🚀 Déploiement Rapide

1. **Clone ce repo**
```bash
git clone https://github.com/TON-USERNAME/naya-notion-proxy.git
cd naya-notion-proxy
```

2. **Configure les variables d'environnement**
```bash
# Vercel Dashboard → Settings → Environment Variables
NOTION_API_KEY=secret_VOTRE_TOKEN
NOTION_VERSION=2022-06-28
```

3. **Déploie sur Vercel**
```bash
npx vercel --prod
```

4. **Configure ChatGPT Actions**
   - Importe `naya-proxy-openapi.json`
   - Remplace l'URL par ton URL Vercel
   - Authentication: None

## 📡 Endpoints API

### `/api/search`

Recherche et lit le contenu complet des pages.

**Paramètres** :
- `query` (string, required) : Terme de recherche
- `limit` (integer, optional) : Nombre de résultats (défaut: 10)

**Exemple** :
```bash
GET https://ton-projet.vercel.app/api/search?query=Marc&limit=5
```

**Réponse** :
```json
{
  "success": true,
  "query": "Marc",
  "results_count": 3,
  "results": [
    {
      "id": "...",
      "title": "Marc Profile Master",
      "url": "https://notion.so/...",
      "content": "# IDENTITÉ...",
      "content_length": 12450,
      "truncated": true
    }
  ]
}
```

### `/api/read`

Lit une page complète avec organisation par sections.

**Paramètres** :
- `page_id` (string, required) : ID de la page
- `section` (string, optional) : Filtre par section

**Exemple** :
```bash
GET https://ton-projet.vercel.app/api/read?page_id=abc123&section=workflow
```

### `/api/extract`

Extrait les sections contenant des mots-clés spécifiques.

**Paramètres** :
- `doc_name` (string, required) : Nom du document
- `keywords` (string, required) : Mots-clés séparés par virgules

**Exemple** :
```bash
GET https://ton-projet.vercel.app/api/extract?doc_name=posts&keywords=hooks,métaphores,CTA
```

## 🔒 Sécurité

- Le token Notion est stocké côté serveur (Vercel Environment Variables)
- Pas d'authentification nécessaire côté ChatGPT (déjà sécurisé)
- CORS activé pour permettre les appels depuis ChatGPT
- Rate limiting géré par Vercel (100 requêtes/min gratuit)

## 📊 Limites & Performance

**Vercel Free Tier** :
- 100 Go bandwidth/mois
- 100 GB-Hours compute/mois
- 10s max execution time
- Largement suffisant pour usage personnel

**Notion API Limits** :
- 3 requests/second
- Géré automatiquement par le client officiel

## 🐛 Troubleshooting

### "Error 500: Failed to read page"
→ Vérifie que l'intégration Notion a accès à la page

### "Error 401: Unauthorized"
→ Vérifie le token dans Vercel Environment Variables

### "Content truncated"
→ Normal pour documents >5000 mots, le résumé est intelligent

### Logs détaillés
```bash
# Dashboard Vercel → Deployments → Functions → Logs
```

## 🔄 Mises à jour

Le proxy se redéploie automatiquement à chaque push sur GitHub !

```bash
git add .
git commit -m "Update proxy"
git push
# Vercel redéploie automatiquement 🎉
```

## 📝 Licence

MIT - Utilise comme tu veux !

## 🙏 Crédits

Créé pour Marc par Claude (Anthropic) 🔥  
Optimisé pour Naya X (GPT-4o) ✨

---

**Pour le guide complet de déploiement, voir `GUIDE_DEPLOIEMENT.md`**
