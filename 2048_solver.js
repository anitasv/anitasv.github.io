importScripts('2048_game.js');
importScripts('2048_cache.js');

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

var compactPos = function(pos) {
    var state = "";
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            var point = pos.at(r, c);
            state += (logTable[point] + ";");
        }
    }
    return state;
}

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

var compactLoc = function(loc) {
    const [x, y] = loc;
    return x * 4 + y
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

// var qLearnMove = function(pos, move, depth, exploreQuota) {
//     let p2 = pos.makeMove(move);

//     let choices = getChoices(p2);
//     var pick = randInt(0, choices.length);
//     var randomChoice = choices[pick];
//     var beta = alpha / (choices.length);

//     if (randInt(0, 10) < 9) {
//         beta = beta * .9;
//         p2.set(randomChoice[0], randomChoice[1], 2);
//     } else {
//         beta = beta * .1;
//         p2.set(randomChoice[0], randomChoice[1], 4);
//     }
//     var learnedValue = qlearn(p2, depth - 1, false, exploreQuota);
    
//     var key = compact(pos) + compactMove(move);
//     var currentValue = qTable[key];
//     if (!currentValue) {
//         currentValue = learnedValue;
//     } else {
//         currentValue = currentValue * (1 - beta) + beta * learnedValue;
//     }
//     qTable[key] = currentValue;
// }

// var qLearnMove = function(pos, move, depth) {
//     const key = compact(pos) + compactMove(move);
//     const p2 = pos.makeMove(move);

//     const choices = getChoices(p2);

//     if (choices.length == 0) {
//         qTable[key] = p2.score
//         return
//     }

//     let sumValues = 0
//     for (let randomChoice of choices) {
//         p2.set(randomChoice[0], randomChoice[1], 2);
//         const value2 = qlearn(p2, depth - 1, false);

//         p2.set(randomChoice[0], randomChoice[1], 4);
//         const value4 = qlearn(p2, depth - 1, false);
        
//         const learnedValue = 0.9 * value2 + .1 * value4
//         sumValues += learnedValue

//         // var beta = alpha / (choices.length);
//         // var currentValue = qTable[key];
//         // if (!currentValue) {
//         //     currentValue = learnedValue;
//         // } else {
//         //     currentValue = currentValue * (1 - beta) + beta * learnedValue;
//         // }
//     }

//     qTable[key] = sumValues / choices.length;

// }

var qState = function(pos, moves) {
    var qMax = -1;

    for (var mj = 0; mj < moves.length; mj++) {
        var candidateMove = moves[mj];
        const prePos = pos.makeMove(candidateMove)
        const key = compactPos(prePos)
        var candidate = null;
        if (qTablePre.has(key)) {
            candidate = qTablePre.get(key)
        } else {
            candidate = qLearnPre(prePos, 0, 0);
        }
        if (candidate > qMax) {
            qMax = candidate;
        }
    }
    return qMax == -1 ? null : qMax;
}

const bounds = (loc) => {
    const x = loc[0], y = loc[1]
    if (x >=0 && x < 4 && y >= 0 && y < 4) {
        return true
    } else {
        return false
    }
};

const neighboursSlow = (src) => {
    const ret = []
    const addLoc = (loc) => { if (bounds(loc)) ret.push(loc); }
    const [x, y] = src;
    addLoc([x+1, y])
    addLoc([x-1, y])
    addLoc([x, y+1])
    addLoc([x, y-1])
    return ret
}

const neighboursMap = new Map()
const neighbours = (src) => {
    const cSrc = compactLoc(src)
    const ret = neighboursMap.get(cSrc)
    if (ret) {
        return ret
    } else {
        const newRet = neighboursSlow(src)
        neighboursMap.set(cSrc, newRet)
        return newRet
    }
} 

const paths = [];

const initPaths = () => {
    const add = (a, b) => {
        return [a[0] + b[0], a[1] + b[1]]
    }

    const mapPath = (start, dirX, dirY) => {
        let vertex = start;
        let currentDirX = dirX;
        const ret = []

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                ret.push(compactLoc(vertex));
                if (j != 3) {
                    vertex = add(vertex, currentDirX)
                }
            }
            vertex = add(vertex, dirY);
            currentDirX = [-currentDirX[0], -currentDirX[1]];
        }
        if (new Set(ret).size != 16) {
            console.warn("Some error!", ret);
        }

        return ret;
    }
    const bothDirs = (start, dirX, dirY) => {
        paths.push(mapPath(start, dirX, dirY));
        paths.push(mapPath(start, dirY, dirX));
    }
    const findDirs = (start) => {
        const dirX = start[0] == 0? [1, 0] : [-1, 0];
        const dirY = start[1] == 0? [0, 1] : [0, -1];
        bothDirs(start, dirX, dirY);
    }

    findDirs([0, 0])
    findDirs([0, 3])
    findDirs([3, 0])
    findDirs([3, 3])
}

