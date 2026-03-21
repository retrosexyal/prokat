import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
        })) as UserType;


        if (!user) return null;



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
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
