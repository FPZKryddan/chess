import { getPiece, testMove } from "../utils/moves";

export function getPossibleMovesPawn(position, board) {
  const { x, y } = position;
  const self = board[y][x];
  const team = self.color;
  const direction = team == "w" ? -1 : 1;
  let possibleMoves = [...testMove({ x: x, y: y + direction }, board, team)];

  // start pos 2 square moves if not blocked
  if (possibleMoves.length > 0) {
    if (y == 1 || y == 6) {
      const move = testMove({ x: x, y: y + direction * 2 }, board, team);
      if (move.length > 0) possibleMoves = [...possibleMoves, ...move];
    }
  }

  // previous moves can't be attacks
  possibleMoves = possibleMoves.filter((move) => move.type !== "attack");

  // attacks
  const attack1 = testMove({ x: x - 1, y: y + direction }, board, team);
  const attack2 = testMove({ x: x + 1, y: y + direction }, board, team);
  if (attack1.length > 0 && attack1[0].type == "attack")
    possibleMoves = [...possibleMoves, ...attack1];
  if (attack2.length > 0 && attack2[0].type == "attack")
    possibleMoves = [...possibleMoves, ...attack2];

  // en passant
  const testEnpassant1 = getPiece({ x: x - 1, y: y }, board);
  const testEnpassant2 = getPiece({ x: x + 1, y: y }, board);
  if (testEnpassant1) {
    if (
      attack1.length > 0 &&
      attack1[0].type == "move" &&
      testEnpassant1.color != team &&
      "enpassant" in testEnpassant1
    )
      possibleMoves = [
        ...possibleMoves,
        { x: attack1[0].x, y: attack1[0].y, type: "enpassant" },
      ];
  }
  if (testEnpassant2) {
    if (
      attack2.length > 0 &&
      attack2[0].type == "move" &&
      testEnpassant2.color != team &&
      "enpassant" in testEnpassant2
    )
      possibleMoves = [
        ...possibleMoves,
        { x: attack2[0].x, y: attack2[0].y, type: "enpassant" },
      ];
  }

  return possibleMoves;
}
