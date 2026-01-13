```markdown
# Architecture Specification — Empire of the Two Rivers

## Version 5.0 — Fully Formalized Worker-Based Architecture

**Last updated:** 2026-01-13

---

## 1. Introduction

"Empire of the Two Rivers" — детерминированный градостроительный симулятор с ECS-ядром, вынесенным в Web Worker. Архитектура построена по принципам **AI-first**, с формальными контрактами, строгим разделением слоёв, синхронным BridgeCache, типизированным протоколом сообщений и предсказуемыми потоками данных.

### Документ определяет:

- Слои системы
- Worker-архитектуру
- Bridge Synchronization Model
- Worker Communication Protocol
- Snapshot Model
- Query API
- Input Commands
- Simulation Loop
- Worker Lifecycle
- Zustand UI model
- Error Handling

> **Документ является архитектурным контрактом для всех разработчиков и LLM-агентов.**

---

## 2. Architectural Goals

- Детерминизм симуляции
- 60 TPS fixed timestep
- Изоляция Core в Web Worker
- AI-first: machine-readable контракты
- Строгое разделение ответственности
- Высокая производительность CPU/GPU
- Реплеи, сериализация, тестируемость
- Масштабируемость (AI, экономика, логистика)

---

## 3. Core Architectural Principles

### 3.1 Determinism

- Фиксированный порядок систем
- Отсутствие побочных эффектов
- Отсутствие случайности без seed
- Изоляция симуляции в Worker

### 3.2 AI-First

- Все типы в `/src/types`
- Bridge и EventBus строго типизированы
- Input Commands — discriminated union
- Query API формализован

### 3.3 Separation of Concerns

| Слой | Ответственность |
|------|-----------------|
| Core | Симуляция (в Worker) |
| View | Рендер (R3F + Three.js) |
| UI | React DOM + Zustand |
| Infrastructure | Ввод, аудио, сохранения |
| Data | Статические конфигурации |
| Types | Глобальные контракты |

### 3.4 Strict Layering

```
UI/View → Bridge → Core (Worker)
Core → EventBus → UI
```

---

## 4. System Layers

```
UI Layer
View Layer
Bridge Adapters (React wrappers)
Core Layer (Web Worker)
Infrastructure Layer
Data Layer
Types Layer
```

---

## 5. Layer Diagram (Worker-based)

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN THREAD                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ UI (Zustand)│  │ View (R3F) │  │  BridgeCache    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │          │
│         └───── useSyncExternalStore ─────────┘          │
│                          │                              │
│              postMessage (delta-updates)                │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│              WEB WORKER (60 TPS)                        │
│  ┌───────────────────────┴───────────────────────────┐  │
│  │  Input → Movement → Collision → Economy → AI → Events│
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Data Flows

| Направление | Механизм | Модель |
|-------------|----------|--------|
| UI → Core | Input Commands | postMessage |
| Core → UI | EventBus | postMessage |
| View/UI → Core | Bridge Query API | request/response |
| Core → View | Snapshots | postMessage |
| Data → All | readonly | direct import |

---

## 7. Layer Contracts

### 7.1 Core → View

- Только через Bridge Query API
- Только read-only данные
- Никаких ссылок на ECS объекты

### 7.2 Core → UI

- EventBus (push)
- Сериализуемые события

### 7.3 UI → Core

- Input Commands (discriminated union)
- Строго типизированные

---

## 8. EventBus Specification

### 8.1 Event Model

Каждое событие содержит:

- `eventType`
- `tick`
- `payload` (serializable)

### 8.2 Example

```typescript
interface IBuildingConstructedEvent {
  eventType: 'building.constructed'
  tick: number
  payload: {
    entityId: EntityId
    buildingType: string
    position: { x: number; y: number }
  }
}
```

### 8.3 Requirements

- Детерминированный порядок
- Сериализация через structured clone
- Append-only лог для реплея

---

## 9. Bridge Specification

### 9.1 Ownership

- **Bridge** — часть Core
- **React-хуки** — часть View/UI

### 9.2 Pure Bridge API (Worker side)

```typescript
interface IBridgeAPI {
  getComponent<T>(entityId: EntityId, type: ComponentType): T | null
  queryEntities(filter: QueryFilter): EntityId[]
  subscribe(cb: () => void): Unsubscribe
  subscribeToQuery(filter: QueryFilter, cb: (ids: EntityId[]) => void): Unsubscribe
  subscribeToComponent(entityId: EntityId, type: ComponentType, cb: () => void): Unsubscribe
}
```

### 9.3 React Adapters (Main Thread)

```typescript
export function useResourceValue(id: ResourceId) {
  return useSyncExternalStore(
    bridgeCache.subscribe,
    () => bridgeCache.getResourceValue(id)
  )
}
```

---

## 10. Bridge Synchronization Model

### 10.1 Architecture

Main Thread хранит локальный кэш состояния Bridge. Worker присылает delta-updates каждый tick. React-хуки читают синхронный snapshot из кэша.

### 10.2 Cache Structure

```typescript
class BridgeCache {
  private state: Map<EntityId, ComponentMap>
  private subscriptions: Map<string, Callback>

