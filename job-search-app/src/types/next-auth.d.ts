import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      firstName?: string
      lastName?: string
      emailVerified?: Date
      subscriptionStatus: string
    }
  }

  interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    emailVerified?: Date
    subscriptionStatus: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    subscriptionStatus: string
  }
}