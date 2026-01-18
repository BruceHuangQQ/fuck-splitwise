declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name?: string
    image?: string
  }

  interface UserSession {
    user: User
    loggedInAt: Date
  }

  interface SecureSessionData {
    // Add any secure data here that should only be accessible on server-side
  }
}

export {}
