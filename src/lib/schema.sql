-- =============================================================================
-- SchemaForge — Aurora PostgreSQL Schema
-- Stores user accounts, saved schemas, version history, teams
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS
-- =============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    image           TEXT,
    schemas_generated INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TEAMS (shared workspaces)
-- =============================================================================
CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    owner_id        UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- =============================================================================
-- SAVED SCHEMAS — with version history via self-referencing parent_id
-- =============================================================================
CREATE TABLE saved_schemas (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id                 UUID REFERENCES teams(id) ON DELETE SET NULL,
    name                    TEXT NOT NULL,
    description             TEXT,
    target_database         TEXT NOT NULL
                                CHECK (target_database IN ('aurora-postgresql', 'aurora-dsql', 'dynamodb')),
    prompt                  TEXT NOT NULL,
    schema_content          TEXT NOT NULL,        -- SQL DDL or JSON access pattern
    er_diagram              TEXT,                 -- Mermaid syntax
    cloudformation_template TEXT,                 -- CloudFormation YAML
    ai_recommendation       TEXT,                 -- Why this DB was chosen
    confidence_score        SMALLINT,             -- 0-100
    estimated_monthly_cost  NUMERIC(10, 2),
    version                 INTEGER NOT NULL DEFAULT 1,
    parent_id               UUID REFERENCES saved_schemas(id),  -- For version history
    is_starred              BOOLEAN DEFAULT FALSE,
    tags                    TEXT[] DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schemas_user ON saved_schemas(user_id, created_at DESC);
CREATE INDEX idx_schemas_team ON saved_schemas(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_schemas_db_type ON saved_schemas(target_database);
CREATE INDEX idx_schemas_no_parent ON saved_schemas(user_id, created_at DESC) WHERE parent_id IS NULL;
CREATE INDEX idx_schemas_tags ON saved_schemas USING gin(tags);

-- =============================================================================
-- SCHEMA COMMENTS (collaborative review)
-- =============================================================================
CREATE TABLE schema_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_id   UUID NOT NULL REFERENCES saved_schemas(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS EVENTS (stored in Aurora for analytical queries)
-- =============================================================================
CREATE TABLE generation_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    target_database TEXT NOT NULL,
    cache_hit       BOOLEAN NOT NULL DEFAULT FALSE,
    generation_ms   INTEGER,                  -- How long generation took
    prompt_length   INTEGER,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_db ON generation_events(target_database, occurred_at DESC);
CREATE INDEX idx_events_user ON generation_events(user_id, occurred_at DESC);

-- =============================================================================
-- STATS VIEW — for the homepage "by the numbers"
-- =============================================================================
CREATE VIEW platform_stats AS
SELECT
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT s.id) AS total_schemas_generated,
    COUNT(DISTINCT s.id) FILTER (WHERE s.target_database = 'aurora-postgresql') AS aurora_pg_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.target_database = 'aurora-dsql') AS aurora_dsql_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.target_database = 'dynamodb') AS dynamodb_count,
    AVG(ge.generation_ms)::INT AS avg_generation_ms
FROM users u
LEFT JOIN saved_schemas s ON s.user_id = u.id AND s.parent_id IS NULL
LEFT JOIN generation_events ge ON ge.user_id = u.id;
