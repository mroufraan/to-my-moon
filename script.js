(() => {
  'use strict';

  /* ==========================================================
     ✏️  Edit me
     ========================================================== */
  const REASONS = [
    'You love the moon so much that I started loving it too.',
    'Your voice at 11:30 at night is the softest part of my day.',
    'You make an ordinary day feel like something worth remembering.',
    'Every conversation with you, even the silly ones, is a memory I keep.',
    'You are so strong, and you still carry the gentlest heart I know.',
    'You treat everyone with such kindness and care. Your manners are beautiful.',
    'In December, Insha Allah, I finally get to hold your hand instead of my phone.',
  ];

  // true = caught stars and the opened letter are remembered between visits.
  // false = every visit replays the whole surprise from the moon.
  const REMEMBER_PROGRESS = false;

  // false = the song screen is skipped (voice note goes straight to the stars).
  // Set to true once audio/song.mp3 and the song title are ready.
  const SHOW_SONG = false;

  /* ========================================================== */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => motionQuery.matches;

  const fmt = (s) => {
    if (!Number.isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  const STAR_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.5c.9 6.1 3.3 8.6 10.5 10.5-7.2 1.9-9.6 4.4-10.5 10.5C11.1 16.4 8.7 13.9 1.5 12 8.7 10.1 11.1 7.6 12 1.5Z"/></svg>';

  /* ---------- Progress storage ---------- */
  const STORE_KEY = 'to-my-moon:v1';
  const loadState = () => {
    const fresh = { caught: [], letterOpen: false };
    if (!REMEMBER_PROGRESS) return fresh;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (!saved) return fresh;
      const caught = Array.isArray(saved.caught)
        ? saved.caught.filter((n, i, arr) => Number.isInteger(n) && n >= 0 && n < REASONS.length && arr.indexOf(n) === i)
        : [];
      return { caught, letterOpen: saved.letterOpen === true };
    } catch {
      return fresh;
    }
  };
  const state = loadState();
  const save = () => {
    if (!REMEMBER_PROGRESS) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  };

  /* ---------- Twinkling sky ---------- */
  function buildSky() {
    const sky = $('.sky');
    const count = Math.min(170, Math.max(70, Math.round((window.innerWidth * window.innerHeight) / 7000)));
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      const gold = Math.random() < 0.35;
      if (gold) s.className = 'g';
      s.style.left = `${(Math.random() * 100).toFixed(2)}%`;
      s.style.top = `${(Math.random() * 100).toFixed(2)}%`;
      s.style.setProperty('--s', `${Math.random() < 0.7 ? 1 : 2}px`);
      s.style.setProperty('--c', gold ? '#F1DDB4' : '#F4E9E4');
      s.style.setProperty('--o', (0.45 + Math.random() * 0.55).toFixed(2));
      s.style.setProperty('--d', `${(2.5 + Math.random() * 4.5).toFixed(2)}s`);
      s.style.setProperty('--delay', `${(-Math.random() * 7).toFixed(2)}s`);
      frag.appendChild(s);
    }
    sky.appendChild(frag);
  }

  /* ---------- Moons: add craters ---------- */
  $$('.moon').forEach((m) => {
    m.insertAdjacentHTML('afterbegin', '<span class="crater"></span>'.repeat(5));
  });

  /* ---------- Song on/off ---------- */
  if (!SHOW_SONG) {
    $('[data-screen="song"]').remove();
    const voiceNext = $('#voiceNext');
    voiceNext.dataset.go = 'stars';
    $('.btn__label', voiceNext).textContent = 'Catch a star';
    $('#starsBack').dataset.go = 'voice';
  }

  /* ---------- Screens ---------- */
  const screens = $$('.screen');
  const screenNamed = (name) => $(`[data-screen="${name}"]`);
  const leaveHooks = {};
  let current = 0;

  // Number the steps ("01 · Voice note", "1 / 3") from whichever screens are present.
  const steps = screens.slice(1);
  steps.forEach((s, i) => {
    $('.topbar__name', s).textContent = `${String(i + 1).padStart(2, '0')} · ${s.dataset.title}`;
    $('.topbar__count', s).textContent = `${i + 1} / ${steps.length}`;
  });

  function go(target) {
    const index = typeof target === 'number' ? target : screens.indexOf(screenNamed(target));
    if (index === current || !screens[index]) return;
    const from = screens[current];
    const to = screens[index];
    if (leaveHooks[from.dataset.screen]) leaveHooks[from.dataset.screen]();

    from.classList.remove('active');
    from.classList.add('leaving');
    from.setAttribute('aria-hidden', 'true');
    from.inert = true;
    setTimeout(() => from.classList.remove('leaving'), 420);

    to.classList.remove('leaving');
    to.scrollTop = 0;
    to.inert = false;
    to.removeAttribute('aria-hidden');
    to.classList.add('active');
    current = index;

    const heading = $('[data-focus]', to);
    if (heading) heading.focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]');
    if (t) go(t.dataset.go);
  });

  /* ---------- Audio ---------- */
  const voice = $('#voiceAudio');
  const song = $('#songAudio');
  const audios = [voice, song].filter(Boolean);
  let primed = false;

  // Runs inside the first tap: starts preloading both files and "unlocks"
  // each element on iOS with a silent play/pause.
  function primeAudio() {
    if (primed) return;
    primed = true;
    audios.forEach((a) => {
      a.preload = 'auto';
      a.muted = true;
      a._priming = true;
      const finish = () => {
        a._priming = false;
        if (a._userWants) { a.muted = false; return; }
        a.pause();
        try { a.currentTime = 0; } catch { /* not seekable yet */ }
        a.muted = false;
      };
      let p;
      try { p = a.play(); } catch { p = null; }
      if (p && typeof p.then === 'function') p.then(finish, finish);
      else finish();
    });
  }

  function createPlayer(audio, { button, label, errorEl, onProgress, onPlayState }) {
    let raf = 0;
    const update = () => onProgress(audio.currentTime, audio.duration);
    const tick = () => { update(); raf = requestAnimationFrame(tick); };

    const setPlaying = (playing) => {
      button.classList.toggle('is-playing', playing);
      button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${label}`);
      if (onPlayState) onPlayState(playing);
      cancelAnimationFrame(raf);
      if (playing) raf = requestAnimationFrame(tick);
      update();
    };

    audio.addEventListener('play', () => {
      if (audio._priming && !audio._userWants) return;
      audios.forEach((other) => { if (other !== audio) other.pause(); });
      setPlaying(true);
    });
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('durationchange', update);
    audio.addEventListener('error', () => { errorEl.hidden = false; });

    button.addEventListener('click', () => {
      if (!audio.paused && !audio._priming) { audio.pause(); return; }
      audio._userWants = true;
      audio.muted = false;
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err) => { if (err && err.name === 'NotSupportedError') errorEl.hidden = false; });
      }
    });

    const seek = (ratio) => {
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      audio.currentTime = Math.min(d, Math.max(0, ratio * d));
      update();
    };

    return { audio, seek, pause: () => audio.pause() };
  }

  function bindSeek(el, player) {
    const ratioAt = (x) => {
      const r = el.getBoundingClientRect();
      return Math.min(1, Math.max(0, (x - r.left) / r.width));
    };
    let dragging = false;
    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      player.seek(ratioAt(e.clientX));
    });
    el.addEventListener('pointermove', (e) => { if (dragging) player.seek(ratioAt(e.clientX)); });
    el.addEventListener('pointerup', () => { dragging = false; });
    el.addEventListener('pointercancel', () => { dragging = false; });
    el.addEventListener('keydown', (e) => {
      const a = player.audio;
      const d = a.duration;
      if (!Number.isFinite(d)) return;
      let t = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t = a.currentTime + 5;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t = a.currentTime - 5;
      else if (e.key === 'Home') t = 0;
      else if (e.key === 'End') t = d;
      if (t === null) return;
      e.preventDefault();
      player.seek(t / d);
    });
  }

  const setSlider = (el, cur, dur) => {
    const pct = Number.isFinite(dur) && dur > 0 ? Math.round((cur / dur) * 100) : 0;
    el.setAttribute('aria-valuenow', String(pct));
    el.setAttribute('aria-valuetext', `${fmt(cur)} of ${fmt(dur)}`);
  };

  /* Voice note + waveform */
  const BAR_COUNT = 34;
  const wave = $('#wave');
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const edge = Math.sin((Math.PI * (i + 0.5)) / BAR_COUNT); // softer at the ends
    const h = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.31) * Math.cos(i * 0.47 + 1)) * (0.55 + 0.45 * edge);
    const bar = document.createElement('span');
    bar.className = 'wave__bar';
    bar.style.height = `${Math.round(8 + h * 40)}px`;
    wave.appendChild(bar);
    return bar;
  });
  const voiceTime = $('#voiceTime');
  const voiceHint = $('#voiceHint');

  const voicePlayer = createPlayer(voice, {
    button: $('#voiceBtn'),
    label: 'voice note',
    errorEl: $('#voiceErr'),
    onProgress(cur, dur) {
      const ratio = Number.isFinite(dur) && dur > 0 ? cur / dur : 0;
      const filled = ratio * BAR_COUNT;
      bars.forEach((b, i) => b.classList.toggle('is-played', i < filled));
      voiceTime.textContent = `${fmt(cur)} / ${fmt(dur)}`;
      setSlider(wave, cur, dur);
    },
    onPlayState(playing) {
      voiceHint.classList.toggle('is-quiet', playing);
      voiceHint.textContent = playing ? 'Tap the moon to pause'
        : voice.ended ? 'Tap the moon to listen again'
        : voice.currentTime > 0.5 ? 'Tap the moon to keep listening'
        : 'Tap the moon to listen';
    },
  });
  bindSeek(wave, voicePlayer);
  leaveHooks.voice = voicePlayer.pause;

  /* Song */
  if (SHOW_SONG) {
    const songFill = $('#songFill');
    const songCur = $('#songCur');
    const songDur = $('#songDur');
    const songProgress = $('#songProgress');
    const record = $('#record');

    const songPlayer = createPlayer(song, {
      button: $('#songBtn'),
      label: 'song',
      errorEl: $('#songErr'),
      onProgress(cur, dur) {
        const ratio = Number.isFinite(dur) && dur > 0 ? cur / dur : 0;
        songFill.style.transform = `scaleX(${ratio})`;
        songCur.textContent = fmt(cur);
        songDur.textContent = fmt(dur);
        setSlider(songProgress, cur, dur);
      },
      onPlayState(playing) { record.classList.toggle('is-spinning', playing); },
    });
    bindSeek(songProgress, songPlayer);
    leaveHooks.song = songPlayer.pause;
  }

  /* ---------- Screen 1: the moon ---------- */
  const moonBtn = $('#moonBtn');
  let moonBusy = false;
  moonBtn.addEventListener('click', () => {
    if (moonBusy) return;
    primeAudio(); // must stay inside the tap for iOS
    if (reducedMotion()) { go('voice'); return; }
    moonBusy = true;
    moonBtn.classList.add('is-tapped');
    screens[0].classList.add('is-departing');
    setTimeout(() => {
      go('voice');
      // reset once the landing screen has faded out
      setTimeout(() => {
        moonBtn.classList.remove('is-tapped');
        screens[0].classList.remove('is-departing');
        moonBusy = false;
      }, 450);
    }, 900);
  });

  /* ---------- Screen 4: catch a star ---------- */
  // Balanced 2-3-2 layout, numbered in reading order (x/y are % of the sky area).
  const STARS = [
    { x: 24, y: 14, s: 28 },
    { x: 74, y: 18, s: 30 },
    { x: 14, y: 48, s: 26 },
    { x: 50, y: 44, s: 38 },
    { x: 86, y: 50, s: 28 },
    { x: 28, y: 82, s: 32 },
    { x: 70, y: 84, s: 34 },
  ];
  const starSky = $('#starSky');
  const starSub = $('#starSub');
  const card = $('#reasonCard');
  const reasonNum = $('#reasonNum');
  const reasonText = $('#reasonText');
  let swapTimer = 0;

  const starBtns = STARS.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'star-btn';
    b.style.left = `${p.x}%`;
    b.style.top = `${p.y}%`;
    b.style.setProperty('--size', `${p.s}px`);
    b.style.setProperty('--delay', `${(-i * 0.7).toFixed(1)}s`);
    b.setAttribute('aria-label', `Star ${i + 1}, not caught yet`);
    b.innerHTML = `${STAR_SVG}<span class="star-btn__num" aria-hidden="true">${i + 1}</span>`;
    b.addEventListener('click', () => catchStar(i));
    starSky.appendChild(b);
    return b;
  });

  // Star N always holds reason N.
  function markCaught(i) {
    starBtns[i].classList.add('is-caught');
    starBtns[i].setAttribute('aria-label', `Star ${i + 1}, caught`);
  }

  // Gently highlight the lowest-numbered star still waiting.
  function updateNext() {
    const next = starBtns.findIndex((_, i) => !state.caught.includes(i));
    starBtns.forEach((b, i) => b.classList.toggle('is-next', i === next));
  }

  function showReason(n, animate) {
    const apply = () => {
      reasonNum.textContent = `Reason no. ${n + 1}`;
      reasonText.textContent = REASONS[n];
    };
    clearTimeout(swapTimer);
    if (!animate || reducedMotion()) { apply(); card.classList.remove('is-swapping'); return; }
    card.classList.add('is-swapping');
    swapTimer = setTimeout(() => { apply(); card.classList.remove('is-swapping'); }, 200);
  }

  function updateCount() {
    const n = state.caught.length;
    starSub.textContent = n === STARS.length
      ? `All ${STARS.length} caught. Every one of them is true.`
      : `Tap them all. ${n} of ${STARS.length} caught.`;
  }

  function burst(btn) {
    if (reducedMotion()) return;
    const b = document.createElement('span');
    b.className = 'burst';
    b.style.left = btn.style.left;
    b.style.top = btn.style.top;
    for (let k = 0; k < 10; k++) {
      const dot = document.createElement('i');
      dot.style.setProperty('--a', `${k * 36 + Math.random() * 14}deg`);
      dot.style.setProperty('--r', `${26 + Math.random() * 20}px`);
      b.appendChild(dot);
    }
    starSky.appendChild(b);
    setTimeout(() => b.remove(), 800);
  }

  function shower() {
    if (reducedMotion()) return;
    const layer = document.createElement('div');
    layer.className = 'shower';
    layer.setAttribute('aria-hidden', 'true');
    for (let k = 0; k < 28; k++) {
      const s = document.createElement('span');
      s.className = 'fall';
      s.style.left = `${(Math.random() * 100).toFixed(1)}%`;
      s.style.setProperty('--size', `${(8 + Math.random() * 10).toFixed(0)}px`);
      s.style.setProperty('--dur', `${(1.6 + Math.random() * 1.3).toFixed(2)}s`);
      s.style.setProperty('--delay', `${(Math.random() * 0.9).toFixed(2)}s`);
      s.style.setProperty('--drift', `${(Math.random() * 80 - 40).toFixed(0)}px`);
      s.innerHTML = STAR_SVG;
      layer.appendChild(s);
    }
    screenNamed('stars').appendChild(layer);
    setTimeout(() => layer.remove(), 4200);
  }

  function catchStar(i) {
    const fresh = !state.caught.includes(i);
    if (fresh) {
      state.caught.push(i);
      save();
      burst(starBtns[i]);
    }
    markCaught(i);
    showReason(i, true);
    updateCount();
    updateNext();
    if (fresh && state.caught.length === STARS.length) setTimeout(shower, 350);
  }

  state.caught.forEach(markCaught);
  if (state.caught.length) showReason(state.caught[state.caught.length - 1], false);
  updateCount();
  updateNext();

  /* ---------- Screen 5: the letter ---------- */
  const phaseSvg = (kind, flip) => {
    let lit = '';
    if (kind === 'crescent') lit = '<path d="M7 1.4A5.6 5.6 0 0 1 7 12.6 3 5.6 0 0 0 7 1.4Z"/>';
    if (kind === 'half') lit = '<path d="M7 1.4A5.6 5.6 0 0 1 7 12.6Z"/>';
    if (kind === 'full') lit = '<circle cx="7" cy="7" r="5.6"/>';
    return `<svg viewBox="0 0 14 14"${flip ? ' style="transform:scaleX(-1)"' : ''}>` +
      '<circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" stroke-width=".9"/>' +
      `<g fill="currentColor">${lit}</g></svg>`;
  };
  $('#phases').innerHTML = [
    phaseSvg('new'), phaseSvg('crescent'), phaseSvg('half'), phaseSvg('full'),
    phaseSvg('half', true), phaseSvg('crescent', true), phaseSvg('new'),
  ].join('');

  const sealed = $('#sealed');
  const letter = $('#letter');
  const backToMoon = $('#backToMoon');
  let opening = false;

  function revealLetter() {
    sealed.hidden = true;
    letter.hidden = false;
    backToMoon.hidden = false;
    $('.letter__inner', letter).scrollTop = 0;
  }

  $('#breakSeal').addEventListener('click', () => {
    if (opening) return;
    opening = true;
    state.letterOpen = true;
    save();
    const done = () => {
      revealLetter();
      $('#letterTitle').focus({ preventScroll: true });
    };
    if (reducedMotion()) { done(); return; }
    sealed.classList.add('is-opening');
    setTimeout(done, 1650);
  });

  if (state.letterOpen) { opening = true; revealLetter(); }

  buildSky();
})();
