import * as THREE from 'three';
import { getCurrentLanguage, translations } from "./appstate.js";

document.addEventListener('DOMContentLoaded', function() {
    const startTournamentMatchInput = document.createElement('input');
    startTournamentMatchInput.type = 'text';
    startTournamentMatchInput.placeholder = 'Enter Match ID';
    startTournamentMatchInput.id = 'startTournamentMatchInput';
    document.getElementById('tournamentMatchContainer').appendChild(startTournamentMatchInput);

    const startTournamentMatchButton = document.createElement('button');
    startTournamentMatchButton.textContent = translate('Start Tournament');
    startTournamentMatchButton.id = 'startTournamentMatchButton';
    document.getElementById('tournamentMatchContainer').appendChild(startTournamentMatchButton);

    startTournamentMatchButton.addEventListener('click', function() {
        startTournamentMatch();
    });
});

function translate(key) {
    var currentLanguage = getCurrentLanguage();
    return translations[key][currentLanguage];
}

const BALLSPEED = 0.3;
var fieldWidth = 50;
var fieldDepth = 1;
var fieldHeight = fieldWidth / 2;
var fieldTop = (fieldHeight / 2);
var fieldBottom = -(fieldHeight / 2);
var fieldLeft = -(fieldWidth / 2);
var fieldRight = fieldWidth / 2;
var paddleWidth = fieldWidth / 70;
var paddleHeight = fieldHeight / 3;
var gameShouldStart = true;
var gameStarted = false;
var darkBackground = true;
var scoreText = document.getElementById("score");
var darkColour = 0x111111;
var lightColour = 0xeeeeee;

let enablePowerups = false;

// AI mode
let aiMode = false;
let aiLastUpdateTime = 0;
let aiReactionTime = 500; // Adjusted AI reaction time
let aiMarginError = 10;
let aiDifficultyAdjustmentFactor = 0.1;
var mode = "local";
var pauseScreen = document.getElementById("pauseScreen");
var ctx = pauseScreen.getContext("2d");
ctx.fillStyle = "black";
ctx.fillRect(0, 0, pauseScreen.width, pauseScreen.height);
ctx.fillStyle = "white";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.font = "30px Arial"
ctx.fillText("select a mode to play", pauseScreen.width / 2, pauseScreen.height / 2);

let playerTwoName = 'Player2';

let upArrowPressed = false, downArrowPressed = false;
let wKeyPressed = false, sKeyPressed = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
scene.background = new THREE.Color(0x262626);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas')
});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

// camera
camera.rotation.x = 1.41;
camera.rotation.y = 0.54;
camera.rotation.z = 0;

camera.position.x = 14.09;
camera.position.y = -40;
camera.position.z = 20;

var originalCameraPosition = new THREE.Vector3(14.09, -40, 20);
var originalCameraRotation = new THREE.Euler(1.41, 0.54, 0, 'XYZ'); 
var isCameraOriginal = true;

var distance = camera.position.z;
var center = new THREE.Vector3(0, 0, 0);
var centerX = window.innerWidth / 2;
var centerY = window.innerHeight / 2;
var radius = 20;
var angle = -Math.PI / 2;

// create field
var fieldGeometry = new THREE.BoxGeometry(fieldWidth, fieldHeight, fieldDepth, 1, 1, 1);
var fieldMaterial = new THREE.MeshLambertMaterial({ color: darkColour, side: THREE.BackSide });
var field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.position.set(0, 0, 0);
field.receiveShadow = true;
scene.add(field);

class paddle {
    constructor(){
        this.geometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, 0.5, 1, 1, 1);
        this.material = new THREE.MeshLambertMaterial({ color: lightColour, side: THREE.BackSide });
        this.object = new THREE.Mesh(this.geometry, this.material);
        this.x = 0;
        this.y = window.innerHeight / 2 - paddleHeight / 2;
        this.width = paddleWidth;
        this.height = paddleHeight;
        this.dy = 0;
        this.score = 0;
        this.speed = BALLSPEED;
    }
};

