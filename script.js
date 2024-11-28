const canvas = document.getElementById('clockCanvas');
const ctx = canvas.getContext('2d');
const dateDisplay = document.getElementById('dateDisplay');

const highlights = []; // Stores user-defined highlights

// Clock settings
let clockRadius;
let centerX, centerY;
let hourHandColor = '#000000', minuteHandColor = '#0000FF', secondHandColor = '#FF0000';
let hourHandWidth = 6, minuteHandWidth = 4, secondHandWidth = 2;
let showDate = true, showNumbers = true;
let numberFontSize = 14;

document.getElementById('hourWidth').addEventListener('input', (e) => {
    hourHandWidth = e.target.value;
});

document.getElementById('minuteWidth').addEventListener('input', (e) => {
    minuteHandWidth = e.target.value;
});

document.getElementById('secondWidth').addEventListener('input', (e) => {
    secondHandWidth = e.target.value;
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

document.getElementById('addHighlightButton').addEventListener('click', () => {
    const start = parseInt(document.getElementById('startTime').value, 10);
    const end = parseInt(document.getElementById('endTime').value, 10);
    const color = document.getElementById('highlightColor').value;
    const type = document.querySelector('input[name="fillType"]:checked').value;

    if (start < 0 || start > 12 || end < 0 || end > 12 || start === end) {
        alert('Invalid time range! Select between 0 and 12.');
        return;
    }

    highlights.push({ start, end, color, type });
    drawClock();
});

function updateCanvasSize() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    canvas.width = size;
    canvas.height = size;
    clockRadius = size / 2 - 20;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}

function drawClock() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw highlights
    highlights.forEach((highlight) => drawHighlight(highlight));

    // Draw clock face
    drawCircle();
    drawTicks();
    if (showNumbers) drawNumbers();

    // Get current time
    const currentTime = new Date();
    const seconds = currentTime.getSeconds();
    const minutes = currentTime.getMinutes();
    const hours = currentTime.getHours() % 12;

    // Calculate angles for the hands
    const secondAngle = seconds * 6;
    const minuteAngle = minutes * 6 + seconds * 0.1;
    const hourAngle = hours * 30 + minutes * 0.5;

    // Draw clock hands
    drawHand(clockRadius * 0.7, hourAngle, hourHandColor, hourHandWidth);
    drawHand(clockRadius * 0.9, minuteAngle, minuteHandColor, minuteHandWidth);
    drawHand(clockRadius * 0.95, secondAngle, secondHandColor, secondHandWidth);

    // Draw date
    drawDate(hourAngle);
}

function drawCircle() {
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

function drawTicks() {
    for (let i = 0; i < 60; i++) {
        const angle = Math.PI / 30 * i;
        const x1 = centerX + clockRadius * 0.9 * Math.cos(angle);
        const y1 = centerY + clockRadius * 0.9 * Math.sin(angle);
        const x2 = centerX + clockRadius * 0.95 * Math.cos(angle);
        const y2 = centerY + clockRadius * 0.95 * Math.sin(angle);

        const width = i % 5 === 0 ? 3 : 1; // Bold tick for hour markers
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }
}

function drawNumbers() {
    ctx.font = `${numberFontSize}px Arial`;
    ctx.fillStyle = 'black';
    for (let i = 0; i < 12; i++) {
        const angle = Math.PI / 6 * (i - 3); // Adjust calculation for clock position
        const x = centerX + clockRadius * 0.75 * Math.cos(angle);
        const y = centerY + clockRadius * 0.75 * Math.sin(angle);
        const number = i === 0 ? 12 : i; // Show 12 instead of 0
        ctx.fillText(number.toString(), x - numberFontSize / 3, y + numberFontSize / 3);
    }
}

function drawHand(length, angle, color, width) {
    const radianAngle = angle - 90;
    const x = centerX + length * Math.cos(radianAngle * Math.PI / 180);
    const y = centerY + length * Math.sin(radianAngle * Math.PI / 180);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawHighlight({ start, end, color, type }) {
    const startAngle = Math.PI / 6 * (start - 3); // Adjust start angle for 0-12 range
    const endAngle = Math.PI / 6 * (end - 3); // Adjust end angle for 0-12 range

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    if (type === 'outer') {
        ctx.arc(centerX, centerY, clockRadius, startAngle, endAngle, false);
    } else if (type === 'inner') {
        ctx.arc(centerX, centerY, clockRadius * 0.5, startAngle, endAngle, false);
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawDate(hourAngle) {
    const date = new Date();
    const day = date.toLocaleDateString();

    const isLowerHalf = (hourAngle >= 90 && hourAngle < 270);
    const dateTop = isLowerHalf ? centerY - 40 : centerY + 40;

    dateDisplay.textContent = day;
    dateDisplay.style.top = `${dateTop}px`;
    dateDisplay.style.display = showDate ? 'block' : 'none';
}

setInterval(drawClock, 1000);
updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);
