$(function() {
    
    function newMatrix(init, M, N) {
        var mat = [];
        for (var i = 0; i < M; i++) {
            var row = [];
            for (var j = 0; j < N; j++) {
                row.push(new init());
            }
            mat.push(row);
        }
        return mat;
    }

    function Tile() {
        this.letter = '';
        this.usage = '';
        this.type = '--';
        this.cell = null;
    }

    function Game(M, N, CR, CC, point_values, bonus) {
        this.M = M;
        this.N = N;
        this.CR = CR;
        this.CC = CC;
        this.tiles = newMatrix(Tile, M, N);
        this.point_values = point_values;
        this.bonus = bonus;
    }
    
    Game.prototype.bounds = function(i, j) {
        if (i >=0 && i < this.M) {
            if (j >= 0 && j < this.N) {
                return true;
            }
        }
        return false;
    };
    Game.prototype.setLetter = function(i, j, ch) {
        this.setLetterUsage(i, j, ch, ch);
    };
    Game.prototype.setLetterUsage = function(i, j, ch, use) {
        if (!this.bounds(i, j)) {
            return;
        }
        if (ch == ' ') {
            ch = '';
        }
        this.tiles[i][j].letter = ch;
        this.tiles[i][j].usage = use;
        var display;
        if (use == '?') {
            display = '.' + ch + '.';
        } else {
            display = ch;
        }
        var cell = this.tiles[i][j].cell;
        cell.text(display);
        cell.removeClass('demo');
        if (display != '') {
            cell.addClass('occupied');
        }
    };
    Game.prototype.setLetterUsageDemo = function(i, j, ch, use) {
        if (!this.bounds(i, j)) {
            return;
        }
        if (ch == ' ') {
            ch = '';
        }
        var display;
        if (use == '?') {
            display = '[' + ch + ']';
        } else {
            display = ch;
        }
        var cell = this.tiles[i][j].cell;
        cell.text(display);
        cell.removeClass('occupied');
        cell.addClass('demo');
    };
    Game.prototype.setWordUsage = function(pos, dir, word, usage) {
        var len = word.length;
        var ulen = usage.length;
        if (len != ulen) {
            console.log("Invalid usage length");
            return;
        }
        for (var k = 0; k < len; k++) {
            var i_ = pos[0] + k * dir[0];
            var j_ = pos[1] + k * dir[1];
            this.setLetterUsage(i_, j_, word[k], usage[k]);
        }
    };
    Game.prototype.setWordUsageDemo = function(pos, dir, word, usage) {
        var len = word.length;
        var ulen = usage.length;
        if (len != ulen) {
            console.log("Invalid usage length");
            return;
        }
        for (var k = 0; k < len; k++) {
            var i_ = pos[0] + k * dir[0];
            var j_ = pos[1] + k * dir[1];
            this.setLetterUsageDemo(i_, j_, word[k], usage[k]);
        }
    };
    Game.prototype.cancelDemo = function() {
        for (var i = 0; i < this.M; i++) {
            for (var j = 0; j < this.N; j++) {
                var tile = this.tiles[i][j];
                var letter = tile.letter;
                var usage = tile.usage;
                this.setLetterUsage(i, j, letter, usage);
            }
        }
    };

    Game.prototype.setType = function(positions, type) {
        for (var pos of positions) {
            if (this.bounds(pos[0], pos[1])) {
                this.tiles[pos[0]][pos[1]].type = type;
            }
        }
    }

    var wwf_point_values = {
        's': 1, 'r': 1, 't': 1, 'i': 1, 'o': 1, 'a': 1, 'e': 1,
        'l': 2, 'u': 2, 'd': 2, 'n': 2,
        'y': 3, 'g': 3, 'h': 3,
        'b': 4, 'c': 4, 'f': 4, 'm': 4, 'p': 4, 'w':4,
        'k': 5, 'v': 5,
        'x': 8,
        'j': 10, 'q': 10, 'z': 10, 
        '?': 0
    };

    var classic_point_values = {
        'l': 1, 'u': 1, 's': 1, 'i': 1, 'n': 1, 'r': 1, 'o': 1, 't': 1, 'a': 1, 'e': 1,
        'g': 2, 'd': 2, 
        'b': 3, 'p': 3, 'c': 3, 'm': 3,
        'v': 4, 'f': 4, 'w': 4, 'y': 4, 'h': 4,
        'k': 5,
        'j': 8, 'x': 8,
        'q': 10, 'z': 10,
        '?': 0
    };

    function eightfold(S, pos) {
        return ([
            [ pos[0], pos[1]], // pos itself
            [ pos[1], pos[0]], // rotated
            [ S - pos[0], pos[1]],
            [ S - pos[1], pos[0]],
            [ pos[0], S - pos[1]],
            [ pos[1], S - pos[0]],
            [ S - pos[0], S - pos[1]],
            [ S - pos[1], S - pos[0]]
        ]);
    }
    function apply_symmetry(arr, sym) {
        var out = [];
        for (var pos of arr) {
            out = out.concat(sym(pos));
        }
        return out;
    }

    function game_wwf() {
        var g = new Game(15, 15, 7, 7, wwf_point_values, 35);
        var sym = function(pos) {
            return eightfold(14, pos);
        };
        var tw = apply_symmetry([ [0, 3] ], sym);
        g.setType(tw, 'tw');
    
        var dw = apply_symmetry([ [1, 5], [3, 7] ], sym);
        g.setType(dw, 'dw');
        
        var tl = apply_symmetry([ [0, 6], [3, 3], [5, 5] ], sym);
        g.setType(tl, 'tl');
        
        var dl = apply_symmetry([ [1, 2], [2, 4], [4, 6] ], sym);
        g.setType(dl, 'dl');
        return g;
    }
     
    function game_wwf_solo() {
        var g = new Game(11, 11, 5, 5, wwf_point_values, 35);
        var sym = function(pos) {
            return eightfold(10, pos);
        };
        var tw = apply_symmetry([ [0, 2] ], sym);
        g.setType(tw, 'tw');
    
        var dw = apply_symmetry([ [1, 1], [1, 5] ], sym);
        g.setType(dw, 'dw');
        
        var tl = apply_symmetry([ [0, 0], [3, 3] ], sym);
        g.setType(tl, 'tl');
        
        var dl = apply_symmetry([ [2, 2], [2, 4] ], sym);
        g.setType(dl, 'dl');
        return g;
    }

    function game_classic() {
        var g = new Game(15, 15, 7, 7, classic_point_values, 50);
        var sym = function(pos) {
            return eightfold(14, pos);
        };
        var tw = apply_symmetry([ [0, 0], [0, 7] ], sym);
        g.setType(tw, 'tw');
    
        var dw = apply_symmetry([ [1, 1], [2, 2], [3, 3], [4, 4], [7, 7]], sym);
        g.setType(dw, 'dw');
        
        var tl = apply_symmetry([ [1, 5], [5, 5] ], sym);
        g.setType(tl, 'tl');
        
        var dl = apply_symmetry([ [0, 3], [2, 6], [3, 7], [6, 6] ], sym);
        g.setType(dl, 'dl');
        return g;
    }

    var selectI = -1, selectJ = -1;
    var typeDirection = [ 0, 1];    
    var selectedClass = 'selected-across'

    var changeSelection = function(game, i_, j_) {
        return function() {
            if (selectI != i_ || selectJ != j_) {
                if (game.bounds(selectI, selectJ)) {
                    var cell = game.tiles[selectI][selectJ].cell
                    cell.removeClass('selected-across');
                    cell.removeClass('selected-down');
                }
                selectI = i_;
                selectJ = j_;
                if (typeDirection[0] == 0) {
                    game.tiles[i_][j_].cell.addClass('selected-across');
                } else {
                    game.tiles[i_][j_].cell.addClass('selected-down');
                }
            } else {
                if (game.bounds(selectI, selectJ)) {
                    var tile = game.tiles[selectI][selectJ];
                    var cell = tile.cell;
                    var letter = tile.letter;
                    var usage = tile.usage;
                    typeDirection = [ typeDirection[1], typeDirection[0]]

                    if (typeDirection[0] == 0) {
                        cell.removeClass('selected-down');
                        cell.addClass('selected-across');
                    } else {
                        cell.removeClass('selected-across');
                        cell.addClass('selected-down');
                    }
                }
            }
        };
    };

    function newBoard(game) {
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
                $square.click(changeSelection(game, i, j));
                $square.dblclick(function(i_, j_) {
                    return function() {
                        var tile = game.tiles[i_][j_];
                        var letter = tile.letter;
                        if (letter == '') {
                            return;
                        }
                        var usage = tile.usage;
                        var newUsage;
                        if (usage == '?') {
                            newUsage = letter;
                        } else {
                            newUsage = '?';
                        }
                        game.setLetterUsage(i_, j_, letter, newUsage);
                    };
                }(i, j));
                var tile = game.tiles[i][j];
                tile.cell = $square;
                $square.addClass(tile.type);
            }
            $table.append($row);
        }
        $table.keypress(function (evt) {
            var ch = evt.key;
            if (ch >= 'A' && ch <= 'Z') {
                ch = ch.toLocaleLowerCase();
            }
            if (ch >= 'a' && ch <= 'z') {
                game.setLetter(selectI, selectJ, ch);
                changeSelection(game, selectI + typeDirection[0], selectJ + typeDirection[1])();
    
                evt.preventDefault();
            } if (ch == ' ') {
                game.setLetter(selectI, selectJ, '');
                evt.preventDefault();
            }
        });
        return $table;
    }
    
    var currentBoardType = '';
    var game;
    changeBoardType('classic');

    function changeBoardType(bt) {
        if (bt == currentBoardType) {
            return;
        }
        currentBoardType = bt;
        if (bt == 'wwf') {
            game = game_wwf();
        } else if (bt == 'wwf_solo') {
            game = game_wwf_solo();
        } else if (bt == 'classic') {
            game = game_classic();
        } else {
            console.log("Unsupported board type: " + bt);
        }
        $("#board").remove();
        window['game'] = game;
        var board = newBoard(game);
        
        $("#mainDiv").append(board);
    };

    $("#boardType").on("change", function(evt) {
        changeBoardType($("#boardType").val());
    });
});