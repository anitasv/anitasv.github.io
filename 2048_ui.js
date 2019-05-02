var ui = {};

var tag = function(parent, type, clzz, attrs) {
    var elem = document.createElement(type);
    elem.className = clzz;
    parent.appendChild(elem);
    if (attrs) {
        for (var key in attrs) {
            elem.setAttribute(key, attrs[key]);
        }
    }
    return elem;
};

var divTag = function(parent, clzz) {
    return tag(parent, 'div', clzz);
};

var text = function(parent, txt) {
    var elem = document.createTextNode(txt);
    parent.appendChild(elem);
    return elem;
};

/**
 * @constructor
 */
function Interface(pos, cm, se, ee) {
    this.position = pos;
    this.cellMapping = cm;
    this.scoreElem = se;
    this.evalElem = ee;
    this.evalMapping = null;
}

Interface.prototype.update = function(r, c) {
    var tcell = this.cellMapping[r][c];
    var piece = this.position.at(r, c);
    tcell.innerHTML = '';

    if (piece > 0) {
        var style = 'tile-super';
        if (piece <= 2048) {
            style = 'tile-' + piece;
        }
        var tile = divTag(tcell, style);
        var tileInner = divTag(tile, 'tile-inner');
        text(tileInner, '' + piece);
    }
}
Interface.prototype.updateScore = function() {
    this.scoreElem.innerHTML = '';
    text(this.scoreElem, 'Score: ' + this.position.score);
}

function moveName(move) {
    var moveNames = [
        [game.left, 'left'],
        [game.right, 'right'],
        [game.up, 'up'],
        [game.down, 'down']
    ];
    for (var i = 0; i < moveNames.length; i++) {
        var mapping = moveNames[i];
        if (mapping[0][0] == move[0] && mapping[0][1] == move[1]) {
            return mapping[1];
        }
    }
    return 'unknown';
}

Interface.prototype.updateEval = function(strategy) {
    if (!this.evalMapping) {
        this.evalMapping = {};
        var table = divTag(this.evalElem, 'eval-table');
    
        for (var i = 0; i < game.allMoves.length; i++) {
            var move = game.allMoves[i];
            var evalRow = divTag(table, 'eval-move');
    
    
            var moveButton = tag(evalRow, 'input', 'eval-button', { value: moveName(move), type: 'button'})
            moveButton.addEventListener('click', (function(m) {
                return evt => {
                    interface.makeMove(m);
                }
            })(move));
            var scoreDiv = tag(evalRow, 'div', 'eval-score');
            this.evalMapping[moveName(move)] = scoreDiv;
        }
    }

    var stratMap = {};
    for (var i = 0; i < strategy.length; i++) {
        var strat = strategy[i];
        var move = strat.move;
        var value = strat.value;
        stratMap[moveName(move)] = value;
    }

    for (var i = 0; i < game.allMoves.length; i++) {
        var move = game.allMoves[i];
        var moveN = moveName(move);
        var value = stratMap[moveN];
        var scoreDiv = this.evalMapping[moveN];
        scoreDiv.innerHTML = '';
        if (value) {
            text(scoreDiv, '' + value);
        } else {
            text(scoreDiv, 'invalid');
        }
    }
}
Interface.prototype.refresh = function() {
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            this.update(r, c);
        }
    }
    this.updateScore();
}
Interface.prototype.makeMove = function(move) {
    var p1 = this.position.makeMove(move)
    if (p1 == null) {
        return;
    }
    this.position = p1;
    var p = this.position.evolve();
    if (p != null) {
        this.position = p;
    }
    if (this.position.gameOver()) {
        setTimeout(() => {
            window.alert("Game Over");
        }, 100);
    }
    requestAnimationFrame(() => {
        interface.refresh();
    })
}

ui.init = function(parent, pos) {   
    var cellMapping = {};
    var scoreElem = divTag(parent, 'score-elem');
    tag(parent, 'br', '');
    var table = divTag(parent, 'grid-container');
    var evalElem = divTag(parent, 'eval-elem');

    var interface = new Interface(pos, cellMapping, scoreElem, evalElem);

    for (let row = 0; row < 4; row++) {
        var trow = divTag(table, 'grid-row');
        var rowMapping = {};
        cellMapping[row] = rowMapping;

        for (let col = 0; col < 4; col++) {
            var tcell = divTag(trow, 'grid-cell');
            rowMapping[col] = tcell;

            (function(cell, r, c) {
                tcell.addEventListener('click', function() {
                    console.log("Click on " + r + ", " + c)
                    var currentPiece = interface.position.at(r, c);
                    var newPiece = null;
                    if (currentPiece == 0) {
                        newPiece = 2;
                    } else if (currentPiece < 8192) {
                        newPiece = 2 * currentPiece;
                    } else {
                        newPiece = 0;
                    }
                    interface.position.set(r, c, newPiece);
                    requestAnimationFrame(() => {
                        interface.update(r, c);
                        interface.updateScore();
                    });
                });
            })(tcell, row, col);

            interface.update(row, col);
        }
    }
    interface.updateScore();

    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    const moveMapping = {
        [LEFT]: game.left,
        [UP]: game.up,
        [RIGHT]: game.right,
        [DOWN]: game.down
    };
    document.addEventListener('keydown', function(evt) {
        var move = moveMapping[evt.keyCode];
        if (move) {
            console.log(move);
            interface.makeMove(move);
        }
    });
    return interface;
}