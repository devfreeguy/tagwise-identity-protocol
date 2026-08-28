---
title: Privacy Policy
description: How Tagwise Identity Protocol collects, uses, and protects personal data across our website, API, and SDK.
lastUpdated: "2026-08-28"
---

## 1. Introduction

Tagwise Identity Protocol ("TIP", "we", "us", or "our") is an open-source
protocol that maps human-readable `@tags` to Solana wallet addresses. This
Privacy Policy explains what personal information we collect, how we use it, and
your rights in relation to it.

This policy applies to:

- [tagwise.me](https://tagwise.me) and its subdomains, including
  [docs.tagwise.me](https://docs.tagwise.me)
- The TIP API at [tip.tagwise.me](https://tip.tagwise.me)
- The `@tagwise/tip-sdk` npm package

It does not apply to the Tagwise Wallet mobile application, which has its own
separate privacy documentation, or to third-party applications that integrate
TIP. Those applications are responsible for their own privacy practices.

The project is led by its founder. Inquiries may be directed to
[hello@tagwise.me](mailto:hello@tagwise.me).

---

## 2. Information We Collect

### 2.1 Information you give us directly

**Developer and general enquiries.** If you contact us via email, we collect
the email address and any information you choose to include. We use this solely
to respond to your message.

### 2.2 Information collected automatically

**Website analytics.** When you visit our website, we may collect anonymised
usage data such as pages visited, time on page, browser type, and general
geographic region (country level only). This data does not identify you
personally. See our [Cookie Policy](/cookies) for details.

**API request logs.** When developers query the TIP API, we collect standard
server logs, including the queried `@tag`, the request timestamp, the IP
address, and the HTTP response code. These logs are used for security
monitoring, abuse prevention, and service reliability. Logs are retained for
a maximum of 90 days and then deleted automatically.

### 2.3 On-chain data

TIP is a protocol built on the Solana blockchain. The following data is stored
on-chain and is therefore public by the nature of a permissionless blockchain:

- Your `@tag`
- The Solana wallet address your tag resolves to
- The owner public key
- The tag registration transaction signature and timestamp

**We do not control on-chain data.** We cannot delete, modify, or restrict
access to data that has been written to the Solana blockchain. By registering
a `@tag`, you acknowledge that the tag and its associated wallet address will
be permanently and publicly visible on-chain.

### 2.4 Off-chain identity data

When a `@tag` is registered, the following optional profile data may be stored
in our off-chain mirror database:

- Display name
- A URL pointing to your avatar image (we store the link only, not the image
  itself)
- Bio
- Preferred payment token
- Verification status and merchant status (set by the protocol, not by you)

You may update or delete off-chain profile data at any time through any
TIP-compatible application. Deleting off-chain profile data does not affect
your on-chain registration.

### 2.5 What we do not collect

We do not collect, store, or process:

- Private keys or seed phrases (ever, under any circumstances)
- Payment amounts or transaction contents (this data lives on-chain and is
  not routed through our systems)
- Device identifiers from API consumers
- Any biometric data

---

## 3. How We Use Your Information

| Data | Purpose | Legal basis |
|------|---------|-------------|
| Contact email | Respond to your enquiry | Legitimate interests |
| API request logs | Security monitoring, abuse prevention, service reliability | Legitimate interests |
| Analytics data | Understand how the site is used and improve it | Legitimate interests (anonymised) |
| Off-chain profile data | Serve identity resolution responses via the TIP API | Performance of the protocol service you requested |

We do not sell, rent, or trade your personal information with third parties for
their own marketing purposes.

---

## 4. Data Processors and Third Parties

We share data with the following third-party processors where necessary to
operate the service:

| Processor | Purpose | Data shared | Privacy reference |
|-----------|---------|-------------|-------------------|
| Helius | Solana RPC and blockchain data indexing | `@tag`, wallet address, on-chain events (all of which are already public on-chain) | [helius.dev/privacy](https://helius.dev/privacy) |
| Hosting provider | Database and server infrastructure for the TIP mirror and API | API logs, off-chain profile data | Provider's data processing agreement |

We do not use advertising networks, data brokers, or social media trackers.

---

## 5. International Data Transfers

TIP is a global protocol and our infrastructure may process data in multiple
regions. Where data is transferred outside your country of residence, we ensure
appropriate safeguards are in place, including reliance on standard contractual
clauses where required by applicable law.

---

## 6. Data Retention

| Data | Retention period |
|------|-----------------|
| Contact email correspondence | Until the matter is resolved, then deleted within 12 months |
| API request logs | 90 days, then automatically deleted |
| Off-chain profile data | Until you request deletion, or until the protocol is discontinued |
| Analytics data | 13 months (anonymised, no personal identifiers) |

On-chain data is retained permanently by the Solana blockchain and is outside
our control.

---

## 7. Security

We take reasonable technical and organisational measures to protect your data,
including:

- Encryption in transit (TLS) for all API and website traffic
- Database access restricted to authorised infrastructure only
- No storage of private keys or seed phrases anywhere in our systems
- Regular review of access controls

No method of transmission or storage is completely secure. If you discover a
security vulnerability, please report it responsibly via our
[Security Policy](/security) rather than through a public channel.

---

## 8. Your Rights

Depending on your location, you may have the following rights regarding your
personal data:

- **Access:** request a copy of the personal data we hold about you
- **Correction:** request that inaccurate data be corrected
- **Deletion:** request that we delete your personal data where we have no
  legal obligation to retain it
- **Objection:** object to processing based on legitimate interests
- **Portability:** request your data in a portable format
- **Withdrawal of consent:** where processing is based on consent, withdraw it
  at any time without affecting the lawfulness of prior processing

To exercise any of these rights, contact us at
[hello@tagwise.me](mailto:hello@tagwise.me). We will respond within 30 days.

Note that rights over on-chain data (your `@tag` and its associated wallet
address) cannot be fulfilled by us, as that data is stored on a public,
permissionless blockchain outside our control.

---

## 9. Children

TIP is not directed at persons under the age of 18. We do not knowingly collect
personal information from anyone under 18. If you believe we have inadvertently
collected such information, please contact us at
[hello@tagwise.me](mailto:hello@tagwise.me) and we will delete it promptly.

---

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. When we do, we will update
the "Last updated" date at the top of this page. Where changes are material, we
will announce them via our [X account](https://x.com/tagwiseme).

We encourage you to review this page periodically.

---

## 11. Contact

For privacy-related questions or to exercise your rights, contact us at:

**Email:** [hello@tagwise.me](mailto:hello@tagwise.me)
**X:** [@tagwiseme](https://x.com/tagwiseme)

For security vulnerabilities, please use our
[responsible disclosure process](/security) instead of emailing directly.

---

*This policy applies to the Tagwise Identity Protocol and its associated
websites and API. It does not apply to third-party applications built on TIP,
or to the Tagwise Wallet mobile application.*
