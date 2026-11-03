import Link from "next/link";
import { procedures } from "../../content.js";
import { pagePath } from "../../lib/seo/site.js";

/** "Harmonização facial em Maringá": the item's own line, or its name with the city. */
const where = (item) => item.where ?? procedures.where.replace("{name}", item.name).replace("{city}", procedures.city);

/**
 * "Procedimentos" on the start page (content.json -> procedures): closed at first, with one section per procedure that
 * opens on its own. The title shows only the name; inside, the first line names it with the city ("Harmonização
 * facial em Maringá"), visibly, then the text. Native <details>, so it is in the HTML and works without JavaScript.
 * `pages`: the service pages (pages.list); a procedure whose `page` is one of them links to it.
 */
export function Procedures({ pages = [] }) {
  if (procedures.list.length === 0) return null;
  const published = new Set(pages.map((page) => page.slug));
  return (
    <section className="procedures" aria-labelledby="procedures-title">
      <details>
        <summary>
          <h2 id="procedures-title">{procedures.title}</h2>
        </summary>
        <div className="procedure-list">
          {procedures.list.map((item) => (
            <details key={item.id} className="procedure">
              <summary>
                <h3>{item.name}</h3>
              </summary>
              <p className="procedure-where">{where(item)}</p>
              <p>{item.text}</p>
              {published.has(item.page) && (
                <Link className="procedure-more" href={pagePath({ slug: item.page })}>
                  {procedures.more}
                </Link>
              )}
            </details>
          ))}
        </div>
      </details>
    </section>
  );
}
