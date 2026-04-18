"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/game/hand/constants";
import {
  CANVAS_W, CANVAS_H, BULLET_SPEED,
  createGameState, addParticles, GameState,
} from "@/game/state/GameState";
import { getStageConfig, DEATH_MESSAGES, STAGE_NAMES } from "@/game/stages/stageConfig";
import { spawnEnemy, updateEnemies } from "@/game/managers/EnemyManager";
import { ensureBoss, updateBoss } from "@/game/managers/BossManager";
import { updateBullets } from "@/game/managers/BulletManager";
import { spawnScheduledCard, updateCards } from "@/game/managers/CardManager";
import { updateParticles } from "@/game/engine/ParticleSystem";
import { render } from "@/game/engine/Renderer";
import { evaluateHand, HandResult } from "@/game/hand/evaluateHand";
import { totalCardValue } from "@/game/hand/totalCardValue";
import { getRealtimePower } from "@/game/hand/getRealtimePower";
import { randomCardForStage } from "@/game/hand/stagePool";
import { HAND_COLORS, HAND_NAMES } from "@/game/hand/constants";
import {
  readForcedHand, readForcedStage, readDebugFlag, readQuickFlag, buildForcedHand,
} from "@/game/debug/forcedHands";
import { TitleScreen } from "./TitleScreen";
import { HandRevealScreen } from "./HandRevealScreen";
import { GameOverScreen } from "./GameOverScreen";
import { ClearScreen } from "./ClearScreen";
import { RoyalClearScreen } from "./RoyalClearScreen";
import { DebugPanel } from "./DebugPanel";
import { localStore } from "@/lib/storage/local";

