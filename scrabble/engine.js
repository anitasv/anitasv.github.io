
function comparator(p1, p2) {
    return - p1[1] + p2[1];
}

function getScorer(game, pos, dir, len) {
    var i = pos[0]
    var j = pos[1]
    var off_i = dir[0]
    var off_j = dir[1]
    var scorer = [];
    for (var k = 0; k < len; k++) {
        var i_ = i + k * off_i;
        var j_ = j + k * off_j;
        if (!game.bounds(i_, j_)) {
            console.log("Add breakpoint here");
        }
        var tile = game.tiles[i_][j_];
        if (tile.letter == '') {
            scorer.push(tile.type);
        } else {
            scorer.push('ff');
        }
    }
    return scorer;
}

function probeEndPoint(game, pos, dir, reverse) {
    var word = '';
    var usage = '';
    var i_ = pos[0]
    var j_ = pos[1]

    var perp_i = dir[0]
    var perp_j = dir[1]

    var start = 1;
    var end_point;
    while (true) {
        var ip = i_ + start * perp_i;
        var jp = j_ + start * perp_j;
        if (game.bounds(ip, jp)) {
            var tile = game.tiles[ip][jp];
            if (tile.letter == '') {
                break;
            } else {
                if (reverse) {
                    word = word + tile.letter;
                    usage = usage + tile.usage;
                } else {
                    word = tile.letter + word;
                    usage = tile.usage + usage;
                }
                start++;
            }
        } else {
            start--;
            break;
        }
    }
    var end_point = [i_ + start * perp_i, j_ + start * perp_j];
    return [end_point, word, usage];
}

function doScore(cand, game, move_spec) {
    var word = cand[0];
    var usage = cand[1];
    var score = 0;
    var pos = move_spec[0];
    var dir = move_spec[1];
    // main-line
    var len = word.length;

    var boundary_i = pos[0] + len * dir[0]
    var boundary_j = pos[1] + len * dir[1]

    if (game.bounds(boundary_i, boundary_j)) {
        var tile = game.tiles[boundary_i][boundary_j];
        if (tile.letter != '') {
            return -1;
        }
    }
    var mainlinescorer = getScorer(game, pos, dir, len);
    var tilesUsed = 0;
    for (var powerup of mainlinescorer) {
        if (powerup != 'ff') {
            tilesUsed++;
        }
    }
    if (tilesUsed >= 7) {
        score += game.bonus;
    }
    if (tilesUsed == 0) {
        return -1;
    }
    score += doScoreLine(usage, game.point_values, mainlinescorer);

    var i = pos[0];
    var j = pos[1];

    var off_i = dir[0];
    var off_j = dir[1];

    var perp_i = 1 - dir[0];
    var perp_j = 1 - dir[1];

    var perp_dir = [ perp_i, perp_j];
    var perp_dir_reverse = [ -perp_i, - perp_j];

    for (var k = 0; k < len; k++) {
        var i_ = i + k * off_i;
        var j_ = j + k * off_j;
        var tile = game.tiles[i_][j_];
        if (tile.letter != '') {
            continue;
        }
        var pos_ = [i_, j_];
        var endPair = probeEndPoint(game, pos_, perp_dir, true);
        var startPair = probeEndPoint(game, pos_, perp_dir_reverse, false);

        var startCoordinate = startPair[0];
        var startWord = startPair[1];
        var startUsage = startPair[2];
        var endCoordinate = endPair[0];
        var endWord = endPair[1];
        var endUsage = endPair[2];

        var middleletter = word[k];
        var fullword = startWord + middleletter + endWord;
        if (fullword.length > 1) {
            if (dictionary.has(fullword)) {

                var middleusage = usage[k];
                var fullusage = startUsage + middleusage + endUsage;

                var perpCordinate;
                if (startWord.length > 0) {
                    perpCordinate = startCoordinate;
                } else {
                    perpCordinate = pos_;
                }
                var perpScorer = getScorer(game, perpCordinate, perp_dir, fullword.length);
                score += doScoreLine(fullusage, game.point_values, perpScorer);
            } else {
                return -1;
            }
        }
    }
    return score;
}

function doScoreLine(usage, point_values, scorer) {
    var score = 0;
    var dw_count = 0;
    var tw_count = 0;

    for (var index in usage) {
        var letter = usage[index];
        var powerup = scorer[index];
        if (powerup == 'dw') {
            dw_count++;
            score += point_values[letter];                        
        } else if (powerup == 'tw') {
            tw_count++;
            score += point_values[letter];                        
        } else if (powerup == 'dl') {
            score += 2 * point_values[letter];
        } else if (powerup == 'tl') {
            score += 3 * point_values[letter];            
        } else if (powerup == 'ff') {
            score += point_values[letter];                        
        } else if (powerup == '--') {
            score += point_values[letter];                        
        }
    }        
    while (dw_count--) {
        score *= 2;
    }
    while (tw_count--) {
        score *= 3;
    }
    return score;
}

