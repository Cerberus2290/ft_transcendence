import { getCurrentLanguage, translations, notifyListeners } from "./appstate.js";
import appState from "./appstate.js";
import { wordList } from "./word-list.js";

function translate(key) {
    var currentLanguage = getCurrentLanguage();
    return translations[key][currentLanguage];
}

// const wordDisplay = document.querySelector(".word-display");
// const guessesText = document.querySelector(".guesses-text b");
// const keyboardDiv = document.querySelector(".keyboard");
// const hangmanImage = document.querySelector(".hangman-box img");
// const gameModal = document.querySelector(".game-modal");
// const playAgainBtn = gameModal.querySelector("button");
//
//
// // Initializing game variables
// let currentWord, correctLetters, wrongGuessCount;
// const maxGuesses = 6;
// let players = [{ name: 'Player 1', score: 0 }, { name: 'Player 2', score: 0 }];
// let currentPlayerIndex = 0;
// let isMultiplayer = false;
//
//
// const soloGameButton = document.getElementById('solo-game-button');
// const multiplayerGameButton = document.getElementById('multiplayer-game-button');
// const gameWindow = document.querySelector('.container');
//
//
// soloGameButton.addEventListener('click', () => {
//         isMultiplayer = false;
//         document.getElementById('hangman_game_mode').style.display = 'none';
//         gameWindow.style.display = 'flex';
//         initSoloGame();
// });
//
// multiplayerGameButton.addEventListener('click', () => {
//         isMultiplayer = true;
//         document.getElementById('hangman_game_mode').style.display = 'none';
//         gameWindow.style.display = 'flex';
//         initMultiPlayerGame();
// });
//
// const resetGame = () => {
//     correctLetters = [];
//     wrongGuessCount = 0;
//     hangmanImage.src = "../static/css/h_img/hangman-0.svg";
//     guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
//     wordDisplay.innerHTML = currentWord.split("").map(() => `<li class="letter"></li>`).join("");
//     keyboardDiv.querySelectorAll("button").forEach(btn => btn.disabled = false);
//     gameModal.classList.remove("show");
// }
//
// const getRandomWord = () => {
//     // Selecting a random word and hint from the wordList
//     const { word, hint } = wordList[Math.floor(Math.random() * wordList.length)];
//     currentWord = word; // Making currentWord as random word
//     document.querySelector(".hint-text b").innerText = hint;
//     resetGame();
// }
//
// const gameOver = (isVictory) => {
//     // After game complete.. showing modal with relevant details
//     const modalText = isVictory ? `You found the word:` : 'The correct word was:';
//     gameModal.querySelector("img").src = `../static/css/h_img/${isVictory ? 'victory' : 'lost'}.gif`;
//     gameModal.querySelector("h4").innerText = isVictory ? 'Congrats!' : 'Game Over!';
//     gameModal.querySelector("p").innerHTML = `${modalText} <b>${currentWord}</b>`;
//     gameModal.classList.add("show");
// }
//
// const initSoloGame = (button, clickedLetter) => {
//     const playerNameDiv = window.playerOne || "Player 1";
//     playerNameDiv.innerText = players[currentPlayerIndex].name;
//     soloGameButton.style.display = 'none';
//     multiplayerGameButton.style.display = 'none';
//     if(currentWord.includes(clickedLetter)) {
//         // Showing all correct letters on the word display
//         [...currentWord].forEach((letter, index) => {
//             if(letter === clickedLetter) {
//                 correctLetters.push(letter);
//                 wordDisplay.querySelectorAll("li")[index].innerText = letter;
//                 wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
//             }
//         });
//     } else {
//         // If clicked letter doesn't exist then update the wrongGuessCount and hangman image
//         wrongGuessCount++;
//         //backend/static/css/h_img/victory.gif
//         hangmanImage.src = `../static/css/h_img/hangman-${wrongGuessCount}.svg`;
//     }
//     button.disabled = true; // Disabling the clicked button so user can't click again
//     guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
//
//     // Calling gameOver function if any of these condition meets
//     if(wrongGuessCount === maxGuesses) return gameOver(false);
//     if(correctLetters.length === currentWord.length) return gameOver(true);
// }
//
// const initMultiPlayerGame = (button, clickedLetter) => {
//     const playerNameDiv = document.getElementById('player-name');
//     playerNameDiv.innerText = players[currentPlayerIndex].name;
//     soloGameButton.style.display = 'none';
//     multiplayerGameButton.style.display = 'none';
//     if(currentWord.includes(clickedLetter)) {
//         // Showing all correct letters on the word display
//         [...currentWord].forEach((letter, index) => {
//             if(letter === clickedLetter) {
//                 correctLetters.push(letter);
//                 wordDisplay.querySelectorAll("li")[index].innerText = letter;
//                 wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
//             }
//         });
//     } else {
//         // If clicked letter doesn't exist then update the wrongGuessCount and hangman image
//         wrongGuessCount++;
//         //backend/static/css/h_img/victory.gif
//         hangmanImage.src = `../static/css/h_img/hangman-${wrongGuessCount}.svg`;
//     }
//     button.disabled = true; // Disabling the clicked button so user can't click again
//     guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
//
//     // Calling gameOver function if any of these condition meets
//     if(wrongGuessCount === maxGuesses) return gameOver(false);
//     if(correctLetters.length === currentWord.length) return gameOver(true);
// }
//
// // Creating keyboard buttons and adding event listeners
// for (let i = 97; i <= 122; i++) {
//     const button = document.createElement("button");
//     button.innerText = String.fromCharCode(i);
//     keyboardDiv.appendChild(button);
//     button.addEventListener("click", (e) => initGame(e.target, String.fromCharCode(i)));
// }
//
// getRandomWord();
// playAgainBtn.addEventListener("click", getRandomWord);