initPaths();
console.log(paths);

var evalLeaf = function(pos) {
    // return pos.score;

    let sumPoints = 0
    for (let i = 0; i < 16; i++) {
        sumPoints += pos.direct(i);
    }

    let totalEval = 0

    for (const p of paths) {
        let prev = null;
        let currentEval = 0;
        let order = 1
        for (const index of p) {
            const newVal = pos.direct(index)

            if (prev == null) {
                prev = newVal;
                currentEval += newVal;
                continue;
            }
            if (newVal > 0 && prev >= newVal) {
                currentEval += order * newVal
                if (prev > newVal) {
                    order++;
                }
                prev = newVal;
            } else {
                break;
            }
        }
        const finalCurrent = 2 * currentEval - sumPoints;
        if (finalCurrent > totalEval) {
            totalEval = finalCurrent;
        }
    }

    return pos.score + totalEval;

    // const dfs = (src, visited) => {
    //     const val = pos.at(src[0], src[1])

    //     let bestSoFar = 0
    //     for (const loc of neighbours(src)) {
    //         var valAt = pos.at(loc[0], loc[1])
    //         if (valAt > val) {
    //             continue
    //         }
    //         const cLoc = compactLoc(loc)
    //         if (visited.has(cLoc)) {
    //             continue
    //         }
    //         visited.add(cLoc)
    //         const branchScore = dfs(loc, visited)
    //         if (branchScore > bestSoFar) {
    //             bestSoFar = branchScore
    //         }
    //         visited.delete(cLoc)
    //     }
    //     return bestSoFar + val
    // }

    // let c1 = dfs([0, 0], new Set())
    // let c2 = dfs([0, 3], new Set())
    // let c3 = dfs([3, 0], new Set())
    // let c4 = dfs([3, 3], new Set())

    // return Math.max(c1, Math.max(c2, Math.max(c3, c4)))
}
//
// Action(pos, move, randomEvent) -> pos
// ActionPre(pos, move) -> prePos
// Forward(prePos, randomEvent) -> pos
//
// qTable ::: pos -> score ::: eval operates here.
// qTablePre :: prePos -> score
//
const qTablePre = new LRUCache(100000)
const alpha = 0.1;

var qLearnPreSub = function(prePos, depth, exploreQuota, choices) {
    const randIndex = randInt(0, choices.length)
    const randomChoice = choices[randIndex]

    const randomOut = randInt(0, 10) == 0 ? 4: 2;

    prePos.set(randomChoice[0], randomChoice[1], randomOut);
    const learnedValue = qlearn(prePos, depth - 1, exploreQuota);
    prePos.set(randomChoice[0], randomChoice[1], 0);

    if (depth < 0) {
        return proposedValue;
    }

    var beta = alpha / choices.length;
    const key = compactPos(prePos)
    if (qTablePre.has(key)) {
        var currentValue = qTablePre.get(key)
        const newValue = currentValue * (1 - beta) + beta * learnedValue;
        qTablePre.set(key, newValue)
        return newValue
    } else {
        qTablePre.set(key, learnedValue);
        return learnedValue
    }
}

