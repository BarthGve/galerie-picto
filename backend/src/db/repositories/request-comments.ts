import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../index.js";
import { pictoRequestComments, users } from "../schema.js";

export function getCommentsByRequestId(requestId: string) {
  return db
    .select({
      id: pictoRequestComments.id,
      requestId: pictoRequestComments.requestId,
      authorLogin: pictoRequestComments.authorLogin,
      authorName: users.githubName,
      authorAvatar: users.githubAvatarUrl,
      content: pictoRequestComments.content,
      createdAt: pictoRequestComments.createdAt,
    })
    .from(pictoRequestComments)
    .leftJoin(users, eq(pictoRequestComments.authorLogin, users.githubLogin))
    .where(eq(pictoRequestComments.requestId, requestId))
    .orderBy(pictoRequestComments.createdAt)
    .all();
}

export function addComment(
  requestId: string,
  authorLogin: string,
  content: string,
): string {
  const id = uuidv4();
  db.insert(pictoRequestComments)
    .values({ id, requestId, authorLogin, content })
    .run();
  return id;
}
