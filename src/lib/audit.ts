import { prisma } from "@/lib/prisma";

/**
 * Structured audit logger. Writes to the AuditLog table using the
 * existing schema. All administrative mutations should call this.
 *
 * Never log: passwords, session tokens, secrets, or auth credentials.
 */
export async function auditLog(params: {
  actorId: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetId: params.targetId ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    // Audit log failures must never break the calling operation.
    // Log internally for debugging but swallow.
    console.error("[auditLog] failed to write audit log:", error);
  }
}
