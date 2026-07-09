"""End-to-end proof for StudySync Phase 5.

Two isolated browser contexts (two users) drive the real product:
  1. User A registers via the UI, opens a room, starts a study session.
  2. User B registers in a second context, walks into the same room.
  3. Both must see each other's characters live (Socket.IO presence).
  4. A takes a break; B must see A's status flip without reloading.

Exits non-zero on any failed expectation. Screenshots land in SHOTS_DIR.
"""

import os
import sys
import time
import urllib.request

from playwright.sync_api import expect, sync_playwright

BASE = os.getenv("E2E_BASE_URL", "http://localhost:3000")
API = os.getenv("E2E_API_URL", "http://localhost:8010")
SHOTS = os.getenv("E2E_SHOTS_DIR", "/tmp/studysync-e2e-shots")
STAMP = int(time.time())


def register(page, name: str, email: str) -> None:
    page.goto(f"{BASE}/register")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Display name").fill(name)
    page.get_by_label("Email").fill(email)
    page.get_by_label("Password").fill("hunter2-hunter2")
    page.get_by_role("button", name="Create my desk").click()
    page.wait_for_url(f"{BASE}/rooms", timeout=15000)


def main() -> int:

    os.makedirs(SHOTS, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        ctx_a = browser.new_context(viewport={"width": 1280, "height": 900})
        ctx_b = browser.new_context(viewport={"width": 1280, "height": 900})
        a = ctx_a.new_page()
        b = ctx_b.new_page()

        # landing page screenshot (logged out)
        a.goto(BASE)
        a.wait_for_load_state("networkidle")
        a.screenshot(path=f"{SHOTS}/01-landing.png", full_page=True)
        print("ok: landing rendered")

        # A registers and opens a room
        register(a, "momo", f"momo-{STAMP}@example.com")
        print("ok: user A registered")
        a.get_by_placeholder("New room name").fill(f"night owls {STAMP}")
        a.get_by_role("button", name="Open a room").click()
        a.get_by_role("link", name=f"night owls {STAMP}").click()
        a.wait_for_url(f"{BASE}/rooms/*")
        room_url = a.url
        print(f"ok: room created at {room_url}")

        # A appears at their own desk
        expect(a.get_by_text("momo (you)")).to_be_visible(timeout=10000)
        print("ok: A sees own character")

        # A starts studying
        a.get_by_role("button", name="Start studying").click()
        expect(a.get_by_text("lamp is on")).to_be_visible(timeout=10000)
        print("ok: A started a session, lamp is on")

        # Reload mid-session: timer must restore with no "not in room" race
        a.reload()
        expect(a.get_by_text("lamp is on")).to_be_visible(timeout=10000)
        expect(a.get_by_text("not in room")).not_to_be_visible()
        print("ok: A reloaded mid-session, timer restored, no join race")

        # Word practice rides along with the session; five correct reviews
        # grant XP each and exactly one coin (nav badge flips 0 -> 1).
        expect(a.get_by_text("word cards")).to_be_visible(timeout=10000)
        for _ in range(5):
            a.get_by_role("button", name="Tap to reveal the meaning").click()
            a.get_by_role("button", name="I knew it").click()
        expect(a.get_by_text("5/5 this sit")).to_be_visible(timeout=10000)
        expect(a.locator("header").get_by_text("1", exact=True)).to_be_visible(
            timeout=10000
        )
        print("ok: 5 correct word reviews granted XP and a coin")

        # B registers and walks into the same room
        register(b, "juno", f"juno-{STAMP}@example.com")
        print("ok: user B registered")
        b.goto(room_url)
        expect(b.get_by_text("juno (you)")).to_be_visible(timeout=10000)
        # just walking in must NOT light the lamp: B is idle until a session
        expect(b.get_by_label("juno, idle")).to_be_visible(timeout=10000)
        print("ok: B joins idle (no phantom focus)")
        expect(b.get_by_text("momo", exact=True)).to_be_visible(timeout=10000)
        print("ok: B sees A's character (cross-client presence)")

        # A must see B arrive WITHOUT reloading
        expect(a.get_by_text("juno", exact=True)).to_be_visible(timeout=10000)
        print("ok: A sees B arrive live")

        # A takes a break; B must see the status flip live
        a.get_by_role("button", name="Take a break").click()
        expect(a.get_by_text("paused, stretch your legs")).to_be_visible(timeout=10000)
        expect(
            b.locator("figure", has_text="momo").get_by_label("momo, on a break")
        ).to_be_visible(timeout=10000)
        print("ok: B sees A's break status live")

        # timer keeps counting for B's own session too: B starts one
        b.get_by_role("button", name="Start studying").click()
        expect(b.get_by_text("lamp is on")).to_be_visible(timeout=10000)
        print("ok: B started a session")

        a.screenshot(path=f"{SHOTS}/02-room-userA.png", full_page=True)
        b.screenshot(path=f"{SHOTS}/03-room-userB.png", full_page=True)

        # Multi-tab self-heal: a second tab of A's account joining and closing
        # evicts A's presence entry; the next heartbeat must re-add it.
        a2 = ctx_a.new_page()
        a2.goto(room_url)
        expect(a2.get_by_text("momo (you)")).to_be_visible(timeout=10000)
        a2.close()
        # eviction broadcast lands first...
        expect(b.get_by_text("momo", exact=True)).not_to_be_visible(timeout=10000)
        # ...then tab 1's 20s heartbeat re-adds momo for everyone
        expect(b.get_by_text("momo", exact=True)).to_be_visible(timeout=30000)
        print("ok: multi-tab close evicted then heartbeat self-healed presence")

        # A ends the session and checks the stats page renders
        a.get_by_role("button", name="End session").click()
        expect(a.get_by_text("It counts.")).to_be_visible(timeout=10000)
        a.goto(f"{BASE}/stats")
        expect(a.get_by_text("hall of focus")).to_be_visible(timeout=10000)
        a.screenshot(path=f"{SHOTS}/04-stats.png", full_page=True)
        print("ok: A ended session; stats page renders")

        # Adventure map: the review XP puts A's traveler on the road
        a.goto(f"{BASE}/adventure")
        expect(a.get_by_text("The coast road")).to_be_visible(timeout=10000)
        expect(a.get_by_text("Window Desk")).to_be_visible()
        expect(a.get_by_text("xp total")).to_be_visible()
        a.screenshot(path=f"{SHOTS}/05-adventure.png", full_page=True)
        print("ok: adventure map renders with progress")

        # Leave no junk behind: B ends their session, A deletes the room.
        b.get_by_role("button", name="End session").click()
        expect(b.get_by_text("It counts.")).to_be_visible(timeout=10000)
        token = a.evaluate("localStorage.getItem('studysync_token')")
        room_id = room_url.rstrip("/").split("/")[-1]
        req = urllib.request.Request(
            f"{API}/rooms/{room_id}",
            method="DELETE",
            headers={"Authorization": f"Bearer {token}"},
        )
        urllib.request.urlopen(req)
        print("ok: cleaned up the test room")

        browser.close()

    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
