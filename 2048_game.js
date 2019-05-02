var game = {};

game.left = [0, -1];
game.right = [0, 1];
game.down = [1, 0];
game.up = [-1, 0];

game.allMoves = [game.left, game.right, game.down, game.up];

game.bounds = function(row, col) {
    return row >= 0 && row < 4 && col >=0 && col < 4;
}

game.empty = function() {
    return new Position([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 0);
};

/**
 * @constructor
 */
function Position(arr, score) {
    this.arr = arr;
    this.score = score;
};

Position.prototype.at = function(row, col) {
    return this.arr[row * 4 + col];
};

Position.prototype.set = function(row, col, val) {
    this.arr[row * 4 + col] = val;
};

Position.prototype.moves = function() {
    var allMoves = [ game.left, game.right, game.down, game.up ];
    var moves = [];
    for (var i = 0; i < allMoves.length; i++) {
        var move = allMoves[i];
        var p = this.makeMove(move);
        if (p != null) {
            moves.push(move);
        }
    }
    return moves;
};

Position.prototype.isValid = function(move) {
    return true;
};

Position.prototype.makeMove = function(move) {
    var p = game.empty();
    p.score = this.score;
    if (move[0] == 0) {
        var dir = move[1];
        var positive = dir > 0;
        var start = positive ? 3 : 0;
        var end = positive ? -1 : 4;

        for (var x = 0; x != 4; x++) {
            var reduced = [];
            for (var y = start; y != end; y-= dir) {
                var cursor = this.at(x, y);
                if (cursor != 0) {
                    reduced.push(cursor);
                }
            }
            var i = 0;
            for (var y = start; y != end; y-= dir) {
                if (i < reduced.length) {
                    var cursor = reduced[i];
                    i++;
                    if (i < reduced.length) {
                        var pcursor = reduced[i];
                        if (cursor == pcursor) {
                            var newValue = cursor + pcursor;
                            p.set(x, y, newValue);
                            p.score += newValue;
                            i++;
                        } else {
                            p.set(x, y, cursor);
                        }
                    } else {
                        p.set(x, y, cursor);
                    }
                } else {
                    break;
                }
            }
        }
    } else {
        var dir = move[0];
        var positive = dir > 0;
        var start = positive ? 3 : 0;
        var end = positive ? -1 : 4;

        for (var y = 0; y != 4; y++) {
            var reduced = [];
            for (var x = start; x != end; x-= dir) {
                var cursor = this.at(x, y);
                if (cursor != 0) {
                    reduced.push(cursor);
                }
            }
            var i = 0;
            for (var x = start; x != end; x-= dir) {
                if (i < reduced.length) {
                    var cursor = reduced[i];
                    i++;
                    if (i < reduced.length) {
                        var pcursor = reduced[i];
                        if (cursor == pcursor) {
                            var newValue = cursor + pcursor;
                            p.set(x, y, newValue);
                            p.score += newValue;
                            i++;
                        } else {
                            p.set(x, y, cursor);
                        }
                    } else {
                        p.set(x, y, cursor);
                    }
                } else {
                    break;
                }
            }
        }
    }
    var validChange = false;
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            if (this.at(r, c) != p.at(r, c)) {
                validChange = true;
                return p;
            }
        }
    }
    return null;
};

Position.prototype.evolve = function() {
    var choices = [];
    for (var i = 0; i < 16; i++) {
        if (this.arr[i] == 0) {
            choices.push(i);
        }
    }
    if (choices.length == 0) {
        // Game over!!!
        return null;
    }
    var index = randInt(0, choices.length);
    var loc = choices[index];
    var newTerm = Math.random() < .9 ? 2 : 4;
    var p = new Position(this.arr.slice(0), this.score);
    p.set(Math.floor(loc/4), loc%4, newTerm);
    return p;
    // return this;
};


Position.prototype.gameOver = function() {
    return this.moves().length == 0;
};

function randInt(low, high) {
    var x = low + Math.floor(Math.random() * (high - low));
    if (x >= high) {
        x = high - 1;
    }
    return x;
}

game.random = function() {
    // return game.empty();
    var p = game.empty(); 
    var x = randInt(0, 16);
    var y = randInt(0, 15);
    if (y >= x) {
        y = y + 1;
    }
    p.set(Math.floor(x / 4), x % 4, 2);
    p.set(Math.floor(y / 4), y % 4, 2);
    console.log(x, y);
    return p;
}
