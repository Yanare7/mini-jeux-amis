// ============================================================
// MULTIJOUEUR EN LIGNE - Firebase Realtime Database
//
// Architecture : salons persistants, plusieurs parties dans
// le meme salon, historique, expiration apres 1h d'inactivite.
// Charge apres storage.js et avant menu.js.
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

const SALON_INACTIVITY_MS = 60 * 60 * 1000; // 1 heure

// --- Etat Firebase ---
let firebaseDb          = null;
let salonRef            = null;
let myPlayerId          = null;
let currentSalonCode    = null;
let isHost              = false;
let onlineUnsubscribers = [];
let salonSelectedDiff   = 'easy';
let lastOnlineGameConfig = null;
let isInGame            = false;

// Refs DOM pour le panneau personnalise du salon
var salonCustomDifficultyPanel = document.getElementById('salonCustomDifficultyPanel');
var salonSamePiecesCheckbox    = document.getElementById('salonSamePiecesCheckbox');
var salonSamePiecesPanel_      = document.getElementById('salonSamePiecesPanel');
var salonPerRoundPiecesPanel_  = document.getElementById('salonPerRoundPiecesPanel');
var salonCustomPiecesInput     = document.getElementById('salonCustomPiecesInput');

// Nom de joueur : priorite a pendingPlayerName (sessionStorage) puis a la saisie
function getAutoPlayerName() {
  var pending = sessionStorage.getItem('pendingPlayerName');
  if (pending) {
    sessionStorage.removeItem('pendingPlayerName');
    sessionStorage.setItem('autoPlayerName', pending);
    return pending;
  }
  var stored = sessionStorage.getItem('autoPlayerName');
  if (stored) return stored;
  var name = 'Joueur-' + Math.random().toString(36).slice(2, 5).toUpperCase();
  sessionStorage.setItem('autoPlayerName', name);
  return name;
}

// ============================================================
// INIT FIREBASE
// ============================================================

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

// ============================================================
// GENERATEURS
// ============================================================

function generateSalonCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generatePlayerId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================================
// ACTIVITE
// ============================================================

function touchActivity() {
  if (!salonRef) return Promise.resolve();
  return salonRef.child('lastActivityAt')
    .set(firebase.database.ServerValue.TIMESTAMP)
    .catch(function() {});
}

// ============================================================
// CREATION D'UN SALON
// ============================================================

function createSalon(name, callback) {
  initFirebase();
  var code = generateSalonCode();
  myPlayerId       = generatePlayerId();
  isHost           = true;
  currentSalonCode = code;
  salonRef         = firebaseDb.ref('salons/' + code);

  var players = {};
  players[myPlayerId] = { name: name || 'Joueur', online: true };

  var data = {
    status         : 'waiting',
    host           : myPlayerId,
    createdAt      : firebase.database.ServerValue.TIMESTAMP,
    lastActivityAt : firebase.database.ServerValue.TIMESTAMP,
    players        : players
  };

  salonRef.set(data)
    .then(function() { setupDisconnect(); callback(null, code); })
    .catch(function(err) {
      salonRef = null; myPlayerId = null; currentSalonCode = null; isHost = false;
      callback(err);
    });
}

// ============================================================
// REJOINDRE UN SALON
// ============================================================

function joinSalon(code, name, callback) {
  initFirebase();
  code             = code.trim().toUpperCase();
  myPlayerId       = generatePlayerId();
  isHost           = false;
  currentSalonCode = code;
  salonRef         = firebaseDb.ref('salons/' + code);

  salonRef.once('value')
    .then(function(snap) {
      var data = snap.val();
      if (!data) throw new Error('Salon introuvable. Verifie le code.');

      var lastActivity = data.lastActivityAt || data.createdAt;
      if (lastActivity && (Date.now() - lastActivity > SALON_INACTIVITY_MS)) {
        salonRef.remove().catch(function() {});
        throw new Error("Ce salon a expire (inactif depuis plus d'1h).");
      }
      if (data.status === 'playing') {
        throw new Error('Une partie est en cours. Attends la fin pour rejoindre.');
      }
      var count = Object.keys(data.players || {}).length;
      if (count >= 8) throw new Error('Salon complet (8 joueurs max).');

      return salonRef.child('players/' + myPlayerId)
        .set({ name: name || 'Joueur', online: true });
    })
    .then(function() { return touchActivity(); })
    .then(function() { setupDisconnect(); callback(null, code); })
    .catch(function(err) {
      salonRef = null; myPlayerId = null; currentSalonCode = null; isHost = false;
      callback(err);
    });
}

