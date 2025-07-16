/**
 * Union-Find data structure for tracking connected road features in Carcassonne tiles.
 * Used to detect completed roads (loops or roads with both ends closed).
 */
export class UnionFind {
  par: number[];
  private rank: number[];
  private openSides: number[];
  private done: boolean[];
  private tileIds: number[][];
  private coa: number[];

  constructor() {
    this.par = [];
    this.rank = [];
    this.openSides = [];
    this.done = [];
    this.tileIds = [];
    this.coa = [];
  }

  /**
   * Creates a new feature (road segment) in the union-find structure.
   * @param tileId - The ID of the tile containing this feature
   * @param openSide - Number of open sides for this feature
   * @param withCoa - Whether this feature has a coat of arms (pennant)
   */
  newFeature(tileId: number, openSide: number, withCoa: boolean): void {
    this.par.push(this.par.length);
    this.rank.push(1);
    this.openSides.push(openSide);
    this.done.push(false);
    this.tileIds.push([tileId]);
    this.coa.push(withCoa ? 1 : 0);
  }

  /**
   * Finds the root of the set containing x with path compression.
   * @param x - The element to find the root for
   * @returns The root of the set containing x
   */
  root(x: number): number {
    if (x !== this.par[x]) {
      const par = this.par[x];
      const r = this.root(par);
      this.par[x] = r;
    }
    return this.par[x];
  }

  /**
   * Unites two sets and merges their properties.
   * @param x - First set element
   * @param y - Second set element
   */
  unite(x: number, y: number): void {
    let rootX = this.root(x);
    let rootY = this.root(y);

    if (this.rank[rootX] > this.rank[rootY]) {
      [rootX, rootY] = [rootY, rootX];
    }

    if (rootX === rootY) {
      // When merging already same set, only open_sides reduced by 2
      this.openSides[rootY] -= 2;
      return;
    }

    this.openSides[rootY] = this.openSides[rootY] + this.openSides[rootX] - 2;
    this.par[rootX] = rootY;
    this.rank[rootY] += this.rank[rootX];
    this.coa[rootY] += this.coa[rootX];

    // Merge tile_ids
    const tileIdsToMerge = [...this.tileIds[rootX]];
    this.tileIds[rootY].push(...tileIdsToMerge);
  }

  /**
   * Checks if a feature is completed (no open sides).
   * @param x - The element to check
   * @returns True if the feature is completed
   */
  isCompleted(x: number): boolean {
    const rootX = this.root(x);
    return this.openSides[rootX] === 0;
  }

  /**
   * Checks if two elements are in the same set.
   * @param x - First element
   * @param y - Second element
   * @returns True if both elements are in the same set
   */
  isSameSet(x: number, y: number): boolean {
    return this.root(x) === this.root(y);
  }

  /**
   * Gets the size of the set containing x (number of unique tiles + coat of arms).
   * @param x - The element to get the size for
   * @returns The size of the set
   */
  size(x: number): number {
    const rootX = this.root(x);
    // Remove duplicates from tile IDs
    const uniqueTileIds = Array.from(new Set(this.tileIds[rootX]));
    return uniqueTileIds.length + this.coa[rootX];
  }

  /**
   * Gets all tile IDs in the set containing x.
   * @param x - The element to get tile IDs for
   * @returns Array of tile IDs in the set
   */
  getTileIds(x: number): number[] {
    const rootX = this.root(x);
    return [...this.tileIds[rootX]];
  }

  /**
   * Gets the number of open sides for a feature.
   * @param x - The element to get open sides for
   * @returns Number of open sides for the feature
   */
  getOpenSides(x: number): number {
    const rootX = this.root(x);
    return this.openSides[rootX];
  }

  /**
   * Resets the union-find structure to empty state.
   */
  reset(): void {
    this.par = [];
    this.rank = [];
    this.openSides = [];
    this.done = [];
    this.tileIds = [];
    this.coa = [];
  }
}
