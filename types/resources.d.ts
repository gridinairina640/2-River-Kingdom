/**
 * @module Types
 * @layer Single Source of Truth
 * @description Global resource definitions and cost interfaces.
 */

export type ResourceType =
  | 'wheat' | 'vegetables' | 'fruit' | 'meat' | 'fish' | 'barley'
  | 'wood' | 'clay' | 'brick' | 'stone' | 'marble' | 'limestone' | 'granite'
  | 'iron' | 'copper_ore' | 'gold_ore'
  | 'flax' | 'wool' | 'reeds' | 'henna'
  | 'furniture' | 'pottery' | 'copper_ingot' | 'gold_ingot'
  | 'linen' | 'cloth' | 'papyrus' | 'cosmetics' | 'incense'
  | 'weapons' | 'beer';

export interface IResourceCost {
  type: ResourceType;
  amount: number;
}