/* Life Dashboard — app */

(function () {

  /* ─────────────────────────────────────────────
   * StorageService
   * Thin localStorage wrapper with try/catch on
   * every read and write.
   * ───────────────────────────────────────────── */
  var StorageService = {
    get: function (key) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('StorageService.get failed for key "' + key + '":', e);
        return null;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('StorageService.set failed for key "' + key + '":', e);
        return false;
      }
    }
  };

  /* ─────────────────────────────────────────────
   * GreetingWidget
   * Displays the live 24-hour clock, full date
   * string, and a time-of-day greeting.
   * DOM nodes: #greeting-text, #clock-time, #clock-date
   * ───────────────────────────────────────────── */
  var GreetingWidget = {

    /* Private DOM node references */
    _elGreeting: null,
    _elTime: null,
    _elDate: null,

    /* ── Task 5.1 helpers ─────────────────────── */

    /**
     * Returns the time portion of a Date as "HH:MM:SS"
     * using zero-padded 24-hour values.
     * @param {Date} date
     * @returns {string}
     */
    _formatTime: function (date) {
      var h  = String(date.getHours()).padStart(2, '0');
      var m  = String(date.getMinutes()).padStart(2, '0');
      var s  = String(date.getSeconds()).padStart(2, '0');
      return h + ':' + m + ':' + s;
    },

    /**
     * Returns the date portion of a Date as
     * "<FullWeekday>, <FullMonth> <DD>, <YYYY>"
     * e.g. "Monday, January 05, 2025"
     * @param {Date} date
     * @returns {string}
     */
    _formatDate: function (date) {
      var WEEKDAYS = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
      ];
      var MONTHS = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ];
      var weekday = WEEKDAYS[date.getDay()];
      var month   = MONTHS[date.getMonth()];
      var day     = String(date.getDate()).padStart(2, '0');
      var year    = date.getFullYear();
      return weekday + ', ' + month + ' ' + day + ', ' + year;
    },

    /**
     * Returns a time-of-day greeting string based on the hour (0–23).
     *   5–11  → "Good Morning"
     *   12–17 → "Good Afternoon"
     *   otherwise → "Good Evening"
     * @param {number} hour  integer in [0, 23]
     * @returns {string}
     */
    _greeting: function (hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      return 'Good Evening';
    },

    /* ── Task 5.3 — init and tick loop ───────── */

    /**
     * Initialises the widget: queries DOM nodes, fires
     * one immediate tick, then starts a 1 000 ms interval.
     */
    init: function () {
      this._elGreeting = document.getElementById('greeting-text');
      this._elTime     = document.getElementById('clock-time');
      this._elDate     = document.getElementById('clock-date');

      this._tick();
      setInterval(this._tick.bind(this), 1000);
    },

    /**
     * Called every second. Creates a new Date, updates all
     * three DOM nodes. Falls back to _handleClockError on
     * any exception or invalid date.
     */
    _tick: function () {
      try {
        var now = new Date();
        /* Guard against environments that return an invalid Date */
        if (isNaN(now.getTime())) {
          throw new Error('Invalid Date');
        }
        this._elGreeting.textContent = this._greeting(now.getHours());
        this._elTime.textContent     = this._formatTime(now);
        this._elDate.textContent     = this._formatDate(now);
      } catch (e) {
        this._handleClockError();
      }
    },

    /**
     * Sets all three DOM nodes to a placeholder when the
     * system clock is unavailable or returns an invalid value.
     */
    _handleClockError: function () {
      this._elGreeting.textContent = 'Time unavailable';
      this._elTime.textContent     = 'Time unavailable';
      this._elDate.textContent     = 'Time unavailable';
    }

  }; // end GreetingWidget

  /* ─────────────────────────────────────────────
   * FocusTimer
   * 25-minute Pomodoro countdown with three states:
   *   idle | running | paused
   * Uses wall-clock drift correction to stay within
   * ±1 s of real elapsed time under tab throttling.
   * DOM nodes: #timer-display, #btn-start, #btn-stop,
   *            #btn-reset, #timer-announcement
   * ───────────────────────────────────────────── */
  var FocusTimer = {

    /* ── State ─────────────────────────────────── */
    _state:      'idle',
    _remaining:  1500,       // seconds
    _intervalId: null,
    _tickStart:  null,       // wall-clock ms recorded at each interval start

    /* ── Cached DOM refs (set by init) ─────────── */
    _elDisplay:  null,
    _elStart:    null,
    _elStop:     null,
    _elReset:    null,
    _elAnnounce: null,

    /* ── Task 6.1 — state machine methods ──────── */

    /**
     * Starts or resumes the timer.
     * Idle   → Running  (resets _remaining to 1500 first)
     * Paused → Running  (keeps current _remaining)
     */
    _start: function () {
      if (this._state !== 'idle' && this._state !== 'paused') return;
      if (this._state === 'idle') {
        this._remaining = 1500;
      }
      this._state = 'running';
      this._tickStart = Date.now();
      clearInterval(this._intervalId);
      this._intervalId = setInterval(this._tick.bind(this), 1000);
      this._render();
    },

    /**
     * Pauses the timer.
     * Running → Paused  (retains _remaining)
     */
    _stop: function () {
      if (this._state !== 'running') return;
      this._state = 'paused';
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._render();
    },

    /**
     * Resets to Idle from any state.
     * Clears the interval, restores _remaining to 1500.
     */
    _reset: function () {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._state = 'idle';
      this._remaining = 1500;
      this._render();
    },

    /**
     * Called every ~1 000 ms by setInterval.
     * Uses wall-clock delta for drift correction so the
     * displayed time stays within ±1 s of real elapsed time.
     */
    _tick: function () {
      var elapsed = Math.round((Date.now() - this._tickStart) / 1000);
      this._tickStart = Date.now();

      /* Clamp elapsed to at least 1 to avoid stuck ticks */
      if (elapsed < 1) elapsed = 1;

      this._remaining -= elapsed;

      if (this._remaining <= 0) {
        this._remaining = 1500;
        this._playSignal();

        /* Announce completion before reset clears the display */
        if (this._elAnnounce) {
          this._elAnnounce.textContent = 'Focus session complete.';
          var self = this;
          setTimeout(function () {
            self._elAnnounce.textContent = '';
          }, 5000);
        }

        this._reset();
        return;
      }

      this._render();
    },

    /**
     * Converts a total-seconds value to "MM:SS".
     * 1500 → "25:00",  65 → "01:05",  0 → "00:00"
     * @param {number} s  non-negative integer seconds
     * @returns {string}
     */
    _formatMM_SS: function (s) {
      var minutes = Math.floor(s / 60);
      var seconds = s % 60;
      return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    },

    /* ── Task 6.3 — render, signal, wiring ──────── */

    /**
     * Updates the timer display and sets the correct
     * disabled / aria-disabled state on each button.
     *
     * Button matrix:
     *   idle    → Start enabled,  Stop disabled, Reset enabled
     *   running → Start disabled, Stop enabled,  Reset enabled
     *   paused  → Start enabled,  Stop disabled, Reset enabled
     */
    _render: function () {
      if (this._elDisplay) {
        this._elDisplay.textContent = this._formatMM_SS(this._remaining);
      }

      var startDisabled = (this._state === 'running');
      var stopDisabled  = (this._state !== 'running');
      /* Reset is always enabled */

      this._setBtn(this._elStart, startDisabled);
      this._setBtn(this._elStop,  stopDisabled);
      this._setBtn(this._elReset, false);
    },

    /**
     * Helper: apply .disabled and aria-disabled to a button element.
     * @param {HTMLButtonElement} btn
     * @param {boolean} disabled
     */
    _setBtn: function (btn, disabled) {
      if (!btn) return;
      btn.disabled = disabled;
      btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    },

    /**
     * Plays a short 880 Hz sine-wave beep via Web Audio API.
     * Silently swallows any error so the timer always resets
     * even when AudioContext is unavailable.
     */
    _playSignal: function () {
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ctx  = new AudioCtx();
        var osc  = ctx.createOscillator();
        osc.type      = 'sine';
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
        osc.onended = function () { ctx.close(); };
      } catch (e) {
        /* Silently swallow — audio is non-critical */
      }
    },

    /**
     * Initialises the widget: caches DOM refs, wires click
     * handlers, and renders the initial "25:00" display.
     */
    init: function () {
      this._elDisplay  = document.getElementById('timer-display');
      this._elStart    = document.getElementById('btn-start');
      this._elStop     = document.getElementById('btn-stop');
      this._elReset    = document.getElementById('btn-reset');
      this._elAnnounce = document.getElementById('timer-announcement');

      this._elStart.addEventListener('click', this._start.bind(this));
      this._elStop.addEventListener('click',  this._stop.bind(this));
      this._elReset.addEventListener('click', this._reset.bind(this));

      this._render();
    }

  }; // end FocusTimer

  /* ─────────────────────────────────────────────
   * TaskList
   * Add / edit / complete / delete tasks persisted
   * under localStorage key "tasks".
   * DOM nodes: #task-input, #task-submit, #task-error,
   *            #task-list
   * ───────────────────────────────────────────── */
  var TaskList = {

    /* ── State ──────────────────────────────────── */
    _tasks: [],

    /* ── Cached DOM refs ─────────────────────────── */
    _elInput:  null,
    _elSubmit: null,
    _elError:  null,
    _elList:   null,

    /* ── Task 7.1 — helpers and storage ─────────── */

    /**
     * Validates a task title.
     * @param {string} title
     * @returns {string|null}  null = valid; string = error message
     */
    _validate: function (title) {
      if (!title || title.trim().length === 0) {
        return 'Task title cannot be empty.';
      }
      if (title.trim().length > 200) {
        return 'Task title must be 200 characters or fewer.';
      }
      return null;
    },

    /**
     * Reads tasks from StorageService.
     * Falls back to [] on null or parse failure, writes [] back.
     */
    _load: function () {
      var stored = StorageService.get('tasks');
      if (!Array.isArray(stored)) {
        this._tasks = [];
        StorageService.set('tasks', []);
      } else {
        this._tasks = stored;
      }
    },

    /**
     * Persists the in-memory task array to localStorage.
     * Calls _showStorageError on write failure.
     */
    _save: function () {
      var ok = StorageService.set('tasks', this._tasks);
      if (!ok) {
        this._showStorageError('Could not save tasks — storage is unavailable.');
      }
    },

    /* ── Task 7.3 — CRUD operations and render ───── */

    /**
     * Generates a unique ID using crypto.randomUUID when
     * available, with a fallback for older environments.
     * @returns {string}
     */
    _generateId: function () {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return Date.now().toString() + Math.random().toString(36).slice(2);
    },

    /**
     * Adds a new task with the trimmed title.
     * @param {string} title
     */
    _add: function (title) {
      var task = {
        id:       this._generateId(),
        title:    title.trim(),
        complete: false
      };
      this._tasks.push(task);
      this._save();
      this._render();
    },

    /**
     * Removes a task by ID.
     * @param {string} id
     */
    _delete: function (id) {
      this._tasks = this._tasks.filter(function (t) { return t.id !== id; });
      this._save();
      this._render();
    },

    /**
     * Flips the complete flag on a task.
     * @param {string} id
     */
    _toggleComplete: function (id) {
      var task = this._tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.complete = !task.complete;
      this._save();
      this._render();
    },

    /**
     * Puts a task into edit state (transient flag, not persisted).
     * @param {string} id
     */
    _startEdit: function (id) {
      this._tasks.forEach(function (t) {
        t.editing = (t.id === id);
      });
      this._render();
    },

    /**
     * Confirms an edit.
     * If newTitle is empty/whitespace, discards silently and
     * restores the previous title without calling _save().
     * @param {string} id
     * @param {string} newTitle
     */
    _confirmEdit: function (id, newTitle) {
      var task = this._tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.editing = false;
      if (!newTitle || newTitle.trim().length === 0) {
        /* Silent discard — restore previous title, do not save */
        this._render();
        return;
      }
      task.title = newTitle.trim();
      this._save();
      this._render();
    },

    /**
     * Cancels an in-progress edit without changing the task.
     * @param {string} id
     */
    _cancelEdit: function (id) {
      var task = this._tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.editing = false;
      this._render();
    },

    /**
     * Clears and re-renders the entire task list.
     */
    _render: function () {
      if (!this._elList) return;
      this._elList.innerHTML = '';
      var self = this;
      this._tasks.forEach(function (task) {
        self._elList.appendChild(self._renderItem(task));
      });
    },

    /**
     * Builds and returns a <li> element for a single task.
     * In edit state renders an input + Confirm/Cancel buttons.
     * In display state renders the title + action buttons.
     * @param {Object} task
     * @returns {HTMLLIElement}
     */
    _renderItem: function (task) {
      var self = this;
      var li = document.createElement('li');
      li.className = 'task' + (task.complete ? ' task--complete' : '');
      li.dataset.id = task.id;

      if (task.editing) {
        /* ── Edit state ─────────────────────────── */
        var input = document.createElement('input');
        input.type      = 'text';
        input.className = 'task__edit-input';
        input.value     = task.title;
        input.maxLength = 200;
        input.setAttribute('aria-label', 'Edit task title');

        var btnConfirm = document.createElement('button');
        btnConfirm.type      = 'button';
        btnConfirm.className = 'btn btn--primary';
        btnConfirm.textContent = 'Confirm';
        btnConfirm.addEventListener('click', function () {
          self._confirmEdit(task.id, input.value);
        });

        /* Allow Enter key to confirm */
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { self._confirmEdit(task.id, input.value); }
          if (e.key === 'Escape') { self._cancelEdit(task.id); }
        });

        var btnCancel = document.createElement('button');
        btnCancel.type      = 'button';
        btnCancel.className = 'btn btn--ghost';
        btnCancel.textContent = 'Cancel';
        btnCancel.addEventListener('click', function () {
          self._cancelEdit(task.id);
        });

        li.appendChild(input);
        li.appendChild(btnConfirm);
        li.appendChild(btnCancel);

        /* Focus the input after render */
        setTimeout(function () { input.focus(); }, 0);

      } else {
        /* ── Display state ──────────────────────── */
        var span = document.createElement('span');
        span.className   = 'task__title';
        span.textContent = task.title;
        li.appendChild(span);

        var toggleLabel = task.complete
          ? 'Incomplete task: ' + task.title
          : 'Complete task: '   + task.title;
        var btnToggle = document.createElement('button');
        btnToggle.type      = 'button';
        btnToggle.className = 'btn btn--ghost';
        btnToggle.textContent = task.complete ? '↩' : '✓';
        btnToggle.setAttribute('aria-label', toggleLabel);
        btnToggle.addEventListener('click', function () {
          self._toggleComplete(task.id);
        });

        var btnEdit = document.createElement('button');
        btnEdit.type      = 'button';
        btnEdit.className = 'btn btn--ghost';
        btnEdit.textContent = '✏';
        btnEdit.setAttribute('aria-label', 'Edit task: ' + task.title);
        btnEdit.addEventListener('click', function () {
          self._startEdit(task.id);
        });

        var btnDelete = document.createElement('button');
        btnDelete.type      = 'button';
        btnDelete.className = 'btn btn--danger';
        btnDelete.textContent = '🗑';
        btnDelete.setAttribute('aria-label', 'Delete task: ' + task.title);
        btnDelete.addEventListener('click', function () {
          self._delete(task.id);
        });

        li.appendChild(btnToggle);
        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
      }

      return li;
    },

    /**
     * Displays a storage-related error message.
     * @param {string} msg
     */
    _showStorageError: function (msg) {
      if (this._elError) {
        this._elError.textContent = msg;
      }
    },

    /**
     * Initialises the widget: caches DOM refs, loads persisted
     * tasks, renders them, and wires the add-task form.
     */
    init: function () {
      this._elInput  = document.getElementById('task-input');
      this._elSubmit = document.getElementById('task-submit');
      this._elError  = document.getElementById('task-error');
      this._elList   = document.getElementById('task-list');

      this._load();
      this._render();

      var self = this;
      var form = document.getElementById('task-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var title = self._elInput.value;
          var error = self._validate(title);
          if (error) {
            self._elError.textContent = error;
            return;
          }
          self._elError.textContent = '';
          self._add(title);
          self._elInput.value = '';
        });
      }
    }

  }; // end TaskList

  /* ─────────────────────────────────────────────
   * QuickLinks
   * Save and manage shortcut buttons that open
   * favourite websites in a new tab, persisted
   * under localStorage key "links".
   * DOM nodes: #link-form, #link-label, #link-url,
   *            #link-submit, #link-error, #links-list
   * ───────────────────────────────────────────── */
  var QuickLinks = {

    /* ── State ──────────────────────────────────── */
    _links: [],

    /* ── Cached DOM refs ─────────────────────────── */
    _elLabel:  null,
    _elUrl:    null,
    _elSubmit: null,
    _elError:  null,
    _elList:   null,

    /* ── Task 8.1 — helpers and storage ─────────── */

    /**
     * Validates a label + URL pair.
     * @param {string} label
     * @param {string} url
     * @returns {string|null}  null = valid; string = error message
     */
    _validate: function (label, url) {
      var trimmedLabel = label ? label.trim() : '';
      var trimmedUrl   = url   ? url.trim()   : '';

      if (trimmedLabel.length === 0) {
        return 'Link label cannot be empty.';
      }
      if (trimmedLabel.length > 50) {
        return 'Link label must be 50 characters or fewer.';
      }
      if (trimmedUrl.length === 0) {
        return 'Link URL cannot be empty.';
      }
      if (trimmedUrl.length > 2048) {
        return 'Link URL must be 2048 characters or fewer.';
      }
      if (trimmedUrl.indexOf('http://') !== 0 && trimmedUrl.indexOf('https://') !== 0) {
        return 'Link URL must start with "http://" or "https://".';
      }
      return null;
    },

    /**
     * Reads links from StorageService.
     * Falls back to [] on null or parse failure, writes [] back.
     */
    _load: function () {
      var stored = StorageService.get('links');
      if (!Array.isArray(stored)) {
        this._links = [];
        StorageService.set('links', []);
      } else {
        this._links = stored;
      }
    },

    /**
     * Persists the in-memory link array to localStorage.
     * Calls _showStorageError on write failure.
     */
    _save: function () {
      var ok = StorageService.set('links', this._links);
      if (!ok) {
        this._showStorageError('Could not save links — storage is unavailable.');
      }
    },

    /* ── Task 8.3 — add/remove and render ────────── */

    /**
     * Generates a unique ID using crypto.randomUUID when
     * available, with a fallback for older environments.
     * @returns {string}
     */
    _generateId: function () {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return Date.now().toString() + Math.random().toString(36).slice(2);
    },

    /**
     * Adds a new link with the trimmed label and URL.
     * Returns an error string if the 20-link cap is reached,
     * otherwise returns null on success.
     * @param {string} label
     * @param {string} url
     * @returns {string|null}
     */
    _add: function (label, url) {
      if (this._links.length >= 20) {
        return 'Maximum of 20 links reached. Remove a link before adding a new one.';
      }
      var link = {
        id:    this._generateId(),
        label: label.trim(),
        url:   url.trim()
      };
      this._links.push(link);
      this._save();
      this._render();
      return null;
    },

    /**
     * Removes a link by ID.
     * @param {string} id
     */
    _remove: function (id) {
      this._links = this._links.filter(function (l) { return l.id !== id; });
      this._save();
      this._render();
    },

    /**
     * Clears and re-renders the entire links list.
     */
    _render: function () {
      if (!this._elList) return;
      this._elList.innerHTML = '';
      var self = this;
      this._links.forEach(function (link) {
        self._elList.appendChild(self._renderLink(link));
      });
    },

    /**
     * Builds and returns a card <div> for a single link.
     * Contains an open button (opens URL in new tab) and a
     * remove button.
     * @param {Object} link  { id, label, url }
     * @returns {HTMLDivElement}
     */
    _renderLink: function (link) {
      var self = this;
      var card = document.createElement('div');
      card.className = 'link-card';
      card.dataset.id = link.id;

      var btnOpen = document.createElement('button');
      btnOpen.type = 'button';
      btnOpen.className = 'btn btn--link-open';
      btnOpen.textContent = link.label;
      btnOpen.setAttribute('aria-label', 'Open ' + link.label + ' in new tab');
      btnOpen.addEventListener('click', function () {
        window.open(link.url, '_blank');
      });

      var btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btn btn--danger';
      btnRemove.textContent = '🗑';
      btnRemove.setAttribute('aria-label', 'Remove link: ' + link.label);
      btnRemove.addEventListener('click', function () {
        self._remove(link.id);
      });

      card.appendChild(btnOpen);
      card.appendChild(btnRemove);

      return card;
    },

    /**
     * Displays a storage-related error message.
     * @param {string} msg
     */
    _showStorageError: function (msg) {
      if (this._elError) {
        this._elError.textContent = msg;
      }
    },

    /**
     * Initialises the widget: caches DOM refs, loads persisted
     * links, renders them, and wires the add-link form.
     */
    init: function () {
      this._elLabel  = document.getElementById('link-label');
      this._elUrl    = document.getElementById('link-url');
      this._elSubmit = document.getElementById('link-submit');
      this._elError  = document.getElementById('link-error');
      this._elList   = document.getElementById('links-list');

      this._load();
      this._render();

      var self = this;
      var form = document.getElementById('link-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var label = self._elLabel.value;
          var url   = self._elUrl.value;

          var validationError = self._validate(label, url);
          if (validationError) {
            self._elError.textContent = validationError;
            return;
          }

          self._elError.textContent = '';
          var addError = self._add(label, url);
          if (addError) {
            self._elError.textContent = addError;
            return;
          }

          self._elLabel.value = '';
          self._elUrl.value   = '';
        });
      }
    }

  }; // end QuickLinks

  /* ─────────────────────────────────────────────
   * Bootstrap — call each widget's init() in order.
   * ───────────────────────────────────────────── */
  GreetingWidget.init();
  FocusTimer.init();
  TaskList.init();
  QuickLinks.init();

})();
