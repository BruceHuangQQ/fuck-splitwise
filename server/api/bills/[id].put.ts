import { eq } from "drizzle-orm";
import { useDb } from "../../db/client";
import { bills, billParticipants } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  
  if (!session.user.id) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }

  const billId = getRouterParam(event, "id");
  if (!billId) {
    setResponseStatus(event, 400);
    return { error: "Bill ID is required" };
  }

  const db = useDb();

  // Check if bill exists and user is the owner
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId)).limit(1);
  
  if (!bill) {
    setResponseStatus(event, 404);
    return { error: "Bill not found" };
  }

  if (bill.ownerUserId !== session.user.id) {
    setResponseStatus(event, 403);
    return { error: "Only the bill owner can update this bill" };
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

  // Update the bill
  const [updatedBill] = await db
    .update(bills)
    .set({
      title,
      totalAmount: totalAmount.toString(),
      dueDate: dueDate ? new Date(dueDate) : null,
    })
    .where(eq(bills.id, billId))
    .returning();

  // Delete existing participants and create new ones
  await db.delete(billParticipants).where(eq(billParticipants.billId, billId));

  const participantValues = participants.map((p: { userId: string; amountOwed: string | number }) => ({
    billId: billId,
    userId: p.userId,
    amountOwed: p.amountOwed.toString(),
  }));

  await db.insert(billParticipants).values(participantValues);

  return { success: true, bill: updatedBill };
});

