const canvas = document.getElementById('clockCanvas');
const ctx = canvas.getContext('2d');
const dateDisplay = document.getElementById('dateDisplay');

const highlights = []; // Stores user-defined highlights
const undoStack = [];
const redoStack = [];

let clockRadius;
let centerX, centerY;
let hourHandColor = '#000000', minuteHandColor = '#0000FF', secondHandColor = '#FF0000';
let hourHandWidth = 6, minuteHandWidth = 4, secondHandWidth = 2;
let showDate = true, showNumbers = true;
let numberFontSize = 14;

// Event listeners for sliders and color pickers
document.getElementById('hourWidth').addEventListener('input', (e) => {
    hourHandWidth = e.target.value;
    drawClock();
});

document.getElementById('minuteWidth').addEventListener('input', (e) => {
    minuteHandWidth = e.target.value;
    drawClock();
});

document.getElementById('secondWidth').addEventListener('input', (e) => {
    secondHandWidth = e.target.value;
    drawClock();
});

document.getElementById('numberSize').addEventListener('input', (e) => {
    numberFontSize = e.target.value;
    drawClock();
});

// Color pickers
document.getElementById('hourColor').addEventListener('input', (e) => {
    hourHandColor = e.target.value;
    drawClock();
});

document.getElementById('minuteColor').addEventListener('input', (e) => {
    minuteHandColor = e.target.value;
    drawClock();
});

document.getElementById('secondColor').addEventListener('input', (e) => {
    secondHandColor = e.target.value;
    drawClock();
});

document.getElementById('toggleDateButton').addEventListener('click', () => {
    showDate = !showDate;
    drawClock();
});

document.getElementById('toggleNumbersButton').addEventListener('click', () => {
    showNumbers = !showNumbers;
    drawClock();
});

// Add an event listener for the "Add Highlight" button
document.getElementById('addHighlightButton').addEventListener('click', () => {
    const startHour = parseInt(document.getElementById('startTimeHour').value, 10);
    const startMinute = parseInt(document.getElementById('startTimeMinute').value, 10);
    const endHour = parseInt(document.getElementById('endTimeHour').value, 10);
    const endMinute = parseInt(document.getElementById('endTimeMinute').value, 10);
    const color = document.getElementById('highlightColor').value;

    // Validate time ranges
    if (
        (startHour < 0 || startHour > 23) ||
        (endHour < 0 || endHour > 23) ||
        (startMinute < 0 || startMinute > 59) ||
        (endMinute < 0 || endMinute > 59) ||
        (startHour > endHour || (startHour === endHour && startMinute >= endMinute))
    ) {
        alert('Invalid time range!');
        return;
    }

    saveStateToUndoStack();
    redoStack.length = 0; // Clear the redo stack
    // Convert start and end time to angles
    const startAngle = calculateAngle(startHour, startMinute);
    const endAngle = calculateAngle(endHour, endMinute);

    // Add highlight to the list (inner or outer based on time)
    if (endHour <= 12) {
        highlights.push({ start: startAngle, end: endAngle, color, type: 'inner' });
    } else if (startHour >= 12) {
        highlights.push({ start: startAngle, end: endAngle, color, type: 'outer' });
    } else {
        // Split the highlight into inner and outer
        highlights.push({ start: startAngle, end: 12 * Math.PI, color, type: 'inner' });
        highlights.push({ start: 12 * Math.PI, end: endAngle, color, type: 'outer' });
    }

    drawClock();
});

// Function to calculate the angle based on the hour and minute
function calculateAngle(hour, minute) {
    const totalMinutes = (hour % 12) * 60 + minute; // Convert time to total minutes past 12 AM
    return (totalMinutes / 720) * 2 * Math.PI; // Map total minutes to radians (0-2π)
}

// Reset Highlights
document.getElementById('resetButton').addEventListener('click', () => {
    highlights.length = 0;
    undoStack.length = 0;
    redoStack.length = 0;
    drawClock();
});

// Undo and Redo
document.getElementById('undoButton').addEventListener('click', () => {
    if (undoStack.length > 0) {
        saveStateToRedoStack();
        const previousState = undoStack.pop();
        loadState(previousState);
        drawClock();
    } else {
        alert('Nothing to undo!');
    }
});

document.getElementById('redoButton').addEventListener('click', () => {
    if (redoStack.length > 0) {
        saveStateToUndoStack();
        const nextState = redoStack.pop();
        loadState(nextState);
        drawClock();
    } else {
        alert('Nothing to redo!');
    }
});

// Save the current highlights state to the undo stack
function saveStateToUndoStack() {
    undoStack.push(JSON.stringify(highlights));
}

// Save the current highlights state to the redo stack
function saveStateToRedoStack() {
    redoStack.push(JSON.stringify(highlights));
}

// Load a state into highlights
function loadState(state) {
    highlights.length = 0;
    highlights.push(...JSON.parse(state));
}

// Update canvas size
function updateCanvasSize() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    canvas.width = size;
    canvas.height = size;
    clockRadius = size / 2 - 20;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    drawClock();
}

