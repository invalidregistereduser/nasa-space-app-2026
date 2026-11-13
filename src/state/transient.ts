/** Short-lived UI context that never needs to survive a reload. */
import type { CropId, ItemId } from '../types';

export const transient = {
  /** Site the player last walked onto, used to preselect it in the build panel. */
  surveyedSite: null as string | null,
  /** Items picked up since the inventory was last opened. */
  newItems: new Set<ItemId>(),
  /** Seed taken from the shelf, waiting to go into a bed. */
  selectedSeed: null as CropId | null,
  /** True while the player is carrying a scoop of compost. */
  compostScoop: false,
};
