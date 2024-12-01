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

// Variables to handle recording
let isRecording = true; // Start with recording ON
let recordStartTime = new Date(); // Set the current time as the recording start time
let recordColor = '#FFA500'; // Default color for recording (can use highlightColor)

// Add event listener for the "Record" button
document.getElementById('recordButton').addEventListener('click', toggleRecord);

// Add event listener for the highlight color picker
document.getElementById('highlightColor').addEventListener('input', () => {
    if (isRecording) {
        toggleRecord(); // Toggle Record off
        recordColor = document.getElementById('highlightColor').value; // Update the color
        toggleRecord(); // Toggle Record back on
    } else {
        recordColor = document.getElementById('highlightColor').value; // Just update the color
    }
});

// Function to toggle the Record state
function toggleRecord() {
    const recordButton = document.getElementById('recordButton');
    const currentTime = new Date(); // Get the current time when toggling

    if (isRecording) {
        // Record is being toggled OFF
        const recordEndTime = currentTime;
        const startAngle = calculateAngle(recordStartTime.getHours(), recordStartTime.getMinutes());
        const endAngle = calculateAngle(recordEndTime.getHours(), recordEndTime.getMinutes());
        const type = recordStartTime.getHours() >= 12 ? 'outer' : 'inner'; // Determine inner or outer

        // Save the completed recording as a highlight
        highlights.push({start: startAngle, end: endAngle, color: recordColor, type});

        // Reset recording state
        isRecording = false;
        recordStartTime = null;
        recordButton.classList.remove('active');
        recordButton.textContent = 'Record: Off';
    } else {
        // Record is being toggled ON
        recordStartTime = currentTime; // Set the new recording start time
        recordColor = document.getElementById('highlightColor').value; // Use the currently selected color
        isRecording = true;
        recordButton.classList.add('active');
        recordButton.textContent = 'Record: On';
    }

    drawClock(); // Redraw the clock to reflect any changes
}

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
    // Get the values of the start and end time inputs
    const startHour = parseInt(document.getElementById('startTimeHour').value, 10);
    const startMinute = parseInt(document.getElementById('startTimeMinute').value, 10);
    const endHour = parseInt(document.getElementById('endTimeHour').value, 10);
    const endMinute = parseInt(document.getElementById('endTimeMinute').value, 10);
    const color = document.getElementById('highlightColor').value;

    // Validate time ranges (ensure start time is before end time)
    if (
        (startHour < 0 || startHour > 23 || (endHour < 0 || endHour > 24)) ||
        (startMinute < 0 || startMinute > 59) ||
        (endMinute < 0 || endMinute > 59) ||
        (startHour > endHour || (startHour === endHour && startMinute >= endMinute))
    ) {
        alert('Invalid time range!');
        return;
    }

    saveStateToUndoStack();
    redoStack.length = 0; // Clear the redo stack
    // Handle 24:00 as a valid end time (convert it to 0:00 of the next day)
    const adjustedEndHour = endHour === 24 ? 0 : endHour;
    const adjustedEndMinute = endHour === 24 ? 0 : endMinute;

    // Convert start and end time to angles
    const startAngle = calculateAngle(startHour, startMinute);
    const endAngle = calculateAngle(adjustedEndHour, adjustedEndMinute);

    // Check if the range crosses 12:00
    if (startHour < 12 && (endHour > 12 || (endHour === 12 && endMinute > 0))) {
        // Split into two highlights
        const middayAngle = calculateAngle(12, 0); // Angle for 12:00 PM
        highlights.push({start: startAngle, end: middayAngle, color, type: 'inner'}); // First part
        highlights.push({start: middayAngle, end: endAngle, color, type: 'outer'}); // Second part
    } else if (endHour < 12 || (endHour === 12 && endMinute === 0)) {
        // Normal case for inner fill (0:00 - 12:00 range)
        highlights.push({start: startAngle, end: endAngle, color, type: 'inner'});
    } else {
        // Normal case for outer fill (12:00 - 24:00 range)
        highlights.push({start: startAngle, end: endAngle, color, type: 'outer'});
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

// Update the drawClock function to include recording highlights
function drawClock() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved highlights (outer first, then inner)
    highlights
        .filter((highlight) => highlight.type === 'outer')
        .forEach((highlight) => drawHighlight(highlight));

    highlights
        .filter((highlight) => highlight.type === 'inner')
        .forEach((highlight) => drawHighlight(highlight));

    // Handle dynamic recording highlight
    if (isRecording && recordStartTime) {
        const currentTime = new Date();
        const currentTimeHours = currentTime.getHours();
        const currentTimeMinutes = currentTime.getMinutes();

        // Calculate angles for start and current time
        const startAngle = calculateAngle(recordStartTime.getHours(), recordStartTime.getMinutes());
        const currentAngle = calculateAngle(currentTimeHours, currentTimeMinutes);

        // Check if the time range spans across 12:00 PM or midnight
        if (recordStartTime.getHours() < 12 && currentTimeHours >= 12) {
            // Case 1: Spans from AM to PM (e.g., 10:00 AM to 3:00 PM)
            const noonAngle = calculateAngle(12, 0); // 12:00 PM angle
            drawHighlight({
                start: startAngle,
                end: noonAngle,
                color: recordColor,
                type: 'inner'
            });
            drawHighlight({
                start: noonAngle,
                end: currentAngle,
                color: recordColor,
                type: 'outer'
            });
        } else if (recordStartTime.getHours() >= 12 && currentTimeHours < 12) {
            // Case 2: Spans from PM to AM (e.g., 9:00 PM to 2:00 AM)
            const midnightAngle = calculateAngle(0, 0); // 12:00 AM angle
            const endOfDayAngle = calculateAngle(24, 0); // 24:00 or end of day angle

            // Highlight from start time to midnight (PM portion)
            drawHighlight({
                start: startAngle,
                end: midnightAngle,
                color: recordColor,
                type: 'outer'
            });

            // Highlight from midnight to current time (AM portion)
            drawHighlight({
                start: midnightAngle,
                end: currentAngle,
                color: recordColor,
                type: 'inner'
            });
        } else {
            // Standard behavior: Inner or outer fill based on start time
            const type = recordStartTime.getHours() >= 12 ? 'outer' : 'inner';
            drawHighlight({
                start: startAngle,
                end: currentAngle,
                color: recordColor,
                type
            });
        }

    }
}


