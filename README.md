# 🏆 SchemaForge — AI-Powered AWS Database Schema Designer

> **Track**: Open Innovation | **Databases**: Aurora PostgreSQL + DynamoDB (Polyglot)  
> **Hackathon**: H0: Hack the Zero Stack with Vercel v0 and AWS Databases

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://schemaforge.vercel.app)
[![Aurora PostgreSQL](https://img.shields.io/badge/Aurora-PostgreSQL-orange?logo=amazonaws)](https://aws.amazon.com/rds/aurora/)
[![DynamoDB](https://img.shields.io/badge/DynamoDB-NoSQL-orange?logo=amazonaws)](https://aws.amazon.com/dynamodb/)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=nextdotjs)](https://nextjs.org)

---

## 🎯 The Meta-Innovation

> *We built a tool that uses AWS databases to help you design AWS databases.*

SchemaForge is the most original submission in this hackathon because it **uses Aurora PostgreSQL and DynamoDB to generate Aurora PostgreSQL and DynamoDB schemas**. It's the tool the judges at AWS use internally — but now it's for everyone.

---

## 🎯 Problem

Choosing and designing the right database schema for a new project is hard:

- **Which database?** Aurora PostgreSQL vs Aurora DSQL vs DynamoDB — wrong choice = expensive migration later
- **Schema design** is complex: normalization, indexing strategy, partition key design for DynamoDB
- **CloudFormation templates** for databases take hours to write from scratch  
- **Junior developers** often design schemas that don't scale and need painful refactors
- **The AWS experts** (the judges) spend hours reviewing database designs that could be automated

---

## 💡 Solution

SchemaForge is an **AI-powered schema designer** for AWS databases:

1. **Describe your application** in plain English: *"I'm building a multi-tenant SaaS analytics platform for 100K customers"*
2. **AI recommends the right database** (Aurora PostgreSQL, Aurora DSQL, or DynamoDB) with justification
3. **Generates optimized schema** — SQL for Aurora, JSON with GSIs for DynamoDB, ER diagram, cost estimate
4. **Exports CloudFormation** — production-ready IaC template in one click
5. **Stores your schemas** — Aurora PostgreSQL stores all user schemas with version history; DynamoDB caches AI generations for fast retrieval

---

## 🏗️ Architecture (Polyglot Persistence)

SchemaForge uses **both Aurora PostgreSQL and DynamoDB** for different purposes — demonstrating polyglot persistence:

| Data | Database | Why |
|---|---|---|
| User accounts, saved schemas, version history, teams | **Aurora PostgreSQL** | Relational data with complex queries; schema versions require ACID transactions |
| AI generation cache, popular schema templates | **DynamoDB** | Cache-like access pattern (key: hash of prompt → value: generated schema); TTL for cache expiry |
| Schema export jobs, analytics events | **DynamoDB** | High write throughput, simple access by jobId |

---

## 🚀 Features

- **🤖 AI Database Recommender** — Analyzes use case and recommends the right AWS database with scored justification
- **📐 Schema Generator** — SQL DDL for Aurora, JSON access patterns + table design for DynamoDB
- **📊 ER Diagram** — Auto-generated entity-relationship diagram (Mermaid)
- **☁️ CloudFormation Export** — One-click export of production-ready IaC template
- **💰 Cost Estimator** — Estimates monthly AWS cost based on schema complexity and scale requirements
- **📚 Version History** — Every generated schema saved in Aurora with full history and diffs
- **🔌 Schema Playground** — Live SQL editor against a test Aurora instance
- **👥 Team Workspaces** — Share schemas with your team, add comments and approvals

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 App Router | Server Components, Monaco editor integration |
| Schema Visualization | Mermaid.js | ER diagram rendering |
| SQL Editor | Monaco Editor | VS Code-grade editing experience |
| Database 1 | Aurora PostgreSQL Serverless v2 | User data, schemas, version history, teams |
| Database 2 | DynamoDB | AI generation cache, export jobs, analytics |
| AI | OpenAI GPT-4o | Schema generation + database recommendation |
| Auth | NextAuth.js | Google OAuth |
| IaC | AWS CloudFormation | Full infra as code |
| Deployment | Vercel | Edge-deployed Next.js |

---

## 🏃 Getting Started

```bash
git clone https://github.com/yourusername/schemaforge
cd schemaforge
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

---

## 🏆 Hackathon Submission Notes

- **AWS Databases Used**: Aurora PostgreSQL Serverless v2 + Amazon DynamoDB (polyglot persistence)
- **Meta-Innovation**: This app uses AWS databases to help developers design better AWS databases
- **Advanced Aurora Features**: Schema versioning with ACID transactions, row-level security per team
- **Advanced DynamoDB Features**: AI cache with TTL, GSI for popular templates, on-demand scaling
- **Architecture Diagram**: See [docs/architecture.md](docs/architecture.md)

## 📄 License
MIT
