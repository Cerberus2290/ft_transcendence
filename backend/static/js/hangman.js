const canvas = document.getElementById("hangmanCanvas");
const ctx = canvas.getContext("2d");
let gameShouldStart = false;
let gameStarted = false;

// Game constants
const maxAttempts = 6;
const wordList = ['apple', 'banana', 'orange', 'strawberry', 'watermelon'];
let currentWord;
let guessedLetters = [];
let incorrectAttempts = 0;

//Game event
document.getElementById('playHangman').addEventListener('click', function() {
    mode = 'local';
    const enteredName = document.getElementById('player2NameInput').value;
    playerTwoName = enteredName.trim() || 'Player2';

    resetGame();
    document.getElementById('hangmanCanvas').style.display = 'block';
});

// Objects
const gallows = [
    () => drawGallowsBase(),
    () => drawGallowsPole(),
    () => drawGallowsBeam(),
    () => drawGallowsRope(),
    () => drawGallowsHead(),
    () => drawGallowsBody(),
    () => drawGallowsLeftArm(),
    () => drawGallowsRightArm(),
    () => drawGallowsLeftLeg(),
    () => drawGallowsRightLeg()
];

// Function to choose a random word from the word list
function getRandomWord() {
    return wordList[Math.floor(Math.random() * wordList.length)];
}

// Function to start the game
function startGame() {
    currentWord = getRandomWord();
    guessedLetters = [];
    incorrectAttempts = 0;
    gameStarted = true;
}

// Draw functions for the gallows
function drawGallowsBase() {
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.stroke();
}

function drawGallowsPole() {
    ctx.moveTo(canvas.width / 2, canvas.height - 20);
    ctx.lineTo(canvas.width / 2, 20);
    ctx.stroke();
}

function drawGallowsBeam() {
    ctx.moveTo(canvas.width / 2, 20);
    ctx.lineTo(canvas.width / 4, 20);
    ctx.stroke();
}

function drawGallowsRope() {
    ctx.moveTo(canvas.width / 4, 20);
    ctx.lineTo(canvas.width / 4, 50);
    ctx.stroke();
}

function drawGallowsHead() {
    ctx.beginPath();
    ctx.arc(canvas.width / 4, 70, 20, 0, Math.PI * 2);
    ctx.stroke();
}

function drawGallowsBody() {
    ctx.moveTo(canvas.width / 4, 90);
    ctx.lineTo(canvas.width / 4, 150);
    ctx.stroke();
}

function drawGallowsLeftArm() {
    ctx.moveTo(canvas.width / 4, 100);
    ctx.lineTo(canvas.width / 4 - 20, 130);
    ctx.stroke();
}

function drawGallowsRightArm() {
    ctx.moveTo(canvas.width / 4, 100);
    ctx.lineTo(canvas.width / 4 + 20, 130);
    ctx.stroke();
}

function drawGallowsLeftLeg() {
    ctx.moveTo(canvas.width / 4, 150);
    ctx.lineTo(canvas.width / 4 - 20, 180);
    ctx.stroke();
}

function drawGallowsRightLeg() {
    ctx.moveTo(canvas.width / 4, 150);
    ctx.lineTo(canvas.width / 4 + 20, 180);
    ctx.stroke();
}

// Draw function for displaying the word
function drawWord() {
    let displayedWord = '';
    for (const letter of currentWord) {
        if (guessedLetters.includes(letter)) {
            displayedWord += letter;
        } else {
            displayedWord += '_';
        }
        displayedWord += ' ';
    }
    ctx.font = '24px Arial';
    ctx.fillText(displayedWord, canvas.width / 2 - 50, canvas.height - 50);
}

// Function to handle keyboard input for guessing letters
function guessLetter(letter) {
    if (!gameStarted) return;
    if (!guessedLetters.includes(letter)) {
        guessedLetters.push(letter);
        if (!currentWord.includes(letter)) {
            incorrectAttempts++;
        }
    }
    checkGameStatus();
}

// Function to check if the game is won or lost
function checkGameStatus() {
    if (incorrectAttempts >= maxAttempts) {
        endGame(false);
    } else if (currentWord.split('').every(letter => guessedLetters.includes(letter))) {
        endGame(true);
    }
}

// Function to end the game and display the result
function endGame(win) {
    gameStarted = false;
    if (win) {
        alert('Congratulations! You guessed the word correctly.');
    } else {
        alert('Sorry, you lost. The word was: ' + currentWord);
    }
}

// Function to clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Main game loop
function gameLoop() {
    clearCanvas();
    if (gameShouldStart) {
        drawGallows();
        drawWord();
    } else {
        ctx.font = '24px Arial';
        ctx.fillText('Press ENTER to start the game', canvas.width / 2 - 150, canvas.height / 2);
    }
    requestAnimationFrame(gameLoop);
}

// Event listener for keyboard input
document.addEventListener('keydown', function(event) {
    if (event.keyCode >= 65 && event.keyCode <= 90) {
        guessLetter(event.key.toLowerCase());
    } else if (event.keyCode === 13) {
        if (!gameStarted) {
            gameShouldStart = true;
            startGame();
        }
    }
});

// Function to draw the gallows based on the number of incorrect attempts
function drawGallows() {
    for (let i = 0; i < incorrectAttempts; i++) {
        gallows[i]();
    }
}

// Start the game loop
gameLoop();
