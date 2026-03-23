/* ═══════════════════════════════════════════════════════════
   SERENITY — serenity.js
   All JS in one IIFE so nothing leaks to global scope.
   Functions called from HTML onclick are exposed via window.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── UTILS ─── */
  function qs(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function objVals(o) { return Object.keys(o).map(function (k) { return o[k]; }); }
  function nowTime() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }

  /* ─── STAR FIELD ─── */
  (function () {
    var sf = qs('starField'); if (!sf) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    var count = window.innerWidth < 600 ? 30 : 55;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var s = document.createElement('div'); s.className = 'star';
      var sz = (Math.random() * 1.8 + 0.8) + 'px';
      s.style.cssText = 'width:' + sz + ';height:' + sz + ';top:' + (Math.random() * 100) + '%;left:' + (Math.random() * 100) + '%;--dur:' + (2.5 + Math.random() * 3.5) + 's;--delay:' + (-Math.random() * 4) + 's;';
      frag.appendChild(s);
    }
    sf.appendChild(frag);
  })();

  /* ─── TOAST ─── */
  var _toastT = null;
  function showToast(msg) {
    var t = qs('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    if (_toastT) clearTimeout(_toastT);
    _toastT = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  /* ─── DAILY AFFIRMATIONS ─── */
  var affirmations = [
    'I am worthy of love, peace, and healing.',
    'My feelings are valid. I am allowed to feel everything I feel.',
    'Every step forward, no matter how small, is progress.',
    'I choose to be gentle with myself today.',
    'I am not defined by my hardest days.',
    'Healing happens slowly, and that is perfectly okay.',
    'I deserve rest without guilt.',
    'I am enough, exactly as I am right now.',
    'My struggles do not make me weak, they make me human.',
    'Today I choose to give myself the compassion I give to others.',
    'I am allowed to start over as many times as I need.',
    'My presence in this world matters.',
    'It is brave to keep going, even on difficult days.',
    'I release what I cannot control and breathe into what I can.',
    'I am grateful for my body and all it carries me through.'
  ];
  var _affDate = load('s_aff_date', '');
  var _affIdx  = load('s_aff_idx', 0);
  function getDailyAff() {
    var today = new Date().toDateString();
    if (_affDate !== today) {
      _affIdx = Math.floor(Math.random() * affirmations.length);
      save('s_aff_date', today); save('s_aff_idx', _affIdx); _affDate = today;
    }
    return affirmations[Math.max(0, Math.min(_affIdx, affirmations.length - 1))];
  }
  window.refreshAffirmation = function () {
    _affIdx = (_affIdx + 1) % affirmations.length;
    save('s_aff_idx', _affIdx);
    var el = qs('affText'); if (el) el.textContent = affirmations[_affIdx];
  };
  var _affEl = qs('affText'); if (_affEl) _affEl.textContent = getDailyAff();

  /* ─── MOOD ─── */
  var moodMessages = {
    Happy: 'What a lovely feeling! Savour this warmth \u2014 you\u2019ve earned it. \uD83C\uDF38',
    Sad: 'It\u2019s okay to feel sad. Your feelings are real and valid. Be gentle with yourself today. \uD83D\uDC9C',
    Anxious: 'Anxiety is hard. Try the breathing exercise below \u2014 it really helps. You\u2019re safe right now. \uD83C\uDF3F',
    Frustrated: 'Frustration means you care. Take a breath, maybe write it out. \uD83C\uDF19',
    Numb: 'Feeling numb is exhausting too. You don\u2019t have to feel anything specific right now. Rest is okay. \uD83E\uDD0D',
    Tired: 'Rest is not laziness \u2014 it\u2019s healing. Give yourself permission to slow down today. \uD83C\uDF19',
    Lonely: 'Loneliness is so painful. You are not invisible. You matter deeply. \uD83D\uDC9C',
    Hopeful: 'Hope is a brave thing. Hold onto it \u2014 it\u2019s the beginning of everything good. \u2728'
  };
  var moodLog = load('s_mood', []); if (!Array.isArray(moodLog)) moodLog = [];

  window.selectMood = function (card, label, emoji, score) {
    document.querySelectorAll('.mood-card').forEach(function (c) { c.classList.remove('active'); });
    card.classList.add('active');
    var el = qs('moodResponse'); if (!el) return;
    el.style.opacity = '0';
    setTimeout(function () { el.textContent = moodMessages[label] || ''; el.style.opacity = '1'; }, 300);
    var today = new Date().toDateString(), idx = -1;
    for (var i = 0; i < moodLog.length; i++) { if (moodLog[i].date === today) { idx = i; break; } }
    var entry = { date: today, label: label, emoji: emoji, score: score };
    if (idx >= 0) moodLog[idx] = entry; else moodLog.push(entry);
    if (moodLog.length > 30) moodLog = moodLog.slice(-30);
    save('s_mood', moodLog);
    renderMoodChart(); checkBadges(); showToast('Mood logged \uD83D\uDCCA');
  };

  function renderMoodChart() {
    var container = qs('moodChartBars'); if (!container) return;
    container.innerHTML = '';
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var now = new Date(), last7 = [];
    for (var i = 6; i >= 0; i--) { var d = new Date(now); d.setDate(d.getDate() - i); last7.push(d.toDateString()); }
    if (!moodLog.length) {
      var nm = document.createElement('div'); nm.className = 'no-data-msg'; nm.style.cssText = 'width:100%;align-self:center;';
      nm.textContent = 'Log your mood above to see your chart here \u2728'; container.appendChild(nm); return;
    }
    last7.forEach(function (ds) {
      var entry = null;
      for (var j = 0; j < moodLog.length; j++) { if (moodLog[j].date === ds) { entry = moodLog[j]; break; } }
      var col = document.createElement('div'); col.className = 'bar-col';
      var d = new Date(ds), dayName = days[d.getDay()];
      var bar = document.createElement('div'); bar.className = 'bar-fill';
      var score = entry ? entry.score : 0, pct = Math.round((score / 5) * 100);
      if (!score) { bar.style.cssText = 'background:#2E2550;height:6px;'; }
      else if (score >= 4) { bar.style.cssText = 'background:#4ECDC4;height:' + pct + '%;'; }
      else if (score >= 3) { bar.style.cssText = 'background:#7C4DFF;height:' + pct + '%;'; }
      else { bar.style.cssText = 'background:#FF6B9D;height:' + pct + '%;'; }
      bar.title = entry ? (entry.label + ' \u2014 ' + dayName) : 'No mood logged';
      var emojiEl = document.createElement('div'); emojiEl.className = 'bar-emoji'; emojiEl.textContent = entry ? entry.emoji : '\u00b7';
      var labelEl = document.createElement('div'); labelEl.className = 'bar-label'; labelEl.textContent = dayName;
      col.appendChild(bar); col.appendChild(emojiEl); col.appendChild(labelEl); container.appendChild(col);
    });
  }
  renderMoodChart();

  /* ─── JOURNAL ─── */
  var entries = load('s_journal', []); if (!Array.isArray(entries)) entries = [];
  var _editingId = null, _deletingId = null, _clearAllPending = false;

  window.updateCount = function () {
    var el = qs('journalText'); if (!el) return;
    var w = el.value.trim() ? el.value.trim().split(/\s+/).filter(Boolean).length : 0;
    var cc = qs('charCount'); if (cc) cc.textContent = w + (w === 1 ? ' word' : ' words');
  };
  window.usePrompt = function (el) {
    var strong = el.querySelector('strong');
    var text = el.textContent.replace(strong ? strong.textContent : '', '').trim().replace(/^["\u201C]|["\u201D]$/g, '');
    var ta = qs('journalText'); if (!ta) return;
    ta.value = text + '\n\n'; ta.focus(); window.updateCount();
  };
  window.saveEntry = function () {
    var ta = qs('journalText'); if (!ta) return;
    var text = ta.value.trim();
    if (!text) { showToast('Please write something first \u2726'); return; }
    entries.unshift({ id: Date.now(), text: text, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) });
    if (entries.length > 30) entries.length = 30;
    save('s_journal', entries); ta.value = ''; window.updateCount(); renderEntries(); checkBadges(); showToast('\u2728 Entry saved');
  };

  function renderEntries() {
    var c = qs('savedEntries'); if (!c) return; c.innerHTML = '';
    if (!entries.length) {
      var e = document.createElement('p'); e.style.cssText = 'font-size:.82rem;color:#4A4268;font-style:italic;';
      e.textContent = 'No entries yet. Write your first one above \u2728'; c.appendChild(e); return;
    }
    var hdr = document.createElement('div'); hdr.className = 'entries-header';
    var cnt = document.createElement('span'); cnt.className = 'entries-count'; cnt.textContent = entries.length + ' saved entr' + (entries.length === 1 ? 'y' : 'ies');
    var cab = document.createElement('button'); cab.className = 'clear-all-btn'; cab.textContent = 'Clear all';
    cab.addEventListener('click', function () { window.openConfirmModal(null, true); });
    hdr.appendChild(cnt); hdr.appendChild(cab); c.appendChild(hdr);
    entries.slice(0, 6).forEach(function (e) {
      var card = document.createElement('div'); card.className = 'entry-card';
      var top = document.createElement('div'); top.className = 'entry-card-top';
      var txt = document.createElement('div'); txt.className = 'entry-card-text collapsed'; txt.textContent = e.text;
      var acts = document.createElement('div'); acts.className = 'entry-card-actions';
      var eb = document.createElement('button'); eb.className = 'entry-action-btn'; eb.title = 'Edit'; eb.setAttribute('aria-label', 'Edit entry'); eb.textContent = '\u270F\uFE0F';
      eb.addEventListener('click', (function (id) { return function () { window.openEditModal(id); }; })(e.id));
      var db = document.createElement('button'); db.className = 'entry-action-btn del'; db.title = 'Delete'; db.setAttribute('aria-label', 'Delete entry'); db.textContent = '\uD83D\uDDD1\uFE0F';
      db.addEventListener('click', (function (id) { return function () { window.openConfirmModal(id, false); }; })(e.id));
      acts.appendChild(eb); acts.appendChild(db); top.appendChild(txt); top.appendChild(acts);
      var meta = document.createElement('div'); meta.className = 'entry-card-meta';
      var de = document.createElement('span'); de.className = 'entry-date'; de.textContent = e.date + (e.edited ? ' \u00b7 edited' : '');
      var isLong = e.text.length > 120;
      var expB = document.createElement('button'); expB.className = 'entry-expand-btn'; expB.style.visibility = isLong ? 'visible' : 'hidden'; expB.textContent = 'Read more'; var expanded = false;
      expB.addEventListener('click', function () { expanded = !expanded; txt.classList.toggle('collapsed', !expanded); expB.textContent = expanded ? 'Show less' : 'Read more'; });
      meta.appendChild(de); meta.appendChild(expB); card.appendChild(top); card.appendChild(meta); c.appendChild(card);
    });
  }

  window.openEditModal = function (id) {
    var entry = null; for (var i = 0; i < entries.length; i++) { if (entries[i].id === id) { entry = entries[i]; break; } }
    if (!entry) return; _editingId = id;
    var dd = qs('editModalDate'); if (dd) dd.textContent = entry.date;
    var dt = qs('editModalText'); if (dt) dt.value = entry.text;
    var m = qs('editModal'); if (!m) return; m.classList.add('open'); m.removeAttribute('aria-hidden');
    setTimeout(function () { var dt2 = qs('editModalText'); if (dt2) dt2.focus(); }, 60);
  };
  window.closeEditModal = function () { var m = qs('editModal'); if (!m) return; m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); _editingId = null; };
  window.saveEditModal = function () {
    var dt = qs('editModalText'); if (!dt) return;
    var nt = dt.value.trim(); if (!nt) { showToast('Cannot be empty'); return; }
    for (var i = 0; i < entries.length; i++) { if (entries[i].id === _editingId) { entries[i].text = nt; entries[i].edited = true; break; } }
    save('s_journal', entries); renderEntries(); showToast('\u270F\uFE0F Entry updated'); window.closeEditModal();
  };
  window.openConfirmModal = function (id, isAll) {
    _clearAllPending = !!isAll; _deletingId = isAll ? null : id;
    var ct = qs('confirmTitle'); if (ct) ct.textContent = isAll ? 'Clear all entries?' : 'Delete this entry?';
    var cm = qs('confirmMsg'); if (cm) cm.textContent = isAll ? 'All entries will be permanently deleted.' : 'This feeling will be permanently removed.';
    var m = qs('confirmModal'); if (!m) return; m.classList.add('open'); m.removeAttribute('aria-hidden');
  };
  window.closeConfirmModal = function () { var m = qs('confirmModal'); if (!m) return; m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); _deletingId = null; _clearAllPending = false; };

  var cyb = qs('confirmYesBtn');
  if (cyb) {
    cyb.addEventListener('click', function () {
      if (_clearAllPending) { entries.length = 0; save('s_journal', entries); renderEntries(); showToast('\uD83D\uDDD1\uFE0F All entries cleared'); }
      else if (_deletingId !== null) { entries = entries.filter(function (e) { return e.id !== _deletingId; }); save('s_journal', entries); renderEntries(); showToast('\uD83D\uDDD1\uFE0F Entry deleted'); }
      window.closeConfirmModal();
    });
  }
  var em = qs('editModal'); if (em) em.addEventListener('click', function (ev) { if (ev.target === this) window.closeEditModal(); });
  var cfm = qs('confirmModal'); if (cfm) cfm.addEventListener('click', function (ev) { if (ev.target === this) window.closeConfirmModal(); });
  renderEntries();

  /* ─── BREATHING ─── */
  var breathRunning = false, breathInterval = null, breathTimeout = null;
  var breathPhaseIdx = 0, breathCount = 0, cyclesDone = 0;
  var breathPhases = [
    { name: 'Inhale', dur: 4, instr: 'Breathe in slowly through your nose\u2026' },
    { name: 'Hold',   dur: 4, instr: 'Hold gently \u2014 feel the stillness\u2026' },
    { name: 'Exhale', dur: 4, instr: 'Release slowly through your mouth\u2026' },
    { name: 'Hold',   dur: 4, instr: 'Rest in the space between breaths\u2026' }
  ];
  window.startBreathing = function () {
    if (breathRunning) return; breathRunning = true;
    var bc = qs('breathContainer'); if (bc) bc.classList.add('breathing-active');
    runBreathPhase();
  };
  function runBreathPhase() {
    if (!breathRunning) return;
    var p = breathPhases[breathPhaseIdx];
    var bp = qs('breathPhase'); if (bp) bp.textContent = p.name;
    var bi = qs('breathInstr'); if (bi) bi.textContent = p.instr;
    var bcirc = qs('breathCircle'); if (bcirc) bcirc.innerHTML = '<div class="breath-circle-text">' + p.name + '</div>';
    breathCount = p.dur;
    var bcnt = qs('breathCount'); if (bcnt) bcnt.textContent = breathCount;
    breathInterval = setInterval(function () {
      if (!breathRunning) { clearInterval(breathInterval); breathInterval = null; return; }
      breathCount--;
      var bcnt2 = qs('breathCount'); if (bcnt2) bcnt2.textContent = breathCount;
      if (breathCount <= 0) {
        clearInterval(breathInterval); breathInterval = null;
        breathPhaseIdx = (breathPhaseIdx + 1) % 4;
        if (breathPhaseIdx === 0) { cyclesDone++; var cc2 = qs('cycleCount'); if (cc2) cc2.textContent = cyclesDone; checkBadges(); }
        breathTimeout = setTimeout(runBreathPhase, 500);
      }
    }, 1000);
  }
  window.stopBreathing = function () {
    breathRunning = false;
    if (breathInterval) { clearInterval(breathInterval); breathInterval = null; }
    if (breathTimeout) { clearTimeout(breathTimeout); breathTimeout = null; }
    var bc = qs('breathContainer'); if (bc) bc.classList.remove('breathing-active');
    var bp = qs('breathPhase'); if (bp) bp.textContent = 'Paused';
    var bcnt = qs('breathCount'); if (bcnt) bcnt.textContent = '\u2014';
    var bi = qs('breathInstr'); if (bi) bi.textContent = "Press Start whenever you're ready";
    var bcirc = qs('breathCircle'); if (bcirc) bcirc.innerHTML = '<div class="breath-circle-text">Click<br>to Start</div>';
    breathPhaseIdx = 0;
  };
  var _bc = qs('breathCircle');
  if (_bc) {
    _bc.addEventListener('click', window.startBreathing);
    _bc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.startBreathing(); } });
  }

  /* ─── GUIDED MEDITATION ─── */
  var medDuration = 5 * 60, medRemaining = 5 * 60, medRunning = false, medTimer = null;
  var medPhases = [
    { at: 1.0,  text: 'Find a comfortable position and close your eyes\u2026' },
    { at: 0.85, text: 'Take a slow, deep breath in through your nose\u2026' },
    { at: 0.7,  text: 'Let your body soften. Release any tension\u2026' },
    { at: 0.55, text: 'Breathe naturally. You are safe and at peace\u2026' },
    { at: 0.4,  text: 'If thoughts arise, gently let them float away\u2026' },
    { at: 0.25, text: 'Stay with the stillness. You are doing beautifully\u2026' },
    { at: 0.1,  text: 'Gently bring your awareness back\u2026' },
    { at: 0.02, text: 'Well done. Take a final deep breath and open your eyes.' }
  ];
  window.selectMed = function (card, mins, icon, title, duration, desc) {
    document.querySelectorAll('.med-card').forEach(function (c) { c.classList.remove('active-med'); });
    card.classList.add('active-med');
    medDuration = mins * 60; medRemaining = medDuration; medRunning = false;
    if (medTimer) { clearInterval(medTimer); medTimer = null; }
    var pt = qs('medPlayerTitle'); if (pt) pt.textContent = icon + ' ' + title;
    var ps = qs('medPlayerSub'); if (ps) ps.textContent = duration + ' \u00b7 ' + desc;
    var pb = qs('medPlayBtn'); if (pb) pb.textContent = '\u25B6 Play';
    var pph = qs('medPhaseText'); if (pph) pph.textContent = 'Press play to begin';
    var ptl = qs('medTimeLabel'); if (ptl) ptl.textContent = 'remaining';
    updateMedDisplay();
    var pl = qs('medPlayer'); if (pl) { pl.classList.add('visible'); pl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  };
  function updateMedDisplay() {
    var m = Math.floor(medRemaining / 60), s = medRemaining % 60;
    var tn = qs('medTimeNum'); if (tn) tn.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    var circ = 2 * Math.PI * 68, pct = medRemaining / medDuration;
    var rf = qs('medRingFill'); if (rf) { rf.style.strokeDasharray = circ; rf.style.strokeDashoffset = circ * (1 - pct); }
    var prog = 1 - (medRemaining / medDuration);
    for (var i = 0; i < medPhases.length; i++) {
      if (prog >= 1 - medPhases[i].at) { var mpT = qs('medPhaseText'); if (mpT) mpT.textContent = medPhases[i].text; break; }
    }
  }
  window.toggleMed = function () {
    var pb = qs('medPlayBtn');
    if (!medRunning) {
      medRunning = true; if (pb) pb.textContent = '\u23F8 Pause';
      medTimer = setInterval(function () {
        if (medRemaining <= 0) {
          clearInterval(medTimer); medTimer = null; medRunning = false;
          if (pb) pb.textContent = '\u25B6 Play';
          var mpT = qs('medPhaseText'); if (mpT) mpT.textContent = '\u2728 Session complete. Beautiful work.';
          var ptl = qs('medTimeLabel'); if (ptl) ptl.textContent = 'complete';
          save('s_med_done', true); checkBadges(); showToast('\uD83E\uDDD8 Meditation complete!'); return;
        }
        medRemaining--; updateMedDisplay();
      }, 1000);
    } else {
      medRunning = false; if (medTimer) { clearInterval(medTimer); medTimer = null; }
      if (pb) pb.textContent = '\u25B6 Play';
    }
  };
  window.resetMed = function () {
    medRunning = false; if (medTimer) { clearInterval(medTimer); medTimer = null; }
    medRemaining = medDuration;
    var pb = qs('medPlayBtn'); if (pb) pb.textContent = '\u25B6 Play';
    var mpT = qs('medPhaseText'); if (mpT) mpT.textContent = 'Press play to begin';
    var ptl = qs('medTimeLabel'); if (ptl) ptl.textContent = 'remaining';
    updateMedDisplay();
  };

  /* ─── QUOTES ─── */
  var quotes = [
    { text: "You don\u2019t have to be positive all the time. It\u2019s perfectly okay to feel sad, angry, frustrated, scared or any other emotion.", author: "Sidhant Rastogi", img: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=160&h=160&fit=crop" },
    { text: "Even the darkest night will end and the sun will rise.", author: "Amit Singh", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=160&h=160&fit=crop" },
    { text: "You are allowed to be both a masterpiece and a work in progress simultaneously.", author: "dhruv tripathi", img: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=160&h=160&fit=crop" },
    { text: "Be gentle with yourself. You are a child of the universe, no less than the trees and the stars.", author: "dev roy", img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=160&h=160&fit=crop" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Nishant rastogi", img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=160&h=160&fit=crop" },
    { text: "Your present circumstances don\u2019t determine where you can go, they merely determine where you start.", author: "mr. gupta", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop" },
    { text: "Healing takes time, and asking for help is a courageous step.", author: "Kripanshu ", img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=160&h=160&fit=crop" }
  ];
  var currentQ = 0, qTimer = null;
  function showQuote(i) {
    currentQ = ((i % quotes.length) + quotes.length) % quotes.length;
    var q = quotes[currentQ];
    var card = qs('quoteCard'); if (!card) return;
    card.style.opacity = '0'; card.style.transform = 'translateY(10px)';
    setTimeout(function () {
      var qt = qs('quoteText'); if (qt) qt.textContent = q.text;
      var qa = qs('quoteAuthor'); if (qa) qa.textContent = '\u2014 ' + q.author;
      var qi = qs('quoteImg'); if (qi) { qi.src = q.img; qi.alt = 'Quote by ' + q.author; }
      card.style.transition = 'opacity .4s,transform .4s'; card.style.opacity = '1'; card.style.transform = 'translateY(0)';
    }, 200);
    document.querySelectorAll('.quote-dot').forEach(function (d, idx) { d.classList.toggle('active', idx === currentQ); });
  }
  function resetQTimer() { if (qTimer) clearInterval(qTimer); qTimer = setInterval(function () { showQuote(currentQ + 1); }, 8000); }
  window.nextQuote = function () { resetQTimer(); showQuote(currentQ + 1); };
  window.prevQuote = function () { resetQTimer(); showQuote(currentQ - 1); };
  var dotsEl = qs('quoteDots');
  if (dotsEl) {
    quotes.forEach(function (_, i) {
      var d = document.createElement('button'); d.className = 'quote-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Quote ' + (i + 1));
      d.addEventListener('click', function () { resetQTimer(); showQuote(i); });
      dotsEl.appendChild(d);
    });
  }
  showQuote(0); resetQTimer();

  /* ─── SLEEP & GRATITUDE ─── */
  var sleepRating = 0;
  var sleepLogs = load('s_sleep', []); if (!Array.isArray(sleepLogs)) sleepLogs = [];
  var sleepLabels = ['', '\uD83D\uDE29 Very poor', '\uD83D\uDE14 Poor', '\uD83D\uDE10 Okay', '\uD83D\uDE0A Good', '\uD83D\uDE04 Excellent!'];
  window.rateSleep = function (n) {
    sleepRating = n;
    document.querySelectorAll('.star-btn').forEach(function (btn, i) { btn.classList.toggle('lit', i < n); });
    var sl = qs('sleepRatingLabel'); if (sl) sl.textContent = sleepLabels[n] || '';
  };
  window.saveLog = function () {
    var g1 = (qs('grat1') || {}).value || '';
    var g2 = (qs('grat2') || {}).value || '';
    var g3 = (qs('grat3') || {}).value || '';
    g1 = g1.trim(); g2 = g2.trim(); g3 = g3.trim();
    if (!sleepRating && !g1 && !g2 && !g3) { showToast('Rate your sleep or add a gratitude \uD83C\uDF19'); return; }
    var today = new Date().toDateString(), idx = -1;
    for (var i = 0; i < sleepLogs.length; i++) { if (sleepLogs[i].date === today) { idx = i; break; } }
    var entry = { date: today, sleep: sleepRating, gratitude: [g1, g2, g3].filter(Boolean) };
    if (idx >= 0) sleepLogs[idx] = entry; else sleepLogs.unshift(entry);
    if (sleepLogs.length > 14) sleepLogs.length = 14;
    save('s_sleep', sleepLogs); renderSleepHistory(); checkBadges(); showToast('\uD83C\uDF19 Log saved!');
  };
  function renderSleepHistory() {
    var c = qs('sleepHistory'); if (!c) return; c.innerHTML = '';
    sleepLogs.slice(0, 5).forEach(function (l) {
      var row = document.createElement('div'); row.className = 'sleep-hist-row';
      var d = new Date(l.date), dn = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      var stars = '\u2B50'.repeat(l.sleep || 0) + '\u00b7'.repeat(5 - (l.sleep || 0));
      var gText = (l.gratitude && l.gratitude.length) ? l.gratitude[0] : '\u2014';
      row.innerHTML = '<span class="hist-date">' + dn + '</span><span class="hist-stars">' + stars + '</span><span class="hist-grat">' + gText + '</span>';
      c.appendChild(row);
    });
  }
  renderSleepHistory();

  /* ─── SELF-CARE CHECKLIST ─── */
  var checkItems = [
    { id: 'water',   icon: '\uD83D\uDCA7', name: 'Drink water',         sub: '8 glasses goal' },
    { id: 'walk',    icon: '\uD83D\uDEB6', name: 'Go outside',           sub: 'Even 10 minutes' },
    { id: 'eat',     icon: '\uD83E\uDD57', name: 'Eat a proper meal',    sub: 'Nourish your body' },
    { id: 'sleep',   icon: '\uD83D\uDE34', name: 'Sleep on time',        sub: 'Consistent bedtime' },
    { id: 'breathe', icon: '\uD83C\uDF2C\uFE0F', name: 'Breathe mindfully', sub: 'Try the exercise' },
    { id: 'journal', icon: '\u270D\uFE0F', name: 'Write in journal',     sub: 'Express yourself' },
    { id: 'connect', icon: '\uD83E\uDD1D', name: 'Connect with someone', sub: 'A text or a hug' },
    { id: 'screen',  icon: '\uD83D\uDCF5', name: 'Screen break',         sub: '30 min without phone' }
  ];
  var checkState = load('s_checklist', {});
  var _checkDate = load('s_check_date', ''), _todayStr = new Date().toDateString();
  if (_checkDate !== _todayStr) { checkState = {}; save('s_checklist', {}); save('s_check_date', _todayStr); }

  function buildChecklist() {
    var grid = qs('checklistGrid'); if (!grid) return; grid.innerHTML = '';
    checkItems.forEach(function (item) {
      var div = document.createElement('div'); div.className = 'check-item' + (checkState[item.id] ? ' checked' : '');
      var box = document.createElement('div'); box.className = 'check-box'; box.textContent = checkState[item.id] ? '\u2713' : '';
      var icon = document.createElement('div'); icon.className = 'check-icon'; icon.textContent = item.icon;
      var txt = document.createElement('div'); txt.className = 'check-text';
      var nm = document.createElement('div'); nm.className = 'check-name'; nm.textContent = item.name;
      var sb = document.createElement('div'); sb.className = 'check-sub'; sb.textContent = item.sub;
      txt.appendChild(nm); txt.appendChild(sb);
      div.appendChild(box); div.appendChild(icon); div.appendChild(txt);
      div.addEventListener('click', (function (it, d, b) { return function () { toggleCheck(it, d, b); }; })(item, div, box));
      grid.appendChild(div);
    });
    updateProgress();
  }
  function toggleCheck(item, div, box) {
    checkState[item.id] = !checkState[item.id]; save('s_checklist', checkState);
    div.classList.toggle('checked', !!checkState[item.id]); box.textContent = checkState[item.id] ? '\u2713' : '';
    updateProgress(); checkBadges(); if (checkState[item.id]) showToast('\u2705 ' + item.name + ' done!');
  }
  function updateProgress() {
    var done = objVals(checkState).filter(Boolean).length, pct = Math.round((done / checkItems.length) * 100);
    var pbf = qs('progressBarFill'); if (pbf) pbf.style.width = pct + '%';
    var pt = qs('progressText'); if (pt) pt.textContent = done + ' / ' + checkItems.length + ' done';
  }
  window.resetChecklist = function () { checkState = {}; save('s_checklist', {}); buildChecklist(); showToast('Checklist reset \u2726'); };
  buildChecklist();

  /* ─── BADGES ─── */
  var badgeDefs = [
    { id: 'first_mood',    icon: '\uD83C\uDFAF', name: 'First Check-in',      cond: 'Log your mood once',            check: function () { return moodLog.length >= 1; } },
    { id: 'mood_week',     icon: '\uD83D\uDCC5', name: 'Mood Keeper',          cond: 'Log mood 7 times',              check: function () { return moodLog.length >= 7; } },
    { id: 'first_journal', icon: '\uD83D\uDCD3', name: 'First Words',          cond: 'Write your first entry',        check: function () { return entries.length >= 1; } },
    { id: 'journal5',      icon: '\u270D\uFE0F', name: 'Storyteller',          cond: 'Write 5 journal entries',       check: function () { return entries.length >= 5; } },
    { id: 'first_breath',  icon: '\uD83C\uDF2C\uFE0F', name: 'First Breath',  cond: 'Complete 1 breathing cycle',   check: function () { return cyclesDone >= 1; } },
    { id: 'breath10',      icon: '\uD83C\uDF0A', name: 'Calm Waters',          cond: 'Complete 10 breathing cycles', check: function () { return cyclesDone >= 10; } },
    { id: 'first_med',     icon: '\uD83E\uDDD8', name: 'Still Mind',           cond: 'Complete a meditation session', check: function () { return !!load('s_med_done', false); } },
    { id: 'first_sleep',   icon: '\uD83C\uDF19', name: 'Rest Tracker',         cond: 'Log your sleep once',           check: function () { return sleepLogs.length >= 1; } },
    { id: 'checklist5',    icon: '\u2705',       name: 'Daily Care',           cond: 'Complete 5 self-care items',    check: function () { return objVals(checkState).filter(Boolean).length >= 5; } },
    { id: 'checklist_all', icon: '\uD83C\uDFC6', name: 'Self-care Champion',   cond: 'Complete all 8 items',          check: function () { return objVals(checkState).filter(Boolean).length >= 8; } },
    { id: 'gratitude',     icon: '\uD83D\uDC9C', name: 'Grateful Heart',       cond: 'Save a gratitude log',          check: function () { return sleepLogs.some(function (l) { return l.gratitude && l.gratitude.length > 0; }); } },
    { id: 'streak3',       icon: '\uD83D\uDD25', name: '3-Day Streak',         cond: 'Visit 3 days in a row',         check: function () { return load('s_streak', 0) >= 3; } }
  ];
  var earnedBadges = load('s_badges', {});
  if (typeof earnedBadges !== 'object' || Array.isArray(earnedBadges)) earnedBadges = {};

  function checkBadges() {
    var newlyEarned = [];
    badgeDefs.forEach(function (b) {
      if (!earnedBadges[b.id]) { try { if (b.check()) { earnedBadges[b.id] = Date.now(); newlyEarned.push(b.name); } } catch (e) { } }
    });
    if (newlyEarned.length) {
      save('s_badges', earnedBadges); renderBadges();
      newlyEarned.forEach(function (n) { showToast('\uD83C\uDFC5 Badge earned: ' + n + '!'); });
    }
  }
  function renderBadges() {
    var grid = qs('badgesGrid'); if (!grid) return; grid.innerHTML = '';
    badgeDefs.forEach(function (b) {
      var card = document.createElement('div'); card.className = 'badge-card' + (earnedBadges[b.id] ? ' earned' : '');
      var bi = document.createElement('div'); bi.className = 'badge-icon'; bi.textContent = b.icon;
      var bn = document.createElement('div'); bn.className = 'badge-name'; bn.textContent = b.name;
      var bc = document.createElement('div'); bc.className = 'badge-cond'; bc.textContent = earnedBadges[b.id] ? 'Earned \u2713' : b.cond;
      card.appendChild(bi); card.appendChild(bn); card.appendChild(bc);
      if (earnedBadges[b.id]) card.classList.add('badge-pop');
      grid.appendChild(card);
    });
  }
  renderBadges();

  /* ─── STREAK ─── */
  (function () {
    var streak = load('s_streak', 0) || 0, lastVisit = load('s_last_visit', ''), todayS = new Date().toDateString();
    if (lastVisit !== todayS) {
      var yest = new Date(); yest.setDate(yest.getDate() - 1);
      streak = (lastVisit === yest.toDateString()) ? (streak + 1) : 1;
      save('s_streak', streak); save('s_last_visit', todayS);
    }
  })();
  checkBadges();

  /* ═══════════════════════════════════════════════════════════
     MUSIC PLAYER
     Fix: show a VISIBLE YouTube iframe when play is clicked.
     Browsers allow video/audio on visible iframes triggered by
     a real user click. No autoplay hack needed — the user presses
     play inside the YouTube player UI themselves.
     The embed shows at 200px height inside the card.
  ═══════════════════════════════════════════════════════════ */
  var musicTracks = [
    { id: 'm1', cat: 'calm',    title: 'Peaceful Piano Melodies',     desc: 'Gentle piano tunes that slow your heartbeat and quiet the noise.',       mood: 'Calm',          dur: '1 hr',  thumb: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&h=320&fit=crop', ytId: '77ZozI0rw7w' },
    { id: 'm2', cat: 'sleep',   title: 'Deep Sleep Waves',            desc: 'Soft delta-wave sounds designed to ease you into restful sleep.',          mood: 'Sleep',         dur: '8 hrs', thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=320&fit=crop', ytId: '1ZYbU82GVz4' },
    { id: 'm3', cat: 'anxiety', title: 'Anxiety Relief Binaural Beats', desc: '432 Hz tones proven to reduce cortisol and calm the nervous system.',   mood: 'Anxiety Relief', dur: '3 hrs', thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=320&fit=crop', ytId: 'WPni755-Krg' },
    { id: 'm4', cat: 'nature',  title: 'Rainforest Rainfall',         desc: 'Pure tropical rain sounds with distant birds \u2014 instant grounding.',  mood: 'Nature',        dur: '2 hrs', thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&h=320&fit=crop', ytId: 'yIQd2Ya0Ziw' },
    { id: 'm5', cat: 'focus',   title: 'Lo-Fi Study Beats',           desc: 'Mellow lo-fi hip hop for focused work without overstimulation.',           mood: 'Focus',         dur: 'Live',  thumb: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=600&h=320&fit=crop', ytId: 'jfKfPfyJRdk' },
    { id: 'm6', cat: 'calm',    title: 'Ocean Waves at Sunset',       desc: 'Rhythmic ocean waves that sync with your breath and ease tension.',        mood: 'Calm',          dur: '3 hrs', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=320&fit=crop', ytId: 'BCZQZ7Ml0js' },
    { id: 'm7', cat: 'sleep',   title: 'Healing Sleep Meditation',    desc: '432 Hz sleeping music with guided relaxation for deep rest.',              mood: 'Sleep',         dur: '8 hrs', thumb: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=320&fit=crop', ytId: 'lE6RYpe9IT0' },
    { id: 'm8', cat: 'anxiety', title: '5-Minute Stress Relief',      desc: 'Quick breathing-pace music for immediate anxiety relief anywhere.',        mood: 'Anxiety Relief', dur: '5 min', thumb: 'https://images.unsplash.com/photo-1490750967868-88df5691cc28?w=600&h=320&fit=crop', ytId: 'inpok4MKVLM' },
    { id: 'm9', cat: 'nature',  title: 'Mountain Creek & Birds',      desc: 'Flowing creek water with birdsong \u2014 nature at its most healing.',     mood: 'Nature',        dur: '4 hrs', thumb: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=320&fit=crop', ytId: 'xNN7iTA57jM' }
  ];
  var _currentMusicId = null, _currentFilter = 'all';

  window.filterMusic = function (cat, btn) {
    _currentFilter = cat;
    document.querySelectorAll('.music-tab').forEach(function (t) { t.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderMusic();
  };

  function renderMusic() {
    var grid = qs('musicGrid'); if (!grid) return;
    grid.innerHTML = '';
    var filtered = _currentFilter === 'all' ? musicTracks : musicTracks.filter(function (t) { return t.cat === _currentFilter; });

    filtered.forEach(function (track) {
      var isPlaying = _currentMusicId === track.id;
      var card = document.createElement('div');
      card.className = 'music-card' + (isPlaying ? ' playing' : '');
      card.id = 'mc-' + track.id;

      /* ── Thumbnail row ── */
      var thumb = document.createElement('div'); thumb.className = 'music-thumb';
      thumb.innerHTML =
        '<img src="' + track.thumb + '" alt="' + track.title + '" loading="lazy">' +
        '<div class="music-overlay">' +
          '<button class="music-play-btn" aria-label="' + (isPlaying ? 'Stop' : 'Play') + ' ' + track.title + '">' +
            (isPlaying ? '\u23F9' : '\u25B6') +
          '</button>' +
        '</div>' +
        '<div class="music-now-badge"><div class="music-now-dot"></div>Now Playing</div>';
      thumb.querySelector('.music-overlay').addEventListener('click', (function (id) { return function () { window.toggleMusic(id); }; })(track.id));

      /* ── Info row ── */
      var info = document.createElement('div'); info.className = 'music-info';
      info.innerHTML =
        '<div class="music-title">' + track.title + '</div>' +
        '<div class="music-meta">' +
          '<span class="music-mood-tag">' + track.mood + '</span>' +
          '<span class="music-duration">\u23F1 ' + track.dur + '</span>' +
        '</div>' +
        '<div class="music-desc">' + track.desc + '</div>';

      card.appendChild(thumb);
      card.appendChild(info);

      /* ── Embed + waveform (only when playing) ── */
      if (isPlaying) {
        /* YouTube embed — visible, so browser permits playback */
        var embed = document.createElement('div'); embed.className = 'music-embed'; embed.id = 'emb-' + track.id;
        embed.innerHTML =
          '<iframe ' +
            'src="https://www.youtube.com/embed/' + track.ytId + '?rel=0&modestbranding=1" ' +
            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
            'allowfullscreen ' +
            'title="' + track.title + '">' +
          '</iframe>';

        /* Waveform + stop row */
        var stopRow = document.createElement('div'); stopRow.className = 'music-stop-row';
        stopRow.innerHTML =
          '<div class="music-waveform">' +
            '<div class="music-bar"></div><div class="music-bar"></div><div class="music-bar"></div>' +
            '<div class="music-bar"></div><div class="music-bar"></div><div class="music-bar"></div>' +
          '</div>' +
          '<button class="music-stop-btn" onclick="stopMusic()">\u25A0 Close</button>';

        card.appendChild(embed);
        card.appendChild(stopRow);
      }

      grid.appendChild(card);
    });
  }

  window.toggleMusic = function (id) {
    if (_currentMusicId === id) { window.stopMusic(); } else { window.playMusic(id); }
  };

  window.playMusic = function (id) {
    _currentMusicId = id;
    renderMusic();
    /* Scroll the playing card into view smoothly */
    var cardEl = qs('mc-' + id);
    if (cardEl) { setTimeout(function () { cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100); }
    showToast('\uD83C\uDFB5 Playing: ' + (musicTracks.find(function (t) { return t.id === id; }) || {}).title);
  };

  window.stopMusic = function () {
    _currentMusicId = null;
    renderMusic();
    showToast('\u23F9 Music closed');
  };

  renderMusic();

  /* ─── INLINE CHAT SECTION ─── */
  var chatHistory = [];
  var _chatLoading = false;
  var sageGreeting = "Hello, I\u2019m Sage \uD83C\uDF19 I\u2019m so glad you\u2019re here. This is a safe, judgement-free space \u2014 share anything on your mind. How are you feeling today?";

  function addMessage(text, role) {
    var msgs = qs('chatMessages'); if (!msgs) return;
    var wrap = document.createElement('div'); wrap.className = 'msg-wrap ' + role;
    var bubble = document.createElement('div'); bubble.className = 'msg-bubble ' + role; bubble.textContent = text;
    var time = document.createElement('div'); time.className = 'msg-time'; time.textContent = nowTime();
    wrap.appendChild(bubble); wrap.appendChild(time); msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight;
  }
  function showTyping() {
    var msgs = qs('chatMessages'); if (!msgs) return;
    var wrap = document.createElement('div'); wrap.id = 'typingWrap'; wrap.className = 'msg-wrap ai';
    var bubble = document.createElement('div'); bubble.className = 'msg-bubble ai'; bubble.style.padding = '.4rem .8rem';
    bubble.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    wrap.appendChild(bubble); msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight;
  }
  function removeTyping() { var t = qs('typingWrap'); if (t) t.remove(); }

  /* ─── API KEY + CLAUDE CALL ─── */
  function getApiKey() { return load('s_apikey', ''); }
  function setApiKey(k) { save('s_apikey', k); }

  function callClaude(messages, onSuccess, onError) {
    var key = getApiKey(); if (!key) { onError('no_key'); return; }
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        system: 'You are Sage, a warm compassionate AI companion on Serenity, a mental wellness website. Listen with deep empathy, validate feelings, offer gentle supportive responses to people experiencing loneliness, anxiety, depression, or stress. Keep replies concise (2-4 sentences), warm, human. Never give diagnoses or clinical advice. If someone expresses suicidal thoughts, gently direct them to iCall India: 9152987821 or Vandrevala Foundation: 1860-2662-345. Always end with a soft open-ended question.',
        messages: messages
      })
    })
      .then(function (r) { if (r.status === 401) { onError('bad_key'); return; } if (!r.ok) { onError('http_' + r.status); return; } return r.json(); })
      .then(function (data) {
        if (!data) return;
        var reply = '';
        if (data.content && Array.isArray(data.content)) { data.content.forEach(function (c) { if (c.type === 'text') reply += c.text; }); }
        onSuccess(reply || "I\u2019m here with you. Could you try again?");
      })
      .catch(function () { onError('network'); });
  }

  window.sendChatMessage = function () {
    if (_chatLoading) return;
    var input = qs('chatInput'); if (!input) return;
    var text = input.value.trim(); if (!text) return;
    if (!getApiKey()) { addMessage("To chat with Sage I need an API key. Please open the \uD83C\uDF19 button at the bottom-right to connect.", 'ai'); return; }
    addMessage(text, 'user'); chatHistory.push({ role: 'user', content: text });
    input.value = ''; input.style.height = '38px'; _chatLoading = true; showTyping();
    callClaude(chatHistory,
      function (reply) { removeTyping(); _chatLoading = false; addMessage(reply, 'ai'); chatHistory.push({ role: 'assistant', content: reply }); },
      function (reason) {
        removeTyping(); _chatLoading = false;
        if (reason === 'bad_key') { save('s_apikey', ''); addMessage("Your API key is invalid. Open the \uD83C\uDF19 button at the bottom-right to re-enter it.", 'ai'); }
        else if (reason === 'no_key') { addMessage("Open the \uD83C\uDF19 button at the bottom-right to add your Anthropic API key.", 'ai'); }
        else { addMessage("I\u2019m having trouble connecting. Check your internet and try again. \uD83C\uDF19", 'ai'); }
      }
    );
  };
  window.handleChatKey = function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendChatMessage(); } };
  window.autoResize = function (el) { el.style.height = '38px'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; };
  setTimeout(function () { addMessage(sageGreeting, 'ai'); chatHistory.push({ role: 'assistant', content: sageGreeting }); }, 700);

  /* ─── HAMBURGER DRAWER ─── */
  var _drawerOpen = false;
  function openDrawer() {
    _drawerOpen = true;
    var d = qs('mobileDrawer'); if (d) { d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); }
    var b = qs('hamburgerBtn'); if (b) { b.setAttribute('aria-expanded', 'true'); b.innerHTML = '&#10005;'; }
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    _drawerOpen = false;
    var d = qs('mobileDrawer'); if (d) { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); }
    var b = qs('hamburgerBtn'); if (b) { b.setAttribute('aria-expanded', 'false'); b.innerHTML = '&#9776;'; }
    document.body.style.overflow = '';
  }
  var _hbtn = qs('hamburgerBtn'); if (_hbtn) _hbtn.addEventListener('click', function () { _drawerOpen ? closeDrawer() : openDrawer(); });
  var _dclose = qs('drawerClose'); if (_dclose) _dclose.addEventListener('click', closeDrawer);
  document.querySelectorAll('.mobile-drawer-links a').forEach(function (a) { a.addEventListener('click', closeDrawer); });
  var _drawerEl = qs('mobileDrawer'); if (_drawerEl) _drawerEl.addEventListener('click', function (ev) { if (ev.target === this) closeDrawer(); });

  /* ─── FAB SAGE CHAT ─── */
  var _fabOpen = false, _fabLoading = false, _fabGreetingShown = false;
  var _fabGreeting = "Hello, I\u2019m Sage \uD83C\uDF19 I\u2019m so glad you\u2019re here. This is a safe, judgement-free space \u2014 share anything on your mind. How are you feeling today?";
  var _fabHistory = [{ role: 'assistant', content: _fabGreeting }];

  function fabShowKeyScreen() {
    var ks = qs('fabKeyScreen'); if (ks) ks.style.display = 'flex';
    var cv = qs('fabChatView'); if (cv) cv.style.display = 'none';
    var ki = qs('fabKeyInput'); if (ki) { ki.value = ''; setTimeout(function () { ki.focus(); }, 80); }
  }
  function fabShowChatView() {
    var ks = qs('fabKeyScreen'); if (ks) ks.style.display = 'none';
    var cv = qs('fabChatView'); if (cv) cv.style.display = 'flex';
    if (!_fabGreetingShown) { _fabGreetingShown = true; fabAddMsg(_fabGreeting, 'ai', false); }
    setTimeout(function () { var i = qs('fabInput'); if (i) i.focus(); }, 80);
  }

  var _fabKeySave = qs('fabKeySave');
  if (_fabKeySave) {
    _fabKeySave.addEventListener('click', function () {
      var ki = qs('fabKeyInput'); if (!ki) return;
      var k = ki.value.trim(); if (!k || k.length < 20) { showToast('Please enter a valid API key \uD83D\uDD11'); return; }
      setApiKey(k); fabShowChatView(); showToast('\u2705 Sage is now connected!');
    });
  }
  var _fabKeyInp = qs('fabKeyInput');
  if (_fabKeyInp) { _fabKeyInp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var b = qs('fabKeySave'); if (b) b.click(); } }); }
  var _fabChangeKey = qs('fabChangeKey'); if (_fabChangeKey) _fabChangeKey.addEventListener('click', fabShowKeyScreen);

  function fabAddMsg(text, role, isTyping) {
    var msgs = qs('fabMsgs'); if (!msgs) return;
    var wrap = document.createElement('div'); wrap.className = 'fab-msg-wrap ' + role;
    if (isTyping) {
      wrap.id = 'fabTypingWrap';
      var b1 = document.createElement('div'); b1.className = 'fab-bubble ai';
      b1.innerHTML = '<div class="fab-typing"><div class="fab-typing-dot"></div><div class="fab-typing-dot"></div><div class="fab-typing-dot"></div></div>';
      wrap.appendChild(b1);
    } else {
      var b2 = document.createElement('div'); b2.className = 'fab-bubble ' + role; b2.textContent = text;
      var t = document.createElement('div'); t.className = 'fab-bubble-time'; t.textContent = nowTime();
      wrap.appendChild(b2); wrap.appendChild(t);
    }
    msgs.appendChild(wrap); msgs.scrollTop = msgs.scrollHeight;
  }
  function fabRemoveTyping() { var t = qs('fabTypingWrap'); if (t) t.remove(); }

  function fabSendMsg() {
    if (_fabLoading) return;
    var inp = qs('fabInput'); if (!inp) return;
    var text = inp.value.trim(); if (!text) return;
    fabAddMsg(text, 'user', false); _fabHistory.push({ role: 'user', content: text });
    inp.value = ''; inp.style.height = '38px';
    _fabLoading = true; var sb = qs('fabSend'); if (sb) sb.disabled = true;
    fabAddMsg('', 'ai', true);
    callClaude(_fabHistory,
      function (reply) {
        fabRemoveTyping(); _fabLoading = false; var sb2 = qs('fabSend'); if (sb2) sb2.disabled = false;
        fabAddMsg(reply, 'ai', false); _fabHistory.push({ role: 'assistant', content: reply });
      },
      function (reason) {
        fabRemoveTyping(); _fabLoading = false; var sb3 = qs('fabSend'); if (sb3) sb3.disabled = false;
        if (reason === 'no_key' || reason === 'bad_key') { if (reason === 'bad_key') { save('s_apikey', ''); showToast('API key invalid \u2014 please re-enter \uD83D\uDD11'); } fabShowKeyScreen(); }
        else { fabAddMsg("I\u2019m having trouble connecting. Check your connection and try again. \uD83C\uDF19", 'ai', false); }
      }
    );
  }

  function openFabPanel() {
    _fabOpen = true;
    var panel = qs('fabChatPanel'); if (panel) panel.style.display = 'flex';
    var btn = qs('fabBtn'); if (btn) { btn.classList.add('fab-open'); btn.innerHTML = '&#10005;'; btn.setAttribute('aria-label', 'Close AI Companion'); }
    if (getApiKey()) { fabShowChatView(); } else { fabShowKeyScreen(); }
    if (window.innerWidth < 600) document.body.style.overflow = 'hidden';
  }
  function closeFabPanel() {
    _fabOpen = false;
    var panel = qs('fabChatPanel'); if (panel) panel.style.display = 'none';
    var btn = qs('fabBtn'); if (btn) { btn.classList.remove('fab-open'); btn.innerHTML = '\uD83C\uDF19'; btn.setAttribute('aria-label', 'Chat with Sage'); }
    document.body.style.overflow = '';
  }

  var _fabBtn = qs('fabBtn'); if (_fabBtn) _fabBtn.addEventListener('click', function () { _fabOpen ? closeFabPanel() : openFabPanel(); });
  var _fabClose = qs('fabClose'); if (_fabClose) _fabClose.addEventListener('click', closeFabPanel);
  var _fabSendBtn = qs('fabSend'); if (_fabSendBtn) _fabSendBtn.addEventListener('click', fabSendMsg);
  var _fabInp = qs('fabInput');
  if (_fabInp) {
    _fabInp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fabSendMsg(); } });
    _fabInp.addEventListener('input', function () { this.style.height = '38px'; this.style.height = Math.min(this.scrollHeight, 100) + 'px'; });
  }

  /* ─── ESC KEY ─── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { window.closeEditModal(); window.closeConfirmModal(); closeDrawer(); closeFabPanel(); }
  });

})(); /* end IIFE */
