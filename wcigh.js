var dark;
let matched = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (matched) {
    darkMode();
} else {
    lightMode();
}

// Handles toggling between Dark and Light Mode
function toggle() {
    if (dark) {
        document.getElementById("darkMode").innerText = "DarkMode";
        lightMode();
    } else {
        document.getElementById("darkMode").innerText = "LightMode";
        darkMode();
    }
}

// Does the necessary switching of element colors to Dark
function darkMode() {
    document.getElementById("clockOut").style.color = "cyan";
    document.getElementById("webpage").style.color = "#82EC5A";
    document.getElementById("file").style.color = "#82EC5A";
    document.getElementById("settingsToggle").style.color = "#82EC5A";
    document.getElementById("help").style.color = "#82EC5A";
    document.body.className = "dark-mode";
    dark = true;
}

// Does the necessary switching of element colors to Light
function lightMode() {
    document.getElementById("clockOut").style.color = "#008DFF";
    document.getElementById("webpage").style.color = "#3A940E";
    document.getElementById("file").style.color = "#3A940E";
    document.getElementById("settingsToggle").style.color = "#3A940E";
    document.getElementById("help").style.color = "#3A940E";
    document.body.className = "light-mode";
    dark = false;
}

// Timer state
var timer;
var totalSeconds;

// Cache DOM references
const startTime = document.getElementById("startTime");
const lunchStart = document.getElementById("lunchStart");
const lunchEnd = document.getElementById("lunchEnd");
const shiftTime = document.getElementById("shiftTime");
const clockOutSpan = document.getElementById("clockOut");
const timeRemaining = document.getElementById("timeRemaining");
const noLunch = document.getElementById("noLunch");

// Notification state — tracks which alerts have already fired this session
// Resets whenever logic() recalculates (i.e. inputs changed)
const notifFired = { lunchWarn: false, lunchClose: false, shiftWarn: false, shiftEnd: false };

// Request browser notification permission as early as possible
if (Notification.permission === 'default') Notification.requestPermission();


// Listeners: recalculate whenever any input changes
window.addEventListener('keydown', function (e) { if (e.key === 'r') logic(); }, false);
startTime.addEventListener("input", function () { updateLunchTimes(); logic(); }, false);
lunchStart.addEventListener("input", function () {
    noLunch.checked = false;
    document.getElementById("lunchText").innerText = "No Lunch Today?";
    logic();
}, false);
lunchEnd.addEventListener("input", function () {
    noLunch.checked = false;
    document.getElementById("lunchText").innerText = "No Lunch Today?";
    logic();
}, false);
shiftTime.addEventListener("input", function () {
    const hrs = parseFloat(shiftTime.value);
    if (!isNaN(hrs)) {
        const shouldBeNoLunch = hrs <= 5;
        if (noLunch.checked !== shouldBeNoLunch) {
            noLunch.checked = shouldBeNoLunch;
            noLunchFunc();
        }
    }
    logic();
}, false);
noLunch.addEventListener("input", function () { noLunchFunc(); logic(); }, false);

// "N" key: toggle No Lunch checkbox (its own listener fires noLunchFunc + logic)
window.addEventListener('keydown', function (e) { if (e.key === 'n') noLunch.click(); }, false);

// "C" key: fill focused time input with current time, then recalculate
window.addEventListener('keydown', function (e) {
    if (e.key === 'c' || e.key === 'C') {
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            el.value = hh + ":" + mm;
            if (el === startTime) updateLunchTimes();
            logic();
        }
    }
}, false);

