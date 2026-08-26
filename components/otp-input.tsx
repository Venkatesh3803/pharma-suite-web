"use client";

import React, { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

const boxBase =
  "w-11 h-12 text-center bg-[var(--paper)] border border-[var(--line)] rounded-none text-[18px] [font-family:var(--font-mono)] text-[var(--ink)] placeholder:text-[var(--ink)]/30 focus:outline-none focus:border-[var(--teal-mid)] focus:ring-2 focus:ring-[var(--teal-mid)]/15 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";

export default function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  disabled = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    const el = refs.current[clamped];
    el?.focus();
    el?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    if (index < value.length) {
      onChange(value.slice(0, index) + digit + value.slice(index + 1));
    } else if (index === value.length) {
      onChange(value + digit);
    } else {
      return;
    }
    focusIndex(Math.min(index + 1, length - 1));
  };

  const handleFocus = (index: number) => {
    if (index > value.length) focusIndex(value.length);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusIndex(index - 1);
      }
    } else if (e.key === "Delete") {
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .split("");
    if (digits.length === 0) return;
    const filled = (value + " ".repeat(length)).slice(0, length).split("");
    digits.slice(0, length - index).forEach((d, i) => {
      filled[index + i] = d;
    });
    onChange(filled.join("").trimEnd());
    focusIndex(index + digits.length);
  };

  return (
    <div className="flex gap-2" role="group" aria-label="One-time code">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={el => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          autoFocus={autoFocus && i === 0}
          value={value[i] ?? ""}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onFocus={() => handleFocus(i)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={e => handlePaste(e, i)}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={boxBase}
        />
      ))}
    </div>
  );
}
