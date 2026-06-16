// ============================================================
// PARAMETRES : modale reglages + choix des pieces
//
// Gere la roue crantee (theme clair/sombre, affichage des
// coordonnees, style de pieces). Le choix des pieces se fait
// en deux temps : un apercu compact (les deux rois) dans les
// reglages, et une modale dediee avec l'echiquier pour choisir.
// ============================================================

// Set de pieces "en attente" pendant qu'on choisit dans la modale
// (on ne change "pieceSet" pour de vrai qu'au moment de valider)
let pendingPieceSet = DEFAULT_PIECE_SET;

// --- Apercu compact : roi noir + roi blanc du set actuel ---
function renderKingsPreview() {
  kingsPreview.innerHTML = '';
  [{ type: 'king', color: 'black' }, { type: 'king', color: 'white' }].forEach(piece => {
    const cell = document.createElement('div');
    cell.classList.add('king-cell');
    const img = document.createElement('img');
    img.classList.add('piece-img');
    img.src = getPieceImageSrcForSet(piece, pieceSet);
    img.alt = piece.color + ' king';
    img.draggable = false;
    cell.appendChild(img);
    kingsPreview.appendChild(cell);
  });
}

// --- Modale parametres ---
function openSettings() {
  themeToggle.checked = (theme === 'light');
  coordsToggle.checked = showCoordinates;
  renderKingsPreview();
  settingsModal.classList.remove('hidden');
}
function closeSettings() {
  settingsModal.classList.add('hidden');
}

// --- Modale choix des pieces ---

// Construit (une seule fois) la grille des sets disponibles
function buildPieceSetGrid() {
  pieceSetGrid.innerHTML = '';
  PIECE_SETS.forEach(set => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.classList.add('piece-set-option');
    btn.dataset.set = set.id;

    const thumb = document.createElement('div');
    thumb.classList.add('piece-set-thumb');
    [{ type: 'king', color: 'white' }, { type: 'king', color: 'black' }].forEach(piece => {
      const img = document.createElement('img');
      img.classList.add('piece-img');
      img.src = getPieceImageSrcForSet(piece, set.id);
      img.alt = '';
      img.draggable = false;
      thumb.appendChild(img);
    });

    const label = document.createElement('span');
    label.classList.add('piece-set-name');
    label.textContent = set.label;

    btn.appendChild(thumb);
    btn.appendChild(label);
    btn.addEventListener('click', () => selectPieceSet(set.id));
    pieceSetGrid.appendChild(btn);
  });
}

// Met a jour l'apercu (echiquier + nom) avec le set en attente
function renderPiecePickerPreview() {
  const setInfo = PIECE_SETS.find(s => s.id === pendingPieceSet);
  pieceModalSetName.textContent = setInfo ? setInfo.label : pendingPieceSet;

  pieceSetOverride = pendingPieceSet;
  renderBoardInto(pieceSetPreviewBoard, positionToMap(getInitialPosition()), false);
  pieceSetOverride = null;

  pieceSetGrid.querySelectorAll('.piece-set-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.set === pendingPieceSet);
  });
}

function selectPieceSet(setId) {
  pendingPieceSet = setId;
  renderPiecePickerPreview();
}

function openPiecePicker() {
  pendingPieceSet = pieceSet;
  if (!pieceSetGrid.children.length) {
    buildPieceSetGrid();
  }
  renderPiecePickerPreview();
  pieceModal.classList.remove('hidden');
  // amene l'option selectionnee dans la vue
  const selected = pieceSetGrid.querySelector('.piece-set-option.selected');
  if (selected) selected.scrollIntoView({ block: 'nearest' });
}
function closePiecePicker() {
  pieceModal.classList.add('hidden');
}
function validatePiecePicker() {
  pieceSet = pendingPieceSet;
  savePreferences();
  renderKingsPreview();
  closePiecePicker();
}

// --- Branchements ---
settingsBtn.addEventListener('click', openSettings);
settingsCloseBtn.addEventListener('click', closeSettings);
settingsDoneBtn.addEventListener('click', closeSettings);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettings();
});

themeToggle.addEventListener('change', () => {
  theme = themeToggle.checked ? 'light' : 'dark';
  applyTheme();
  savePreferences();
});

coordsToggle.addEventListener('change', () => {
  showCoordinates = coordsToggle.checked;
  applyCoordinates();
  savePreferences();
});

openPiecePickerBtn.addEventListener('click', openPiecePicker);
pieceCloseBtn.addEventListener('click', closePiecePicker);
pieceCancelBtn.addEventListener('click', closePiecePicker);
pieceValidateBtn.addEventListener('click', validatePiecePicker);
pieceModal.addEventListener('click', (e) => {
  if (e.target === pieceModal) closePiecePicker();
});
