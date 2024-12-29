import React, { useState, useEffect, useRef } from "react";

export default function chess() {
  const BOARD_SIZE = 8;
  const [turn, setTurn] = useState("w");

  const [board, setBoard] = useState([
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
    [{}, {}, {}, {}, { piece: "pawn", color: "b" }, {}, {}, {}],
    [{}, {}, {}, { piece: "pawn", color: "w" }, {}, {}, {}, {}],
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
      {},
      {},
      { piece: "king", color: "w" },
      { piece: "queen", color: "w" },
      { piece: "bishop", color: "w" },
      { piece: "knight", color: "w" },
      { piece: "rook", color: "w" },
    ],
  ]);
  const [validMoves, setValidMoves] = useState([]);
  const [heldPiece, setHeldPiece] = useState({});
  const [promotionState, setPromotionState] = useState(null);
  const [enpassantPiece, setEnpassantPiece] = useState(null);

  const boardRefs = useRef(
    Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => React.createRef()),
    ),
  );

  const initMove = (piece, x, y) => {
    // if not holding a piece, pick it up
    if (Object.keys(heldPiece).length == 0) {
      if (Object.keys(piece).length == 0)
        // if clicked a empty square return
        return;
      if (piece.color != turn)
        // if clicked piece is wrong team return
        return;

      const selection = {};
      selection.piece = piece.piece;
      selection.color = piece.color;
      if ("moves" in piece) selection.moves = piece.moves;
      selection.position = { x, y };
      setHeldPiece(selection);

      const moves = getPossibleMoves(selection, selection.position, board);
      const validatedMoves = validateMoves(selection, moves);
      if (validatedMoves.length == 0) setHeldPiece({});
      setValidMoves(validatedMoves);
    } else {
      //
      // check if click cords are in validMoves positions
      // Commit move
      const attemptedMove = validMoves.filter(
        (move) => move.x === x && move.y === y,
      );
      if (attemptedMove.length > 0) {
        // castling
        if (attemptedMove[0].type == "castle") {
          const direction = attemptedMove[0].x < heldPiece.position.x ? -1 : 1;
          const rook = {
            piece: "rook",
            color: heldPiece.color,
            position: { x: direction < 0 ? 0 : 7, y: attemptedMove[0].y },
          };
          commitMove(
            rook,
            {
              x: heldPiece.position.x + direction,
              y: rook.position.y,
              type: "castle",
            },
            board,
            false,
          );
          commitMove(
            heldPiece,
            {
              x: heldPiece.position.x + direction * 2,
              y: heldPiece.position.y,
              type: "castle",
            },
            board,
            false,
          );
        } else commitMove(heldPiece, attemptedMove[0], board, false);
      }
      setHeldPiece({});
      setValidMoves([]);
    }
  };

  return (
    <>
      <div className="grid grid-cols-8 grid-rows-8 w-1/3 aspect-square m-auto bg-green-500">
        {board.map((row, y) =>
          row.map((piece, x) => (
            <div
              key={`${x}-${y}`}
              ref={boardRefs.current[x][y]}
              className={`flex relative justify-center items-center ${(x + y) % 2 == 0 ? "bg-[#769656]" : "bg-[#eeeed2]"}
                            hover:brightness-150 hover:cursor-pointer`}
              onClick={() => initMove(piece, x, y)}
            >
              <h1
                className={`${piece.color == "w" ? "text-white" : "text-black"} font-bold`}
              >
                {piece.piece}
              </h1>

              <div
                className={
                  `absolute top-0 left-0 w-full h-full pointer-events-none ` +
                  (validMoves.some(
                    (move) =>
                      move.x === x &&
                      move.y === y &&
                      (move.type === "attack" || move.type === "enpassant"),
                  )
                    ? "bg-red-400 opacity-70"
                    : "") +
                  (validMoves.some(
                    (move) =>
                      move.x === x && move.y === y && move.type === "move",
                  )
                    ? "bg-blue-400 opacity-70"
                    : "") +
                  (validMoves.some(
                    (move) =>
                      move.x === x && move.y === y && move.type === "castle",
                  )
                    ? "bg-green-400 opacity-70"
                    : "")
                }
              ></div>
            </div>
          )),
        )}
      </div>
      {promotionState && (
        <div className="absolute flex flex-row bg-slate-600">
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("rook")}
          >
            Rook
          </button>
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("knight")}
          >
            Knight
          </button>
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("bishop")}
          >
            Bishop
          </button>
          <button
            className="aspect-square w-16 text-white font-bold hover:bg-gray-700"
            onClick={() => promotePawn("queen")}
          >
            Queen
          </button>
        </div>
      )}
    </>
  );
}
