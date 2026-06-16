// ============================================================
// ECRAN RESULTATS
//
// Solo : tableau recapitulatif des manches + revision.
// Multi : classement des joueurs, puis tableau/revision par joueur.
// ============================================================

// Echappe un texte avant insertion en HTML (les prenoms sont saisis
// par les joueurs : on evite toute injection).
function escapeText(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function showResultsScreen() {
  showScreen('resultsScreen');
  reviewSection.classList.add('hidden');

  if (gameMode === 'multi' || gameMode === 'online') {
    renderMultiResults();
  } else {
    renderSoloResults();
  }
}

// --- Solo ---
function renderSoloResults() {
  leaderboardSection.classList.add('hidden');
  playerTabs.classList.add('hidden');
  resultsTable.classList.remove('hidden');

  const player = players[0];
  resultsTitle.textContent = player.name ? 'Bravo ' + player.name + ' !' : 'Resultats';
  finalScoreEl.textContent = 'Score total : ' + player.totalScore + ' / ' + player.totalPossible;
  renderRoundTable(player);
}

// --- Multi ---
function renderMultiResults() {
  resultsTitle.textContent = 'Resultats';
  leaderboardSection.classList.remove('hidden');
  playerTabs.classList.remove('hidden');
  resultsTable.classList.remove('hidden');

  // Classement par score decroissant
  const ranking = players
    .map((p, i) => ({ player: p, index: i }))
    .sort((a, b) => b.player.totalScore - a.player.totalScore);

  const best = ranking[0].player.totalScore;
  const winners = ranking.filter(r => r.player.totalScore === best).map(r => r.player.name);
  finalScoreEl.textContent = winners.length > 1
    ? 'Egalite : ' + winners.join(', ')
    : 'Vainqueur : ' + winners[0];

  // Tableau du classement
  leaderboardSection.innerHTML = '';
  const table = document.createElement('table');
  table.classList.add('leaderboard-table');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>#</th><th>Joueur</th><th>Score</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  ranking.forEach((r, pos) => {
    const tr = document.createElement('tr');
    if (r.player.totalScore === best) tr.classList.add('winner-row');
    tr.innerHTML =
      '<td>' + (pos + 1) + '</td>' +
      '<td>' + escapeText(r.player.name) + '</td>' +
      '<td>' + r.player.totalScore + ' / ' + r.player.totalPossible + '</td>';
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  leaderboardSection.appendChild(table);

  // Onglets pour revoir le detail de chaque joueur (ordre du classement)
  playerTabs.innerHTML = '';
  ranking.forEach(r => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('player-tab');
    btn.textContent = r.player.name;
    btn.addEventListener('click', () => selectPlayerTab(r.player, btn));
    playerTabs.appendChild(btn);
  });

  // Affiche le detail du vainqueur par defaut
  selectPlayerTab(ranking[0].player, playerTabs.querySelector('.player-tab'));
}

function selectPlayerTab(player, btn) {
  playerTabs.querySelectorAll('.player-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  reviewSection.classList.add('hidden');
  renderRoundTable(player);
}

// Construit le tableau "manche / score / revoir" pour un joueur donne
function renderRoundTable(player) {
  resultsTableBody.innerHTML = '';
  player.roundResults.forEach((result, index) => {
    const tr = document.createElement('tr');

    const tdRound = document.createElement('td');
    tdRound.textContent = 'Manche ' + result.round;

    const tdScore = document.createElement('td');
    tdScore.textContent = result.score + ' / ' + result.total;

    const tdReview = document.createElement('td');
    const reviewBtn = document.createElement('button');
    reviewBtn.textContent = 'Revoir';
    reviewBtn.classList.add('small-btn');
    // En mode online les autres joueurs n'ont pas de donnees de revision
    const hasData = result.originalPosition && result.originalPosition.length > 0;
    if (!hasData) {
      reviewBtn.disabled = true;
      reviewBtn.title = 'Revision non disponible';
    } else {
      reviewBtn.addEventListener('click', () => showReview(player.roundResults, index));
    }
    tdReview.appendChild(reviewBtn);

    tr.appendChild(tdRound);
    tr.appendChild(tdScore);
    tr.appendChild(tdReview);
    resultsTableBody.appendChild(tr);
  });
}

// Affiche la comparaison reponse / solution d'une manche
function showReview(results, index) {
  const result = results[index];
  if (!result.originalPosition || !result.originalPosition.length) return;
  const originalMap = positionToMap(result.originalPosition);

  reviewLabel.textContent = 'Manche ' + result.round + ' - reponse (' + result.score + ' / ' + result.total + ')';
  renderComparisonBoard(reviewBoard, originalMap, result.placements);
  renderBoardInto(reviewSolutionBoard, originalMap, false);

  reviewSection.classList.remove('hidden');
}

homeBtn.addEventListener('click', () => {
  showScreen('modeScreen');
});
