import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Simplified NextAuth configuration to resolve OAuth callback issues
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request Calendar access for event integration
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          prompt: "consent", // Always show consent screen for transparency
        },
      },
    }),
  ],
  
  // Use JWT sessions for localhost development
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Cookie configuration for localhost development
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for localhost development
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for localhost development
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for localhost development
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for localhost development
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for localhost development
        maxAge: 60 * 15, // 15 minutes
      },
    },
    nonce: {
      name: `next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // Set to false for localhost development
      },
    },
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('NextAuth Sign In:', { user, account, profile });
      return true;
    },
    
    async jwt({ token, account, user }) {
      // Store access token for Google Calendar API
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Attach access token to session for calendar integration
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
  },
  
  
  // Privacy-focused settings
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };