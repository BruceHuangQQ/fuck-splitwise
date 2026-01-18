import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { bills, billParticipants, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (!session.user.id) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }

  const billId = getRouterParam(event, 'id')
  if (!billId) {
    setResponseStatus(event, 400)
    return { error: 'Bill ID is required' }
  }

  const db = useDb()

  // Get the bill
  const [bill] = await db
    .select()
    .from(bills)
    .where(eq(bills.id, billId))
    .limit(1)

  if (!bill) {
    setResponseStatus(event, 404)
    return { error: 'Bill not found' }
  }

  // Get participants with user info
  const participants = await db
    .select({
      userId: billParticipants.userId,
      amountOwed: billParticipants.amountOwed,
      email: users.email,
      displayName: users.displayName
    })
    .from(billParticipants)
    .innerJoin(users, eq(billParticipants.userId, users.id))
    .where(eq(billParticipants.billId, billId))

  return {
    ...bill,
    participants: participants.map((p) => ({
      userId: p.userId,
      amountOwed: p.amountOwed,
      email: p.email,
      displayName: p.displayName
    }))
  }
})
