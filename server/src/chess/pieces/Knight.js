const {testMove} = require("../utils/moves");

function getPossibleMovesKnight(position, board) {
  const { x, y } = position;
  const self = board[y][x];
  const team = self.color;
  let possibleMoves = [
    ...testMove({ x: x + 1, y: y + 2 }, board, team),
    ...testMove({ x: x - 1, y: y + 2 }, board, team),

    ...testMove({ x: x - 2, y: y - 1 }, board, team),
    ...testMove({ x: x - 2, y: y + 1 }, board, team),

    ...testMove({ x: x + 1, y: y - 2 }, board, team),
    ...testMove({ x: x - 1, y: y - 2 }, board, team),

    ...testMove({ x: x + 2, y: y - 1 }, board, team),
    ...testMove({ x: x + 2, y: y + 1 }, board, team),
  ];

  //console.log(possbileMoves)
  return possibleMoves;
}

module.exports = { getPossibleMovesKnight };
