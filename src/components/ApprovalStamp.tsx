import React from "react";

interface ApprovalStampProps {
  /** Increment to thunk a fresh stamp; 0 means "never stamped". */
  stampKey: number;
  enabled: boolean;
}

/** A rubber "APPROVED" stamp that thunks onto the preview, then fades away. */
export const ApprovalStamp: React.FC<ApprovalStampProps> = ({ stampKey, enabled }) => {
  if (!enabled || stampKey === 0) return null;
  return (
    <div key={stampKey} aria-hidden className="approval-stamp">
      <span className="approval-stamp-ink">APPROVED</span>
    </div>
  );
};
