import { useRef, useState } from "react";
import { Input } from "antd";
import type { InputRef } from "antd";
import type { ChangeEvent, KeyboardEvent } from "react";

interface OTPInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}

const EMPTY_DIGITS = ["", "", "", "", "", ""];

export const OTPInput = ({ value, onChange, onSubmit }: OTPInputProps) => {
  const [internalDigits, setInternalDigits] = useState(EMPTY_DIGITS);
  const inputRefs = useRef<Array<InputRef | null>>([]);
  const digits =
    value === undefined
      ? internalDigits
      : Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  const emitDigits = (nextDigits: string[]) => {
    if (value === undefined) setInternalDigits(nextDigits);
    onChange?.(nextDigits.join(""));
  };

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const characters = event.target.value.replace(/\D/g, "").slice(0, 6);
    const nextDigits = [...digits];

    if (!characters) {
      nextDigits[index] = "";
      emitDigits(nextDigits);
      return;
    }

    characters.split("").forEach((character, offset) => {
      if (index + offset < 6) nextDigits[index + offset] = character;
    });
    emitDigits(nextDigits);

    if (characters.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (characters.length > 1) {
      const nextEmpty = nextDigits.findIndex((digit) => !digit);
      if (nextEmpty >= 0) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[5]?.focus();
        if (nextDigits.join("").length === 6) {
          window.setTimeout(() => onSubmit?.(), 50);
        }
      }
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "Enter" && digits.join("").length === 6) {
      onSubmit?.();
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(input) => {
            inputRefs.current[index] = input;
          }}
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          maxLength={6}
          style={{
            width: 45,
            height: 55,
            textAlign: "center",
            fontSize: 24,
            fontWeight: 600,
            borderRadius: 8,
          }}
          autoComplete="off"
        />
      ))}
    </div>
  );
};
