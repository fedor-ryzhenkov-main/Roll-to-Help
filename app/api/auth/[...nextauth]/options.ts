import { 
  NextAuthOptions, 
  User as NextAuthUser, 
  DefaultSession,
  DefaultUser 
} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/app/lib/db';

// Extend the built-in types directly
declare module 'next-auth' {
  interface User extends DefaultUser {
    isAdmin?: boolean;
    telegramId?: string | null;
    telegramUsername?: string | null;
    telegramFirstName?: string | null;
  }


  interface Session extends DefaultSession {
    user: {
      isAdmin?: boolean;
      telegramId?: string | null;
      telegramUsername?: string | null;
      telegramFirstName?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isAdmin?: boolean;
    telegramId?: string | null;
    telegramUsername?: string | null;
    telegramFirstName?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Telegram Verification',
      credentials: {
        verificationToken: { label: "Verification Token", type: "text" },
      },
      // Authorize function returns the extended User type
      async authorize(credentials): Promise<NextAuthUser | null> {
        console.log('[NextAuth Authorize] Received credentials:', credentials);
        const verificationToken = credentials?.verificationToken;
        if (!verificationToken) return null;

        try {
          const verificationRecord = await prisma.pendingVerification.findUnique({ where: { verificationToken } });
          if (!verificationRecord || !verificationRecord.verificationToken || 
              !verificationRecord.expires || verificationRecord.expires < new Date()) {
            if (verificationRecord && verificationRecord.expires && verificationRecord.expires < new Date()) {
              await prisma.pendingVerification.delete({ where: { id: verificationRecord.id } });
            }
            return null;
          }
          if (!verificationRecord.verifiedUserId) return null;

          const user = await prisma.user.findUnique({ where: { id: verificationRecord.verifiedUserId } });
          if (!user) return null;

          await prisma.pendingVerification.update({
            where: { id: verificationRecord.id },
            data: { verificationToken: null },
          });

          console.log(`[NextAuth Authorize] Successfully authorized user: ${user.id}`);
          // Return object matching the extended next-auth User interface
          return {
            id: user.id,
            // name: user.telegramFirstName || user.telegramUsername, // Optional: map to default 'name' field if desired
            // email: null, // Default User requires email - set to null if not available
            // image: null, // Optional: map telegramPhotoUrl if available
            isAdmin: user.isAdmin,
            telegramId: user.telegramId,
            telegramUsername: user.telegramUsername,
            telegramFirstName: user.telegramFirstName,
          };
        } catch (error) {
          console.error('[NextAuth Authorize] Error verifying token:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // jwt callback receives the extended User type on sign in
    async jwt({ token, user }) {
      // On initial sign in, persist custom data from user object to the token
      if (user) {
        token.isAdmin = user.isAdmin;
        token.telegramId = user.telegramId;
        token.telegramUsername = user.telegramUsername;
        token.telegramFirstName = user.telegramFirstName;
        // token.sub already holds the user.id
      }
      return token; // token now contains custom fields
    },
    // session callback receives the extended JWT type
    async session({ session, token }) {
      // Add custom properties from token to the session.user object
      if (token && session.user) {
        // session.user.id should be populated from token.sub by default
        session.user.isAdmin = token.isAdmin;
        session.user.telegramId = token.telegramId;
        session.user.telegramUsername = token.telegramUsername;
        session.user.telegramFirstName = token.telegramFirstName;
      }
      return session;
    },
  },
  pages: {},
  // secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 