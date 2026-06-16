# Chess Memory — Mémoire d'échecs

Jeu de mémoire basé sur l'échiquier : observe une position pendant quelques secondes, puis replace les pièces au bon endroit.

## Modes de jeu

| Mode | Description |
|---|---|
| **Solo** | Un seul joueur, bats ton record |
| **Multijoueur local** | Plusieurs joueurs à tour de rôle sur le même appareil (passe-passe) |
| **Multijoueur en ligne** | Jusqu'à 8 joueurs sur leurs propres appareils, via Firebase |

## Fonctionnalités

### Partie
- Nombre de manches configurable (1 à 20).
- Durée d'affichage configurable (1 à 60 secondes).
- Difficultés prédéfinies : Facile (2 pièces), Moyen (6), Difficile (9).
- Mode personnalisé : même nombre de pièces toutes les manches, ou nombre différent par manche.
- Interaction en **clic** et **glisser-déposer** (desktop + mobile).
- Minuteur circulaire animé.
- Toutes les positions partagées en multijoueur (équité garantie).

### Interface
- **35 styles de pièces** sélectionnables via une modale avec aperçu échiquier.
- **Thème clair/sombre** (interrupteur dans les paramètres).
- **Affichage des coordonnées** a–h / 1–8 (activable/désactivable).
- Sauvegarde des préférences en `localStorage`.

### Résultats
- Score par manche + score total.
- Révision manche par manche (ta réponse vs la solution).
- En multijoueur : classement avec médaille, onglets par joueur.

### Multijoueur en ligne (salon)
- Création d'un salon avec code à 6 caractères.
- Rejoint depuis n'importe quel appareil (iPhone, Android, PC).
- L'hôte configure la partie et peut **expulser** un joueur.
- Les joueurs jouent en simultané, chacun sur son appareil.
- **Historique des parties** du salon (20 dernières) avec bouton "Revoir".
- Salon persistant : plusieurs parties sans recréer de salon.
- Expiration automatique après **1 heure d'inactivité**.
- Suppression automatique quand **tout le monde a quitté**.
- Transfert automatique de l'hôte si celui-ci quitte.

## Comment jouer

1. Choisir un mode sur l'écran d'accueil.
2. Configurer la partie (manches, durée, difficulté).
3. Cliquer **Commencer**.
4. **Mémoriser** la position pendant le décompte.
5. **Replacer** les pièces depuis la réserve.
6. Cliquer **Vérifier**.
7. Manche suivante ou résultats finaux.

## Règles de score

Une pièce est correcte si les 3 conditions sont remplies simultanément :
- bonne case,
- bon type (roi, dame, tour…),
- bonne couleur (blanc/noir).

```text
Score manche = pièces correctes
Score total  = Σ scores des manches
Score max    = Σ pièces attendues par manche
```

## Flux d'une manche

```mermaid
flowchart LR
    A[Position aléatoire générée] --> B[Affichage + minuteur]
    B --> C[Position masquée]
    C --> D[Placement joueur]
    D --> E[Vérification]
    E --> F{Dernière manche ?}
    F -- Non --> A
    F -- Oui --> G[Résultats + révision]
```

## Architecture du code

JavaScript vanilla, espace global partagé, scripts chargés dans l'ordre déclaré dans `index.html`.

**Ordre de chargement :**

| Fichier | Rôle |
|---|---|
| `config.js` | Constantes (sets de pièces, timer, seuils) |
| `state.js` | Variables mutables globales (manche, score, joueurs…) |
| `logic.js` | Fonctions pures (génération, mélange, comparaison) |
| `dom.js` | Références DOM + helpers (`showScreen`, `populateSelect`, `applyTheme`…) |
| `board.js` | Rendu échiquier et pièces |
| `dragdrop.js` | Interactions clic + glisser-déposer (desktop + touch) |
| `storage.js` | Persistance préférences en `localStorage` |
| `online.js` | Multijoueur en ligne (Firebase Realtime Database) |
| `settings.js` | Modale paramètres (thème, coordonnées, choix des pièces) |
| `menu.js` | Écran configuration + lancement de partie |
| `game.js` | Boucle des manches, timer, vérification |
| `results.js` | Écran résultats, classement, révision |
| `main.js` | Initialisation globale (dernier chargé) |

