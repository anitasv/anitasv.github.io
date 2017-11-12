function Multiset() {
    this.map = {};
    this.size = 0;
}
Multiset.prototype.add = function(item) {
    this.size++;
    if (item in this.map) {
        this.map[item]++;
    } else {
        this.map[item] = 1;
    }
};
Multiset.prototype.addAll = function(items) {
    for (var item of items) {
        this.add(item);
    }
};
Multiset.prototype.delete = function(item) {
    if (this.has(item)) {
        this.size--;
        this.map[item]--;
        return true;
    } else {
        return false;
    }
};
Multiset.prototype.deleteAll = function(item) {
    if (this.has(item)) {
        this.size-=this.map[item];
        this.map[item]=0;
        return true;
    } else {
        return false;
    }
};

Multiset.prototype.has = function(item) {
    if (item in this.map) {
        return (this.map[item] > 0);
    } else {
        return false;
    }
};
Multiset.prototype.empty = function() {
    return this.size == 0;
};