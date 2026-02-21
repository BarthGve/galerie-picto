import { Helmet } from "react-helmet-async";

const SITE_NAME = "La Boite à Pictos";
const BASE_URL = "https://laboiteapictos.fr";
const DEFAULT_DESCRIPTION =
  "Bibliothèque de pictogrammes SVG libres et personnalisables. Recherchez, personnalisez les couleurs et téléchargez en SVG ou PNG.";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

interface SEOHeadProps {
  title?: string;
  description?: string;
  path?: string;
}

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
}: SEOHeadProps) {
  const fullTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Pictogrammes SVG libres et personnalisables`;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={OG_IMAGE} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
