/**
 * @module Types
 * @layer Single Source of Truth
 * @description Global map tile definitions.
 */

export type TileType =
  | 'plain' | 'meadow' | 'floodplain' | 'irrigated'
  | 'forest' | 'clay' | 'stone' | 'marble' | 'limestone' | 'granite'
  | 'iron' | 'copper' | 'gold'
  | 'reeds' | 'marshland' | 'desert' | 'shoreline' | 'impassable_cliffs';