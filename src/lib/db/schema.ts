/**
 * Research notebook persistence (SQLite via Drizzle). Local-only; no
 * external account. Saved sources retain the full SourceRecord snapshot so
 * they can be restored even when the archive is unreachable, plus the
 * stable identifiers needed to re-fetch and detect drift.
 */

import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const savedSources = sqliteTable(
  "saved_sources",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** SourceRecord.id — `${provider}:${providerItemId}` */
    recordId: text("record_id").notNull(),
    provider: text("provider").notNull(),
    providerItemId: text("provider_item_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    /** Full SourceRecord snapshot (JSON) for offline restoration. */
    snapshot: text("snapshot").notNull(),
    /** Content hash of the snapshot's stable fields, to detect drift. */
    snapshotHash: text("snapshot_hash").notNull(),
    savedAt: text("saved_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    /** Last time the record was re-checked against its provider. */
    lastVerifiedAt: text("last_verified_at"),
    /** 'ok' | 'changed' | 'unreachable' | 'unchecked' */
    freshness: text("freshness").notNull().default("unchecked"),
  },
  (t) => [uniqueIndex("saved_project_record").on(t.projectId, t.recordId)],
);

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  savedSourceId: integer("saved_source_id").references(() => savedSources.id, {
    onDelete: "cascade",
  }),
  body: text("body").notNull(),
  /** Optional verbatim quotation captured from a transcript, with locator. */
  quotation: text("quotation"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("tag_project_name").on(t.projectId, t.name)],
);

export const sourceTags = sqliteTable(
  "source_tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    savedSourceId: integer("saved_source_id")
      .notNull()
      .references(() => savedSources.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("source_tag_unique").on(t.savedSourceId, t.tagId)],
);

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** 'collection' for custom groupings; 'comparison' for comparison sets. */
  kind: text("kind").notNull().default("collection"),
  /** For comparison sets: which side each member is on, stored per member. */
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const collectionMembers = sqliteTable(
  "collection_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    savedSourceId: integer("saved_source_id")
      .notNull()
      .references(() => savedSources.id, { onDelete: "cascade" }),
    /** 'left' | 'right' | null for plain collections. */
    side: text("side"),
  },
  (t) => [
    uniqueIndex("collection_member_unique").on(t.collectionId, t.savedSourceId),
  ],
);
