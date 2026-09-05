# 🚀 Déployer VISITRADE (Étape 1)

Objectif : passer du lien temporaire (tunnel) à une **vraie URL permanente** qui
reste en ligne 24/7, même ton Mac éteint. Le code est déjà prêt (build vérifié,
git initialisé). Il te reste 3 actions.

---

## 1. Mettre le code sur GitHub

1. Va sur [github.com/new](https://github.com/new) → crée un repo **privé** nommé `visitrade` (sans README, sans .gitignore — le projet en a déjà).
2. GitHub t'affiche une URL type `https://github.com/TON-PSEUDO/visitrade.git`.
3. Dans le terminal :

```bash
cd ~/visitrade
git remote add origin https://github.com/TON-PSEUDO/visitrade.git
git push -u origin main
```

*(GitHub peut te demander de te connecter — suis les instructions à l'écran.)*

---

## 2. Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com) → **Sign up** avec ton compte GitHub.
2. **Add New… → Project** → sélectionne le repo `visitrade`.
3. Vercel détecte Next.js automatiquement → clique **Deploy** (ne touche à rien).
4. Après ~1 min : tu as une URL en ligne, type `visitrade.vercel.app` 🎉

À ce stade, le site est **en ligne en permanence, en mode démo** (crypto + données réelles fonctionnent déjà ; comptes/IA en démo tant qu'on ne branche pas les clés à l'étape suivante).

---

## 3. Ajouter les variables d'environnement (au fur et à mesure)

Dans Vercel : **Settings → Environment Variables**. Ajoute-les quand tu les as, puis **Redeploy** :

```
# Étape 3 — Vraie IA (quand tu auras ta clé Anthropic)
ANTHROPIC_API_KEY = sk-ant-...

# Étape 2 — Comptes réels (voir SUPABASE_SETUP.md)
NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = ...
SUPABASE_SERVICE_ROLE_KEY = ...

# Lien utilisé dans les emails
NEXT_PUBLIC_APP_URL = https://visitrade.vercel.app
```

> ℹ️ **Données de marché** : le temps réel est le comportement par défaut — crypto via CoinGecko, indices et matières premières via Yahoo Finance, sans clé ni variable à configurer. Ajoute `MARKET_DATA_PROVIDER = mock` **uniquement** si tu veux forcer les données simulées.

---

## Ensuite
Une fois le site déployé, dis-moi **« c'est déployé »** avec ton URL Vercel, et on passe à **l'étape 2 (Supabase — vrais comptes)**.

Pour mettre à jour le site plus tard : je modifie le code → `git push` → Vercel redéploie tout seul.
