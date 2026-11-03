import "../styles/theme.css";
import "../styles/style.css";
import { ClientProviders } from "../components/ClientProviders.jsx";
import { JsonLd } from "../components/JsonLd.jsx";
import { rootMetadata } from "../lib/seo/metadata.js";
import { siteContent } from "../lib/seo/site.js";
import { structuredData } from "../lib/seo/structured-data.js";
import { fontVariables } from "../styles/fonts.js";

export const metadata = rootMetadata();

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

/** Every page: Portuguese, the two fonts, the site-wide structured data (doctor, units, website) and the providers. */
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={fontVariables}>
      <body>
        <JsonLd data={structuredData(siteContent())} />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
