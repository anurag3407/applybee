"use client";

import { IconDownload } from "@/components/svg/icons";
import { Button } from "@/components/ui/primitives";

/**
 * Download a previously uploaded resume. The link is a normal authenticated
 * same-origin request: authorization comes from the session cookie plus an
 * ownership check server-side, so nothing is publicly linkable.
 */
export function DownloadResumeButton({
  resumeId,
  filename,
  disabled = false,
}: {
  resumeId: string;
  filename: string;
  disabled?: boolean;
}) {
  return (
    <a
      href={`/api/v1/resumes/${resumeId}/download`}
      download={filename}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
      className={disabled ? "pointer-events-none opacity-50" : undefined}
    >
      <Button size="sm" variant="secondary" disabled={disabled}>
        <IconDownload size={14} aria-hidden /> Download
      </Button>
    </a>
  );
}