// Recalculates clock-out time and restarts the countdown interval
function logic() {
    clearInterval(timer);
    // Reset notification state whenever inputs change so alerts re-arm
    notifFired.lunchWarn = false;
    notifFired.lunchClose = false;
    notifFired.shiftWarn = false;
    notifFired.shiftEnd = false;

    totalSeconds = timeValue(startTime.value)
        + (timeValue(lunchEnd.value) - timeValue(lunchStart.value))
        + (shiftTime.value * 3600);
    clockOutSpan.innerText = timeString(totalSeconds);

    const now = currentTime();
    const secondsLeft = totalSeconds - now;
    if (secondsLeft > 0) {
        timeRemaining.innerText = remaining(secondsLeft);
        timer = setInterval(function () {
            const left = totalSeconds - currentTime();
            if (left <= 0) {
                clearInterval(timer);
                timeRemaining.innerText = "0:00:00";
                checkNotifications(0);
            } else {
                timeRemaining.innerText = remaining(left);
                checkNotifications(left);
            }
        }, 1000);
    } else {
        timeRemaining.innerText = "0:00:00";
    }
}

// Sets lunch start to startTime+5h and lunch end to startTime+5.5h
function updateLunchTimes() {
    const startSecs = timeValue(startTime.value);
    lunchStart.value = secsToTimeInput(startSecs + 5 * 3600);
    lunchEnd.value = secsToTimeInput(startSecs + 5.5 * 3600);
    // Uncheck "No Lunch" since lunch times are now meaningful
    noLunch.checked = false;
    document.getElementById("lunchText").innerText = "No Lunch Today?";
}

// Converts seconds-since-midnight to "HH:MM" for use in <input type="time">
function secsToTimeInput(totalSecs) {
    const h = Math.floor(totalSecs / 3600) % 24;
    const m = Math.floor(totalSecs % 3600 / 60);
    return String(h).padStart(2, '0') + ":" + String(m).padStart(2, '0');
}

// Returns current time as total seconds since midnight
function currentTime() {
    const d = new Date();
    return (d.getHours() * 3600) + (d.getMinutes() * 60) + d.getSeconds();
}

// Converts an "HH:MM" (24-hour) string from <input type="time"> to seconds since midnight
function timeValue(time) {
    const parts = time.split(":");
    return (parseInt(parts[0], 10) * 3600) + (parseInt(parts[1], 10) * 60);
}

// Shared helper: pads a number to at least 2 digits
function pad(n) {
    return String(n).padStart(2, '0');
}

// Converts seconds-since-midnight to "H:MM AM/PM" for clock-out display
function timeString(totalSecs) {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = pad(Math.floor(totalSecs % 3600 / 60));
    if (hours < 12) {
        return hours + ":" + minutes + "AM";
    } else {
        return (hours === 12 ? 12 : hours % 12) + ":" + minutes + "PM";
    }
}

// Converts a seconds duration to "H:MM:SS" for the countdown display
function remaining(totalSecs) {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = pad(Math.floor(totalSecs % 3600 / 60));
    const seconds = pad(Math.floor(totalSecs % 60));
    return hours + ":" + minutes + ":" + seconds;
}

// "Can I Go Home?" button handler
function goHome() {
    if ((totalSeconds - currentTime()) < 60) {
        alert("Get the fuck out of here!");
    } else {
        alert("Sorry, you're stuck here");
    }
}

// If No Lunch is checked, collapse lunch window; otherwise restore defaults
function noLunchFunc() {
    if (noLunch.checked) {
        document.getElementById("lunchText").innerText = "No Lunch Today";
        lunchStart.value = "12:00";
        lunchEnd.value = "12:00";
    } else {
        document.getElementById("lunchText").innerText = "No Lunch Today?";
        lunchStart.value = "12:00";
        lunchEnd.value = "12:30";
    }
}

// ----- Settings persistence (localStorage) -----

// All notification setting field IDs
const SETTINGS_FIELDS = [
    { id: 'notifLunchWarnEn', type: 'checkbox' },
    { id: 'notifLunchWarnMins', type: 'number' },
    { id: 'notifLunchCloseEn', type: 'checkbox' },
    { id: 'notifLunchCloseMins', type: 'number' },
    { id: 'notifShiftWarnEn', type: 'checkbox' },
    { id: 'notifShiftWarnMins', type: 'number' },
    { id: 'notifShiftEndEn', type: 'checkbox' },
    { id: 'notifShiftEndMins', type: 'number' },
];

