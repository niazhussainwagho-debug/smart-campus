import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;
export default auth;

export const config = {
  matcher: [
    "/login",
    "/verification",
    "/admin-request",
    "/admin-request/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/announcements/:path*",
    "/campus-status/:path*",
  ],
};