type Screen = "title" | "playing" | "handReveal" | "boss" | "clear" | "gameover" | "royalClear";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState | null>(null);
  const animRef = useRef<number | null>(null);

  const [screen, setScreen] = useState<Screen>("title");
  const screenRef = useRef<Screen>("title");
  useEffect(() => { screenRef.current = screen; }, [screen]);

  const [stageNum, setStageNum] = useState(1);
  const stageNumRef = useRef(1);
  useEffect(() => { stageNumRef.current = stageNum; }, [stageNum]);

  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const [hand, setHand] = useState<(HandResult & { value: number; power: number }) | null>(null);
  const [collectedCards, setCollectedCards] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [deathStage, setDeathStage] = useState(0);
  const [placement, setPlacement] = useState(247);
  const [runId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())
  );

  const [forcedKey, setForcedKey] = useState<ReturnType<typeof readForcedHand>>(null);
  const [startStageNum, setStartStageNum] = useState(1);
  const [debugOn, setDebugOn] = useState(false);
  const [quickMode, setQuickMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setForcedKey(readForcedHand(window.location.search));
    setStartStageNum(readForcedStage(window.location.search) ?? 1);
    setDebugOn(readDebugFlag(window.location.search));
    setQuickMode(readQuickFlag(window.location.search));
  }, []);

  const initGame = useCallback((sn: number): GameState => {
    const cfg = getStageConfig(sn);
    const g = createGameState(sn, cfg);
    if (quickMode) g.collectDuration = 120;
    return g;
  }, [quickMode]);

  const startStage = useCallback((sn: number) => {
    setStageNum(sn);
    setCollectedCards([]);
    setHand(null);
    const g = initGame(sn);
    if (quickMode) g.collectDuration = 120;
    gameRef.current = g;
    setScreen("playing");
  }, [initGame, quickMode]);

  const startGame = useCallback(() => {
    setLives(3);
    setScore(0);
    startStage(startStageNum);
  }, [startStage, startStageNum]);

  const startBoss = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    g.phase = "boss";
    g.enemies = [];
    g.enemyBullets = [];
    g.cards = [];
    g.stageTimer = 0;
    setScreen("boss");
  }, []);

  useEffect(() => {
    if (screen !== "playing" && screen !== "boss") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onBossDefeated = (g: GameState) => {
      setScore((prev) => prev + g.cfg.remaining * 10);
      const nextStage = g.stageNum + 1;
      if (nextStage > 4) {
        setPlacement(1);
        window.setTimeout(() => setScreen("clear"), 500);
      } else {
        setPlacement(g.cfg.remaining);
        window.setTimeout(() => startStage(nextStage), 1000);
      }
    };
    const onEnemyKill = () => { /* score handled inside BulletManager on g.score */ };

    const update = (g: GameState) => {
      g.stageTimer++;
      g.scrollX += 1;

      if (g.inputActive) {
        g.player.x += (g.inputX - g.player.x) * 0.15;
        g.player.y += (g.inputY - g.player.y) * 0.15;
      }
      g.player.x = Math.max(20, Math.min(CANVAS_W - 20, g.player.x));
      g.player.y = Math.max(20, Math.min(CANVAS_H - 100, g.player.y));

      if (g.player.invincible > 0) g.player.invincible--;
      if (g.shakeDuration > 0) g.shakeDuration--;

      // Auto shoot
      if (g.stageTimer % 8 === 0) {
        const power = g.phase === "boss" && g.handMult
          ? {
              dmg: (g.handPower ?? 0) * 0.15,
              size: 6,
              color: "#ffd700",
              extra: g.handMult > 3 ? 2 : g.handMult > 1.5 ? 1 : 0,
              label: "",
            }
          : getRealtimePower(g.collectedCards);
        g.bullets.push({
          x: g.player.x + 12, y: g.player.y,
          speed: BULLET_SPEED, dmg: power.dmg, size: power.size, color: power.color,
        });
        for (let i = 0; i < power.extra; i++) {
          const spread = (i + 1) * 0.15 * (i % 2 === 0 ? 1 : -1);
          g.bullets.push({
            x: g.player.x + 12, y: g.player.y,
            speed: BULLET_SPEED, dmg: power.dmg * 0.6,
            size: power.size * 0.7, color: power.color, vy: Math.sin(spread) * 2,
          });
        }
      }

      if (g.phase === "collect") {
        g.spawnTimer++;
        if (g.spawnTimer >= g.cfg.spawnRate) {
          g.spawnTimer = 0;
          spawnEnemy(g);
        }
        spawnScheduledCard(g);

        if (g.stageTimer >= g.collectDuration) {
          // Determine the showdown hand. Forced override wins if provided.
          let cards = g.collectedCards.slice(0, 5);
          if (forcedKey) {
            const forced = buildForcedHand(forcedKey);
            if (forced) cards = forced;
          } else {
            while (cards.length < 5) cards.push(randomCardForStage(g.stageNum));
          }
          const result = evaluateHand(cards);
          const val = totalCardValue(cards);
          setCollectedCards([...cards]);
          setHand({ ...result, value: val, power: Math.round(val * result.mult) });

          if (result.name === "ROYAL_FLUSH") {
            localStore.markCleared();
            setScreen("royalClear");
            return;
          }

          g.phase = "transition";
          g.transitionTimer = 0;
          g.handMult = result.mult;
          g.handValue = val;
          g.handPower = Math.round(val * result.mult);
          setScreen("handReveal");
          return;
        }
      }

      if (g.phase === "boss") {
        ensureBoss(g);
        updateBoss(g);
      }

      if (g.phase === "collect") {
        updateEnemies(g);
      }
      updateBullets(g, onBossDefeated, onEnemyKill);
      if (g.phase === "collect") {
        updateCards(g, (cards) => setCollectedCards(cards));
      }

      // Player damage
      if (g.player.invincible <= 0) {
        const hitByBullet = g.enemyBullets.some((b) => {
          const dx = g.player.x - b.x;
          const dy = g.player.y - b.y;
          return Math.sqrt(dx * dx + dy * dy) < 15;
        });
        const hitByEnemy = g.enemies.some((e) => {
          return Math.abs(g.player.x - e.x) < 18 && Math.abs(g.player.y - e.y) < 18;
        });
        if (hitByBullet || hitByEnemy) {
          g.player.invincible = 90;
          g.shakeDuration = 15;
          g.shakeIntensity = 5;
          addParticles(g, g.player.x, g.player.y, "#ff0000", 12);
          setLives((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              // Lock out further damage dispatches while the gameover transition plays.
              g.player.invincible = 99999;
              g.phase = "transition";
              setDeathStage(stageNumRef.current);
              setPlacement(g.cfg.remaining - Math.floor(Math.random() * 10));
              window.setTimeout(() => setScreen("gameover"), 300);
            }
            return next;
          });
          g.enemyBullets = [];
        }
      }

      updateParticles(g);
    };

    let cancelled = false;

    const loop = () => {
      if (cancelled) return;
      const g = gameRef.current;
      if (!g) return;
      const cur = screenRef.current;
      if (cur !== "playing" && cur !== "boss") return;
      update(g);
      render(g, ctx, livesRef.current);
      if (cancelled) return;
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
    };
  }, [screen, forcedKey, startStage]);

  // Input binding
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("changedTouches" in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const onStart = (e: Event) => {
      e.preventDefault();
      const g = gameRef.current; if (!g) return;
      const pos = getPos(e as MouseEvent | TouchEvent);
      g.inputX = pos.x;
      g.inputY = pos.y;
      g.inputActive = true;
    };
    const onMove = (e: Event) => {
      e.preventDefault();
      const g = gameRef.current; if (!g || !g.inputActive) return;
      const pos = getPos(e as MouseEvent | TouchEvent);
      g.inputX = pos.x;
      g.inputY = pos.y;
    };
    const onEnd = (e: Event) => {
      e.preventDefault();
      const g = gameRef.current; if (!g) return;
      g.inputActive = false;
    };

    canvas.addEventListener("mousedown", onStart);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("mouseleave", onEnd);
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd, { passive: false });
    canvas.addEventListener("touchcancel", onEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onStart);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onEnd);
      canvas.removeEventListener("mouseleave", onEnd);
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
      canvas.removeEventListener("touchcancel", onEnd);
    };
  }, [screen]);

  const stageName = useMemo(() => STAGE_NAMES[deathStage] ?? STAGE_NAMES[1], [deathStage]);
  const deathMsg = useMemo(() => DEATH_MESSAGES[deathStage] ?? DEATH_MESSAGES[1], [deathStage]);

  const bestHand = hand?.name ?? "HIGH_CARD";

  return (
    <div className="game-root">
      {screen === "title" && <TitleScreen onEntry={startGame} />}
      {(screen === "playing" || screen === "boss") && (
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="game-canvas"
          data-testid="game-canvas"
        />
      )}
      {screen === "handReveal" && hand && (
        <HandRevealScreen
          stageNum={stageNum}
          cards={collectedCards.slice(0, 5)}
          handName={HAND_NAMES[hand.name]}
          handColor={HAND_COLORS[hand.name]}
          mult={hand.mult}
          value={hand.value}
          power={hand.power}
          onFight={startBoss}
        />
      )}
      {screen === "gameover" && (
        <GameOverScreen
          deathMessage={deathMsg}
          stageName={stageName}
          placement={placement}
          score={score}
          onRetry={startGame}
          runId={runId}
          endedStage={(deathStage as 1 | 2 | 3 | 4) || 1}
        />
      )}
      {screen === "clear" && (
        <ClearScreen
          score={score}
          onPlayAgain={startGame}
          runId={runId}
          bestHand={bestHand}
        />
      )}
      {screen === "royalClear" && (
        <RoyalClearScreen
          cards={collectedCards.slice(0, 5)}
          stageNum={stageNum}
          onPlayAgain={startGame}
          runId={runId}
          endedStage={(stageNum as 1 | 2 | 3 | 4) || 1}
        />
      )}
      {debugOn && (
        <DebugPanel
          screen={screen}
          stageNum={stageNum}
          lives={lives}
          score={score}
          forcedKey={forcedKey}
          startStageNum={startStageNum}
          onSetStage={(sn) => { setStartStageNum(sn); }}
        />
      )}
    </div>
  );
}
