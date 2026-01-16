import { eq } from "drizzle-orm";
import { getServerSession } from "#auth";
import { useDb } from "../db/client";
import { bills, billParticipants } from "../db/schema";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }
  const db = useDb();

  const owns = await db.select().from(bills).where(eq(bills.ownerUserId, userId));
  const owes = await db.select().from(billParticipants).where(eq(billParticipants.userId, userId));

  return { owns, owes };
});
