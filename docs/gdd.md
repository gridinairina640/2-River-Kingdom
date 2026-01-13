# **GDD — Empire of the Two Rivers**
### *Game Design Document — Version 1.5 (Finalized)*

---

# 1. High-Level Overview

## 1.1 Genre
Градостроительный симулятор c глубокой экономикой, службами, угрозами и боевой системой.

## 1.2 Core Fantasy
Игрок строит город в долине двух рек, управляя экономикой, населением, службами, армией и угрозами.

## 1.3 Core Pillars
- Детерминированная симуляция (60 TPS, ECS, Worker)
- Глубокая экономика
- Живой город
- Службы и безопасность
- Боевая система
- AI-first контент‑пайплайн
- Производительность и масштабируемость

---

# 2. World & Setting

## 2.1 Environment
- Долина двух рек
- Плодородные земли
- Угрозы: пожары, преступность, набеги, болезни

## 2.2 Map Structure
- Тайл‑сетка 1x1
- Размеры карт:
  - **128x128** — Tutorial
  - **256x256** — Standard
  - **512x512** — Advanced Scenario
- Зоны ресурсов: лес, камень, рыба, пастбища, металл

## 2.3 Population vs Agents
- **Population** — агрегированное число жителей
- **Agents** — ECS-юниты на карте
- Соотношение: **10-15% населения = агенты**
- Golden City: 1500 жителей → ~200 агентов

---

# 3. Core Gameplay Loop

1. Сбор ресурсов
2. Строительство зданий
3. Обеспечение населения
4. Управление службами
5. Реакция на угрозы
6. Развитие экономики
7. Формирование армии
8. Расширение территории

---

# 4. Player Progression

## 4.1 Tier Requirements (формализовано)

```ts
interface TierRequirements {
  tier: number
  population: number
  buildings: { type: string; count: number }[]
  resources: { type: string; amount: number }[]
  services: { type: string; coverage: number }[]
}
```

### Таблица Tier Requirements

| Tier | Population | Buildings | Resources | Services |
|------|------------|-----------|-----------|----------|
| **1** | 0-199 | — | Стартовый набор | — |
| **2** | 200 | 20 Houses | 500 Food | Water 0.8 |
| **3** | 500 | 50 Houses, 5 Services | 2000 Food, 500 Gold | Water 0.9, Safety 0.7 |
| **4** | 1000 | 120 Houses, 10 Services | 5000 Food, 2000 Gold | Safety 0.8, Health 0.7 |
| **5** | 2000 | 250 Houses, 20 Services | 12000 Food, 5000 Gold | Safety 0.9, Health 0.8 |

---

# 5. Economy

## 5.1 Resource Taxonomy

### Raw Resources
- wheat
- fish
- livestock
- wool
- clay
- ore
- wood
- stone
- water

### Processed Resources
- flour
- bricks
- iron
- cloth
- meat
- bread

### Final Goods
- tools
- weapons
- horses

### Special
- gold

---

## 5.2 Production Chains

```
FOOD
  Wheat Field → Mill → Bakery → Bread
  Fishing Dock → Fish
  Pasture → Butcher → Meat

MATERIALS
  Forest → Lumber Mill → Wood
  Quarry → Stone
  Clay Pit → Brickworks → Bricks

ADVANCED
  Iron Mine → Smelter → Iron → Blacksmith → Tools
                                 └→ Weaponsmith → Weapons
  Sheep Pasture → Weaver → Cloth

ANIMALS
  Pasture → Livestock → Stable → Horse
```

---

## 5.3 Consumption Rates (per 100 population per tick)

| Resource | Amount |
|----------|--------|
| Food | 1 |
| Water | 0.5 |
| Cloth | 0.1 |

---

## 5.4 Production Rates (per building per tick)

| Building | Output | Workers |
|----------|--------|---------|
| Wheat Field | 2 wheat | 3 |
| Mill | 3 flour | 2 |
| Bakery | 2 bread | 2 |
| Fishing Dock | 1 fish | 1 |
| Pasture | 1 livestock | 2 |
| Butcher | 2 meat | 2 |
| Sheep Pasture | 1 wool | 2 |
| Weaver | 1 cloth | 2 |
| Lumber Mill | 2 wood | 2 |
| Quarry | 2 stone | 2 |
| Clay Pit | 2 clay | 2 |
| Brickworks | 2 bricks | 2 |
| Iron Mine | 1 ore | 4 |
| Smelter | 1 iron | 3 |
| Blacksmith | 1 tool | 2 |
| Weaponsmith | 1 weapon | 2 |
| **Stable** | 1 horse | 3 |

