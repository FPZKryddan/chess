import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { useParams } from "react-router-dom";
import { useSocketContext } from "../contexts/SocketProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import LoadingDots from "../components/LoadingDots";
import { validateMoves, commitMove, getPossibleMoves, isCheck, createBoard } from "../chess/chess";
import { GamePlayerHeader } from "../components/GamePlayerHeader";
import { GameWinner } from "../components/GameWinner";
import GameChat from "../components/GameChat";

import { HiFlag } from "react-icons/hi2";
import { GameDrawOffer } from "../components/GameDrawOffer";

export default function Chess() {
  const { id: gameId } = useParams();
  const { currentUser } = useAuth();
  const socket = useSocketContext();

  const [board, setBoard] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [canPlay, setCanPlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState({});
  const [opponent, setOpponent] = useState({});
  const [winner, setWinner] = useState("");

  const [simulatedIndex, setSimulatedIndex] = useState(-1);
  const [storedLiveBoard, setStoredLiveBoard] = useState([]);

  const [drawOfferShow, setDrawOfferShow] = useState(false);
  const [drawOfferRequestSent, setdrawOfferRequestSent] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    if (!socket) return;
    if (!gameId) return;
    // get game state
    socket.emit("game:loaded", gameId);

    setLoading(true);

    socket.on("game:update", (event) => {
      // go back to live if enemy moves
      setStoredLiveBoard([]);
      setSimulatedIndex(-1);
      setBoard(event.board);

      const team = event.w.uid == currentUser.uid ? "w" : "b";
      setCanPlay(event.player_turn == team);
      setLoading(false);

      const w = { uid: event.w.uid, displayName: event.w.name, color: "w" }
      const b = { uid: event.b.uid, displayName: event.b.name, color: "b" }

      setPlayer(team == "w" ? w : b);
      setOpponent(team == "w" ? b : w);
      setMoveHistory(event.move_history);

      if (event.winner != {})
        setWinner(event.winner);
    })

    socket.on("game:end", (event) => {
      setWinner(event.winner);
    })

    socket.on("game:drawreq", (event) => {
      console.log(gameId, event)
      if (gameId != event) return;
      setDrawOfferShow(true);
    })

    socket.on("game:drawdeclined", () => {
      setdrawOfferRequestSent(false);
    })

    return () => {
      socket.off("game:update");
      socket.off("game:end");
      socket.off("game:drawreq")
    }

  }, [currentUser, socket, gameId])


  const [validMoves, setValidMoves] = useState([]);
  const [heldPiece, setHeldPiece] = useState({});
  const [promotionState, setPromotionState] = useState(null);

  const boardRefs = useRef(
    Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => React.createRef()),
    ),
  );

  const handleClickSquare = (piece, x, y) => {
    if (!canPlay) return;
    if ("piece" in heldPiece) {
      // if holding a piece attempt to drop it 
      if (attemptDrop(piece, x, y) == -1) {
        // if drop failed
        // attempt pickup
        attemptPickUp(piece, x, y);
      }

    } else {
      attemptPickUp(piece, x, y)
    }
  }

  const pieceToNotation = {
    "pawn": "",
    "knight": "N",
    "rook": "R",
    "bishop": "B",
    "queen": "Q",
    "king": "K"
  }

  const notationToPiece = {
    "N": "knight",
    "R": "rook",
    "B": "bishop",
    "Q": "queen",
    "K": "king"
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const attemptDrop = (piece, x, y) => {
    if (winner) return;

    // drop if same piece 
    if (heldPiece.position.x == x && heldPiece.position.y == y) {
      setHeldPiece({});
      return;
    }

    // if x and y exists in valid moves
    for (let move of validMoves) {
      if (move.x == x && move.y == y) {
        // commit move
        const newBoard = commitMove(heldPiece, move, board, false);

        // handle promotion
        if (heldPiece.piece.piece == "pawn" && (move.y == 7 || move.y == 0)) {
          setBoard(newBoard);
          setPromotionState({ x: x, y: y, from_x: heldPiece.position.x, from_y: heldPiece.position.y});
          return;
        }

        // translate move to chess double disambigous notation
        let notation = pieceToNotation[heldPiece.piece.piece];
        notation += files[heldPiece.position.x];
        notation += heldPiece.position.y + 1;
        if (move.type == "attack")
          notation += "x"
        notation += files[x];
        notation += y + 1;

        if (move.type == "castle") {
          notation = "o-o";
          if (x < 4) notation += "-o";
        }

        if (socket)
          socket.emit("game:endTurn", gameId, newBoard, notation);
        setBoard(newBoard);
        setHeldPiece({});
        return;
      }
    }

    return -1;
  }

  const attemptPickUp = (piece, x, y) => {
    if (winner) return;


    // check if piece
    if (Object.keys(piece).length <= 0) {
      setHeldPiece({});
      return;
    };
    // check if correct team
    if (piece.color != player.color) return;

    const heldPiece = { piece: piece, position: { x: x, y: y } };
    setHeldPiece(heldPiece);
  }

  const promotePawn = (piece) => {
    const newBoard = board;
    newBoard[promotionState.y][promotionState.x].piece = piece;
    setPromotionState(null);

    let notation = files[promotionState.from_x] + (promotionState.from_y + 1) + files[promotionState.x] + (promotionState.y + 1) + pieceToNotation[piece];

    if (socket)
      socket.emit("game:endTurn", gameId, newBoard, notation);
    setBoard(newBoard);
    setHeldPiece({});

  }

  useEffect(() => {
    if (!("piece" in heldPiece)) {
      setValidMoves([]);
      return;
    }

    // get moves held piece can do and display them
    const possibleMoves = getPossibleMoves(heldPiece.piece, heldPiece.position, board);
    const validatedMoves = validateMoves(heldPiece, possibleMoves, board);
    console.log(validatedMoves)
    setValidMoves(validatedMoves);
  }, [heldPiece])

  const simulateBoardToMove = (moveIndex) => {
    const moves = moveHistory.slice(0, moveIndex + 1);
    const simulatedBoard = createBoard();
    let idx = 0;
    for (let move of moves) {
      // handle castle
      const color = idx % 2 == 0 ? "w" : "b";
      if (move == "o-o") {
        const y = color == "w" ? 7 : 0;
        simulatedBoard[y][6] = {piece: "king", color: color, moves: 1}
        simulatedBoard[y][5] = {piece: "rook", color: color, moves: 1}
        simulatedBoard[y][4] = {}
        simulatedBoard[y][7] = {}
        idx++;
        continue
      } else if (move == "o-o-o") {
        const y = color == "w" ? 7 : 0;
        simulatedBoard[y][2] = {piece: "king", color: color, moves: 1}
        simulatedBoard[y][3] = {piece: "rook", color: color, moves: 1}
        simulatedBoard[y][4] = {}
        simulatedBoard[y][0] = {}
        idx++;
        continue
      }


      // standard case
      move = move.replace('x', '');
      let piece = move[0];
      let pointer = 1;
      if (piece != piece.toUpperCase()) {
        piece = "pawn";
        pointer = 0;
      } else
        piece = notationToPiece[piece];

      let from_x = files.findIndex((file) => file == move[pointer]);
      let from_y = move[pointer + 1] - 1;
      let to_x = files.findIndex((file) => file == move[pointer + 2]);
      let to_y = move[pointer + 3] - 1;

      // handle promotion
      if (move[move.length - 1] != to_y + 1)
        piece = notationToPiece[move[move.length - 1]];

      
      // handle enpassant
        // check if last move was enpassant move
        // check if this move is behind enpassant
      if (idx > 0 && piece == "pawn") {
        console.log(1)
        if (checkIfMoveIsEnpassantMove(idx - 1)) {
          console.log(2)

          const enpassantY = moveHistory[idx - 1][3] - 1;
          if (from_y == enpassantY && Math.abs(to_y - enpassantY) > 0) {
            console.log(3)

            simulatedBoard[enpassantY][to_x] = {};
          }
        }
      }


      simulatedBoard[from_y][from_x] = {};
      simulatedBoard[to_y][to_x] = {piece: piece, color: color};
      idx++;
    }
    setSimulatedIndex(moveIndex);
    
    if (storedLiveBoard.length == 0)
      setStoredLiveBoard(board);
    setBoard(simulatedBoard);
  }

  const checkIfMoveIsEnpassantMove = (moveIndex) => {
    const move = moveHistory[moveIndex];
    if (move.length != 4) return false;
    if (Math.abs(move[1] - move[3]) == 2) return true;
  }

  const backToLiveGame = () => {
    console.log(storedLiveBoard)
    if (storedLiveBoard != []) {
      setBoard(storedLiveBoard);
      setStoredLiveBoard([]);
      setSimulatedIndex(-1);
    }
  }

  //#TODO
  const handleSurrender = () => {
    if (!socket) return;
    if (winner) return;

    socket.emit("game:surrender", player, gameId);
  }

  //#TODO
  const handleDraw = () => {
    if (!socket) return;
    if (winner) return;
    if (drawOfferRequestSent) return;

    setdrawOfferRequestSent(true);
    socket.emit("game:drawreq", gameId, player)
  }

  return (
    <div className="flex flex-col md:flex-row items-center h-full gap-5">
      <div className="flex flex-col w-96 self-center bg-primary-dark h-[32rem] rounded-md border-[1px] border-neutral-black">
        <h1 className="text-center text-text-white text-2xl border-b-2 border-text-white p-2">
          Move History
        </h1>
        <div className="flex-grow overflow-y-scroll">
          <ul>
            {moveHistory.map((move, index) => (
              <li key={index}
                className={`flex flex-row text-text-white hover:brightness-200 bg-primary-dark 
                  cursor-pointer ${simulatedIndex >= index ? "brightness-150" : ""}`}
                onClick={() => simulateBoardToMove(index)}
              >
                <p className="w-12 border-r-2 text-center">{index + 1}</p> <p className="w-full text-center">{move}</p>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="rounded-b-md border-t-2 p-2 border-text-white
            text-text-white bg-accent-green disabled:bg-primary-dark"
          disabled={simulatedIndex < 0}
          onClick={() => backToLiveGame()}
        >
          {simulatedIndex >= 0 
          ? "Jump to live game"
          : "Live"
          }
        </button>
      </div>

      <div className="flex flex-col w-full h-full justify-center items-center self-center">
        <div className="items-center relative">
          {winner &&
            <GameWinner winner={winner} player={player} opponent={opponent} />
          }
          {drawOfferShow &&
            <GameDrawOffer gameId={gameId} opponent={opponent} close={() => setDrawOfferShow(false)}/>
          }
          <GamePlayerHeader playerName={opponent.displayName} playerImg={"../../profile.png"} playerTurn={!canPlay} up={true} />
          <div className={`grid grid-cols-8 grid-rows-8 bg-green-500 border-2 border-primary-dark 
              ${player.color == "b" ? "rotate-180" : ""}`}>
            {loading &&
              <div className="col-span-8 row-span-8 bg-neutral-white opacity-50">
                <LoadingSpinner />
              </div>
            }
            {board.map((row, y) =>
              row.map((piece, x) => (
                <div
                  key={`${x}-${y}`}
                  ref={boardRefs.current[x][y]}
                  className={`flex relative justify-center aspect-square 
                  w-12 md:w-14 lg:w-20
                  items-center ${(x + y) % 2 == 0 ? "bg-[#D1A575]" : "bg-[#F7ECD9]"}
                  hover:brightness-150 hover:cursor-pointer 
                  ${player.color == "b" ? "rotate-180" : ""}`}
                  onClick={() => handleClickSquare(piece, x, y)}
                >
                  {piece.piece != undefined &&
                    <img 
                    className={`w-full ${(piece.piece == "king" && isCheck(piece.color, board)) ? "bg-secondary-redish rounded-full brightness-125" : ""}`} 
                    src={`${piece.color == "w" ? "/pieces/w_" + piece.piece + ".png" : "/pieces/b_" + piece.piece + ".png"}`}>
                    </img>
                  }

                  <div
                    className={
                      `absolute top-0 left-0 w-full h-full pointer-events-none ` +
                      (validMoves.some(
                        (move) =>
                          move.x === x &&
                          move.y === y &&
                          (move.type === "attack" || move.type === "enpassant"),
                      )
                        ? "bg-secondary-redish opacity-70"
                        : "") +
                      (validMoves.some(
                        (move) =>
                          move.x === x && move.y === y && move.type === "move",
                      )
                        ? "bg-accent-blue opacity-70"
                        : "") +
                      (validMoves.some(
                        (move) =>
                          move.x === x && move.y === y && move.type === "castle",
                      )
                        ? "bg-accent-green opacity-70"
                        : "")
                    }
                  ></div>
                </div>
              )),
            )}
          </div>
          <GamePlayerHeader playerName={player.displayName} playerImg={"../../profile.png"} playerTurn={canPlay} up={false} />
        </div>
      </div>

      <div className="w-96 self-center">
        <div className="flex flex-col gap-5">
          <GameChat opponent={opponent.uid} gameId={gameId} />
          <div className="flex flex-row w-full">
            <button 
            className="w-1/2 rounded-l-md p-3 text-neutral-black font-bold text-md border-2
             border-neutral-black hover:bg-accent-green"
             onClick={() => handleSurrender()}>
              Surrender
            </button>
            <button 
            className="w-1/2 rounded-r-md p-3 text-neutral-black font-bold text-md border-2
             border-neutral-black hover:bg-accent-green"
             disabled={drawOfferRequestSent}
             onClick={() => handleDraw()}>
              {drawOfferRequestSent 
              ? <LoadingDots size={20}/>
              : "Draw"
              }
            </button>
          </div>
        </div>
      </div>
      {promotionState && (
        <div className="absolute flex flex-col bg-neutral-white p-2 rounded-md
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-center text-2xl font-bold">
            Promote Pawn!
          </h1>
          <div className="flex flex-row">
            <button
              className="aspect-square w-16 text-white bg-neutral-white font-bold hover:invert"
              onClick={() => promotePawn("rook")}
            >
              Rook
            </button>
            <button
              className="aspect-square w-16 text-white bg-neutral-white font-bold hover:invert"
              onClick={() => promotePawn("knight")}
            >
              Knight
            </button>
            <button
              className="aspect-square w-16 text-white bg-neutral-white font-bold hover:invert"
              onClick={() => promotePawn("bishop")}
            >
              Bishop
            </button>
            <button
              className="aspect-square w-16 text-white bg-neutral-white font-bold hover:invert"
              onClick={() => promotePawn("queen")}
            >
              Queen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
