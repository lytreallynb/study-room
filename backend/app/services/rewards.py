"""Gamification economy: XP, coins, and levels.

All rewards derive from server-verified quantities (focus_seconds computed
from the server clock, word reviews recorded server-side), so the client can
render coins flying around but can never mint them.

Economy:
  - 1 XP and 1 coin per focused minute (session end)
  - 2 XP per correct word review, plus 1 coin per 5 correct reviews
  - Level n requires LEVEL_STEP_XP * (n - 1) cumulative XP (linear ramp)
"""

from dataclasses import dataclass

from app.models.user import User

LEVEL_STEP_XP = 120  # one level per 2 focused hours (or equivalent reviews)

XP_PER_FOCUS_MINUTE = 1
COINS_PER_FOCUS_MINUTE = 1
XP_PER_CORRECT_REVIEW = 2
REVIEWS_PER_COIN = 5


@dataclass
class Reward:
    coins_earned: int
    xp_earned: int
    level: int
    leveled_up: bool


def level_for_xp(xp: int) -> int:
    return 1 + xp // LEVEL_STEP_XP


def xp_into_level(xp: int) -> int:
    return xp % LEVEL_STEP_XP


def _apply(user: User, coins: int, xp: int) -> Reward:
    before = user.level
    user.coins += coins
    user.xp += xp
    user.level = level_for_xp(user.xp)
    return Reward(
        coins_earned=coins,
        xp_earned=xp,
        level=user.level,
        leveled_up=user.level > before,
    )


def grant_focus_reward(user: User, focus_seconds: int) -> Reward:
    minutes = max(0, focus_seconds) // 60
    return _apply(
        user,
        coins=minutes * COINS_PER_FOCUS_MINUTE,
        xp=minutes * XP_PER_FOCUS_MINUTE,
    )


def grant_review_reward(user: User, correct: bool, correct_count_after: int) -> Reward:
    if not correct:
        return Reward(0, 0, user.level, False)
    coins = 1 if correct_count_after % REVIEWS_PER_COIN == 0 else 0
    return _apply(user, coins=coins, xp=XP_PER_CORRECT_REVIEW)
