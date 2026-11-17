<div align="center">

# ✦ The Advent House ✦

### Twenty-four doors. One snowy night. A monkey with absolutely no respect for gravity.

[![Play the Advent House](https://img.shields.io/badge/Play_the_Advent_House-Visit_live_site-ffe2a0?style=for-the-badge)](https://chrisbrooksbank.github.io/adventcalendar/)
![24 advent doors](https://img.shields.io/badge/Advent_doors-24-8f1220)
![Three.js](https://img.shields.io/badge/Made_with-Three.js-23508f)
![Web Audio](https://img.shields.io/badge/Sound-Web_Audio-1d6b3f)

![The Advent House in motion: a glowing calendar house beneath a winter sky, with falling snow and friends outside.](docs/advent-house.gif)

*A little December magic, built for your browser.*

[Step inside](https://chrisbrooksbank.github.io/adventcalendar/) · [Skip ahead to Christmas Eve](https://chrisbrooksbank.github.io/adventcalendar/?date=2026-12-24) · [Run it locally](#bring-the-house-home)

</div>

## The house at the end of the snowy lane

The windows glow. Snow drifts through the lamplight. Somewhere beneath an aurora, a moose is wearing fairy lights and a Highland cow is hiding behind his fringe. In front of you stands a house with twenty-four numbered doors.

You know the rules. One door a day.

Except this calendar has a few extracurricular activities. Father Christmas needs a delivery pilot. George the monkey has discovered that tinsel makes an excellent swinging rope. And the entire front of the house doubles as a musical instrument. Your quick festive visit may run slightly over schedule.

**The Advent House is an interactive 3D advent calendar**, with animated worlds, synthesised carols, games, and a cast of snowy friends. Open it in a modern browser with WebGL support; there is no account to create.

## In this December issue

[The attractions](#in-this-december-issue) · [First five minutes](#your-first-five-minutes) · [Controls](#the-pocket-sized-controls-guide) · [Local setup](#bring-the-house-home) · [Inside the workshop](#behind-the-fairy-lights) · [FAQ](#a-few-questions-from-the-doorstep)

| The attraction | Why you’ll linger |
| --- | --- |
| 🚪 **24 little worlds** | Each door reveals its own animated scene, caption, and tune, from the first snowflake to the stillness of *Silent Night*. Soft shadows, glinting snow, mirror-black ice, light shafts and a miniature-film focus give every one the look of a precious diorama. |
| ✨ **A proper entrance** | Twenty-four different opening effects, and then you *step through*: the open doorway is a true window into the world behind it, and the camera glides straight in without a single cut. |
| ⭐ **Twenty-Four Stars** | The roof star has gone out and its light is scattered behind the doors. Find the star hidden in each world and it flies home into a constellation over the house, one more line each day, until Christmas Eve brings it all back down. |
| 🗝️ **Tomorrow’s keyhole** | Once today’s door is open, light leaks from under tomorrow’s. Peek through the keyhole for a blurred glimpse and a riddle. |
| 🪟 **Living windows** | Every door you open keeps playing a few seconds of its world, so the house front fills up with tiny moving scenes. |
| 🛷 **Midnight Delivery** | Fly over a snowy village and drop presents down chimneys. Chase combos, conserve your magic, and beat your best delivery run. |
| 🐒 **George Swings** | Hook fairy lights with tinsel, build momentum, and release at just the right moment. George supplies the enthusiasm; you supply the timing. |
| 🎹 **Carol of the Doors** | Follow a carol on the glowing doors, choose gentle or full notes, or switch to free play and make the house your instrument. |
| 🎶 **The Friends’ Concert** | Let the friends perform, tap the musicians for a reaction, and ask for another carol. The Huron Carol is always on the programme. |
| 🏘 **My Village** | Every door opened in December brings a building for a snowy village of your own. Place and turn the pieces, keep good neighbours together for village cheer, watch villagers come out to walk, and plan a spot for tomorrow’s piece. |
| 🎁 **Make it a gift** | Write a note behind any door, sign it, and send the calendar to someone. Each note waits until its day, then appears on a handwritten card when that door's world opens. The notes travel in the link itself, with no account and no server. |
| 🌌 **Winter atmosphere** | Falling snow, aurora, stars, bloom lighting, and clickable characters make waiting for December rather pleasant. |
| 💾 **A house that remembers** | Opened doors and game records are saved locally in your browser. Delivery and swinging challenges use a daily seed. |

## Your first five minutes

1. **[Visit the house](https://chrisbrooksbank.github.io/adventcalendar/).** Take a moment to watch the sky. The moose can wait.
2. **Click or tap a numbered door.** During December, doors up to today’s date can open. Come back tomorrow for the next one.
3. **Turn up the sound.** Interact with the page to allow browser audio; the **♪** button toggles sound.
4. **Meet the neighbours.** Click the friends outside. George is particularly keen to demonstrate something inadvisable.
5. **Try the buttons above the house.** **✦ Play** opens a menu of the four games, **🏘 My village** shows the village you're building, and **🎁 Make it a gift** turns the calendar into a present. The calendar is only the beginning.

Visiting outside December? The house and its activities are still worth a trip. For a tour with every calendar door available, use the [Christmas Eve preview](https://chrisbrooksbank.github.io/adventcalendar/?date=2026-12-24). Preview door progress is saved separately from ordinary calendar progress.

### The pocket-sized controls guide

| Activity | Mouse / touch | Keyboard |
| --- | --- | --- |
| Explore the house | Click or tap doors and friends | **Esc** leaves a door scene |
| Choose a game | Tap **✦ Play**, then pick a game; tap anywhere else to close the menu | **Esc** closes the menu |
| Fly the sleigh | Move the mouse or drag to steer; click, quick-tap, or tap with a second finger to drop a present | **Arrow keys / WASD** steer; **Space / Enter** drops |
| George Swings | Hold to hook; release to fling | Hold **Space / Enter / ↑**, then release |
| Carol of the Doors | Select a carol, then tap the lit doors; try **Free play** | Door rows, bottom to top: **ZXCVBN**, **ASDFGH**, **QWERTY**, **123456** |
| The Friends’ Concert | Tap the players; choose **Another carol** | **Esc** returns home |
| My Village | Tap a piece in the tray (or a building), then tap an empty square to build or move it; drag to look around; **⟲ ⟳** turn the view; **Turn piece** and **Put away** act on the selected piece | **← →** turn the view; **R** turns the selected piece; **Esc** returns home |

Use the on-screen back buttons to return. In Carol of the Doors, **Esc** first returns to the song menu, then to the house.

## Bring the house home

You need **Node.js** and a modern browser with WebGL support. The static server uses Node’s built-in modules, and Three.js is included in the repository, so there are **no npm dependencies to install**.

```sh
git clone https://github.com/ChrisBrooksbank/adventcalendar.git
cd adventcalendar
npm start
```

Open **[http://localhost:8123](http://localhost:8123)**. Stop the server with **Ctrl+C**.

Prefer the direct route? `node server.js` does the same thing. The server also accepts a `PORT` environment variable. Serve the files over HTTP rather than opening `index.html` directly, so browser module imports work correctly.

### The editor’s time machine

Append these query strings to the live or local URL:

| Query | What it does |
| --- | --- |
| `?date=2026-12-24` | Pretend it’s Christmas Eve and make all calendar doors available. |
| `?date=2026-12-24&open=1` | Jump directly into the first door’s scene. Change `1` to any door from `1` to `24`. |
| `?allcarols` | Make all carols available to the musical modes. |
| `?date=2026-12-24&stars=1-14` | Preview the sky with those stars already home (`stars=all` for every one). |
| `?date=2026-12-24&stars=all&finale` | Play the Christmas Eve finale. |
| `?date=2026-12-05&peek=6` | Peek through door 6’s keyhole. |
| `?q=0`, `?q=1`, `?q=2` | Force the low, medium or high graphics tier (normally picked automatically, and lowered if frames run slow). |
| `?game` | Start Midnight Delivery. |
| `?swing` | Start George Swings. |
| `?carol` | Open Carol of the Doors. |
| `?band` | Start The Friends’ Concert. |
| `?village` | Open My Village. Add `&allvillage` to have all 24 buildings to place. |
| `#gift=…` | Open a gift calendar (made with **🎁 Make it a gift**). Combine with `?date=2026-12-24&open=24` to read door 24's note straight away. |

## Behind the fairy lights

The scenery is built in JavaScript with **Three.js**, with custom shaders, particles, and bloom post-processing. The soundtrack comes from a **Web Audio synthesiser**: music-box tones, bells, effects, and shared reverb, without recorded samples to download. Native browser modules keep the project free of a build step.

```text
index.html          Page, styles, controls, and module import map
server.js           Small Node.js static server
js/
  main.js           House, calendar dates, saved progress, and mode switching
  days*.js          The 24 scene definitions and scene lifecycle
  doors.js          Door fragments, opening effects, and portal shader
  look.js           Quality tiers, shadows, reflections, grade pass, doorway camera, living windows
  stars.js          Twenty-Four Stars: hidden star-sparks, the constellation, keyhole riddles
  gift.js           Make it a gift: the gift form, and notes packed into the link's #hash
  village.js        My Village: buildings, placement, neighbours, and villagers
  kit.js            Shared 3D scenery, geometry, and effects
  friends.js        The cast of characters
  game.js           Midnight Delivery
  swing.js          George Swings
  carol.js          Carol of the Doors
  band.js           The Friends’ Concert
  audio.js          Active synthesiser and sound engine
  songs.js          Song arrangements and validation
  tunes.js          Melodies and tune names
vendor/three/       Bundled Three.js, post-processing, Reflector and RoundedBoxGeometry modules
sound-test.html     Sound audition page
tests/              Playwright browser tests: selftest, door scenes, gift links, the Play menu
playwright.config.js  Test settings (WebGL on SwiftShader, local server on port 8124)
.github/workflows/  CI: runs the browser tests on every push and pull request
docs/               README animation
```

<details>
<summary><strong>Workshop notes: checking changes</strong></summary>

Run `npm install` once, then `npm test`. Playwright starts the server and runs the built-in selftest, opens several doors, checks a gift link from start to finish, and makes sure the **✦ Play** menu opens, closes and starts a game. GitHub Actions runs the same tests on every push and pull request. Set `PW_CHANNEL=chrome` to use your installed Chrome instead of Playwright's Chromium.

To check by hand, run the local server, then visit [`/?selftest`](http://localhost:8123/?selftest). The built-in browser checks exercise all 24 scenes, validate the songs, run the concert programme, and report captured errors in a `SELFTEST` result on the page.

For focused checks, these helpers are also available in the browser’s developer console after the app loads:

```js
window.__test()        // Render all 24 scenes at several animation times
window.__starTest()    // Check every door's star appears on screen and can be collected
window.__dayPerf(10)   // Average cost of one frame of a door's world, post effects included
window.__carolTest()   // Autoplay all 24 carols at both difficulties
window.__bandTest()    // Check note timing across the 25-song concert programme
window.__gameTest()    // Simulate a delivery run with the autopilot
window.__swingTest()   // Simulate swinging runs across several seeded forests
```

These synchronous helpers can take a moment. Use [`/sound-test.html`](http://localhost:8123/sound-test.html) to audition the sound engine, and manually check mouse and touch interaction when changing controls.

</details>

## A few questions from the doorstep

**Why won’t a door open?** The calendar follows your device’s local date. Ordinary doors unlock during December, up to the current day. Use the Christmas Eve preview if you’re exploring early.

**Where’s the sound?** Browsers require interaction before audio can start. Click or tap the page, check the **♪** toggle, and check your device volume.

**Will my progress follow me to another device?** Progress lives in this browser’s local storage. Another browser or device has its own progress; clearing site data removes the saved state.

**Does everything need an internet connection?** Three.js and the application code are bundled locally. The page requests its display fonts from Google Fonts and falls back to serif fonts if they’re unavailable.

**Can I help decorate?** Absolutely: [report a bug or suggest an idea](https://github.com/ChrisBrooksbank/adventcalendar/issues), or open a pull request. For visual changes, include a screenshot or short recording; for bugs, include your browser, device, and the URL you used so the same date and mode can be reproduced.

### Credits in the closing titles

Built with [Three.js](https://threejs.org/), bundled in `vendor/three/`. The lettering pairs **Mountains of Christmas** with **Cormorant Garamond**, served through Google Fonts. The house, games, and synthesised soundtrack live here in the repository—follow the file map above if you fancy peeking behind the scenery.

---

<div align="center">

*The snow is falling. The lights are on. George has already climbed something.*

**[Come on in. Christmas is behind the next door.](https://chrisbrooksbank.github.io/adventcalendar/)**

</div>
