import type { Metadata } from "next";
import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, SITE_NAME, SITE_URL } from "./constants";

const defaultImage = "/og.svg";

const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: absoluteUrl(defaultImage) }]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl(defaultImage)]
  }
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
};

export const createPageMetadata = ({
  title,
  description,
  path,
  keywords,
  image,
  noIndex
}: PageMetadataOptions): Metadata => {
  const resolvedImage = image || defaultImage;
  const canonicalUrl = absoluteUrl(path);

  return {
    title,
    description,
    keywords: keywords || DEFAULT_KEYWORDS,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: absoluteUrl(resolvedImage) }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(resolvedImage)]
    },
    robots: noIndex
      ? {
          index: false,
          follow: false
        }
      : undefined
  };
};