function getRandomNumberBetween(firstNumber, secondNumber)
{
    var randomNumber = (Math.random() < 0.5 ? -1 : 1) * (firstNumber + Math.random() * secondNumber);
    return (randomNumber);
}

class Ball {
    constructor(colour){
        this.radius = fieldWidth / 100;
        this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        this.material = new THREE.MeshBasicMaterial({color: colour});
        this.object = new THREE.Mesh(this.geometry, this.material);
        this.x = 0;
        this.y = 0;
        this.speed = BALLSPEED;
        this.dx = 0;
        this.dy = 0;
        console.log(this.dx, this.dy);
        this.active = false;
        this.reset();
    }
    normalizeDirection(){
        let length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dx /= length;
        this.dy /= length;
    }
    reset(){
        this.object.position.x = 0;
        this.object.position.y = 0;
        this.dx = getRandomNumberBetween(0.2, 0.6);
        this.dy = getRandomNumberBetween(0.2, 0.6);
        this.normalizeDirection();
    }
};

class enlargePaddle extends Ball {
    constructor(){
        super("yellow");
        this.scale = 0.2;
    }
    power(paddle){
        console.log("power");
        paddle.object.scale.y += this.scale;
        removePowerup();
    }
};

class speedUpBall extends Ball {
    constructor(){
        super("red");
    }
    power(paddle){
        console.log("power");
        if (paddle.speed < 1.2) paddle.speed *= 1.05;
        removePowerup();
    }
};

var powerup = new Ball("#bbbbbb");

var ball = new Ball("#eeeeee");
scene.add(ball.object);

// create paddle
var leftPaddle = new paddle();
var rightPaddle = new paddle();
leftPaddle.object.position.x = -(fieldWidth / 2);
rightPaddle.object.position.x = fieldWidth / 2;
leftPaddle.object.receiveShadow = true;
rightPaddle.object.receiveShadow = true;
rightPaddle.object.position.z += fieldDepth;
leftPaddle.object.position.z += fieldDepth;
rightPaddle.castShadow = true;
leftPaddle.castShadow = true;
rightPaddle.receiveShadow = true;
leftPaddle.receiveShadow = true;
scene.add(leftPaddle.object);
scene.add(rightPaddle.object);

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)
const pointLight = new THREE.PointLight(0xffffff, 0.5)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, -300, 200);
light.castShadow = true;
light.castShadow = true;

light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;
light.intensity = 2;
scene.add(light);


var sensitivity = 0.00004;
var rotationEnabled = false;

// function resetCamera() {
//     if (!isCameraOriginal) {
//         rotationEnabled = false;
//         camera.position.copy(originalCameraPosition);
//         camera.rotation.copy(originalCameraRotation);
//         camera.lookAt(0, 0, 0);
//         isCameraOriginal = true;
//     }
// }

// document.addEventListener('mousemove', function(event) {
//     if (rotationEnabled){
//         var deltaX = (event.clientX - centerX) * sensitivity;
//         var deltaY = (event.clientY - centerY) * sensitivity;
//         angle = Math.atan2(deltaY, deltaX);
//         isCameraOriginal = false;
//     }
// });

// document.addEventListener('wheel', function(event) {
//     if (rotationEnabled){
//         distance -= event.deltaY * sensitivity;
//         distance = Math.max(distance, 20);
//         distance = Math.min(distance, 100); 
//         isCameraOriginal = false;
//     }
// });

// document.addEventListener('click', function(event) {
//     rotationEnabled = !rotationEnabled;
// });

var newX = center.x + radius * Math.cos(angle);
var newY = center.y + radius * Math.sin(angle);
camera.position.set(newX, newY, distance);
camera.lookAt(center);

