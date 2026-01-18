import { useDb } from '../db/client'
import { users } from '../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (!session.user.id) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }

  const db = useDb()
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName
    })
    .from(users)

  return allUsers
})
