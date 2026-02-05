# 🚀 GUIDE DÉPLOIEMENT NAYA NOTION PROXY
*Déploiement Vercel + Configuration ChatGPT Actions*

---

## 📋 PRÉREQUIS

- [ ] Compte Vercel (gratuit) : https://vercel.com/signup
- [ ] Token Notion (intégration "Naya X" créée précédemment)
- [ ] GPT Naya X existant dans ChatGPT
- [ ] Tous les fichiers du proxy téléchargés

---

## PARTIE 1 : DÉPLOIEMENT VERCEL (10 min)

### Étape 1 : Créer compte Vercel

1. Va sur https://vercel.com/signup
2. **Inscris-toi avec GitHub** (recommandé) ou email
3. Valide ton compte

### Étape 2 : Préparer les fichiers

1. **Crée un dossier** sur ton Mac : `naya-notion-proxy`
2. **Télécharge tous les fichiers** que je t'ai donnés :
   - `package.json`
   - `.env.example`
   - `vercel.json`
   - `api/search.js`
   - `api/read.js`
   - `api/extract.js`

3. **Structure finale** :
```
naya-notion-proxy/
├── package.json
├── vercel.json
├── .env.example
└── api/
    ├── search.js
    ├── read.js
    └── extract.js
```

### Étape 3 : Initialiser Git (si pas déjà fait)

Ouvre le Terminal dans le dossier `naya-notion-proxy` :

```bash
git init
git add .
git commit -m "Initial commit - Naya Notion Proxy"
```

### Étape 4 : Créer repository GitHub

**Option A : Via GitHub Desktop**
1. Ouvre GitHub Desktop
2. File → Add Local Repository
3. Sélectionne le dossier `naya-notion-proxy`
4. Publish repository (Public ou Private, peu importe)

**Option B : Via ligne de commande**
```bash
# Créer repo sur GitHub d'abord, puis :
git remote add origin https://github.com/TON-USERNAME/naya-notion-proxy.git
git branch -M main
git push -u origin main
```

### Étape 5 : Déployer sur Vercel

1. Va sur https://vercel.com/new
2. **Import Git Repository**
3. Sélectionne ton repo `naya-notion-proxy`
4. **Configure Project** :
   - Framework Preset : **Other**
   - Root Directory : `./`
   - Build Command : (laisse vide)
   - Output Directory : (laisse vide)

5. **Environment Variables** (IMPORTANT !) :
   ```
   NOTION_API_KEY = secret_VOTRE_TOKEN_NOTION_ICI
   NOTION_VERSION = 2022-06-28
   ```
   
   ⚠️ **Remplace** `secret_VOTRE_TOKEN_NOTION_ICI` par ton vrai token !

6. Clique **Deploy**

⏳ **Attends 1-2 minutes...**

✅ **Déploiement terminé !** Note ton URL : `https://ton-projet-xxx.vercel.app`

---

## PARTIE 2 : TESTER LE PROXY (5 min)

### Test 1 : Endpoint Search

Dans ton navigateur :
```
https://ton-projet-xxx.vercel.app/api/search?query=Marc
```

**✅ Résultat attendu** : JSON avec des pages Notion et leur contenu

### Test 2 : Endpoint Read

```
https://ton-projet-xxx.vercel.app/api/read?page_id=ID_UNE_PAGE
```

(Remplace `ID_UNE_PAGE` par un ID du test précédent)

### Test 3 : Endpoint Extract

```
https://ton-projet-xxx.vercel.app/api/extract?doc_name=posts&keywords=hooks,métaphores
```

**Si les 3 tests passent → Proxy opérationnel !** 🎉

---

## PARTIE 3 : CONFIGURER CHATGPT ACTIONS (10 min)

### Étape 1 : Ouvrir ton GPT Naya X

1. Va sur https://chat.openai.com
2. Sidebar → "Explore GPTs"
3. Clique sur **Naya X**
4. En haut à droite → **Edit GPT**

### Étape 2 : Remplacer le schema Actions

