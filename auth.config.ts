import type { NextAuthConfig } from "next-auth";
import { UserRole } from "@/generated/prisma/enums";
import { getDashboardPath } from "@/lib/roles";

const protectedPaths = [
  { path: "/student", role: UserRole.STUDENT },
  { path: "/teacher", role: UserRole.TEACHER },
  { path: "/admin", role: UserRole.ADMIN },
] as const;

function isUserRole(role: unknown): role is UserRole {
  return (
    role === UserRole.STUDENT ||
    role === UserRole.TEACHER ||
    role === UserRole.ADMIN
  );
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (
        session.user &&
        typeof token.id === "string" &&
        isUserRole(token.role)
      ) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;
      const user = auth?.user;

      if (pathname === "/login" && user) {
        return Response.redirect(new URL(getDashboardPath(user.role), request.nextUrl));
      }

      const protectedRoute = protectedPaths.find(
        ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
      );

      if (!protectedRoute) {
        return true;
      }

      if (!user) {
        return false;
      }

      if (user.role !== protectedRoute.role) {
        return Response.redirect(new URL(getDashboardPath(user.role), request.nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
