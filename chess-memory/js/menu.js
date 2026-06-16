// ============================================================
// ECRAN ACCUEIL / CONFIGURATION
//
// Choix du mode (solo / multi), reglage des options de partie
// (difficulte en grille, joueurs), et lancement de la partie.
// ============================================================

// --- Difficulte (grille de boutons) ---

// Affiche ou cache le panneau de difficulte personnalisee
function updateDifficultyPanels() {
  if (selectedDifficulty === 'custom') {
    customDifficultyPanel.classList.remove('hidden');
    if (samePiecesCheckbox.checked) {
      samePiecesPanel.classList.remove('hidden');
      perRoundPiecesPanel.classList.add('hidden');
    } else {
      samePiecesPanel.classList.add('hidden');
      perRoundPiecesPanel.classList.remove('hidden');
      renderPerRoundInputs();
    }
  } else {
    customDifficultyPanel.classList.add('hidden');
  }
}

// Selectionne une difficulte et met a jour l'apparence de la grille
function selectDifficulty(diff) {
  selectedDifficulty = diff;
  difficultyGrid.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.difficulty === diff);
  });
  updateDifficultyPanels();
  savePreferences();
}

difficultyGrid.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => selectDifficulty(btn.dataset.difficulty));
});

// Cree un champ "nombre de pieces" par manche (mode personnalise, non uniforme)
function renderPerRoundInputs() {
  perRoundPiecesPanel.innerHTML = '';
  const n = parseInt(roundsSelect.value, 10);
  for (let i = 1; i <= n; i++) {
    const row = document.createElement('div');
    row.classList.add('per-round-row');

    const label = document.createElement('label');
    label.textContent = 'Manche ' + i;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '16';
    input.value = '4';
    input.classList.add('per-round-input');

    row.appendChild(label);
    row.appendChild(input);
    perRoundPiecesPanel.appendChild(row);
  }
}

samePiecesCheckbox.addEventListener('change', updateDifficultyPanels);
roundsSelect.addEventListener('change', () => {
  if (selectedDifficulty === 'custom' && !samePiecesCheckbox.checked) {
    renderPerRoundInputs();
  }
});

// --- Joueurs (multijoueur local) ---

// Cree un champ "prenom" par joueur (en conservant les noms deja saisis)
function renderPlayerNameInputs() {
  const previous = Array.from(playerNamesPanel.querySelectorAll('.player-name-input')).map(i => i.value);
  playerNamesPanel.innerHTML = '';
  const n = parseInt(playerCountSelect.value, 10);
  for (let i = 1; i <= n; i++) {
    const label = document.createElement('label');
    label.textContent = 'Joueur ' + i;

    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('player-name-input');
    input.placeholder = 'Prenom du joueur ' + i;
    if (previous[i - 1]) input.value = previous[i - 1];

    playerNamesPanel.appendChild(label);
    playerNamesPanel.appendChild(input);
  }
}

playerCountSelect.addEventListener('change', renderPlayerNameInputs);

// --- Choix du mode ---

function enterSolo() {
  gameMode = 'solo';
  setupTitle.textContent = 'Partie solo';
  soloNamePanel.classList.remove('hidden');
  multiPlayersPanel.classList.add('hidden');
  showScreen('homeScreen');
}

function enterMultiLocal() {
  gameMode = 'multi';
  setupTitle.textContent = 'Multijoueur local';
  soloNamePanel.classList.add('hidden');
  multiPlayersPanel.classList.remove('hidden');
  if (!playerNamesPanel.children.length) {
    renderPlayerNameInputs();
  }
  showScreen('homeScreen');
}

soloBtn.addEventListener('click', enterSolo);
multiLocalBtn.addEventListener('click', enterMultiLocal);
multiOnlineBtn.addEventListener('click', () => {
  gameMode = 'online';
  showScreen('onlineLobbyScreen');
});
setupBackBtn.addEventListener('click', () => showScreen('modeScreen'));

// --- Toggle coordonnees (homeScreen) ---
coordsHomeToggle.addEventListener('change', () => {
  showCoordinates = coordsHomeToggle.checked;
  if (coordsToggle) coordsToggle.checked = showCoordinates;
  applyCoordinates();
  savePreferences();
});

// --- Mode de reserve (toggle Toutes / Du plateau) ---
allPiecesToggle.addEventListener('change', () => {
  reserveMode = allPiecesToggle.checked ? 'all' : 'exact';
  savePreferences();
});

// --- Lancement d'une partie ---

// Calcule le nombre de pieces de chaque manche selon la difficulte choisie
function computePieceCounts() {
  if (selectedDifficulty === 'easy') return Array(totalRounds).fill(2);
  if (selectedDifficulty === 'medium') return Array(totalRounds).fill(6);
  if (selectedDifficulty === 'hard') return Array(totalRounds).fill(9);

  if (samePiecesCheckbox.checked) {
    return Array(totalRounds).fill(clampPieceCount(customPiecesInput.value));
  }

  const inputs = Array.from(perRoundPiecesPanel.querySelectorAll('.per-round-input'));
  const counts = inputs.map(input => clampPieceCount(input.value));
  while (counts.length < totalRounds) counts.push(4);
  return counts.slice(0, totalRounds);
}

// Cree un objet joueur vierge
function makePlayer(name) {
  return { name: name, roundResults: [], totalScore: 0, totalPossible: 0 };
}

playBtn.addEventListener('click', () => {
  totalRounds = parseInt(roundsSelect.value, 10);
  pieceCounts = computePieceCounts();

  if (gameMode === 'solo') {
    players = [makePlayer(playerNameInput.value.trim())];
  } else {
    const inputs = Array.from(playerNamesPanel.querySelectorAll('.player-name-input'));
    players = inputs.map((input, i) => makePlayer(input.value.trim() || ('Joueur ' + (i + 1))));
  }

  savePreferences();
  startMatch();
});
