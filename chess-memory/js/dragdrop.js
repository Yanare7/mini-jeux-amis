// ============================================================
// GLISSER-DEPOSER (drag and drop)
//
// Implemente avec les Pointer Events : fonctionne pareil avec
// la souris, le doigt (tactile) et un stylet.
// ============================================================

// Attache le demarrage d'un glissement a un element (case ou piece de la reserve).
// "source" decrit d'ou vient la piece : { type: 'reserve', index } ou { type: 'board', row, col }
function attachPointerDrag(sourceEl, source, piece) {
  sourceEl.addEventListener('pointerdown', (e) => {
    if (!placementActive) return;
    e.preventDefault();
    activeDrag = {
      source: source,
      piece: piece,
      sourceEl: sourceEl,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      ghost: null
    };
    window.addEventListener('pointermove', onDragPointerMove);
    window.addEventListener('pointerup', onDragPointerUp);
  });
}

// Cree la "piece fantome" qui suit le pointeur pendant le glissement
function createGhost(piece, x, y) {
  const ghost = document.createElement('div');
  ghost.classList.add('drag-ghost');
  ghost.appendChild(createPieceElement(piece));
  ghost.style.left = x + 'px';
  ghost.style.top = y + 'px';
  document.body.appendChild(ghost);
  return ghost;
}

// Met en surbrillance la case d'echiquier survolee par le pointeur
function updateDropTarget(x, y) {
  document.querySelectorAll('.square.drag-over').forEach(s => s.classList.remove('drag-over'));
  const el = document.elementFromPoint(x, y);
  const square = el ? el.closest('#board .square') : null;
  if (square) {
    square.classList.add('drag-over');
  }
}

function onDragPointerMove(e) {
  if (!activeDrag) return;
  const dx = e.clientX - activeDrag.startX;
  const dy = e.clientY - activeDrag.startY;

  // On ne demarre visuellement le glissement qu'apres un petit deplacement,
  // pour ne pas gener un simple "clic"
  if (!activeDrag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
    activeDrag.moved = true;
    activeDrag.sourceEl.classList.add('dragging');
    activeDrag.ghost = createGhost(activeDrag.piece, e.clientX, e.clientY);
  }

  if (activeDrag.moved) {
    activeDrag.ghost.style.left = e.clientX + 'px';
    activeDrag.ghost.style.top = e.clientY + 'px';
    updateDropTarget(e.clientX, e.clientY);
  }
}

function onDragPointerUp(e) {
  window.removeEventListener('pointermove', onDragPointerMove);
  window.removeEventListener('pointerup', onDragPointerUp);

  if (!activeDrag) return;
  const drag = activeDrag;
  activeDrag = null;

  drag.sourceEl.classList.remove('dragging');
  document.querySelectorAll('.square.drag-over').forEach(s => s.classList.remove('drag-over'));
  if (drag.ghost) drag.ghost.remove();

  // Pas de deplacement = c'etait un simple clic, on laisse le gestionnaire de clic faire son travail
  if (!drag.moved) return;

  dragJustHappened = true;

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const square = el ? el.closest('#board .square') : null;
  const droppedOnReserve = el ? el.closest('#reserve') : null;

  if (square) {
    const row = parseInt(square.dataset.row, 10);
    const col = parseInt(square.dataset.col, 10);
    movePieceToBoard(drag.source, row, col);
  } else if (droppedOnReserve) {
    movePieceToReserve(drag.source);
  }
  // Si on relache ailleurs (hors plateau et hors reserve), rien ne change.

  selectedIndex = null;
  renderBoard(boardPlacements, true);
  renderReserve();
}

// Deplace une piece (venant de la reserve ou d'une autre case) vers la case (row, col)
function movePieceToBoard(source, row, col) {
  const destKey = row + ',' + col;

  if (source.type === 'reserve') {
    const piece = reservePieces[source.index];
    if (!piece) return;
    // S'il y avait deja une piece sur la case, elle retourne dans la reserve
    if (boardPlacements[destKey]) {
      reservePieces.push(boardPlacements[destKey]);
    }
    reservePieces.splice(source.index, 1);
    boardPlacements[destKey] = piece;

  } else if (source.type === 'board') {
    const sourceKey = source.row + ',' + source.col;
    if (sourceKey === destKey) return; // depose sur sa propre case : rien a faire

    const movingPiece = boardPlacements[sourceKey];
    if (!movingPiece) return;

    const destPiece = boardPlacements[destKey];
    if (destPiece) {
      // Les deux cases echangent leurs pieces
      boardPlacements[sourceKey] = destPiece;
    } else {
      delete boardPlacements[sourceKey];
    }
    boardPlacements[destKey] = movingPiece;
  }
}

// Renvoie une piece (venant d'une case de l'echiquier) vers la reserve
function movePieceToReserve(source) {
  if (source.type !== 'board') return; // reserve -> reserve : rien a faire
  const sourceKey = source.row + ',' + source.col;
  const piece = boardPlacements[sourceKey];
  if (!piece) return;
  delete boardPlacements[sourceKey];
  reservePieces.push(piece);
}
