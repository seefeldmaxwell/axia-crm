"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ArrowRight } from "lucide-react";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  recordType: string;
  recordId: string;
  recordLabel: string;
  currentOwnerName?: string;
  onTransferred: () => void;
}

export function TransferModal({
  open,
  onClose,
  recordType,
  recordId,
  recordLabel,
  currentOwnerName,
  onTransferred,
}: TransferModalProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [toUserId, setToUserId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      api.getOrgUsers().then(setUsers).catch(() => {});
      setToUserId("");
      setReason("");
    }
  }, [open]);

  const handleTransfer = async () => {
    if (!toUserId) return;
    setLoading(true);
    try {
      await api.transferRecord(recordType, recordId, toUserId, reason || undefined);
      const targetUser = users.find((u) => u.id === toUserId);
      toast(`Transferred to ${targetUser?.name || "user"}`);
      onTransferred();
      onClose();
    } catch (e: any) {
      toast(e.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Transfer ${recordType}`} size="md">
      <div className="space-y-4">
        {/* Current owner */}
        <div>
          <p className="text-[12px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Record
          </p>
          <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
            {recordLabel}
          </p>
        </div>

        {currentOwnerName && (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>Current Owner</p>
              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                {currentOwnerName}
              </p>
            </div>
            <ArrowRight size={14} style={{ color: "var(--text-tertiary)" }} />
            <div>
              <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>New Owner</p>
            </div>
          </div>
        )}

        {/* User selector */}
        <Select
          label="Transfer to"
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          options={[
            { value: "", label: "Select team member..." },
            ...users.map((u) => ({
              value: u.id,
              label: `${u.name}${u.title ? ` — ${u.title}` : ""}`,
            })),
          ]}
        />

        {/* Reason */}
        <Textarea
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you transferring this record?"
        />
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleTransfer} disabled={!toUserId || loading}>
          {loading ? "Transferring..." : "Transfer"}
        </Button>
      </div>
    </Modal>
  );
}
