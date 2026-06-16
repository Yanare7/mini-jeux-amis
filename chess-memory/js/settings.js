// ============================================================
// PARAMETRES : modale reglages + choix des pieces
//
// Gere la roue crantee (theme clair/sombre, affichage des
// coordonnees, style de pieces). Le choix des pieces se fait
// en deux temps : un apercu compact (les deux rois) dans les
// reglages, et une modale dediee avec l'echiquier pour choisir.
// ============================================================

// Set de pieces "en attente" pendant qu'on choisit dans la modale
// (on ne change "pieceSet" pour de vrai qu'au moment de valider dans les parametres)
let pendingPieceSet = DEFAULT_PIECE_SET;
// Set de pieces au moment de l'ouverture des parametres (pour detecter les changements)
let settingsPieceOnOpen = DEFAULT_PIECE_SET;

// --- Apercu compact : roi noir + roi blanc du set en attente ---
function renderKingsPreview() {
  kingsPreview.innerHTML = '';
  [{ type: 'king', color: 'black' }, { type: 'king', color: 'white' }].forEach(piece => {
    const cell = document.createElement('div');
    cell.classList.add('king-cell');
    const img = document.createElement('img');
    img.classList.add('piece-img');
    img.src = getPieceImageSrcForSet(piece, pendingPieceSet);
    img.alt = piece.color + ' king';
    img.draggable = false;
    cell.appendChild(img);
    kingsPreview.appendChild(cell);
  });
}

// --- Modale parametres ---
function openSettings() {
  settingsPieceOnOpen = pieceSet;
  pendingPieceSet = pieceSet;
  themeToggle.checked = (theme === 'light');
  coordsToggle.checked = showCoordinates;
  renderKingsPreview();
  settingsModal.classList.remove('hidden');
}
function closeSettings() {
  settingsModal.classList.add('hidden');
}
// Annule toutes les modifications en cours et ferme les parametres
function cancelSettings() {
  themeToggle.checked = (theme === 'light');
  coordsToggle.checked = showCoordinates;
  pendingPieceSet = pieceSet;
  renderKingsPreview();
  closeSettings();
}
// Sauvegarde toutes les modifications et ferme les parametres
function saveSettings() {
  theme = themeToggle.checked ? 'light' : 'dark';
  showCoordinates = coordsToggle.checked;
  pieceSet = pendingPieceSet;
  applyTheme();
  applyCoordinates();
  if (coordsHomeToggle) coordsHomeToggle.checked = showCoordinates;
  savePreferences();
  renderKingsPreview();
  closeSettings();
}
// Quitter les parametres : demande confirmation si des modifications non sauvegardees
function tryQuitSettings() {
  var pendingThemeVal = themeToggle.checked ? 'light' : 'dark';
  var hasChanges = pendingPieceSet !== pieceSet
    || pendingThemeVal !== theme
    || coordsToggle.checked !== showCoordinates;
  if (hasChanges) {
    showConfirmModal(
      'Quitter sans sauvegarder les modifications ?',
      cancelSettings,
      { title: 'Modifications non sauvegardees', okText: 'Quitter', cancelText: 'Rester' }
    );
  } else {
    cancelSettings();
  }
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
  // On met juste a jour pendingPieceSet et l'apercu dans les parametres.
  // La sauvegarde definitive se fait via le bouton "Sauvegarder" des parametres.
  renderKingsPreview();
  closePiecePicker();
}

// --- Branchements ---
settingsBtn.addEventListener('click', openSettings);
settingsCloseBtn.addEventListener('click', tryQuitSettings);
settingsSaveBtn.addEventListener('click', saveSettings);
settingsQuitBtn.addEventListener('click', tryQuitSettings);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) tryQuitSettings();
});

themeToggle.addEventListener('change', () => {
  // Ne s'applique qu'a la sauvegarde (pas de preview live)
});

coordsToggle.addEventListener('change', () => {
  // Ne s'applique qu'a la sauvegarde (pas de preview live)
});

openPiecePickerBtn.addEventListener('click', openPiecePicker);
pieceCloseBtn.addEventListener('click', closePiecePicker);
pieceCancelBtn.addEventListener('click', closePiecePicker);
pieceValidateBtn.addEventListener('click', validatePiecePicker);
pieceModal.addEventListener('click', (e) => {
  if (e.target === pieceModal) closePiecePicker();
});
