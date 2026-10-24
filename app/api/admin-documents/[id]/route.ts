import { auth } from "@/auth";
import { AdminStatus, UserRole, UserStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return new Response("Not found", { status: 404 });
  }

  const admin = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      adminStatus: AdminStatus.APPROVED,
    },
    select: { id: true },
  });
  if (!admin) {
    return new Response("Not found", { status: 404 });
  }

  const { id } = await params;
  const url = `/api/admin-documents/${id}`;
  const document = await prisma.adminVerificationDocument.findFirst({
    where: {
      id,
      user: {
        is: {
          adminDocuments: { has: url },
        },
      },
    },
    select: {
      filename: true,
      mimeType: true,
      content: true,
    },
  });
  if (!document) {
    return new Response("Not found", { status: 404 });
  }

  const filename = document.filename.replace(/[^\w.-]/g, "_");
  return new Response(Buffer.from(document.content), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(document.content.byteLength),
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Type": document.mimeType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
