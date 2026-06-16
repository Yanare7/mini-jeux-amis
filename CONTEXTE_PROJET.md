# Contexte projet — Mini-jeux entre amis

> **Usage :** colle ce fichier en début de nouvelle conversation pour que GitHub Copilot ait le contexte complet du projet sans avoir besoin de relire tout l'historique.

---

## 1. Qui je suis / méthode de travail

- Je suis français, **toute l'interface utilisateur est en français** (avec accents). Les commentaires dans le code sont en français **sans accents** (convention existante du projet).
- Je travaille sur **Windows**, terminal **PowerShell**, éditeur **VS Code**.
- Je ne maîtrise pas Git en ligne de commande → j'utilise **GitHub Desktop**.
- Je découvre Firebase pendant ce projet. J'aime comprendre ce que je fais avant d'implémenter.
- Mes demandes évoluent en cours de conversation : commence par bien cerner le besoin avant de coder.
- Je préfère qu'on **implémente directement** plutôt qu'on suggère.
- Je peux fournir des captures d'écran si nécessaire.

---

## 2. Description du projet

**Nom :** Mini-jeux entre amis  
**Dépôt GitHub :** `https://github.com/Yanare7/mini-jeux-amiss`  
**Hébergement :** GitHub Pages → `https://Yanare7.github.io/mini-jeux-amis/`  
**Tech :** HTML + CSS + JavaScript vanilla. Aucun framework, aucun bundler, aucun npm.

### Ce que c'est

Une collection de mini-jeux web jouables entre amis, en local ou en ligne, directement dans le navigateur (PC, iPhone, Android).

