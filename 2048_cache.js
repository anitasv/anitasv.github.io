const newNode = item => {
    return {
        item: item,
        next: null,
        prev: null
    }
};

class Linked {
    constructor() {
        this.pivot = newNode(null);
        this.pivot.next = this.pivot;
        this.pivot.prev = this.pivot;
    }

    appendLast(node) {
        const tail = this.pivot.prev;
        // pivot <-> .... <-> ... <-> tail <-> node <-> pivot
        tail.next = node;
        node.prev = tail;

        node.next = this.pivot;
        this.pivot.prev = node;

        // pivot <-> pivot case:
        // pivot <-> node <-> pivot
    }

    head() {
        const actualHead = this.pivot.next;
        if (actualHead != this.pivot) {
            return actualHead;
        } else {
            // so that pivot is never leaked outside.
            return null;
        }
    }

    tail() {
        const actualTail = this.pivot.prev;
        if (actualTail != this.pivot) {
            return actualTail;
        } else {
            // so that pivot is not leaked outside.
            return null;
        }
    }

    detachNode(node) {
        // prev <-> node <-> next
        // prev <-> next
        const prev = node.prev;
        const next = node.next;
        node.prev = null;
        node.next = null;

        prev.next = next;
        next.prev = prev;
    }
}

class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize
        this.lruList = new Linked();
        this.internalMap = new Map()
    }

    has(key) {
        return this.internalMap.has(key);
    }

    set(key, value) {
        if (this.internalMap.has(key)) {
            const currentNode = this.internalMap.get(key)
            this.lruList.detachNode(currentNode)
        } else {
            if (this.internalMap.size >= this.maxSize) {
                // Eviction Condition
                const lruNode = this.lruList.head()
                if (lruNode) {
                    this.lruList.detachNode(lruNode)
                    this.internalMap.delete(lruNode.item.key)
                }
            }
        }

        const toInsert = newNode({key, value});
        this.lruList.appendLast(toInsert);

        this.internalMap.set(key, toInsert)
    }

    size() {
        return this.internalMap.size;
    }

    get(key) {
        const currentNode = this.internalMap.get(key)
        if (currentNode) {
            return currentNode.item.value;
        } else {
            return null;
        }
    }
}