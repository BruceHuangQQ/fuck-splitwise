import {
  pgTable,
  text,
  uuid,
  timestamp,
  numeric,
  primaryKey
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})

export const bills = pgTable('bills', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id').notNull(),
  title: text('title').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})

export const billParticipants = pgTable(
  'bill_participants',
  {
    billId: uuid('bill_id').notNull(),
    userId: uuid('user_id').notNull(),
    amountOwed: numeric('amount_owed', { precision: 12, scale: 2 }).notNull()
  },
  (table) => ({
    pk: primaryKey({ columns: [table.billId, table.userId] })
  })
)