**Jeu actuel :** Mémoire d'échecs  
**Jeu suivant :** non décidé (emplacement réservé dans l'UI)

---

## 3. Structure du dépôt

```text
mini-jeux-amis/
├── index.html              ← page d'accueil + widget "rejoindre un salon"
├── style.css               ← styles de l'accueil
├── favicon.png             ← à créer par l'utilisateur (PNG 32×32 ou 64×64)
├── README.md
├── CONTEXTE_PROJET.md      ← ce fichier
├── shared/
│   └── theme.css           ← fond dégradé violet/bleu, orbes, .hidden, body.light-theme
└── chess-memory/
    ├── index.html
    ├── style.css
    ├── favicon.png          ← même image que la racine
    ├── README.md
    ├── Idees.txt            ← pense-bête d'idées futures
    ├── js/
    │   ├── config.js        ← constantes : PIECE_SETS (35 sets), DEFAULT_PIECE_SET='neo', TIMER_CIRCUMFERENCE
    │   ├── state.js         ← toutes les variables globales mutables
    │   ├── logic.js         ← fonctions pures (generatePosition, shuffle, positionToMap…)
    │   ├── dom.js           ← refs DOM + showScreen() + populateSelect() + applyTheme() + applyCoordinates()
    │   ├── board.js         ← renderBoard, renderBoardInto, renderComparisonBoard, renderReserve, renderLabelsInto
    │   ├── dragdrop.js      ← clic + drag&drop desktop + touch
    │   ├── storage.js       ← localStorage clé 'chessMemoryPreferences'
    │   ├── online.js        ← Firebase Realtime Database (salon, parties, historique)
    │   ├── settings.js      ← modale paramètres (thème, coordonnées, choix pièces)
    │   ├── menu.js          ← config partie (difficulté, joueurs) + lancement
    │   ├── game.js          ← boucle manches, timer, vérification, multi
    │   ├── results.js       ← résultats solo/multi, classement, révision
    │   └── main.js          ← initialisation (chargé EN DERNIER), gestion pendingOnlineSalonCode
    └── pieces/              ← 35 dossiers (neo, classic, alpha, wood, 3d_staunton…)
```

**Ordre de chargement des scripts (index.html) :**
`config → state → logic → dom → board → dragdrop → storage → online → settings → menu → game → results → main`

---

## 4. Architecture technique clé

### Espace global partagé
Tous les `.js` partagent le même scope global (pas de modules ES). Les fonctions déclarées dans un fichier sont visibles dans tous les fichiers chargés après.

### CSS
- `shared/theme.css` : fond, orbes, `.hidden`, `body.light-theme` (base claire)
- `chess-memory/style.css` : tout le reste (écrans, modales, échiquier, grilles, thème clair override)

### Thème clair/sombre
- Classe `body.light-theme` → toggle via `applyTheme()` dans dom.js
- Classe `body.hide-coords` → toggle via `applyCoordinates()` pour masquer les coordonnées

### State.js — variables importantes
```js
let gameMode = 'solo';        // 'solo' | 'multi' | 'online'
let players = [];             // [{ id?, name, roundResults, totalScore, totalPossible }]
let currentPlayerIndex = 0;
let matchPositions = [];      // positions partagées par tous les joueurs
let pieceSet = 'neo';         // set actif
let theme = 'dark';           // 'dark' | 'light'
let showCoordinates = true;
let selectedDifficulty = 'easy'; // 'easy'|'medium'|'hard'|'custom'
```

---

## 5. Écrans du jeu (chess-memory/index.html)

| ID écran | Rôle |
|---|---|
| `modeScreen` | Choix solo / multi local / multi en ligne (point d'entrée) |
| `homeScreen` | Configuration de la partie |
| `passScreen` | "Passe l'appareil" entre joueurs (multi local) |
| `onlineLobbyScreen` | Créer / rejoindre un salon |
| `onlineSalonScreen` | Salon persistant (liste joueurs, config hôte, historique) |
| `onlineFinishedScreen` | Attente que les autres joueurs terminent |
| `gameScreen` | Jeu (échiquier, réserve, timer) |
| `resultsScreen` | Résultats (solo + classement multi + révision) |

**Modales** (overlay) : `settingsModal` (paramètres), `pieceModal` (choix des pièces)

---

## 6. Multijoueur en ligne — Firebase

### Config Firebase (dans online.js)
```js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_100npCPi2h5guczXge_6yLIwNfA9P3w",
  databaseURL: "https://mini-jeux-amis-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mini-jeux-amis",
  // ...
};
```
> La clé API Firebase est **publique par conception** (sécurité = règles DB, pas la clé). Elle est restreinte au domaine GitHub Pages dans Google Cloud Console.

### Structure Firebase
```
salons/
└── {CODE_6_CHARS}/
    ├── status          : 'waiting' | 'playing' | 'results'
    ├── host            : playerId
    ├── createdAt       : timestamp
    ├── lastActivityAt  : timestamp  ← mis à jour à chaque action
    ├── players/
    │   └── {playerId}/ : { name, online: bool }
    ├── currentGame/
    │   ├── config      : { rounds, duration, difficulty, pieceCounts, positions }
    │   └── results/
    │       └── {playerId}/ : { finished, totalScore, totalPossible, roundResults }
    └── history/
        └── {pushId}/   : { playedAt, rounds, difficulty, scores, fullResults }
```

### Règles Firebase (Realtime Database → Rules)
```json
{
  "rules": {
    "salons": {
      ".read": false,
      ".write": false,
      "$salonId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
> `.read: false` sur `salons/` empêche de lister tous les salons. Seul quelqu'un connaissant le code exact peut y accéder (1,3 milliard de combinaisons).

### Cycle de vie d'un salon
1. **Expiration** : si `lastActivityAt` > 1h → refus à la rejointe + suppression
2. **Suppression** : quand le dernier joueur quitte → `ref.remove()`
3. **Transfert hôte** : si l'hôte quitte → premier joueur restant devient hôte

### Fonctions clés de online.js
| Fonction | Rôle |
|---|---|
| `createSalon(name, cb)` | Crée un salon, génère un code 6 chars |
| `joinSalon(code, name, cb)` | Rejoint, vérifie expiration/statut/max |
| `listenToSalon()` | Écoute temps réel, déclenche `applyOnlineConfig` si partie lancée |
| `startOnlineGame(isReplay)` | Hôte : génère positions, écrit config dans Firebase |
| `applyOnlineConfig(data)` | Tous : reçoit config, lance `startPlayerTurn()` |
| `submitOnlineResults()` | Joueur : écrit son score dans `currentGame/results` |
| `buildOnlineResults(data)` | Fusion résultats + `showResultsScreen()` |
| `kickPlayer(id, name)` | Hôte : expulse un joueur (avec confirm) |
| `quitCurrentGame()` | Joueur : quitte la partie en cours (avec confirm) |
| `leaveSalon()` | Tous : quitte proprement, transfère hôte si besoin |
| `loadSalonHistory()` | Charge les 20 dernières parties de l'historique |

### Widget accueil (index.html racine)
- Champ code + bouton → stocke le code dans `sessionStorage('pendingOnlineSalonCode')`
- Redirige vers `chess-memory/index.html`
- `main.js` détecte le code au démarrage → ouvre directement `onlineLobbyScreen`

---

## 7. Multijoueur local

- Écran de configuration → `multiPlayersPanel` (2–8 joueurs, saisie des prénoms)
- `startMatch()` : génère `matchPositions` une fois (positions partagées = équité)
- Écran `passScreen` entre chaque joueur ("Passe l'appareil")
- `endPlayerTurn()` : sauvegarde score, passe au joueur suivant ou affiche résultats

---

## 8. Jeu — fonctionnement interne

### Génération d'une position
```js
generatePosition(n)  // n pièces aléatoires sur cases aléatoires
// retourne : [{ row, col, type, color }, ...]
```

### Cycle d'une manche
1. `startRound()` → affiche position, lance `runTimer(duration)`
2. Timer → `startPlacementPhase()` → cache position, donne réserve au joueur
3. Joueur place les pièces (clic ou drag)
4. `checkAnswer()` → `renderComparisonBoard()` + calcul score
5. Si dernière manche → `endPlayerTurn()`, sinon → bouton "Manche suivante"

### Score
- 1 point = pièce correcte (case + type + couleur)
- `renderComparisonBoard` colore les cases : vert = correct, rouge = faux/manquant

---

## 9. Paramètres et persistance

### localStorage (`'chessMemoryPreferences'`)
Sauvegarde : `playerName`, `rounds`, `duration`, `difficulty`, `pieceSet`, `theme`, `showCoordinates`, `samePieces`, `customPieces`, `perRoundCounts`

### Modale paramètres (settings.js)
- Interrupteur thème clair/sombre
- Interrupteur coordonnées
- Aperçu 2 rois (noir + blanc) du set actif
- Bouton "Changer les pièces" → `pieceModal` (grille 35 sets + échiquier aperçu)
- `pendingPieceSet` : set en attente de validation (pas appliqué avant "Valider")

---

## 10. CSS — conventions

### Classe utilitaires importantes
| Classe | Effet |
|---|---|
| `.hidden` | `display: none` |
| `.full-width` | `width: 100%` |
| `.primary-btn` | Bouton principal (dégradé cyan→violet) |
| `.small-btn` | Bouton secondaire |
| `.ghost-btn` | Bouton transparent |
| `.icon-btn` | Bouton carré 36×36 (ex: ⚙, ✕) |
| `.back-link--btn` | Lien retour stylé comme texte |
| `.difficulty-btn.active` | Bouton difficulté sélectionné |
| `body.light-theme` | Toutes les surcharges thème clair |
| `body.hide-coords` | Cache `.ranks` et `.files` (visibility: hidden) |

---

## 11. Idées futures (Idees.txt + conversation)

### Gameplay
- Mode "Rapidfire" (1 pièce, chrono court, score vitesse)
- Mode "Miroir" (colonnes inversées)
- Indice payant (voir une pièce 2s → -points)
- Streak/combo (multiplicateur score)
- Mode Progression (campagne de niveaux avec étoiles)

### Interface
- Sons (Web Audio API)
- Animations de pièces (chute/rebond)
- Classement local top 10 (localStorage)
- Choix de plateau (fond clair/sombre/bois/marbre)
- Replay animé du placement idéal

### Online
- Chat dans le salon
- Historique des parties (déjà implémenté côté Firebase)

---

## 12. Points d'attention / pièges connus

1. **`create_file` échoue sur un fichier existant** → toujours utiliser `replace_string_in_file`.
2. **Scripts en espace global** : pas de `import/export`. Toute variable déclarée dans un fichier est visible dans ceux chargés après.
3. **`renderPieceSetPreview` et `populatePieceSetSelect` ont été supprimés** de menu.js → ils sont dans settings.js.
4. **`pieceSetOverride`** : variable temporaire dans state.js utilisée pendant l'aperçu du picker de pièces. Doit être `null` pendant le jeu réel.
5. **Positions partagées** en multi (local et online) : `matchPositions` est généré une seule fois pour l'équité. En online, l'hôte les génère et les écrit dans Firebase.
6. **`gameMode`** peut valoir `'solo'`, `'multi'` ou `'online'`. Beaucoup de conditions dans le code en dépendent.
7. **Favicon** : à placer en `mini-jeux-amis/favicon.png` ET `mini-jeux-amis/chess-memory/favicon.png`.
8. **Firebase clé publique** : normal et voulu. Sécurité = règles DB.
9. **`sessionStorage('pendingOnlineSalonCode')`** : mécanisme de passage de code entre la page d'accueil et le jeu.
10. **Encodage PowerShell** : pour écrire des fichiers JS avec des caractères spéciaux depuis le terminal, utiliser `Set-Content ... -Encoding UTF8`.

---

## 13. Commandes utiles

```powershell
# Lancer le serveur local
cd "c:\Users\ZJGQ1946\Projets\mini-jeux-amis"
python -m http.server 8000

# Ouvrir le jeu : http://localhost:8000/chess-memory/
# Ouvrir l'accueil : http://localhost:8000/
```

**GitHub Desktop** : utilisé pour tous les commits et push (pas de CLI git).
