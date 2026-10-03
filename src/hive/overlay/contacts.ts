import { setupHexButton, type Tip } from "./hexbtn";

/** The address ships reversed in a data attribute, so naive scrapers reading the HTML find no `user@domain` pattern. */
export function assembleEmail(reversed: string): string {
  return [...reversed].reverse().join("");
}

const COPIED_MS = 1600;

/** Contact hexes with live wire borders; the email hex copies the address and says so in its tooltip. */
export function setupContacts(root: HTMLElement, electric: () => boolean, tip: Tip): void {
  for (const el of root.querySelectorAll<HTMLElement>(".hexbtn")) {
    const reveal = setupHexButton(el, "right", electric, tip);
    const reversed = el.dataset["email"];
    if (!reversed) continue;
    const email = assembleEmail(reversed);
    const idle = el.dataset["tip"] ?? "Copy email";
    el.setAttribute("aria-label", `Copy email address ${email}`);
    el.addEventListener("click", () => {
      const done = (msg: string) => {
        el.dataset["tip"] = msg;
        reveal();
        setTimeout(() => {
          el.dataset["tip"] = idle;
          if (el.matches(":hover, :focus-visible")) reveal();
        }, COPIED_MS);
      };
      if (!navigator.clipboard) {
        done(email);
        return;
      }
      navigator.clipboard.writeText(email).then(
        () => done("Copied"),
        () => done(email),
      );
    });
  }
}
