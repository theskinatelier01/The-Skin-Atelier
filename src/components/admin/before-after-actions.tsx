"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EyeOff, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { Input, Textarea } from "@/components/ui/form";
import { publishBeforeAfterCase, unpublishBeforeAfterCase } from "@/server/actions/cms";

/**
 * Publish and unpublish controls for a before/after case.
 *
 * Publishing asks for the two public image URLs explicitly. The originals stay
 * in the private patient bucket and are never exposed — publication creates a
 * separate, public copy, so unpublishing genuinely removes what the world can
 * reach rather than merely hiding a link to it.
 */
export function BeforeAfterCaseActions({
  caseId,
  publishable,
  isPublished,
  serviceName,
}: {
  caseId: string;
  publishable: boolean;
  isPublished: boolean;
  serviceName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [publishOpen, setPublishOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [reason, setReason] = useState("");

  function publish() {
    setError(null);
    startTransition(async () => {
      const result = await publishBeforeAfterCase(caseId, beforeUrl, afterUrl);
      if (result.ok) {
        setPublishOpen(false);
        router.refresh();
      } else {
        setError(result.message ?? "The case could not be published.");
      }
    });
  }

  function unpublish() {
    setError(null);
    startTransition(async () => {
      const result = await unpublishBeforeAfterCase(caseId, reason);
      if (result.ok) {
        setUnpublishOpen(false);
        router.refresh();
      } else {
        setError(result.message ?? "The case could not be unpublished.");
      }
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      {isPublished ? (
        <Button variant="outline" size="sm" icon={<EyeOff />} onClick={() => setUnpublishOpen(true)}>
          Unpublish
        </Button>
      ) : (
        <Button
          size="sm"
          icon={<Upload />}
          disabled={!publishable}
          onClick={() => setPublishOpen(true)}
          title={publishable ? undefined : "Written consent must be recorded first"}
        >
          Publish
        </Button>
      )}

      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish this case"
        description={`${serviceName} — this will appear publicly on the results page.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPublishOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={publish} loading={pending} disabled={!beforeUrl || !afterUrl}>
              Publish to the website
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}

          <p className="rounded-sm border border-champagne-300 bg-ivory-300 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
            Upload cropped, de-identified copies to the public media library first, then paste their
            URLs here. Do not publish an image showing a face, a tattoo or anything else
            identifying unless the patient has consented to exactly that.
          </p>

          <Input
            label="Public before image URL"
            required
            value={beforeUrl}
            onChange={(e) => setBeforeUrl(e.target.value)}
            placeholder="https://…"
          />
          <Input
            label="Public after image URL"
            required
            value={afterUrl}
            onChange={(e) => setAfterUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </Modal>

      <Modal
        open={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        title="Remove from the website"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUnpublishOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={unpublish} loading={pending} disabled={!reason.trim()}>
              Unpublish
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-sm bg-danger-bg px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
          <Textarea
            label="Reason"
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            hint="For example: consent withdrawn by the patient"
          />
          <p className="text-xs leading-relaxed text-ink-subtle">
            The public image copies are cleared immediately. If consent has been withdrawn, also set
            the consent status to Withdrawn on the case so it cannot be republished by mistake.
          </p>
        </div>
      </Modal>
    </div>
  );
}
