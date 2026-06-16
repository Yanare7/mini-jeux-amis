// ============================================================
// CONFIGURATION : constantes du jeu
//
// Ce fichier ne contient que des valeurs FIXES, qui ne changent
// jamais pendant une partie. Si tu veux changer le set de pieces
// utilise, ou la geometrie du minuteur, c'est ici qu'il faut
// regarder.
// ============================================================

// Sets de pieces disponibles dans le menu (id = sous-dossier dans pieces/,
// label = texte affiche dans la liste deroulante).
// Pour en ajouter un, place le dossier pieces/<id>/ (memes noms de
// fichiers : wk.png, bp.png, ...) et ajoute une ligne ici.
const PIECE_SETS = [
  { id: 'neo', label: 'Neo' },
  { id: 'classic', label: 'Classique' },
  { id: 'alpha', label: 'Alpha' },
  { id: 'book', label: 'Book' },
  { id: 'club', label: 'Club' },
  { id: 'condal', label: 'Condal' },
  { id: 'dash', label: 'Dash' },
  { id: 'game_room', label: 'Game Room' },
  { id: 'glass', label: 'Verre' },
  { id: 'gothic', label: 'Gothique' },
  { id: 'icy_sea', label: 'Mer glacee' },
  { id: 'light', label: 'Light' },
  { id: 'lolz', label: 'Lolz' },
  { id: 'marble', label: 'Marbre' },
  { id: 'maya', label: 'Maya' },
  { id: 'metal', label: 'Metal' },
  { id: 'modern', label: 'Moderne' },
  { id: 'nature', label: 'Nature' },
  { id: 'neo_wood', label: 'Neo Bois' },
  { id: 'neon', label: 'Neon' },
  { id: 'newspaper', label: 'Journal' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sky', label: 'Ciel' },
  { id: 'space', label: 'Espace' },
  { id: 'tigers', label: 'Tigres' },
  { id: 'tournament', label: 'Tournoi' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'wood', label: 'Bois' },
  { id: '8_bit', label: '8-bit' },
  { id: 'bubblegum', label: 'Bubblegum' },
  { id: 'graffiti', label: 'Graffiti' },
  { id: '3d_chesskid', label: '3D ChessKid' },
  { id: '3d_plastic', label: '3D Plastique' },
  { id: '3d_staunton', label: '3D Staunton' },
  { id: '3d_wood', label: '3D Bois' }
];
const DEFAULT_PIECE_SET = 'neo';

// Lettre utilisee dans le nom de fichier pour chaque type de piece
// (ex: pieces/neo/wk.png = roi blanc, pieces/neo/bp.png = pion noir)
const PIECE_LETTERS = {
  king: 'k', queen: 'q', rook: 'r', bishop: 'b', knight: 'n', pawn: 'p'
};
const PIECE_TYPES = Object.keys(PIECE_LETTERS);
const COLORS = ['white', 'black'];

// Construit le chemin de l'image correspondant a une piece donnee, en
// utilisant le set de pieces actuellement choisi (variable "pieceSet"
// definie dans state.js, modifiable depuis le menu).
// Si "pieceSetOverride" (state.js) est defini, il prend la priorite :
// c'est utilise pour afficher un apercu d'un autre set sans changer le
// set reellement selectionne.
// piece = { type: 'king', color: 'white' } -> 'pieces/neo/wk.png'
function getPieceImageSrc(piece) {
  const set = pieceSetOverride || pieceSet;
  const colorLetter = piece.color === 'white' ? 'w' : 'b';
  return 'pieces/' + set + '/' + colorLetter + PIECE_LETTERS[piece.type] + '.png';
}

// Construit le chemin d'une piece pour un set precis (sans toucher a l'etat).
function getPieceImageSrcForSet(piece, setId) {
  const colorLetter = piece.color === 'white' ? 'w' : 'b';
  return 'pieces/' + setId + '/' + colorLetter + PIECE_LETTERS[piece.type] + '.png';
}

// Geometrie du minuteur circulaire (perimetre = 2 * pi * rayon)
const TIMER_RADIUS = 42;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

// Distance (en pixels) que le pointeur doit parcourir avant qu'un
// "appui" soit considere comme un glisser-deposer plutot qu'un clic
const DRAG_THRESHOLD = 6;