const wordDisplay = document.querySelector(".word-display");
const guessesText = document.querySelector(".guesses-text b");
const keyboardDiv = document.querySelector(".keyboard");
const hangmanImage = document.querySelector(".hangman-box img");
const gameModal = document.querySelector(".game-modal");
const playAgainBtn = gameModal.querySelector("button");
const playerNameDiv = document.getElementById('player-name');
const mainPlayer = window.playerOne;

// Initializing game variables
let currentWord, correctLetters, wrongGuessCount;
const maxGuesses = 6;
let players = [
    { name: mainPlayer, score: 0, isMyTurn: true, attempts: 0, wrongGuesses: 0 },
    { name: playerNameDiv, score: 0, isMyTurn: false, attempts: 0, wrongGuesses: 0 }
];
let currentPlayerIndex = 0;
let isMultiplayer = false;


const soloGameButton = document.getElementById('solo-game-button');
const multiplayerGameButton = document.getElementById('multiplayer-game-button');
const gameWindow = document.querySelector('.container');


soloGameButton.addEventListener('click', () => {
        isMultiplayer = false;
        gameWindow.style.display = 'flex';
        initSoloGame();
});

multiplayerGameButton.addEventListener('click', () => {
        isMultiplayer = true;
        gameWindow.style.display = 'flex';
        const playerNameDiv = document.getElementById('player-name');
        playerNameDiv.innerText = players[currentPlayerIndex].name;
        initMultiPlayerGame();
});


const resetGame = () => {
    if (isMultiplayer === false) {
    correctLetters = [];
    wrongGuessCount = 0;
    hangmanImage.src = "../static/css/h_img/hangman-0.svg";
    guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
    wordDisplay.innerHTML = currentWord.split("").map(() => `<li class="letter"></li>`).join("");
    keyboardDiv.querySelectorAll("button").forEach(btn => btn.disabled = false);
    gameModal.classList.remove("show");
    }
    else {
        correctLetters = [];
        wrongGuessCount = 0;
        hangmanImage.src = "../static/css/h_img/hangman-0.svg";
        guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;
        wordDisplay.innerHTML = currentWord.split("").map(() => `<li class="letter"></li>`).join("");
        keyboardDiv.querySelectorAll("button").forEach(btn => btn.disabled = false);
        gameModal.classList.remove("show");
        players.forEach(player => {
        player.wrongGuesses = 0;
    });
    }
}

const getRandomWord = () => {
    // Selecting a random word and hint from the wordList
    const { word, hint } = wordList[Math.floor(Math.random() * wordList.length)];
    currentWord = word; // Making currentWord as random word
    document.querySelector(".hint-text b").innerText = hint;
    resetGame();
}

const gameOver = (isVictory) => {
    // After game complete.. showing modal with relevant details
    const modalText = isVictory ? `You found the word:` : 'The correct word was:';
    gameModal.querySelector("img").src = `../static/css/h_img/${isVictory ? 'victory' : 'lost'}.gif`;
    gameModal.querySelector("h4").innerText = isVictory ? `Congrats!` : `Game Over`;
    gameModal.querySelector("p").innerHTML = `${modalText} <b>${currentWord}</b>`;
    gameModal.classList.add("show");
}

