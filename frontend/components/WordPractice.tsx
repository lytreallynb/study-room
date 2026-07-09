"use client";

// Flashcard practice inside a focus session. Cards come from the Leitner
// queue (/words/practice); answering reports to the server, which grants XP
// (and a coin every few correct answers). The reveal-then-grade flow:
// term first, tap to flip, then "I knew it" / "Show me again".

import { useCallback, useEffect, useState } from "react";

import * as api from "../lib/api";
import type { PracticeCard, Reward } from "../lib/types";
import CoinIcon from "./CoinIcon";

const BATCH = 8;

interface Props {
  onReward: (reward: Reward) => void;
}

export default function WordPractice({ onReward }: Props) {
  const [queue, setQueue] = useState<PracticeCard[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState({ correct: 0, total: 0 });
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches a batch; callers set `loading` themselves so this stays legal to
  // run from an effect (no synchronous setState).
  const refill = useCallback(() => {
    api
      .practiceCards(BATCH)
      .then((cards) => {
        setQueue(cards);
        setRevealed(false);
        setError(null);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load cards"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refill();
  }, [refill]);

  const card = queue[0];

  async function grade(known: boolean) {
    if (!card) return;
    setQueue((q) => q.slice(1));
    setRevealed(false);
    setDone((d) => ({ correct: d.correct + (known ? 1 : 0), total: d.total + 1 }));
    try {
      const result = await api.reviewWord(card.id, known);
      const r = result.reward;
      if (r.xp_earned > 0) {
        const msg =
          r.coins_earned > 0
            ? `+${r.xp_earned} xp, +${r.coins_earned} coin`
            : `+${r.xp_earned} xp`;
        setToast((t) => ({ id: (t?.id ?? 0) + 1, msg }));
      }
      onReward(r);
    } catch {
      // review is fire-and-forget for the UI; the next batch resyncs
    }
  }

  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
          word cards
        </h2>
        <span className="font-mono text-xs text-muted">
          {done.correct}/{done.total} this sit
        </span>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-coral">{error}</p>
      ) : loading ? (
        <p className="mt-4 text-sm text-muted">Shuffling the deck...</p>
      ) : !card ? (
        <div className="mt-4">
          <p className="text-sm text-mint">
            Deck cleared. New cards come due as you study.
          </p>
          <button
            onClick={() => {
              setLoading(true);
              refill();
            }}
            className="mt-3 rounded-lg border border-line bg-surface px-4 py-1.5 text-sm font-semibold text-ink hover:border-muted"
          >
            Check for more
          </button>
        </div>
      ) : (
        <div className="mt-4" key={card.id}>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-3xl text-ink">{card.term}</p>
            <span className="text-xs text-muted">{card.pos}</span>
            {card.box !== null && (
              <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted">
                box {card.box}
              </span>
            )}
          </div>

          {revealed ? (
            <div className="anim-cardflip mt-3">
              <p className="text-sm text-ink">{card.definition}</p>
              <p className="mt-1 text-sm text-sun">{card.translation}</p>
              <p className="mt-2 text-xs italic leading-relaxed text-muted">
                {card.example}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => grade(true)}
                  className="rounded-lg bg-mint px-4 py-1.5 text-sm font-semibold text-white hover:brightness-110"
                >
                  I knew it
                </button>
                <button
                  onClick={() => grade(false)}
                  className="rounded-lg border border-line bg-surface px-4 py-1.5 text-sm font-semibold text-ink hover:border-muted"
                >
                  Show me again
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="mt-3 w-full rounded-lg border border-dashed border-line py-6 text-sm text-muted hover:border-sun/60 hover:text-ink"
            >
              Tap to reveal the meaning
            </button>
          )}
        </div>
      )}

      {toast && (
        <p
          key={toast.id}
          className="anim-floatup mt-3 flex items-center gap-1.5 text-sm font-bold text-sun"
          onAnimationEnd={() => setToast(null)}
        >
          <CoinIcon className="h-3.5 w-3.5" />
          {toast.msg}
        </p>
      )}
    </section>
  );
}
