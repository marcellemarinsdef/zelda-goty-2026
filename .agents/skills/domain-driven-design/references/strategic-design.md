# Strategic Design & Context Mapping in DDD

Strategic Design is the macroscopic side of Domain-Driven Design. It focuses on decomposing large, complex enterprise systems into autonomous, well-bounded models aligned with real-world business domains.

---

## 1. Ubiquitous Language (Linguagem Ubíqua)

- **Definition**: A shared, rigorous vocabulary created collaboratively by software developers and domain experts, used everywhere: in conversations, documentation, user stories, code, variable names, and database schemas.
- **Rule of Thumb**: If business experts say "Cancel Policy", the code must have `policy.cancel()`, never `policy.setStatus(PolicyStatus.DELETED)` or `updatePolicyFlag(3)`.
- **Eliminate Ambiguity**: A term should have a single, unequivocal meaning within its specific Bounded Context.

---

## 2. Bounded Contexts (Contextos Delimitados)

A **Bounded Context** is an explicit boundary within which a specific domain model applies. Inside the boundary, all terms in the Ubiquitous Language have a unified meaning.

### The Problem of the "Universal Entity"
Attempting to create a single `User` or `Product` entity across an entire enterprise leads to an unmaintainable god-object with hundreds of nullable fields.

### Solution: Different Models in Different Contexts
| Concept | Identity & Access Context | E-Commerce Sales Context | Billing & Invoicing Context | Logistics Context |
| :--- | :--- | :--- | :--- | :--- |
| **Model** | `Account` | `Buyer` / `Customer` | `BillingParty` | `Recipient` |
| **Attributes** | PasswordHash, Roles, MFA | ShoppingCart, LoyaltyTier | TaxId, InvoicingAddress | DeliveryAddress, AccessNotes |

Each context models only what it needs, keeping models clean, focused, and decoupled.

---

## 3. Context Mapping Patterns

Context Mapping defines the organizational and technical relationships between different Bounded Contexts.

```text
  [ Upstream Context (U) ] ─────────────────► [ Downstream Context (D) ]
       (Influences / Supplies)                      (Consumes / Adapts)
```

### 1. Anti-Corruption Layer (ACL) - *Most Important for Clean Systems*
- **Role**: A translation layer placed in the downstream context that isolates its clean domain model from foreign, legacy, or suboptimal schemas from an upstream system.
- **Implementation**: Consists of an Adapter, a Service Port, and a Translator/Mapper.
- **When to use**: Integrating with third-party APIs (e.g., Salesforce, SAP, Stripe) or legacy monoliths.

```typescript
// Downstream Domain Port
export interface IPaymentGateway {
  charge(amount: Money, cardToken: string): Promise<PaymentConfirmation>;
}

// Infrastructure Adapter with Anti-Corruption Layer
export class StripePaymentGatewayACL implements IPaymentGateway {
  constructor(private readonly stripeClient: StripeSDK) {}

  async charge(amount: Money, cardToken: string): Promise<PaymentConfirmation> {
    try {
      const stripeResponse = await this.stripeClient.charges.create({
        amount: amount.toCents(),
        currency: amount.currency.toLowerCase(),
        source: cardToken,
      });

      // Translate foreign Stripe schema into downstream Domain Entity/Value Object
      return PaymentConfirmation.create({
        transactionId: stripeResponse.id,
        paidAt: new Date(stripeResponse.created * 1000),
      });
    } catch (error: any) {
      throw new DomainPaymentFailedError(error.message);
    }
  }
}
```

### 2. Shared Kernel
- Two contexts share a subset of the domain model directly (e.g., a shared TypeScript library or common npm package).
- *Warning*: Any change to the shared kernel requires coordination across both teams. Keep it minimal.

### 3. Customer / Supplier
- The upstream context (Supplier) must deliver features that satisfy the downstream context's (Customer) requirements, negotiated via SLAs.

### 4. Conformist
- The downstream context accepts the upstream model as-is without translation.
- *When to use*: Upstream is an industry standard or team has no power to negotiate and doesn't mind direct coupling.

### 5. Open Host Service (OHS) / Published Language (PL)
- The upstream system provides an official, versioned protocol/API (e.g. REST with JSON Schema, OpenAPI, or gRPC with Protobuf) designed for multiple downstream consumers.

### 6. Separate Ways
- When integrating two contexts is too expensive or complex, teams decide to duplicate or solve the problem independently with zero technical integration.

---

## 4. Subdomains: Strategic Prioritization

Distinguish where to invest engineering excellence:

1. **Core Domain**:
   - The primary reason the business exists; gives the company its competitive advantage.
   - *Strategy*: Build in-house with the best talent, highest test coverage, and strict DDD practices.
2. **Supporting Subdomain**:
   - Custom features required by the business, but not a differentiator (e.g., custom inventory tracking).
   - *Strategy*: Build in-house, but keep it simple or delegate.
3. **Generic Subdomain**:
   - Standard problems solved across industries (e.g., Authentication, Billing, Email delivery, Logging).
   - *Strategy*: Buy off-the-shelf software or SaaS (Auth0, Stripe, Sendgrid), integrated via ACL.