var qLearnPreSubSlow = function(prePos, depth, exploreQuota, choices) {

    let sumValues = 0

    for (const randomChoice of choices) {

        prePos.set(randomChoice[0], randomChoice[1], 2);
        const value2 = qlearn(prePos, depth - 1, exploreQuota);
    
        prePos.set(randomChoice[0], randomChoice[1], 4);
        const value4 = qlearn(prePos, depth - 1, exploreQuota);

        prePos.set(randomChoice[0], randomChoice[1], 0);

        const learnedValue = .9 * value2 + .1 * value4;

        sumValues += learnedValue
    }

    const proposedValue = sumValues / (choices.length);

    if (depth < 0) {
        return proposedValue;
    }
    const beta = alpha;
    const key = compactPos(prePos)
    if (qTablePre.has(key)) {
        var currentValue = qTablePre.get(key)
        const newValue = currentValue * (1 - beta) + beta * proposedValue;
        qTablePre.set(key, newValue)
        return newValue
    } else {
        qTablePre.set(key, proposedValue);
        return proposedValue
    }

}


var qLearnPre = function(prePos, depth, exploreQuota) {
    const choices = getChoices(prePos);

    if (choices.length == 0) {
        console.warn("No choices after makeMove!")
        return 0
    } else {
        return qLearnPreSub(prePos, depth, exploreQuota, choices);
    }
}

var qLearnMove = function(pos, move, depth, exploreQuota) {
    const prePos = pos.makeMove(move)
    return qLearnPre(prePos, depth, exploreQuota)
}
 
// var qlearn = function(pos, depth, exploreQuota) {

//     let moves = pos.moves();

//     if (moves.length == 0) {
//         return pos.score;
//     }

//     if (depth <= 0) {
//         return evalLeaf(pos)
//     } else {
//         for(const move of moves) {
//             qLearnMove(pos, move, depth, exploreQuota);
//         }
//     }
    
//     return qState(pos, moves);
// }

// var qlearn = function(pos, depth, exploreQuota) {

//     let moves = pos.moves();

//     if (moves.length == 0) {
//         return pos.score;
//     }

//     if (depth <= 0) {
//         return evalLeaf(pos)
//     } else {
//         const chooseRandom = () => {
//             const mi = randInt(0, moves.length);
//             return moves[mi];
//         }
//         const chooseBest = () => {
//             const {  move  } = bestMove(pos, false, true)
//             if (move) {
//                 return move;
//             } else {
//                 return chooseRandom();
//             }
//         }
//         const decideMove = () => {
//             if (depth == 1 || randInt(0, 10) == 0) { // 10% probability to explore
//                 return chooseRandom()
//             } else {
//                 return chooseBest();
//             }
//         }

//         if (exploreQuota > 0) {
//             const move = decideMove();
//             if (move) {
//                 qLearnMove(pos, move, depth, exploreQuota - 1);
//             }
//         } else {
//             const move = chooseBest();
//             qLearnMove(pos, move, depth, exploreQuota);
//         }
//     }
    
//     return qState(pos, moves);
// }

