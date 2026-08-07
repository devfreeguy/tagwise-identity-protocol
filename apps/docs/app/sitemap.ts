import type { MetadataRoute } from "next";

const BASE_URL = "https://docs.tagwise.me";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Docs root ──────────────────────────────────────────────
    {
      url: `${BASE_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/docs/quickstart`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },

    // ── Concepts ───────────────────────────────────────────────
    {
      url: `${BASE_URL}/docs/concepts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/docs/concepts/architecture`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/concepts/source-of-truth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/concepts/pdas-and-accounts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/concepts/tag-rules-and-moderation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/concepts/security-and-auth`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },

    // ── Integration Guides ─────────────────────────────────────
    {
      url: `${BASE_URL}/docs/integration-guides`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/docs/integration-guides/registering-a-tag`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/integration-guides/managing-profiles-and-wallets`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/integration-guides/wallet-authentication`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/integration-guides/direct-on-chain-resolution`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/integration-guides/payment-links-and-qr`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },

    // ── SDK Reference ──────────────────────────────────────────
    {
      url: `${BASE_URL}/docs/sdk-reference`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/docs/sdk-reference/tip-client`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/sdk-reference/on-chain-resolution`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/sdk-reference/tag-utilities`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/sdk-reference/types-and-models`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/sdk-reference/errors-and-exceptions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },

    // ── API Reference ──────────────────────────────────────────
    {
      url: `${BASE_URL}/docs/api-reference`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_resolve`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_identity`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_availability`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_search`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_qr`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_paymentLink`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_updateIdentity`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/docs/api-reference/TagsController_updateWallet`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/docs/api-reference/RegisterController_register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs/api-reference/AuthController_challenge`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/docs/api-reference/AuthController_verify`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/docs/api-reference/AuthController_me`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/docs/api-reference/HealthController_check`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
