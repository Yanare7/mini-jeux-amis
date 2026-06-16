// ============================================================
// DEROULEMENT D'UNE MANCHE
//
// Minuteur, phase de memorisation, phase de placement,
// puis verification de la reponse du joueur.
// ============================================================

// Met a jour le texte "Manche X / Y - Score total : ..."
function updateRoundInfo() {
  roundInfoEl.textContent =
    'Manche ' + currentRound + ' / ' + totalRounds +
    '   -   Score total : ' + totalScore + ' / ' + totalPossible;
  roundInfoEl.classList.remove('hidden');
}

// Met a jour l'affichage du minuteur circulaire.
// "remaining" peut etre un nombre a virgule (temps reel restant) :
// le texte affiche l'entier superieur, le cercle suit la valeur exacte.
function updateTimerDisplay(remaining, duration) {
  timerValue.textContent = Math.ceil(remaining);
  const offset = TIMER_CIRCUMFERENCE * (1 - remaining / duration);
  timerProgress.style.strokeDashoffset = offset;
}

// Demarre un nouveau match (solo ou multi).
// On genere une fois les positions de chaque manche : tous les joueurs
// affrontent exactement les memes positions (comparaison equitable).
function startMatch() {
  matchPositions = pieceCounts.map(n => generatePosition(n));
  currentPlayerIndex = 0;
  if (gameMode === 'multi') {
    showPassScreen();
  } else {
    startPlayerTurn();
  }
}

// Ecran "passe l'appareil" : avant le premier joueur, puis entre chaque joueur
function showPassScreen() {
  const player = players[currentPlayerIndex];
  if (currentPlayerIndex === 0) {
    passTitle.textContent = 'Au tour de ' + player.name;
    passSubtitle.textContent = 'Installe-toi, la partie va commencer';
  } else {
    passTitle.textContent = 'Passe l\'appareil a ' + player.name;
    passSubtitle.textContent = 'A ' + player.name + ' de jouer ses ' + totalRounds + ' manches';
  }
  showScreen('passScreen');
}

// Demarre le tour du joueur courant (remet la progression a zero)
function startPlayerTurn() {
  playerName = players[currentPlayerIndex].name;
  currentRound = 0;
  totalScore = 0;
  totalPossible = 0;
  roundResults = [];
  showScreen('gameScreen');
  startRound();
}

passContinueBtn.addEventListener('click', startPlayerTurn);

// Demarre une nouvelle manche : affiche la position partagee de la manche,
// puis lance le compte a rebours avant de la cacher
function startRound() {
  currentRound++;
  updateRoundInfo();

  placementActive = false;
  checkControls.classList.add('hidden');
  nextRoundControls.classList.add('hidden');
  solutionSection.classList.add('hidden');
  selectedIndex = null;
  boardPlacements = {};
  reservePieces = [];
  renderReserve();

  const duration = parseInt(durationInput.value, 10);
  originalPosition = matchPositions[currentRound - 1];

  renderBoard(positionToMap(originalPosition), false);

  timerEl.classList.remove('hidden');
  countdownEl.textContent = 'Memorise la position !';

  runTimer(duration);
}

// Lance le decompte visuel de "duration" secondes, puis demarre la phase
// de placement.
//
// On utilise requestAnimationFrame plutot que setInterval : a chaque image
// (~60 fois par seconde), on calcule le temps REELLEMENT ecoule depuis le
// debut et on met a jour le cercle en consequence. Ca evite le decalage
// d'1 seconde qu'on aurait avec setInterval + une transition CSS.
function runTimer(duration) {
  if (timerAnimationId !== null) {
    cancelAnimationFrame(timerAnimationId);
    timerAnimationId = null;
  }

  const startTime = performance.now();

  function tick(now) {
    const elapsedSeconds = (now - startTime) / 1000;
    const remaining = Math.max(0, duration - elapsedSeconds);
    updateTimerDisplay(remaining, duration);

    if (elapsedSeconds < duration) {
      timerAnimationId = requestAnimationFrame(tick);
    } else {
      timerAnimationId = null;
      startPlacementPhase();
    }
  }

  timerAnimationId = requestAnimationFrame(tick);
}

// Cache la position et prepare la reserve : le joueur peut maintenant jouer
function startPlacementPhase() {
  reservePieces = shuffle(originalPosition.map(p => ({ type: p.type, color: p.color })));
  boardPlacements = {};
  selectedIndex = null;
  placementActive = true;
  renderBoard(boardPlacements, true);
  renderReserve();
  checkControls.classList.remove('hidden');
  timerEl.classList.add('hidden');
  countdownEl.textContent = 'A toi de jouer : clique ou glisse une piece sur une case';
}

// Compare la position du joueur a la position d'origine et affiche le resultat
function checkAnswer() {
  if (!placementActive) return;

  const originalMap = positionToMap(originalPosition);
  const total = originalPosition.length;
  const correctCount = renderComparisonBoard(board, originalMap, boardPlacements);

  renderBoardInto(solutionBoard, originalMap, false);
  solutionSection.classList.remove('hidden');

  roundResults.push({
    round: currentRound,
    score: correctCount,
    total: total,
    originalPosition: originalPosition,
    placements: boardPlacements
  });

  totalScore += correctCount;
  totalPossible += total;
  updateRoundInfo();

  placementActive = false;
  checkControls.classList.add('hidden');

  if (currentRound < totalRounds) {
    countdownEl.textContent = 'Manche ' + currentRound + ' : ' + correctCount + ' / ' + total + ' bonnes pieces';
    nextRoundControls.classList.remove('hidden');
  } else {
    countdownEl.textContent = 'Partie terminee !';
    endPlayerTurn();
  }
}

// Fin du tour d'un joueur : on sauvegarde son score, puis on passe au
// joueur suivant (multi) ou on affiche les resultats.
function endPlayerTurn() {
  players[currentPlayerIndex].roundResults = roundResults.slice();
  players[currentPlayerIndex].totalScore = totalScore;
  players[currentPlayerIndex].totalPossible = totalPossible;

  if (gameMode === 'online') {
    // Envoie les resultats a Firebase, puis affiche l'ecran d'attente.
    // Le listener listenForFinish detectera quand tout le monde a fini.
    showScreen('onlineFinishedScreen');
    submitOnlineResults().catch(err => {
      console.error('Erreur envoi resultats :', err);
    });
  } else if (gameMode === 'multi' && currentPlayerIndex < players.length - 1) {
    currentPlayerIndex++;
    showPassScreen();
  } else {
    showResultsScreen();
  }
}

checkBtn.addEventListener('click', checkAnswer);
nextRoundBtn.addEventListener('click', startRound);
