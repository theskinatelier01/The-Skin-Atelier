"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * CSV export.
 *
 * Generated in the browser from data the page already holds, so exporting costs
 * no extra round trip and no server memory. Values are escaped per RFC 4180,
 * and a leading `=`, `+`, `-` or `@` is prefixed with a quote so a spreadsheet
 * does not interpret a patient name or note as a formula.
 */
export function ExportButton<T extends Record<string, unknown>>({
  filename,
  rows,
  disabled,
}: {
  filename: string;
  rows: T[];
  disabled?: boolean;
}) {
  const [done, setDone] = useState(false);

  function toCsvValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    let text = String(value);

    // Formula injection guard.
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

    if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }

  function download() {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => toCsvValue(row[header])).join(",")),
    ];

    // The BOM makes Excel read the file as UTF-8 rather than the system codepage.
    const blob = new Blob([`﻿${lines.join("\r\n")}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setDone(true);
    window.setTimeout(() => setDone(false), 2500);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={download}
      disabled={disabled || rows.length === 0}
      icon={<Download />}
    >
      {done ? "Downloaded" : "Export CSV"}
    </Button>
  );
}
