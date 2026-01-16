import { eq } from "drizzle-orm";
import { useDb } from "../../db/client";
import { users } from "../../db/schema";

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user, tokens }) {
    if (!user.email) {
      throw createError({
        statusCode: 400,
        message: "Email is required",
      });
    }

    const db = useDb();
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    let dbUser;
    // Create user if they don't exist
    if (existingUser.length === 0) {
      const [newUser] = await db.insert(users).values({
        email: user.email,
        displayName: user.name || user.email.split("@")[0],
      }).returning();
      dbUser = newUser;
    } else {
      dbUser = existingUser[0];
    }

    // Google OAuth returns 'picture' for the profile image URL
    const profileImage = (user as any).picture || (user as any).avatar_url || undefined;

    await setUserSession(event, {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.displayName,
        image: profileImage,
      },
      loggedInAt: new Date(),
    });

    return sendRedirect(event, "/");
  },
  onError(event, error) {
    console.error("Google OAuth error:", error);
    return sendRedirect(event, "/login");
  },
});

