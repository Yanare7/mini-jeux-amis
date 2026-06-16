// ============================================================
// SAUVEGARDE LOCALE DES PREFERENCES (localStorage)
//
// localStorage est une petite "base cle/valeur" fournie par le
// navigateur : ce qu'on y ecrit reste disponible meme apres avoir
// ferme l'onglet ou le navigateur, mais reste UNIQUEMENT sur cet
// appareil (rien n'est envoye a un serveur).
//
// localStorage ne stocke que du texte, donc on convertit notre
// objet de preferences en texte avec JSON.stringify(), et on fait
// l'inverse avec JSON.parse() pour le relire
// (= equivalent du module "json" en Python).
// ============================================================

// Cle utilisee dans le localStorage. Si tu changes la structure de
// l'objet sauvegarde plus tard, tu peux changer ce nom pour repartir
// de zero (les anciennes donnees, avec l'ancien nom, seront ignorees).
const STORAGE_KEY = 'chessMemoryPreferences';

// Lit l'ecran d'accueil et construit un objet representant
// les preferences actuelles du joueur
function collectPreferences() {
  const prefs = {
    playerName: playerNameInput.value,
    rounds: roundsSelect.value,
    duration: durationInput.value,
    difficulty: selectedDifficulty,
    pieceSet: pieceSet,
    theme: theme,
    showCoordinates: showCoordinates,
    samePieces: samePiecesCheckbox.checked,
    customPieces: customPiecesInput.value,
    reserveMode: reserveMode,
    perRoundCounts: null
  };

  // En difficulte personnalisee avec un nombre de pieces different par manche,
  // on sauvegarde aussi ces valeurs
  if (selectedDifficulty === 'custom' && !samePiecesCheckbox.checked) {
    const inputs = Array.from(perRoundPiecesPanel.querySelectorAll('.per-round-input'));
    prefs.perRoundCounts = inputs.map(input => input.value);
  }

  return prefs;
}

// Enregistre les preferences actuelles dans le localStorage du navigateur.
// Si localStorage n'est pas disponible (navigation privee, etc.), on
// ignore simplement l'erreur : ca ne doit jamais empecher de jouer.
function savePreferences() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectPreferences()));
  } catch (e) {
    console.warn('Impossible de sauvegarder les preferences :', e);
  }
}

// Recharge les preferences enregistrees et les applique a l'ecran d'accueil.
// Ne fait rien s'il n'y a rien de sauvegarde (premiere visite) ou si la
// lecture echoue.
function loadPreferences() {
  let prefs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    prefs = JSON.parse(raw);
  } catch (e) {
    console.warn('Impossible de lire les preferences sauvegardees :', e);
    return;
  }

  if (prefs.playerName) playerNameInput.value = prefs.playerName;
  if (prefs.rounds) roundsSelect.value = prefs.rounds;
  if (prefs.duration) durationInput.value = prefs.duration;

  if (prefs.theme === 'light' || prefs.theme === 'dark') {
    theme = prefs.theme;
  }
  if (typeof prefs.showCoordinates === 'boolean') {
    showCoordinates = prefs.showCoordinates;
  }

  if (prefs.pieceSet && PIECE_SETS.some(set => set.id === prefs.pieceSet)) {
    pieceSet = prefs.pieceSet;
  }

  if (['all', 'exact'].includes(prefs.reserveMode)) {
    reserveMode = prefs.reserveMode;
  }

  if (typeof prefs.samePieces === 'boolean') {
    samePiecesCheckbox.checked = prefs.samePieces;
  }
  if (prefs.customPieces) {
    customPiecesInput.value = prefs.customPieces;
  }

  // Difficulte : applique la valeur et met a jour la grille de boutons
  if (['easy', 'medium', 'hard', 'custom'].includes(prefs.difficulty)) {
    selectedDifficulty = prefs.difficulty;
  }
  difficultyGrid.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.difficulty === selectedDifficulty);
  });

  // Met a jour l'affichage du panneau de difficulte personnalisee
  // (cree au passage les champs "nombre de pieces par manche" si besoin)
  updateDifficultyPanels();

  // Si des valeurs par manche etaient sauvegardees, on les applique
  // aux champs qui viennent d'etre crees par updateDifficultyPanels()
  if (prefs.perRoundCounts) {
    const inputs = Array.from(perRoundPiecesPanel.querySelectorAll('.per-round-input'));
    prefs.perRoundCounts.forEach((value, index) => {
      if (inputs[index]) {
        inputs[index].value = value;
      }
    });
  }
}
