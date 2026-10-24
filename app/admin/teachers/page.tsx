import { redirect } from "next/navigation";

export default async function AdminTeachersPage() {
  redirect("/admin/requests");
}