function setupDisconnect() {
  if (!salonRef || !myPlayerId) return;
  salonRef.child('players/' + myPlayerId + '/online').onDisconnect().set(false);
}

// ============================================================
// LISTENERS DU SALON
// ============================================================

function listenToSalon() {
  stopListening();
  isInGame = false;
  if (!salonRef) return;

  var listener = salonRef.on('value', function(snap) {
    var data = snap.val();
    if (!data) { handleSalonGone(); return; }
    // Detecter si le joueur local a ete expulse
    if (myPlayerId && data.players && !data.players[myPlayerId]) {
      handleKicked();
      return;
    }
    if (data.status === 'playing' && data.currentGame && !isInGame) {
      stopListening();
      applyOnlineConfig(data);
      return;
    }
    updateSalonUI(data);
  });
  onlineUnsubscribers.push(function() { salonRef.off('value', listener); });
}

function listenForNextGame() {
  stopListening();
  if (!salonRef) return;

  var listener = salonRef.on('value', function(snap) {
    var data = snap.val();
    if (!data) { handleSalonGone(); return; }
    // Detecter si le joueur local a ete expulse
    if (myPlayerId && data.players && !data.players[myPlayerId]) {
      handleKicked();
      return;
    }
    if (data.status === 'playing' && data.currentGame && !isInGame) {
      stopListening();
      applyOnlineConfig(data);
    }
  });
  onlineUnsubscribers.push(function() { salonRef.off('value', listener); });
}

// ============================================================
// LANCEMENT D'UNE PARTIE (hote uniquement)
// ============================================================

function startOnlineGame(isReplay) {
  if (!isHost || !salonRef) return;

  salonRef.once('value').then(function(snap) {
    var data = snap.val();
    if (!data || !data.players) return;

    var config;
    if (isReplay && lastOnlineGameConfig) {
      var c = lastOnlineGameConfig;
      var newPositions = c.pieceCounts.map(function(n) { return generatePosition(n); });
      config = {
        rounds    : c.rounds,
        duration  : c.duration,
        difficulty: c.difficulty,
        pieceCounts: c.pieceCounts,
        positions : newPositions.map(function(pos) {
          return pos.map(function(p) { return { row: p.row, col: p.col, type: p.type, color: p.color }; });
        })
      };
    } else {
      var rounds   = parseInt(salonRoundsSelect.value, 10);
      var duration = parseInt(salonDurationSelect.value, 10);
      var pc       = computeOnlinePieceCounts(rounds, salonSelectedDiff);
      var pos      = pc.map(function(n) { return generatePosition(n); });
      config = {
        rounds: rounds, duration: duration,
        difficulty  : salonSelectedDiff,
        pieceCounts : pc,
        positions   : pos.map(function(arr) {
          return arr.map(function(p) { return { row: p.row, col: p.col, type: p.type, color: p.color }; });
        })
      };
    }

    var initialResults = {};
    Object.keys(data.players).forEach(function(id) {
      initialResults[id] = { finished: false, totalScore: 0, totalPossible: 0, roundResults: null };
    });

    return salonRef.update({
      status         : 'playing',
      lastActivityAt : firebase.database.ServerValue.TIMESTAMP,
      currentGame    : { config: config, results: initialResults }
    });
  }).catch(function(err) {
    console.error('Erreur lancement partie :', err);
    if (salonStartBtn) salonStartBtn.disabled = false;
  });
}

function updateSalonDifficultyPanels() {
  if (!salonCustomDifficultyPanel) return;
  if (salonSelectedDiff === 'custom') {
    salonCustomDifficultyPanel.classList.remove('hidden');
    if (salonSamePiecesCheckbox.checked) {
      salonSamePiecesPanel_.classList.remove('hidden');
      salonPerRoundPiecesPanel_.classList.add('hidden');
    } else {
      salonSamePiecesPanel_.classList.add('hidden');
      salonPerRoundPiecesPanel_.classList.remove('hidden');
      renderSalonPerRoundInputs();
    }
  } else {
    salonCustomDifficultyPanel.classList.add('hidden');
  }
}

