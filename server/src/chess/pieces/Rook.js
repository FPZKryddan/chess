const { crawl } = require("../utils/moves");

function getPossibleMovesRook(position, board) {
  const { x, y } = position;
  const self = board[y][x];
  const team = self.color;
  let possibleMoves = [
    ...crawl({ x: 1, y: 0 }, position, team, board, []),
    ...crawl({ x: -1, y: 0 }, position, team, board, []),
    ...crawl({ x: 0, y: 1 }, position, team, board, []),
    ...crawl({ x: 0, y: -1 }, position, team, board, []),
  ];

  //console.log(possbileMoves)
  return possibleMoves;
}

module.exports = { getPossibleMovesRook };