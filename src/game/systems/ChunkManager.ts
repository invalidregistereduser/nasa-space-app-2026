import Phaser from 'phaser';
import { makeRng } from '../art/draw';

export const CHUNK = 512;
/** Chunks of margin generated beyond the camera view. */
const MARGIN = 1;
/** Chunks built per frame, so streaming never costs a frame drop. */
const BUILD_BUDGET = 2;
const POOL_LIMIT = 160;

interface Placed {
  image: Phaser.GameObjects.Image;
  key: string;
}

interface Chunk {
  key: string;
  placed: Placed[];
  colliders: Phaser.GameObjects.Rectangle[];
}

/** Deterministic 32-bit hash of a chunk coordinate. */
function chunkSeed(cx: number, cy: number) {
  let h = Math.imul(cx, 374761393) + Math.imul(cy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Smooth 0..1 field used to vary terrain density across the surface. */
function biomeAt(cx: number, cy: number) {
  const corner = (x: number, y: number) => {
    const h = chunkSeed(x * 31 + 7, y * 17 + 3);
    return (h % 1000) / 1000;
  };
  const x0 = Math.floor(cx / 3);
  const y0 = Math.floor(cy / 3);
  const fx = cx / 3 - x0;
  const fy = cy / 3 - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = corner(x0, y0);
  const b = corner(x0 + 1, y0);
  const c = corner(x0, y0 + 1);
  const d = corner(x0 + 1, y0 + 1);
  return a * (1 - sx) * (1 - sy) + b * sx * (1 - sy) + c * (1 - sx) * sy + d * sx * sy;
}

export interface ChunkOptions {
  /** Static group every generated collider joins. */
  solids: Phaser.Physics.Arcade.StaticGroup;
  /** World y above which nothing may spawn (the backdrop starts there). */
  minY: number;
  /** True when a position is reserved by hand-authored content. */
  reserved: (x: number, y: number, radius: number) => boolean;
}

/**
 * Streams procedural surface detail around the camera.
 *
 * Chunks are generated from a seeded hash of their coordinates, so walking away
 * and coming back always rebuilds exactly the same rocks in the same places.
 * Everything is pooled: moving across the map allocates nothing after warm-up.
 */
export class ChunkManager {
  private scene: Phaser.Scene;
  private opts: ChunkOptions;
  private chunks = new Map<string, Chunk>();
  private queue: { cx: number; cy: number }[] = [];
  private queued = new Set<string>();
  private pools = new Map<string, Phaser.GameObjects.Image[]>();
  private colliderPool: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, opts: ChunkOptions) {
    this.scene = scene;
    this.opts = opts;
  }

  get activeCount() {
    return this.chunks.size;
  }

  /** Builds everything in view immediately — used on start and after teleports. */
  warmUp(view: Phaser.Geom.Rectangle) {
    this.queue.length = 0;
    this.queued.clear();
    this.refresh(view);
    while (this.queue.length) this.buildNext();
  }

  update(view: Phaser.Geom.Rectangle) {
    this.refresh(view);
    for (let i = 0; i < BUILD_BUDGET && this.queue.length; i++) this.buildNext();
  }

  private refresh(view: Phaser.Geom.Rectangle) {
    const c0 = Math.floor(view.x / CHUNK) - MARGIN;
    const c1 = Math.floor(view.right / CHUNK) + MARGIN;
    const r0 = Math.floor(view.y / CHUNK) - MARGIN;
    const r1 = Math.floor(view.bottom / CHUNK) + MARGIN;

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const key = `${c},${r}`;
        if (this.chunks.has(key) || this.queued.has(key)) continue;
        this.queued.add(key);
        this.queue.push({ cx: c, cy: r });
      }
    }

    // Release anything that drifted a full chunk beyond the margin.
    const keep = 1;
    for (const [key, chunk] of this.chunks) {
      const [c, r] = key.split(',').map(Number);
      if (c < c0 - keep || c > c1 + keep || r < r0 - keep || r > r1 + keep) {
        this.release(chunk);
        this.chunks.delete(key);
      }
    }
    if (this.queue.length) {
      // Forget anything that scrolled out of range before it was built.
      this.queue = this.queue.filter((item) => {
        const inside = item.cx >= c0 - 1 && item.cx <= c1 + 1 && item.cy >= r0 - 1 && item.cy <= r1 + 1;
        if (!inside) this.queued.delete(`${item.cx},${item.cy}`);
        return inside;
      });
      // Build the chunks closest to the centre of the view first.
      const mx = view.centerX / CHUNK;
      const my = view.centerY / CHUNK;
      this.queue.sort(
        (a, b) =>
          (a.cx - mx) ** 2 + (a.cy - my) ** 2 - ((b.cx - mx) ** 2 + (b.cy - my) ** 2),
      );
    }
  }

  private buildNext() {
    const next = this.queue.shift();
    if (!next) return;
    const key = `${next.cx},${next.cy}`;
    this.queued.delete(key);
    if (this.chunks.has(key)) return;
    this.chunks.set(key, this.generate(next.cx, next.cy, key));
  }

  /* ----------------------------------------------------------
     Generation
     ---------------------------------------------------------- */
  private generate(cx: number, cy: number, key: string): Chunk {
    const rng = makeRng(chunkSeed(cx, cy));
    const chunk: Chunk = { key, placed: [], colliders: [] };
    const baseX = cx * CHUNK;
    const baseY = cy * CHUNK;
    const biome = biomeAt(cx, cy);
    const rocky = biome > 0.58;
    const sandy = biome < 0.36;

    const spot = () => ({ x: baseX + rng() * CHUNK, y: baseY + rng() * CHUNK });

    const add = (
      texture: string,
      x: number,
      y: number,
      scale: number,
      depth: number,
      alpha = 1,
      angle = 0,
    ) => {
      const image = this.obtain(texture);
      image.setPosition(x, y);
      image.setScale(scale);
      image.setDepth(depth);
      image.setAlpha(alpha);
      image.setAngle(angle);
      image.setFlipX(rng() > 0.5);
      chunk.placed.push({ image, key: texture });
      return image;
    };

    const addCollider = (x: number, y: number, w: number, h: number) => {
      chunk.colliders.push(this.obtainCollider(x, y, w, h));
    };

    // --- Large soft ground variation --------------------------------------
    if (rng() < 0.75) {
      const p = spot();
      if (p.y >= this.opts.minY - CHUNK) {
        const patch = sandy ? 'region_plains' : rocky ? 'region_canyon' : 'region_flats';
        add(patch, p.x, p.y, 1.1 + rng() * 1.4, -1700, 0.1 + rng() * 0.16, rng() * 360);
      }
    }
    if (rng() < 0.55) {
      const p = spot();
      if (p.y >= this.opts.minY) {
        add('wind_streak', p.x, p.y, 0.8 + rng() * 1.3, -1600, 0.16 + rng() * 0.2, (rng() - 0.5) * 30);
      }
    }

    // --- Ground decals -----------------------------------------------------
    const craterCount = rocky ? 1 + Math.floor(rng() * 2) : rng() < 0.4 ? 1 : 0;
    for (let i = 0; i < craterCount; i++) {
      const p = spot();
      if (p.y < this.opts.minY || this.opts.reserved(p.x, p.y, 150)) continue;
      add(`crater_${Math.floor(rng() * 3)}`, p.x, p.y, 0.45 + rng() * 0.8, -1400, 0.78 + rng() * 0.2, rng() * 360);
    }

    const duneCount = sandy ? 1 + Math.floor(rng() * 2) : rng() < 0.3 ? 1 : 0;
    for (let i = 0; i < duneCount; i++) {
      const p = spot();
      if (p.y < this.opts.minY || this.opts.reserved(p.x, p.y, 120)) continue;
      add(`dune_${Math.floor(rng() * 3)}`, p.x, p.y, 0.7 + rng() * 1.0, -1380, 0.45 + rng() * 0.3);
    }

    const crackCount = rng() < 0.5 ? 1 : 0;
    for (let i = 0; i < crackCount; i++) {
      const p = spot();
      if (p.y < this.opts.minY) continue;
      add(`cracks_${Math.floor(rng() * 2)}`, p.x, p.y, 0.6 + rng() * 0.9, -1350, 0.26 + rng() * 0.22, rng() * 360);
    }

    // --- Pebbles (no collision) -------------------------------------------
    const pebbles = 4 + Math.floor(rng() * (rocky ? 9 : 5));
    for (let i = 0; i < pebbles; i++) {
      const p = spot();
      if (p.y < this.opts.minY || this.opts.reserved(p.x, p.y, 18)) continue;
      add(`rock_${Math.floor(rng() * 2)}`, p.x, p.y, 0.4 + rng() * 0.5, p.y);
    }

    // --- Rocks with collision ---------------------------------------------
    const rocks = (rocky ? 2 : 1) + Math.floor(rng() * 3);
    for (let i = 0; i < rocks; i++) {
      const p = spot();
      if (p.y < this.opts.minY || this.opts.reserved(p.x, p.y, 70)) continue;
      const big = rng() > 0.6;
      const texture = big ? `rock_${4 + Math.floor(rng() * 2)}` : `rock_${2 + Math.floor(rng() * 2)}`;
      const scale = big ? 0.8 + rng() * 0.55 : 0.65 + rng() * 0.45;
      const image = add(texture, p.x, p.y, scale, p.y);
      addCollider(
        p.x,
        p.y + image.displayHeight * 0.16,
        image.displayWidth * 0.5,
        image.displayHeight * 0.26,
      );
    }

    // --- Occasional boulder landmark --------------------------------------
    if (rng() < (rocky ? 0.5 : 0.16)) {
      const p = spot();
      if (p.y >= this.opts.minY && !this.opts.reserved(p.x, p.y, 150)) {
        const image = add(`boulder_${Math.floor(rng() * 3)}`, p.x, p.y, 0.75 + rng() * 0.5, p.y);
        addCollider(
          p.x,
          p.y + image.displayHeight * 0.18,
          image.displayWidth * 0.5,
          image.displayHeight * 0.28,
        );
      }
    }

    return chunk;
  }

  /* ----------------------------------------------------------
     Pooling
     ---------------------------------------------------------- */
  private obtain(texture: string) {
    const pool = this.pools.get(texture);
    const reused = pool?.pop();
    if (reused) {
      reused.setActive(true).setVisible(true);
      return reused;
    }
    return this.scene.add.image(0, 0, texture);
  }

  private obtainCollider(x: number, y: number, w: number, h: number) {
    const reused = this.colliderPool.pop();
    if (reused) {
      reused.setPosition(x, y);
      reused.setSize(w, h);
      const body = reused.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = true;
      body.setSize(w, h);
      body.updateFromGameObject();
      return reused;
    }
    const rect = this.scene.add.rectangle(x, y, w, h).setVisible(false);
    this.scene.physics.add.existing(rect, true);
    this.opts.solids.add(rect);
    return rect;
  }

  private release(chunk: Chunk) {
    for (const item of chunk.placed) {
      item.image.setVisible(false).setActive(false);
      let pool = this.pools.get(item.key);
      if (!pool) {
        pool = [];
        this.pools.set(item.key, pool);
      }
      if (pool.length < POOL_LIMIT) pool.push(item.image);
      else item.image.destroy();
    }
    chunk.placed.length = 0;

    for (const rect of chunk.colliders) {
      const body = rect.body as Phaser.Physics.Arcade.StaticBody | null;
      if (body) body.enable = false;
      rect.setVisible(false);
      if (this.colliderPool.length < POOL_LIMIT) this.colliderPool.push(rect);
      else rect.destroy();
    }
    chunk.colliders.length = 0;
  }

  destroy() {
    for (const chunk of this.chunks.values()) this.release(chunk);
    this.chunks.clear();
    this.queue.length = 0;
    this.queued.clear();
    this.pools.forEach((pool) => pool.forEach((image) => image.destroy()));
    this.pools.clear();
    this.colliderPool.forEach((rect) => rect.destroy());
    this.colliderPool.length = 0;
  }
}
