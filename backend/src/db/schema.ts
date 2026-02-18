import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

export const pictograms = sqliteTable("pictograms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull(),
  lastModified: text("last_modified").notNull(),
  tags: text("tags"), // JSON array serialized
  contributorUsername: text("contributor_username"),
  contributorAvatarUrl: text("contributor_avatar_url"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const galleries = sqliteTable("galleries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const galleryPictograms = sqliteTable(
  "gallery_pictograms",
  {
    galleryId: text("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),
    pictogramId: text("pictogram_id")
      .notNull()
      .references(() => pictograms.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.galleryId, table.pictogramId] })],
);

export const downloads = sqliteTable("downloads", {
  pictogramId: text("pictogram_id")
    .primaryKey()
    .references(() => pictograms.id, { onDelete: "cascade" }),
  count: integer("count").notNull().default(0),
});

export const users = sqliteTable("users", {
  githubLogin: text("github_login").primaryKey(),
  githubName: text("github_name"),
  githubAvatarUrl: text("github_avatar_url"),
  githubEmail: text("github_email"),
  firstSeenAt: text("first_seen_at").$defaultFn(() => new Date().toISOString()),
  lastSeenAt: text("last_seen_at").$defaultFn(() => new Date().toISOString()),
});

export const favorites = sqliteTable(
  "favorites",
  {
    userLogin: text("user_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    pictogramId: text("pictogram_id")
      .notNull()
      .references(() => pictograms.id, { onDelete: "cascade" }),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [primaryKey({ columns: [table.userLogin, table.pictogramId] })],
);

export const userCollections = sqliteTable("user_collections", {
  id: text("id").primaryKey(),
  userLogin: text("user_login")
    .notNull()
    .references(() => users.githubLogin, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
});

export const userCollectionPictograms = sqliteTable(
  "user_collection_pictograms",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => userCollections.id, { onDelete: "cascade" }),
    pictogramId: text("pictogram_id")
      .notNull()
      .references(() => pictograms.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    addedAt: text("added_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.pictogramId] })],
);

export const pictogramLikes = sqliteTable(
  "pictogram_likes",
  {
    userLogin: text("user_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    pictogramId: text("pictogram_id")
      .notNull()
      .references(() => pictograms.id, { onDelete: "cascade" }),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [primaryKey({ columns: [table.userLogin, table.pictogramId] })],
);

export const likesCounts = sqliteTable("likes_counts", {
  pictogramId: text("pictogram_id")
    .primaryKey()
    .references(() => pictograms.id, { onDelete: "cascade" }),
  count: integer("count").notNull().default(0),
});

export const anonymousDownloads = sqliteTable(
  "anonymous_downloads",
  {
    ip: text("ip").notNull(),
    downloadDate: text("download_date").notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.ip, table.downloadDate] })],
);
