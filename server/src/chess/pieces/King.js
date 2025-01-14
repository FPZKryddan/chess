import { crawl, testMove } from "../utils/moves.js";

export function getPossibleMovesKing(position, board) {
  const { x, y } = position;
  const self = board[y][x];
  const team = self.color;
  let possibleMoves = [
    ...testMove({ x: x - 1, y: y - 1 }, board, team),
    ...testMove({ x: x + 0, y: y - 1 }, board, team),
    ...testMove({ x: x + 1, y: y - 1 }, board, team),

    ...testMove({ x: x + 1, y: y + 0 }, board, team),
    ...testMove({ x: x - 1, y: y + 0 }, board, team),

    ...testMove({ x: x - 1, y: y + 1 }, board, team),
    ...testMove({ x: x + 0, y: y + 1 }, board, team),
    ...testMove({ x: x + 1, y: y + 1 }, board, team),
  ];

  // castling
  // if king has already moved then can't castle
  if ("moves" in self) return possibleMoves;

  let castleLeft = crawl({ x: -1, y: 0 }, { x: x, y: y }, team, board, []);
  let castleRight = crawl({ x: 1, y: 0 }, { x: x, y: y }, team, board, []);

  castleLeft = castleLeft.length > 0 ? castleLeft[castleLeft.length - 1] : null;
  castleRight =
    castleRight.length > 0 ? castleRight[castleRight.length - 1] : null;

  if (castleLeft)
    castleLeft =
      "moves" in board[castleLeft.y][castleLeft.x] ? null : castleLeft;
  if (castleRight)
    castleRight =
      "moves" in board[castleRight.y][castleRight.x] ? null : castleRight;

  let castles = [castleLeft, castleRight];
  castles = castles.filter((moves) => moves != null);

  possibleMoves = [...possibleMoves, ...castles];

  console.log(possibleMoves);

  return possibleMoves;
}