## Arborescence

```text
chess-memory/
├── index.html
├── style.css
├── favicon.png          ← à placer ici (PNG 32×32 ou 64×64)
├── README.md
├── js/
│   ├── config.js
│   ├── state.js
│   ├── logic.js
│   ├── dom.js
│   ├── board.js
│   ├── dragdrop.js
│   ├── storage.js
│   ├── online.js
│   ├── settings.js
│   ├── menu.js
│   ├── game.js
│   ├── results.js
│   └── main.js
└── pieces/
    ├── neo/             ← set par défaut
    ├── classic/
    ├── alpha/
    └── ...              ← 35 sets au total
```

## Lancer le jeu en local

Depuis le dossier parent `mini-jeux-amis` :

```bash
python -m http.server 8000
```

Ouvrir : `http://localhost:8000/chess-memory/`

## Ajouter un set de pièces

1. Créer `pieces/<id>/`.
2. Placer les 12 images : `wk.png` `wq.png` `wr.png` `wb.png` `wn.png` `wp.png` / `bk.png` `bq.png` `br.png` `bb.png` `bn.png` `bp.png`.
3. Déclarer le set dans `js/config.js` → tableau `PIECE_SETS` : `{ id: '<id>', label: 'Nom affiché' }`.

**Spécifications images :** PNG transparent, généralement 100×100 ou 128×128 px.

### Sets disponibles (35)

`neo` · `classic` · `alpha` · `book` · `club` · `condal` · `dash` · `game_room` · `glass` · `gothic` · `icy_sea` · `light` · `lolz` · `marble` · `maya` · `metal` · `modern` · `nature` · `neo_wood` · `neon` · `newspaper` · `ocean` · `sky` · `space` · `tigers` · `tournament` · `vintage` · `wood` · `8_bit` · `bubblegum` · `graffiti` · `3d_chesskid` · `3d_plastic` · `3d_staunton` · `3d_wood`

## Crédits