function renderSalonPerRoundInputs() {
  if (!salonPerRoundPiecesPanel_) return;
  salonPerRoundPiecesPanel_.innerHTML = '';
  var n = parseInt(salonRoundsSelect.value, 10);
  for (var i = 1; i <= n; i++) {
    var row = document.createElement('div');
    row.classList.add('per-round-row');
    var label = document.createElement('label');
    label.textContent = 'Manche ' + i;
    var input = document.createElement('input');
    input.type = 'number';
    input.min  = '1';
    input.max  = '16';
    input.value = '4';
    input.classList.add('per-round-input');
    row.appendChild(label);
    row.appendChild(input);
    salonPerRoundPiecesPanel_.appendChild(row);
  }
}

function computeOnlinePieceCounts(rounds, diff) {
  if (diff === 'easy')   return Array(rounds).fill(2);
  if (diff === 'medium') return Array(rounds).fill(6);
  if (diff === 'hard')   return Array(rounds).fill(9);
  // custom
  if (salonSamePiecesCheckbox && salonSamePiecesCheckbox.checked) {
    var n = parseInt(salonCustomPiecesInput.value, 10);
    n = Math.min(16, Math.max(1, isNaN(n) ? 4 : n));
    return Array(rounds).fill(n);
  }
  var inputs = salonPerRoundPiecesPanel_
    ? Array.from(salonPerRoundPiecesPanel_.querySelectorAll('.per-round-input'))
    : [];
  var counts = inputs.map(function(inp) {
    var v = parseInt(inp.value, 10);
    return Math.min(16, Math.max(1, isNaN(v) ? 4 : v));
  });
  while (counts.length < rounds) counts.push(4);
  return counts.slice(0, rounds);
}

// ============================================================
// APPLICATION DE LA CONFIG ET DEMARRAGE DU TOUR
// ============================================================

function applyOnlineConfig(data) {
  isInGame = true;
  var cfg = data.currentGame.config;
  lastOnlineGameConfig = cfg;

  totalRounds   = cfg.rounds;
  pieceCounts   = cfg.pieceCounts;
  durationInput.value = cfg.duration;
  matchPositions = cfg.positions.map(function(pos) {
    return pos.map(function(p) { return { row: p.row, col: p.col, type: p.type, color: p.color }; });
  });

  players = Object.entries(data.players || {}).map(function(entry) {
    return { id: entry[0], name: entry[1].name, roundResults: [], totalScore: 0, totalPossible: 0 };
  });
  currentPlayerIndex = players.findIndex(function(p) { return p.id === myPlayerId; });
  if (currentPlayerIndex < 0) currentPlayerIndex = 0;

  listenForGameFinish();
  startPlayerTurn();
}

// ============================================================
// ECOUTE FIN DE PARTIE
// ============================================================

function listenForGameFinish() {
  if (!salonRef) return;
  var ref = salonRef.child('currentGame/results');
  var listener = ref.on('value', function(snap) {
    var results  = snap.val() || {};
    var total    = players.length;
    var finished = Object.values(results).filter(function(r) { return r && r.finished; }).length;

    if (onlineFinishedCount) {
      onlineFinishedCount.textContent = finished + ' / ' + total + ' joueurs ont termine';
    }
    if (finished >= total && total > 0) {
      ref.off('value', listener);
      salonRef.once('value').then(function(s) { if (s.val()) buildOnlineResults(s.val()); });
    }
  });
  onlineUnsubscribers.push(function() { ref.off('value', listener); });
}

// ============================================================
// SOUMISSION DES RESULTATS DU JOUEUR LOCAL
// ============================================================

function submitOnlineResults() {
  if (!salonRef || !myPlayerId) return Promise.resolve();
  var player    = players[currentPlayerIndex];
  var roundData = player.roundResults.map(function(r) {
    return { round: r.round, score: r.score, total: r.total };
  });
  return salonRef.child('currentGame/results/' + myPlayerId).update({
    finished     : true,
    totalScore   : player.totalScore,
    totalPossible: player.totalPossible,
    roundResults : roundData.length ? roundData : null
  }).then(function() { return touchActivity(); });
}

