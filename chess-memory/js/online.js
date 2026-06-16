// ============================================================
// MULTIJOUEUR EN LIGNE (Firebase Realtime Database)
//
// Gere la creation et la rejointe d'un salon, la synchronisation
// des positions partagees et des resultats entre appareils.
// Charge apres storage.js, avant menu.js.
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_100npCPi2h5guczXge_6yLIwNfA9P3w",
  authDomain: "mini-jeux-amis.firebaseapp.com",
  databaseURL: "https://mini-jeux-amis-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mini-jeux-amis",
  storageBucket: "mini-jeux-amis.firebasestorage.app",
  messagingSenderId: "475104250140",
  appId: "1:475104250140:web:edf2eeaba31f3b547c12d9"
};

// --- Etat Firebase ---
let firebaseDb = null;
let salonRef = null;
let myPlayerId = null;
let currentSalonCode = null;
let isHost = false;
let onlineUnsubscribers = [];

// Difficulte selectionnee dans la salle d'attente (hote)
let onlineSelectedDifficulty = 'easy';

// --- Initialisation ---

function initFirebase() {
  if (firebaseDb) return;
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    firebaseDb = firebase.database();
  } catch (e) {
    console.error('Firebase init :', e);
  }
}

// --- Generateurs d'identifiants ---

