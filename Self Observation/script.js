/* ═══════════════════════════════════════════════
   SELF OBSERVATION MEDITATION — Application Logic
   Sacred meditation text preserved exactly from source.
   ═══════════════════════════════════════════════ */

// ── DOM Elements ──
const $ = id => document.getElementById(id);

const menuScreen = $('menu-screen');
const sessionScreen = $('session-screen');
const sessionLevelLabel = $('session-level-label');
const instructionSteps = $('instruction-steps');
const timeDisplay = $('time-remaining');
const overtimeIndicator = $('overtime-indicator');
const overtimeDisplay = $('overtime-display');
const timerRingProgress = $('timer-ring-progress');
const observerRing = $('observer-ring');
const observerLabel = $('observer-label');
const observerGuide = $('observer-guide');

// Buttons
const startBtn = $('start-btn');
const pauseBtn = $('pause-btn');
const resumeBtn = $('resume-btn');
const finishBtn = $('finish-btn');
const exitBtn = $('exit-btn');
const settingsBtn = $('settings-btn');
const statsBtn = $('stats-btn');
const importBtn = $('import-btn');
const exportBtn = $('export-btn');
const importFileInput = $('import-file-input');

// Settings
const settingsOverlay = $('settings-overlay');
const closeSettingsBtn = $('close-settings-btn');
const durationInput = $('duration-input');
const soundToggle = $('sound-toggle');
const autoAdvanceToggle = $('auto-advance-toggle');

// Stats
const statsOverlay = $('stats-overlay');
const closeStatsBtn = $('close-stats-btn');
const resetStatsBtn = $('reset-stats-btn');
const confirmOverlay = $('confirm-overlay');
const confirmResetBtn = $('confirm-reset-btn');
const cancelResetBtn = $('cancel-reset-btn');

// Exit confirmation
const exitConfirmOverlay = $('exit-confirm-overlay');
const confirmExitBtn = $('confirm-exit-btn');
const cancelExitBtn = $('cancel-exit-btn');

// Intro/mastery toggles
const introExpandBtn = $('intro-expand-btn');
const introExpanded = $('intro-expanded');
const masteryToggle = $('mastery-toggle');
const masteryContent = $('mastery-content');

// ── Timer Ring Geometry ──
const RING_CIRCUMFERENCE = 2 * Math.PI * 90;
if (timerRingProgress) {
    timerRingProgress.style.strokeDasharray = RING_CIRCUMFERENCE;
    timerRingProgress.style.strokeDashoffset = 0;
}

// ── App State ──
let currentLevel = 1;
let sessionDuration = 5 * 60;
let timeRemaining = sessionDuration;
let timerInterval = null;
let isRunning = false;
let isPaused = false;
let isOvertime = false;
let overtimeSeconds = 0;
let soundEnabled = true;
let autoAdvance = true;

// Instruction state
let currentStepIndex = 0;
let stepAdvanceTimer = null;
const STEP_ADVANCE_DELAY = 12000;

// ── Storage key (unique to this app) ──
const STORAGE_KEY = 'selfObsData';

// ═══════════════════════════════════════════════
// SACRED MEDITATION DATA
// Preserved exactly from source: High Priest Hooded Cobra 666
// https://templeofzeus.org/Self_Observation_Meditation.php
// ═══════════════════════════════════════════════

