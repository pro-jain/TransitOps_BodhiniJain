/**
 * Generic binary min-heap.
 * Accepts a comparator (a, b) => number, same contract as Array.prototype.sort.
 * Used by:
 *  - fleetSizing.service.js (heap of trip end-times, keyed by Date)
 *  - complianceQueue.service.js (heap of license expiries / maintenance due dates)
 *
 * All operations are O(log n) except peek() and size() which are O(1).
 */
export class MinHeap {
  constructor(comparator = (a, b) => a - b) {
    this.data = [];
    this.comparator = comparator;
  }

  size() {
    return this.data.length;
  }

  isEmpty() {
    return this.data.length === 0;
  }

  peek() {
    return this.isEmpty() ? undefined : this.data[0];
  }

  push(value) {
    this.data.push(value);
    this._bubbleUp(this.data.length - 1);
    return this;
  }

  pop() {
    if (this.isEmpty()) return undefined;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._bubbleDown(0);
    }
    return top;
  }

  toSortedArray() {
    const clone = new MinHeap(this.comparator);
    clone.data = [...this.data];
    const out = [];
    while (!clone.isEmpty()) out.push(clone.pop());
    return out;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.comparator(this.data[index], this.data[parent]) < 0) {
        [this.data[index], this.data[parent]] = [this.data[parent], this.data[index]];
        index = parent;
      } else break;
    }
  }

  _bubbleDown(index) {
    const n = this.data.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < n && this.comparator(this.data[left], this.data[smallest]) < 0) smallest = left;
      if (right < n && this.comparator(this.data[right], this.data[smallest]) < 0) smallest = right;
      if (smallest === index) break;
      [this.data[index], this.data[smallest]] = [this.data[smallest], this.data[index]];
      index = smallest;
    }
  }
}
