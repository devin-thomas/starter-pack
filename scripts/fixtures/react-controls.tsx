import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { CopyText } from "../../src/CopyText";
import { Feedback } from "../../src/Feedback";

type Settlement = "resolve" | "reject";
type CopyWrite = {
  readonly text: string;
  readonly startedInClick: boolean;
  readonly resolve: () => void;
  readonly reject: (cause: Error) => void;
};
type FeedbackRequest = {
  readonly body: string;
  readonly signal: AbortSignal;
  readonly resolve: (response: Response) => void;
  readonly reject: (cause: Error) => void;
};
type CopySnapshot = {
  readonly text: string;
  readonly startedInClick: boolean;
};
type FeedbackSnapshot = {
  readonly body: string;
  readonly aborted: boolean;
};
type ControlsTest = {
  readonly renderCopy: (text: string) => void;
  readonly renderFeedback: () => void;
  readonly clear: () => void;
  readonly copies: () => readonly CopySnapshot[];
  readonly requests: () => readonly FeedbackSnapshot[];
  readonly settleCopy: (index: number, settlement: Settlement) => Promise<void>;
  readonly settleFeedback: (index: number, settlement: Settlement) => Promise<void>;
  readonly unhandled: () => readonly string[];
};

declare global {
  interface Window {
    controlsTest: ControlsTest;
  }
}

let copies: CopyWrite[] = [];
let requests: FeedbackRequest[] = [];
let unhandled: string[] = [];
let isDispatchingClick: boolean = false;
document.addEventListener("click", (): void => { isDispatchingClick = true; }, true);
document.addEventListener("click", (): void => { isDispatchingClick = false; });
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent): void => {
  const cause: unknown = event.reason;
  unhandled.push(cause instanceof Error ? cause.message : String(cause));
});

Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: {
    writeText(text: string): Promise<void> {
      return new Promise<void>((resolve: () => void, reject: (cause: Error) => void): void => {
        copies.push({ text, startedInClick: isDispatchingClick, resolve, reject });
      });
    },
  },
});

window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (input !== "/api/feedback" || init?.method !== "POST" || typeof init.body !== "string" || !(init.signal instanceof AbortSignal)) {
    throw new Error("The fixture only accepts synthetic feedback POST requests.");
  }
  const body: string = init.body;
  let signal: AbortSignal = init.signal;
  return new Promise<Response>((resolve: (response: Response) => void, reject: (cause: Error) => void): void => {
    // Deliberately settle after cancellation to exercise stale-completion guards.
    requests.push({ body, signal, resolve, reject });
  });
};

let container: HTMLElement | null = document.getElementById("root");
if (container === null) throw new Error("Missing fixture root.");
let root: Root = createRoot(container);

async function settleReact(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    window.setTimeout(resolve, 0);
  });
  flushSync((): void => {});
}

window.controlsTest = {
  renderCopy(text: string): void {
    flushSync((): void => { root.render(<CopyText text={text} label="Synthetic prompt" />); });
  },
  renderFeedback(): void {
    flushSync((): void => { root.render(<Feedback />); });
  },
  clear(): void {
    flushSync((): void => { root.render(null); });
  },
  copies: (): readonly CopySnapshot[] => copies.map((copy: CopyWrite): CopySnapshot => ({ text: copy.text, startedInClick: copy.startedInClick })),
  requests: (): readonly FeedbackSnapshot[] => requests.map((request: FeedbackRequest): FeedbackSnapshot => ({ body: request.body, aborted: request.signal.aborted })),
  async settleCopy(index: number, settlement: Settlement): Promise<void> {
    let copy: CopyWrite | undefined = copies[index];
    if (copy === undefined) throw new Error("Missing synthetic clipboard operation.");
    if (settlement === "resolve") copy.resolve();
    else copy.reject(new Error("Synthetic clipboard denial."));
    await settleReact();
  },
  async settleFeedback(index: number, settlement: Settlement): Promise<void> {
    let request: FeedbackRequest | undefined = requests[index];
    if (request === undefined) throw new Error("Missing synthetic feedback operation.");
    if (settlement === "resolve") request.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    else request.reject(new Error("Synthetic delivery failure."));
    await settleReact();
  },
  unhandled: (): readonly string[] => [...unhandled],
};