function animate() {
    if (gameStarted){
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
        movePaddles();
        if (mode === 'AI') moveAIPaddle();
        moveBall();
        movePowerup();
        drawScore();
    }
}

animate();

function removePowerup(){
    scene.remove(powerup.object);
    powerup.active = false;
}

function movePaddles() {
    if (wKeyPressed && leftPaddle.object.position.y < fieldTop - leftPaddle.height / 2) 
        leftPaddle.object.position.y += 0.1;
    if (sKeyPressed && (leftPaddle.object.position.y > fieldBottom + leftPaddle.height / 2)) 
        leftPaddle.object.position.y -= 0.1;
    if (upArrowPressed && rightPaddle.object.position.y < fieldTop - leftPaddle.height / 2) 
        rightPaddle.object.position.y += 0.1;
    if (downArrowPressed  && (rightPaddle.object.position.y > fieldBottom + rightPaddle.height / 2)) 
        rightPaddle.object.position.y -= 0.1;
}

function movePowerup() {
    randomizePowerup();
    if (powerup.active == true){
        powerup.object.position.x += powerup.dx * powerup.speed;
        powerup.object.position.y += powerup.dy * powerup.speed;
        console.log(powerup.dx);
        if (powerup.object.position.y + powerup.radius > fieldTop) powerup.dy = Math.abs(powerup.dy) * -1;
        else if (powerup.object.position.y - powerup.radius < fieldBottom) powerup.dy = Math.abs(powerup.dy);
        if (powerup.object.position.x < leftPaddle.object.position.x + leftPaddle.width && powerup.object.position.y > leftPaddle.object.position.y - leftPaddle.height / 2 && powerup.object.position.y < leftPaddle.object.position.y + leftPaddle.height / 2)
            powerup.power(leftPaddle);
        else if (powerup.object.position.x > rightPaddle.object.position.x - rightPaddle.width && powerup.object.position.y > rightPaddle.object.position.y - leftPaddle.height / 2 && powerup.object.position.y < rightPaddle.object.position.y + rightPaddle.height / 2) {
            powerup.power(rightPaddle);
        }
        if (powerup.object.position.x + powerup.radius > fieldRight || powerup.object.position.x - powerup.radius < fieldLeft)  
            removePowerup();
    }
}

function randomizePowerup() {
    if (powerup.active == false && enablePowerups == true){
        let random = Math.round(Math.random() * 2);
        if (random == 1) {
            powerup = new enlargePaddle();
            scene.add(powerup.object);
            powerup.active = true;
        } else if (random == 2){
            powerup = new speedUpBall();
            scene.add(powerup.object);
            powerup.active = true;
        }
    }
}

function moveBall() {    
    // Wall collision (top/bottom)
    if (ball.object.position.y + ball.radius > fieldTop) ball.dy = Math.abs(ball.dy) * -1;
    else if (ball.object.position.y - ball.radius < fieldBottom) ball.dy = Math.abs(ball.dy);

    // Paddle collision
    if (ball.object.position.x < leftPaddle.object.position.x + leftPaddle.width && ball.object.position.y > leftPaddle.object.position.y - leftPaddle.height / 2 && ball.object.position.y < leftPaddle.object.position.y + leftPaddle.height / 2){
        ball.dx = Math.abs(ball.dx);
        paddleCollision(leftPaddle);
    }
    else if (ball.object.position.x > rightPaddle.object.position.x - rightPaddle.width && ball.object.position.y > rightPaddle.object.position.y - leftPaddle.height / 2 && ball.object.position.y < rightPaddle.object.position.y + rightPaddle.height / 2){
        ball.dx = Math.abs(ball.dx) * -1;
        paddleCollision(rightPaddle);
    }
    else if (ball.object.position.x + ball.radius > fieldRight || ball.object.position.x - ball.radius < fieldLeft) {
        if (ball.object.position.x + ball.radius > fieldRight) leftPaddle.score++;
        else rightPaddle.score++;
        checkWinner();
        ball.reset();
    }
    // Reset ball if it goes out of bounds
    ball.object.position.y += ball.dy * ball.speed;
    ball.object.position.x += ball.dx * ball.speed;
    console.log(ball.dx);
}

