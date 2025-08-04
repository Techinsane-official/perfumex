import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        markup: { label: "Markup Percentage", type: "number" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials: Record<string, unknown>) {
        try {
          if (!credentials?.username || typeof credentials.username !== "string") {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            include: {
              customer: true, // Include customer for buyers
            },
          });

          if (!user || !user.isActive) {
            return null;
          }

          // Admin login flow
          if (user.role === "ADMIN") {
            if (!credentials.password || typeof credentials.password !== "string") {
              throw new Error("Password required for admin login");
            }

            if (!user.password) {
              throw new Error("Admin user has no password set");
            }

            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

            if (!isPasswordValid) {
              throw new Error("Invalid password");
            }

            return {
              id: user.id,
              username: user.username,
              role: user.role,
            };
          }

          // Buyer login flow
          if (user.role === "BUYER") {
            // Markup is now optional and comes as decimal (0-1)
            let markup = 0;
            if (credentials.markup) {
              const markupNum = parseFloat(credentials.markup.toString());
              if (!isNaN(markupNum) && markupNum >= 0 && markupNum <= 1) {
                markup = markupNum;
              }
            }

            return {
              id: user.id,
              username: user.username,
              role: user.role,
              markup: markup,
              customerId: user.customerId, // Include customer ID
            };
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        if ("markup" in user && user.markup !== undefined) {
          token.markup = user.markup;
        }
        if ("customerId" in user && user.customerId) {
          token.customerId = user.customerId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        if ("markup" in token && token.markup !== undefined) {
          session.user.markup = token.markup as number;
        }
        if ("customerId" in token && token.customerId) {
          session.user.customerId = token.customerId as string;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
});
