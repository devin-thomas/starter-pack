import { useId, useLayoutEffect, useRef, useState } from "react";
import type { Dispatch, ReactElement, RefObject, SetStateAction } from "react";
import { Icon } from "./Icons";

type CopyTextProps = {
  readonly text: string;
  readonly label: string;
  readonly buttonLabel?: string;
  readonly copiedLabel?: string;
  readonly instruction?: string;
  readonly alwaysVisible?: boolean;
  readonly disclosureLabel?: string;
  readonly download?: string;
};

type CopyIdle = { readonly kind: "idle" };
type CopySucceeded = { readonly kind: "copied"; readonly text: string };
type CopyFailed = { readonly kind: "failed"; readonly text: string };
type CopyState = CopyIdle | CopySucceeded | CopyFailed;

export function CopyText({
  text,
  label,
  buttonLabel = "Copy prompt",
  copiedLabel = "Prompt copied",
  instruction = "Paste into your agent, then send.",
  alwaysVisible = false,
  disclosureLabel = "Read or select the full prompt",
  download,
}: CopyTextProps): ReactElement {
  const id: string = useId();
  const field: RefObject<HTMLTextAreaElement | null> =
    useRef<HTMLTextAreaElement | null>(null);
  const disclosure: RefObject<HTMLDetailsElement | null> =
    useRef<HTMLDetailsElement | null>(null);
  const activeCopy: RefObject<symbol | null> = useRef<symbol | null>(null);
  const [state, setState]: [CopyState, Dispatch<SetStateAction<CopyState>>] =
    useState<CopyState>({ kind: "idle" });
  const status: CopyState["kind"] =
    state.kind === "idle" || state.text === text ? state.kind : "idle";

  useLayoutEffect((): (() => void) => {
    // Invalidate before a completion can affect a newly committed prompt.
    return (): void => {
      activeCopy.current = null;
    };
  }, [text]);

  function copy(): void {
    void copyText().catch((cause: unknown): void => {
      console.error("Unexpected clipboard command failure.", cause);
    });
  }

  async function copyText(): Promise<void> {
    const operation: symbol = Symbol();
    activeCopy.current = operation;
    try {
      // Start the write in the tap handler: Safari requires user activation.
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      if (activeCopy.current !== operation) return;
      setState({ kind: "copied", text });
    } catch {
      if (activeCopy.current !== operation) return;
      if (disclosure.current) disclosure.current.open = true;
      setState({ kind: "failed", text });
      field.current?.focus();
      field.current?.select();
    } finally {
      if (activeCopy.current === operation) activeCopy.current = null;
    }
  }

  const selectableText: ReactElement = (
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
          onClick={(): void => {
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
          <summary>{disclosureLabel}</summary>
          {selectableText}
        </details>
      )}
    </div>
  );
}
