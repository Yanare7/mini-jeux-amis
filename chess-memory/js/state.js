// ============================================================
// ETAT GLOBAL DU JEU
//
// Toutes les variables declarees ici changent pendant la partie
// (contrairement a config.js, qui ne contient que des constantes).
// Les autres fichiers .js lisent et modifient ces variables.
// ============================================================

// --- Etat de la manche en cours ---
let timerAnimationId = null; // identifiant de la boucle d'animation du minuteur (requestAnimationFrame)
let originalPosition = [];    // position a memoriser : [{row, col, type, color}, ...]
let reservePieces = [];       // pieces que le joueur doit replacer
let boardPlacements = {};     // pieces posees par le joueur : { "row,col": {type, color} }
let selectedIndex = null;     // index de la piece de la reserve selectionnee (mode clic)
let placementActive = false;  // true pendant la phase ou le joueur replace les pieces

// --- Style de pieces choisi dans le menu (cf. PIECE_SETS dans config.js) ---
let pieceSet = DEFAULT_PIECE_SET;
let pieceSetOverride = null;  // set utilise temporairement pour un apercu (picker), sinon null

// --- Preferences d'affichage ---
let theme = 'dark';           // 'dark' ou 'light'
let showCoordinates = true;   // afficher les etiquettes a-h / 8-1 autour de l'echiquier

// --- Etat du glisser-deposer ---
let activeDrag = null;        // infos sur le glissement en cours, ou null si aucun
let dragJustHappened = false; // true juste apres un glisser-deposer (pour ignorer le "click" qui suit)

// --- Parametres choisis dans le menu ---
let totalRounds = 5;
let pieceCounts = [];
let playerName = '';
let selectedDifficulty = 'easy'; // 'easy' | 'medium' | 'hard' | 'custom'

// --- Mode de jeu et multijoueur local ---
let gameMode = 'solo';        // 'solo' | 'multi'
let players = [];             // [{ name, roundResults, totalScore, totalPossible }]
let currentPlayerIndex = 0;   // joueur dont c'est le tour (multi)
let matchPositions = [];      // positions partagees par tous les joueurs : [ [ {row,col,type,color}... ], ... ]

// --- Progression de la partie (joueur courant) ---
let currentRound = 0;
let totalScore = 0;
let totalPossible = 0;
let roundResults = [];