1. Scroll jusqu'à **Actions**
2. **Efface complètement** l'ancien schema
3. **Ouvre le fichier** `naya-proxy-openapi.json`
4. **IMPORTANT** : Remplace `https://VOTRE-PROJET.vercel.app` par ton URL Vercel réelle
5. **Copie tout** le contenu modifié
6. **Colle** dans le champ Schema
7. Clique **Format**

### Étape 3 : Supprimer l'ancienne authentication

1. Dans **Authentication** → Supprime la config "Clé API" / "Bearer"
2. Sélectionne **None** (Aucune)

**Pourquoi ?** Le proxy gère déjà l'auth Notion côté serveur !

### Étape 4 : Sauvegarder

1. Clique **Update** en haut à droite
2. Ton GPT Naya X est maintenant connecté au proxy !

---

## PARTIE 4 : TESTER NAYA AVEC LE PROXY (5 min)

### Test 1 : Recherche simple

Ouvre une conversation avec Naya X :
```
Recherche "Marc profile" dans Notion et résume ses super-pouvoirs
```

**✅ Attendu** : Naya trouve et résume le document complet, même s'il est volumineux !

### Test 2 : Lecture page spécifique

```
Lis la page "Posts Références Marc" et donne-moi les patterns narratifs gagnants
```

**✅ Attendu** : Naya lit le document entier et extrait l'info

### Test 3 : Extraction ciblée

```
Dans le document "bridge Neo Naya", cherche les sections sur "workflow" et "collaboration"
```

**✅ Attendu** : Naya extrait uniquement les sections pertinentes

---

## 🎉 FÉLICITATIONS !

**Naya X est maintenant 100% opérationnelle avec :**

✅ Accès complet à tous tes documents Notion
✅ Pas de limite de taille (documents volumineux gérés)
✅ 3 modes de recherche :
   - Recherche globale
   - Lecture page complète
   - Extraction par mots-clés
✅ Déploiement gratuit sur Vercel
✅ Totalement autonome

---

## 🔧 MAINTENANCE & TROUBLESHOOTING

### Mettre à jour le proxy

1. Modifie les fichiers localement
2. Commit + push sur GitHub
3. Vercel redéploie automatiquement !

### Voir les logs d'erreur

1. Dashboard Vercel : https://vercel.com/dashboard
2. Ton projet → **Deployments**
3. Clique sur le dernier déploiement
4. Onglet **Functions** → Logs en temps réel

### Changer le token Notion

1. Dashboard Vercel → Ton projet
2. **Settings** → **Environment Variables**
3. Modifie `NOTION_API_KEY`
4. **Save** → Redéploiement automatique

### Augmenter les limites

Free tier Vercel :
- ✅ 100 Go bandwidth/mois
- ✅ 100 GB-Hours compute/mois
- ✅ Largement suffisant pour usage personnel

Si tu dépasses → Upgrade à 20$/mois (improbable)

---

## 📊 UTILISATION OPTIMALE NAYA

### Commandes efficaces

**Recherche large** :
```
Cherche tout ce qui parle de "copywriting vibratoire"
```

**Lecture précise** :
```
Lis entièrement le document X et donne-moi la section Y
```

**Extraction multi-keywords** :
```
Dans "posts références", trouve tout ce qui mentionne "hooks, métaphores, CTA"
```

### Naya comprend le contexte

Elle peut maintenant :
- Lire des documents de 10 000+ mots
- Combiner infos de plusieurs sources
- Créer du contenu basé sur tes guidelines complètes
- Respecter ton ADN créatif intégral

---

## 🚀 PROCHAINES ÉTAPES

**Tu peux maintenant** :

1. **Tester Naya à fond** pendant les prochains jours
2. **Créer du contenu** avec accès complet à ton écosystème
3. **Valider le workflow** Neo X ↔ Naya X
4. **Itérer** si besoin d'améliorations

**Si tu veux ajouter des features** :
- Endpoint pour créer des pages Notion
- Endpoint pour mettre à jour du contenu
- Cache pour accélérer les requêtes fréquentes
- Webhooks pour notifications

**Dis-moi si tu veux que je code ça !** 🔥

---

*Guide Déploiement Naya Proxy v1.0 | Vercel + ChatGPT Actions | Solution pérenne*