---

## 5.5 Water Production

| Building | Output | Workers |
|----------|--------|---------|
| Well | 5 water | 1 |
| Aqueduct | 20 water | 0 |

---

## 5.6 Gold Generation

| Source | Rate |
|--------|------|
| Taxation | **0.01 gold per population per tick** |
| Trade Transaction | **0.5 gold per export of 10 units** |
| Gold Mine | **1 gold per tick** |

---

# 6. Population Simulation

## 6.1 Needs
- Жильё
- Еда
- Вода
- Безопасность
- Здоровье
- Развлечения
- Религия
- Занятость (employment)

---

## 6.2 Happiness Formula

```ts
happiness = Σ(weight x satisfaction_ratio) - unemployment_penalty
```

### Weights

| Need | Weight |
|------|--------|
| housing | 0.2 |
| food | 0.25 |
| water | 0.15 |
| safety | 0.15 |
| health | 0.1 |
| entertainment | 0.1 |
| religion | 0.05 |

---

## 6.3 Satisfaction Ratio

```ts
satisfaction = min(1.0, available / required)
```

---

## 6.4 Housing Satisfaction

```ts
house_capacity = 10
housing_satisfaction = min(1.0, (houses x house_capacity) / population)
```

---

## 6.5 Employment

```ts
available_workers = population x 0.4
unemployment_penalty = (unemployed / population) x 0.1
```

---

## 6.6 Coverage-Based Needs

```ts
guard_coverage = covered_tiles / total_city_tiles
fire_coverage = covered_tiles / total_city_tiles
hospital_coverage = covered_tiles / total_city_tiles
entertainment_coverage = covered_tiles / total_residential_tiles
religion_coverage = covered_tiles / total_residential_tiles
```

### Coverage Area Calculation

```ts
covered_tiles = Σ(π x radius²) for each service building
```

---

# 7. Buildings

(Полный список — в `buildings.md`)

### Entertainment Buildings
- Tavern
- Theater
- Festival Square

### Religion Buildings
- Shrine
- Temple
- Grand Temple

---

# 8. Units

(Полный список — в `units.md`)

## Worker Units
- Строители
- Носильщики
- Ремесленники
- Рыбаки
- Фермеры

## Service Units
- Пожарные
- Стражники
- Медики
- Патрульные

## Combat Units
- Мечники
- Копейщики
- Лучники
- Стража
- Кавалерия

---

# 9. Unit Stats

| Unit | HP | Damage | Range | Speed (tiles/sec) | Cost | Train Time |
|------|----|--------|-------|-------------------|------|------------|
| Swordsman | 100 | 15 | 1 | 2 | 50g, 1 weapon | 300 ticks |
| Spearman | 120 | 12 | 2 | 1.8 | 40g, 1 weapon | 350 ticks |
| Archer | 60 | 10 | 8 | 2.5 | 40g, 1 weapon | 400 ticks |
| Guard | 150 | 18 | 1 | 2 | 60g, 1 weapon | 500 ticks |
| **Cavalry** | 120 | 20 | 1 | **4** | 100g, 1 weapon, 1 horse | 600 ticks |

---

# 10. Threats & Disasters

## 10.1 RaidConfig Values

| Tier | Frequency (ticks) | Composition | Warning |
|------|-------------------|-------------|---------|
| 2 | 3000–5000 | 5–10 bandits | 1800 ticks |
| 3 | 2500–4000 | 10–20 raiders | 1500 ticks |
| 4 | 2000–3500 | 15–30 warriors | 1200 ticks |
| 5 | 1500–3000 | 20–40 elite | 900 ticks |

---

# 11. Service Coverage Values

| Building | Radius | Capacity | Agents | Response | Behavior |
|----------|--------|----------|--------|----------|----------|
| Fire Station | 15 | 3 fires | 4 | 60 ticks | on_demand |
| Guard Post | 12 | 5 crimes | 3 | 40 ticks | roaming |
| Hospital | 20 | 10 patients | 2 | 80 ticks | static |

---

