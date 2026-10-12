# To My Moon 🌙

A five-screen love letter for Suh: tap the moon, then hear a voice note, then a song, then catch seven stars, then open the letter.
It's plain HTML, CSS and JS with no build step.

```
index.html   the five screens
styles.css   colours, fonts, animations
script.js    audio, stars, letter (the reasons are at the top)
favicon.svg
audio/       put your two mp3 files here
```

## 1. Audio

Put your files in `audio/`:

- `audio/background_mix.mp3` is the voice note on screen 2 (your final mix, voice and music together)
- `audio/song.mp3` is the song on screen 3 (only needed once the song screen is switched on, see below)

If your file is `.m4a`, either name it `voice-note.m4a` and change the `src` in `index.html`, or convert it to mp3.

## 2. Fill in the blanks

- **Song screen**: switched off for now. To bring it back, set `SHOW_SONG = true` at the top of `script.js` and add `audio/song.mp3`. The step numbers ("1 / 3" → "1 / 4") and buttons update automatically.
- **Song title**: in `index.html`, search for `[Song title]`.
- **Reasons 3–6**: in `script.js`, edit the `REASONS` list at the top.
- **Remember progress**: `REMEMBER_PROGRESS` in `script.js`. With `false` (the default), every visit starts over from the moon. With `true`, caught stars and the opened letter are saved on her phone.

## 3. Preview locally

Opening `index.html` straight from Finder mostly works, but use a tiny server so audio behaves like it will online:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. Check it in your browser's phone view at 390×844.

Note: Python's simple server doesn't support jumping around in audio, so tapping the waveform may restart the voice note locally. Seeking works normally once it's on Netlify.

## 4. Deploy to Netlify (about 2 minutes)

**Drag and drop (easiest)**
1. Go to https://app.netlify.com/drop and log in.
2. Drag this whole folder onto the page.
3. You get a link like `https://random-name.netlify.app`. Under *Site configuration › Change site name* you can rename it, for example `to-my-moon.netlify.app`.

**Netlify CLI**
```bash
npx netlify-cli deploy --prod --dir .
```

To update later, drag the folder onto the site's *Deploys* tab again.

## Before you send it

- Open the live link on your own phone and tap through all five screens with the sound on.
- Check that both audio files play (an error line appears under the player if a file is missing).
- If you change the files after sending, she may need to refresh to see the update.
