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

var transposition = {};
var qTable = {};
var alpha = 0.2;

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
var powTable = {
    0:1,
    1:2,
    2:4,
    3:8,
    4:16,
    5:32,
    6:64,
    7:128,
    8:256,
    9:512,
    10:1024,
    11:2048,
    12:4096,
    13:8192,
    14:16384,
    15:32576,
    16:65536
}

var eval = function(pos) {
    return qlearn(pos, 0);
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
    if (randInt(0, 10) < 9) {
        p2.set(randomChoice[0], randomChoice[1], 2);
    } else {
        p2.set(randomChoice[0], randomChoice[1], 4);
    }

    var learnedValue = qlearn(p2, depth - 1);
    
    var key = compact(pos) + compactMove(move);
    var currentValue = qTable[key];
    if (!currentValue) {
        currentValue = learnedValue;
    } else {
        currentValue = currentValue * (1 - alpha) + alpha * learnedValue;
    }
    qTable[key] = currentValue;
}

var qlearn = function(pos, depth) {
    let moves = pos.moves();

    if (moves.length == 0) {
        return pos.score;
    }

    if (depth < 0) {
        let move = null;
        if (randInt(0, 10) < 8) {
            var s = bestMove(pos);
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

    return qMax;
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


var score = function(pos, depth, isDebug) {
    if (depth == 0) {
        return rawScore(pos, depth);
    }
    var c = compact(pos) + (isDebug ? 'd' : 'n');
    var entry = transposition[c];
    if (entry != null) {
        if (entry.depth >= depth) {
            ++hits;
            return {
                score: entry.score + pos.score,
                move: entry.move,
                debug: entry.debug
            };
        }
    }
    ++miss;
    var sc = rawScore(pos, depth, isDebug);
    transposition[c] = {
        score: (sc.score - pos.score),
        move: sc.move,
        debug: sc.debug,
        depth: depth
    }
    return sc;
}

var rawScore = function(pos, depth, isDebug) {

    if (depth == 0) {
        return {
            score: eval(pos),
            move: null,
            debug: []
        }
    }

    let moves = pos.moves();

    if (moves.length == 0) {
        return {
            score: pos.score,
            move: null,
            debug: []
        }
    }

    let bestScore = -1;
    let bestMove = null;
    let debug = [];

    for (let mi = 0; mi < moves.length; mi++) {
        let move = moves[mi];
        
        let p2 = pos.makeMove(move);

        let choices = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (p2.at(r, c) == 0) {
                    choices.push([r, c]);
                }
            }
        }
        let totalScore = 0;

        let smallChoices = [];
        if (choices.length > 2) {
            while (smallChoices.length < 2) {
                var pick = randInt(0, choices.length);
                smallChoices.push(choices[pick]);
            }
        } else {
            smallChoices = choices;
        }
        
        for (let c = 0; c < smallChoices.length; c++) {
            let choice = smallChoices[c];
            p2.set(choice[0], choice[1], 2);
            let s2 = score(p2, depth - 1).score;
            p2.set(choice[0], choice[1], 4);
            let s4 = score(p2, depth - 1).score;
            p2.set(choice[0], choice[1], 0);
            totalScore += .9 * s2 + .1 * s4;
        }


        if (choices.length == 0) {
            totalScore = eval(p2);
        } else {
            totalScore = totalScore / smallChoices.length;
        }
        
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestMove = move;
        }
        if (isDebug) {
            debug.push({
                move: move,
                value: totalScore
            })
        }
    }

    return {
        score: bestScore,
        move: bestMove,
        debug: debug
    }

};

solver.findBest = function(pos) {
    qlearn(pos, 2);

    return bestMove(pos);

    // var s = score(pos, 2, true);
    // return s;

}

onmessage = function(e) {
    try {
        var messageObj = JSON.parse(e.data);
        var posObj = messageObj.position;
        var generation = messageObj.generation;
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