const levelData = {
    1: {
        title: "Level 1: Thought Observation",
        label: "Thought Observation",
        steps: [
            "Maintain the state of the observer. You are not DOING, you are OBSERVING.",
            "Sit comfortably and close your eyes.",
            "For five minutes, observe your thoughts as they arise and pass.",
            "Do not engage, judge, or follow any thought. Watch them like clouds in the sky.",
            "Your only task is to be the silent, impartial observer."
        ]
    },
    2: {
        title: "Level 2: Emotional Observation",
        label: "Emotional Observation",
        steps: [
            "Maintain the state of the observer. You are not DOING, you are OBSERVING.",
            "Shift your focus from thoughts to feelings.",
            "For five minutes, observe your emotions as they arise and pass.",
            "Do not identify with any feeling. Note its presence (anger, joy, anxiety) and let it go without attachment."
        ]
    },
    3: {
        title: "Level 3: Desire Observation",
        label: "Desire Observation",
        steps: [
            "Maintain the state of the observer. You are not DOING, you are OBSERVING.",
            "Shift your focus to your lower abdomen.",
            "For five minutes, observe the raw impulses and desires that originate there.",
            "Do not act on or condemn any desire. Simply acknowledge any urge that arises, be it about food, or sex, or anything else, watching it rise and fade."
        ]
    }
};

const levelNames = {
    1: "Thoughts",
    2: "Emotions",
    3: "Desires"
};

// ── Initialization ──
function init() {
    loadSettings();
    updateCardStats();
    setupEventListeners();
}

function setupEventListeners() {
    // Level selection
    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            selectLevel(parseInt(card.dataset.level));
        });
    });

    // Session controls
    startBtn.addEventListener('click', startSession);
    pauseBtn.addEventListener('click', pauseSession);
    resumeBtn.addEventListener('click', resumeSession);
    finishBtn.addEventListener('click', finishSession);

    // Exit with confirmation
    exitBtn.addEventListener('click', handleExitClick);
    confirmExitBtn.addEventListener('click', () => {
        exitConfirmOverlay.classList.add('hidden');
        exitSession();
    });
    cancelExitBtn.addEventListener('click', () => {
        exitConfirmOverlay.classList.add('hidden');
    });

    // Settings
    settingsBtn.addEventListener('click', () => {
        settingsOverlay.classList.remove('hidden');
        if (isRunning && !isPaused) pauseSession();
    });
    closeSettingsBtn.addEventListener('click', () => {
        saveSettings();
        settingsOverlay.classList.add('hidden');
    });

    // Stats
    statsBtn.addEventListener('click', () => {
        updateStatsDisplay();
        statsOverlay.classList.remove('hidden');
    });
    closeStatsBtn.addEventListener('click', () => {
        statsOverlay.classList.add('hidden');
    });

    // Reset data
    resetStatsBtn.addEventListener('click', () => {
        confirmOverlay.classList.remove('hidden');
    });
    confirmResetBtn.addEventListener('click', () => {
        resetAllData();
        confirmOverlay.classList.add('hidden');
        updateStatsDisplay();
        updateCardStats();
        showToast('All data has been reset.');
    });
    cancelResetBtn.addEventListener('click', () => {
        confirmOverlay.classList.add('hidden');
    });

    // Import / Export
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);

    // Intro/Mastery toggles
    introExpandBtn.addEventListener('click', () => {
        introExpanded.classList.toggle('hidden');
        introExpandBtn.classList.toggle('expanded');
        introExpandBtn.querySelector('span').textContent =
            introExpanded.classList.contains('hidden') ? 'Read more' : 'Read less';
    });

    masteryToggle.addEventListener('click', () => {
        masteryContent.classList.toggle('hidden');
        masteryToggle.classList.toggle('expanded');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
    if (!sessionScreen.classList.contains('active')) return;
    if (!settingsOverlay.classList.contains('hidden')) return;
    if (!exitConfirmOverlay.classList.contains('hidden')) return;

    switch (e.code) {
        case 'Space':
            e.preventDefault();
            if (!isRunning) {
                startSession();
            } else if (isPaused) {
                resumeSession();
            } else {
                pauseSession();
            }
            break;
        case 'Escape':
            e.preventDefault();
            handleExitClick();
            break;
    }
}

function handleExitClick() {
    if (isRunning) {
        if (!isPaused) pauseSession();
        exitConfirmOverlay.classList.remove('hidden');
    } else {
        exitSession();
    }
}

// ── Screen Transitions ──
function selectLevel(level) {
    currentLevel = level;
    sessionLevelLabel.textContent = levelData[level].title;

    buildInstructionSteps(level);

    menuScreen.classList.remove('active');
    setTimeout(() => {
        menuScreen.classList.add('hidden');
        sessionScreen.classList.remove('hidden');
        requestAnimationFrame(() => {
            sessionScreen.classList.add('active');
        });
    }, 500);

    resetTimerDisplay();
    observerRing.classList.remove('active');
    observerLabel.textContent = 'observe';
}

function buildInstructionSteps(level) {
    const steps = levelData[level].steps;
    instructionSteps.innerHTML = '';
    currentStepIndex = 0;

    steps.forEach((text, i) => {
        const div = document.createElement('div');
        div.className = 'instruction-step visible';
        div.textContent = text;
        if (i === 0) {
            div.classList.add('active');
        }
        instructionSteps.appendChild(div);
    });
}

// ── Audio ──
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBellSound() {
    if (!audioCtx) initAudio();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 3);

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 3);
}

