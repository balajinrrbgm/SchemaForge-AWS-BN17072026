# SchemaForge — Demo Script

**Total demo time**: 2:45 minutes

---

## Pre-Demo Checklist
- [ ] schemaforge.vercel.app open in browser
- [ ] AWS Console: DynamoDB → Tables → schemaforge-cache-prod open in second tab
- [ ] AWS Console: RDS → Databases → schemaforge-aurora-prod open in third tab
- [ ] Logged in to SchemaForge (Google OAuth)
- [ ] Previous saved schema in history (shows version control)

---

## Demo Flow

### [0:00–0:15] Hook
**Say**: *"Every developer building on AWS faces the same question: Aurora PostgreSQL, Aurora DSQL, or DynamoDB? Wrong answer means a painful migration at scale. We built SchemaForge — AI-powered schema design in under 30 seconds. And the meta twist: we used Aurora PostgreSQL and DynamoDB to build it."*

---

### [0:15–0:50] Live Generation — Aurora PostgreSQL
**Action**: Type in the text box:
> "Multi-tenant SaaS analytics platform with users, teams, subscriptions, events, dashboards, and query execution history for 100,000 customers"

**Say**: *"This is a real product description — the kind you'd write on day one."*

**Action**: Leave "Auto-recommend" selected, click "Generate Schema"

**Say**: *"Sending to GPT-4o with our AWS database expert system prompt."* (watch spinner)

**Action**: Result appears — Aurora PostgreSQL, ~89% confidence

**Say**: *"Aurora PostgreSQL. 89% confident. Let me read the recommendation: [read first sentence]. That's the exact reasoning a senior AWS solutions architect would give you."*

---

### [0:50–1:15] Schema + ER Diagram
**Action**: Look at the Schema tab — scroll through SQL DDL

**Say**: *"Production-ready SQL DDL. CREATE TABLE with proper types, foreign keys, indexes, row-level security for multi-tenant isolation."*

**Action**: Click ER Diagram tab

**Say**: *"Auto-generated entity-relationship diagram. Mermaid.js rendered right in the browser. Download this, put it in your architecture doc."*

**Action**: Click CloudFormation tab

**Say**: *"This is the part that usually takes half a day. Aurora Serverless v2 CloudFormation with VPC, security groups, subnet groups, Secrets Manager — all generated. One click, deploy to AWS."*

---

### [1:15–1:40] DynamoDB Generation (different use case)
**Action**: Clear the text box, type:
> "Real-time leaderboard for a mobile game with 1 million daily active users, player profiles, and match history"

**Action**: Select "⚡ DynamoDB" manually, click Generate

**Say**: *"Different use case — let's force DynamoDB and see what it generates."*

**Action**: Result appears — DynamoDB single-table design

**Say**: *"Single-table design. All entities in one table. PK/SK patterns for players, matches, leaderboard. GSI for sorted leaderboard queries. This is the r/place architecture pattern — the one that handles 20,000 writes per second."*

---

### [1:40–2:00] The Meta Story — AWS Console
**Action**: Switch to DynamoDB AWS Console tab

**Say**: *"Here's the meta story. This DynamoDB table is how SchemaForge stores AI generations. Every schema you just saw — it's cached here with a 24-hour TTL. SHA-256 hash of the prompt is the partition key. DynamoDB auto-expires entries. No Lambda cleanup job."*

**Show**: Table items — `SCHEMA_CACHE#<hash>` with `expiresAt` attribute

**Action**: Switch to RDS Aurora tab

**Say**: *"And here's Aurora PostgreSQL — where your saved schemas and version history live. ACID transactions ensure version numbers are always consistent. Recursive CTEs for version history tree. Row-level security for team schemas."*

---

### [2:00–2:20] Version History
**Action**: Navigate to Saved Schemas in the UI

**Say**: *"Every schema you generate and save — it's versioned. Like git commits for your database design. You can see the evolution of your schema as requirements change."*

**Show**: A schema with 3 versions listed

**Say**: *"V1 was the initial design. V2 added the subscription table. V3 added analytics events. Same recursive pattern as Git — parent_id references previous version."*

---

### [2:20–2:45] Close — The Meta Argument
**Say**: *"Let's step back. SchemaForge helps developers choose between Aurora PostgreSQL, Aurora DSQL, and DynamoDB. To build SchemaForge, we used Aurora PostgreSQL for relational user data and schema version history, and DynamoDB for the AI generation cache with TTL."*

**Say**: *"We made the exact decision we help you make. And we made it well — the same reasoning the AI gives you is the reasoning we followed. Aurora for complex queries and ACID. DynamoDB for cache-like access patterns and auto-expiry."*

**Say**: *"That's SchemaForge. The tool that uses AWS databases to help you design AWS databases."*

---

## Backup Plans

| Failure | Recovery |
|---|---|
| OpenAI API fails | Show pre-generated example output (saved as static JSON) |
| Aurora connection timeout | Show saved schemas from previous session; explain Aurora cold start |
| DynamoDB cache not visible | Show mock console screenshot |
| ER diagram doesn't render | Show raw Mermaid syntax (still impressive) |
| Page fails to load | Use localhost:3000 with seeded data |