// ============================================================
// CONSTRUCTION DES RESULTATS FINAUX + HISTORIQUE
// ============================================================

function buildOnlineResults(data) {
  if (!data || !data.players) return;
  var localPlayer = players[currentPlayerIndex];
  var gameResults = (data.currentGame && data.currentGame.results) || {};

  players = Object.entries(data.players).map(function(entry) {
    var id = entry[0]; var p = entry[1];
    var gr = gameResults[id] || {};
    if (id === myPlayerId && localPlayer) {
      return {
        id: id, name: localPlayer.name,
        roundResults : localPlayer.roundResults,
        totalScore   : localPlayer.totalScore,
        totalPossible: localPlayer.totalPossible
      };
    }
    return {
      id: id, name: p.name,
      roundResults: (gr.roundResults || []).map(function(r, i) {
        return { round: r.round || (i + 1), score: r.score || 0, total: r.total || 0,
                 originalPosition: null, placements: null };
      }),
      totalScore   : gr.totalScore    || 0,
      totalPossible: gr.totalPossible || 0
    };
  });

  if (isHost) {
    saveGameToHistory(data, gameResults);
    salonRef.update({ status: 'results' }).catch(function() {});
  }

  isInGame = false;
  showResultsScreen();
  showOnlineResultsActions();
  listenForNextGame();
}

// ============================================================
// HISTORIQUE
// ============================================================

function saveGameToHistory(data, gameResults) {
  var scores = {};
  // fullResults stocke les scores par nom (pas d'ID) pour la revision
  var fullResults = [];
  Object.entries(data.players || {}).forEach(function(entry) {
    var id = entry[0]; var p = entry[1];
    var r = gameResults[id] || {};
    scores[id] = { name: p.name, totalScore: r.totalScore || 0, totalPossible: r.totalPossible || 0 };
    fullResults.push({
      name         : p.name,
      totalScore   : r.totalScore    || 0,
      totalPossible: r.totalPossible || 0,
      roundResults : (r.roundResults || []).map(function(rr, i) {
        return { round: rr.round || (i + 1), score: rr.score || 0, total: rr.total || 0,
                 originalPosition: null, placements: null };
      })
    });
  });
  salonRef.child('history').push({
    playedAt   : firebase.database.ServerValue.TIMESTAMP,
    rounds     : data.currentGame.config.rounds,
    difficulty : data.currentGame.config.difficulty || 'custom',
    scores     : scores,
    fullResults: fullResults
  }).catch(function() {});
}

function loadSalonHistory() {
  if (!salonRef) return;
  salonHistoryList.innerHTML = '<p class="mode-subtitle">Chargement...</p>';
  salonRef.child('history').orderByChild('playedAt').limitToLast(20).once('value')
    .then(function(snap) {
      var data = snap.val();
      salonHistoryList.innerHTML = '';
      if (!data) {
        salonHistoryList.innerHTML = "<p class=\"mode-subtitle\">Aucune partie jouee pour l'instant.</p>";
        return;
      }
      var entries = Object.entries(data).sort(function(a, b) {
        return (b[1].playedAt || 0) - (a[1].playedAt || 0);
      });
      entries.forEach(function(entry) { salonHistoryList.appendChild(buildHistoryCard(entry[1])); });
    })
    .catch(function() {
      salonHistoryList.innerHTML = "<p class=\"online-error\">Impossible de charger l'historique.</p>";
    });
}

