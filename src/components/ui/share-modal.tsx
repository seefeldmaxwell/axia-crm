"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Share2, Trash2, Eye, Pencil } from "lucide-react";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  recordType: string;
  recordId: string;
  recordLabel: string;
  onShared?: () => void;
}

export function ShareModal({
  open,
  onClose,
  recordType,
  recordId,
  recordLabel,
  onShared,
}: ShareModalProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [permission, setPermission] = useState("view");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [orgUsers, recordShares] = await Promise.all([
        api.getOrgUsers(),
        api.getRecordShares(recordType, recordId),
      ]);
      setUsers(orgUsers);
      setShares(recordShares);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
      setUserId("");
      setPermission("view");
    }
  }, [open]);

  const handleShare = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await api.shareRecord(recordType, recordId, userId, permission);
      const targetUser = users.find((u) => u.id === userId);
      toast(`Shared with ${targetUser?.name || "user"}`);
      setUserId("");
      await loadData();
      onShared?.();
    } catch (e: any) {
      toast(e.message || "Share failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await api.revokeShare(shareId);
      toast("Share revoked");
      await loadData();
    } catch (e: any) {
      toast(e.message || "Failed to revoke");
    }
  };

  // Filter out users who already have shares
  const sharedUserIds = new Set(shares.map((s: any) => s.shared_with_user_id));
  const availableUsers = users.filter((u) => !sharedUserIds.has(u.id));

  return (
    <Modal open={open} onClose={onClose} title={`Share Record`} size="md">
      <div className="space-y-4">
        <div>
          <p className="text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Record
          </p>
          <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
            {recordLabel}
          </p>
        </div>

        {/* Current shares */}
        {shares.length > 0 && (
          <div>
            <p className="text-[12px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Shared With
            </p>
            <div className="space-y-2">
              {shares.map((share: any) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between px-3 py-2"
                  style={{
                    background: "var(--bg-tertiary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "var(--accent-blue)", color: "#fff" }}
                    >
                      {(share.shared_with_name || "?")[0]}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {share.shared_with_name}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {share.shared_with_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5"
                      style={{
                        background: share.permission === "edit" ? "var(--accent-blue-muted)" : "var(--bg-quaternary)",
                        color: share.permission === "edit" ? "var(--accent-blue)" : "var(--text-tertiary)",
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {share.permission === "edit" ? <Pencil size={10} /> : <Eye size={10} />}
                      {share.permission}
                    </span>
                    <button
                      onClick={() => handleRevoke(share.id)}
                      className="p-1 transition-colors"
                      style={{ color: "var(--text-tertiary)", borderRadius: "var(--radius-sm)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--accent-red)";
                        e.currentTarget.style.background = "var(--accent-red-muted)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-tertiary)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add share */}
        <div className="grid grid-cols-[1fr,auto] gap-3 items-end">
          <Select
            label="Share with"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            options={[
              { value: "", label: "Select team member..." },
              ...availableUsers.map((u) => ({
                value: u.id,
                label: `${u.name}${u.title ? ` — ${u.title}` : ""}`,
              })),
            ]}
          />
          <Select
            label="Permission"
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            options={[
              { value: "view", label: "View" },
              { value: "edit", label: "Edit" },
            ]}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
        <Button onClick={handleShare} disabled={!userId || loading}>
          <Share2 size={14} />
          {loading ? "Sharing..." : "Share"}
        </Button>
      </div>
    </Modal>
  );
}
