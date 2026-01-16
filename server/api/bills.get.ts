import { eq } from "drizzle-orm";
import { useDb } from "../db/client";
import { bills, billParticipants } from "../db/schema";

export default defineEventHandler(async (event) => {
  // MVP “auth”: pass userId via query for now (replace later)
  const userId = getQuery(event).userId as string;
  if (!userId) {
    setResponseStatus(event, 400);
    return { error: "Missing userId" };
  }

  const db = useDb();

  const owns = await db.select().from(bills).where(eq(bills.ownerUserId, userId));
  const owes = await db.select().from(billParticipants).where(eq(billParticipants.userId, userId));

  return { owns, owes };
});
