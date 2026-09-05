# Activer les paiements réels (Stripe)

Tant que `STRIPE_SECRET_KEY` est absente, VISITRADE tourne en **mode démo** :
choisir un plan l'accorde immédiatement, sans paiement. Rien à faire pour
tester le produit. Ce qui suit sert à encaisser réellement.

## 1. Créer les produits dans Stripe

Stripe → Catalogue de produits → deux produits, chacun avec un tarif
récurrent mensuel (et annuel si vous le proposez) :

| Produit | Mensuel | Annuel (facturé à l'année) |
|---|---|---|
| VISITRADE Pro | 29 € | 19 €/mois → 228 € |
| VISITRADE Elite | 79 € | 49 €/mois → 588 € |

Notez les identifiants de tarif (`price_...`) : c'est eux qu'attend l'application,
pas les identifiants de produit.

## 2. Déclarer le webhook

Stripe → Développeurs → Webhooks → « Ajouter un point de terminaison ».

- URL : `https://VOTRE-DOMAINE/api/billing/webhook`
- Événements : `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`

Copiez la clé de signature (`whsec_...`).

> C'est le webhook, et lui seul, qui écrit le plan d'un compte. Revenir sur
> l'URL de succès ne donne aucun droit : sans signature Stripe valide, rien
> n'est accepté.

## 3. Renseigner les variables

Sur Vercel (Settings → Environment Variables), puis redéployer :

```
STRIPE_SECRET_KEY=sk_live_... (ou sk_test_... pour commencer)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ELITE=price_...
STRIPE_PRICE_PRO_YEARLY=price_...      # optionnel
STRIPE_PRICE_ELITE_YEARLY=price_...    # optionnel
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Supabase → Settings → API
```

`SUPABASE_SERVICE_ROLE_KEY` est indispensable : le webhook arrive sans
utilisateur connecté, il ne peut donc pas écrire à travers la RLS. Cette clé
ne doit jamais être préfixée `NEXT_PUBLIC_` ni utilisée ailleurs.

## 4. Passer le SQL

Dans Supabase → SQL Editor, exécuter [`supabase/schema.sql`](supabase/schema.sql)
(ré-exécutable sans risque). Il ajoute au profil les colonnes d'abonnement
(`stripe_customer_id`, `plan_status`, `plan_renews_at`…) que le webhook
alimente.

## 5. Vérifier

Avec les clés de test et la CLI Stripe :

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Payez un abonnement avec la carte `4242 4242 4242 4242`. Attendu :

1. Retour sur `/settings?upgraded=pro` avec « activation en cours ».
2. Le webhook reçoit `checkout.session.completed` et écrit le plan.
3. La page bascule seule sur **Pro**, avec la date de renouvellement.
4. « Gérer mon abonnement » ouvre le portail Stripe (facture, résiliation).

## Ce qui se passe ensuite, tout seul

- **Résiliation** : le plan reste actif jusqu'à la fin de la période payée,
  puis `customer.subscription.deleted` le ramène à Free.
- **Impayé** : `past_due` ne coupe pas l'accès — Stripe relance, et ne
  déclenche la bascule vers Free que si l'échec persiste.
- **Changement de formule** depuis le portail : `customer.subscription.updated`
  met le plan à jour dans la foulée.
