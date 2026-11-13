/** Minimal typed event bus bridging React and Phaser. */
export type BusEvents = {
  'game:ready': void;
  'player:blackout': void;
  'player:recovered': void;
  'camera:shake': { duration: number; intensity: number };
  'camera:flash': { color?: number; duration?: number };
  'camera:focus': { zoom?: number; hold?: number } | undefined;
  'world:collect': { id: string };
  'world:ride': { riding: boolean };
  'world:build-start': { siteId: string };
  'world:build-stage': { stage: number };
  'world:build-complete': void;
  'world:crop-stage': { stage: number };
  'gh:watered': { slot: number };
  'gh:planted': { slot: number };
  'gh:harvested': { slot: number };
  'gh:enter': void;
  'gh:exit': void;
  'ui:thought': { text: string };
  'world:enter-greenhouse': void;
  'world:transmit': void;
  'world:refill': void;
  'nav:waypoint': { id: string | null };
  'ui:interact': void;
  'ui:panel': { panel: string };
  'ui:mission-complete': { code: string; title: string };
  'ui:collect-fx': { icon: string; screenX: number; screenY: number };
  'ui:saving': void;
  'time:sol': { sol: number };
};

type Key = keyof BusEvents;
type Handler<K extends Key> = (payload: BusEvents[K]) => void;

const handlers = new Map<Key, Set<Handler<Key>>>();

export const bus = {
  on<K extends Key>(event: K, handler: Handler<K>) {
    let set = handlers.get(event);
    if (!set) {
      set = new Set();
      handlers.set(event, set);
    }
    set.add(handler as Handler<Key>);
    return () => bus.off(event, handler);
  },
  off<K extends Key>(event: K, handler: Handler<K>) {
    handlers.get(event)?.delete(handler as Handler<Key>);
  },
  emit<K extends Key>(event: K, payload?: BusEvents[K]) {
    const set = handlers.get(event);
    if (!set) return;
    set.forEach((h) => {
      try {
        (h as (p: unknown) => void)(payload);
      } catch (err) {
        console.error(`[bus] handler for "${String(event)}" failed`, err);
      }
    });
  },
  clear() {
    handlers.clear();
  },
};