# 12. Crime & Fire Formulas

## Crime Rate

```ts
base_crime = 0.1
crime_rate = base_crime + (1 - happiness) × 0.5 - guard_coverage × 0.3
```

## Fire Spread

```ts
base_fire_spread = 0.05
flammability = { wood: 1.0, stone: 0.2, brick: 0.3 }
spread_chance = base_fire_spread × (1 - fire_coverage) × flammability[material]
```

---

# 13. Worker Allocation

```ts
available_workers = population × 0.4
workers_auto_assign_to_nearest_workplace()
unemployment_penalty = (unemployed / population) × 0.1
```

---

# 14. Storage Capacity

| Building | Capacity |
|----------|----------|
| Small Warehouse | 500 units |
| Large Warehouse | 2000 units |
| Granary | 1000 food |

---

# 15. AI Systems

AISystem включает подсистемы:

- CitizenBehaviorSubsystem
- ServiceDispatchSubsystem
- CombatTacticsSubsystem

---

# 16. Simulation Loop

```
60 TPS fixed timestep
1. Input
2. Movement
3. Collision
4. Economy
5. Fire
6. Crime
7. AI
8. Combat
9. Events
```

---

# 17. UI/UX

## UI ↔ Bridge API Integration
- Resource Panel → `useResourceValue('gold')`
- Inspector → `bridge.queryEntities({ has: ['Selectable'] })`
- Minimap → `bridge.subscribeToQuery({ has: ['Position'] })`

---

# 18. Rendering
- R3F + Three.js
- Instancing
- Batching
- LOD

---

# 19. Audio
- Ambient
- Combat
- UI
- Alerts

---

# 20. Technical Integration (AI‑first)
- Codegen через Google AI Studio
- Все типы — из `/types`
- Компоненты — из `components.md`
- Системы — из `systems.md`
- События — из `events.md`

---

# 21. Performance Budgets
- CPU Worker ≤ 8 ms/tick
- GPU ≤ 12 ms/frame
- Memory ≤ 512 MB @ 10k agents
- Delta snapshot ≤ 1 MB/tick

---

# 22. Golden City (финальная версия)

```
Tier: 4
Population: 1500
Buildings: 200
Services: 50
Active Threats: 3
```

---

# 23. Glossary

## Общие термины
- **Population** — агрегированное число жителей города.
- **Agents** — активные ECS-юниты на карте (10–15% населения).
- **Tile** — минимальная единица карты (1×1).
- **Tick** — шаг симуляции (1/60 секунды).
- **Coverage** — доля тайлов, находящихся в зоне действия службы (0.0–1.0).

## Ресурсы
- **Food** — суммарный запас всех типов еды: bread + fish + meat.
- **Raw Resource** — первичный ресурс, добываемый напрямую из окружающей среды  
  *(wheat, fish, livestock, wool, clay, ore, wood, stone, water)*.
- **Processed Resource** — ресурс, полученный переработкой сырья  
  *(flour, bricks, iron, cloth, meat, bread)*.
- **Final Good** — конечный продукт, используемый в производстве юнитов или прогрессии  
  *(tools, weapons, horses)*.
- **Special Resource** — особый ресурс, не входящий в цепочки производства  
  *(gold)*.

## Инфраструктура и здания
- **Infrastructure** — здание, не требующее работников и работающее пассивно  
  *(например, Aqueduct)*.
- **Service Building** — здание службы, обеспечивающее покрытие (fire, safety, health).
- **Production Building** — здание, производящее ресурсы.
- **Housing** — жилые здания, определяющие вместимость населения.

## Юниты
- **Worker Unit** — юниты, занятые в экономике (строители, носильщики, ремесленники).
- **Service Unit** — юниты служб (пожарные, стражники, медики).
- **Combat Unit** — боевые юниты (мечники, копейщики, лучники, кавалерия).

## Экономика
- **Trade Transaction** — экспорт 10 единиц любого ресурса через Market.
- **Stockpile** — текущий запас ресурса.
- **Consumption Rate** — скорость потребления ресурса населением.
- **Production Rate** — скорость производства ресурса зданием.

## Покрытие служб
- **Coverage Area** — площадь действия службы, вычисляемая как  
  `π × radius²` для каждого здания.
- **Covered Tiles** — суммарное количество тайлов, попадающих в зоны покрытия.