/**
 * @constructor
 */
function Stream() {
    this.listeners = [];
};

/**
 * Adds a function as callback.
 * @param {Function.<Object>} cb callback function that gets event.
 */
Stream.prototype.addCallback = function(cb) {
    this.listeners.push(cb);
};

/**
 * Triggers the event.
 */
Stream.prototype.trigger = function(evt) {
    for (var i = 0; i < this.listeners.length; i++) {
        try {
            this.listeners[i](evt);
        } catch(e) {
            console.log(e);
        }
    }
};

/**
 * @constructor
 * @param {Number} N 
 */
function Game(N) {
    this.N = N;
    this.state = [];
    this.streams = [];
    this.moveStream = new Stream();

    for (var i = 0; i < N; i++) {
        var row = [];
        var streamrow = [];
        for (var j = 0; j < N; j++) {
            row.push(false);
            streamrow.push(new Stream());
        }
        this.state.push(row);
        this.streams.push(streamrow);
    }
}

/**
 * Play at position (i, j)
 * @param {Number} i row number. (0 to N - 1)
 * @param {Number} j col number. (0 to N - 1)
 */
Game.prototype.play = function(i, j) {
    if (this.bounds(i, j)) {
        var flips = [ [i, j], [i - 1, j], [i + 1, j], [i, j -1], [i, j + 1]];
        for (var c = 0; c < flips.length; c++) {
            this.flip(flips[c][0], flips[c][1]);
        }
        this.moveStream.trigger({ i : i, j : j});
    }
};

/**
 * Checks if i is within bounds.
 * @param {Number} i row number. (0 to N - 1)
 */
Game.prototype.bound_chk = function(i) {
    return 0 <= i && i < this.N;
};

/**
 * Checks if (i, j) is within bounds.
 * 
 * @param {Number} i row number. (0 to N - 1)
 * @param {Number} j col number. (0 to N - 1)
 */
Game.prototype.bounds = function(i, j) {
    return this.bound_chk(i) && this.bound_chk(j);
};

/**
 * Flip that location.
 * If invalid position no action is taken.
 * 
 * @param {Number} i row number. (0 to N - 1)
 * @param {Number} j col number. (0 to N - 1)
 */
Game.prototype.flip = function(i, j) {
    if (this.bounds(i, j)) {
        this.state[i][j] = !(this.state[i][j]);
        this.streams[i][j].trigger(this.state[i][j])
    }
};

/**
 * Adds a callback that will get triggered if cell(i, j) changes
 * with the new value of the cell.
 */
Game.prototype.addEventListener = function(evt, cb) {
    evt.addCallback(this, cb);
};

/**
 * @constructor
 * 
 * @param {Number} i 
 * @param {Number} j 
 */
function FlipEvent(i, j) {
    this.i = i;
    this.j = j;
}

FlipEvent.prototype.addCallback = function(game, cb) {
    if (game.bounds(this.i, this.j)) {
        game.streams[this.i][this.j].addCallback(cb);
    }
};

/**
 * @constructor
 */
function MoveEvent() {
}

MoveEvent.prototype.addCallback = function(game, cb) {
    game.moveStream.addCallback(cb);
}

function newNode(parent, type) {
    var n = document.createElement(type);
    parent.appendChild(n);
    return n;
}

function newTextNode(parent, txt) {
    var n = document.createTextNode(txt);
    parent.appendChild(n);
    return n;
}

function parseList(hashSnip) {
    var vals = [];
    var qps = hashSnip.split(';');
    for (var i = 0; i < qps.length; i++) {
        var entry = qps[i];
        var entrySplits = entry.split(',');
        var list = [];
        for (var j = 0; j < entrySplits.length; j++) {
            list.push(entrySplits[j])
        }
        vals.push(list);
    }
    return vals;
}

function parseHash(hash) {
    var vals = {};
    if (hash) {
        if (hash[0] == '#') {
            var qps = hash.substr(1).split('&');
            for (var i = 0; i < qps.length; i++) {
                var entry = qps[i];
                var entrySplits = entry.split('=');
                var key = decodeURIComponent(entrySplits[0]);
                var val = decodeURIComponent(entrySplits[1]);
                vals[key] = val;
            }
        }
    }
    return vals;
}

function main(mainDiv, hash, hashcb) {

    var hashStruct = parseHash(hash);

    var N = hashStruct['N'];
    if (N == null) {
        N = 5;
        hashcb('N=5');
    } else {
        N = parseInt(N);
    }

    var game = new Game(N);

    var resetButton = newNode(mainDiv, 'input');
    resetButton.setAttribute('type', 'button');
    resetButton.setAttribute('value', 'Reset');
    resetButton.addEventListener('click', function() {
        hashcb('#N=' + N);
        window.location.reload();
    })

    var nextLevel = newNode(mainDiv, 'input');
    nextLevel.setAttribute('type', 'button');
    nextLevel.setAttribute('value', 'Next Level');
    nextLevel.addEventListener('click', function() {
        hashcb('#N=' + (N+1));
        window.location.reload();
    })

    var prevLevel = newNode(mainDiv, 'input');
    prevLevel.setAttribute('type', 'button');
    prevLevel.setAttribute('value', 'Previous Level');
    prevLevel.addEventListener('click', function() {
        hashcb('#N=' + (N-1));
        window.location.reload();
    })

    var boardDiv = newNode(mainDiv, 'div');
    boardDiv.style.display = 'table';
    boardDiv.style.border = '2px solid #888888';

    for (var i = 0; i < N; i++) {
        var row = newNode(boardDiv, 'div');
        row.style.display = 'table-row';

        for (var j = 0; j < N; j++) {
            var cell = newNode(row, 'div');
            cell.style.display = 'table-cell';
            cell.style.height = '50px';
            cell.style.width = '50px';
            cell.style['border'] = '2px solid black';
            cell.style.padding = '2px';
            cell.style['background-color'] = '#BBBBBB'

            cell.addEventListener('click', (function(i_, j_) {
                return function() {
                    game.play(i_, j_);
                }
            })(i, j));
            game.addEventListener(new FlipEvent(i, j), (function(cell_) {
                return function(val) {
                    if (val) {
                        cell_.style['background-color'] = '#333333';
                    } else {
                        cell_.style['background-color'] = '#BBBBBB';
                    };
                }
            })(cell));
        }
    }

    var moves = [];
        
    game.addEventListener(new MoveEvent(), function(evt) {
        moves.push(evt);
        var moveStrList = [];
        for (var c = 0; c < moves.length; c++) {
            moveStrList.push(moves[c].i + ',' + moves[c].j);
        }
        var snip = 'N=' + N + '&moves=' + moveStrList.join(';');
        hashcb(snip);
    })

    if (hash) {
        var moveSplits = hashStruct['moves'];
        if (moveSplits) {
            moveSplits = parseList(moveSplits);
        }
        if (moveSplits) {
                console.log(moveSplits)
            for (var c = 0; c < moveSplits.length; c++) {
                if (moveSplits[c].length >= 2) {
                    game.play(parseInt(moveSplits[c][0]), parseInt(moveSplits[c][1]));
                }
            }
        }
    }
}

main(
    document.getElementById('board'), 
    window.location.hash,
    function(newhash) {
        window.location.hash = newhash;
    }
);
