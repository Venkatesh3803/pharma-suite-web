import clientPromise from "@/lib/mongodb";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "PharmaSuite Secure Gateway",
      credentials: {
        username: { label: "Terminal ID / Email", type: "text" },
        password: { label: "Security PIN / Password", type: "password" },
      },
      authorize: async credentials => {
        if (!credentials?.username || !credentials?.password) return null;

        // 1. Establish database runtime access from client cache
        const client = await clientPromise;
        const db = client.db("pharmasuite");

        // 2. Locate the operator document matching the input terminal email identifier
        const user = await db.collection("users").findOne({
          email: credentials.username,
        });

        if (!user) return null;

        // 3. Verify security credentials string parameters
        // 💡 Note: For production use, verify hashed passwords using a library like `bcrypt` or `argon2`.
        const isPasswordValid = credentials.password === user.password;

        if (isPasswordValid) {
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "Operator",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
