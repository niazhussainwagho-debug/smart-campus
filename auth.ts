import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import { compare } from "bcryptjs";
import { authConfig } from "@/auth.config";
import { UserStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

class PendingApprovalError extends CredentialsSignin {
  code = "account-pending";
}

class EmailVerificationRequiredError extends CredentialsSignin {
  code = "email-unverified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !(await compare(password, user.passwordHash))) {
          return null;
        }

        if (!user.emailVerifiedAt) {
          throw new EmailVerificationRequiredError();
        }
        if (user.status === UserStatus.PENDING) {
          throw new PendingApprovalError();
        }
        if (user.status !== UserStatus.APPROVED) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
