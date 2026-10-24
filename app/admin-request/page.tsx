import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/roles";

export default async function AdminRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status === "PENDING_VERIFICATION") {
    redirect("/verification");
  }
  redirect(getDashboardPath(session.user.role));
}
