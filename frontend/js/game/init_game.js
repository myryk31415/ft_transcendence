import { Element } from "./element.js";
import { updateElements } from "./draw_game.js";
import { setAiReaction } from "./ai.js"
import { gameLoop, cleanupGame, resetGame } from "./game.js"
import { startGame, joinGame, initSocket, resetSocket } from "./online_game.js"

const PINK = '#8A4FFF';
const PURPLE = '#9932CC';
export let gameModeSelector, gameMode;
export let BOARD_HEIGHT = 500;
export let BOARD_WIDTH = 800;
export let OBJ_WIDTH = BOARD_WIDTH / 40;
export let OBJ_HEIGHT = BOARD_HEIGHT / 5;
export let player1, player2, ball;

let animationId;

export function setAnimationId(id) {
	animationId = id;
}

export function getAnimationId() {
	return animationId;
}

export function ensureInit() {
	if (window.gameState.initialized === true) return;

	console.log('Ensuring initialization...');
	if (document.readyState === 'complete') {
		console.log('Document already complete, initializing now');
		initGame();
		window.gameState.initialized = true;
		window.gameState.cleanup = cleanupGame;
	} else {
		console.log('Document not ready, adding listener');
		document.addEventListener('DOMContentLoaded', listenerGame);
	}
}

function listenerGame() {
	initGame();
	window.gameState.initialized = true;
	window.gameState.cleanup = cleanupGame;
}

function initGame() {
	console.log('=== Initializing Game ===');
	const gameBoard = document.getElementById('gameBoard');

	if (!gameBoard) {
		console.error('Canvas element not found');
		return;
	}

	setGameBoardSize(true);
	const ctx = gameBoard.getContext('2d');

	let startPlayer1 = {
		x: () => BOARD_WIDTH / 80,
		y: () => BOARD_HEIGHT / 2 - OBJ_HEIGHT / 2,
		height: () => OBJ_HEIGHT,
		width: () => OBJ_WIDTH,
		maxY: () => BOARD_HEIGHT - OBJ_HEIGHT,
		maxX: () => BOARD_WIDTH - OBJ_WIDTH,
		speed: () => BOARD_HEIGHT / 50,
		color: PINK,
	};

	let startPlayer2 = {
		x: () => BOARD_WIDTH -  BOARD_WIDTH / 80 - OBJ_WIDTH,
		y: () => BOARD_HEIGHT / 2 - OBJ_HEIGHT / 2,
		height: () => OBJ_HEIGHT,
		width: () => OBJ_WIDTH,
		maxY: () => BOARD_HEIGHT - OBJ_HEIGHT,
		maxX: () => BOARD_WIDTH - OBJ_WIDTH,
		speed: () => BOARD_HEIGHT / 50,
		color: PINK,
	};
	let startBallValues = {
		x: () => BOARD_WIDTH / 2 - OBJ_WIDTH / 2,
		y: () => BOARD_HEIGHT / 2 - OBJ_HEIGHT / 10,
		height: () => OBJ_HEIGHT / 5,
		width: () => OBJ_WIDTH,
		maxY: () => BOARD_HEIGHT - OBJ_HEIGHT / 5,
		maxX: () => BOARD_WIDTH - OBJ_WIDTH,
		speed: () => BOARD_WIDTH / 120,
		dirX: Math.round(Math.random()) ? -1 : 1,
		dirY: Math.round(Math.random()) ? -1 : 1,
		color: PURPLE,
	};

	player1 = new Element(startPlayer1);
	player1.original = startPlayer1;
	player2 = new Element(startPlayer2);
	player2.original = startPlayer2;
	ball = new Element(startBallValues);
	ball.original = startBallValues;

	ball.reset = function () {
		ball.x = startBallValues.x();
		ball.y = startBallValues.y();
		ball.speed = startBallValues.speed();
		// -1 is to the left and 1 to the right
		ball.dirX = Math.round(Math.random()) ? -1 : 1,
		ball.dirY = Math.round(Math.random()) ? -1 : 1
	}
	player1.reset = function() {
		player1.x = startPlayer1.x();
		player1.y = startPlayer1.y();
	}
	player2.reset = function() {
		player2.x = startPlayer2.x();
		player2.y = startPlayer2.y();
	}
	console.log('Starting game loop with dimensions:', BOARD_WIDTH, BOARD_HEIGHT);
	setGameBoardSize();
	document.getElementById('startGame').addEventListener('click', startGameTimer);
	document.getElementById('lobbyInput').style.display = "none";
	gameModeSelector = document.getElementById('gameMode');
	gameModeSelector.addEventListener('change', changeGameMode);
	if (localStorage.getItem('isLoggedIn'))
		document.getElementById('onlineOption').style.display = "block";
}

