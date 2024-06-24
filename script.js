document.addEventListener('DOMContentLoaded', () => {
    const human = 'X';
    const ai = 'O';
    let currentPlayer = human;
    let board = Array(3).fill().map(() => Array(3).fill(' '));
    let humanScore = 0;
    let aiScore = 0;
    let drawScore = 0;

    const gameBoard = document.getElementById('game-board');
    const message = document.getElementById('message');
    const restartButton = document.getElementById('restart-button');
    const humanScoreDisplay = document.getElementById('human-score');
    const aiScoreDisplay = document.getElementById('ai-score');
    const drawScoreDisplay = document.getElementById('draw-score');

    function printBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.textContent = board[i][j];
                cell.addEventListener('click', handleMove);
                gameBoard.appendChild(cell);
            }
        }
    }

    function handleMove(event) {
        const row = event.target.dataset.row;
        const col = event.target.dataset.col;
        if (board[row][col] === ' ' && currentPlayer === human) {
            board[row][col] = human;
            if (checkWin(board, human)) {
                printBoard();
                message.textContent = "Human wins!";
                humanScore++;
                humanScoreDisplay.textContent = humanScore;
                updateScores(1, 0, 0); // Update scores on backend
                return;
            }
            currentPlayer = ai;
            if (checkDraw(board)) {
                printBoard();
                message.textContent = "It's a draw!";
                drawScore++;
                drawScoreDisplay.textContent = drawScore;
                updateScores(0, 0, 1); // Update scores on backend
                return;
            }
            aiMove();
        }
    }

    function aiMove() {
        const move = bestMove(board);
        if (move) {
            board[move[0]][move[1]] = ai;
            if (checkWin(board, ai)) {
                printBoard();
                message.textContent = "AI wins!";
                aiScore++;
                aiScoreDisplay.textContent = aiScore;
                updateScores(0, 1, 0); // Update scores on backend
                return;
            }
            currentPlayer = human;
            if (checkDraw(board)) {
                printBoard();
                message.textContent = "It's a draw!";
                drawScore++;
                drawScoreDisplay.textContent = drawScore;
                updateScores(0, 0, 1); // Update scores on backend
                return;
            }
        }
        printBoard();
    }

    function checkWin(board, player) {
        for (let i = 0; i < 3; i++) {
            if (board[i].every(spot => spot === player)) return true;
            if (board.every(row => row[i] === player)) return true;
        }
        if (board.every((row, index) => row[index] === player)) return true;
        if (board.every((row, index) => row[2 - index] === player)) return true;
        return false;
    }

    function checkDraw(board) {
        return board.flat().every(spot => spot !== ' ');
    }

    function getAvailableMoves(board) {
        const moves = [];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i][j] === ' ') moves.push([i, j]);
            }
        }
        return moves;
    }

    function minimax(board, depth, isMaximizing) {
        if (checkWin(board, ai)) return 1;
        if (checkWin(board, human)) return -1;
        if (checkDraw(board)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (const move of getAvailableMoves(board)) {
                board[move[0]][move[1]] = ai;
                const score = minimax(board, depth + 1, false);
                board[move[0]][move[1]] = ' ';
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (const move of getAvailableMoves(board)) {
                board[move[0]][move[1]] = human;
                const score = minimax(board, depth + 1, true);
                board[move[0]][move[1]] = ' ';
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    }

    function bestMove(board) {
        let bestScore = -Infinity;
        let move = null;
        for (const m of getAvailableMoves(board)) {
            board[m[0]][m[1]] = ai;
            const score = minimax(board, 0, false);
            board[m[0]][m[1]] = ' ';
            if (score > bestScore) {
                bestScore = score;
                move = m;
            }
        }
        return move;
    }

    function updateScores(humanWins, aiWins, draws) {
        fetch('/Backend/server.js', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                humanWins,
                aiWins,
                draws,
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Update global scores in UI
            humanScoreDisplay.textContent = data.humanWins;
            aiScoreDisplay.textContent = data.aiWins;
            drawScoreDisplay.textContent = data.draws;
        })
        .catch(error => console.error('Error updating scores:', error));
    }

    restartButton.addEventListener('click', () => {
        board = Array(3).fill().map(() => Array(3).fill(' '));
        currentPlayer = human;
        message.textContent = '';
        printBoard();
    });

    // Fetch initial scores when the page loads
    fetch('/scores')
        .then(response => response.json())
        .then(data => {
            humanScoreDisplay.textContent = data.humanWins;
            aiScoreDisplay.textContent = data.aiWins;
            drawScoreDisplay.textContent = data.draws;
        })
        .catch(error => console.error('Error fetching scores:', error));

    printBoard();
});
