import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // The PDF routes read the self-hosted Arabic font from assets/fonts/*.woff2
  // via a dynamically-built fs path, which Next's automatic output file
  // tracing can miss. Without this, the font files can be silently absent
  // from the deployed serverless function and PDFs would fail (or render
  // Arabic text as empty boxes) in production.
  outputFileTracingIncludes: {
    "/*": ["./assets/fonts/**/*"],
  },
};

export default withNextIntl(nextConfig);
