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
var alpha = 0.9;

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
    // TODO: implement better eval function.
    var base = pos.score;

    var bonus = 0;
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            var v = pos.at(r, c);
            if (v > 0) {
                bonus += logTable[v];
            }
        }
    }
    var scoreBonus = powTable[Math.floor(bonus/16)];
    return base + scoreBonus;
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

var qlearn = function(pos) {
    let moves = pos.moves();

    if (moves.length == 0) {
        return pos.score;
    }

    var mi = randInt(0, moves.length);
    let move = moves[mi];
    
    let p2 = pos.makeMove(move);

    let choices = getChoices(p2);
    var pick = randInt(0, choices.length);
    var randomChoice = choices[pick];
    if (randInt(0, 10) < 9) {
        p2.set(randomChoice[0], randomChoice[1], 2);
    } else {
        p2.set(randomChoice[0], randomChoice[1], 4);
    }

    var learnedValue = qlearn(p2);
    
    var key = compact(pos) + compactMove(move);
    var currentValue = qTable[key];
    if (!currentValue) {
        currentValue = learnedValue;
    } else {
        currentValue = currentValue * (1 - alpha) + alpha * learnedValue;
    }
    qTable[key] = currentValue;

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

    for (var i = 0; i < 1000; i++) {
        qlearn(pos);
    }
    let moves = pos.moves();

    let bestValue = -1;
    let bestMove = null;

    for (let mi = 0; mi < moves.length; mi++) {
        let move = moves[mi];
        var key = compact(pos) + compactMove(move);
        var value = qTable[key];
        if (value) {
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }
    }

    return {
        score: bestValue,
        move: bestMove
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
                move: entry.move
            };
        }
    }
    ++miss;
    var sc = rawScore(pos, depth, isDebug);
    transposition[c] = {
        score: (sc.score - pos.score),
        move: sc.move,
        depth: depth
    }
    return sc;
}

var rawScore = function(pos, depth, isDebug) {

    if (depth == 0) {
        return {
            score: eval(pos),
            move: null
        }
    }

    let moves = pos.moves();

    if (moves.length == 0) {
        return {
            score: pos.score,
            move: null
        }
    }

    let bestScore = -1;
    let bestMove = null;
    let debug = {};

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
            debug[move] = totalScore;
        }
    }

    return {
        score: bestScore,
        move: bestMove,
        debug: debug
    }

};

solver.findBest = function(pos) {
    var m = null;
    var s = bestMove(pos);
    m = s.move;
    console.log("score=", s.score, "move=", m);
    return m;
}
