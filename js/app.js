/* Life Dashboard — app.js */

(function () {

  /* ─────────────────────────────────────────────
   * StorageService
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
   * ThemeService
   * ───────────────────────────────────────────── */
  var ThemeService = {
    _DARK:  'dark',
    _LIGHT: 'light',
    _KEY:   'theme',

    current: function () {
      return document.documentElement.getAttribute('data-theme') || this._DARK;
    },

    apply: function (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      StorageService.set(this._KEY, theme);
      this._updateBtn();
    },

    toggle: function () {
      this.apply(this.current() === this._DARK ? this._LIGHT : this._DARK);
    },

    _updateBtn: function () {
      var isDark = this.current() === this._DARK;
      var btn   = document.getElementById('theme-toggle');
      var icon  = document.getElementById('theme-icon');
      var label = document.getElementById('theme-label');
      if (icon)  icon.textContent  = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
      if (label) label.textContent = isDark ? 'Light mode' : 'Dark mode';
      if (btn)   btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    },

    init: function () {
      /* Restore saved preference */
      var saved = StorageService.get(this._KEY);
      if (saved === this._LIGHT || saved === this._DARK) {
        document.documentElement.setAttribute('data-theme', saved);
      }

      var self = this;
      var btn  = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', function () {
          self.toggle();
        });
      }
      this._updateBtn();
    }
  };

  /* ─────────────────────────────────────────────
   * GreetingWidget
   * ───────────────────────────────────────────── */
  var GreetingWidget = {
    _elGreeting: null,
    _elTime:     null,
    _elDate:     null,
    _name:       '',

    _WEEKDAYS: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    _MONTHS:   ['January','February','March','April','May','June',
                'July','August','September','October','November','December'],

    _formatTime: function (date) {
      return String(date.getHours()).padStart(2, '0') + ':' +
             String(date.getMinutes()).padStart(2, '0') + ':' +
             String(date.getSeconds()).padStart(2, '0');
    },

    _formatDate: function (date) {
      return this._WEEKDAYS[date.getDay()] + ', ' +
             this._MONTHS[date.getMonth()] + ' ' +
             String(date.getDate()).padStart(2, '0') + ', ' +
             date.getFullYear();
    },

    _greeting: function (hour) {
      if (hour >= 5  && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      return 'Good Evening';
    },

    _greetingText: function (hour) {
      var base = this._greeting(hour);
      return this._name ? base + ', ' + this._name + '!' : base;
    },

    _showSaveFeedback: function () {
      var btn = document.getElementById('name-save');
      if (!btn) return;
      var original = btn.textContent;
      btn.textContent = 'Saved!';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
      }, 1500);
    },

    init: function () {
      this._elGreeting = document.getElementById('greeting-text');
      this._elTime     = document.getElementById('clock-time');
      this._elDate     = document.getElementById('clock-date');

      /* Restore saved name */
      var savedName = StorageService.get('userName');
      if (typeof savedName === 'string' && savedName.trim().length > 0) {
        this._name = savedName.trim();
      }

      var nameInput = document.getElementById('name-input');
      if (nameInput && this._name) {
        nameInput.value = this._name;
      }

      var self    = this;
      var nameBtn = document.getElementById('name-save');

      if (nameBtn && nameInput) {
        nameBtn.addEventListener('click', function () {
          var val = nameInput.value.trim();
          self._name = val;
          StorageService.set('userName', val);
          self._tick();
          self._showSaveFeedback();
        });
        nameInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { nameBtn.click(); }
        });
      }

      this._tick();
      setInterval(this._tick.bind(this), 1000);
    },

    _tick: function () {
      try {
        var now = new Date();
        if (isNaN(now.getTime())) throw new Error('Invalid Date');
        if (this._elGreeting) this._elGreeting.textContent = this._greetingText(now.getHours());
        if (this._elTime)     this._elTime.textContent     = this._formatTime(now);
        if (this._elDate)     this._elDate.textContent     = this._formatDate(now);
      } catch (e) {
        this._handleClockError();
      }
    },

    _handleClockError: function () {
      if (this._elGreeting) this._elGreeting.textContent = 'Time unavailable';
      if (this._elTime)     this._elTime.textContent     = '--:--:--';
      if (this._elDate)     this._elDate.textContent     = 'Date unavailable';
    }
  };

  /* ─────────────────────────────────────────────
   * FocusTimer
   * ───────────────────────────────────────────── */
  var FocusTimer = {
    _state:       'idle',
    _remaining:   1500,
    _intervalId:  null,
    _tickStart:   null,
    _sessionSecs: 1500,

    _elDisplay:  null,
    _elStart:    null,
    _elStop:     null,
    _elReset:    null,
    _elAnnounce: null,
    _elDuration: null,

    _start: function () {
      if (this._state !== 'idle' && this._state !== 'paused') return;
      if (this._state === 'idle') {
        this._remaining = this._sessionSecs;
      }
      this._state     = 'running';
      this._tickStart = Date.now();
      clearInterval(this._intervalId);
      this._intervalId = setInterval(this._tick.bind(this), 1000);
      this._render();
    },

    _stop: function () {
      if (this._state !== 'running') return;
      this._state = 'paused';
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._render();
    },

    _reset: function () {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this._state      = 'idle';
      this._remaining  = this._sessionSecs;
      this._render();
    },

    _tick: function () {
      var elapsed = Math.round((Date.now() - this._tickStart) / 1000);
      this._tickStart = Date.now();
      if (elapsed < 1) elapsed = 1;
      this._remaining -= elapsed;

      if (this._remaining <= 0) {
        clearInterval(this._intervalId);
        this._intervalId = null;
        this._playSignal();
        if (this._elAnnounce) {
          this._elAnnounce.textContent = 'Focus session complete!';
          var self = this;
          setTimeout(function () { self._elAnnounce.textContent = ''; }, 5000);
        }
        this._state     = 'idle';
        this._remaining = this._sessionSecs;
        this._render();
        return;
      }
      this._render();
    },

    _formatMM_SS: function (s) {
      var minutes = Math.floor(s / 60);
      var seconds = s % 60;
      return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    },

    _render: function () {
      if (this._elDisplay) {
        this._elDisplay.textContent = this._formatMM_SS(this._remaining);
      }
      var isRunning = this._state === 'running';
      this._setBtn(this._elStart, isRunning);
      this._setBtn(this._elStop,  !isRunning);
      this._setBtn(this._elReset, false);
      if (this._elDuration) {
        this._elDuration.disabled = (this._state !== 'idle');
      }
    },

    _setBtn: function (btn, disabled) {
      if (!btn) return;
      btn.disabled = disabled;
      btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    },

    _playSignal: function () {
      try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ctx  = new AudioCtx();
        var osc  = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
        osc.onended = function () { ctx.close(); };
      } catch (e) { /* non-critical */ }
    },

    init: function () {
      this._elDisplay  = document.getElementById('timer-display');
      this._elStart    = document.getElementById('btn-start');
      this._elStop     = document.getElementById('btn-stop');
      this._elReset    = document.getElementById('btn-reset');
      this._elAnnounce = document.getElementById('timer-announcement');
      this._elDuration = document.getElementById('timer-duration');

      var savedMins = StorageService.get('timerDuration');
      if (typeof savedMins === 'number' && savedMins >= 1 && savedMins <= 60) {
        this._sessionSecs = savedMins * 60;
        this._remaining   = this._sessionSecs;
        if (this._elDuration) this._elDuration.value = savedMins;
      }

      var self = this;
      if (this._elDuration) {
        this._elDuration.addEventListener('change', function () {
          if (self._state !== 'idle') return;
          var mins = parseInt(this.value, 10);
          if (isNaN(mins) || mins < 1) mins = 1;
          if (mins > 60)               mins = 60;
          this.value        = mins;
          self._sessionSecs = mins * 60;
          self._remaining   = self._sessionSecs;
          StorageService.set('timerDuration', mins);
          self._render();
        });
      }

      if (this._elStart) this._elStart.addEventListener('click', this._start.bind(this));
      if (this._elStop)  this._elStop.addEventListener('click',  this._stop.bind(this));
      if (this._elReset) this._elReset.addEventListener('click', this._reset.bind(this));

      this._render();
    }
  };

  /* ─────────────────────────────────────────────
   * TaskList
   * ───────────────────────────────────────────── */
  var TaskList = {
    _tasks:    [],
    _elInput:  null,
    _elError:  null,
    _elList:   null,

    _validate: function (title) {
      if (!title || title.trim().length === 0) return 'Task title cannot be empty.';
      if (title.trim().length > 200)           return 'Task title must be 200 characters or fewer.';
      return null;
    },

    _load: function () {
      var stored = StorageService.get('tasks');
      this._tasks = Array.isArray(stored) ? stored : [];
      if (!Array.isArray(stored)) StorageService.set('tasks', []);
    },

    _save: function () {
      var ok = StorageService.set('tasks', this._tasks);
      if (!ok && this._elError) this._elError.textContent = 'Could not save — storage unavailable.';
    },

    _genId: function () {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    _add: function (title) {
      this._tasks.push({ id: this._genId(), title: title.trim(), complete: false });
      this._save();
      this._render();
    },

    _delete: function (id) {
      this._tasks = this._tasks.filter(function (t) { return t.id !== id; });
      this._save();
      this._render();
    },

    _toggleComplete: function (id) {
      var task = this._tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.complete = !task.complete;
      this._save();
      this._render();
    },

    _startEdit: function (id) {
      this._tasks.forEach(function (t) { t.editing = (t.id === id); });
      this._render();
    },

    _confirmEdit: function (id, newTitle) {
      var task = this._tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.editing = false;
      if (!newTitle || newTitle.trim().length === 0) {
        this._render();
        return;
      }
      task.title = newTitle.trim();
      this._save();
      this._render();
    },

    _cancelEdit: function (id) {
      var task = this._tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.editing = false;
      this._render();
    },

    _render: function () {
      if (!this._elList) return;
      this._elList.innerHTML = '';
      var self = this;
      this._tasks.forEach(function (task) {
        self._elList.appendChild(self._renderItem(task));
      });
    },

    _renderItem: function (task) {
      var self = this;
      var li   = document.createElement('li');
      li.className  = 'task' + (task.complete ? ' task--complete' : '');
      li.dataset.id = task.id;

      if (task.editing) {
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
        btnConfirm.addEventListener('click', function () { self._confirmEdit(task.id, input.value); });

        var btnCancel = document.createElement('button');
        btnCancel.type      = 'button';
        btnCancel.className = 'btn btn--ghost';
        btnCancel.textContent = 'Cancel';
        btnCancel.addEventListener('click', function () { self._cancelEdit(task.id); });

        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter')  self._confirmEdit(task.id, input.value);
          if (e.key === 'Escape') self._cancelEdit(task.id);
        });

        li.appendChild(input);
        li.appendChild(btnConfirm);
        li.appendChild(btnCancel);
        setTimeout(function () { input.focus(); }, 0);

      } else {
        var span    = document.createElement('span');
        span.className   = 'task__title';
        span.textContent = task.title;

        var btnToggle = document.createElement('button');
        btnToggle.type      = 'button';
        btnToggle.className = 'btn btn--ghost';
        btnToggle.textContent = task.complete ? '\u21A9' : '\u2713';
        btnToggle.setAttribute('aria-label', (task.complete ? 'Mark incomplete' : 'Mark complete') + ': ' + task.title);
        btnToggle.addEventListener('click', function () { self._toggleComplete(task.id); });

        var btnEdit = document.createElement('button');
        btnEdit.type      = 'button';
        btnEdit.className = 'btn btn--ghost';
        btnEdit.textContent = '\u270F\uFE0F';
        btnEdit.setAttribute('aria-label', 'Edit task: ' + task.title);
        btnEdit.addEventListener('click', function () { self._startEdit(task.id); });

        var btnDelete = document.createElement('button');
        btnDelete.type      = 'button';
        btnDelete.className = 'btn btn--danger';
        btnDelete.textContent = '\uD83D\uDDD1\uFE0F';
        btnDelete.setAttribute('aria-label', 'Delete task: ' + task.title);
        btnDelete.addEventListener('click', function () { self._delete(task.id); });

        li.appendChild(span);
        li.appendChild(btnToggle);
        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
      }
      return li;
    },

    init: function () {
      this._elInput = document.getElementById('task-input');
      this._elError = document.getElementById('task-error');
      this._elList  = document.getElementById('task-list');

      this._load();
      this._render();

      var self = this;
      var form = document.getElementById('task-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var title = self._elInput ? self._elInput.value : '';
          var error = self._validate(title);
          if (error) {
            if (self._elError) self._elError.textContent = error;
            return;
          }
          if (self._elError) self._elError.textContent = '';
          self._add(title);
          if (self._elInput) self._elInput.value = '';
        });
      }
    }
  };

  /* ─────────────────────────────────────────────
   * QuickLinks
   * ───────────────────────────────────────────── */
  var QuickLinks = {
    _links:    [],
    _elLabel:  null,
    _elUrl:    null,
    _elError:  null,
    _elList:   null,

    _validate: function (label, url) {
      var tl = label ? label.trim() : '';
      var tu = url   ? url.trim()   : '';
      if (tl.length === 0)  return 'Link label cannot be empty.';
      if (tl.length > 50)   return 'Link label must be 50 characters or fewer.';
      if (tu.length === 0)  return 'Link URL cannot be empty.';
      if (tu.length > 2048) return 'Link URL must be 2048 characters or fewer.';
      if (tu.indexOf('http://') !== 0 && tu.indexOf('https://') !== 0)
        return 'URL must start with "http://" or "https://".';
      return null;
    },

    _load: function () {
      var stored = StorageService.get('links');
      this._links = Array.isArray(stored) ? stored : [];
      if (!Array.isArray(stored)) StorageService.set('links', []);
    },

    _save: function () {
      var ok = StorageService.set('links', this._links);
      if (!ok && this._elError) this._elError.textContent = 'Could not save — storage unavailable.';
    },

    _genId: function () {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    _add: function (label, url) {
      if (this._links.length >= 20) {
        return 'Maximum 20 links reached. Remove one before adding more.';
      }
      this._links.push({ id: this._genId(), label: label.trim(), url: url.trim() });
      this._save();
      this._render();
      return null;
    },

    _remove: function (id) {
      this._links = this._links.filter(function (l) { return l.id !== id; });
      this._save();
      this._render();
    },

    _render: function () {
      if (!this._elList) return;
      this._elList.innerHTML = '';
      var self = this;
      this._links.forEach(function (link) {
        self._elList.appendChild(self._renderLink(link));
      });
    },

    _renderLink: function (link) {
      var self = this;
      var card = document.createElement('div');
      card.className  = 'link-card';
      card.dataset.id = link.id;

      var btnOpen = document.createElement('button');
      btnOpen.type      = 'button';
      btnOpen.className = 'btn btn--link-open';
      btnOpen.textContent = link.label;
      btnOpen.setAttribute('aria-label', 'Open ' + link.label + ' in new tab');
      btnOpen.addEventListener('click', function () { window.open(link.url, '_blank', 'noopener,noreferrer'); });

      var btnRemove = document.createElement('button');
      btnRemove.type      = 'button';
      btnRemove.className = 'btn btn--danger';
      btnRemove.textContent = '\uD83D\uDDD1\uFE0F';
      btnRemove.setAttribute('aria-label', 'Remove link: ' + link.label);
      btnRemove.addEventListener('click', function () { self._remove(link.id); });

      card.appendChild(btnOpen);
      card.appendChild(btnRemove);
      return card;
    },

    init: function () {
      this._elLabel = document.getElementById('link-label');
      this._elUrl   = document.getElementById('link-url');
      this._elError = document.getElementById('link-error');
      this._elList  = document.getElementById('links-list');

      this._load();
      this._render();

      var self = this;
      var form = document.getElementById('link-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var label = self._elLabel ? self._elLabel.value : '';
          var url   = self._elUrl   ? self._elUrl.value   : '';
          var err   = self._validate(label, url);
          if (err) {
            if (self._elError) self._elError.textContent = err;
            return;
          }
          if (self._elError) self._elError.textContent = '';
          var addErr = self._add(label, url);
          if (addErr) {
            if (self._elError) self._elError.textContent = addErr;
            return;
          }
          if (self._elLabel) self._elLabel.value = '';
          if (self._elUrl)   self._elUrl.value   = '';
        });
      }
    }
  };

  /* ─────────────────────────────────────────────
   * Bootstrap — wait for DOM to be fully ready
   * ───────────────────────────────────────────── */
  function bootstrap() {
    ThemeService.init();
    GreetingWidget.init();
    FocusTimer.init();
    TaskList.init();
    QuickLinks.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
