/**
 * @module Types
 * @layer Single Source of Truth
 * @description Global game event definitions for EventBus.
 */

import { EntityId } from './ecs';

export type GameEvent =
  | { type: 'BUILDING_PLACED'; payload: { id: EntityId; x: number; y: number } }
  | { type: 'RESOURCE_UPDATED'; payload: { resource: string; amount: number } };