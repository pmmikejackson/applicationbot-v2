import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Check 2FA if enabled
        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('2FA_REQUIRED')
          }
          
          const speakeasy = require('speakeasy')
          const isValidToken = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: credentials.twoFactorCode,
            window: 1
          })

          if (!isValidToken) {
            return null
          }
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          subscriptionStatus: user.subscriptionStatus
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.subscriptionStatus = user.subscriptionStatus
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.subscriptionStatus = token.subscriptionStatus
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
})