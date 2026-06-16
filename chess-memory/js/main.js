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
populateSelect(onlineRoundsSelect, 1, 20, 5);
populateSelect(onlineDurationSelect, 1, 60, 10);

// Etiquettes a-h / 8-1 de l'apercu du picker de pieces
renderLabelsInto(pieceSetPreviewRanks, pieceSetPreviewFiles);

// Recharge les preferences sauvegardees lors d'une visite precedente
// (prenom, difficulte, style de pieces, theme, coordonnees...). Doit venir
// apres avoir rempli les listes deroulantes ci-dessus.
loadPreferences();

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
