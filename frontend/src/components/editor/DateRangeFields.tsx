"use client";

import { useId } from "react";
import type { YearMonth } from "@/lib/resume/types";
import { TextField } from "./fields";

interface DateRangeFieldsProps {
  start: YearMonth | null;
  end: YearMonth | null;
  onChange: (range: { startDate: YearMonth; endDate: YearMonth | null }) => void;
  /** Label for the "ongoing" checkbox, e.g. "I currently work here". */
  ongoingLabel: string;
}

export function DateRangeFields({ start, end, onChange, ongoingLabel }: DateRangeFieldsProps) {
  const checkboxId = useId();
  const ongoing = end === null;
  const startDate = start ?? "";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="Start"
        type="month"
        value={startDate}
        onChange={(value) => onChange({ startDate: value, endDate: end })}
      />
      <TextField
        label="End"
        type="month"
        value={end ?? ""}
        disabled={ongoing}
        onChange={(value) => onChange({ startDate, endDate: value })}
      />
      <div className="flex items-center gap-2 sm:col-span-2">
        <input
          id={checkboxId}
          type="checkbox"
          checked={ongoing}
          onChange={(event) => onChange({ startDate, endDate: event.target.checked ? null : "" })}
          className="size-4 accent-ink"
        />
        <label htmlFor={checkboxId} className="text-sm text-ink">
          {ongoingLabel}
        </label>
      </div>
    </div>
  );
}
