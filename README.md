# Mini-jeux entre amis

Une collection de mini-jeux web en HTML/CSS/JavaScript, pensée pour jouer rapidement entre amis.

## Aperçu

Ce projet propose:

- une page d'accueil qui sert de hub,
- un jeu complet: **Mémoire d'échecs**,
- une structure simple pour ajouter de nouveaux mini-jeux.

Le projet fonctionne en local, sans backend ni framework.

## Fonctionnalités

### Hub principal

- affichage des jeux disponibles,
- navigation directe vers chaque jeu,
- emplacement "Bientôt disponible" pour les prochains ajouts.

### Jeu "Mémoire d'échecs"

- saisie du prénom joueur,
- nombre de manches configurable (1 à 20),
- durée d'affichage configurable (1 à 60 secondes),
- difficultés prédéfinies:
	- Facile: 2 pièces,
	- Moyen: 6 pièces,
	- Difficile: 9 pièces,
- mode personnalisé:
	- même nombre de pièces sur toutes les manches,
	- ou nombre de pièces différent par manche,
- plusieurs styles de pièces,
- aperçu du style de pièces avant de lancer la partie,
- interaction en clic ou glisser-déposer,
- score par manche + score global,
- écran de résultats avec révision manche par manche,
- sauvegarde des préférences en `localStorage`.

## Règles de score

- 1 pièce bien placée (type + couleur + case) = 1 point.
- Score d'une manche = nombre de pièces correctement replacées.
- Score total = somme des scores de toutes les manches.

Formules:

```text
Score total = somme(scores des manches)
Score max   = somme(nombre de pièces attendues par manche)
```

## Lancement

### Option 1: ouverture directe

Ouvrir [index.html](index.html) dans un navigateur.

### Option 2: serveur local (recommandé)

Depuis le dossier `mini-jeux-amis`:

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Structure du projet

```text
mini-jeux-amis/
	index.html                # hub des jeux
	style.css                 # style de la page d'accueil
	README.md                 # documentation du projet
	shared/
		theme.css               # thème partagé (fond, orbes, utilitaires)
	chess-memory/
		index.html              # écran accueil + jeu + résultats
		style.css               # styles du jeu
		README.md               # note source interne au dossier jeu
		js/
			config.js             # constantes du jeu
			state.js              # état global
			logic.js              # fonctions pures (génération/comparaison)
			dom.js                # références et helpers DOM
			board.js              # rendu de l'échiquier
			dragdrop.js           # interactions clic/glisser-déposer
			storage.js            # sauvegarde/chargement préférences
			menu.js               # gestion du menu de départ
			game.js               # déroulement des manches et vérification
			results.js            # écran de résultats et révision
			main.js               # initialisation
		pieces/                 # sets de pièces
```

## Personnalisation

### Ajouter un nouveau set de pièces

1. Ajouter un dossier dans `chess-memory/pieces/<id>/`.
2. Y placer les 12 images (`wk.png`, `wq.png`, `wr.png`, `wb.png`, `wn.png`, `wp.png`, `bk.png`, `bq.png`, `br.png`, `bb.png`, `bn.png`, `bp.png`).
3. Déclarer le set dans [chess-memory/js/config.js](chess-memory/js/config.js) (`PIECE_SETS`).

### Ajouter un nouveau mini-jeu

1. Créer un dossier de jeu (exemple: `reaction/`).
2. Ajouter un `index.html` pour ce jeu.
3. Ajouter une nouvelle carte dans [index.html](index.html).

## Crédits

- Application réalisée en JavaScript vanilla.
- Set de pièces d'échecs récupéré depuis ce dépôt GitHub:
	- https://github.com/GiorgioMegrelli/chess.com-boards-and-pieces