// Draw the clock face, ticks, and numbers
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

// Draw hands with dynamic colors and widths
drawHand(clockRadius * 0.7, hourAngle, hourHandColor, hourHandWidth);
drawHand(clockRadius * 0.9, minuteAngle, minuteHandColor, minuteHandWidth);
drawHand(clockRadius * 0.95, secondAngle, secondHandColor, secondHandWidth);

// Draw date
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
function drawHighlight({start, end, color, type}) {
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
    const blob = new Blob([jsonString], {type: 'application/json'});

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

// Variable to store the currently active activity button
let lastPressedButton = null;

// Toggle visibility of the activity buttons
document.getElementById('activitiesButton').addEventListener('click', () => {
    const activityControls = document.querySelector('.activity-controls');
    activityControls.classList.toggle('hidden'); // Toggle the 'hidden' class to show/hide the buttons
});

// Variables for activity buttons and their configurations
let activitiesConfig = [
    {id: 'Activity_btn_01', color: '#808080', text: 'Sleep'},
    {id: 'Activity_btn_02', color: '#FFFF00', text: 'Work'},
    {id: 'Activity_btn_03', color: '#A52A2A', text: 'Exercise'},
    {id: 'Activity_btn_04', color: '#00FF00', text: 'Study'},
    {id: 'Activity_btn_05', color: '#FF6347', text: 'Reading'},
    {id: 'Activity_btn_06', color: '#4682B4', text: 'Family'},
    {id: 'Activity_btn_07', color: '#FFD700', text: 'Leisure'},
    {id: 'Activity_btn_08', color: '#8A2BE2', text: 'Hobby'},
    {id: 'Activity_btn_09', color: '#FF4500', text: 'Meeting'},
    {id: 'Activity_btn_10', color: '#3CB371', text: 'Relax'}
];

// Dynamically generate activity buttons based on activitiesConfig
function generateActivityButtons() {
    const activityButtonsContainer = document.getElementById('activityButtons');
    activityButtonsContainer.innerHTML = ''; // Clear any existing buttons

    activitiesConfig.forEach((activity, index) => {
        // Create button element
        const button = document.createElement('button');
        button.classList.add('activity-btn');
        button.id = activity.id;
        button.style.backgroundColor = activity.color;
        button.textContent = activity.text;

        // Attach click event to change the highlight color based on the button
        button.addEventListener('click', () => {
            // Change the highlight color to the button's color
            const colorInput = document.getElementById('highlightColor');
            colorInput.value = activity.color; // Correctly update the color picker input value

            // Toggle Record off and back on with the new color
            if (isRecording) {
                toggleRecord(); // Toggle off Record
                recordColor = activity.color; // Set new color from button
                toggleRecord(); // Toggle back on Record
            } else {
                recordColor = activity.color; // Set color for new highlight
            }

            // Track the last pressed button and visually highlight it
            if (lastPressedButton) {
                lastPressedButton.classList.remove('active-button'); // Remove previous highlight
            }
            lastPressedButton = button; // Store the last pressed button
            lastPressedButton.classList.add('active-button'); // Add highlight to the current button
        });

        // Append the new button to the container
        activityButtonsContainer.appendChild(button);
    });
}

// Function to save the configuration to a JSON file
document.getElementById('saveConfigButton').addEventListener('click', () => {
    const configData = JSON.stringify(activitiesConfig, null, 2); // Convert to JSON format
    const blob = new Blob([configData], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'activities_config.json'; // Set default file name
    link.click(); // Trigger download
});

// Function to load configuration from a JSON file
document.getElementById('loadConfigButton').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json'; // Allow only JSON files

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const config = JSON.parse(reader.result); // Parse the JSON file
                    activitiesConfig = config; // Update the activitiesConfig
                    generateActivityButtons(); // Reinitialize buttons with the new configuration
                } catch (error) {
                    alert('Invalid JSON format.');
                }
            };
            reader.readAsText(file); // Read the file content
        }
    });

    fileInput.click(); // Trigger the file input
});