// ── Session Flow ──
function startSession() {
    initAudio();

    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
    }

    isRunning = true;
    isPaused = false;
    isOvertime = false;
    overtimeSeconds = 0;

    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    finishBtn.classList.remove('hidden');

    // Activate the observer visual
    observerRing.classList.add('active');
    observerLabel.textContent = 'observe';

    if (autoAdvance) {
        startStepAdvance();
    }

    timerInterval = setInterval(tick, 1000);
}

function tick() {
    if (isOvertime) {
        overtimeSeconds++;
        updateDisplay();
    } else {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateDisplay();
            updateTimerRing();
        } else {
            handleTimerComplete();
        }
    }
}

function handleTimerComplete() {
    if (soundEnabled) {
        playBellSound();
    }
    isOvertime = true;
    overtimeSeconds = 0;
    timeRemaining = 0;
    overtimeIndicator.classList.remove('hidden');
    updateDisplay();
}

function pauseSession() {
    if (!isRunning || isPaused) return;

    clearInterval(timerInterval);
    clearTimeout(stepAdvanceTimer);
    isPaused = true;

    pauseBtn.classList.add('hidden');
    resumeBtn.classList.remove('hidden');

    observerRing.classList.remove('active');
}

function resumeSession() {
    if (!isRunning || !isPaused) return;

    timerInterval = setInterval(tick, 1000);
    isPaused = false;

    resumeBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');

    observerRing.classList.add('active');

    if (autoAdvance && currentStepIndex < levelData[currentLevel].steps.length - 1) {
        startStepAdvance();
    }
}

function finishSession() {
    clearInterval(timerInterval);
    clearTimeout(stepAdvanceTimer);

    saveSessionData();
    exitSession();
}

function exitSession() {
    clearInterval(timerInterval);
    clearTimeout(stepAdvanceTimer);

    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
    }

    sessionScreen.classList.remove('active');
    setTimeout(() => {
        sessionScreen.classList.add('hidden');
        menuScreen.classList.remove('hidden');
        requestAnimationFrame(() => {
            menuScreen.classList.add('active');
        });
    }, 500);

    isRunning = false;
    isPaused = false;
    isOvertime = false;
    overtimeSeconds = 0;

    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
    overtimeIndicator.classList.add('hidden');

    observerRing.classList.remove('active');
    resetTimerDisplay();
    updateCardStats();
}

// ── Step-by-Step Instructions ──
function startStepAdvance() {
    clearTimeout(stepAdvanceTimer);
    if (currentStepIndex >= levelData[currentLevel].steps.length - 1) return;

    stepAdvanceTimer = setTimeout(() => {
        advanceStep();
        if (currentStepIndex < levelData[currentLevel].steps.length - 1) {
            startStepAdvance();
        }
    }, STEP_ADVANCE_DELAY);
}

function advanceStep() {
    const steps = instructionSteps.querySelectorAll('.instruction-step');
    if (currentStepIndex >= steps.length - 1) return;

    steps[currentStepIndex].classList.remove('active');
    steps[currentStepIndex].classList.add('past');

    currentStepIndex++;
    steps[currentStepIndex].classList.add('visible', 'active');
}

