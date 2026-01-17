import { eq } from "drizzle-orm";
import { useDb } from "../db/client";
import { bills, billParticipants } from "../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  
  if (!session.user.id) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }

  const body = await readBody(event);
  const { title, totalAmount, dueDate, participants } = body;

  if (!title || !totalAmount) {
    setResponseStatus(event, 400);
    return { error: "Title and total amount are required" };
  }

  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    setResponseStatus(event, 400);
    return { error: "At least one participant is required" };
  }

  const db = useDb();

  // Create the bill
  const [newBill] = await db.insert(bills).values({
    ownerUserId: session.user.id,
    title,
    totalAmount: totalAmount.toString(),
    dueDate: dueDate ? new Date(dueDate) : null,
  }).returning();

  // Create participants
  const participantValues = participants.map((p: { userId: string; amountOwed: string | number }) => ({
    billId: newBill.id,
    userId: p.userId,
    amountOwed: p.amountOwed.toString(),
  }));

  await db.insert(billParticipants).values(participantValues);

  return { success: true, bill: newBill };
});

