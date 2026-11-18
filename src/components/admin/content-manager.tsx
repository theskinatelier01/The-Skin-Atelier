"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/form";
import { ConfirmDialog, Modal } from "@/components/ui/overlay";
import { ImageField } from "@/components/admin/image-field";
import { KINDS, getPath, type ContentKind, type FieldDef } from "@/lib/cms/content-kinds";
import { deleteContent, saveContent } from "@/server/actions/content";
import { slugify } from "@/lib/utils/format";
import type { ActionResult } from "@/lib/action-result";

type Item = Record<string, unknown> & { id: string };

/**
 * List + editor for one website collection. Saving publishes straight to the
 * live site; the server action revalidates every public page.
 */
export function ContentManager({
  kind,
  items,
  canWrite,
}: {
  kind: ContentKind;
  items: Item[];
  canWrite: boolean;
}) {
  const def = KINDS[kind];
  const router = useRouter();
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function isLive(item: Item) {
    if (def.liveField) return Boolean(item[def.liveField]);
    return item.status === "published" || item.status === "scheduled";
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteContent(kind, target.id);
      setDeleting(null);
      setNotice({ ok: result.ok, text: result.message ?? (result.ok ? "Deleted." : "It could not be deleted.") });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-5 py-3">
        <p className="text-xs text-ink-subtle">
          {items.length} {items.length === 1 ? def.singular : def.label.toLowerCase()} · changes go live as soon as
          you save
        </p>
        {canWrite && (
          <Button size="sm" icon={<Plus />} onClick={() => setEditing("new")}>
            Add {def.singular}
          </Button>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className={
            notice.ok
              ? "border-b border-line-subtle bg-success-bg px-5 py-2.5 text-sm text-success"
              : "border-b border-line-subtle bg-danger-bg px-5 py-2.5 text-sm text-danger"
          }
        >
          {notice.text}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon />}
          title={`No ${def.label.toLowerCase()} yet`}
          description={canWrite ? `Use “Add ${def.singular}” to create the first one.` : undefined}
        />
      ) : (
        <ul className="divide-y divide-line-subtle">
          {items.map((item) => {
            const image = def.imageField ? (getPath(item, def.imageField) as string | undefined) : undefined;
            const live = isLive(item);
            const title = String(getPath(item, def.titleField) ?? "Untitled");
            return (
              <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                {def.imageField && (
                  <div className="size-14 shrink-0 overflow-hidden rounded-sm border border-line-subtle bg-canvas-sunken">
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" loading="lazy" className="size-full object-cover" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-subtle">{def.subtitle(item)}</p>
                </div>
                <Badge tone={live ? "success" : "neutral"} dot>
                  {live ? "Live" : "Hidden"}
                </Badge>
                <a
                  href={def.publicPath(item)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View ${title} on the website`}
                  className="hidden text-ink-subtle transition-colors hover:text-ink sm:inline-flex"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
                {canWrite && (
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="outline" icon={<Pencil />} onClick={() => setEditing(item)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${title}`}
                      onClick={() => setDeleting(item)}
                      className="px-2"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <EditorModal
          kind={kind}
          item={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ ok: true, text: message });
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={`Delete this ${def.singular}?`}
        message="It is removed from the website straight away. This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={pending}
      />
    </div>
  );
}

function EditorModal({
  kind,
  item,
  onClose,
  onSaved,
}: {
  kind: ContentKind;
  item?: Item;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const def = KINDS[kind];
  const action = useMemo(() => saveContent.bind(null, kind), [kind]);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);

  // URL fields follow their source field until the editor types in them.
  const slugField = def.fields.find((f) => f.slugFrom);
  const [source, setSource] = useState(String(getPath(item, slugField?.slugFrom ?? "") ?? ""));
  const [slug, setSlug] = useState(String(item?.slug ?? ""));
  const [slugTouched, setSlugTouched] = useState(Boolean(item?.slug));
  const slugValue = slugTouched ? slug : slugify(source);

  useEffect(() => {
    if (state?.ok) onSaved(state.message ?? "Saved.");
  }, [state, onSaved]);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={item ? `Edit ${def.singular}` : `Add ${def.singular}`}
      description="Saving publishes the change to the website."
    >
      <form action={formAction} className="grid gap-5 sm:grid-cols-2" noValidate>
        {item && <input type="hidden" name="id" value={item.id} />}

        {state && !state.ok && (
          <div
            role="alert"
            className="rounded-sm border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger sm:col-span-2"
          >
            {state.message ?? "Some fields need attention."}
          </div>
        )}

        {def.fields.map((field) => {
          const error = state?.errors?.[field.name];
          if (slugField && field.name === "slug") {
            return (
              <Input
                key={field.name}
                name="slug"
                label={field.label}
                required={field.required}
                value={slugValue}
                leading={field.leading}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                hint={item ? "Changing this breaks existing links and search rankings" : field.hint}
                error={error}
              />
            );
          }
          return (
            <FieldInput
              key={field.name}
              field={field}
              value={item ? getPath(item, field.name) : field.defaultValue}
              error={error}
              onTextChange={field.name === slugField?.slugFrom ? setSource : undefined}
            />
          );
        })}

        <div className="flex justify-end gap-3 border-t border-line-subtle pt-5 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <SaveButton />
        </div>
      </form>
    </Modal>
  );
}

function formatLines(value: unknown): string {
  if (!Array.isArray(value)) return typeof value === "string" ? value : "";
  return value
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : entry && typeof entry === "object" && "serviceName" in entry
          ? `${(entry as { serviceName: string }).serviceName} | ${(entry as { sessions?: number }).sessions ?? 1}`
          : "",
    )
    .filter(Boolean)
    .join("\n");
}

/** ISO string → value for an <input type="datetime-local"> in the viewer's zone. */
function toLocalInput(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function DateTimeField({ field, value, error }: { field: FieldDef; value: unknown; error?: string }) {
  const [local, setLocal] = useState(toLocalInput(value));
  // The server runs in UTC, so the browser converts to an absolute ISO time.
  const iso = local ? new Date(local).toISOString() : "";
  return (
    <div>
      <Input
        type="datetime-local"
        label={field.label}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        hint={field.hint}
        error={error}
      />
      <input type="hidden" name={field.name} value={iso} />
    </div>
  );
}

function FieldInput({
  field,
  value,
  error,
  onTextChange,
}: {
  field: FieldDef;
  value: unknown;
  error?: string;
  onTextChange?: (text: string) => void;
}) {
  const className = field.full ? "sm:col-span-2" : undefined;
  const text = value == null ? "" : String(value);

  switch (field.type) {
    case "checkbox":
      return (
        <Checkbox
          name={field.name}
          defaultChecked={Boolean(value)}
          label={field.label}
          description={field.description}
          className={className}
        />
      );
    case "select":
      return (
        <Select
          name={field.name}
          label={field.label}
          required={field.required}
          defaultValue={text || String(field.defaultValue ?? "")}
          options={field.options ?? []}
          hint={field.hint}
          error={error}
          className={className}
        />
      );
    case "image":
      return (
        <ImageField
          name={field.name}
          label={field.label}
          defaultValue={text}
          hint={field.hint}
          error={error}
          required={field.required}
          className={className}
        />
      );
    case "textarea":
    case "lines":
      return (
        <Textarea
          name={field.name}
          label={field.label}
          required={field.required}
          rows={field.rows ?? 4}
          maxLength={field.maxLength}
          defaultValue={field.type === "lines" ? formatLines(value) : text}
          placeholder={field.placeholder}
          hint={field.hint}
          error={error}
          className={className}
        />
      );
    case "datetime":
      return <DateTimeField field={field} value={value} error={error} />;
    case "date":
      return (
        <Input
          type="date"
          name={field.name}
          label={field.label}
          defaultValue={text.slice(0, 10)}
          hint={field.hint}
          error={error}
          className={className}
        />
      );
    default:
      return (
        <Input
          type={field.type === "number" ? "number" : "text"}
          step={field.type === "number" ? "any" : undefined}
          min={field.type === "number" ? 0 : undefined}
          name={field.name}
          label={field.label}
          required={field.required}
          maxLength={field.maxLength}
          defaultValue={text}
          placeholder={field.placeholder}
          leading={field.leading}
          onChange={onTextChange ? (e) => onTextChange(e.target.value) : undefined}
          hint={field.hint}
          error={error}
          className={className}
        />
      );
  }
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Saving…" : "Save and publish"}
    </Button>
  );
}