// ── Timer Display ──
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function formatDuration(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(timeRemaining);
    if (isOvertime) {
        overtimeDisplay.textContent = formatTime(overtimeSeconds);
    }
}

function updateTimerRing() {
    if (sessionDuration <= 0) return;
    const progress = timeRemaining / sessionDuration;
    const offset = RING_CIRCUMFERENCE * (1 - progress);
    timerRingProgress.style.strokeDashoffset = offset;
}

function resetTimerDisplay() {
    timeRemaining = sessionDuration;
    updateDisplay();
    if (timerRingProgress) {
        timerRingProgress.style.strokeDashoffset = 0;
    }
}

// ── Settings & Persistence ──
function loadSettings() {
    const savedDuration = localStorage.getItem('selfObsDuration');
    if (savedDuration) {
        sessionDuration = parseInt(savedDuration) * 60;
        durationInput.value = savedDuration;
    }

    const savedSound = localStorage.getItem('selfObsSound');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        soundToggle.checked = soundEnabled;
    }

    const savedAutoAdvance = localStorage.getItem('selfObsAutoAdvance');
    if (savedAutoAdvance !== null) {
        autoAdvance = savedAutoAdvance === 'true';
        autoAdvanceToggle.checked = autoAdvance;
    }
}

function saveSettings() {
    const newDuration = parseInt(durationInput.value);
    if (newDuration > 0) {
        sessionDuration = newDuration * 60;
        localStorage.setItem('selfObsDuration', newDuration);
        if (!isRunning) resetTimerDisplay();
    }

    soundEnabled = soundToggle.checked;
    localStorage.setItem('selfObsSound', soundEnabled);

    autoAdvance = autoAdvanceToggle.checked;
    localStorage.setItem('selfObsAutoAdvance', autoAdvance);
}

// ═══════════════════════════════════════════════
// SESSION DATA — Comprehensive Tracking
// ═══════════════════════════════════════════════

function saveSessionData() {
    const sessionTime = (sessionDuration - timeRemaining) + overtimeSeconds;
    if (sessionTime < 10) return;

    const data = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    data.totalSessions++;
    data.totalTime += sessionTime;
    data.lastSessionDate = today;

    if (!data.levels[currentLevel]) {
        data.levels[currentLevel] = { sessions: 0, time: 0, lastPracticed: null };
    }
    data.levels[currentLevel].sessions++;
    data.levels[currentLevel].time += sessionTime;
    data.levels[currentLevel].lastPracticed = today;

    // Streak calculation
    if (data.streakLastDate) {
        const lastDate = new Date(data.streakLastDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Same day
        } else if (diffDays === 1) {
            data.streak++;
        } else {
            data.streak = 1;
        }
    } else {
        data.streak = 1;
    }
    data.streakLastDate = today;

    if (!data.history) data.history = [];
    data.history.unshift({
        level: currentLevel,
        duration: sessionTime,
        date: now
    });
    if (data.history.length > 50) {
        data.history = data.history.slice(0, 50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStoredData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const data = JSON.parse(raw);
            if (!data.levels) data.levels = {};
            if (!data.totalSessions) data.totalSessions = 0;
            if (!data.totalTime) data.totalTime = 0;
            if (!data.streak) data.streak = 0;
            if (!data.history) data.history = [];
            return data;
        } catch {
            return createEmptyData();
        }
    }
    return createEmptyData();
}

function createEmptyData() {
    return {
        totalSessions: 0,
        totalTime: 0,
        levels: {},
        streak: 0,
        streakLastDate: null,
        lastSessionDate: null,
        history: []
    };
}

function resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
}

// ═══════════════════════════════════════════════
// STATS DISPLAY
// ═══════════════════════════════════════════════

