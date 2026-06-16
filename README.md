# Mini-jeux entre amis

Collection de mini-jeux web en HTML/CSS/JavaScript pur, pensée pour jouer entre amis — en local sur le même appareil, ou en ligne via Firebase.

## Jeux disponibles

| Jeu | Mode solo | Multi local | Multi en ligne |
|---|---|---|---|
| **Mémoire d'échecs** | ✅ | ✅ (passe-passe) | ✅ (Firebase, jusqu'à 8) |
| Prochain jeu | — | — | — |

## Fonctionnalités du hub

- Page d'accueil listant les jeux disponibles.
- **Widget "Rejoindre un salon"** : entre un code à 6 caractères et rejoins directement une partie en ligne sans passer par le jeu.
- Structure extensible pour ajouter de nouveaux mini-jeux.

## Lancement en local

Depuis le dossier `mini-jeux-amis` :

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

> Fonctionne aussi en ouvrant `index.html` directement dans un navigateur,
> sauf pour le multijoueur en ligne qui nécessite une connexion internet.

## Hébergement en ligne

Le projet est hébergé sur **GitHub Pages** et accessible à :

```
https://TON_PSEUDO.github.io/mini-jeux-amis/
```

## Structure du projet

```text
mini-jeux-amis/
├── index.html              # hub principal + widget salon en ligne
├── style.css               # styles de la page d'accueil
├── favicon.png             # icône du site (à placer ici)
├── README.md
├── shared/
│   └── theme.css           # thème commun (fond dégradé, orbes, .hidden)
└── chess-memory/           # → voir chess-memory/README.md
```

## Ajouter un nouveau mini-jeu

1. Créer un dossier `mon-jeu/` avec son propre `index.html`.
2. Ajouter une carte dans `index.html` (copier le bloc `<a class="game-card">` existant).
3. Importer `../shared/theme.css` pour le fond et les orbes.

## Crédits

- Développé en JavaScript vanilla, sans framework ni dépendance.
- Sets de pièces d'échecs : [GiorgioMegrelli/chess.com-boards-and-pieces](https://github.com/GiorgioMegrelli/chess.com-boards-and-pieces)
- Multijoueur en ligne : [Firebase Realtime Database](https://firebase.google.com) (plan gratuit Spark)