function checkNeighbour(game, pos, dir) {
    var i = pos[0];
    var j = pos[1];
    var ip = pos[0] + dir[0]
    var jp = pos[1] + dir[1];
    if (game.bounds(ip, jp)) {
        var tile = game.tiles[ip][jp];
        if (tile.letter != '') {
            return true;
        }
    }
    return false;
}
function checkAtleastOne(game, pos, dir) {
    var perp = [dir[1], dir[0]];
    var left = checkNeighbour(game, pos, perp);
    var right = checkNeighbour(game, pos, [ -perp[0], -perp[1]]);
    return left || right;
}

function generate(game, len, off_i, off_j) {
    var problems = [];

    for (var i = 0; i < game.M; i++) {
        for (var j = 0; j < game.N; j++) {
            var k = 0;
            var l = 0;
            var matcher = '';
            var originalUsage = '';
            var scorer = '';

            var valid = false;

            var ip = i - off_i;
            var jp = j - off_j;
            if (game.bounds(ip, jp)) {
                if (game.tiles[ip][jp].letter != '') {
                    continue;
                }
            }

            while (l < len) {
                var i_ = i + k * off_i;
                var j_ = j + k * off_j;

                if (game.CR == i_ && game.CC == j_) {
                    if (!valid) {
                        valid = true;
                        min_len = k + 1;
                    }
                }
                if (checkAtleastOne(game, [i_, j_], [off_i, off_j])) {
                    if (!valid) {
                        valid = true;
                        min_len = k + 1;
                    }                   
                }

                if (game.bounds(i_, j_)) {
                    var tile = game.tiles[i_][j_];
                    var letter = tile.letter;
                    var usage = tile.usage;
                    if (letter == '') {
                        l++;
                        letter = '.';
                        usage = '.';
                        scorer += tile.type;
                    } else {
                        if (!valid) {
                            valid = true;
                            min_len = k + 1;
                        }
                        scorer += 'ff';
                    }
                    matcher += letter;
                    originalUsage += usage;
                    k++;
                } else {
                    break;
                }
            }
            if (valid) {
                problems.push([matcher, [ min_len, [[i, j], [off_i, off_j]], originalUsage]]);
            }
        }
    }
    return problems;
}

function gen_bags(game, len) {
    var v = generate(game, len, 0, 1);
    var h = generate(game, len, 1, 0);
    var all = v.concat(h);
    var bags = {};

    for (var problem of all) {
        var matcher = problem[0];
        if (!(matcher in bags)) {
            bags[matcher] = [];
        }
        bags[matcher].push(problem[1]);
    }
    return bags;
}

function solve(game, hand) {
    var bags = gen_bags(game, hand.length);
    var scored = [];
    for (var matcher in bags) {
        var options = bags[matcher];
        var candidates = search(hand, matcher);
        for (var option of options) {
            var min_len = option[0];
            var move_spec = option[1];
            var originalUsage = option[2];
            for (var cand of candidates) {
                var word = cand[0]
                var usage = cand[1]
                var correctedUsage = '';
                for (var l in usage) {
                    var proposedUse = usage[l];
                    var originalUse = originalUsage[l];
                    var resolvedUse;
                    if (originalUse == '.') {
                        resolvedUse = proposedUse;
                    } else{
                        resolvedUse = originalUse;
                    }
                    correctedUsage += resolvedUse;
                }

                var correctedCand = [word, correctedUsage];

                if (word.length < min_len) {
                    continue;
                }
                var score = doScore(correctedCand, game, move_spec);
                if (score >= 0) {
                    scored.push([correctedCand, score, move_spec]);
                }
            }
        }
    }
    return scored.sort(comparator);
    // if (sorted.length != 0) {
    //     var highscore = sorted[0][1];
    //     var ret = [];
    //     for (var move of sorted) {
    //         if (move[1] == highscore) {
    //             ret.push(move);
    //         }
    //     }
    //     return ret;
    // } else {
    //     return sorted;
    // }
}

function makeMoveDemo(game, move) {
    game.setWordUsageDemo(move[2][0], move[2][1], move[0][0], move[0][1])
}
function makeMove(game, move) {
    game.setWordUsage(move[2][0], move[2][1], move[0][0], move[0][1])
}

$(function() {
    var last_word = '';
    var solutions = [];
    var solIndex = 0;

    $("#next").click(function() {
        var new_word = $('#hand').val();
        console.log(new_word);
        
        if (new_word != last_word) {
            last_word = new_word;
            solutions = solve(game, new_word);
        }
        if (solutions.length > 0) {
            var move = solutions[solIndex++];
            if (solIndex >= solutions.length) {
                solIndex = 0;
            }
            game.cancelDemo();
            var move = solutions[solIndex];
            var score = move[1];
            $("#score").text(score);
            makeMoveDemo(game, move);
        }
    })
    $("#accept").click(function() {
        if (solutions.length > 0) {
            var move = solutions[solIndex];
            game.cancelDemo();
            makeMove(game, solutions[solIndex]);
            last_word = '';
            solutions = [];
            solIndex = 0;
            $("#score").text(0);
        }
    })
    $("#cancel").click(function() {
        game.cancelDemo();
        last_word = '';
        solutions = [];
        solIndex = 0;
        $("#score").text(0);
    });
});