function changeGameMode() {
	const difficulty = document.getElementById("difficulty");
	const difficultyCol = document.getElementById("difficultyCol");

	gameMode = gameModeSelector.value;
	console.log('Selected game mode:', gameMode);
	resetGame();
	if (localStorage.getItem('isLoggedIn'))
		document.getElementById('onlineOption').style.display = "block";
	else
		document.getElementById('onlineOption').style.display = "none";
	if (gameMode !== 'ai')
		difficultyCol.style.display = "none";
	else
		difficultyCol.style.display = "block";
	if (gameMode === 'ai' || gameMode === 'ai2')
		difficulty.addEventListener('change', setAiReaction);
	if (gameMode === 'online')
		initSocket();
	else {
		resetSocket();
	}
	setNames();
	setButtonListeners();
}
window.changeGameMode = changeGameMode;

function setButtonListeners() {
	const	startButton = document.getElementById("startGame");
	const	joinButton = document.getElementById("joinGame");
	const	lobbyInput = document.getElementById("lobbyInput");

	startButton.style.display = "flex";
	if (gameMode === 'online')
	{
		lobbyInput.style.display = "flex";
		joinButton.addEventListener('click', joinGame, { once: true });
		startButton.addEventListener('click', startGameTimer);
		if (!localStorage.getItem('username'))
		{
			lobbyInput.style.display = "none";
			startButton.style.display = "none";
		}
	}
	else
		lobbyInput.style.display = "none";
}

function setNames() {
	const	player1Name = document.getElementById("player1Name");
	const	player2Name = document.getElementById("player2Name");
	let		player_name = "Player 1";
	let		opponent_name = "Player 2";

	if (gameMode !== 'ai2')
		player_name = localStorage.getItem('username') || 'Player 1';
	if (gameMode === 'human')
		opponent_name = "Player 2";
	else if (gameMode === 'ai')
		opponent_name = "AI";
	else if (gameMode === 'ai2')
	{
		player_name = "AI";
		opponent_name = "AI";
	}
	else if (gameMode === 'online')
	{
		if (!localStorage.getItem('username'))
			player_name = "Please Login"
		opponent_name = 'Waiting for player 2...';
	}
	player1Name.textContent = player_name;
	player2Name.textContent = opponent_name;
}

export function setGameBoardSize(isInitialSetup = false) {

	const smallerDimension = Math.min(window.innerWidth, window.innerHeight);
	BOARD_WIDTH = Math.floor(smallerDimension * 1);
	BOARD_HEIGHT = Math.floor(BOARD_WIDTH * (5/8)); // Maintain a 8 / 5 Ratio

	// adjust size of buttons below board
	document.querySelectorAll('.playRow').forEach(function(element) {
		element.style.width = BOARD_WIDTH + 'px';
	});

	document.querySelectorAll('.playRow')

	// Recalculate other dependent variables
	OBJ_WIDTH = BOARD_WIDTH / 45;
	OBJ_HEIGHT = BOARD_HEIGHT / 5;
	const gameBoard = document.getElementById('gameBoard');
	if (gameBoard) {
		gameBoard.width = BOARD_WIDTH;
		gameBoard.height = BOARD_HEIGHT;
		// updateElements(); // Redraw after resize
		console.log('Canvas resized to:', BOARD_WIDTH, BOARD_HEIGHT);
		if (!isInitialSetup)
			updateElements();
	}
}

export async function startGameTimer() {
	const gameTimer = document.getElementById('scoreGame');
	const gameButton = document.getElementById('startGame');
	let time = 3;

	gameButton.removeEventListener('click', startGameTimer);
	gameButton.addEventListener('click', resetGame, { once: true });
	gameButton.textContent = 'Reset';
	while (time >= 0)
	{
		await new Promise(r => setTimeout(r, 1000));
		if (gameButton.textContent === 'Start')
			return ;
		gameTimer.textContent = time + ' : ' + time;
		time--;
	}
	if (gameModeSelector.value === "online")
		startGame();
	else
		gameLoop();
}

ensureInit();
window.ensureInit = ensureInit;