function escapeHtml(s) {
  var d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

function buildHistoryCard(game) {
  var card = document.createElement('div');
  card.classList.add('history-card');

  var time = game.playedAt
    ? new Date(game.playedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';
  var diffLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile', custom: 'Perso' };
  var diff = diffLabel[game.difficulty] || 'Perso';

  var header = document.createElement('div');
  header.classList.add('history-card-header');
  header.innerHTML =
    '<span class="history-diff">' + diff + ' &bull; ' + (game.rounds || '?') + ' manches</span>' +
    '<span class="history-time">' + time + '</span>';
  card.appendChild(header);

  if (game.scores) {
    var sorted = Object.values(game.scores).sort(function(a, b) { return b.totalScore - a.totalScore; });
    var best   = sorted.length ? sorted[0].totalScore : 0;
    sorted.forEach(function(s, i) {
      var row = document.createElement('div');
      row.classList.add('history-score-row');
      if (i === 0 && s.totalScore === best) row.classList.add('history-winner');
      row.innerHTML = (i === 0 ? '&#127942; ' : (i + 1) + '. ') +
        escapeHtml(s.name) + ' &mdash; ' + s.totalScore + ' / ' + s.totalPossible;
      card.appendChild(row);
    });

    // Bouton "Revoir" : affiche les resultats de cette partie historique
    if (game.fullResults) {
      var reviewBtn = document.createElement('button');
      reviewBtn.type = 'button';
      reviewBtn.classList.add('small-btn', 'history-review-btn');
      reviewBtn.textContent = 'Revoir';
      reviewBtn.addEventListener('click', function() {
        showHistoryResults(game.fullResults);
      });
      card.appendChild(reviewBtn);
    }
  }
  return card;
}

// Affiche un ecran de resultats a partir d'une entree d'historique
function showHistoryResults(fullResults) {
  // fullResults : { players: [{name, totalScore, totalPossible, roundResults}] }
  players = fullResults;
  gameMode = 'online';
  showResultsScreen();
  // Bouton retour au salon depuis la revision historique
  if (onlineResultsActions) onlineResultsActions.classList.remove('hidden');
  if (homeBtn) homeBtn.classList.add('hidden');
  if (onlineReplayBtn) onlineReplayBtn.classList.add('hidden');
}

// ============================================================
// MISE A JOUR DE L'INTERFACE DU SALON
// ============================================================

function updateSalonUI(data) {
  var playersData = data.players || {};
  var entries     = Object.entries(playersData);

  if (salonCodeDisplay) salonCodeDisplay.textContent = currentSalonCode || '------';

  if (salonPlayersList) {
    salonPlayersList.innerHTML = '';
    entries.forEach(function(entry) {
      var id = entry[0]; var p = entry[1];
      var li = document.createElement('li');
      li.classList.add('online-player-item');
      if (p.online === false) li.classList.add('player-offline');

      var nameEl = document.createElement('span');
      nameEl.textContent = p.name + (id === myPlayerId ? ' (moi)' : '');
      li.appendChild(nameEl);

      var right = document.createElement('span');
      right.classList.add('player-badges');

      if (id === data.host) {
        var hb = document.createElement('span');
        hb.classList.add('host-badge');
        hb.textContent = 'hote';
        right.appendChild(hb);
      }
      if (p.online === false) {
        var ob = document.createElement('span');
        ob.classList.add('offline-badge');
        ob.textContent = 'absent';
        right.appendChild(ob);
      }
      // Bouton expulser (hote uniquement, pas sur soi-meme)
      if (isHost && id !== myPlayerId && id !== data.host) {
        var kickBtn = document.createElement('button');
        kickBtn.type = 'button';
        kickBtn.classList.add('kick-btn');
        kickBtn.title = 'Expulser ' + p.name;
        kickBtn.innerHTML = '&#10005;';
        kickBtn.addEventListener('click', (function(playerId, playerName) {
          return function() { kickPlayer(playerId, playerName); };
        })(id, p.name));
        right.appendChild(kickBtn);
      }
      li.appendChild(right);
      salonPlayersList.appendChild(li);
    });
  }

  var count = entries.length;
  if (isHost) {
    if (salonConfigPanel) salonConfigPanel.classList.remove('hidden');
    if (salonStartBtn) {
      salonStartBtn.classList.remove('hidden');
      salonStartBtn.disabled = count < 2;
      salonStartBtn.textContent = count < 2
        ? "En attente d'un autre joueur..."
        : 'Demarrer la partie (' + count + ' joueurs)';
    }
    if (salonWaitMsg) salonWaitMsg.classList.add('hidden');
  } else {
    if (salonConfigPanel) salonConfigPanel.classList.add('hidden');
    if (salonStartBtn) salonStartBtn.classList.add('hidden');
    if (salonWaitMsg) salonWaitMsg.classList.remove('hidden');
  }
}

function selectSalonTab(tabId) {
  salonTabs.querySelectorAll('.salon-tab').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  if (salonLobbyPane)   salonLobbyPane.classList.toggle('hidden',   tabId !== 'lobby');
  if (salonHistoryPane) salonHistoryPane.classList.toggle('hidden', tabId !== 'history');
  if (tabId === 'history') loadSalonHistory();
}

// ============================================================
// BOUTONS D'ACTION APRES PARTIE ONLINE
// ============================================================

function showOnlineResultsActions() {
  if (onlineResultsActions) onlineResultsActions.classList.remove('hidden');
  if (homeBtn) homeBtn.classList.add('hidden');
  if (onlineReplayBtn) onlineReplayBtn.classList.toggle('hidden', !isHost);
}

function hideOnlineResultsActions() {
  if (onlineResultsActions) onlineResultsActions.classList.add('hidden');
  if (homeBtn) homeBtn.classList.remove('hidden');
}

// ============================================================
// EXPULSION D'UN JOUEUR (hote uniquement)
// ============================================================

function kickPlayer(playerId, playerName) {
  if (!isHost || !salonRef) return;
  showConfirmModal(
    'Expulser ' + playerName + ' du salon ?',
    function() {
      salonRef.child('players/' + playerId).remove().catch(function() {});
      touchActivity();
    },
    { title: 'Expulser un joueur', okText: 'Expulser', cancelText: 'Annuler' }
  );
}

// ============================================================
// GESTION DU KICK RECU (joueur expulse)
// ============================================================

function handleKicked() {
  stopListening();
  isInGame = false;
  hideOnlineResultsActions();
  salonRef = null; myPlayerId = null; currentSalonCode = null; isHost = false;
  showScreen('modeScreen');
  if (onlineLobbyError) {
    onlineLobbyError.textContent = 'Tu as ete expulse du salon.';
    onlineLobbyError.classList.remove('hidden');
    setTimeout(function() { onlineLobbyError.classList.add('hidden'); }, 4000);
  }
}

// ============================================================
// QUITTER UNE PARTIE EN COURS (joueur)
// ============================================================

function quitCurrentGame() {
  showConfirmModal(
    'Quitter la partie en cours ? Ton score sera perdu.',
    function() {
      if (typeof timerAnimationId !== 'undefined' && timerAnimationId !== null) {
        cancelAnimationFrame(timerAnimationId);
        timerAnimationId = null;
      }
      stopListening();
      isInGame = false;
      if (salonRef && myPlayerId) {
        salonRef.child('currentGame/results/' + myPlayerId).update({
          finished: true, abandoned: true, totalScore: 0, totalPossible: 0
        }).catch(function() {});
      }
      showScreen('onlineSalonScreen');
      listenToSalon();
    },
    { title: 'Quitter la partie', okText: 'Quitter', cancelText: 'Continuer' }
  );
}

// ============================================================
// QUITTER UN SALON
// ============================================================

function leaveSalon() {
  stopListening();
  isInGame = false;
  hideOnlineResultsActions();

  if (!salonRef || !myPlayerId) {
    salonRef = null; myPlayerId = null; currentSalonCode = null; isHost = false;
    return;
  }

  var ref     = salonRef;
  var pid     = myPlayerId;
  var wasHost = isHost;
  salonRef = null; myPlayerId = null; currentSalonCode = null; isHost = false;

  ref.child('players/' + pid).remove()
    .then(function() { return ref.once('value'); })
    .then(function(snap) {
      var d = snap.val();
      if (!d) return;
      var remaining = Object.keys(d.players || {}).length;
      if (remaining === 0) {
        return ref.remove();
      } else if (wasHost) {
        var newHostId = Object.keys(d.players)[0];
        return ref.child('host').set(newHostId);
      }
    })
    .catch(function() {});
}

function handleSalonGone() {
  stopListening();
  isInGame = false;
  hideOnlineResultsActions();
  salonRef = null; myPlayerId = null; currentSalonCode = null; isHost = false;
  showScreen('modeScreen');
  if (onlineLobbyError) {
    onlineLobbyError.textContent = 'Le salon a ete ferme.';
    onlineLobbyError.classList.remove('hidden');
    setTimeout(function() { onlineLobbyError.classList.add('hidden'); }, 4000);
  }
}

function stopListening() {
  onlineUnsubscribers.forEach(function(fn) { try { fn(); } catch (e) {} });
  onlineUnsubscribers = [];
}

// ============================================================
// BRANCHEMENTS DES EVENEMENTS
// ============================================================

createSalonBtn.addEventListener('click', function() {
  var name = (onlinePlayerNameInput && onlinePlayerNameInput.value.trim()) || getAutoPlayerName();
  onlineLobbyError.classList.add('hidden');
  createSalonBtn.disabled = true;
  createSalon(name, function(err, code) {
    createSalonBtn.disabled = false;
    if (err) {
      onlineLobbyError.textContent = err.message;
      onlineLobbyError.classList.remove('hidden');
      return;
    }
    showScreen('onlineSalonScreen');
    listenToSalon();
  });
});

joinSalonBtn.addEventListener('click', function() {
  var name = (onlinePlayerNameInput && onlinePlayerNameInput.value.trim()) || getAutoPlayerName();
  var code = salonCodeInput.value.trim();
  if (!code) {
    onlineLobbyError.textContent = 'Entre un code de salon.';
    onlineLobbyError.classList.remove('hidden');
    return;
  }
  onlineLobbyError.classList.add('hidden');
  joinSalonBtn.disabled = true;
  joinSalon(code, name, function(err) {
    joinSalonBtn.disabled = false;
    if (err) {
      onlineLobbyError.textContent = err.message;
      onlineLobbyError.classList.remove('hidden');
      return;
    }
    showScreen('onlineSalonScreen');
    listenToSalon();
  });
});

onlineBackBtn.addEventListener('click', function() {
  leaveSalon();
  showScreen('modeScreen');
});

salonLeaveBtn.addEventListener('click', function() {
  var msg = isHost
    ? "Quitter le salon ? L'hote sera transfere a un autre joueur."
    : 'Quitter le salon ?';
  if (!confirm(msg)) return;
  leaveSalon();
  showScreen('modeScreen');
});

if (typeof quitGameBtn !== 'undefined' && quitGameBtn) {
  quitGameBtn.addEventListener('click', quitCurrentGame);
}

salonCopyCodeBtn.addEventListener('click', function() {
  if (!currentSalonCode) return;
  navigator.clipboard.writeText(currentSalonCode).then(function() {
    salonCopyCodeBtn.textContent = '\u2713';
    setTimeout(function() { salonCopyCodeBtn.innerHTML = '&#10697;'; }, 2000);
  }).catch(function() {});
});

salonStartBtn.addEventListener('click', function() {
  salonStartBtn.disabled = true;
  startOnlineGame(false);
});

salonTabs.querySelectorAll('.salon-tab').forEach(function(btn) {
  btn.addEventListener('click', function() { selectSalonTab(btn.dataset.tab); });
});

salonDifficultyGrid.querySelectorAll('.difficulty-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    salonSelectedDiff = btn.dataset.difficulty;
    salonDifficultyGrid.querySelectorAll('.difficulty-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.difficulty === salonSelectedDiff);
    });
    updateSalonDifficultyPanels();
  });
});

if (salonSamePiecesCheckbox) {
  salonSamePiecesCheckbox.addEventListener('change', updateSalonDifficultyPanels);
}

salonRoundsSelect.addEventListener('change', function() {
  if (salonSelectedDiff === 'custom' && salonSamePiecesCheckbox && !salonSamePiecesCheckbox.checked) {
    renderSalonPerRoundInputs();
  }
});

onlineReplayBtn.addEventListener('click', function() {
  startOnlineGame(true);
});

onlineBackToSalonBtn.addEventListener('click', function() {
  hideOnlineResultsActions();
  showScreen('onlineSalonScreen');
  listenToSalon();
});

onlineLeaveSalonBtn.addEventListener('click', function() {
  leaveSalon();
  showScreen('modeScreen');
});
