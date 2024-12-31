import { movesSearchFunctions } from "./utils/moves";


const initBoard = [
  [
    { piece: "rook", color: "b" },
    { piece: "knight", color: "b" },
    { piece: "bishop", color: "b" },
    { piece: "queen", color: "b" },
    { piece: "king", color: "b" },
    { piece: "bishop", color: "b" },
    { piece: "knight", color: "b" },
    { piece: "rook", color: "b" },
  ],
  [
    { piece: "pawn", color: "b" },
    { piece: "pawn", color: "b" },
    { piece: "pawn", color: "b" },
    { piece: "pawn", color: "b" },
    { piece: "pawn", color: "b" },
    { piece: "pawn", color: "b" },
    { piece: "pawn", color: "b" },
    { piece: "pawn", color: "b" },
  ],
  [{}, {}, {}, {}, {}, {}, {}, {}],
  [{}, {}, {}, {}, {}, {}, {}, {}],
  [{}, {}, {}, {}, {}, {}, {}, {}],
  [{}, {}, {}, {}, {}, {}, {}, {}],
  [
    { piece: "pawn", color: "w" },
    { piece: "pawn", color: "w" },
    { piece: "pawn", color: "w" },
    { piece: "pawn", color: "w" },
    { piece: "pawn", color: "w" },
    { piece: "pawn", color: "w" },
    { piece: "pawn", color: "w" },
    { piece: "pawn", color: "w" },
  ],
  [
    { piece: "rook", color: "w" },
    { piece: "knight", color: "w" },
    { piece: "bishop", color: "w" },
    { piece: "king", color: "w" },
    { piece: "queen", color: "w" },
    { piece: "bishop", color: "w" },
    { piece: "knight", color: "w" },
    { piece: "rook", color: "w" },
  ],
]

export const createBoard = () => {
  return initBoard;
}

export const restructureBoard = (flatBoard) => {
  const board = [
    flatBoard.slice(0,8),
    flatBoard.slice(8,16),
    flatBoard.slice(16,24),
    flatBoard.slice(24,32),
    flatBoard.slice(32,40),
    flatBoard.slice(40,48),
    flatBoard.slice(48,56),
    flatBoard.slice(56,64)
  ];
  return board;
}

export const getPossibleMoves = (piece, position, gameBoard) => {
  const { x, y } = position;
  const moveSearchFunction = movesSearchFunctions[piece.piece];
  let moves = moveSearchFunction({ x: x, y: y }, gameBoard);
  if (piece.piece != "king")
    moves = moves.filter((move) => move.type != "castle");
  return moves;
};

export const validateMoves = (selectedPiece, moves, board) => {
  let validatedMoves = [];
  moves.forEach((move) => {
    // castling
    if (move.type == "castle") {
      // is valid if the two steps king takes are not checked by enemy
      const direction = move.x == 0 ? -1 : 1;
      const step1 = {
        x: selectedPiece.position.x + direction,
        y: selectedPiece.position.y,
        type: move.type,
      };
      const step2 = {
        x: selectedPiece.position.x + direction * 2,
        y: selectedPiece.position.y,
        type: move.type,
      };

      if (!isValidMove(selectedPiece, step1, board)) return;
      if (!isValidMove(selectedPiece, step2, board)) return;

      // add valid moves from step2 -> rook
      for (let x = step2.x; x >= 0 && x <= 7; x += direction) {
        validatedMoves = validatedMoves.concat([
          { x: x, y: step2.y, type: move.type },
        ]);
      }
    } else if (isValidMove(selectedPiece, move, board)) {
      validatedMoves = validatedMoves.concat([move]);
    }
  });
  return validatedMoves;
};

const isValidMove = (selectedPiece, move, board) => {
  // invalid if own king gets checked
  // create temp board and simulate move made
  const tempBoard = structuredClone(board);
  commitMove(selectedPiece, move, tempBoard, true);
  if (isCheck(selectedPiece.piece.color, tempBoard)) return false;
  return true;
};

