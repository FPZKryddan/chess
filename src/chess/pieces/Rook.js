export function getPossibleMovesRook(position, board) {
    const {x, y} = position
    let possbileMoves = []
    possbileMoves = crawl({x: 1, y: 0}, position, board, [])
    console.log(possbileMoves)
    return possbileMoves
}

function crawl(direction, position, board, moves) {
    const x = position.x + direction.x
    const y = position.y + direction.y
    // check if outside board
    if (x < 0 || x > 8) 
        return moves
    if (y < 0 ||y > 8)
        return moves

    if (Object.keys(board[x][y]).length > 0)
        return moves

    moves.push({x, y})
    return crawl(direction, {x, y}, board, moves)
}