- Développé en JavaScript vanilla, sans framework.
- Sets de pièces : [GiorgioMegrelli/chess.com-boards-and-pieces](https://github.com/GiorgioMegrelli/chess.com-boards-and-pieces)
- Multijoueur : [Firebase Realtime Database](https://firebase.google.com) (plan gratuit Spark)


## Objectif

Retrouvez le plus de pièces possibles (type + couleur + case) après la phase de mémorisation.

## Fonctionnalités

- Paramètres de partie configurables:
	- prénom joueur,
	- nombre de manches (1 à 20),
	- durée d'affichage de la position (1 à 60 secondes).
- Difficultés prédéfinies:
	- Facile: 2 pièces,
	- Moyen: 6 pièces,
	- Difficile: 9 pièces.
- Mode personnalisé:
	- même nombre de pièces sur toutes les manches,
	- ou nombre de pièces différent pour chaque manche.
- Sélection du style de pièces (ex: Neo, Dash) avec aperçu en échiquier.
- Interactions de jeu en clic et en glisser-déposer.
- Minuteur circulaire pendant la phase de mémorisation.
- Écran de résultats complet:
	- score par manche,
	- score total,
	- bouton Revoir pour comparer ta réponse à la solution.
- Sauvegarde locale des préférences via localStorage (nom, options, style de pièces, etc.).

## Comment jouer

1. Ouvrir le jeu depuis la page d'accueil mini-jeux.
2. Choisir les options de partie.
3. Cliquer sur Commencer.
4. Mémoriser la position affichée pendant le décompte.
5. Replacer les pièces depuis la réserve sur l'échiquier.
6. Cliquer sur Vérifier.
7. Passer à la manche suivante ou consulter les résultats finaux.

## Règles de score

- 1 point par pièce correctement replacée.
- Une pièce est correcte si les 3 conditions sont vraies:
	- bonne case,
	- bon type,
	- bonne couleur.

Formules:

```text
Score manche = nombre de pièces correctes
Score total  = somme des scores de toutes les manches
Score max    = somme des pièces attendues sur toutes les manches
```

## Flux d'une manche

```mermaid
flowchart LR
	A[Génération d'une position aléatoire] --> B[Affichage temporaire avec minuteur]
	B --> C[Masquage de la position]
	C --> D[Phase de placement joueur]
	D --> E[Vérification]
	E --> F{Dernière manche ?}
	F -- Non --> A
	F -- Oui --> G[Écran résultats + révision]
```

## Architecture du code

Le jeu est en JavaScript vanilla, découpé par responsabilité:

- index.html
	- structure des 3 écrans: accueil, jeu, résultats.
- style.css
	- styles du jeu (menu, échiquier, réserve, boutons, timer).
- js/config.js
	- constantes globales (sets de pièces, timer, seuil drag).
- js/state.js
	- état mutable de la partie (manche, score, placements, etc.).
- js/logic.js
	- fonctions pures (génération, mélange, comparaison, utilitaires).
- js/dom.js
	- références DOM et helpers d'affichage communs.
- js/board.js
	- rendu de l'échiquier et des pièces.
- js/dragdrop.js
	- interactions utilisateur (clic + drag and drop).
- js/menu.js
	- gestion des options de menu et lancement d'une partie.
- js/game.js
	- boucle des manches, timer, vérification.
- js/results.js
	- tableau récapitulatif et révision des manches.
- js/storage.js
	- persistance des préférences en localStorage.
- js/main.js
	- initialisation globale.

## Arborescence

```text
chess-memory/
	index.html
	style.css
	README.md
	js/
		board.js
		config.js
		dom.js
		dragdrop.js
		game.js
		logic.js
		main.js
		menu.js
		results.js
		state.js
		storage.js
	pieces/
		neo/
		dash/
		...
```

## Lancer le jeu en local

Depuis le dossier parent mini-jeux-amis:

```bash
python -m http.server 8000
```

Puis ouvrir:

- http://localhost:8000/chess-memory/

## Ajouter un set de pièces

1. Créer un dossier dans pieces/<id>/.
2. Ajouter les 12 images attendues:
	 - wk.png, wq.png, wr.png, wb.png, wn.png, wp.png,
	 - bk.png, bq.png, br.png, bb.png, bn.png, bp.png.
3. Déclarer le set dans js/config.js, tableau PIECE_SETS.

### Caractéristiques des images

Les sets de pièces utilisés respectent ces spécifications:

- **Format**: PNG (format lossless avec compression).
- **Transparence**: alpha channel (fond transparent).
- **Dimensions**: généralement **100x100 pixels** ou **128x128 pixels** (peut varier selon le style).
- **Nomenclature**: 
  - `w` = white (blanc), `b` = black (noir),
  - `k` = king, `q` = queen, `r` = rook, `b` = bishop, `n` = knight, `p` = pawn.
  - Exemple: `wk.png` = roi blanc, `bp.png` = pion noir.

### Sets disponibles

Le jeu vient actuellement avec 2 sets activés (neo, dash), mais tu as accès à **36 autres sets** préchargés:

- **Styles 3D**: 3d_chesskid, 3d_plastic, 3d_staunton, 3d_wood
- **Styles stylisés**: 8_bit, alpha, blindfold, book, bubblegum, cases, classic, club, condal, dash, game_room, glass, gothic, graffiti, icy_sea, light, lolz, marble, maya, metal, modern, nature, neo, neon, neo_wood, newspaper, ocean, sky, space, tigers, tournament, vintage, wood
- **Dossier spécial**: bases (pour les socles).

Pour activer un set supplémentaire, il suffit de l'ajouter au tableau `PIECE_SETS` dans `js/config.js`.

## Crédits

- Jeu développé en JavaScript vanilla.
- Ressources de sets de pièces récupérées depuis:
	- https://github.com/GiorgioMegrelli/chess.com-boards-and-pieces