  applyDelta(delta: StateDelta): void
  getSnapshot(): BridgeState
  subscribe(cb: Callback): Unsubscribe
}
```

### 10.3 Why This Is Required

- Worker async → React sync
- `useSyncExternalStore` требует синхронный snapshot
- Локальный кэш решает конфликт

---

## 11. Snapshot Model

### 11.1 Frequency

Delta-snapshot каждый tick (60/сек)

### 11.2 Format

```typescript
interface StateDelta {
  tick: number
  entities: {
    created: EntityId[]
    destroyed: EntityId[]
  }
  components: {
    [entityId: EntityId]: {
      added?: ComponentType[]
      removed?: ComponentType[]
      updated?: { [type: ComponentType]: unknown }
    }
  }
  resources: {
    [resourceId: string]: number
  }
}
```

### 11.3 Large State Strategy

- Pagination для больших queries
- On-demand component fetching
- Batching updates

---

## 12. Worker Communication Protocol

### 12.1 Main → Worker

```typescript
type MainToWorkerMessage =
  | { type: 'init'; payload: GameConfig }
  | { type: 'command'; payload: InputCommand }
  | { type: 'query'; payload: QueryRequest }
  | { type: 'subscribe'; payload: { id: string; filter: QueryFilter } }
  | { type: 'unsubscribe'; payload: { id: string } }
```

### 12.2 Worker → Main

```typescript
type WorkerToMainMessage =
  | { type: 'ready' }
  | { type: 'tick'; payload: StateDelta }
  | { type: 'event'; payload: EventBusEvent }
  | { type: 'subscription-update'; payload: { id: string; data: EntityId[] } }
  | { type: 'error'; payload: { code: string; message: string } }
```

---

## 13. Worker Lifecycle

### 13.1 Initialization

1. Main создаёт Worker
2. Worker загружает Data
3. Worker → Main: `ready`
4. Main → Worker: `init`
5. Worker запускает Simulation Loop

### 13.2 Shutdown

1. Main → Worker: `shutdown`
2. Worker сериализует состояние
3. Worker → Main: `state-snapshot`
4. Main завершает Worker

### 13.3 Recovery

Если Worker crash:

1. Main получает `error`
2. Создаёт новый Worker
3. Передаёт последнее состояние
4. Симуляция продолжается

---

## 14. Simulation Loop (Worker)

- **Fixed timestep:** 60 TPS
- **Независим от FPS**

### Порядок систем:

```
1. Input
2. Movement
3. Collision
4. Economy
5. AI
6. Events
```

---

## 15. ECS Lifecycle

### 15.1 Entity Creation

`createEntity()` → уникальный ID

### 15.2 Entity Destruction

- Удаление компонентов
- Удаление из всех queries

### 15.3 Component Rules

- Компоненты — чистые данные
- Без методов
- Сериализуемые

---

## 16. Input Commands (UI → Worker)

### 16.1 Discriminated Union

```typescript
type InputCommand =
  | { type: 'build'; tick: number; payload: { buildingType: string; position: Vec2 } }
  | { type: 'select'; tick: number; payload: { entityId: EntityId } }
  | { type: 'move'; tick: number; payload: { target: Vec2 } }
  | { type: 'cancel'; tick: number; payload: null }
