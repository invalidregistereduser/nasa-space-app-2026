import {
  BUILD_SITE_BY_ID,
  LOCATION_BY_ID,
  PICKUP_BY_ID,
  STRUCTURES,
} from './constants';
import type { GameState } from '../types';
import { MISSIONS } from '../state/missions';

export interface WaypointTarget {
  id: string;
  x: number;
  y: number;
  label: string;
}

const STRUCTURE_LABELS: Record<string, string> = {
  ship: 'Descent Module',
  shelter: 'Emergency Shelter',
  airlock: 'Shelter Airlock',
  rover: 'Expedition Rover',
  transmitter: 'Transmitter Mast',
};

/** Resolves a waypoint id against every kind of world anchor. */
export function resolveWaypoint(id: string | null | undefined): WaypointTarget | null {
  if (!id) return null;
  const pickup = PICKUP_BY_ID[id];
  if (pickup) return { id, x: pickup.x, y: pickup.y, label: pickup.label };
  const site = BUILD_SITE_BY_ID[id];
  if (site) return { id, x: site.x, y: site.y, label: site.name };
  const loc = LOCATION_BY_ID[id];
  if (loc) return { id, x: loc.x, y: loc.y, label: loc.name };
  const structure = (STRUCTURES as Record<string, { x: number; y: number }>)[id];
  if (structure) {
    return { id, x: structure.x, y: structure.y, label: STRUCTURE_LABELS[id] ?? id };
  }
  return null;
}

/** The waypoint for the mission the player is currently on. */
export function currentWaypoint(s: GameState): WaypointTarget | null {
  const pinned = resolveWaypoint(s.ui.waypointOverride);
  if (pinned) return pinned;
  const mission = MISSIONS[s.missionIndex];
  if (!mission) return null;
  const id = mission.waypointOf ? mission.waypointOf(s) : mission.waypoint ?? null;
  return resolveWaypoint(id);
}
