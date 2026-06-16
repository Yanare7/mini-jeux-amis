// ============================================================
// INITIALISATION
//
// Ce fichier doit etre charge EN DERNIER (apres tous les autres) :
// il met en place l'affichage initial une fois que tout
// le reste (constantes, etat, fonctions) est pret.
// ============================================================

// Le minuteur circulaire a besoin de connaitre son perimetre
// pour calculer son animation (cf. updateTimerDisplay dans game.js)
timerProgress.style.strokeDasharray = TIMER_CIRCUMFERENCE;

// Remplit les listes deroulantes "nombre de manches", "duree d'affichage"
// et "nombre de joueurs"
populateSelect(roundsSelect, 1, 20, 5);
populateSelect(durationInput, 1, 60, 10);
populateSelect(playerCountSelect, 2, 8, 2);
// Selects de la salle d'attente online (memes plages)
populateSelect(salonRoundsSelect, 1, 20, 5);
populateSelect(salonDurationSelect, 1, 60, 10);

// Etiquettes a-h / 8-1 de l'apercu du picker de pieces
renderLabelsInto(pieceSetPreviewRanks, pieceSetPreviewFiles);

// Recharge les preferences sauvegardees lors d'une visite precedente
// (prenom, difficulte, style de pieces, theme, coordonnees...). Doit venir
// apres avoir rempli les listes deroulantes ci-dessus.
loadPreferences();

// Synchronise le toggle coordonnees de l'ecran de config avec l'etat charge
if (coordsHomeToggle) coordsHomeToggle.checked = showCoordinates;

// Synchronise le toggle de reserve de pieces avec l'etat charge
if (allPiecesToggle) allPiecesToggle.checked = (reserveMode === 'all');

// Applique le theme (clair/sombre) et l'affichage des coordonnees
applyTheme();
applyCoordinates();

// Affiche les etiquettes a-h / 8-1 autour de chaque echiquier
renderLabelsInto(ranksEl, filesEl);
renderLabelsInto(solutionRanksEl, solutionFilesEl);
renderLabelsInto(reviewRanksEl, reviewFilesEl);
renderLabelsInto(reviewSolutionRanksEl, reviewSolutionFilesEl);

// Affiche un echiquier vide au demarrage
renderBoard({}, false);

// Si l'utilisateur vient de l'accueil avec un code de salon en attente,
// on pre-remplit le champ et on ouvre l'ecran de lobby directement.
// Si une action "create" est en attente, on ouvre directement le lobby.
(function() {
  // Pre-rempli le prenom si l'utilisateur vient de l'accueil
  var pendingName = sessionStorage.getItem('pendingPlayerName');
  if (pendingName && onlinePlayerNameInput) {
    onlinePlayerNameInput.value = pendingName;
    sessionStorage.removeItem('pendingPlayerName');
    sessionStorage.setItem('autoPlayerName', pendingName);
  }

  var pendingCode = sessionStorage.getItem('pendingOnlineSalonCode');
  if (pendingCode) {
    sessionStorage.removeItem('pendingOnlineSalonCode');
    if (salonCodeInput) salonCodeInput.value = pendingCode;
    gameMode = 'online';
    showScreen('onlineLobbyScreen');
    return;
  }
  var pendingAction = sessionStorage.getItem('pendingOnlineAction');
  if (pendingAction === 'create') {
    sessionStorage.removeItem('pendingOnlineAction');
    gameMode = 'online';
    showScreen('onlineLobbyScreen');
  }
})();
