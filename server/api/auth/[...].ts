import { NuxtAuthHandler } from "#auth"
import GoogleProvider from "next-auth/providers/google"
import { eq } from "drizzle-orm"
import { useDb } from "../../db/client"
import { users } from "../../db/schema"

export default NuxtAuthHandler({
  secret: process.env.NUXT_AUTH_SECRET,
  providers: [
    // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
    GoogleProvider.default({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      const db = useDb();
      
      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      // Create user if they don't exist
      if (existingUser.length === 0) {
        await db.insert(users).values({
          email: user.email,
          displayName: user.name || user.email.split("@")[0],
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const db = useDb();
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, session.user.email))
          .limit(1);

        if (dbUser.length > 0) {
          // Add database user ID to session
          (session.user as any).id = dbUser[0].id;
        }
      }
      return session;
    },
  },
})