function generateSalonCode() {
  // Lettres et chiffres sans ambiguite visuelle (sans O/0, I/1, etc.)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generatePlayerId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --- Creation d'un salon (hote) ---

function createSalon(name, callback) {
  initFirebase();
  const code = generateSalonCode();
  myPlayerId = generatePlayerId();
  isHost = true;
  currentSalonCode = code;

  const data = {
    status: 'waiting',
    host: myPlayerId,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  };
  data.players = {};
  data.players[myPlayerId] = buildPlayerEntry(name);

  salonRef = firebaseDb.ref('salons/' + code);
  salonRef.set(data)
    .then(() => callback(null, code))
    .catch(err => callback(err));
}

// --- Rejoindre un salon ---

function joinSalon(code, name, callback) {
  initFirebase();
  code = code.trim().toUpperCase();
  myPlayerId = generatePlayerId();
  isHost = false;
  currentSalonCode = code;

  salonRef = firebaseDb.ref('salons/' + code);
  salonRef.once('value')
    .then(snap => {
      const data = snap.val();
      if (!data) {
        throw new Error('Salon introuvable. Verifie le code.');
      }
      if (data.status !== 'waiting') {
        throw new Error('La partie a deja commence.');
      }
      const count = Object.keys(data.players || {}).length;
      if (count >= 8) {
        throw new Error('Salon complet (8 joueurs max).');
      }
      return salonRef.child('players/' + myPlayerId).set(buildPlayerEntry(name));
    })
    .then(() => callback(null, code))
    .catch(err => callback(err));
}

function buildPlayerEntry(name) {
  return {
    name: name || 'Joueur',
    finished: false,
    totalScore: 0,
    totalPossible: 0,
    roundResults: null
  };
}

// --- Ecoute de la salle d'attente ---

// Ecoute les changements du salon : met a jour l'UI et detecte
// le debut de partie (quand l'hote ecrit status = 'playing')
function listenToWaitingRoom() {
  stopListening();
  const listener = salonRef.on('value', snap => {
    const data = snap.val();
    if (!data) return;
    updateWaitingUI(data);
    if (data.status === 'playing' && data.config) {
      stopListening();
      applyOnlineConfig(data);
    }
  });
  onlineUnsubscribers.push(() => salonRef.off('value', listener));
}

// Applique la config recue depuis Firebase et lance le tour du joueur
function applyOnlineConfig(data) {
  const cfg = data.config;
  totalRounds = cfg.rounds;
  pieceCounts = cfg.pieceCounts;
  durationInput.value = cfg.duration;
  matchPositions = cfg.positions.map(pos =>
    pos.map(p => ({ row: p.row, col: p.col, type: p.type, color: p.color }))
  );

  // Reconstruit la liste des joueurs a partir du snapshot Firebase
  players = Object.entries(data.players || {}).map(([id, p]) => ({
    id: id,
    name: p.name,
    roundResults: [],
    totalScore: 0,
    totalPossible: 0
  }));

  // Trouve l'index du joueur local dans la liste
  const localIdx = players.findIndex(p => p.id === myPlayerId);
  currentPlayerIndex = localIdx >= 0 ? localIdx : 0;

  listenForFinish();
  startPlayerTurn();
}

// --- Ecoute la fin de tous les joueurs (pendant la partie) ---

function listenForFinish() {
  stopListening();
  const ref = salonRef.child('players');
  const listener = ref.on('value', snap => {
    const data = snap.val() || {};
    const total = Object.keys(data).length;
    const finished = Object.values(data).filter(p => p.finished).length;

    // Met a jour le compteur affiché sur l'ecran d'attente online
    if (onlineFinishedCount) {
      onlineFinishedCount.textContent = finished + ' / ' + total + ' joueurs ont termine';
    }

    if (finished >= total && total > 0) {
      stopListening();
      salonRef.once('value').then(snap => buildOnlineResults(snap.val()));
    }
  });
  onlineUnsubscribers.push(() => ref.off('value', listener));
}

// --- Demarrage de la partie (hote uniquement) ---

function startOnlineGame() {
  const rounds = parseInt(onlineRoundsSelect.value, 10);
  const duration = parseInt(onlineDurationSelect.value, 10);

  totalRounds = rounds;
  durationInput.value = duration;
  selectedDifficulty = onlineSelectedDifficulty;
  pieceCounts = computeOnlinePieceCounts(rounds);
  matchPositions = pieceCounts.map(n => generatePosition(n));

  const config = {
    rounds: totalRounds,
    duration: duration,
    pieceCounts: pieceCounts,
    positions: matchPositions.map(pos =>
      pos.map(p => ({ row: p.row, col: p.col, type: p.type, color: p.color }))
    )
  };

  salonRef.update({ status: 'playing', config: config })
    .catch(err => console.error('Erreur demarrage partie :', err));
}

function computeOnlinePieceCounts(rounds) {
  if (onlineSelectedDifficulty === 'easy')   return Array(rounds).fill(2);
  if (onlineSelectedDifficulty === 'medium') return Array(rounds).fill(6);
  if (onlineSelectedDifficulty === 'hard')   return Array(rounds).fill(9);
  return Array(rounds).fill(4); // custom : defaut 4 pieces
}

// --- Soumission des resultats du joueur local ---

// Appele quand le joueur local a fini toutes ses manches.
// Ecrit son score dans Firebase ; le listener detectera que tout
// le monde a fini et affichera les resultats.
function submitOnlineResults() {
  const player = players[currentPlayerIndex];
  const roundData = player.roundResults.map(r => ({
    round: r.round,
    score: r.score,
    total: r.total
    // On ne transmet pas originalPosition/placements : trop lourd pour Firebase
  }));

  return salonRef.child('players/' + myPlayerId).update({
    finished: true,
    totalScore: player.totalScore,
    totalPossible: player.totalPossible,
    roundResults: roundData.length ? roundData : null
  });
}

// --- Construction des resultats finaux ---

// Fusionne les donnees Firebase avec les donnees locales du joueur
// courant (qui seul possede originalPosition/placements pour la revision)
function buildOnlineResults(data) {
  if (!data || !data.players) return;

  const localPlayer = players[currentPlayerIndex];

  players = Object.entries(data.players).map(([id, p]) => {
    if (id === myPlayerId && localPlayer) {
      // Le joueur local : on garde les donnees completes (revision disponible)
      return {
        id: id,
        name: localPlayer.name,
        roundResults: localPlayer.roundResults,
        totalScore: localPlayer.totalScore,
        totalPossible: localPlayer.totalPossible
      };
    }
    // Les autres joueurs : scores seulement (revision non disponible)
    return {
      id: id,
      name: p.name,
      roundResults: (p.roundResults || []).map((r, i) => ({
        round: r.round || (i + 1),
        score: r.score || 0,
        total: r.total || 0,
        originalPosition: null,
        placements: null
      })),
      totalScore: p.totalScore || 0,
      totalPossible: p.totalPossible || 0
    };
  });

  showResultsScreen();
}

// --- UI salle d'attente ---

function updateWaitingUI(data) {
  const playersData = data.players || {};
  const entries = Object.entries(playersData);

  // Liste des joueurs connectes
  if (onlinePlayersList) {
    onlinePlayersList.innerHTML = '';
    entries.forEach(([id, p]) => {
      const li = document.createElement('li');
      li.classList.add('online-player-item');
      li.textContent = p.name + (id === myPlayerId ? ' (moi)' : '');
      if (id === data.host) {
        const badge = document.createElement('span');
        badge.classList.add('host-badge');
        badge.textContent = 'hote';
        li.appendChild(badge);
      }
      onlinePlayersList.appendChild(li);
    });
  }

  // Bouton demarrer (hote) et message d'attente (invites)
  if (isHost) {
    onlineStartBtn.classList.remove('hidden');
    onlineWaitMsg.classList.add('hidden');
    const count = entries.length;
    onlineStartBtn.disabled = count < 2;
    onlineStartBtn.textContent = count < 2
      ? 'En attente d\'un autre joueur...'
      : 'Demarrer la partie (' + count + ' joueurs)';
    // Panneau config visible seulement pour l'hote
    if (onlineConfigPanel) onlineConfigPanel.classList.remove('hidden');
  } else {
    onlineStartBtn.classList.add('hidden');
    onlineWaitMsg.classList.remove('hidden');
    if (onlineConfigPanel) onlineConfigPanel.classList.add('hidden');
  }

  // Affiche le code
  if (onlineSalonCodeEl) onlineSalonCodeEl.textContent = currentSalonCode || '------';
}

// --- Quitter un salon ---

function leaveSalon() {
  stopListening();
  if (salonRef && myPlayerId) {
    salonRef.child('players/' + myPlayerId).remove().catch(() => {});
  }
  salonRef = null;
  myPlayerId = null;
  currentSalonCode = null;
  isHost = false;
}

function stopListening() {
  onlineUnsubscribers.forEach(fn => fn());
  onlineUnsubscribers = [];
}

// ============================================================
// BRANCHEMENTS DES EVENEMENTS (ecrans online)
// ============================================================

// Bouton "Creer un salon"
createSalonBtn.addEventListener('click', () => {
  const name = onlinePlayerNameInput.value.trim() || 'Joueur';
  onlineLobbyError.classList.add('hidden');
  createSalonBtn.disabled = true;
  createSalon(name, (err, code) => {
    createSalonBtn.disabled = false;
    if (err) {
      onlineLobbyError.textContent = err.message;
      onlineLobbyError.classList.remove('hidden');
      return;
    }
    showScreen('onlineWaitScreen');
    listenToWaitingRoom();
  });
});

// Bouton "Rejoindre"
joinSalonBtn.addEventListener('click', () => {
  const name = onlinePlayerNameInput.value.trim() || 'Joueur';
  const code = salonCodeInput.value.trim();
  if (!code) {
    onlineLobbyError.textContent = 'Entre un code de salon.';
    onlineLobbyError.classList.remove('hidden');
    return;
  }
  onlineLobbyError.classList.add('hidden');
  joinSalonBtn.disabled = true;
  joinSalon(code, name, (err) => {
    joinSalonBtn.disabled = false;
    if (err) {
      onlineLobbyError.textContent = err.message;
      onlineLobbyError.classList.remove('hidden');
      return;
    }
    showScreen('onlineWaitScreen');
    listenToWaitingRoom();
  });
});

// Retour depuis l'ecran lobby
onlineBackBtn.addEventListener('click', () => {
  leaveSalon();
  showScreen('modeScreen');
});

// Quitter la salle d'attente
waitLeaveBtn.addEventListener('click', () => {
  leaveSalon();
  showScreen('modeScreen');
});

// Copier le code du salon dans le presse-papier
copySalonCodeBtn.addEventListener('click', () => {
  if (!currentSalonCode) return;
  navigator.clipboard.writeText(currentSalonCode).then(() => {
    copySalonCodeBtn.textContent = 'Copie !';
    setTimeout(() => { copySalonCodeBtn.textContent = 'Copier'; }, 2000);
  }).catch(() => {
    // Fallback pour navigateurs sans clipboard API
    onlineSalonCodeEl.select && onlineSalonCodeEl.select();
  });
});

// Bouton "Demarrer" (hote uniquement)
onlineStartBtn.addEventListener('click', () => {
  if (!isHost) return;
  onlineStartBtn.disabled = true;
  startOnlineGame();
});

// Grille de difficulte dans la salle d'attente (hote)
onlineDifficultyGrid.querySelectorAll('.difficulty-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    onlineSelectedDifficulty = btn.dataset.difficulty;
    onlineDifficultyGrid.querySelectorAll('.difficulty-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.difficulty === onlineSelectedDifficulty);
    });
  });
});
