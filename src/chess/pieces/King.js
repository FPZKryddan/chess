import { testMove } from "../utils/moves";

export function getPossibleMovesKing(position, board) {
    const {x, y} = position
    const self = board[y][x]
    const team = self.color
    let possibleMoves = [
        ...testMove({x: x-1, y: y-1}, board, team),
        ...testMove({x: x+0, y: y-1}, board, team),
        ...testMove({x: x+1, y: y-1}, board, team),

        ...testMove({x: x+1, y: y+0}, board, team),
        ...testMove({x: x-1, y: y+0}, board, team),

        ...testMove({x: x-1, y: y+1}, board, team),
        ...testMove({x: x+0, y: y+1}, board, team),
        ...testMove({x: x+1, y: y+1}, board, team),
    ];

    return possibleMoves
}