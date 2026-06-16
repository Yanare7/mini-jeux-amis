// ============================================================
// LOGIQUE DU JEU
//
// Fonctions "pures" : elles prennent des donnees en entree et
// renvoient un resultat, sans toucher au DOM (pas de
// document.getElementById, pas de creation d'elements HTML).
// Ca les rend faciles a relire et a tester independamment
// de l'affichage.
// ============================================================

// Genere une position aleatoire de nbPieces pieces sur l'echiquier.
// Renvoie un tableau [{row, col, type, color}, ...]
function generatePosition(nbPieces) {
  const positions = [];
  const occupied = new Set();
  while (positions.length < nbPieces) {
    const row = Math.floor(Math.random() * 8);
    const col = Math.floor(Math.random() * 8);
    const key = row + ',' + col;
    if (!occupied.has(key)) {
      occupied.add(key);
      const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      positions.push({ row, col, type, color });
    }
  }
  return positions;
}

// Transforme un tableau de positions [{row, col, type, color}, ...]
// en dictionnaire { "row,col": {type, color} }, plus pratique pour l'affichage
function positionToMap(positionArray) {
  const map = {};
  positionArray.forEach(p => {
    map[p.row + ',' + p.col] = { type: p.type, color: p.color };
  });
  return map;
}

// Compare deux pieces (type + couleur)
function piecesMatch(a, b) {
  if (!a || !b) return false;
  return a.type === b.type && a.color === b.color;
}

// Renvoie une copie melangee du tableau donne (algorithme de Fisher-Yates)
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Ramene une valeur saisie entre 1 et 16 (nombre de pieces par manche)
function clampPieceCount(value) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return 4;
  return Math.min(16, Math.max(1, n));
}

// Renvoie la position de depart standard des echecs (32 pieces).
// Utilisee pour l'apercu du style de pieces dans le menu.
function getInitialPosition() {
  const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const positions = [];
  for (let col = 0; col < 8; col++) {
    positions.push({ row: 0, col: col, type: backRank[col], color: 'black' });
    positions.push({ row: 1, col: col, type: 'pawn', color: 'black' });
    positions.push({ row: 6, col: col, type: 'pawn', color: 'white' });
    positions.push({ row: 7, col: col, type: backRank[col], color: 'white' });
  }
  return positions;
}