const initSoloGame = (button, clickedLetter) => {
    const playerNameDiv = document.getElementById('player-name');
    playerNameDiv.innerText = players[currentPlayerIndex].name;
    soloGameButton.style.display = 'none';
    multiplayerGameButton.style.display = 'none';
        if (clickedLetter) {
        if(currentWord.includes(clickedLetter)) {
            // Showing all correct letters on the word display
            [...currentWord].forEach((letter, index) => {
                if(letter === clickedLetter) {
                    correctLetters.push(letter);
                    wordDisplay.querySelectorAll("li")[index].innerText = letter;
                    wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
                }
            });
        } else {
            // If clicked letter doesn't exist then update the wrongGuessCount and hangman image
            wrongGuessCount++;
            hangmanImage.src = `../static/css/h_img/hangman-${wrongGuessCount}.svg`;
        }
        button.disabled = true; // Disabling the clicked button so user can't click again
        guessesText.innerText = `${wrongGuessCount} / ${maxGuesses}`;

        // Calling gameOver function if any of these condition meets
        if(wrongGuessCount === maxGuesses) return gameOver(false);
        if(correctLetters.length === currentWord.length) return gameOver(true);
    }
}

const initMultiPlayerGame = (button, clickedLetter) => {
    // Get the current player
    const currentPlayer = players[currentPlayerIndex];
    //const currentPlayer = window.playerOne;

    // Hide the game selection buttons
    soloGameButton.style.display = 'none';
    multiplayerGameButton.style.display = 'none';

    // Initialize a flag to track if the letter was guessed correctly
    let letterGuessedCorrectly = false;

    // Check if the clicked letter is in the current word
    if (clickedLetter) {
        if (currentWord.includes(clickedLetter)) {
            // If it is, update the word display and set the flag to true
            currentWord.split("").forEach((letter, index) => {
                if (letter === clickedLetter) {
                    correctLetters.push(letter);
                    wordDisplay.querySelectorAll("li")[index].innerText = letter;
                    wordDisplay.querySelectorAll("li")[index].classList.add("guessed");
                }
            });
            letterGuessedCorrectly = true;
        }
        else {
            // If it's not, increment the wrong guess count and update the hangman image
            currentPlayer.wrongGuesses++;
            hangmanImage.src = `../static/css/h_img/hangman-${currentPlayer.wrongGuesses}.svg`;
        }
    }
    // Disable the clicked button
    button.disabled = true;
    // If the letter was guessed incorrectly, switch to the next player
    if (!letterGuessedCorrectly) {
        wrongGuessCount = players[currentPlayerIndex].wrongGuesses;
        switchPlayer();
        wrongGuessCount = players[currentPlayerIndex].wrongGuesses;

    }
    document.getElementById('player-name').innerText = players[currentPlayerIndex].name;
    // guessesText.innerText = `${currentPlayer.wrongGuesses} / ${maxGuesses}`;
    guessesText.innerText = `${players[currentPlayerIndex].wrongGuesses} / ${maxGuesses}`;
    // Check for game over conditions
    if (currentPlayer.wrongGuesses === maxGuesses) {
        gameOver(false);
        return;
    }
    if (correctLetters.length === currentWord.length) {
        gameOver(true);
        return;
    }
};

function selectOpponent() {
    fetch(`https://${host}/api/match-making/`), {
        method: 'POST',
        headers: {
            'Authrization': 'Bearer ' + localStorage.getItem('access'),
            'Content-Type': 'application/json'
        },
    }
    .then(response => {
        if(!response.ok) {
            throw new Error(translate('Error enabling 2FA'));
        }
        return response.json();
    })
    .then(data => {

    })
    .catch((error) => {
        console.log('Error selectOpponent:', error);
    });
}

const switchPlayer = () => {
     currentPlayerIndex = (++currentPlayerIndex) % players.length;
}

for (let i = 97; i <= 122; i++) {
    const button = document.createElement("button");
    button.innerText = String.fromCharCode(i);
    keyboardDiv.appendChild(button);
    button.addEventListener("click", (e) => {
        if (isMultiplayer) {
            initMultiPlayerGame(e.target, String.fromCharCode(i));
        } else {
            initSoloGame(e.target, String.fromCharCode(i));
        }
    });
}

getRandomWord();
playAgainBtn.addEventListener("click", getRandomWord);