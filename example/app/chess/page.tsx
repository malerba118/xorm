"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameModel, PieceModel, PlayerModel, store } from "./models";
import { observer } from "mobx-react-lite";
import { cn } from "@/lib/utils";
import { autorun } from "mobx";
import { motion } from "framer-motion";

const ChessGame = observer(() => {
  const [game] = useState<GameModel>(() => GameModel.initialize());

  useEffect(() => {
    store.history.commit();
    autorun(() => {
      console.log(JSON.parse(JSON.stringify(store.toJSON())));
    });
  }, []);

  if (!game) return null;

  const handleSquareClick = (x: number, y: number) => {
    const clickedPiece = game.players
      .flatMap((p) => p.pieces)
      .find((p) => !p.captured && p.position.x === x && p.position.y === y);

    if (game.selectedPiece) {
      // If we have a piece selected, try to move it
      const move = game.selectedPiece.move({ x, y });
      if (move) {
        store.history.commit();
      }
      game.selectPiece(null);
    } else if (clickedPiece && clickedPiece.player.isTurn) {
      // If we're clicking a piece of the current player's color, select it
      game.selectPiece(clickedPiece.id);
    }
  };

  const getValidMoves = (x: number, y: number) => {
    if (!game.selectedPiece) return false;
    return game.selectedPiece.validNextPositions.some(
      (pos) => pos.x === x && pos.y === y
    );
  };

  const renderPiece = (piece: PieceModel) => {
    const symbol = getPieceSymbol(piece.type);
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center text-4xl",
          piece.color === "white" ? "text-white/80" : "text-black"
        )}
        style={{ filter: "drop-shadow(1px 1px 0px rgba(255,255,255,0.5))" }}
      >
        {symbol}
      </div>
    );
  };

  const renderJail = (player: PlayerModel) => {
    const capturedPieces = game.players
      .find((p) => p.id !== player.id)!
      .pieces.filter((p) => p.captured);

    return (
      <div className="flex flex-col items-center">
        <div className="text-white mb-2">{player.color}'s Captures</div>
        <div className="grid grid-cols-4 gap-1 bg-black/30 p-2 rounded">
          {capturedPieces.map((piece) => (
            <div
              key={piece.id}
              className="w-8 h-8 flex items-center justify-center bg-black/20"
            >
              {renderPiece(piece)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative flex gap-4">
        <motion.div
          layout="position"
          style={{
            alignSelf: game.currentPlayer.color === "white" ? "start" : "end",
          }}
          className="h-20 bg-white w-1 rounded-full"
        />
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-8 gap-[0px] max-w-screen">
            {Array.from({ length: 8 }, (_, y) =>
              Array.from({ length: 8 }, (_, x) => {
                const isLight = (x + y) % 2 === 0;
                const piece = game.players
                  .flatMap((p) => p.pieces)
                  .find(
                    (p) =>
                      !p.captured && p.position.x === x && p.position.y === y
                  );
                const isSelected = piece?.id === game.selected_piece_id;
                const isValidMove = getValidMoves(x, y);

                return (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      "w-16 h-16 flex items-center justify-center cursor-pointer relative ring-inset",
                      isLight ? "bg-white/[5%]" : "bg-white/[9%]",
                      isSelected && "ring-1 ring-fuchsia-400",
                      isValidMove && "ring-1 ring-fuchsia-400/30"
                    )}
                    onClick={() => handleSquareClick(x, y)}
                  >
                    {piece && renderPiece(piece)}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex w-full justify-between items-center">
            <Button
              variant="secondary"
              onClick={() => {
                store.history.undo();
                game.selectPiece(null);
              }}
            >
              Undo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                store.history.redo();
                game.selectPiece(null);
              }}
            >
              Redo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

function getPieceSymbol(type: string): string {
  switch (type) {
    case "pawn":
      return "♟";
    case "rook":
      return "♜";
    case "knight":
      return "♞";
    case "bishop":
      return "♝";
    case "queen":
      return "♛";
    case "king":
      return "♚";
    default:
      return "";
  }
}

export default ChessGame;
