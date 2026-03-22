import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { sendVerifyEmail } from "@/lib/sendVerifyEmail";
import { UserType } from "@/types";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        callbackUrl: { label: "Callback URL", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db();

        const user = (await db.collection("users").findOne({
          email: credentials.email.toLowerCase(),
        })) as UserType | null;

        if (!user) return null;

        // пользователь мог быть создан через Google и не иметь password
        if (!user.password) {
          throw new Error("USE_GOOGLE_LOGIN");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        if (!user.verified) {
          const callbackUrl =
            typeof credentials.callbackUrl === "string" &&
            credentials.callbackUrl.startsWith("/") &&
            !credentials.callbackUrl.startsWith("//")
              ? credentials.callbackUrl
              : "/";

          const r = await sendVerifyEmail(user, callbackUrl);
          if (r.cooldown) {
            throw new Error("VERIFY_COOLDOWN");
          }

          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      if (!user.email) return false;

      const client = await clientPromise;
      const db = client.db();
      const users = db.collection("users");

      const email = user.email.toLowerCase();
      const existingUser = await users.findOne({ email });

      if (!existingUser) {
        await users.insertOne({
          email,
          name: user.name ?? "",
          image: user.image ?? "",
          verified: true,
          provider: "google",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await users.updateOne(
          { email },
          {
            $set: {
              name: user.name ?? existingUser.name ?? "",
              image: user.image ?? existingUser.image ?? "",
              verified: true,
              updatedAt: new Date(),
            },
          },
        );
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const client = await clientPromise;
        const db = client.db();

        const dbUser = await db.collection("users").findOne({
          email: user.email.toLowerCase(),
        });

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.email = dbUser.email;
          token.name = dbUser.name ?? null;
          token.picture = dbUser.image ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string) ?? null;
        session.user.image = (token.picture as string) ?? null;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };