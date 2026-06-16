// ============================================================
// REFERENCES AU DOM + UTILITAIRES GENERAUX
//
// Ce fichier recupere une fois pour toutes les elements HTML
// dont les autres fichiers auront besoin (document.getElementById),
// et fournit des fonctions generiques de manipulation de la page
// (changer d'ecran, remplir une liste deroulante).
// ============================================================

// --- Ecrans ---
const modeScreen = document.getElementById('modeScreen');
const homeScreen = document.getElementById('homeScreen');
const passScreen = document.getElementById('passScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');

// --- Ecran mode ---
const settingsBtn = document.getElementById('settingsBtn');
const soloBtn = document.getElementById('soloBtn');
const multiLocalBtn = document.getElementById('multiLocalBtn');
const multiOnlineBtn = document.getElementById('multiOnlineBtn');

// --- Ecrans online ---
const onlineBackBtn = document.getElementById('onlineBackBtn');
const onlinePlayerNameInput = document.getElementById('onlinePlayerNameInput');
const createSalonBtn = document.getElementById('createSalonBtn');
const salonCodeInput = document.getElementById('salonCodeInput');
const joinSalonBtn = document.getElementById('joinSalonBtn');
const onlineLobbyError = document.getElementById('onlineLobbyError');
const onlineSalonCodeEl = document.getElementById('onlineSalonCodeEl');
const copySalonCodeBtn = document.getElementById('copySalonCodeBtn');
const onlinePlayersList = document.getElementById('onlinePlayersList');
const onlineConfigPanel = document.getElementById('onlineConfigPanel');
const onlineRoundsSelect = document.getElementById('onlineRoundsSelect');
const onlineDurationSelect = document.getElementById('onlineDurationSelect');
const onlineDifficultyGrid = document.getElementById('onlineDifficultyGrid');
const onlineStartBtn = document.getElementById('onlineStartBtn');
const onlineWaitMsg = document.getElementById('onlineWaitMsg');
const waitLeaveBtn = document.getElementById('waitLeaveBtn');
const onlineFinishedCount = document.getElementById('onlineFinishedCount');

// --- Menu / configuration (accueil) ---
const setupBackBtn = document.getElementById('setupBackBtn');
const setupTitle = document.getElementById('setupTitle');
const soloNamePanel = document.getElementById('soloNamePanel');
const playerNameInput = document.getElementById('playerName');
const multiPlayersPanel = document.getElementById('multiPlayersPanel');
const playerCountSelect = document.getElementById('playerCountSelect');
const playerNamesPanel = document.getElementById('playerNamesPanel');
const roundsSelect = document.getElementById('roundsSelect');
const durationInput = document.getElementById('duration');
const difficultyGrid = document.getElementById('difficultyGrid');
const customDifficultyPanel = document.getElementById('customDifficultyPanel');
const samePiecesCheckbox = document.getElementById('samePiecesCheckbox');
const samePiecesPanel = document.getElementById('samePiecesPanel');
const customPiecesInput = document.getElementById('customPiecesInput');
const perRoundPiecesPanel = document.getElementById('perRoundPiecesPanel');
const playBtn = document.getElementById('playBtn');

// --- Ecran passage (multijoueur) ---
const passTitle = document.getElementById('passTitle');
const passSubtitle = document.getElementById('passSubtitle');
const passContinueBtn = document.getElementById('passContinueBtn');

// --- Modale parametres ---
const settingsModal = document.getElementById('settingsModal');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');
const settingsDoneBtn = document.getElementById('settingsDoneBtn');
const themeToggle = document.getElementById('themeToggle');
const coordsToggle = document.getElementById('coordsToggle');
const kingsPreview = document.getElementById('kingsPreview');
const openPiecePickerBtn = document.getElementById('openPiecePickerBtn');

// --- Modale choix des pieces ---
const pieceModal = document.getElementById('pieceModal');
const pieceCloseBtn = document.getElementById('pieceCloseBtn');
const pieceModalSetName = document.getElementById('pieceModalSetName');
const pieceSetGrid = document.getElementById('pieceSetGrid');
const pieceCancelBtn = document.getElementById('pieceCancelBtn');
const pieceValidateBtn = document.getElementById('pieceValidateBtn');
const pieceSetPreviewBoard = document.getElementById('pieceSetPreviewBoard');
const pieceSetPreviewRanks = document.getElementById('pieceSetPreviewRanks');
const pieceSetPreviewFiles = document.getElementById('pieceSetPreviewFiles');

// --- Jeu ---
const board = document.getElementById('board');
const ranksEl = document.getElementById('ranks');
const filesEl = document.getElementById('files');
const solutionBoard = document.getElementById('solutionBoard');
const solutionRanksEl = document.getElementById('solutionRanks');
const solutionFilesEl = document.getElementById('solutionFiles');
const solutionSection = document.getElementById('solutionSection');
const reserveEl = document.getElementById('reserve');
const checkControls = document.getElementById('checkControls');
const checkBtn = document.getElementById('checkBtn');
const nextRoundControls = document.getElementById('nextRoundControls');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const countdownEl = document.getElementById('countdown');
const roundInfoEl = document.getElementById('roundInfo');
const timerEl = document.getElementById('timer');
const timerProgress = document.getElementById('timerProgress');
const timerValue = document.getElementById('timerValue');

// --- Resultats ---
const resultsTitle = document.getElementById('resultsTitle');
const finalScoreEl = document.getElementById('finalScore');
const leaderboardSection = document.getElementById('leaderboardSection');
const playerTabs = document.getElementById('playerTabs');
const resultsTable = document.getElementById('resultsTable');
const resultsTableBody = document.getElementById('resultsTableBody');
const reviewSection = document.getElementById('reviewSection');
const reviewLabel = document.getElementById('reviewLabel');
const reviewBoard = document.getElementById('reviewBoard');
const reviewRanksEl = document.getElementById('reviewRanks');
const reviewFilesEl = document.getElementById('reviewFiles');
const reviewSolutionBoard = document.getElementById('reviewSolutionBoard');
const reviewSolutionRanksEl = document.getElementById('reviewSolutionRanks');
const reviewSolutionFilesEl = document.getElementById('reviewSolutionFiles');
const homeBtn = document.getElementById('homeBtn');

// Affiche l'ecran demande (par son id) et cache tous les autres
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// Remplit un <select> avec les entiers de min a max,
// et selectionne defaultValue par defaut
function populateSelect(selectElement, min, max, defaultValue) {
  for (let i = min; i <= max; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    if (i === defaultValue) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  }
}

// Applique le theme courant (clair/sombre) au document via une classe sur <body>
function applyTheme() {
  document.body.classList.toggle('light-theme', theme === 'light');
}

// Affiche ou cache les etiquettes de coordonnees autour des echiquiers
function applyCoordinates() {
  document.body.classList.toggle('hide-coords', !showCoordinates);
}
