# 📖 La grande documentation de NutriCare (expliquée très, très simplement)

> Ce document explique **tout le projet** comme si tu avais 8 ans.
> On va utiliser beaucoup d'images et d'exemples de la vraie vie. 🍎

---

## 🏥 C'est quoi NutriCare ?

Imagine un **cabinet de docteur de la nourriture** (on appelle ça un **nutritionniste**).
Quand tu manges mal, tu vas le voir et il te dit : *« Mange plus de légumes, moins de bonbons ! »*

NutriCare, c'est ce cabinet, mais **dans l'ordinateur** 💻. 

Il y a **deux types de personnes** qui utilisent NutriCare :

| Qui ? | Ce qu'il fait | Exemple |
|-------|---------------|---------|
| 🧑 **Le patient** | Prend des rendez-vous, regarde son plan de repas | « Je veux voir ce que je dois manger lundi » |
| 👩‍⚕️ **Le nutritionniste** (l'admin) | Voit tous les patients, crée des plans de repas | « Je crée un menu pour Sophie » |

---

## 🧱 Les 2 grandes parties du projet

Notre application est comme un **restaurant** 🍽️ :

```
   ┌────────────────────────┐         ┌────────────────────────┐
   │      LE FRONTEND        │         │       LE BACKEND        │
   │   (la salle à manger)   │ ──────► │       (la cuisine)      │
   │                         │ ◄────── │                         │
   │  Ce que tu VOIS et      │         │  Ce qui prépare les     │
   │  touches : boutons,     │         │  données en cachette :  │
   │  couleurs, textes       │         │  la base de données     │
   └────────────────────────┘         └────────────────────────┘
        Angular (TypeScript)               Flask (Python)
```

- **Le FRONTEND** = la **salle du restaurant** 🪑. C'est joli, tu vois les menus, tu cliques sur des boutons. Tu ne vois pas comment c'est fait.
- **Le BACKEND** = la **cuisine** 👨‍🍳. C'est là qu'on garde la nourriture (les données), qu'on cuisine et qu'on prépare tout.

Quand tu cliques sur un bouton (salle), un **serveur** va chercher l'info en cuisine (backend) et te la ramène. 🏃‍♂️

---

# 🪑 PARTIE 1 : LE FRONTEND (la salle à manger)

Le frontend est fait avec un outil qui s'appelle **Angular**. C'est comme une **boîte de Lego** 🧱 : on construit des pages avec des petits blocs qu'on réutilise.

## 📄 Les pages (les différentes salles)

Chaque page est une **pièce de la maison**. Tu y vas en tapant une adresse (comme `/dashboard`).

| Adresse | La pièce | À quoi ça sert |
|---------|----------|----------------|
| `/` | 🏠 L'entrée | La page d'accueil pour tout le monde |
| `/login` | 🔑 La porte | Pour se connecter avec son email |
| `/register` | ✍️ Le bureau d'inscription | Pour créer un compte |
| `/dashboard` | 📊 Le salon | Le patient voit son résumé |
| `/appointment` | 📅 L'agenda | Pour prendre un rendez-vous |
| `/plan` | 🍽️ La cuisine perso | Le patient voit son menu de la semaine |
| `/suivi` | 📈 Le carnet de santé | Voir son poids, sa tension... |
| `/profile` | 👤 La carte d'identité | Modifier ses infos |
| `/admin/...` | 👩‍⚕️ Le bureau du docteur | Réservé au nutritionniste |

> **Exemple concret :** Quand tu tapes `monsite.com/plan` dans le navigateur, Angular ouvre la pièce « plan de repas ». C'est comme ouvrir la porte de la cuisine ! 🚪

## 🧩 Les blocs réutilisables (les composants partagés)

Certains morceaux apparaissent **sur plusieurs pages**. Au lieu de les redessiner à chaque fois, on les fabrique **une seule fois** et on les colle partout.

| Bloc | C'est quoi | Image |
|------|-----------|-------|
| **Sidebar** | Le menu sur le côté gauche | 📋 Comme la liste des chaînes de ta télé |
| **Topbar** | La barre en haut avec ton nom | 👋 « Bonjour Sophie ! » |
| **Chatbot** | Le petit robot qui répond à tes questions | 🤖 « Pose-moi une question sur la nourriture ! » |

> **Exemple concret :** La **Sidebar** (le menu) est comme la **télécommande** 📺. Elle est toujours là, peu importe la chaîne que tu regardes.

## 🔌 Les services (les téléphones de la salle)

Un **service** est un **téléphone** ☎️ qui appelle la cuisine (le backend).

Quand le patient veut voir son plan de repas, la page **décroche le téléphone** (`appointment.service.ts`) et dit :
> *« Allô la cuisine ? Donne-moi le plan de repas de Sophie ! »*

Voici les téléphones qu'on a :

| Téléphone (service) | Qui il appelle |
|---------------------|----------------|
| `auth.service.ts` | « Connecte-moi / inscris-moi » 🔑 |
| `appointment.service.ts` | « Mes rendez-vous et mes plans » 📅 |
| `admin.service.ts` | « Les infos pour le docteur » 👩‍⚕️ |
| `chatbot.service.ts` | « Parle au petit robot » 🤖 |
| `notification.service.ts` | « Ai-je des nouveaux messages ? » 🔔 |

## 🚦 Les gardes (les videurs à l'entrée)

Un **garde** (guard) est un **videur de boîte de nuit** 💂. Il vérifie si tu as le droit d'entrer dans une pièce.

- **`authGuard`** = *« Tu es connecté ? Non ? Va d'abord te connecter ! »* (te renvoie à `/login`)
- **`nutritionnisteGuard`** = *« Tu es le docteur ? Non ? Tu ne peux PAS entrer dans le bureau ! »* (te renvoie à `/dashboard`)

> **Exemple concret :** Un patient qui essaie d'aller sur `/admin` se fait **refouler** par le videur, exactement comme un enfant qui veut entrer dans une salle réservée aux adultes. 🙅

---

# 👨‍🍳 PARTIE 2 : LE BACKEND (la cuisine)

Le backend est fait avec **Python** et un outil qui s'appelle **Flask**. C'est la **cuisine** où on garde et on prépare toutes les données.

## 🗄️ La base de données (le grand réfrigérateur)

Toutes les informations sont rangées dans un **grand réfrigérateur** 🧊 avec plein de **tiroirs étiquetés**. Chaque tiroir s'appelle une **table**.

| Tiroir (table) | Ce qu'il contient | Exemple |
|----------------|-------------------|---------|
| **User** 👤 | Les gens (nom, email, mot de passe) | « Sophie, sophie@mail.com » |
| **Patient** 🧑 | Les infos santé du patient | « Sophie : 1m65, allergique aux noix » |
| **Nutritionniste** 👩‍⚕️ | Le docteur | « Dr. Martin » |
| **RendezVous** 📅 | Les rendez-vous | « Sophie voit le docteur le 5 juin à 14h » |
| **Consultation** 🩺 | Ce qui s'est passé au rendez-vous | « Poids : 60kg, tension : 12/8 » |
| **Disponibilite** 🕐 | Quand le docteur est libre | « Lundi de 9h à 17h » |
| **MealPlanTemplate** 📋 | Des menus tout prêts | « Menu équilibré standard » |
| **PatientMealPlan** 🍽️ | Le menu personnel d'un patient | « Le menu de Sophie pour cette semaine » |
| **Notification** 🔔 | Les petits messages | « Ton plan de repas est prêt ! » |

> **Exemple concret :** Quand Sophie s'inscrit, on crée **2 fiches** : une dans le tiroir **User** (son nom, son email) et une dans le tiroir **Patient** (sa taille, ses allergies). Elles sont **reliées** par un fil invisible (`id_user`). 🧵

## 🍱 Comment un repas est rangé dans le frigo

Un plan de repas est rangé comme une **boîte à compartiments** (format JSON) :

```json
{
  "Lundi": {
    "petit_dejeuner": { "repas": "Flocons d'avoine aux fruits", "calories": 350, "proteines": 12, "glucides": 60, "lipides": 8 },
    "dejeuner":       { "repas": "Poulet grillé et riz",        "calories": 600, "proteines": 40, "glucides": 70, "lipides": 15 },
    "diner":          { "repas": "Soupe de légumes",             "calories": 300, "proteines": 10, "glucides": 40, "lipides": 5 }
  },
  "Mardi": { "...": "..." }
}
```

> **Exemple concret :** C'est comme une **boîte à goûter** 🍱 avec un compartiment pour le matin, le midi et le soir, pour chaque jour de la semaine !

## 🛎️ Les routes (le menu de la cuisine)

Une **route** est une **commande au restaurant** 📝. Tu dis ce que tu veux, et la cuisine te le prépare.

Chaque commande a :
- Un **type** : `GET` (donne-moi) 🤲, `POST` (crée ça) ➕, `PATCH` (change ça) ✏️, `DELETE` (jette ça) 🗑️
- Une **adresse** : où on envoie la commande

### 🔑 Les commandes pour se connecter (`/api/auth`)

| Commande | Type | Ce que ça fait |
|----------|------|----------------|
| `/register` | POST ➕ | « Crée-moi un compte » |
| `/login` | POST ➕ | « Laisse-moi entrer » |
| `/me` | GET 🤲 | « Qui suis-je ? » |
| `/forgot-password` | POST ➕ | « J'ai oublié mon mot de passe ! » |
| `/google` | GET 🤲 | « Connecte-moi avec Google » |

### 📅 Les commandes pour les rendez-vous (`/api/appointments`)

| Commande | Type | Ce que ça fait |
|----------|------|----------------|
| `/slots` | GET 🤲 | « Quelles heures sont libres ? » |
| `` (vide) | POST ➕ | « Réserve-moi ce créneau » |
| `/my-plans` | GET 🤲 | « Montre-moi mes plans de repas » |

### 👩‍⚕️ Les commandes du docteur (`/api/admin`)

| Commande | Type | Ce que ça fait |
|----------|------|----------------|
| `/patients` | GET 🤲 | « Donne-moi la liste de tous mes patients » |
| `/consultations` | POST ➕ | « J'ajoute ce qu'on a vu aujourd'hui » |
| `/patients/123/generate-plan` | POST ➕ | « Crée un plan de repas avec l'IA pour le patient n°123 » 🤖 |

> **Exemple concret :** Quand le patient clique sur « Voir mon plan », son téléphone (service) appelle la commande `GET /my-plans`. La cuisine ouvre le tiroir, prend le menu de Sophie, et le renvoie. 🍽️

## 🏗️ Comment la cuisine est organisée (les 3 chefs)

Dans la cuisine, le travail est séparé en **3 chefs** pour que ce soit propre :

```
   🛎️ CONTROLLER          🧑‍🍳 SERVICE              🗄️ MODEL
  (le serveur)          (le chef cuisinier)      (le frigo)
                                                  
  Prend la commande  →  Prépare le plat       →  Va chercher les
  du client             (la logique)             ingrédients
```

1. **Le Controller** (le serveur) 🛎️ : prend ta commande et la transmet.
2. **Le Service** (le chef) 🧑‍🍳 : fait le vrai travail (calculs, vérifications).
3. **Le Model** (le frigo) 🗄️ : range et sort les données.

> **Exemple concret :** Tu commandes une pizza 🍕.
> - Le **serveur** (controller) note ta commande.
> - Le **chef** (service) prépare la pâte, met la sauce, le fromage.
> - Le **frigo** (model) fournit les ingrédients.
> - Le serveur te ramène la pizza ! 🎉

---

# 🔐 PARTIE 3 : Comment on se connecte (la magie du jeton)

## 🎟️ Le jeton (le ticket de manège)

Quand tu te connectes, la cuisine te donne un **ticket secret** 🎟️ (on l'appelle un **token JWT**).

C'est comme un **bracelet de parc d'attractions** 🎢 :
- Tant que tu as ton bracelet au poignet, tu peux faire tous les manèges.
- À chaque manège (chaque page), le gardien regarde ton bracelet.
- Au bout d'un moment (24 heures), le bracelet **expire** ⏰ et tu dois en reprendre un.

```
  1. Tu te connectes        →  🎟️ « Voici ton ticket ! »
  2. Tu vas sur une page     →  Le ticket part avec ta demande
  3. La cuisine vérifie      →  « Ce ticket est bon ? OK, entre ! »
```

> **Exemple concret :** Sophie se connecte → elle reçoit un ticket. À chaque fois qu'elle clique, son ticket est envoyé en cachette dans son sac à dos (le `Authorization: Bearer ...`). Le videur le vérifie. ✅

## 🔒 Le mot de passe (le coffre-fort)

On ne garde **JAMAIS** ton vrai mot de passe ! On le transforme en **charabia secret** (avec `bcrypt`). 

> **Exemple concret :** Si ton mot de passe est `chat123`, on le range comme `$2b$12$xK9...` dans le frigo. Même un voleur qui ouvre le frigo ne peut pas le lire ! 🔐

---

# 🤖 PARTIE 4 : L'intelligence artificielle (le chef robot)

C'est la partie la plus magique ! NutriCare a un **chef robot** 🤖 qui invente des menus tout seul.

## 🧠 Comment le robot invente un menu (le RAG)

Imagine un **chef robot très intelligent** qui a déjà vu **des milliers de menus** de patients similaires. Quand le docteur lui demande un menu pour Sophie, le robot fait 3 étapes :

```
   1️⃣ CHERCHER              2️⃣ S'INSPIRER            3️⃣ INVENTER
                                                  
  « Trouve-moi des       « Regarde ces 5 menus     « Voici un nouveau
   patients qui            de patients qui            menu sur 7 jours,
   ressemblent à           ressemblent à Sophie »     fait pour Sophie ! »
   Sophie »                                          
                                                  
  📚 Base ChromaDB        🔍 Les exemples           ✨ OpenAI (GPT)
```

1. **CHERCHER** 🔍 : Le robot fouille dans une **grande bibliothèque** (ChromaDB) et trouve les patients qui ressemblent le plus à Sophie (même âge, même objectif...).
2. **S'INSPIRER** 📚 : Il regarde les menus de ces patients similaires.
3. **INVENTER** ✨ : Il demande à un super-cerveau (OpenAI / ChatGPT) de créer un **nouveau menu personnalisé** sur 7 jours.

> **Exemple concret :** C'est comme un cuisinier qui regarde **plein de recettes de gâteaux au chocolat** 🍫 avant d'inventer **sa propre recette parfaite** pour ton anniversaire !

## 📚 La bibliothèque magique (ChromaDB)

La bibliothèque est **figée** (construite une seule fois avec `build_index.py`). C'est comme une **encyclopédie** 📖 : on la lit, mais on n'écrit plus dedans.

Pour trouver des patients similaires, on transforme chaque patient en **liste de nombres** (un *embedding*). Les patients qui se ressemblent ont des nombres proches !

> **Exemple concret :** Si Sophie est « `[3, 7, 2]` » et que Léa est « `[3, 7, 3]` », elles sont **très proches** → le robot dit : « Elles se ressemblent ! » 👯

## 💬 Le petit robot de discussion (le Chatbot)

Il y a aussi un **robot bavard** 🤖 dans le coin de l'écran. Tu peux lui poser des questions sur la nourriture :
> *« Est-ce que les bananes sont bonnes pour moi ? »*

Et il te répond, et te propose **d'autres questions** à poser. C'est comme avoir un **ami expert en nourriture** dans ta poche ! 🍌

---

# 🎬 PARTIE 5 : Un exemple complet du début à la fin

Suivons **Sophie** qui veut voir son plan de repas ! 🚶‍♀️

```
  1. 🪑 Sophie clique sur "Plan alimentaire" dans le menu (FRONTEND)
                          ⬇️
  2. ☎️ La page décroche le téléphone : appointment.service.ts
                          ⬇️
  3. 📨 Le téléphone envoie : "GET /api/appointments/my-plans" + 🎟️ son ticket
                          ⬇️
  4. 💂 Le videur vérifie le ticket → "OK, c'est bien Sophie !"
                          ⬇️
  5. 🛎️ Le serveur (controller) reçoit la commande
                          ⬇️
  6. 🧑‍🍳 Le chef (service) cherche le patient Sophie
                          ⬇️
  7. 🗄️ Le frigo (model) sort le plan de repas de Sophie
                          ⬇️
  8. 📦 La cuisine renvoie le menu (en JSON) à la salle
                          ⬇️
  9. 🎨 Angular affiche de jolies cartes : "Lundi : Flocons d'avoine..."
                          ⬇️
  10. 😋 Sophie voit son menu et est contente !
```

---

# 🛠️ PARTIE 6 : Comment lancer le projet (pour les grands)

## Lancer la cuisine (backend)

```bash
cd backend
source venv/bin/activate     # réveiller l'environnement Python
python app.py                # ouvre la cuisine sur le port 5000
```

## Lancer la salle (frontend)

```bash
cd frontend
npm install                  # installer les Lego (une seule fois)
npm start                    # ouvre la salle sur http://localhost:4200
```

Puis ouvre ton navigateur sur **http://localhost:4200** et c'est parti ! 🚀

---

# 📦 Résumé en une phrase pour chaque morceau

| Morceau | En une phrase d'enfant |
|---------|------------------------|
| **Frontend** | La belle salle où tu cliques sur des boutons 🪑 |
| **Backend** | La cuisine cachée qui prépare tout 👨‍🍳 |
| **Pages** | Les différentes pièces de la maison 🚪 |
| **Composants** | Les blocs de Lego réutilisables 🧱 |
| **Services** | Les téléphones pour appeler la cuisine ☎️ |
| **Guards** | Les videurs qui vérifient si tu peux entrer 💂 |
| **Base de données** | Le grand frigo avec des tiroirs 🧊 |
| **Models** | Les étiquettes des tiroirs du frigo 🏷️ |
| **Controllers** | Les serveurs qui prennent ta commande 🛎️ |
| **Services (backend)** | Les chefs qui cuisinent 🧑‍🍳 |
| **Routes** | Le menu des commandes possibles 📝 |
| **Token JWT** | Ton bracelet de parc d'attractions 🎟️ |
| **IA / RAG** | Le chef robot qui invente des menus 🤖 |
| **Chatbot** | L'ami expert en nourriture dans ta poche 💬 |

---

*Voilà ! Maintenant tu comprends NutriCare aussi bien qu'un grand. Bravo ! 🎉🌟*

---
---

# 🏗️ PARTIE 7 : L'architecture en détail (les couches et leurs appels)

Maintenant on va regarder **plus près** : comment chaque partie est construite **en couches** (comme un gâteau 🍰) et **qui appelle qui**.

## 🍰 Le gâteau à plusieurs couches

Notre application est un **gâteau à étages**. Chaque étage a un seul travail, et un étage ne parle **qu'à l'étage juste en dessous** de lui.

```
   ╔══════════════════════════════════════════════════════════╗
   ║                  🪑 FRONTEND (Angular)                     ║
   ║                                                            ║
   ║   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐   ║
   ║   │  COMPONENT    │   │   SERVICE     │   │   GUARD      │   ║
   ║   │  (la page)    │──►│  (téléphone)  │   │  (le videur) │   ║
   ║   └──────────────┘   └──────┬───────┘   └─────────────┘   ║
   ╚═════════════════════════════│════════════════════════════╝
                                 │   📨 HTTP + 🎟️ token
                                 ▼
   ╔══════════════════════════════════════════════════════════╗
   ║                   👨‍🍳 BACKEND (Flask)                       ║
   ║                                                            ║
   ║   ┌──────────────┐                                         ║
   ║   │  MIDDLEWARE   │  💂 vérifie le ticket d'abord          ║
   ║   │ (auth_guard)  │                                         ║
   ║   └──────┬───────┘                                         ║
   ║          ▼                                                 ║
   ║   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐   ║
   ║   │  CONTROLLER   │──►│   SERVICE     │──►│   MODEL      │   ║
   ║   │ (le serveur)  │   │  (le chef)    │   │  (le frigo)  │   ║
   ║   └──────────────┘   └──────┬───────┘   └──────┬──────┘   ║
   ╚═════════════════════════════│═════════════════│══════════╝
                                 │                 ▼
                  ┌──────────────┴──┐      ┌──────────────┐
                  │  🤖 IA (RAG)     │      │  🧊 MySQL     │
                  │  ChromaDB+OpenAI │      │  (le frigo)  │
                  └─────────────────┘      └──────────────┘
```

**Règle d'or :** Une couche ne saute **jamais** par-dessus une autre.
Le Component ne va **jamais** parler directement au frigo (Model). Il doit passer par le téléphone (Service) → le serveur (Controller) → le chef (Service backend) → le frigo (Model). 

> **Exemple concret :** Au restaurant, **tu ne vas pas dans la cuisine prendre ton plat toi-même** 🚫🍳 ! Tu demandes au serveur, qui demande au chef, qui prend dans le frigo. Chacun son rôle ! 

---

## 🪑 Architecture du FRONTEND en détail

### Les 3 types de fichiers d'une page

Chaque page Angular est faite de **3 fichiers** (comme un sandwich 🥪) :

```
   meal-plan/
   ├── meal-plan.component.ts     🧠 LE CERVEAU   (la logique, les données)
   ├── meal-plan.component.html   👀 LE VISAGE    (ce que tu vois)
   └── meal-plan.component.css    👗 LES HABITS   (les couleurs, les formes)
```

| Fichier | C'est quoi | Exemple |
|---------|-----------|---------|
| `.ts` 🧠 | Le **cerveau** : il pense, il garde les données, il appelle le téléphone | « Va chercher les plans de Sophie » |
| `.html` 👀 | Le **visage** : les boutons, les textes, les listes | « Affiche une carte par repas » |
| `.css` 👗 | Les **habits** : les couleurs, les tailles | « Le bouton actif est vert » |

### Comment ça parle à l'intérieur du frontend

```
   👀 HTML                      🧠 TS (Component)              ☎️ SERVICE
   "Sophie clique     ─────►   "ngOnInit() : je dois    ─────►  "getMyPlans()
    sur le bouton"              charger les plans"               envoie la demande
                                                                  au backend"
                       ◄─────                          ◄─────
   "J'affiche les              "Je range les plans              "Voici les plans
    jolies cartes"              dans la variable plans[]"        (réponse du backend)"
```

> **Exemple concret (vrai code de NutriCare) :**
> 1. Dans `meal-plan.component.ts`, la fonction `ngOnInit()` se lance dès qu'on ouvre la page.
> 2. Elle appelle `this.appt.getMyPlans()` → c'est le **téléphone** (`appointment.service.ts`).
> 3. Le téléphone envoie `GET /api/appointments/my-plans` au backend.
> 4. Quand la réponse arrive, on la range : `this.plans = plans`.
> 5. Le fichier `.html` regarde la variable `plans` et **dessine une carte par repas**. 🎨

### Le rôle exact de chaque type de fichier frontend

```
   📁 frontend/src/app/
   │
   ├── 📁 pages/          👀 Les pièces de la maison (une page = un dossier)
   │     └── meal-plan/   (les 3 fichiers .ts .html .css)
   │
   ├── 📁 shared/         🧱 Les blocs Lego réutilisables (sidebar, topbar, chatbot)
   │
   ├── 📁 services/       ☎️ Les téléphones vers le backend
   │
   ├── 📁 guards/         💂 Les videurs (authGuard, nutritionnisteGuard)
   │
   └── 📄 app.routes.ts   🗺️ La carte : quelle adresse = quelle page
```

---

## 👨‍🍳 Architecture du BACKEND en détail

### Les 4 couches du backend

```
   1️⃣ MIDDLEWARE  →  2️⃣ CONTROLLER  →  3️⃣ SERVICE  →  4️⃣ MODEL
   💂 le videur      🛎️ le serveur     🧑‍🍳 le chef      🗄️ le frigo
```

| Couche | Dossier | Son seul travail |
|--------|---------|------------------|
| **Middleware** 💂 | `middlewares/` | Vérifier le ticket (token) AVANT tout |
| **Controller** 🛎️ | `controllers/` | Recevoir la commande HTTP, la passer au chef |
| **Service** 🧑‍🍳 | `services/` | Faire le VRAI travail (logique, calculs, règles) |
| **Model** 🗄️ | `models/` | Parler au frigo (lire/écrire dans MySQL) |

### Pourquoi séparer en couches ?

C'est comme dans un **restaurant bien organisé** 🍽️ :
- Si le **serveur** (controller) part en vacances, on peut le remplacer **sans changer la cuisine** (service).
- Si on change le **frigo** (MySQL → autre base), seul le **chef** (service) s'en aperçoit, pas le client.

> **Exemple concret :** Le controller ne fait **AUCUN calcul**. Regarde le vrai code de `admin_controller.py` :
> ```python
> @admin_bp.get('/stats')
> @require_nutritionniste            # 💂 1. le videur vérifie le ticket
> def stats():
>     return jsonify(admin_service.get_stats()), 200   # 🛎️ 2. il passe juste au chef
> ```
> Le serveur (controller) dit juste « va voir le chef ! ». C'est le chef (`admin_service.get_stats()`) qui compte les patients dans le frigo.

### Le chemin précis d'une commande (vrai exemple : créer un rendez-vous)

Suivons la commande **« le docteur crée un RDV pour Sophie »** à travers TOUTES les couches :

```
  📨 POST /api/admin/rendez-vous  { id_patient: 5, date: "2026-06-10", heure: "14:00" }
            │
            ▼
  ╔═══ 1️⃣ MIDDLEWARE (auth_middleware.py) ═══╗
  ║  @require_nutritionniste                 ║
  ║  "🎟️ Ton ticket dit que tu es docteur ?  ║
  ║   ✅ Oui → entre. ❌ Non → 403 refusé."   ║
  ╚════════════════════╤═════════════════════╝
                       ▼
  ╔═══ 2️⃣ CONTROLLER (admin_controller.py) ══╗
  ║  def create_rdv():                        ║
  ║  - lit le JSON envoyé                      ║
  ║  - appelle admin_service.create_rdv(data) ║
  ║  - si erreur → renvoie 400                 ║
  ╚════════════════════╤═════════════════════╝
                       ▼
  ╔═══ 3️⃣ SERVICE (admin_service.py) ════════╗
  ║  def create_rdv(data):                    ║
  ║  - vérifie que le patient existe          ║
  ║  - vérifie qu'il n'y a pas 2 RDV en même  ║
  ║    temps (règle des 30 min) 🕐            ║
  ║  - crée l'objet RendezVous                ║
  ║  - appelle notification_service 🔔        ║
  ╚════════════════════╤═════════════════════╝
                       ▼
  ╔═══ 4️⃣ MODEL (rendez_vous.py) ════════════╗
  ║  db.session.add(rdv)                      ║
  ║  db.session.commit()                      ║
  ║  "🧊 Je range le RDV dans le frigo MySQL" ║
  ╚════════════════════╤═════════════════════╝
                       ▼
  📦 Réponse JSON : { id_rendez_vous: 42, date: "2026-06-10", ... }
                       │
                       ▼  (le serveur ramène le plat à la salle)
  🔔 + une notification est créée pour Sophie : "Nouveau rendez-vous !"
```

> **Exemple concret :** C'est comme une **chaîne de montage de jouets** 🧸 :
> - Le **videur** vérifie que tu as le droit d'entrer.
> - Le **serveur** prend ta commande de jouet.
> - Le **chef** vérifie qu'il a les pièces et assemble le jouet.
> - Le **frigo** range le jouet fini.
> - On te ramène le jouet ! 🎁

### Un service peut appeler un autre service !

Parfois un chef a besoin d'un **autre chef** 🧑‍🍳🧑‍🍳. Dans NutriCare :

```
   admin_service.create_rdv()
        │
        ├──► notification_service.create()   🔔 "Préviens Sophie !"
        │
        └──► email_service.send_rdv_confirme()  📧 "Envoie-lui un email !"
```

> **Exemple concret :** Quand le docteur confirme un RDV, le chef principal (`admin_service`) demande à **2 assistants** :
> - L'assistant **notifications** 🔔 met un petit message dans l'app.
> - L'assistant **email** 📧 envoie un vrai email à Sophie.

---

## 🤖 Architecture de l'IA en détail (le chef robot)

L'IA est un **chef spécial** qui a sa propre petite cuisine. Voici **qui appelle qui** quand le docteur clique sur « Générer avec l'IA » :

```
  📨 POST /api/admin/patients/5/generate-plan  { cuisine: "Mediterranean" }
            │
            ▼
  🛎️ CONTROLLER (admin_controller.generate_plan)
            │   "cuisine est remplie ? OK"
            ▼
  🧑‍🍳 SERVICE (admin_service.generate_ai_plan)
            │
            │  1. Construit le PROFIL du patient :
            │     - calcule l'âge depuis la date de naissance 🎂
            │     - calcule l'IMC (poids ÷ taille²) ⚖️
            │     - devine le type de régime (Low_Carb si diabète...) 🩺
            │     - calcule les calories cibles 🔥
            │
            ├──► 🔍 RAGRetriever (ai/retriever.py)
            │       "Trouve 5 patients qui ressemblent à Sophie
            │        dans la bibliothèque ChromaDB" 📚
            │       ◄── renvoie 5 exemples de menus similaires
            │
            ├──► ✨ generator.generate() (ai/generator.py)
            │       "Écris un prompt avec le profil + les 5 exemples,
            │        envoie-le à OpenAI (ChatGPT)" 🧠
            │       ◄── renvoie un menu de 7 jours en JSON
            │
            ├──► 🗄️ MODEL (PatientMealPlan)
            │       "Range le nouveau menu dans le frigo" 🧊
            │
            └──► 🔔 notification_service.create()
                    "Préviens Sophie : ton plan est prêt !"
            │
            ▼
  📦 Réponse : { meal_plan: {...}, id_plan: 99, tokens_used: 2150 }
```

### Les 3 sous-étapes de l'IA (RAG = Retrieval-Augmented Generation)

```
   🔍 RETRIEVAL          📚 AUGMENTED            ✨ GENERATION
   (chercher)            (enrichir)              (inventer)
                                              
   ChromaDB trouve  →   On ajoute ces        →  OpenAI invente un
   les patients          exemples dans le         nouveau menu en
   similaires            "prompt" (la question)   s'inspirant des exemples
```

> **Exemple concret :** Imagine que tu dois inventer une **histoire** 📖 :
> - **RETRIEVAL** 🔍 : tu cherches 5 histoires qui ressemblent à ce que tu veux.
> - **AUGMENTED** 📚 : tu poses les 5 histoires devant toi pour t'inspirer.
> - **GENERATION** ✨ : tu écris **ta propre histoire** toute neuve !

### Comment la bibliothèque est remplie (une seule fois)

Le fichier `build_index.py` est lancé **UNE SEULE FOIS** par les développeurs. Après, on n'y touche plus.

```
   📄 diet_with_meals.csv  (un grand tableau de patients + leurs menus)
            │
            ▼
   🔢 On transforme chaque patient en liste de nombres (embedding)
      avec le modèle "BAAI/bge-base-en-v1.5"
            │
            ▼
   📚 On range tout dans ChromaDB (la bibliothèque figée)
            │
            ▼
   ✅ Terminé ! Le serveur ne fera plus que LIRE dans la bibliothèque.
```

> **Exemple concret :** C'est comme **construire une bibliothèque** 📚 une fois pour toutes. Après, les gens viennent juste **lire les livres**, ils n'écrivent plus de nouveaux livres dedans.

---

## 🗺️ Tableau magique : "Je clique ici" → "Voici tout le chemin"

| Tu cliques sur... | Component (page) | → Service (téléphone) | → Route backend | → Controller | → Service backend | → Model (frigo) |
|-------------------|------------------|----------------------|-----------------|--------------|-------------------|-----------------|
| **Se connecter** 🔑 | `login` | `auth.service` | `POST /api/auth/login` | `auth_controller` | `auth_service.login()` | `User` |
| **Voir mon plan** 🍽️ | `meal-plan` | `appointment.service` | `GET /api/appointments/my-plans` | `appointment_controller` | (filtre par patient) | `PatientMealPlan` |
| **Prendre RDV** 📅 | `appointment` | `appointment.service` | `POST /api/appointments` | `appointment_controller` | `appointment_service` | `RendezVous` |
| **Liste patients** 👥 | `admin/patients` | `admin.service` | `GET /api/admin/patients` | `admin_controller` | `admin_service.list_patients()` | `Patient` + `User` |
| **Générer plan IA** 🤖 | `admin/plans` | `admin.service` | `POST /api/admin/patients/X/generate-plan` | `admin_controller` | `admin_service.generate_ai_plan()` | `PatientMealPlan` + 🤖 IA |
| **Parler au robot** 💬 | `chatbot` (shared) | `chatbot.service` | `POST /api/chatbot` | `chatbot_controller` | `chatbot_service` | (pas de frigo, juste OpenAI) |

> **Comment lire ce tableau :** Lis une ligne **de gauche à droite** = c'est **tout le voyage** d'un clic, depuis ton doigt jusqu'au frigo ! 👉🧊

---

## 🎯 Résumé de l'architecture en une image

```
        TON DOIGT 👆
            │
            ▼
   ┌─────────────────────────────────────┐
   │  FRONTEND : Component → Service       │  🪑 la salle
   └──────────────────┬──────────────────┘
                      │  📨 HTTP + 🎟️ token
                      ▼
   ┌─────────────────────────────────────┐
   │  Middleware 💂 → Controller 🛎️         │  👨‍🍳 la cuisine
   │       → Service 🧑‍🍳 → Model 🗄️           │
   └──────────────────┬──────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
     🧊 MySQL                  🤖 IA (ChromaDB + OpenAI)
     (le frigo)               (le chef robot)
```

**La règle à retenir :** chaque couche parle **seulement** à sa voisine du dessous. Jamais de saut ! C'est ça qui rend l'application **propre, solide et facile à réparer**. 🛠️✨

---

*Maintenant tu connais NutriCare de l'intérieur, couche par couche, appel par appel. Tu es un vrai petit architecte ! 🏗️👷🌟*
