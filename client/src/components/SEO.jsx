import { Helmet } from "react-helmet-async";
import { getApiRoot, getSiteUrl } from "../lib/env.js";

const SITE_NAME = "Digital Bazaar";
const SITE_URL = getSiteUrl();

export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.label,
        ...(item.href ? { item: `${SITE_URL}${item.href}` } : {})
      }))
    ]
  };
}

export default function SEO({
  title,
  description,
  keywords,
  image,
  type = "website",
  url,
  price,
  currency = "USD",
  noindex = false,
  breadcrumbs = [],
  article = null,
  itemList = null
}) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const pageUrl = url || (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const defaultImg = `${SITE_URL}/favicon.svg`;
  const ogImage = image?.startsWith("http") ? image : image ? `${getApiRoot()}${image}` : defaultImg;

  const schemas = [];

  if (type === "product") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: title.replace(` | ${SITE_NAME}`, ""),
      description,
      image: ogImage,
      url: pageUrl,
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        price: price ?? 0,
        priceCurrency: currency,
        availability: "https://schema.org/InStock",
        url: pageUrl
      }
    });
  } else if (type === "article" && article) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.headline || title,
      description,
      image: ogImage,
      url: pageUrl,
      datePublished: article.publishedTime,
      dateModified: article.modifiedTime || article.publishedTime,
      author: { "@type": "Person", name: article.author || SITE_NAME },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: { "@type": "ImageObject", url: defaultImg }
      }
    });
  } else {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    });
  }

  if (breadcrumbs.length) schemas.push(buildBreadcrumbSchema(breadcrumbs));

  if (itemList?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: itemList.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: item.url,
        name: item.name
      }))
    });
  }

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />
      <meta name="author" content={SITE_NAME} />
      <meta name="theme-color" content="#7c3aed" />
      <link rel="canonical" href={pageUrl} />

      <meta property="og:type" content={type === "article" ? "article" : type === "product" ? "product" : "website"} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:locale" content="en_US" />

      {article?.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
      {article?.author && <meta property="article:author" content={article.author} />}
      {article?.tags?.map((t) => (
        <meta key={t} property="article:tag" content={t} />
      ))}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export function OrganizationSEO() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: "Premium digital products marketplace — UI kits, templates, ebooks, source code, and AI prompts."
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