// Draw the clock (updated to handle dynamic state)
function drawClock() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Step 1: Draw highlights (outer first, inner second)
    highlights
        .filter((highlight) => highlight.type === 'outer')  // Draw outer first
        .forEach((highlight) => drawHighlight(highlight));

    highlights
        .filter((highlight) => highlight.type === 'inner')  // Draw inner second
        .forEach((highlight) => drawHighlight(highlight));

    // Step 2: Draw the clock face, ticks, and numbers
    drawCircle();
    drawTicks();
    if (showNumbers) drawNumbers();

    // Get current time
    const currentTime = new Date();
    const seconds = currentTime.getSeconds();
    const minutes = currentTime.getMinutes();
    const hours = currentTime.getHours() % 12;

    const secondAngle = seconds * 6;
    const minuteAngle = minutes * 6 + seconds * 0.1;
    const hourAngle = hours * 30 + minutes * 0.5;

    // Step 3: Draw hands with dynamic colors and widths
    // Draw hands with dynamic colors and widths
    drawHand(clockRadius * 0.7, hourAngle, hourHandColor, hourHandWidth);
    drawHand(clockRadius * 0.9, minuteAngle, minuteHandColor, minuteHandWidth);
    drawHand(clockRadius * 0.95, secondAngle, secondHandColor, secondHandWidth);

    // Step 4: Draw date
    drawDate(hourAngle);
}
// Draw clock face circle
function drawCircle() {
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

// Draw ticks
function drawTicks() {
    for (let i = 0; i < 60; i++) {
        const angle = (i * 6) * Math.PI / 180;
        const x1 = centerX + clockRadius * 0.9 * Math.cos(angle);
        const y1 = centerY + clockRadius * 0.9 * Math.sin(angle);
        const x2 = centerX + clockRadius * (i % 5 === 0 ? 0.85 : 0.88) * Math.cos(angle);
        const y2 = centerY + clockRadius * (i % 5 === 0 ? 0.85 : 0.88) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
}

// Draw numbers
function drawNumbers() {
    ctx.font = `${numberFontSize}px Arial`;
    ctx.fillStyle = 'black';
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x = centerX + clockRadius * 0.75 * Math.cos(angle);
        const y = centerY + clockRadius * 0.75 * Math.sin(angle);
        const number = i === 0 ? 12 : i;
        ctx.fillText(number.toString(), x - numberFontSize / 3, y + numberFontSize / 3);
    }
}

// Draw clock hands
function drawHand(length, angle, color, width) {
    const radianAngle = (angle - 90) * (Math.PI / 180);
    const x = centerX + length * Math.cos(radianAngle);
    const y = centerY + length * Math.sin(radianAngle);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
}

// Draw a highlight (updated to use angles)
function drawHighlight({ start, end, color, type }) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    if (type === 'outer') {
        ctx.arc(centerX, centerY, clockRadius, start - Math.PI / 2, end - Math.PI / 2, false);
    } else if (type === 'inner') {
        ctx.arc(centerX, centerY, clockRadius * 0.5, start - Math.PI / 2, end - Math.PI / 2, false);
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}
// Draw the date
function drawDate(hourAngle) {
    const date = new Date();
    const day = date.toLocaleDateString();

    const isLowerHalf = (hourAngle >= 90 && hourAngle < 270);
    const dateTop = isLowerHalf ? centerY - 40 : centerY + 40;

    dateDisplay.textContent = day;
    dateDisplay.style.top = `${dateTop}px`;
    dateDisplay.style.display = showDate ? 'block' : 'none';
}

// Add an event listener for the "Export to JSON" button
document.getElementById('exportJsonButton').addEventListener('click', () => {
    const clockState = getClockState(); // Get the current clock state as an object
    const jsonString = JSON.stringify(clockState, null, 2); // Convert the state to a JSON string

    // Create a Blob with the JSON string (this is the file content)
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create a link element
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'clockState.json'; // Name of the exported file

    // Programmatically click the link to trigger the download
    link.click();
});

// Add an event listener for the "Import JSON" button
document.getElementById('importJsonButton').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json'; // Only accept JSON files

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const clockState = JSON.parse(reader.result); // Parse the JSON string
                    loadClockState(clockState); // Load the state into the clock
                } catch (err) {
                    alert('Error parsing the JSON file!');
                }
            };
            reader.readAsText(file); // Read the file content
        } else {
            alert('Please select a valid JSON file.');
        }
    });

    input.click(); // Trigger the file input dialog
});

// Function to get the current state of the clock (hands, fills, etc.)
function getClockState() {
    return {
        hourHandColor,
        minuteHandColor,
        secondHandColor,
        hourHandWidth,
        minuteHandWidth,
        secondHandWidth,
        numberFontSize,
        showDate,
        showNumbers,
        highlights: highlights.map((highlight) => ({
            start: highlight.start,
            end: highlight.end,
            color: highlight.color,
            type: highlight.type,
        }))
    };
}

// Function to load clock state from the imported JSON
function loadClockState(clockState) {
    // Update the clock state from the imported JSON
    hourHandColor = clockState.hourHandColor || '#000000';
    minuteHandColor = clockState.minuteHandColor || '#0000FF';
    secondHandColor = clockState.secondHandColor || '#FF0000';
    hourHandWidth = clockState.hourHandWidth || 6;
    minuteHandWidth = clockState.minuteHandWidth || 4;
    secondHandWidth = clockState.secondHandWidth || 2;
    numberFontSize = clockState.numberFontSize || 14;
    showDate = clockState.showDate !== undefined ? clockState.showDate : true;
    showNumbers = clockState.showNumbers !== undefined ? clockState.showNumbers : true;

    // Load highlights
    highlights.length = 0; // Clear the current highlights
    clockState.highlights.forEach((highlight) => {
        highlights.push({
            start: highlight.start,
            end: highlight.end,
            color: highlight.color,
            type: highlight.type
        });
    });

    // Redraw the clock with the imported state
    drawClock();
}

// Toggle clock controls with the hamburger button
document.getElementById('hamburgerButton').addEventListener('click', () => {
    const controls = document.querySelector('.controls');
    controls.classList.toggle('hidden'); // Add/remove the "hidden" class
});

// Initialize clock
updateCanvasSize();
setInterval(drawClock, 1000);
window.addEventListener('resize', updateCanvasSize);
