import { crawl } from "../utils/moves";

export function getPossibleMovesQueen(position, board) {
    const {x, y} = position
    const self = board[y][x]
    const team = self.color
    let possibleMoves = [
        // horizontal
        ...crawl({ x: 1, y: 0 }, position, team, board, []),
        ...crawl({ x: -1, y: 0 }, position, team, board, []),
        ...crawl({ x: 0, y: 1 }, position, team, board, []),
        ...crawl({ x: 0, y: -1 }, position, team, board, []),
        // diagonal
        ...crawl({ x: 1, y: 1 }, position, team, board, []),
        ...crawl({ x: -1, y: 1 }, position, team, board, []),
        ...crawl({ x: 1, y: -1 }, position, team, board, []),
        ...crawl({ x: -1, y: -1 }, position, team, board, []),
    ];

    //console.log(possbileMoves)
    return possibleMoves
}
