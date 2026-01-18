import { eq } from "drizzle-orm";
import { useDb } from "../db/client";
import { bills, billParticipants, users } from "../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  
  const userId = session.user.id as string | undefined;
  if (!userId) {
    setResponseStatus(event, 401);
    return { error: "Unauthorized" };
  }
  const db = useDb();

  // Get bills owned by user with full participant details
  const ownsBills = await db.select().from(bills).where(eq(bills.ownerUserId, userId));
  
  const owns = await Promise.all(
    ownsBills.map(async (bill) => {
      const participants = await db
        .select({
          userId: billParticipants.userId,
          amountOwed: billParticipants.amountOwed,
          email: users.email,
          displayName: users.displayName,
        })
        .from(billParticipants)
        .innerJoin(users, eq(billParticipants.userId, users.id))
        .where(eq(billParticipants.billId, bill.id));
      
      return {
        ...bill,
        participants: participants.map(p => ({
          userId: p.userId,
          amountOwed: p.amountOwed,
          email: p.email,
          displayName: p.displayName,
        })),
      };
    })
  );
  
  // Get bills where user is a participant with full bill and participant details
  const userParticipants = await db
    .select({
      billId: billParticipants.billId,
      userId: billParticipants.userId,
      amountOwed: billParticipants.amountOwed,
    })
    .from(billParticipants)
    .where(eq(billParticipants.userId, userId));

  const owes = await Promise.all(
    userParticipants.map(async (participant) => {
      const [bill] = await db.select().from(bills).where(eq(bills.id, participant.billId)).limit(1);
      if (!bill) return null;
      
      const participants = await db
        .select({
          userId: billParticipants.userId,
          amountOwed: billParticipants.amountOwed,
          email: users.email,
          displayName: users.displayName,
        })
        .from(billParticipants)
        .innerJoin(users, eq(billParticipants.userId, users.id))
        .where(eq(billParticipants.billId, bill.id));
      
      return {
        bill: {
          ...bill,
          participants: participants.map(p => ({
            userId: p.userId,
            amountOwed: p.amountOwed,
            email: p.email,
            displayName: p.displayName,
          })),
        },
        participant: {
          billId: participant.billId,
          userId: participant.userId,
          amountOwed: participant.amountOwed,
        },
      };
    })
  );

  return { 
    owns, 
    owes: owes.filter((item): item is NonNullable<typeof item> => item !== null) 
  };
});
