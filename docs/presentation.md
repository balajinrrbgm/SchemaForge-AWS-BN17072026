# SchemaForge — Presentation Deck

**Hackathon**: H0: Hack the Zero Stack | **Track**: Open Innovation

---

## Slide 1: The Problem

**Title**: Database design is where great ideas go to die

**Talking points**:
- Every developer building a new app faces the same decision: *Which AWS database?*
- Wrong choice → painful migration at scale (ask anyone who moved from DynamoDB to PostgreSQL)
- Even with the right database, schema design is hard: partition keys, indexes, normalization
- The AWS documentation is excellent — but it takes days to read for 3 database services
- Junior developers guess. Senior developers agonize. Everyone wastes time.

**Visual**: Three database logos with question marks between them. Timer counting up.

---

## Slide 2: The Solution

**Title**: SchemaForge — From idea to schema in seconds

**Talking points**:
- Describe your application in plain English
- AI recommends the right AWS database with scored justification
- Generates production-ready SQL DDL / DynamoDB access patterns
- Auto-generates ER diagram and CloudFormation template
- Version-controlled schema history in your account

**Visual**: Text input → AI thinking → SQL schema + ER diagram + CloudFormation YAML side by side

---

## Slide 3: Live Demo

**Title**: Watch it work

**Demo flow** (see demo_script.md for full script):
1. Type: *"Multi-tenant SaaS analytics platform for 100K customers"* → AI recommends Aurora PostgreSQL with 89% confidence
2. Switch to DynamoDB tab — see the single-table access pattern design, GSI definitions
3. Click ER Diagram — see the entity relationship visualization
4. Click CloudFormation — see the production-ready YAML ready to `aws cloudformation deploy`
5. Show version history — saved schemas stack up like git commits

---

## Slide 4: The Meta Story (Innovation)

**Title**: We used AWS databases to design a tool for designing AWS databases

**Talking points**:
- SchemaForge itself uses **Aurora PostgreSQL + DynamoDB** — polyglot persistence
- **Aurora PostgreSQL**: user accounts, saved schemas, version history, team collaboration
  - Why? Complex joins, ACID transactions for version numbers, analytical queries
- **DynamoDB**: AI generation cache (TTL 24h), popular templates, export jobs
  - Why? Cache-like access pattern, TTL auto-expiry, O(1) key lookups
- This is the same decision we help you make — and we made it ourselves
- The judges (AWS database experts) will recognize the pattern immediately

**Visual**: Two-panel diagram — "Aurora PostgreSQL stores: [list]" and "DynamoDB stores: [list]"

---

## Slide 5: Technical Depth — Polyglot Architecture

**Title**: Right database for right job

```
User describes app
        ↓
DynamoDB cache check (SHA-256 hash of prompt)
  ↓ HIT           ↓ MISS
Return instantly   GPT-4o generates schema (2-8s)
(< 10ms)           ↓
                  Cache in DynamoDB (TTL 24h)
                  ↓
                  Save to Aurora (ACID transaction)
```

**Key technical points**:
- DynamoDB cache key = `SHA-256(prompt + targetDb)` — deterministic, collision-resistant
- Same prompt from different users → hits cache → GPT-4o never called twice for same question
- Cache TTL = 24 hours — DynamoDB auto-expires entries, zero cron jobs
- Aurora version history uses recursive CTE (`WITH RECURSIVE schema_tree`) for efficient tree traversal
- Aurora Serverless v2 scales to 0.5 ACU at night, 16 ACU during peak

---

## Slide 6: Advanced Database Features Used

**Aurora PostgreSQL Serverless v2**:
| Feature | Usage |
|---|---|
| Serverless v2 (0.5–16 ACU) | Cost-efficient scaling; scales to zero |
| ACID transactions | Version numbering — no race conditions on `version = MAX + 1` |
| Recursive CTEs | Version history tree traversal |
| Row-level security | Team schema isolation |
| GIN index on arrays | Tag-based schema search (`tags @> '{dynamodb}'`) |
| `platform_stats` view | Homepage "by the numbers" |

**DynamoDB**:
| Feature | Usage |
|---|---|
| TTL (`expiresAt`) | Auto-expire AI cache after 24h — no Lambda cleanup |
| On-demand billing | Variable cache traffic, never over-provisioned |
| Single-table design | Cache + templates + jobs in one table |
| SHA-256 partition key | Uniform key distribution, no hot partitions |

---

## Slide 7: Impact + Market

**Title**: The developer time we save

**Stats**:
- Average time to design a database schema from scratch: **3–8 hours**
- Average time with SchemaForge: **< 30 seconds**
- CloudFormation template generation: **0 hours** (was 2–4 hours)
- Database selection confidence: from **guessing** to **89% AI-scored recommendation**

**Target users**:
- Hackathon developers (ironic, but real)
- Startup engineers making architecture decisions
- Students learning AWS databases
- Engineering teams standardizing on AWS databases

**Expansion**:
- Schema migration suggestions (PostgreSQL → DynamoDB and vice versa)
- Cost optimization advisor (compare Aurora vs DynamoDB cost for a given workload)
- CI/CD integration — lint schema changes against best practices

---

## Slide 8: Why SchemaForge Wins

**Title**: Originality + Technical Depth + Real Impact

**Four judging criteria**:

1. **Technological Implementation** (30%):
   - Polyglot persistence: Aurora PostgreSQL + DynamoDB
   - Advanced features: Aurora Serverless v2, recursive CTEs, RLS, DynamoDB TTL, single-table design
   - AI schema generation with structured JSON output via GPT-4o
   - CloudFormation IaC generated on demand

2. **Design** (25%):
   - Monaco editor for professional schema editing
   - Mermaid ER diagram auto-rendering
   - Tab-based output (schema / ER diagram / CloudFormation)

3. **Impact** (25%):
   - Hours saved per developer per project
   - Promotes AWS database adoption with lower barrier to entry
   - Meta: teaches database selection by doing

4. **Originality** (20%):
   - **The meta angle**: using the thing to build the thing
   - No other submission will use AWS databases to design AWS databases
   - Judges are AWS database experts — they'll appreciate the irony and depth