export const commitMove = (selectedPiece, move, gameBoard, simulated) => {
  const { x: oldX, y: oldY } = selectedPiece.position;
  let { x: newX, y: newY } = move;

  const newPiece = {
    piece: selectedPiece.piece.piece,
    color: selectedPiece.piece.color,
    moves: (selectedPiece.moves || 0) + 1,
  };

  console.log(move);
  // if castle
  // if move.x < 4 then direction to move king = -1 : 1
  // if kingDir == -1 then rook == x:0, y:newY else rook == x:7, y:newY
  // rooks new position is x:2 else x:4
  if (move.type == "castle") {
    const kingDir = move.x < 4 ? -1 : 1;
    const oldRookX = kingDir == -1 ? 0 : 7
    const newRookX = kingDir == -1 ? 3 : 5
    newX = oldX + kingDir * 2;
    gameBoard[oldY][oldRookX] = {}
    gameBoard[newY][newRookX] = {
      piece: "rook",
      color: selectedPiece.piece.color,
      moves: 1
    }
  }



  // if enpassant attack
  // if (move.type == "enpassant")
  //   gameBoard[enpassantPiece.y][enpassantPiece.x] = {};

  gameBoard[oldY][oldX] = {};
  gameBoard[newY][newX] = newPiece;
  if (move.type == "castle")
    console.log(gameBoard)
  if (!simulated) {
    // en passant move
    // if (selectedPiece.piece == "pawn" && Math.abs(newY - oldY) == 2) {
    //   gameBoard[newY][newX] = { ...newPiece, enpassant: true };

      // remove old enpassant piece if exists on board
    //   if (enpassantPiece) {
    //     const oldEnpassantPiece = gameBoard[enpassantPiece.y][enpassantPiece.x];
    //     gameBoard[enpassantPiece.y][enpassantPiece.x] = {
    //       piece: oldEnpassantPiece.piece,
    //       color: oldEnpassantPiece.color,
    //       moves: oldEnpassantPiece.moves,
    //     };
    //   }

    //   setEnpassantPiece({ x: newX, y: newY });
    // } else if (enpassantPiece) {
    //   const oldEnpassantPiece = gameBoard[enpassantPiece.y][enpassantPiece.x];
    //   if (Object.keys(oldEnpassantPiece) > 0)
    //     gameBoard[enpassantPiece.y][enpassantPiece.x] = {
    //       piece: oldEnpassantPiece.piece,
    //       color: oldEnpassantPiece.color,
    //       moves: oldEnpassantPiece.moves,
    //     };
    //   setEnpassantPiece(null);
    // }
    return gameBoard;

    // check checkmate
    if (isCheckmate(turn == "w" ? "b" : "w", gameBoard)) {
      console.log("checkmate");
    }

    // promotion
    // if (selectedPiece.piece == "pawn" && (newY == 7 || newY == 0)) {
    //   setPromotionState({ x: newX, y: newY });
    //   return; // don't end turn until promotion state is off
    // }

    // end turn
    endTurn();
  }
};

const getKingPosition = (team, gameBoard) => {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = gameBoard[y][x];
      // if not a piece, ignore
      if (Object.keys(piece).length == 0) continue;
      if (piece.piece == "king" && piece.color == team) return { x: x, y: y };
    }
  }
  return false;
};

const isCheck = (team, gameBoard) => {
  const kingPos = getKingPosition(team, gameBoard);
  if (kingPos === false) return true;

  let possibleKingAttack = false;

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = gameBoard[y][x];
      // if not a piece, ignore
      if (Object.keys(piece).length == 0) continue;

      // if enemy piece check if it can attack king
      if (piece.color != team) {
        const moves = getPossibleMoves(piece, { x, y }, gameBoard);
        moves.forEach((move) => {
          if (move.x == kingPos.x && move.y == kingPos.y) {
            possibleKingAttack = true;
            return true;
          }
        });
      }
    }
  }
  if (possibleKingAttack) return true;
  return false;
};

const isCheckmate = (team, gameBoard) => {
  // check if check is blockable
  // loop through all of checked teams pieces and
  if (!isCheck(team, gameBoard)) return false;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const piece = gameBoard[y][x];
      if (Object.keys(piece).length === 0 || piece.color !== team) continue;

      const possibleMoves = getPossibleMoves(piece, { x, y }, gameBoard);

      for (let move of possibleMoves) {
        const tempBoard = structuredClone(gameBoard);
        commitMove(
          { piece: piece.piece, color: piece.color, position: { x, y } },
          move,
          tempBoard,
          true,
        );
        if (!isCheck(team, gameBoard)) return false;
      }
    }
  }
  return true;
};

const promotePawn = (promotionPiece) => {
  if (promotionState) {
    const tempBoard = structuredClone(board);
    tempBoard[promotionState.y][promotionState.x] = {
      piece: promotionPiece,
      color: turn,
    };
    setBoard(tempBoard);
    setPromotionState(null);
    endTurn();
  }
};

const endTurn = () => {
  if (turn == "w") setTurn("b");
  else setTurn("w");
};
