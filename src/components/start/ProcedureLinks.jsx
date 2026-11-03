import Link from "next/link";
import { t } from "../../content.js";
import { pagePath } from "../../lib/seo/site.js";

/**
 * "Procedimentos" at the bottom of the start page: a discreet list of the service pages (content.json ->
 * pages.list), so every one of them is linked from the start page and never orphaned. Nothing while the list is empty.
 */
export function ProcedureLinks({ pages = [] }) {
  if (pages.length === 0) return null;
  return (
    <nav className="procedure-links" aria-labelledby="procedure-links">
      <h2 id="procedure-links">{t("start.procedures")}</h2>
      <ul>
        {pages.map((page) => (
          <li key={page.slug}>
            <Link href={pagePath(page)}>{page.h1}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