function paddleCollision(paddle) {
    if (Math.abs(ball.dx) < 0.5) ball.dx *= 1.10; ball.dy *= 1.10;
    ball.speed = paddle.speed;
}

function drawScore() {
    scoreText.textContent = "Player 1 " + window.playerOne + " : " + leftPaddle.score +  "Player two" + playerTwoName + " : " + rightPaddle.score;
}

// // AI paddle movement
function moveAIPaddle() {
    if (aiMode && Date.now() - aiLastUpdateTime > aiReactionTime) {
        aiLastUpdateTime = Date.now();
        aiAdjustDifficulty();
        let aiPredictBallY = aiPredictBallPosition();
        
        let aiPaddleCenter = leftPaddle.object.position.y;
        let aiTargetY = aiPredictBallY + (Math.random() * 2 - 1) * aiMarginError;
        if (aiTargetY < aiPaddleCenter) {
            wKeyPressed = true;  // AI attempts to move up
            sKeyPressed = false;
        } else if (aiTargetY > aiPaddleCenter) {
            sKeyPressed = true;  // AI attempts to move down
            wKeyPressed = false;
        } else {
            wKeyPressed = false;
            sKeyPressed = false; // AI stays
        }

        // Apply AI paddle movement based on flags
        if (wKeyPressed && (leftPaddle.object.position.y < fieldTop - leftPaddle.height / 2))
            leftPaddle.object.position.y += 0.1; 
        else if (sKeyPressed && (leftPaddle.object.position.y > fieldBottom + leftPaddle.height / 2))
            leftPaddle.object.position.y -= 0.1; 
        }
    }

function aiAdjustDifficulty() {
    // Adjustments for AI difficulty
    let scoreDiff = leftPaddle.score - rightPaddle.score;
    if (scoreDiff > 2 || scoreDiff < -2) {
        let adjustment = aiReactionTime * aiDifficultyAdjustmentFactor;
        aiReactionTime += scoreDiff > 2 ? -adjustment : adjustment;
        aiMarginError += scoreDiff > 2 ? -adjustment : adjustment;
    }
    aiReactionTime = Math.max(500, Math.min(aiReactionTime, 1500));
    aiMarginError = Math.max(10, Math.min(aiMarginError, 50));
}

function aiPredictBallPosition() {
    // Optimized AI prediction logic
    let futureBallX = ball.object.position.x;
    let futureBallY = ball.object.position.y;
    let futureBallDx = ball.dx;
    let futureBallDy = ball.dy;

    if (futureBallDx <= 0)
        return ball.object.position.y;
    while (futureBallX < fieldRight - leftPaddle.width) {
        futureBallX += futureBallDx;
        futureBallY += futureBallDy;
        if (futureBallY - ball.radius < fieldBottom || futureBallY + ball.radius > fieldBottom)
            futureBallDy *= -1;
    }
    return futureBallY;
}

// // Event listeners
document.addEventListener("keydown", function(event) {
    console.log(event.keyCode);
    switch (event.keyCode) {
        case 87: // W key
            wKeyPressed = gameShouldStart && true;
            break;
        case 83: // S key
            sKeyPressed = gameShouldStart && true;
            break;
        case 38: // Up arrow
            upArrowPressed = gameShouldStart && true;
            event.preventDefault();
            break;
        case 40: // Down arrow
            downArrowPressed = gameShouldStart && true;
            event.preventDefault();
            break;
        case 13: // Enter key
            if (!gameStarted) {
                gameStarted = true;
                gameShouldStart = true;
                ctx.beginPath();
                ctx.clearRect(0, 0, pauseScreen.width, pauseScreen.height);
                setPongCanvas();
                animate();
            }
            break;
        case 32:
            resetCamera();
            break;
        }
});