function updateStatsDisplay() {
    const data = getStoredData();

    if (data.streakLastDate) {
        const lastDate = new Date(data.streakLastDate);
        const today = new Date();
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
            data.streak = 0;
        }
    }

    $('total-sessions').textContent = data.totalSessions;
    $('total-time').textContent = formatDuration(data.totalTime);
    $('current-streak').textContent = data.streak;

    if (data.lastSessionDate) {
        const today = new Date().toISOString().split('T')[0];
        if (data.lastSessionDate === today) {
            $('last-session').textContent = 'Today';
        } else {
            $('last-session').textContent = formatDate(data.lastSessionDate);
        }
    } else {
        $('last-session').textContent = '—';
    }

    for (let l = 1; l <= 3; l++) {
        const lvl = data.levels[l] || { sessions: 0, time: 0, lastPracticed: null };
        $(`level${l}-sessions`).textContent = lvl.sessions;
        $(`level${l}-time`).textContent = formatDuration(lvl.time);
        $(`level${l}-last`).textContent = lvl.lastPracticed ? formatDate(lvl.lastPracticed) : '—';
    }

    renderSessionHistory(data.history || []);
}

function updateCardStats() {
    const data = getStoredData();
    for (let l = 1; l <= 3; l++) {
        const lvl = data.levels[l] || { sessions: 0, time: 0 };
        const sessEl = $(`card-sessions-${l}`);
        const timeEl = $(`card-time-${l}`);
        if (sessEl) {
            sessEl.textContent = `${lvl.sessions} session${lvl.sessions !== 1 ? 's' : ''}`;
        }
        if (timeEl) {
            timeEl.textContent = formatDuration(lvl.time);
        }
    }
}

function renderSessionHistory(history) {
    const container = $('session-history');
    if (!history || history.length === 0) {
        container.innerHTML = '<p class="empty-history">No sessions recorded yet.</p>';
        return;
    }

    let html = '';
    const items = history.slice(0, 15);
    items.forEach(entry => {
        const lvlName = levelNames[entry.level] || `Level ${entry.level}`;
        const dur = formatDuration(entry.duration);
        const date = formatDateTime(entry.date);
        html += `<div class="history-entry">
            <span class="h-level">${lvlName}</span>
            <span class="h-duration">${dur}</span>
            <span class="h-date">${date}</span>
        </div>`;
    });

    container.innerHTML = html;
}

function formatDate(dateStr) {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatDateTime(isoStr) {
    try {
        const d = new Date(isoStr);
        const today = new Date().toISOString().split('T')[0];
        const dateStr = d.toISOString().split('T')[0];
        const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        if (dateStr === today) return `Today ${time}`;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateStr === yesterday.toISOString().split('T')[0]) return `Yesterday ${time}`;

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` ${time}`;
    } catch {
        return '—';
    }
}

// ═══════════════════════════════════════════════
// IMPORT / EXPORT
// ═══════════════════════════════════════════════

function exportData() {
    const data = getStoredData();

    const exportPayload = {
        _app: 'SelfObservationMeditation',
        _version: 1,
        _exportedAt: new Date().toISOString(),
        ...data
    };

    const json = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `self-observation-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data exported successfully.');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const imported = JSON.parse(evt.target.result);

            if (imported._app !== 'SelfObservationMeditation' && !imported.totalSessions && imported.totalSessions !== 0) {
                showToast('Invalid file format.');
                return;
            }

            delete imported._app;
            delete imported._version;
            delete imported._exportedAt;

            if (!imported.levels) imported.levels = {};
            if (!imported.totalSessions) imported.totalSessions = 0;
            if (!imported.totalTime) imported.totalTime = 0;
            if (!imported.streak) imported.streak = 0;
            if (!imported.history) imported.history = [];

            localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));

            updateCardStats();
            showToast(`Imported: ${imported.totalSessions} sessions, ${formatDuration(imported.totalTime)} total.`);
        } catch (err) {
            showToast('Failed to import: invalid JSON.');
        }
    };

    reader.readAsText(file);
    importFileInput.value = '';
}

// ── Toast ──
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ── Run ──
init();
