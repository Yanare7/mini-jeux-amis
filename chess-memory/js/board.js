// ============================================================
// AFFICHAGE DE L'ECHIQUIER ET DE LA RESERVE
//
// Tout ce qui concerne le dessin du plateau et des pieces, ainsi
// que les interactions "clic" pour poser/retirer une piece.
// Le glisser-deposer est gere a part, dans dragdrop.js.
// ============================================================

// Cree l'element visuel d'une piece : une image PNG (cf. PIECES_PATH)
function createPieceElement(piece) {
  const img = document.createElement('img');
  img.classList.add('piece-img');
  img.src = getPieceImageSrc(piece);
  img.alt = piece.color + ' ' + piece.type;
  img.draggable = false;
  return img;
}

// Cree les etiquettes a-h (colonnes) et 8-1 (lignes) dans les conteneurs donnes
function renderLabelsInto(ranksContainer, filesContainer) {
  for (let row = 0; row < 8; row++) {
    const label = document.createElement('div');
    label.classList.add('rank-label');
    label.textContent = 8 - row;
    ranksContainer.appendChild(label);
  }
  for (let col = 0; col < 8; col++) {
    const label = document.createElement('div');
    label.classList.add('file-label');
    label.textContent = String.fromCharCode(97 + col);
    filesContainer.appendChild(label);
  }
}

// Dessine un echiquier 8x8 dans le conteneur donne.
// piecesMap : { "row,col": {type, color} }
// clickable : true pour l'echiquier de jeu (clic + glisser-deposer actifs)
function renderBoardInto(container, piecesMap, clickable) {
  container.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;

      const key = row + ',' + col;
      const piece = piecesMap[key];
      if (piece) {
        square.appendChild(createPieceElement(piece));
      }

      if (clickable) {
        square.classList.add('clickable');
        square.addEventListener('click', () => onSquareClick(row, col));
        if (piece) {
          attachPointerDrag(square, { type: 'board', row: row, col: col }, piece);
        }
      }

      container.appendChild(square);
    }
  }
}

// Echiquier principal (celui ou le joueur joue)
function renderBoard(piecesMap, clickable) {
  renderBoardInto(board, piecesMap, clickable);
}

// Dessine un echiquier "comparaison" (pieces + cases vertes/rouges)
// et renvoie le nombre de cases correctes.
function renderComparisonBoard(container, originalMap, placements) {
  renderBoardInto(container, placements, false);
  let correctCount = 0;
  const squares = container.querySelectorAll('.square');
  squares.forEach(square => {
    const row = parseInt(square.dataset.row, 10);
    const col = parseInt(square.dataset.col, 10);
    const key = row + ',' + col;
    const expected = originalMap[key];
    const placed = placements[key];
    if (expected && piecesMatch(expected, placed)) {
      square.classList.add('correct');
      correctCount++;
    } else if (expected || placed) {
      square.classList.add('incorrect');
    }
  });
  return correctCount;
}

// Dessine la reserve : les pieces que le joueur doit replacer
function renderReserve() {
  reserveEl.innerHTML = '';
  reservePieces.forEach((piece, index) => {
    const el = document.createElement('div');
    el.classList.add('reserve-piece');
    if (index === selectedIndex) {
      el.classList.add('selected');
    }
    el.appendChild(createPieceElement(piece));
    el.addEventListener('click', () => onReserveClick(index));
    attachPointerDrag(el, { type: 'reserve', index: index }, piece);
    reserveEl.appendChild(el);
  });
}

// Clic sur une piece de la reserve : la selectionne / la deselectionne
function onReserveClick(index) {
  if (dragJustHappened) { dragJustHappened = false; return; }
  if (!placementActive) return;
  selectedIndex = (selectedIndex === index) ? null : index;
  renderReserve();
}

// Clic sur une case de l'echiquier :
// - si une piece y est posee, elle retourne dans la reserve
// - sinon, si une piece de la reserve est selectionnee, on la pose ici
function onSquareClick(row, col) {
  if (dragJustHappened) { dragJustHappened = false; return; }
  if (!placementActive) return;
  const key = row + ',' + col;

  if (boardPlacements[key]) {
    reservePieces.push(boardPlacements[key]);
    delete boardPlacements[key];
    renderBoard(boardPlacements, true);
    renderReserve();
    return;
  }

  if (selectedIndex !== null) {
    const piece = reservePieces[selectedIndex];
    boardPlacements[key] = piece;
    reservePieces.splice(selectedIndex, 1);
    selectedIndex = null;
    renderBoard(boardPlacements, true);
    renderReserve();
  }
}