```

### 16.2 Delivery

```
UI → Infrastructure → Worker (через postMessage)
```

---

## 17. Bridge Query API

### 17.1 Query Filter

```typescript
interface QueryFilter {
  has?: ComponentType[]
  without?: ComponentType[]
}
```

### 17.2 Query API

```typescript
queryEntities(filter: QueryFilter): EntityId[]
```

### 17.3 QueryRequest / QueryResponse

```typescript
interface QueryRequest {
  requestId: string
  filter: QueryFilter
}

interface QueryResponse {
  requestId: string
  entityIds: EntityId[]
}
```

### 17.4 Subscriptions

```typescript
subscribeToQuery(filter, cb): Unsubscribe
subscribeToComponent(entityId, type, cb): Unsubscribe
```

### 17.5 Subscription Batching

```typescript
{ type: 'subscription-batch', updates: [ { id, data }, ... ] }
```

---

## 18. Zustand UI State Model

### 18.1 Principles

- Один глобальный store
- Разделённый на slices
- UI state не дублирует ECS state
- UI state хранит только UI-данные

### 18.2 Example

```typescript
interface UIState {
  selection: { 
    mode: 'single' | 'multi' | 'none'
    entityIds: EntityId[] 
  }
  panels: {
    buildMenu: { open: boolean; category: string }
    inspector: { open: boolean }
    minimap: { open: boolean }
  }
  camera: { 
    position: Vec3
    zoom: number 
  }
  inputMode: 'select' | 'build' | 'demolish'
}
```

### 18.3 Camera Ownership

- Camera state хранится в Zustand
- View читает camera state и применяет к Three.js
- OrbitControls обновляет Zustand через actions

---

## 19. Error Handling

| Тип ошибки | Стратегия |
|------------|-----------|
| **ECS Errors** | Логируются, симуляция продолжает работу |
| **Bridge Errors** | Выбрасываются, перехватываются React Error Boundary |
| **Input Errors** | Игнорируются с предупреждением |
| **Worker Errors** | Main перезапускает Worker |

---

## 20. File Structure Standards

```
/src
├── /core
│   ├── /ecs
│   ├── /events
│   ├── /bridge
│   └── /worker
├── /view
│   ├── /adapters
│   └── /layers
├── /ui
│   └── /panels
├── /infrastructure
│   ├── /input
│   └── /audio
├── /data
│   └── /resources
└── /types
```

---

## 21. Architectural Diagrams

### 21.1 ECS Pipeline

```
Systems → Components → Entities
```

### 21.2 Rendering Pipeline

```
ECS Snapshot → Bridge → R3F → Three.js → GPU
```

### 21.3 UI Pipeline

```
Core (Worker) → EventBus → UI → React DOM
```

---

## 22. Forbidden Practices

- ❌ Core импортирует View/UI
- ❌ UI читает ECS напрямую
- ❌ Случайность без seed
- ❌ Side effects в системах
- ❌ Новые типы вне `/types`
- ❌ Логика в компонентах или R3F элементах
- ❌ Прямые ссылки на ECS объекты в UI/View

---

## 23. Summary

Архитектура v5 обеспечивает:

- ✅ Детерминированную симуляцию в Web Worker
- ✅ Строгие контракты между слоями
- ✅ Формальный Bridge Synchronization Model
- ✅ Worker Communication Protocol
- ✅ Snapshot Model
- ✅ Query API
- ✅ Безопасные Input Commands
- ✅ Производительный рендер
- ✅ AI-first генерацию кода

---

> **Документ готов к использованию как основной архитектурный контракт проекта.**
```