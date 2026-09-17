/* ==========================================================================
   Fluency Forge — workshop exercises
   Day 1 time audit · Day 2 prompt lab · Day 3 workflow builder
   Day 4 evaluation drill · Day 5 Demo Day card
   Everything is client-side; progress persists in localStorage.
   ========================================================================== */
(function () {
  'use strict';

  var STORE_KEY = 'ff.workshop';
  var TOTAL_DAYS = 5;

  /* =========================================================== store === */
  var state = { day1: null, day2: '', day3: null, day4: null, day5: null, done: {} };

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          Object.keys(state).forEach(function (k) {
            if (parsed[k] !== undefined && parsed[k] !== null) state[k] = parsed[k];
          });
        }
      }
    } catch (e) { /* private mode or corrupt payload — start fresh */ }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { /* not worth failing an exercise over */ }
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Must run before any exercise reads `state`.
  load();

  /* ======================================================== progress === */
  var progressTxt = $('#progressTxt');
  var progressFill = $('#progressFill');

  function markDone(day, isDone) {
    var was = !!state.done[day];
    if (isDone) state.done[day] = true; else delete state.done[day];
    if (was !== !!state.done[day]) save();
    paintProgress();
  }

  function paintProgress() {
    var count = Object.keys(state.done).length;
    if (progressTxt) progressTxt.textContent = count + ' of ' + TOTAL_DAYS + ' exercises complete';
    if (progressFill) {
      progressFill.style.width = (count / TOTAL_DAYS * 100) + '%';
      progressFill.classList.toggle('is-full', count === TOTAL_DAYS);
    }
    $$('.daytab').forEach(function (tab) {
      tab.classList.toggle('is-done', !!state.done[tab.dataset.day]);
    });
  }

  /* ============================================================ tabs === */
  var tabs = $$('.daytab');
  var panels = $$('.daypanel');

  function showDay(day, pushHash) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.day === String(day))); });
    panels.forEach(function (p) { p.hidden = p.id !== 'day-' + day; });
    if (pushHash && history.replaceState) history.replaceState(null, '', '#day-' + day);

    // The tab strip scrolls horizontally on narrow screens — keep the active
    // tab visible without dragging the page around with it.
    var active = tabs.filter(function (t) { return t.dataset.day === String(day); })[0];
    var strip = active && active.parentNode;
    if (active && strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollTo({
        left: Math.max(0, active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2),
        behavior: 'smooth'
      });
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      showDay(tab.dataset.day, true);
      var panel = document.getElementById('day-' + tab.dataset.day);
      if (panel) {
        var top = panel.getBoundingClientRect().top + window.scrollY - 150;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
      }
    });
    tab.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(tab);
      var next = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (next < 0 || next >= tabs.length) return;
      e.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  });

  function dayFromHash() {
    var m = /^#day-([1-5])$/.exec(window.location.hash || '');
    return m ? m[1] : '1';
  }

  /* ================================================ DAY 1 · TIME AUDIT = */
  var FREQ = [
    { v: 'daily',   label: 'Every day',          weight: 5, perWeek: 5    },
    { v: 'often',   label: 'A few times a week', weight: 4, perWeek: 3    },
    { v: 'weekly',  label: 'Weekly',             weight: 3, perWeek: 1    },
    { v: 'biweek',  label: 'Every other week',   weight: 2, perWeek: 0.5  },
    { v: 'monthly', label: 'Monthly',            weight: 1, perWeek: 0.25 }
  ];

  var EFFORT = [
    { v: 'xs', label: 'Under 15 min', weight: 1, mins: 10  },
    { v: 's',  label: '15–45 min',    weight: 2, mins: 30  },
    { v: 'm',  label: '1–2 hours',    weight: 3, mins: 90  },
    { v: 'l',  label: 'Half a day',   weight: 4, mins: 240 },
    { v: 'xl', label: 'A full day+',  weight: 5, mins: 480 }
  ];

  var SEED = [
    { name: 'Weekly campaign performance recap', freq: 'weekly', effort: 'm' },
    { name: 'Triaging the shared inbox',         freq: 'daily',  effort: 's' },
    { name: '',                                  freq: 'weekly', effort: 's' }
  ];

  var auditRows = $('#auditRows');
  var rankList = $('#rankList');
  var verdictWrap = $('#verdictWrap');
  var rowSeq = 0;

  function lookup(list, v) {
    for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i];
    return list[0];
  }

  function scoreTask(task) {
    var f = lookup(FREQ, task.freq);
    var e = lookup(EFFORT, task.effort);
    // Raw payoff is frequency x effort, but the biggest tasks are the hardest
    // to hand off cleanly — so they take a handoff penalty.
    var penalty = e.weight === 5 ? 0.75 : e.weight === 4 ? 0.9 : 1;
    // Max reachable is daily x full-day with its penalty (18.75), not 25 —
    // normalising against 25 squashed every real answer into the low end.
    var score = Math.min(100, Math.round((f.weight * e.weight * penalty) / 18.75 * 100));
    return {
      score: score,
      hoursPerWeek: Math.round((f.perWeek * e.mins / 60) * 10) / 10,
      freqLabel: f.label.toLowerCase(),
      effortLabel: e.label.toLowerCase()
    };
  }

  function optionsHtml(list, selected) {
    return list.map(function (o) {
      return '<option value="' + o.v + '"' + (o.v === selected ? ' selected' : '') + '>' + o.label + '</option>';
    }).join('');
  }

  function addRow(task) {
    if (!auditRows) return;
    var id = 'row-' + (++rowSeq);
    var row = document.createElement('div');
    row.className = 'audit-row';
    row.dataset.id = id;
    row.innerHTML =
      '<input class="input" type="text" data-f="name" value="' + esc(task.name || '') + '" ' +
        'placeholder="e.g. Weekly campaign recap" aria-label="Task name">' +
      '<select class="select" data-f="freq" aria-label="How often">' + optionsHtml(FREQ, task.freq) + '</select>' +
      '<select class="select" data-f="effort" aria-label="Effort each time">' + optionsHtml(EFFORT, task.effort) + '</select>' +
      '<span class="score-pill" data-f="score">—</span>' +
      '<button class="icon-btn" type="button" data-act="remove" aria-label="Remove this task">✕</button>';
    auditRows.appendChild(row);
    paintAudit();
  }

  function readTasks() {
    return $$('.audit-row', auditRows).map(function (row) {
      return {
        name: $('[data-f="name"]', row).value.trim(),
        freq: $('[data-f="freq"]', row).value,
        effort: $('[data-f="effort"]', row).value
      };
    });
  }

  function paintAudit() {
    if (!auditRows) return;
    var tasks = readTasks();

    // Per-row score pills
    $$('.audit-row', auditRows).forEach(function (row, i) {
      var res = scoreTask(tasks[i]);
      var pill = $('[data-f="score"]', row);
      pill.textContent = tasks[i].name ? res.score : '—';
      pill.className = 'score-pill ' + (!tasks[i].name ? 't-low' : res.score >= 50 ? 't-high' : res.score >= 28 ? 't-mid' : 't-low');
    });

    // Ranked sidebar
    var ranked = tasks
      .map(function (t) { var r = scoreTask(t); r.name = t.name; return r; })
      .filter(function (t) { return t.name; })
      .sort(function (a, b) { return b.score - a.score; });

    if (!rankList) return;

    if (!ranked.length) {
      rankList.innerHTML = '<li class="empty-state">Name a task or two and your ranking builds itself.</li>';
      if (verdictWrap) verdictWrap.innerHTML = '';
      markDone('1', false);
      state.day1 = tasks; save();
      return;
    }

    rankList.innerHTML = ranked.map(function (t, i) {
      return '<li class="rank-item">' +
        '<span class="rank-item__n">' + (i + 1) + '</span>' +
        '<span><span class="rank-item__name">' + esc(t.name) + '</span>' +
        '<span class="rank-item__meta">' + t.hoursPerWeek + ' hrs/week · ' + esc(t.freqLabel) + '</span></span>' +
        '<strong>' + t.score + '</strong>' +
      '</li>';
    }).join('');

    var top = ranked[0];
    if (verdictWrap) {
      verdictWrap.innerHTML =
        '<div class="verdict">' +
          '<div class="verdict__label">Your Agent #1 candidate</div>' +
          '<div class="verdict__name">' + esc(top.name) + '</div>' +
          '<p class="verdict__why">It runs ' + esc(top.freqLabel) + ' and costs you ' + esc(top.effortLabel) +
            ' each time — roughly <strong>' + top.hoursPerWeek + ' hours a week</strong>. ' +
            (top.score >= 50
              ? 'High frequency, contained scope: this is exactly the shape that automates well.'
              : top.score >= 28
                ? 'Worth building, though you may want to narrow the scope before you hand it off.'
                : 'Honestly, nothing here is urgent yet — add a few more tasks and see what surfaces.') +
          '</p>' +
        '</div>';
    }

    state.day1 = tasks; save();
    markDone('1', ranked.length >= 2);
  }

  if (auditRows) {
    (state.day1 && state.day1.length ? state.day1 : SEED).forEach(addRow);

    auditRows.addEventListener('input', paintAudit);
    auditRows.addEventListener('change', paintAudit);
    auditRows.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act="remove"]');
      if (!btn) return;
      var rows = $$('.audit-row', auditRows);
      if (rows.length <= 1) {
        // Keep one row around rather than leaving an empty table.
        var row = btn.closest('.audit-row');
        $('[data-f="name"]', row).value = '';
      } else {
        btn.closest('.audit-row').remove();
      }
      paintAudit();
    });

    var addBtn = $('#addTask');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        addRow({ name: '', freq: 'weekly', effort: 's' });
        var rows = $$('.audit-row', auditRows);
        $('[data-f="name"]', rows[rows.length - 1]).focus();
      });
    }
  }

  /* ================================================ DAY 2 · PROMPT LAB = */
  var RUBRIC = {
    role: /\b(you are|act as|you'?re an?\b|your role is|assume the role)\b/i,
    context: /\b(audience|our voice|tone of voice|brand voice|readers?|marketing ops|context|background|blog post|source|we(?:'re| are)|our (?:product|team|company|customers))\b/i,
    format: /\b(format|output|structure|bullet|headline|markdown|character|characters|words?|sentences?)\b|\b(?:three|two|3|2)\s+(?:social\s+)?posts?\b|\bunder \d+\b/i,
    examples: /\b(for example|e\.?g\.?|examples?\s*[:\u2014-]|example of|here'?s an example|like this|such as|sample (?:post|output|answer|copy))\b/i,
    constraints: /\b(don'?t|do not|never|avoid|no hashtags|no hype|no emoji|without|must not|only use|limit(?:ed)? to|keep it under|stick to)\b/i
  };

  var EXAMPLES = {
    before: 'Turn this blog post into some social posts.',
    after:
      'You are a B2B social editor for a marketing analytics company.\n\n' +
      'CONTEXT: The source is our 1,200-word post announcing a new reporting dashboard. ' +
      'The audience is marketing ops leads who already run weekly reporting by hand. ' +
      'Our voice is plain and specific — we sound like a colleague, not a launch video.\n\n' +
      'TASK: Write three social posts from the source material.\n\n' +
      'FORMAT:\n' +
      '  1. LinkedIn — 3 short paragraphs, under 120 words, ending in a question.\n' +
      '  2. X — under 240 characters, one concrete detail.\n' +
      '  3. X — under 240 characters, framed as the problem it removes.\n\n' +
      'EXAMPLE of the voice we want:\n' +
      '  "Reporting used to take our team a morning. It now takes about ten minutes, ' +
      'and the ten minutes are the part that needs a human."\n\n' +
      'CONSTRAINTS: Do not invent statistics — only use figures that appear in the source. ' +
      'No hashtags, no emoji, never use the words "game-changing" or "revolutionize". ' +
      'Avoid opening two posts the same way.'
  };

  var draft = $('#promptDraft');
  var rubricFill = $('#rubricFill');
  var rubricScore = $('#rubricScore');
  var promptDone = $('#promptDone');
  var promptCount = $('#promptCount');
  var exampleBox = $('#exampleBox');
  var egBefore = $('#egBefore');
  var egAfter = $('#egAfter');
  var shownExample = 'before';

  function paintPrompt() {
    if (!draft) return;
    var text = draft.value;
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (promptCount) promptCount.textContent = words + (words === 1 ? ' word' : ' words');

    var met = 0;
    $$('#rubricList li').forEach(function (li) {
      var key = li.dataset.key;
      var hit = text.trim().length > 15 && RUBRIC[key].test(text);
      li.classList.toggle('is-met', hit);
      if (hit) met++;
    });

    if (rubricFill) {
      rubricFill.style.width = (met / 5 * 100) + '%';
      rubricFill.classList.toggle('is-full', met === 5);
    }
    if (rubricScore) rubricScore.textContent = met + ' of 5 elements';
    if (promptDone) promptDone.classList.toggle('is-visible', met === 5);

    state.day2 = text; save();
    markDone('2', met === 5);
  }

  function paintExample() {
    if (!exampleBox) return;
    exampleBox.textContent = EXAMPLES[shownExample];
    exampleBox.classList.toggle('is-after', shownExample === 'after');
    if (egBefore) egBefore.setAttribute('aria-pressed', String(shownExample === 'before'));
    if (egAfter) egAfter.setAttribute('aria-pressed', String(shownExample === 'after'));
  }

  if (draft) {
    draft.value = state.day2 || '';
    draft.addEventListener('input', paintPrompt);
    paintPrompt();
    paintExample();

    if (egBefore) egBefore.addEventListener('click', function () { shownExample = 'before'; paintExample(); });
    if (egAfter) egAfter.addEventListener('click', function () { shownExample = 'after'; paintExample(); });

    var useExample = $('#useExample');
    if (useExample) {
      useExample.addEventListener('click', function () {
        draft.value = EXAMPLES[shownExample];
        paintPrompt();
        draft.focus();
      });
    }
  }

  /* ============================================ DAY 3 · WORKFLOW BUILD = */
  var WF_STEPS = [
    { id: 'gather',  name: 'Gather',  desc: 'Fetch the three competitor pages and strip them to text' },
    { id: 'extract', name: 'Extract', desc: 'Pull positioning, pricing and proof points from each' },
    { id: 'analyze', name: 'Analyze', desc: 'Compare the three against our own positioning' },
    { id: 'draft',   name: 'Draft',   desc: 'Write the one-page brief in our template' },
    { id: 'review',  name: 'Review',  desc: 'Check every claim in the draft against the sources' }
  ];
  var WF_ANSWER = ['gather', 'extract', 'analyze', 'draft', 'review'];

  var wfList = $('#wfList');
  var wfFeedback = $('#wfFeedback');
  var wfOrder = [];
  var dragId = null;

  function stepById(id) {
    for (var i = 0; i < WF_STEPS.length; i++) if (WF_STEPS[i].id === id) return WF_STEPS[i];
    return null;
  }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    // Never hand back the finished answer.
    return a.join() === WF_ANSWER.join() ? shuffled(arr) : a;
  }

  function paintWorkflow() {
    if (!wfList) return;
    wfList.innerHTML = wfOrder.map(function (id, i) {
      var s = stepById(id);
      return '<div class="wf-step" draggable="true" data-id="' + s.id + '">' +
        '<span class="wf-step__grip" aria-hidden="true">⣿</span>' +
        '<span class="step-badge step-badge--sm">' + (i + 1) + '</span>' +
        '<span><span class="wf-step__name">' + s.name + '</span>' +
        '<span class="wf-step__desc">' + s.desc + '</span></span>' +
        '<span class="wf-step__moves">' +
          '<button type="button" data-move="up" aria-label="Move ' + s.name + ' up"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
          '<button type="button" data-move="down" aria-label="Move ' + s.name + ' down"' + (i === wfOrder.length - 1 ? ' disabled' : '') + '>▼</button>' +
        '</span>' +
      '</div>';
    }).join('');
    state.day3 = wfOrder; save();
  }

  function moveStep(id, delta) {
    var i = wfOrder.indexOf(id);
    var j = i + delta;
    if (i < 0 || j < 0 || j >= wfOrder.length) return;
    wfOrder.splice(j, 0, wfOrder.splice(i, 1)[0]);
    paintWorkflow();
    clearWfFeedback();
  }

  function clearWfFeedback() {
    if (wfFeedback) { wfFeedback.className = 'feedback'; wfFeedback.innerHTML = ''; }
    $$('.wf-step', wfList).forEach(function (el) { el.classList.remove('ok', 'bad'); });
  }

  function checkWorkflow() {
    if (!wfFeedback) return;
    var correct = wfOrder.join() === WF_ANSWER.join();

    $$('.wf-step', wfList).forEach(function (el, i) {
      el.classList.toggle('ok', wfOrder[i] === WF_ANSWER[i]);
      el.classList.toggle('bad', wfOrder[i] !== WF_ANSWER[i]);
    });

    if (correct) {
      wfFeedback.className = 'feedback feedback--ok is-visible';
      wfFeedback.innerHTML =
        '<h4>That’s the chain.</h4>' +
        '<p style="margin:0">Gather before you extract, analyse before you draft, review dead last. ' +
        'Each step hands the next one its context — that’s the whole trick to a multi-step agent.</p>';
      markDone('3', true);
      return;
    }

    var notes = [];
    if (wfOrder[0] !== 'gather') notes.push('Nothing useful happens before you have the source material — <strong>Gather</strong> goes first.');
    if (wfOrder[wfOrder.length - 1] !== 'review') notes.push('<strong>Review</strong> belongs last. Reviewing before the draft exists just checks an empty page.');
    if (wfOrder.indexOf('draft') < wfOrder.indexOf('analyze')) notes.push('You put <strong>Draft</strong> before <strong>Analyze</strong> — the agent would be writing with nothing to say.');
    if (wfOrder.indexOf('extract') < wfOrder.indexOf('gather')) notes.push('<strong>Extract</strong> needs pages to extract from, so it follows <strong>Gather</strong>.');
    if (!notes.length) notes.push('Close. Two steps are swapped — look at which one needs the other’s output.');

    var rightCount = wfOrder.filter(function (id, i) { return id === WF_ANSWER[i]; }).length;
    wfFeedback.className = 'feedback ' + (rightCount >= 3 ? 'feedback--warn' : 'feedback--err') + ' is-visible';
    wfFeedback.innerHTML =
      '<h4>' + rightCount + ' of 5 in the right slot.</h4>' +
      '<ul>' + notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>';
    markDone('3', false);
  }

  if (wfList) {
    wfOrder = (state.day3 && state.day3.length === 5) ? state.day3 : shuffled(WF_ANSWER);
    paintWorkflow();

    wfList.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-move]');
      if (!btn) return;
      moveStep(btn.closest('.wf-step').dataset.id, btn.dataset.move === 'up' ? -1 : 1);
    });

    wfList.addEventListener('dragstart', function (e) {
      var step = e.target.closest('.wf-step');
      if (!step) return;
      dragId = step.dataset.id;
      step.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch (err) { /* IE-ism, ignore */ }
    });

    wfList.addEventListener('dragend', function () {
      dragId = null;
      $$('.wf-step', wfList).forEach(function (el) { el.classList.remove('is-dragging', 'is-over'); });
    });

    wfList.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var over = e.target.closest('.wf-step');
      $$('.wf-step', wfList).forEach(function (el) { el.classList.toggle('is-over', el === over && el.dataset.id !== dragId); });
    });

    wfList.addEventListener('drop', function (e) {
      e.preventDefault();
      var target = e.target.closest('.wf-step');
      if (!target || !dragId || target.dataset.id === dragId) return;
      var from = wfOrder.indexOf(dragId);
      var to = wfOrder.indexOf(target.dataset.id);
      wfOrder.splice(to, 0, wfOrder.splice(from, 1)[0]);
      paintWorkflow();
      clearWfFeedback();
    });

    var wfCheck = $('#wfCheck');
    if (wfCheck) wfCheck.addEventListener('click', checkWorkflow);

    var wfShuffle = $('#wfShuffle');
    if (wfShuffle) {
      wfShuffle.addEventListener('click', function () {
        wfOrder = shuffled(WF_ANSWER);
        paintWorkflow();
        clearWfFeedback();
        markDone('3', false);
      });
    }

    var wfRevealBtn = $('#wfReveal');
    if (wfRevealBtn) {
      wfRevealBtn.addEventListener('click', function () {
        wfOrder = WF_ANSWER.slice();
        paintWorkflow();
        clearWfFeedback();
        if (wfFeedback) {
          wfFeedback.className = 'feedback feedback--warn is-visible';
          wfFeedback.innerHTML = '<h4>Here’s the sequence.</h4><p style="margin:0">Gather → Extract → Analyze → Draft → Review. ' +
            'Shuffle and try it from memory — that’s where it sticks.</p>';
        }
      });
    }
  }

  /* ============================================== DAY 4 · EVALUATION == */
  var FLAGS = [
    { v: 'stat',   label: 'Hallucinated a figure that isn’t in the source' },
    { v: 'tone',   label: 'Wrong tone — hype instead of our plain voice' },
    { v: 'missed', label: 'Missed an explicit instruction' },
    { v: 'clean',  label: 'Clean — passes every check' }
  ];

  var EVAL_ITEMS = [
    {
      id: 'a',
      label: 'Output A',
      text: 'Our Q3 dashboard is live, and the 2,300 marketers in the beta cut their reporting time in half. ' +
            'Reporting that used to eat a morning now takes minutes. What’s still manual in your weekly reporting?',
      answer: 'stat',
      note: 'The source says <strong>1,400 beta users</strong> and <strong>31% faster</strong>. This output rounded ' +
            'both into something better-sounding. Tone is fine and it ends in a question — which is exactly why ' +
            'fabricated numbers slip past reviewers.'
    },
    {
      id: 'b',
      label: 'Output B',
      text: '🚀 HUGE news! Our game-changing Q3 dashboard is here and it’s about to revolutionize your entire ' +
            'reporting workflow. 1,400 beta users. 31% faster reporting. Are you ready to transform how you work?',
      answer: 'tone',
      note: 'Every figure is right and it does end in a question. But the brief said plain voice, no hype — and ' +
            'this is four hype words and an emoji deep. Tone drift is the failure people notice last and customers notice first.'
    },
    {
      id: 'c',
      label: 'Output C',
      text: 'The Q3 reporting dashboard is now available to every account. During the beta, 1,400 users reported ' +
            'reporting cycles running 31% faster than their previous setup.',
      answer: 'missed',
      note: 'Accurate figures, right voice, correct length — but the brief explicitly said <strong>end with a question</strong>, ' +
            'and this doesn’t. Skipped instructions are the most common failure once a prompt gets long.'
    }
  ];

  var evalGrid = $('#evalGrid');
  var evalPicks = (state.day4 && typeof state.day4 === 'object') ? state.day4 : {};

  function paintEval() {
    if (!evalGrid) return;
    evalGrid.innerHTML = EVAL_ITEMS.map(function (item) {
      return '<article class="eval-card" data-id="' + item.id + '">' +
        '<div class="eval-card__label">' + item.label + '</div>' +
        '<div class="eval-card__output">' + esc(item.text) + '</div>' +
        '<div class="flag-opts">' +
          FLAGS.map(function (f) {
            var checked = evalPicks[item.id] === f.v;
            return '<label class="flag-opt' + (checked ? ' picked' : '') + '" data-v="' + f.v + '">' +
              '<input type="radio" name="eval-' + item.id + '" value="' + f.v + '"' + (checked ? ' checked' : '') + '>' +
              '<span>' + f.label + '</span></label>';
          }).join('') +
        '</div>' +
        '<div class="eval-note" data-note>' + item.note + '</div>' +
      '</article>';
    }).join('');
  }

  function scoreEval() {
    var right = 0;
    EVAL_ITEMS.forEach(function (item) {
      var card = $('.eval-card[data-id="' + item.id + '"]', evalGrid);
      var picked = evalPicks[item.id];
      var ok = picked === item.answer;
      if (ok) right++;

      card.classList.toggle('is-correct', ok);
      card.classList.toggle('is-wrong', !!picked && !ok);
      $('[data-note]', card).classList.add('is-visible');

      $$('.flag-opt', card).forEach(function (opt) {
        opt.classList.remove('reveal-right', 'reveal-wrong');
        if (opt.dataset.v === item.answer) opt.classList.add('reveal-right');
        else if (opt.dataset.v === picked) opt.classList.add('reveal-wrong');
      });
    });

    var board = $('#evalScore');
    var num = $('#evalScoreNum');
    var txt = $('#evalScoreTxt');
    if (board) board.hidden = false;
    if (num) num.textContent = right + '/3';
    if (txt) {
      txt.innerHTML = right === 3
        ? 'All three. You caught a fabricated number, a tone drift and a skipped instruction — that’s the eval rubric the whole cohort uses on Day 4.'
        : right === 2
          ? 'Close. Re-read the one you missed against the original brief, line by line — the failure is always in the gap between the two.'
          : 'Worth another pass. Put the brief and the output side by side and check one requirement at a time rather than reading for overall vibe.';
    }
    markDone('4', right === 3);
  }

  if (evalGrid) {
    paintEval();

    evalGrid.addEventListener('change', function (e) {
      var input = e.target.closest('input[type="radio"]');
      if (!input) return;
      var card = input.closest('.eval-card');
      evalPicks[card.dataset.id] = input.value;
      state.day4 = evalPicks; save();
      $$('.flag-opt', card).forEach(function (opt) {
        opt.classList.toggle('picked', opt.dataset.v === input.value);
      });
    });

    var evalCheck = $('#evalCheck');
    if (evalCheck) {
      evalCheck.addEventListener('click', function () {
        if (Object.keys(evalPicks).length < EVAL_ITEMS.length) {
          var board = $('#evalScore'), txt = $('#evalScoreTxt'), num = $('#evalScoreNum');
          if (board) board.hidden = false;
          if (num) num.textContent = '—';
          if (txt) txt.textContent = 'Flag all three outputs first, then score them.';
          return;
        }
        scoreEval();
      });
    }

    var evalResetBtn = $('#evalReset');
    if (evalResetBtn) {
      evalResetBtn.addEventListener('click', function () {
        evalPicks = {};
        state.day4 = {}; save();
        paintEval();
        var board = $('#evalScore');
        if (board) board.hidden = true;
        markDone('4', false);
      });
    }
  }

  /* ================================================ DAY 5 · DEMO DAY == */
  var demoForm = $('#demoForm');
  var DEMO_FIELDS = ['d-builder', 'd-role', 'd-name', 'd-problem', 'd-agent', 'd-before', 'd-after'];

  function readDemo() {
    var out = {};
    DEMO_FIELDS.forEach(function (id) {
      var el = document.getElementById(id);
      out[id] = el ? el.value.trim() : '';
    });
    return out;
  }

  function setCardText(id, value, placeholder) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = value || placeholder;
    el.classList.toggle('is-placeholder', !value);
  }

  function paintDemo() {
    if (!demoForm) return;
    var d = readDemo();

    setCardText('c-name', d['d-name'], 'Your agent’s name');

    var by = [d['d-builder'], d['d-role']].filter(Boolean).join(' · ');
    setCardText('c-by', by, 'Your name · role & company');
    setCardText('c-problem', d['d-problem'], 'What was eating your week before you built this.');
    setCardText('c-agent', d['d-agent'], 'What it does now, in your own words.');

    var before = parseFloat(d['d-before']);
    var after = parseFloat(d['d-after']);
    var hasBefore = !isNaN(before), hasAfter = !isNaN(after);

    var cb = $('#c-before'), ca = $('#c-after'), cs = $('#c-saved');
    if (cb) cb.textContent = hasBefore ? before + ' hrs' : '—';
    if (ca) ca.textContent = hasAfter ? after + ' hrs' : '—';

    if (cs) {
      if (hasBefore && hasAfter && before > after) {
        var saved = Math.round((before - after) * 10) / 10;
        var pct = Math.round((before - after) / before * 100);
        cs.textContent = saved + ' hours back every week — ' + pct + '% of that task gone, about ' +
          Math.round(saved * 48) + ' hours a year.';
      } else if (hasBefore && hasAfter) {
        cs.textContent = 'No time saved yet — what would the agent have to take off your plate to change that?';
      } else {
        cs.textContent = 'Add your hours to see the payoff';
      }
    }

    // Character counters
    [['d-problem', 'd-problem-left'], ['d-agent', 'd-agent-left']].forEach(function (pair) {
      var field = document.getElementById(pair[0]);
      var out = document.getElementById(pair[1]);
      if (field && out) out.textContent = String(260 - field.value.length);
    });

    state.day5 = d; save();
    markDone('5', !!(d['d-name'] && d['d-problem'] && d['d-agent'] && hasBefore && hasAfter));
  }

  function demoPostText() {
    var d = readDemo();
    var before = parseFloat(d['d-before']);
    var after = parseFloat(d['d-after']);
    var savedLine = (!isNaN(before) && !isNaN(after) && before > after)
      ? '\n\nBefore: ' + before + ' hrs/week. After: ' + after + ' hrs/week. That\'s ' +
        (Math.round((before - after) * 10) / 10) + ' hours back, every week.'
      : '';

    return 'I just finished Fluency Forge and shipped ' + (d['d-name'] || 'my first AI agent') + '.\n\n' +
      'The problem: ' + (d['d-problem'] || '—') + '\n\n' +
      'What it does: ' + (d['d-agent'] || '—') + savedLine +
      '\n\nFive days, three agents, no code. If your week has a task that never changes shape, ' +
      'it\'s probably already an agent.\n\n#AIAgents #MarketingOps';
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      return;
    }
    // Older browsers: hidden textarea + execCommand.
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok);
    } catch (e) { done(false); }
  }

  if (demoForm) {
    if (state.day5) {
      DEMO_FIELDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && state.day5[id]) el.value = state.day5[id];
      });
    }
    paintDemo();
    demoForm.addEventListener('input', paintDemo);

    var demoMsg = $('#demoMsg');
    function demoSay(text, kind) {
      if (!demoMsg) return;
      demoMsg.textContent = text;
      demoMsg.className = 'form-msg is-visible form-msg--' + kind;
    }

    var copyBtn = $('#demoCopy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var d = readDemo();
        if (!d['d-name'] || !d['d-problem'] || !d['d-agent']) {
          demoSay('Fill in the agent name, the problem and what it does first.', 'err');
          return;
        }
        copyText(demoPostText(), function (ok) {
          demoSay(ok ? 'Copied. Paste it straight into LinkedIn — and screenshot the card while you’re there.'
                     : 'Couldn’t reach the clipboard. Select the card text and copy it manually.', ok ? 'ok' : 'err');
        });
      });
    }

    var clearBtn = $('#demoClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        DEMO_FIELDS.forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.value = '';
        });
        state.day5 = null;
        paintDemo();
        if (demoMsg) demoMsg.className = 'form-msg';
      });
    }
  }

  /* ============================================================ boot === */
  var resetAll = $('#resetAll');
  if (resetAll) {
    resetAll.addEventListener('click', function () {
      if (!window.confirm('Clear every exercise and start the workshop over?')) return;
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nothing to clear */ }
      window.location.reload();
    });
  }

  paintProgress();

  window.addEventListener('hashchange', function () { showDay(dayFromHash(), false); });
  showDay(dayFromHash(), false);
})();