document.addEventListener("keyup", function(event) {
    switch (event.keyCode) {
        case 87: // W key
        wKeyPressed = false;
        break;
        case 83: // S key
        sKeyPressed = false;
        break;
        case 38: // Up arrow
        upArrowPressed = false;
        event.preventDefault();
        break;
        case 40: // Down arrow
        downArrowPressed = false;
        event.preventDefault();
        break;
    }
});

document.getElementById('enablePowerups').addEventListener('click', function() {
    var button = document.getElementById('enablePowerups');
    if (button.textContent.includes('OFF')) {
        button.textContent = button.textContent.replace('OFF', 'ON');
        enablePowerups = true;
      } else {
        button.textContent = button.textContent.replace('ON', 'OFF');
        enablePowerups = false;
      }
});

document.getElementById('changeBackgroundColour').addEventListener('click', function() {
    
    if (darkBackground == true)
    {
        field.material.color.setHex(lightColour);
        rightPaddle.material.color.setHex(darkColour);
        leftPaddle.material.color.setHex(darkColour);
        ball.material.color.setHex(darkColour);
    }
    else
    {
        field.material.color.setHex(darkColour);
        rightPaddle.material.color.setHex(lightColour);
        leftPaddle.material.color.setHex(lightColour);
        ball.material.color.setHex(lightColour);
    }
    darkBackground = !darkBackground;
});

document.getElementById('playPongButtonLocal').addEventListener('click', function() {
    mode = 'local';
    const enteredName = document.getElementById('player2NameInput').value;
    playerTwoName = enteredName.trim() || 'Player2';
    resetGame();
    setPauseScreen();
});

// AI mode button
document.getElementById('playPongButtonAI').addEventListener('click', function() {
    mode = 'AI';
    aiMode = true;
    resetGame();
    setPauseScreen();
});

document.getElementById('playPongButtonTournament').addEventListener('click', function() {
    const tournamentControls = document.getElementById('tournamentControls');

    // toggle the display of the tournament controls
    if (tournamentControls.style.display === 'none') {
        tournamentControls.style.display = 'block';
    } else {
        tournamentControls.style.display = 'none';
    }
});

document.getElementById('createTournamentButton').addEventListener('click', function() {
    const tournamentName = document.getElementById('tournamentNameInput').value.trim();
    startTournament(tournamentName);
    document.getElementById('tournamentNameInput').value = '';
});

document.getElementById('joinTournamentButton').addEventListener('click', function() {
    const tournamentId = document.getElementById('tournamentIDInput').value.trim();
    if (tournamentId) {
        joinTournament(tournamentId);
    } else {
        alert('Please enter a valid tournament ID');
    }
    document.getElementById('tournamentIDInput').value = '';
});
   

function resetGame() {
    leftPaddle.score = 0;
    rightPaddle.score = 0;
    ball.reset();
    gameShouldStart = true;
    gameStarted = false;
}

function setPauseScreen() {
    ctx.clearRect(0, 0, pauseScreen.width, pauseScreen.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, pauseScreen.width, pauseScreen.height);
    ctx.fillStyle = "white";
    ctx.fillText("press ENTER to play", pauseScreen.width / 2, pauseScreen.height / 2);
}

function setPongCanvas() {
    document.getElementById('pongCanvas').style.display = 'block';
}

function resetGameFlags() {
    gameShouldStart = false;
    gameStarted = false;
}

function updateStats(winner, loser) {
    const accessToken = localStorage.getItem('access');
    const url = `https://${host}/api/update-stats/`;
    
    let data = {
        winner: winner,
        loser: loser,
        gameCompleted: true
    };
    
    if (!accessToken) {
        console.log('No access token found');
        return;
    }
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Stats not updated!');
        }
        return response.json();
    })
    .then(data => {
        console.log('Stats updated!');
    })
    .catch(error => {
        console.log('Erorr UpdateStats:', error);
    });
}

