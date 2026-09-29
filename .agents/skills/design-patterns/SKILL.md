---
name: design-patterns
description: >-
  Expert guidelines, practical decision matrices, and idiomatic TypeScript implementations for software
  Design Patterns (GoF: Creational, Structural, Behavioral) and modern Node.js architectural patterns.
  Use when selecting the right pattern to solve structural problems, refactoring code smells, decoupling
  components, implementing Strategy, Factory, Builder, Decorator, Adapter, Observer, or Chain of Responsibility.
---

# Design Patterns in TypeScript & Modern Node.js

This skill provides comprehensive guidelines, catalog references, and idiomatic TypeScript implementations for software Design Patterns (Gang of Four - GoF) and modern Node.js patterns. It helps identify the right pattern for each problem and avoid common anti-patterns like premature over-engineering.

---

## 1. Quick Pattern Decision Matrix

Choose the pattern that matches your architectural and code design problem:

| If your problem is... | Use this Pattern | Category | Key Benefit |
| :--- | :--- | :--- | :--- |
| **Object creation logic is complex or depends on runtime conditions** | **Factory Method / Abstract Factory** | Creational | Decouples instantiation from usage; avoids repetitive `new` calls. |
| **Constructing complex objects with many optional steps/parameters** | **Builder** | Creational | Eliminates telescoping constructors; provides clean fluent API. |
| **Incompatible interfaces need to work together** | **Adapter** | Structural | Translates third-party/legacy interfaces into application ports. |
| **Adding responsibilities (caching, logging, timing) dynamically without modifying code** | **Decorator / Proxy** | Structural | Adheres to Open/Closed Principle (OCP); enables composable features. |
| **Simplifying interaction with a complex subsystem or external SDK** | **Facade** | Structural | Exposes a single, clean high-level interface. |
| **Interchangeable business rules/algorithms (discounts, payments, algorithms)** | **Strategy** | Behavioral | Swaps algorithms at runtime; eliminates huge `if/else` or `switch` blocks. |
| **Event-driven notifications where multiple components react to state change** | **Observer / Pub-Sub** | Behavioral | 1-to-N decoupled communication between sender and subscribers. |
| **Sequential pipeline of operations (middleware, validators, interceptors)** | **Chain of Responsibility** | Behavioral | Passes request through a chain of handlers until handled or terminated. |
| **Object behavior depends on its internal lifecycle state** | **State** | Behavioral | Encapsulates state-specific transitions and logic into dedicated classes. |
| **Encapsulating requests as objects (undo/redo, task queues, audit trails)** | **Command** | Behavioral | Decouples invoker from executor; enables queuing and serialization. |

---

## 2. The 3 Classic Categories

### 1. Creational Patterns
Deal with object creation mechanisms to create objects in a manner suitable to the situation.
- **Factory Method**: Delegates instantiation to specialized subclasses or factory functions.
- **Abstract Factory**: Creates families of related objects without specifying concrete classes.
- **Builder**: Separates the construction of a complex object from its representation.
- **Singleton**: Guarantees a single instance. *(In Node.js, prefer Dependency Injection or module-level singletons over classic global singletons).*

### 2. Structural Patterns
Explain how to assemble objects and classes into larger structures while keeping them flexible and efficient.
- **Adapter**: Converts one interface into another that clients expect.
- **Decorator**: Dynamically attaches additional behavior to an object.
- **Proxy**: Controls and manages access to an underlying object (lazy-loading, caching, security).
- **Facade**: Provides a simplified interface to a complex library or subsystem.
- **Composite**: Composes objects into tree structures to treat individual objects and compositions uniformly.

### 3. Behavioral Patterns
Concerned with algorithms and the assignment of responsibilities between objects.
- **Strategy**: Defines a family of algorithms, encapsulates each one, and makes them interchangeable.
- **Observer**: Defines a subscription mechanism to notify multiple objects about events.
- **Chain of Responsibility**: Passes requests along a dynamic chain of handlers.
- **State**: Allows an object to alter its behavior when its internal state changes.
- **Template Method**: Defines the skeleton of an algorithm, deferring steps to subclasses (often replaced with composition in TypeScript).

---

## 3. Guiding Principles & Golden Rules

1. **Favor Composition over Inheritance**:
   Always prefer composing smaller, focused objects rather than building deep inheritance hierarchies.
2. **Program to an Interface, Not an Implementation**:
   Use TypeScript `interface` or `type` abstractions to decouple consumers from concrete implementations.
3. **Avoid Over-Engineering (Pattern-itis)**:
   Do not introduce a pattern unless there is an actual problem to solve. Start with the simplest clean code, and refactor toward a pattern when duplication, complexity, or changing requirements demand it.
4. **Leverage Modern TypeScript Capabilities**:
   Use discriminated unions, first-class functions, and closures where classic OOP patterns might be overly verbose.

---

## 4. References & Concrete Examples

Explore in-depth documentation and code examples:
- [Creational Patterns in TypeScript](./references/creational-patterns.md): Factory, Builder, Singleton, and Prototype.
- [Structural Patterns in TypeScript](./references/structural-patterns.md): Adapter, Decorator, Proxy, Facade, and Composite.
- [Behavioral Patterns in TypeScript](./references/behavioral-patterns.md): Strategy, Observer, Chain of Responsibility, State, and Command.
- [Modern TypeScript Examples](./examples/modern-ts-patterns.md): Real-world implementations (Strategy Payment Engine, Fluent Test Data Builder, Caching Decorator, and Third-Party Adapter).
