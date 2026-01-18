import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { bills, billParticipants } from '../../db/schema'

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

  // Check if bill exists and user is the owner
  const [bill] = await db
    .select()
    .from(bills)
    .where(eq(bills.id, billId))
    .limit(1)

  if (!bill) {
    setResponseStatus(event, 404)
    return { error: 'Bill not found' }
  }

  if (bill.ownerUserId !== session.user.id) {
    setResponseStatus(event, 403)
    return { error: 'Only the bill owner can delete this bill' }
  }

  // Delete participants first (foreign key constraint)
  await db.delete(billParticipants).where(eq(billParticipants.billId, billId))

  // Delete the bill
  await db.delete(bills).where(eq(bills.id, billId))

  return { success: true }
})
