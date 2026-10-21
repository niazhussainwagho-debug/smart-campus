import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/roles";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(getDashboardPath(session.user.role));
}
