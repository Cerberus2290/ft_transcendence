import { getCurrentLanguage, translations, notifyListeners } from "./appstate.js";
import appState from "./appstate.js";
import { wordList } from "./word-list.js";

function translate(key) {
    var currentLanguage = getCurrentLanguage();
    return translations[key][currentLanguage];
}

const wordDisplay = document.querySelector(".word-display");
const guessesText = document.querySelector(".guesses-text b");
const keyboardDiv = document.querySelector(".keyboard");
const hangmanImage = document.querySelector(".hangman-box img");
const gameModal = document.querySelector(".game-modal");
const playAgainBtn = gameModal.querySelector("button");
const playerNameDiv = document.getElementById('player-name');


// Initializing game variables
let currentWord, correctLetters, wrongGuessCount;
const maxGuesses = 6;
let players = [
    { name: 'Player 1', score: 0, isMyTurn: true, attempts: 0, wrongGuesses: 0 },
    { name: 'Player 2', score: 0, isMyTurn: false, attempts: 0, wrongGuesses: 0 }
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

// multiplayerGameButton.addEventListener('click', () => {
//         isMultiplayer = true;
//         gameWindow.style.display = 'flex';
//         players[0].name = window.playerOne || 'Player 1';
//         const playerNameDiv = document.getElementById('player-name');
//         playerNameDiv.innerText = players[currentPlayerIndex].name;
//         initMultiPlayerGame();
// });

multiplayerGameButton.addEventListener('click', () => {
    selectOpponent()
    .then(opponent => {
        players[0].name = window.playerOne || 'Player 1';
        players[1].name = opponent.name || 'Player 2';
        // Start the multiplayer game
        isMultiplayer = true;
        gameWindow.style.display = 'flex';
        const playerNameDiv = document.getElementById('player-name');
        playerNameDiv.innerText = players[currentPlayerIndex].name;
        initMultiPlayerGame();
    })
    .catch(error => {
        console.error('Error in matchmaking:', error);
    });
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
    players[0].name = window.playerOne || 'Player 1';
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
    // Check if button is defined before trying to set its properties
    if (button) {
        button.disabled = true;
    }
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
    // Define the data to send in the request
    const data = {
        player: window.playerOne || 'Player 1',
    };

    return fetch(`https://${host}/api/match-making/`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('access'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data), // Send the data in the request body
    })
    .then(response => {
        if(!response.ok) {
            throw new Error(translate('Error: Unable to matchmake. Please try again later.'));
        }
        return response.json();
    })
    .then(data => {
        // Log the entire response data
        console.log('Response data:', data);

        // Check if the response data has an 'opponent' property
        if (!data.hasOwnProperty('opponent')) {
            throw new Error('Error: The response data does not contain an opponent property.');
        }

        // Return the opponent's details
        return data.opponent;
    })
    .catch((error) => {
        console.log('Error: Cannot find opponent', error);
        throw error;
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