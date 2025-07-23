import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:
        "122449642269-gd6eoq7msr3vrafgc2ntka097i1roern.apps.googleusercontent.com",
      clientSecret: "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",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        // Replace with your real login API endpoint
        const res = await fetch("https://your-api.com/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
        const user = await res.json();
        if (res.ok && user && user.email) {
          // Only return the fields NextAuth expects
          return {
            name: user.name || user.email,
            email: user.email,
            image: user.image || null,
            ...user, // include any other fields you wa,nt in the session
          };
        }
        return null;
      },
    }),
  ],
  secret: "63lOrI4NyqGInI+cxCiJzhg40kFe66jnXA2Rnrw9V9E=",
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as typeof session.user;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
