import { getPossibleMovesRook } from "../pieces/Rook.js";
import { getPossibleMovesPawn } from "../pieces/Pawn.js";
import { getPossibleMovesKnight } from "../pieces/Knight.js";
import { getPossibleMovesBishop } from "../pieces/Bishop.js";
import { getPossibleMovesQueen } from "../pieces/Queen.js";
import { getPossibleMovesKing } from "../pieces/King.js";

export const movesSearchFunctions = {
  rook: getPossibleMovesRook,
  pawn: getPossibleMovesPawn,
  knight: getPossibleMovesKnight,
  bishop: getPossibleMovesBishop,
  queen: getPossibleMovesQueen,
  king: getPossibleMovesKing,
};

export const crawl = (direction, position, team, board, moves) => {
  const x = position.x + direction.x;
  const y = position.y + direction.y;

  // check boundaries
  if (x < 0 || x >= 8) return moves;
  if (y < 0 || y >= 8) return moves;

  const testCell = board[y][x];

  // check collision
  if (Object.keys(testCell).length > 0) {
    if (testCell.color != team) moves.push({ x, y, type: "attack" });
    else if (testCell.color == team && testCell.piece == "rook")
      moves.push({ x, y, type: "castle" });
    return moves;
  }

  moves.push({ x, y, type: "move" });
  return crawl(direction, { x, y }, team, board, moves);
};

export const testMove = (position, board, team) => {
  const x = position.x;
  const y = position.y;

  // check boundaries
  if (x < 0 || x >= 8) return [];
  if (y < 0 || y >= 8) return [];

  const testCell = board[y][x];

  if (Object.keys(testCell).length > 0) {
    if (testCell.color != team) return [{ x, y, type: "attack" }];
    return [];
  }

  return [{ x, y, type: "move" }];
};

export const getPiece = (position, board) => {
  const { x, y } = position;
  if (x < 0 || x > 7) return null;
  if (y < 0 || y > 7) return null;

  if (Object.keys(board[y][x]).length > 0) return board[y][x];
  return null;
};