var qlearn = function(pos, depth, exploreQuota) {

    let currentDepth = depth;
    let currentPos = pos;
    let currentQuota = exploreQuota;

    const stack = [];

    while (true) {
        let moves = currentPos.moves();

        if (moves.length == 0) {
            break;
        }

        const chooseRandom = () => {
            const mi = randInt(0, moves.length);
            return moves[mi];
        }
        const chooseBest = () => {
            const {  move  } = bestMove(currentPos, false, true)
            if (move) {
                return move;
            } else {
                return chooseRandom();
            }
        }
        const decideMove = () => {
            if (randInt(0, 10) == 0) { // 10% probability to explore
                return chooseRandom()
            } else {
                return chooseBest();
            }
        }

        // const exploreMoves = () => {
        //     if (currentQuota > 0) {
        //         const move = decideMove();
        //         if (move) {
        //             currentQuota--;
        //         }
        //         return move;
        //     } else {
        //         return chooseBest();
        //     }
        // }

        const move = decideMove();
        if (!move) {
            console.warn("No move found", pos);
            debugger
        }

        const prePos = currentPos.makeMove(move);

        stack.push([currentPos, moves, compactPos(prePos)])

        const choices = getChoices(prePos);

        const randIndex = randInt(0, choices.length)
        const randomChoice = choices[randIndex]
    
        const randomOut = randInt(0, 10) == 0 ? 4: 2;

        prePos.set(randomChoice[0], randomChoice[1], randomOut);
        
        currentDepth--;
        currentPos = prePos;
    }

    let learnedValue = currentPos.score;

    while (stack.length > 0) {
        const [priorPosition, priorMoves, prePosKey] = stack.pop();

        if (qTablePre.has(prePosKey)) {
            var currentValue = qTablePre.get(prePosKey)
            currentValue.count = currentValue.count + 1;
            currentValue.total = currentValue.total + learnedValue;
        } else {
            qTablePre.set(prePosKey, { total: learnedValue, count: 1 } );
        }

        let newLearnedValue = null;

        for (const move of priorMoves) {
            const possiblePrePos = priorPosition.makeMove(move);
            const possibleKey = compactPos(possiblePrePos)
            const possibleVal = qTablePre.get(possibleKey)
            if (possibleVal) {
                const possibleScore = (possibleVal.total / possibleVal.count);

                if (newLearnedValue == null) {
                    newLearnedValue = possibleScore;
                } else {
                    if (newLearnedValue < possibleScore) {
                        newLearnedValue = possibleScore;
                    }
                }
            }
        }
        if (newLearnedValue != null) {
            learnedValue = newLearnedValue;
        } else {
            // Should not happen!
            debugger
        }
    }

    return learnedValue;

}

var bestMove = function(pos, isDebug, isExhaustive) {
    let moves = pos.moves();

    let bestValue = -1;
    let bestMove = null;
    let debug = [];

    for (let mi = 0; mi < moves.length; mi++) {
        let move = moves[mi];
        const prePos = pos.makeMove(move)
        var key = compactPos(prePos)
        var value = qTablePre.get(key);
        if (!value && isExhaustive) {
            value = { total: evalLeaf(prePos), count: 1 }
        }
        if (value) {
            const score = value.total / value.count;
            if (score > bestValue) {
                bestValue = score;
                bestMove = move;
            }
            if (isDebug) {
                debug[compactMove(move)] = score;
                debug.push({ move, value: score });
            }
        }
    }

    return {
        score: bestValue,
        move: bestMove,
        debug
    }
}

let depth = null
let maxIterations = null

const findBest = function(pos) {
    console.log("Evaluating at depth", depth, " with ", maxIterations, " iterations")

    for (let i = 0; i < maxIterations; i++) {
        qlearn(pos, depth, 1);
    }

    console.log("Cache size: ", qTablePre.size());
    return bestMove(pos, true, false);
}

var oldGeneration = -1;

onmessage = function(e) {
    try {
        var messageObj = JSON.parse(e.data);
        var posObj = messageObj.position;
        var generation = messageObj.generation;
        if (generation != oldGeneration) {
            oldGeneration = generation;
            depth=8;
            maxIterations = 100
        } else {
            // if (depth < 100) {
            //     depth++;
            //     // maxIterations += 1;
            // }
        }
        var pos = new Position(posObj.arr, posObj.score);
        // console.log(pos);
        var reply = JSON.stringify({
            response: findBest(pos),
            generation: generation
        });
        postMessage(reply);
    } catch(e) {
        debugger;
        console.warn(e);
    }

}