// Handle loading Excel file
document.getElementById('loadExcelButton').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls'; // Accept only Excel files

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (file) {
            try {
                // Read the Excel file
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, {type: 'array', cellStyles: true}); // Enable cell styles
                const sheetName = workbook.SheetNames[0]; // Get the first sheet
                const sheet = workbook.Sheets[sheetName];

                // Parse the sheet data
                const rows = XLSX.utils.sheet_to_json(sheet, {header: 1}); // Parse as an array of arrays
                rows.shift(); // Remove the header row (row 1)

                // Process each row and update activitiesConfig
                activitiesConfig = rows.map((row, index) => {
                    const buttonId = row[0]; // Column A: Button ID
                    const buttonText = row[1]; // Column B: Activity text
                    const buttonColor = getCellFillColor(sheet, `C${index + 2}`); // Column C: Cell color
                    return {
                        id: buttonId,
                        text: buttonText,
                        color: buttonColor
                    };
                });

                // Re-generate activity buttons based on the updated config
                generateActivityButtons();
            } catch (error) {
                console.error('Error loading Excel file:', error);
                alert('Failed to load Excel file. Please ensure it is in the correct format.');
            }
        }
    });

    fileInput.click(); // Trigger the file picker
});

// Utility function to get the fill color of a cell
function getCellFillColor(sheet, cellAddress) {
    const cell = sheet[cellAddress];
    if (cell && cell.s && cell.s.fgColor && cell.s.fgColor.rgb) {
        return `#${cell.s.fgColor.rgb}`; // Convert RGB to hex color
    }
    return '#000000'; // Default to black if no color is found
}

// Handle "Highlight from Excel" button
document.getElementById('highlightFromExcelButton').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls'; // Accept only Excel files

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (file) {
            try {
                // Read the Excel file
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, {type: 'array', cellStyles: true}); // Enable cell styles
                const sheetName = workbook.SheetNames[0]; // Get the first sheet
                const sheet = workbook.Sheets[sheetName];

                // Parse the sheet data
                const rows = XLSX.utils.sheet_to_json(sheet, {header: 1}); // Parse as an array of arrays
                rows.splice(0, 2); // Remove the first two rows (headers)

                // Process each row for highlights
                rows.forEach((row, index) => {
                    const startHour = parseInt(row[0], 10); // Column A: Start Hour
                    const startMinute = parseInt(row[1], 10); // Column B: Start Minute
                    const endHour = parseInt(row[2], 10); // Column C: End Hour
                    const endMinute = parseInt(row[3], 10); // Column D: End Minute
                    const color = getCellFillColor(sheet, `E${index + 3}`); // Column E: Cell color

                    // Validate time ranges
                    if (
                        isNaN(startHour) || isNaN(startMinute) ||
                        isNaN(endHour) || isNaN(endMinute) ||
                        startHour < 0 || startHour > 23 || endHour < 0 || endHour > 24 ||
                        startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59
                    ) {
                        console.warn(`Invalid row at index ${index + 3}`);
                        return;
                    }

                    // Convert start and end time to angles
                    const startAngle = calculateAngle(startHour, startMinute);
                    const endAngle = calculateAngle(endHour, endMinute);

                    if (startHour < 12 && endHour >= 12) {
                        // Case 1: Time range crosses 12:00
                        const noonAngle = calculateAngle(12, 0);

                        // Inner fill from Start Time to 12:00
                        highlights.push({
                            start: startAngle,
                            end: noonAngle,
                            color,
                            type: 'inner'
                        });

                        // Outer fill from 12:00 to End Time
                        highlights.push({
                            start: noonAngle,
                            end: endAngle,
                            color,
                            type: 'outer'
                        });
                    } else {
                        // Case 2: Time range does not cross 12:00
                        const type = startHour < 12 ? 'inner' : 'outer';
                        highlights.push({
                            start: startAngle,
                            end: endAngle,
                            color,
                            type
                        });
                    }
                });

// Redraw the clock with the new highlights
                drawClock();


            } catch (error) {
                console.error('Error processing Excel file:', error);
                alert('Failed to load Excel file. Please ensure it is in the correct format.');
            }
        }
    });

    fileInput.click(); // Trigger the file picker
});

// Utility function to get the fill color of a cell
function getCellFillColor(sheet, cellAddress) {
    const cell = sheet[cellAddress];
    if (cell && cell.s && cell.s.fgColor && cell.s.fgColor.rgb) {
        return `#${cell.s.fgColor.rgb}`; // Convert RGB to hex color
    }
    return '#000000'; // Default to black if no color is found
}


// Initialize buttons on page load
generateActivityButtons();