import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
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
  (table) => [
    primaryKey({ columns: [table.galleryId, table.pictogramId] }),
    index("gp_pictogram_id_idx").on(table.pictogramId),
  ],
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
  bannedAt: text("banned_at"),
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
  (table) => [
    primaryKey({ columns: [table.collectionId, table.pictogramId] }),
    index("ucp_pictogram_id_idx").on(table.pictogramId),
  ],
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

export const userPictograms = sqliteTable(
  "user_pictograms",
  {
    id: text("id").primaryKey(),
    ownerLogin: text("owner_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    name: text("name").notNull(),
    filename: text("filename").notNull(),
    minioKey: text("minio_key").notNull(),
    size: integer("size").notNull(),
    tags: text("tags"), // JSON array sérialisé
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("up_owner_login_idx").on(table.ownerLogin)],
);

export const userCollectionUserPictograms = sqliteTable(
  "user_collection_user_pictograms",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => userCollections.id, { onDelete: "cascade" }),
    userPictogramId: text("user_pictogram_id")
      .notNull()
      .references(() => userPictograms.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    addedAt: text("added_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.userPictogramId] }),
    index("ucup_user_pictogram_id_idx").on(table.userPictogramId),
  ],
);

export const feedbackSeen = sqliteTable(
  "feedback_seen",
  {
    userLogin: text("user_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    issueId: integer("issue_id").notNull(),
    seenAt: text("seen_at").$defaultFn(() => new Date().toISOString()),
    dismissed: integer("dismissed").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userLogin, table.issueId] })],
);

export const pictoRequests = sqliteTable(
  "picto_requests",
  {
    id: text("id").primaryKey(),
    requesterLogin: text("requester_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    referenceImageKey: text("reference_image_key"),
    urgency: text("urgency").notNull().default("normale"),
    status: text("status").notNull().default("nouvelle"),
    assignedTo: text("assigned_to").references(() => users.githubLogin),
    deliveredPictogramId: text("delivered_pictogram_id").references(
      () => pictograms.id,
    ),
    rejectionReason: text("rejection_reason"),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("pr_requester_login_idx").on(table.requesterLogin),
    index("pr_status_idx").on(table.status),
    index("pr_assigned_to_idx").on(table.assignedTo),
  ],
);

export const pictoRequestComments = sqliteTable(
  "picto_request_comments",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => pictoRequests.id, { onDelete: "cascade" }),
    authorLogin: text("author_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("prc_request_id_idx").on(table.requestId)],
);

export const pictoRequestHistory = sqliteTable(
  "picto_request_history",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => pictoRequests.id, { onDelete: "cascade" }),
    actorLogin: text("actor_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    action: text("action").notNull(), // "created" | "assigned" | "status_changed"
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    detail: text("detail"), // extra info (e.g. rejection reason, assignee)
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("prh_request_id_idx").on(table.requestId)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    recipientLogin: text("recipient_login")
      .notNull()
      .references(() => users.githubLogin, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    isRead: integer("is_read").notNull().default(0),
    dismissed: integer("dismissed").notNull().default(0),
    createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("notif_recipient_read_idx").on(table.recipientLogin, table.isRead),
    index("notif_recipient_dismissed_idx").on(
      table.recipientLogin,
      table.dismissed,
    ),
  ],
);
