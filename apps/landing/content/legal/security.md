---
title: Security Policy
description: How to responsibly report security vulnerabilities in the Tagwise Identity Protocol, and our disclosure process.
lastUpdated: "2026-08-28"
---

## 1. Our Commitment

Tagwise Identity Protocol (TIP) is a payment identity protocol handling the
resolution of `@tags` to Solana wallet addresses. Because it sits in the
critical path of financial transactions, we take security seriously and
maintain an open, transparent relationship with security researchers.

We welcome responsible disclosure of vulnerabilities and commit to responding
promptly and without legal action against good-faith researchers.

---

## 2. Scope

The following are in scope for security research:

| Asset | Description |
|-------|-------------|
| `tip.tagwise.me` | The TIP API and identity resolution service |
| `tagwise.me` | The protocol website and waitlist |
| `docs.tagwise.me` | The documentation site |
| `programs/tip-registry` | The deployed Solana program at `4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx` |
| `@tagwise/tip-sdk` | The published npm package |
| Source code | [github.com/devfreeguy/tagwise-identity-protocol](https://github.com/devfreeguy/tagwise-identity-protocol) |

The following are **out of scope:**

- Third-party applications built on TIP (contact those developers directly)
- The Tagwise Wallet mobile application (separate disclosure process)
- Social engineering attacks against team members
- Physical attacks
- Denial-of-service attacks or volumetric testing against production systems
- Automated scanning that degrades service for other users

---

## 3. How to Report a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.** A public
issue exposes the vulnerability before it is fixed and puts users at risk.

### Preferred: GitHub Private Vulnerability Reporting

We use GitHub's built-in private vulnerability reporting, which keeps the
report confidential until a fix is released.

1. Go to the repository:
   [github.com/devfreeguy/tagwise-identity-protocol](https://github.com/devfreeguy/tagwise-identity-protocol)
2. Click the **Security** tab
3. Click **Report a vulnerability**
4. Fill in the details and submit

### Alternative: Email

If you cannot use GitHub's reporting tool, email us at:

**[security@tagwise.me](mailto:security@tagwise.me)**

Encrypt sensitive reports using our PGP key if possible. Contact us first to
request the key.

---

## 4. What to Include in Your Report

A useful report includes:

- A clear description of the vulnerability and its potential impact
- The affected component (API endpoint, SDK function, on-chain program, etc.)
- Step-by-step reproduction instructions
- Proof of concept code or a screenshot where appropriate
- Your suggested severity (critical, high, medium, low)
- Whether you have already disclosed this to anyone else

The more detail you provide, the faster we can assess and address the issue.

---

## 5. Our Response Commitments

| Milestone | Target timeframe |
|-----------|-----------------|
| Initial acknowledgement | Within 48 hours |
| Severity assessment | Within 5 business days |
| Fix or mitigation plan communicated | Within 14 days for critical/high |
| Fix deployed | As soon as practical, depending on severity |
| Public disclosure coordination | After the fix is deployed, coordinated with you |

We will keep you informed of progress throughout. If we need more time than
stated above, we will tell you why.

---

## 6. Severity Definitions

We use the following severity levels, broadly aligned with
[CVSS](https://www.first.org/cvss/):

**Critical** — Vulnerabilities that allow an attacker to redirect payments to
an arbitrary wallet, forge a tag registration, drain the protocol relayer
wallet, or compromise user funds without user interaction.

**High** — Vulnerabilities that allow authentication bypass, unauthorised
modification of off-chain identity data, or large-scale enumeration of private
user data.

**Medium** — Vulnerabilities that allow limited data exposure, denial of service
to a subset of users, or logic errors that do not directly threaten funds.

**Low** — Minor information disclosure, missing security headers, or
configuration issues with limited real-world impact.

---

## 7. Safe Harbour

We will not pursue legal action against security researchers who:

- Discover and report vulnerabilities in good faith
- Do not access, modify, or exfiltrate user data beyond what is necessary to
  demonstrate the vulnerability
- Do not perform denial-of-service attacks or disrupt service for other users
- Do not publicly disclose the vulnerability before we have had a reasonable
  opportunity to fix it (see coordinated disclosure, section 8)
- Act within the scope defined in section 2

We consider responsible security research a valuable contribution to the
protocol and the broader Solana ecosystem.

---

## 8. Coordinated Disclosure

We follow a coordinated disclosure model:

- You report privately
- We assess, fix, and deploy
- We coordinate the public disclosure timing with you
- You receive credit in the release notes unless you prefer anonymity

Our default target for coordinated public disclosure is 90 days from the
initial report, or sooner if a fix is deployed. For critical vulnerabilities
actively being exploited, we may disclose faster with shorter notice.

We will never ask you to delay disclosure indefinitely.

---

## 9. On-chain Program Security Notes

The TIP registry program is deployed on Solana devnet at:

```
4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx
```

**TIP is not yet deployed on mainnet.** Do not send real funds to any address
associated with this program ID on mainnet at this time.

The program is upgradeable. The upgrade authority is held by the founding team.
For mainnet deployment, the upgrade authority will be transferred to a hardware
wallet or multisig to reduce the risk of a single point of compromise.

Key security properties of the on-chain program:

- Tag uniqueness is enforced by the Program Derived Address (PDA). A second
  registration of the same tag fails at the runtime level.
- Ownership transfers and wallet updates require the current owner as signer.
  The server cannot forge these operations.
- The program never handles user private keys or seed phrases.

---

## 10. Known Limitations

We document known limitations transparently:

- **The naming gate runs at the API layer.** A tag registered by calling the
  on-chain program directly (bypassing the API) may bypass content moderation.
  The API mirrors such registrations and applies moderation at ingest, but there
  is a brief window between on-chain confirmation and indexer processing.
- **Ownership is read from the off-chain mirror**, which is eventually
  consistent with on-chain state. After an ownership transfer, there is a brief
  window (bounded by indexer lag) before the mirror reflects the new owner.
- **Tags are permanent.** There is no delete or expiry instruction. A tag
  cannot be reclaimed once registered.

These are known design properties, not undisclosed vulnerabilities. We list them
here so researchers can focus their efforts on issues outside our current
understanding.

---

## 11. Contact

**Security reports:** [security@tagwise.me](mailto:security@tagwise.me)
**General enquiries:** [hello@tagwise.me](mailto:hello@tagwise.me)
**GitHub:** [github.com/devfreeguy/tagwise-identity-protocol](https://github.com/devfreeguy/tagwise-identity-protocol)
**X:** [@tagwiseme](https://x.com/tagwiseme)
