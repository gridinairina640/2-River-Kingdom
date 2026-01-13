/**
 * @module Types
 * @layer Single Source of Truth
 * @description Global Entity Component System (ECS) types.
 */

export type EntityId = number;

export interface IComponent {
  readonly type: string;
}