function saveSettings() {
    SETTINGS_FIELDS.forEach(function (f) {
        const el = document.getElementById(f.id);
        localStorage.setItem(f.id, f.type === 'checkbox' ? el.checked : el.value);
    });
}

function loadSettings() {
    SETTINGS_FIELDS.forEach(function (f) {
        const saved = localStorage.getItem(f.id);
        if (saved === null) return; // no saved value yet, keep HTML default
        const el = document.getElementById(f.id);
        if (f.type === 'checkbox') {
            el.checked = saved === 'true';
        } else {
            el.value = saved;
        }
    });
}

// Save whenever any setting changes
SETTINGS_FIELDS.forEach(function (f) {
    document.getElementById(f.id).addEventListener('change', saveSettings);
});

// Kick off the initial calculation on page load
const form = document.getElementById('form');
loadSettings();
form.onload = logic();
document.onsubmit = function (event) {
    // Prevent form submission/page reload when Enter is pressed
    event.preventDefault();
};

// ----- Notification helpers -----

// Sends a browser notification if permission is granted
function sendNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: body, icon: 'myicon.icns' });
    }
}

// Called every tick with seconds remaining until shift end.
// Checks each of the four configurable notification thresholds.
function checkNotifications(secondsLeft) {
    const now = currentTime();
    const lunchStartSecs = timeValue(lunchStart.value);
    const lunchEndSecs = timeValue(lunchEnd.value);
    const isNoLunch = lunchStartSecs === lunchEndSecs;

    // --- Lunch warning (e.g. 30 min before lunch start) ---
    if (!isNoLunch && !notifFired.lunchWarn) {
        const en = document.getElementById('notifLunchWarnEn').checked;
        const mins = parseInt(document.getElementById('notifLunchWarnMins').value, 10) * 60;
        const secsUntilLunch = lunchStartSecs - now;
        if (en && secsUntilLunch > 0 && secsUntilLunch <= mins) {
            notifFired.lunchWarn = true;
            sendNotification('Lunch soon', `Lunch starts in ${Math.ceil(secsUntilLunch / 60)} min.`);
        }
    }

    // --- Lunch starting soon (e.g. 5 min before lunch start) ---
    if (!isNoLunch && !notifFired.lunchClose) {
        const en = document.getElementById('notifLunchCloseEn').checked;
        const mins = parseInt(document.getElementById('notifLunchCloseMins').value, 10) * 60;
        const secsUntilLunch = lunchStartSecs - now;
        if (en && secsUntilLunch > 0 && secsUntilLunch <= mins) {
            notifFired.lunchClose = true;
            sendNotification('Lunch starting soon', `Lunch in ${Math.ceil(secsUntilLunch / 60)} min!`);
        }
    }

    // --- Shift end warning (e.g. 5 min before shift end) ---
    if (!notifFired.shiftWarn) {
        const en = document.getElementById('notifShiftWarnEn').checked;
        const mins = parseInt(document.getElementById('notifShiftWarnMins').value, 10) * 60;
        if (en && secondsLeft > 0 && secondsLeft <= mins) {
            notifFired.shiftWarn = true;
            sendNotification('Almost time!', `You can leave in ${Math.ceil(secondsLeft / 60)} min.`);
        }
    }

    // --- Shift end ---
    if (!notifFired.shiftEnd) {
        const en = document.getElementById('notifShiftEndEn').checked;
        const mins = parseInt(document.getElementById('notifShiftEndMins').value, 10) * 60;
        if (en && secondsLeft >= 0 && secondsLeft <= mins) {
            notifFired.shiftEnd = true;
            sendNotification('Get out of here!', "Your shift is over. Go home!");
        }
    }
}