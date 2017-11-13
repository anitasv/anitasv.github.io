$(function() {
    function strSort(text) {
        return text.split('').sort().join('');
    }

    function Node() {
        this.childmap = {};
        this.accept = false;
    }
    
    function addToTrie(head, word) {
        var point = head;
        for (var look of word) {
            var map = point.childmap;
            if (look in map) {
                point = map[look]
            } else {
                point = new Node();
                map[look] = point;
            }
        }
        point.accept = true;
    }

    function makeTrie(word_list) {
        var head = new Node();
        for (var word of word_list) {
            addToTrie(head, word);
        }
        return head;
    }

    function scanTrie(prefix, node, chSet, wildcards, matcher, usage, output) {
        if (chSet.empty() && wildcards == 0) {
            return;
        }
        if (prefix.length >= matcher.length) {
            return;
        }
        var must = matcher[prefix.length];

        for (var key in node.childmap) {
            if (must != '.') {
                if (key == must) {
                    var nextnode = node.childmap[key];
                    var nextprefix = prefix + key;
                    var nextusage = usage + key;
                    if (nextnode.accept) {
                        output.push([nextprefix, nextusage]);
                    }
                    scanTrie(nextprefix, nextnode, chSet, wildcards, matcher, nextusage, output);
                }
            } else {
                if (wildcards > 0) {
                    var nextnode = node.childmap[key];
                    var nextprefix = prefix + key;
                    var nextusage = usage + '?';
                    if (nextnode.accept) {
                        output.push([nextprefix, nextusage]);
                    }
                    scanTrie(nextprefix, nextnode, chSet, wildcards - 1, matcher, nextusage, output);
                }
                if (chSet.has(key)) {
                    var nextnode = node.childmap[key];
                    var nextprefix = prefix + key;
                    var nextusage = usage + key;
                    if (nextnode.accept) {
                        output.push([nextprefix, nextusage]);
                    }
                    chSet.delete(key);
                    scanTrie(nextprefix, nextnode, chSet, wildcards, matcher, nextusage, output);
                    chSet.add(key);
                }
            }
        }
    }

    function search(head, challenge, matcher) {
        var output = [];
        var chSet = new Multiset();
        chSet.addAll(challenge.split(''));
        var wildcards = 0;
        if (chSet.has('?')) {
            chSet.deleteAll('?');
            for (var wild of challenge) {
                if (wild == '?') {
                    wildcards++;
                }
            }
        }
        scanTrie("", head, chSet, wildcards, matcher, "", output);
        return output;
    }

    function load_dictionary(words) {
        var word_list = words.split('\n');
        console.log("Downloaded: " + word_list.length + " words");
        var head = makeTrie(word_list);
        console.log("Processed: " + word_list.length + " words");
        window['dictionary'] = new Set(word_list);
        window['search'] = function(challenge, matcher) {
            return search(head, challenge, matcher);
        };
    }

    var current_dict = '';
    function update_dictionary(dict) {
        if (dict == current_dict) {
            return;
        }
        console.log("Changing dictionary to: " + dict);
        if (dict == 'enable1') {
           $.ajax('enable1.txt').done(load_dictionary)
        } else if (dict == 'sowpods') {
           $.ajax('sowpods.txt').done(load_dictionary)
        } else {
            console.log("Unknown dictionary" + dict);
        }
    }

    $("#dictType").on("change", function() {
        var dict = $("#dictType").val();
        update_dictionary(dict);
    });

    update_dictionary('enable1');
});