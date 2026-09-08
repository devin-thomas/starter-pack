import { useId, useRef, useState } from "react";
import { Icon } from "./Icons";

export function CopyText({
  text,
  label,
  buttonLabel = "Copy prompt",
  copiedLabel = "Prompt copied",
  instruction = "Paste into your agent, then send.",
  alwaysVisible = false,
  download,
}: {
  text: string;
  label: string;
  buttonLabel?: string;
  copiedLabel?: string;
  instruction?: string;
  alwaysVisible?: boolean;
  download?: string;
}) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      // Start the write in the tap handler: Safari requires user activation.
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      if (disclosure.current) disclosure.current.open = true;
      setStatus("failed");
      field.current?.focus();
      field.current?.select();
    }
  }

  const selectableText = (
    <div className="copy-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        ref={field}
        readOnly
        value={text}
        rows={alwaysVisible ? 3 : 9}
        spellCheck={false}
        autoCapitalize="off"
        aria-describedby={`${id}-help`}
      />
      <div className="manual-copy-actions">
        <button
          type="button"
          className="text-link"
          onClick={() => {
            field.current?.focus();
            field.current?.select();
            field.current?.setSelectionRange(0, text.length);
          }}
        >
          Select all
        </button>
        {download && (
          <a className="text-link" href={download} download>
            Download prompt (.txt)
          </a>
        )}
      </div>
      <p id={`${id}-help`} className={alwaysVisible ? "sr-only" : "muted"}>
        On iPhone, touch and hold the text, then choose Copy. Use Select All if
        needed.
      </p>
    </div>
  );

  return (
    <div className={`copy-text${alwaysVisible ? " copy-address" : ""}`}>
      {alwaysVisible && selectableText}
      <div className="prompt-controls">
        <button
          type="button"
          className={alwaysVisible ? "secondary-action" : "primary-action"}
          onClick={copy}
          aria-label={alwaysVisible ? `${buttonLabel}: ${label}` : undefined}
        >
          <Icon name={status === "copied" ? "check" : "clipboard"} size={17} />
          {status === "copied" ? copiedLabel : buttonLabel}
        </button>
        {instruction && <span>{instruction}</span>}
      </div>
      <div className="copy-status" role="status" aria-live="polite">
        {status === "copied" && `${copiedLabel}. ${instruction}`}
        {status === "failed" &&
          "Copy did not work. Select the text and copy it using your device's menu."}
      </div>
      {!alwaysVisible && (
        <details className="copy-disclosure" ref={disclosure}>
          <summary>Read or select the full prompt</summary>
          {selectableText}
        </details>
      )}
    </div>
  );
}
