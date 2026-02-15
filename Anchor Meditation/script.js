// DOM Elements
const menuScreen = document.getElementById('menu-screen');
const sessionScreen = document.getElementById('session-screen');
const instructionText = document.getElementById('instruction-text');
const timeDisplay = document.getElementById('time-remaining');
const overtimeIndicator = document.getElementById('overtime-indicator');
const overtimeDisplay = document.getElementById('overtime-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const finishBtn = document.getElementById('finish-btn');
const exitBtn = document.getElementById('exit-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const durationInput = document.getElementById('duration-input');
const soundToggle = document.getElementById('sound-toggle');
const statsBtn = document.getElementById('stats-btn');
const statsOverlay = document.getElementById('stats-overlay');
const closeStatsBtn = document.getElementById('close-stats-btn');
const totalSessionsDisplay = document.getElementById('total-sessions');
const totalTimeDisplay = document.getElementById('total-time');

// App State
let currentLevel = 1;
let sessionDuration = 5 * 60; // 5 minutes in seconds
let timeRemaining = sessionDuration;
let timerInterval = null;
let isRunning = false;
let isPaused = false;
let isOvertime = false;
let overtimeSeconds = 0;
let soundEnabled = true;

// Data
const levelData = {
    1: {
        title: "Level 1: The Breath",
        instructions: "Sit or lie down. Close your eyes. Focus your entire attention on the physical sensation of your breath. Feel the air enter your nostrils, fill your lungs, and the subsequent fall of your chest. When your mind wanders, return your focus to the physical sensation of breathing."
    },
    2: {
        title: "Level 2: The Breath & Body",
        instructions: "Maintain your focus on the breath. Expand your awareness to the physical sensation of your body's weight. Feel the pull of gravity on your form. Notice the points of pressure where your body makes contact with the surface beneath you. Your mind is now anchored between the rhythm of your breath and the solid weight of your body."
    },
    3: {
        title: "Level 3: Material Existence",
        instructions: "Maintain your awareness of breath and body. Now, focus your attention internally to find your heart’s pulse. Locate the subtle, rhythmic beating in your chest, your wrist, or your neck. The more you meditate on this, the sensation will increase. Your entire focus is now held by three points: the rhythm of your breath, the existence of your body, and the beat of your own life. Do not waver attention."
    }
};

// Initialization
function init() {
    loadSettings();
    loadStats();
    setupEventListeners();
}

function setupEventListeners() {
    // Level Selection
    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            selectLevel(parseInt(card.dataset.level));
        });
    });

    // Controls
    startBtn.addEventListener('click', startSession);
    pauseBtn.addEventListener('click', pauseSession);
    resumeBtn.addEventListener('click', resumeSession);
    finishBtn.addEventListener('click', finishSession);
    exitBtn.addEventListener('click', exitSession);

    // Settings
    settingsBtn.addEventListener('click', () => {
        settingsOverlay.classList.remove('hidden');
        pauseSession(); // Auto-pause when opening settings
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
}

// Session Management
function selectLevel(level) {
    currentLevel = level;
    instructionText.textContent = levelData[level].instructions;

    // Transition UI
    menuScreen.classList.remove('active');
    setTimeout(() => {
        menuScreen.classList.add('hidden');
        sessionScreen.classList.remove('hidden');
        requestAnimationFrame(() => {
            sessionScreen.classList.add('active');
        });
    }, 500);

    resetTimerDisplay();
}

// Audio Context
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

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 3); // Frequency drop

    // Envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 3);
}

function startSession() {
    initAudio(); // Ensure audio is ready

    // Enter Fullscreen
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(console.log);
    }

    isRunning = true;
    isPaused = false;

    // Update Controls
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    finishBtn.classList.remove('hidden');

    // Add Visual Effects based on level
    if (currentLevel === 1 || currentLevel === 2) {
        document.body.classList.add('breathing-effect');
    } else if (currentLevel === 3) {
        document.body.classList.add('pulse-effect');
    }

    // Start Timer
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
        } else {
            // Timer Finished
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
    isPaused = true;

    pauseBtn.classList.add('hidden');
    resumeBtn.classList.remove('hidden');
}

function resumeSession() {
    if (!isRunning || !isPaused) return;

    timerInterval = setInterval(tick, 1000);
    isPaused = false;

    resumeBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
}

function finishSession() {
    clearInterval(timerInterval);

    // Save Session Data logic here...
    saveSessionData();

    exitSession();
}

function exitSession() {
    clearInterval(timerInterval);
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.log);
    }

    // Remove Visual Effects
    document.body.classList.remove('breathing-effect', 'pulse-effect');

    // UI Reset
    sessionScreen.classList.remove('active');
    setTimeout(() => {
        sessionScreen.classList.add('hidden');
        menuScreen.classList.remove('hidden');
        requestAnimationFrame(() => {
            menuScreen.classList.add('active');
        });
    }, 500);

    // Reset State
    isRunning = false;
    isPaused = false;
    isOvertime = false;
    overtimeSeconds = 0;

    // Reset Controls
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    resumeBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
    overtimeIndicator.classList.add('hidden');

    resetTimerDisplay();
}

// Helpers
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateDisplay() {
    timeDisplay.textContent = formatTime(timeRemaining);
    if (isOvertime) {
        overtimeDisplay.textContent = formatTime(overtimeSeconds);
    }
}

function resetTimerDisplay() {
    timeRemaining = sessionDuration;
    updateDisplay();
}

// Settings & Data
function loadSettings() {
    const savedDuration = localStorage.getItem('anchorDuration');
    if (savedDuration) {
        sessionDuration = parseInt(savedDuration) * 60;
        durationInput.value = savedDuration;
    }

    const savedSound = localStorage.getItem('anchorSound');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        soundToggle.checked = soundEnabled;
    }
}

function saveSettings() {
    const newDuration = parseInt(durationInput.value);
    if (newDuration > 0) {
        sessionDuration = newDuration * 60;
        localStorage.setItem('anchorDuration', newDuration);
        resetTimerDisplay();
    }

    soundEnabled = soundToggle.checked;
    localStorage.setItem('anchorSound', soundEnabled);
}

function saveSessionData() {
    const sessionTime = (sessionDuration - timeRemaining) + overtimeSeconds;
    // Don't save very short accidental starts
    if (sessionTime < 10) return;

    let totalSessions = parseInt(localStorage.getItem('anchorTotalSessions') || '0');
    let totalTime = parseInt(localStorage.getItem('anchorTotalTime') || '0');

    totalSessions++;
    totalTime += sessionTime;

    localStorage.setItem('anchorTotalSessions', totalSessions);
    localStorage.setItem('anchorTotalTime', totalTime);
}

function loadStats() {
    // Pre-load logic if needed
}

function updateStatsDisplay() {
    const totalSessions = localStorage.getItem('anchorTotalSessions') || '0';
    const totalTimeSeconds = parseInt(localStorage.getItem('anchorTotalTime') || '0');

    totalSessionsDisplay.textContent = totalSessions;

    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    totalTimeDisplay.textContent = `${hours}h ${minutes}m`;
}

// Run
init();