function checkWinner() {
    let winnerId, winnerName, loserName, score;
    let matchId = document.getElementById('startTournamentMatchInput').value;
    if (leftPaddle.score == 5 || rightPaddle.score == 5) {
        if (leftPaddle.score == 5) {
            winnerId = window.playerOneId;
            winnerName = window.playerOne || 'Player1';
            loserName = playerTwoName || 'Player2';
        } else {
            winnerId = window.playerTwoId;
            winnerName = playerTwoName || 'Player2';
            loserName = window.playerOne || 'Player1';
        }

        const accessToken = localStorage.getItem('access');
        const data_winner = {
            winner: winnerId,
            winner_username: winnerName,
        };

        fetch(`https://${host}/api/matches/${matchId}/update/`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data_winner)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update match!');
            }
            return response.json();
        })
        .then(data => {
            console.log('Match updated!');
            alert(`${winnerName} wins!`);
        })
        .catch(error => {
            console.log('Error checkWinner:', error);
        });

        score = `${leftPaddle.score} - ${rightPaddle.score}`;
        updateStats(winnerName, loserName);
        submitMatchHistory(winnerName, loserName, score);
        alert(`${winnerName} wins!`);
        resetGame();
        resetGameFlags();
    }
}

function submitMatchHistory(winner, loser, score) {
    const accessToken = localStorage.getItem('access');
    if (!accessToken) {
        console.log('No access token found');
        return;
    }

    const url = `https://${host}/api/match-history/`;
    let data = {
        player1: window.playerOne || 'Player1',
        player2: playerTwoName || 'Player2',
        winner: winner,
        loser: loser,
        score: score,
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit match history!');
        }
        console.log(data);
        return response.json();
    })
    .then(data => {
        console.log('Match history submitted!');
    })
    .catch(error => {
        console.log('Error submitMatchHistory:', error);
    });
}

function startTournament(tournamentName) {
    const accessToken = localStorage.getItem('access');
    if (!accessToken) {
        console.log(translate('No access token found'));
        return;
    }

    const data = {
        name: tournamentName,
        start_date: new Date().toISOString(),
    };

    fetch(`https://${host}/api/tournaments/create/`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (!response.ok) {
            alert(translate('Please enter a tournament name'));
            throw new Error(translate('Failed to create tournament!'));
        }
        return response.json();
    })
    .then(data => {
        const message = `${translate('Tournament created! Tournament ID: ')} ${data.id}`
        alert(message);
    })
    .catch(error => console.error('Error startTournament:', error));
}

function joinTournament(tournamentId) {
    const accessToken = localStorage.getItem('access');
    if (!accessToken) {
        console.log(translate('No access token found'));
        return;
    }

    fetch(`https://${host}/api/tournaments/${tournamentId}/join/`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(translate('Failed to join tournament!'));
        }
        return response.json();
    })
    .then(data => {
        console.log(translate('Joined tournament!'));
        alert(translate('Joined tournament!'));
    })
}

function startTournamentMatch() {
    const accessToken = localStorage.getItem('access');
    const matchId = document.getElementById('startTournamentMatchInput').value;
    if (!matchId) {
        console.log('Please enter a valid match ID');
        alert('Please enter a valid match ID');
        return;
    }

    fetch(`https://${host}/api/matches/${matchId}/`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to join tournament!');
        }
        return response.json();
    })
    .then(data => {
        console.log('Tournament Details:', data);
        window.playerOneId = data.player1;
        window.playerOne = data.player1_username;
        window.playerTwoId = data.player2;
        playerTwoName = data.player2_username;
        resetGame();
        gameShouldStart = true;
        gameStarted = false;
        console.log('Tournament match started!');
        document.getElementById('pongCanvas').style.display = 'block';
    })
    .catch(error => {
        console.error('Error startTournamentMatch:', error);
    });
}