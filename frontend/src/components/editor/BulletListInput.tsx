"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AddButton, GhostButton } from "./fields";

interface BulletListInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel?: string;
  placeholder?: string;
}

/**
 * Editable list of bullet points.
 * Enter adds a bullet below; Backspace in an empty bullet removes it.
 */
export function BulletListInput({
  label,
  items,
  onChange,
  addLabel = "Add bullet",
  placeholder,
}: BulletListInputProps) {
  const groupId = useId();
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  useEffect(() => {
    if (focusIndex === null) return;
    const element = refs.current[focusIndex];
    if (element) {
      element.focus();
      element.setSelectionRange(element.value.length, element.value.length);
    }
  }, [focusIndex, items.length]);

  const update = (index: number, value: string) =>
    onChange(items.map((item, i) => (i === index ? value : item)));

  const insertAfter = (index: number) => {
    onChange([...items.slice(0, index + 1), "", ...items.slice(index + 1)]);
    setFocusIndex(index + 1);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setFocusIndex(index > 0 ? index - 1 : null);
  };

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      insertAfter(index);
    } else if (event.key === "Backspace" && items[index] === "" && items.length > 1) {
      event.preventDefault();
      remove(index);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2" aria-labelledby={`${groupId}-label`}>
      <legend id={`${groupId}-label`} className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </legend>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <span aria-hidden className="pt-2 text-ink-faint">
            •
          </span>
          <textarea
            ref={(element) => {
              refs.current[index] = element;
            }}
            rows={2}
            value={item}
            placeholder={placeholder}
            aria-label={`${label} ${index + 1}`}
            onChange={(event) => update(index, event.target.value.replace(/\n/g, " "))}
            onKeyDown={onKeyDown(index)}
            className="min-h-[2.75rem] flex-1 resize-y rounded-md border border-rule bg-panel px-3 py-2 text-[15px] leading-snug text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-ink focus:shadow-[0_0_0_3px_var(--color-marker)]"
          />
          <GhostButton label={`Remove ${label.toLowerCase()} ${index + 1}`} onClick={() => remove(index)}>
            ✕
          </GhostButton>
        </div>
      ))}
      <AddButton onClick={() => insertAfter(items.length - 1)}>{addLabel}</AddButton>
    </fieldset>
  );
}
