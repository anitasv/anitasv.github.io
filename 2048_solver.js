importScripts('2048_game.js');

var solver = {};

var compact = function(pos) {
    var state = "";
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            var point = pos.at(r, c);
            state += (logTable[point] + ";");
        }
    }
    return state;
}

var qTable = {};
var alpha = 1.0;

var logTable = {
    0:0,
    2:1,
    4:2,
    8:3,
    16:4,
    32:5,
    64:6,
    128:7,
    256:8,
    512:9,
    1024:10,
    2048:11,
    4096:12,
    8192:13,
    16384:14,
    32576:15,
    65536:16
}

var hits = 0;
var miss = 0;

var compactMove = function(move) {
    if (move[0] == -1) {
        return "L";
    } else if (move[0] == 1) {
        return "R";
    } else if (move[1] == -1) {
        return "U";
    } else if (move[1] == 1) {
        return "D";
    }
    return "K";
}

var getChoices = function(pos) {
    let choices = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (pos.at(r, c) == 0) {
                choices.push([r, c]);
            }
        }
    }
    return choices;
}

var qLearnMove = function(pos, move, depth) {
    let p2 = pos.makeMove(move);

    let choices = getChoices(p2);
    var pick = randInt(0, choices.length);
    var randomChoice = choices[pick];
    var beta = alpha / (choices.length);

    if (randInt(0, 10) < 9) {
        beta = beta * .9;
        p2.set(randomChoice[0], randomChoice[1], 2);
    } else {
        beta = beta * .1;
        p2.set(randomChoice[0], randomChoice[1], 4);
    }
    var learnedValue = qlearn(p2, depth - 1);
    
    var key = compact(pos) + compactMove(move);
    var currentValue = qTable[key];
    if (!currentValue) {
        currentValue = learnedValue;
    } else {
        currentValue = currentValue * (1 - beta) + beta * learnedValue;
    }
    qTable[key] = currentValue;
}

var qState = function(pos, moves) {
    var qMax = -1;

    for (var mj = 0; mj < moves.length; mj++) {
        var candidateMove = moves[mj];
        var key = compact(pos) + compactMove(candidateMove);
        var candidate = qTable[key];
        if (candidate) {
            if (candidate > qMax) {
                qMax = candidate;
            }
        }
    }
    return qMax == -1 ? null : qMax;
}

var qlearn = function(pos, depth) {
    let moves = pos.moves();

    if (moves.length == 0) {
        return pos.score;
    }

    if (depth < 0) {
        let move = null;
        if (randInt(0, 10) < 0) {
            var s = solver.bestMoveTerminal(pos)
            if (s) {
                if (s.move) {
                    move = s.move;
                }
            }
        }
        if (!move) {
            let mi = randInt(0, moves.length);
            move = moves[mi];
        }
        qLearnMove(pos, move, depth);
    } else {
        for (let mi = 0; mi < moves.length; mi++) {
            let move = moves[mi];
            qLearnMove(pos, move, depth);
        }
    }
    
    return qState(pos, moves);
}

var bestMove = function(pos) {
    let moves = pos.moves();

    let bestValue = -1;
    let bestMove = null;
    let debug = [];

    for (let mi = 0; mi < moves.length; mi++) {
        let move = moves[mi];
        var key = compact(pos) + compactMove(move);
        var value = qTable[key];
        if (value) {
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
            debug[compactMove(move)] = value;
            debug.push({ move, value });
        }
    }

    return {
        score: bestValue,
        move: bestMove,
        debug
    }
}


solver.findBest = function(pos) {
    for (var i = 0; i < 100; i++) {
        qlearn(pos, -1);
    }

    return bestMove(pos);
}

var oldGeneration = -1;

onmessage = function(e) {
    try {
        var messageObj = JSON.parse(e.data);
        var posObj = messageObj.position;
        var generation = messageObj.generation;
        if (generation != oldGeneration) {
            oldGeneration = generation;
            qTable = {};
            transposition= {};
            console.log(generation + ". QTable reset to handle out of memory issues")
        }
        var pos = new Position(posObj.arr, posObj.score);
        // console.log(pos);
        var reply = JSON.stringify({
            response: solver.findBest(pos),
            generation: generation
        });
        postMessage(reply);
    } catch(e) {
        console.warn(e);
    }

}
