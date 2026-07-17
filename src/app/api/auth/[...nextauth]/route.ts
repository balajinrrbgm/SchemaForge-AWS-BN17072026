import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { pgDb } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      await pgDb`
        INSERT INTO users (email, name, image)
        VALUES (${user.email}, ${user.name ?? ''}, ${user.image ?? null})
        ON CONFLICT (email) DO UPDATE
          SET name = EXCLUDED.name,
              image = EXCLUDED.image
      `
      return true
    },
    async session({ session }) {
      if (session.user?.email) {
        const [dbUser] = await pgDb<[{ id: string }]>`
          SELECT id FROM users WHERE email = ${session.user.email}
        `
        if (dbUser) (session.user as typeof session.user & { id: string }).id = dbUser.id
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
