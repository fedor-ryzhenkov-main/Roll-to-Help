import NextAuth, { type NextAuthOptions } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials'; // Removed CredentialsProvider
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from '@/app/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // Providers array is now empty or could contain other OAuth providers later
  providers: [
      // No providers needed for our custom Telegram magic link flow
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (optional, aligns with cookie maxAge)
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // JWT callback populates the token based on the user data from the adapter/database
    async jwt({ token, user }) {
      // If user object exists (e.g., after sign-in via adapter), add custom fields
      if (user) {
        token.id = user.id;
        // Fetch user details that might not be on the default user object
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user.id }, 
            select: { isVerified: true, telegramId: true, telegramUsername: true, username: true }
        });
        if (dbUser) {
             token.isVerified = dbUser.isVerified;
             token.telegramId = dbUser.telegramId;
             token.telegramUsername = dbUser.telegramUsername;
             token.username = dbUser.username;
        }
      } 
      // Add custom fields on subsequent JWT calls using data already in token
      // This part might need refinement based on exactly when/how JWT is refreshed
      else if (token.id) { // Check if token already has user ID
          const dbUser = await prisma.user.findUnique({ 
                where: { id: token.id as string }, 
                select: { isVerified: true, telegramId: true, telegramUsername: true, username: true }
            });
           if (dbUser) {
             token.isVerified = dbUser.isVerified;
             token.telegramId = dbUser.telegramId;
             token.telegramUsername = dbUser.telegramUsername;
             token.username = dbUser.username;
          }
      }
      
      return token;
    },
    // Session callback takes data from the JWT token and sends it to the client
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.telegramId = token.telegramId as string | null;
        session.user.telegramUsername = token.telegramUsername as string | null;
        session.user.username = token.username as string;
      }
      return session;
    }
  },

  // Remove custom pages or point signIn to a general info page
  pages: {
    // signIn: '/auth/signin', // Remove or change this
     error: '/auth/error', // Optional: An error page
  },

  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 