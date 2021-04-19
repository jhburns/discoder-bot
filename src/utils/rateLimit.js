class UsingSet {
  constructor() {
    this.usingList = new Set();
  }

  addUser(userId) {
    this.usingList.add(userId);

    return () => this.usingList.delete(userId);
  }

  has(userId) {
    return this.usingList.has(userId);
  }

  toString() {
    return "[" + Array.from(this.usingList).join(", ") + "]"
  }
}

export default { UsingSet };