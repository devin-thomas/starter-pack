import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type Kind = "feedback" | "feature" | "story";
type SubmissionState = "idle" | "sending" | "success" | "error";

export function Feedback() {
  const id = useId();
  const [kind, setKind] = useState<Kind>("feedback");
  const [state, setState] = useState<SubmissionState>("idle");
  const [error, setError] = useState("");
  const status = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (state === "error" || state === "success") status.current?.focus();
  }, [state]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(event.currentTarget);
    const read = (name: string) => String(data.get(name) ?? "").trim();
    const payload = {
      kind,
      phase: read("phase"),
      name: read("name"),
      email: read("email"),
      message: read("message"),
      projectTitle: kind === "story" ? read("projectTitle") : "",
      projectUrl: kind === "story" ? read("projectUrl") : "",
      lessons: kind === "story" ? read("lessons") : "",
      allowFeature: kind === "story" && data.get("allowFeature") === "on",
      website: read("website"),
    };
    if (!payload.message || (kind === "story" && !payload.projectTitle)) {
      setError("Add a message and, for a project story, a project name before sending.");
      setState("error");
      status.current?.focus();
      return;
    }
    inFlight.current = true;
    setState("sending");
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(response.status === 429 ? "rate-limit" : "delivery");
      }
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
        throw new Error("delivery");
      }
      setState("success");
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "rate-limit"
        ? "Too many messages were sent recently. Please wait a few minutes and try again. Your text is still here."
        : "We could not confirm delivery. Your text is still here. A delayed notification may still arrive. Please try later, or email starter@devthomas.site.");
      setState("error");
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
    }
  }

  return (
    <div className="feedback-page">
      <div className="page-heading">
        <span className="eyebrow"><span className="small-rule" />GET IN TOUCH</span>
        <h1>Help shape Starter Pack.</h1>
        <p>Share feedback, suggest a feature, or tell us what you made and learned along the way.</p>
      </div>
      <p className="feedback-contact">Prefer email? Write to <a href="mailto:starter@devthomas.site">starter@devthomas.site</a>.</p>
      <div ref={status} tabIndex={-1} className={`feedback-status feedback-status--${state}`} role="status" aria-live="polite" aria-atomic="true">
        {state === "sending" && "Sending your message..."}
        {state === "error" && error}
        {state === "success" && "Thank you. Your message was sent to the Starter Pack team."}
      </div>
      {state === "success" ? (
        <button className="secondary-action" type="button" onClick={() => { setState("idle"); setKind("feedback"); }}>Send another message</button>
      ) : (
        <form className="feedback-form" method="post" action="/api/feedback" onSubmit={submit} aria-describedby={`${id}-privacy`}>
          <noscript><p className="feedback-privacy">This form needs JavaScript to send. You can email starter@devthomas.site instead.</p></noscript>
          <fieldset disabled={state === "sending"}>
            <legend className="feedback-sr-only">Your message to Starter Pack</legend>
            <div className="feedback-row">
              <label htmlFor={`${id}-kind`}>I'd like to
                <select id={`${id}-kind`} name="kind" value={kind} onChange={(event) => {
                  const value = event.target.value;
                  if (value === "feedback" || value === "feature" || value === "story") setKind(value);
                }}>
                  <option value="feedback">Give feedback</option>
                  <option value="feature">Request a feature</option>
                  <option value="story">Share a project or story</option>
                </select>
              </label>
              <label htmlFor={`${id}-phase`}>Which part of the process?
                <select id={`${id}-phase`} name="phase" defaultValue="general">
                  <option value="general">General / more than one phase</option>
                  <option value="1">Phase 1</option>
                  <option value="2">Phase 2</option>
                  <option value="3">Phase 3</option>
                </select>
              </label>
            </div>
            {kind === "story" && (
              <div className="feedback-story">
                <label htmlFor={`${id}-project`}>Project name (required)
                  <input id={`${id}-project`} name="projectTitle" required maxLength={160} autoComplete="off" />
                </label>
                <label htmlFor={`${id}-url`}>Project link (optional)
                  <input id={`${id}-url`} name="projectUrl" type="url" pattern="https?://.+" maxLength={2000} placeholder="https://..." aria-describedby={`${id}-url-help`} />
                </label>
                <p id={`${id}-url-help`} className="feedback-help">A public website, repository, or demo. Use an http:// or https:// link that you are comfortable sharing.</p>
              </div>
            )}
            <label htmlFor={`${id}-message`}>{kind === "story" ? "Tell us your story (required)" : kind === "feature" ? "What would you like to see? (required)" : "Your feedback (required)"}
              <textarea id={`${id}-message`} name="message" required maxLength={6000} rows={6} aria-describedby={`${id}-message-help`} />
            </label>
            <p id={`${id}-message-help`} className="feedback-help">{kind === "story" ? "What did you make, who is it for, and how did the process help?" : kind === "feature" ? "What are you trying to do, and what would make it easier?" : "What worked well, or where did you get stuck? Include the page or step if you can."} Up to 6,000 characters.</p>
            {kind === "story" && (
              <label htmlFor={`${id}-lessons`}>What did you learn? (optional)
                <textarea id={`${id}-lessons`} name="lessons" maxLength={4000} rows={4} placeholder="A surprise, a challenge you overcame, or advice for the next person." />
              </label>
            )}
            <div className="feedback-row">
              <label htmlFor={`${id}-name`}>Name (optional)
                <input id={`${id}-name`} name="name" autoComplete="name" maxLength={100} />
              </label>
              <label htmlFor={`${id}-email`}>Email for a reply (optional)
                <input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={254} />
              </label>
            </div>
            {kind === "story" && (
              <label className="feedback-consent" htmlFor={`${id}-feature`}>
                <input id={`${id}-feature`} name="allowFeature" type="checkbox" />
                <span>You may feature my submitted story, project link, and name on Starter Pack. My email will never be published. (Optional)</span>
              </label>
            )}
            <div className="feedback-trap" aria-hidden="true">
              <label htmlFor={`${id}-website`}>Leave this field empty</label>
              <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <p id={`${id}-privacy`} className="feedback-privacy">Your submission is processed by Cloudflare and Make and delivered to Devin's Gmail inbox. It stays private unless you give permission to feature your story. Nothing is published automatically. Please leave out passwords, API keys, private conversations, and progress files. <a href="/about#feedback-and-project-stories">How submissions are handled</a></p>
            <button className="primary-action" type="submit">{state === "sending" ? "Sending..." : "Send message"}</button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
