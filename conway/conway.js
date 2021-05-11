function flipTile(game, i, j) {
    const tile = game.tiles[i][j];
    tile.state = !tile.state;
    if (tile.state) {
        tile.cell.removeClass('animtodie');
        tile.cell.removeClass('dead');
        tile.cell.addClass('animtolive');
        tile.cell.addClass('live');
    } else {
        tile.cell.removeClass('animtolive');
        tile.cell.removeClass('live');
        tile.cell.addClass('animtodie');
        tile.cell.addClass('dead');
    }
}

function changeState(game, i, j) {
    return () => flipTile(game, i, j);
}

function initBoard(game) {
    var $table = $('<div />', {
        id: 'board',
        class: 'board',
        tabindex: 1
    });
    for (var i = 0; i < game.M; i++) {
        var $row = $("<div />", {
            class: 'row'
        });
        for (var j = 0; j < game.N; j++) {
            var $square = $("<div/>", {
                class: 'square'
            });
            $row.append($square);
            $square.click(changeState(game, i, j));
            var tile = game.tiles[i][j];
            tile.cell = $square;
            if (tile.state) {
                $square.addClass('live')
            } else {
                $square.addClass('dead')
            }
        }
        $table.append($row);
    }
    return $table;
}

function nextFrame(game) {

    const getTile = (i, j) => {
        if (i >= 0 && i < game.M && j >= 0 && j < game.N) {
            return game.tiles[i][j].state;
        } else {
            return false;
        }
    }

    const countNeighbours = (i, j) => {
        let neighbours = 0;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                if (di == 0 && dj == 0) {
                    continue;
                }
                const x = i + di, y = j + dj;
                if (getTile(x, y)) {
                    neighbours ++;
                }
            }
        }
        return neighbours;
    }

    const automata = (alive, n) => {
        if (alive) {
            return (n == 2) || (n == 3);
        } else {
            return n == 3;
        }
    }

    const newTiles = [];
    for (let i = 0; i < game.M; i++) {
        const newRow = [];
        newTiles.push(newRow);
        for (let j = 0; j < game.N; j++) {
            const n = countNeighbours(i, j);
            const alive = getTile(i, j);
            newRow.push(automata(alive, n));
        }
    }

    for (let i = 0; i < game.M; i++) {
        for (let j = 0; j < game.N; j++) {
            if (newTiles[i][j] !== getTile(i, j)) {
                flipTile(game, i, j);
            }
        }
    }
}

function main() {
    const game = {
        M: 30,
        N: 50,
        tiles: [],  
    };
    for (let i = 0; i < game.M; i++) {
        const row = [];
        game.tiles.push(row);
        for (let j = 0; j < game.N; j++) {
            row.push({state: false})
        }
    }
    const board = initBoard(game);
    $("#mainDiv").append(board);

    const runState = {
        isActive: false,
        frame: 0,
        startTimer: 0,
    }

    $("#next").click(() => {
        runState.frame = runState.frame + 1
        nextFrame(game);
    });

    const getTime = () => {
        return Date.now() / 1000;
    };
    
    $("#run").click(() => {
        runState.isActive = !runState.isActive;
        console.log(runState.isActive);
        if (runState.isActive) {
            runState.frame = 0; 
            runState.startTimer = getTime();
            const step = () => {
                const currentTime = getTime() - runState.startTimer;
                const frameIdx = Math.floor((currentTime)/0.2);
                console.log(frameIdx);
                while (runState.frame < frameIdx) {
                    runState.frame++;
                    nextFrame(game);
                }
                runState.animation = window.requestAnimationFrame(step);
            };
            runState.animation = window.requestAnimationFrame(step);
        } else {
            if (runState.animation) {
                window.cancelAnimationFrame(runState.animation);
                runState.animation = null;
            }
        }
    })
}

main();