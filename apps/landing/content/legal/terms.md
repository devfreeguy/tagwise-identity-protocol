---
title: Terms of Service
description: Terms governing use of the Tagwise Identity Protocol website, API, SDK, and on-chain program.
lastUpdated: "2026-08-28"
---

## 1. Agreement to These Terms

By accessing or using the Tagwise Identity Protocol website at
[tagwise.me](https://tagwise.me), the documentation at
[docs.tagwise.me](https://docs.tagwise.me), the TIP API at
[tip.tagwise.me](https://tip.tagwise.me), the `@tagwise/tip-sdk` npm package,
or the TIP on-chain program, you agree to be bound by these Terms of Service
("Terms").

If you are using TIP on behalf of an organisation, you represent that you have
the authority to bind that organisation to these Terms, and "you" refers to that
organisation.

If you do not agree to these Terms, do not use TIP.

---

## 2. Who We Are

Tagwise Identity Protocol ("TIP", "we", "us", or "our") is an open-source
protocol project. For questions about these Terms, contact us at
[hello@tagwise.me](mailto:hello@tagwise.me).

---

## 3. What TIP Is

TIP is an open-source identity resolution protocol built on the Solana
blockchain. It allows users to register human-readable `@tags` that resolve to
Solana wallet addresses, and allows developers and applications to look up those
identities via the TIP API and SDK.

TIP is **not**:

- A custodial wallet or financial institution
- A payment processor
- An exchange or brokerage
- A money transmitter

TIP does not hold, move, or control any user funds. All financial transactions
occur on the Solana blockchain and are the sole responsibility of the
transacting parties.

---

## 4. Eligibility

You must be at least **18 years old** to use TIP. By using TIP you represent
and warrant that you are at least 18 years of age.

You must not use TIP if:

- You are located in a jurisdiction where use of blockchain protocols or
  cryptocurrency is prohibited
- You are subject to sanctions administered by any government or international
  body
- You are otherwise prohibited from entering into these Terms under applicable
  law

---

## 5. Your TIP Account and Tag

### 5.1 Tag registration

When you register a `@tag`, you create an on-chain record on the Solana
blockchain that maps your chosen tag to your wallet address. You are responsible
for ensuring your wallet address is correct before registering. Registrations
are permanent and cannot be deleted.

### 5.2 You own your tag

Your `@tag` is controlled by the private key of the wallet you used to register
it. We do not hold, control, or have the ability to revoke your tag. Losing
access to your wallet's private key means losing control of your tag
permanently.

### 5.3 Tag rules

Tags must conform to the following rules:

- Length: 3 to 20 characters
- Allowed characters: lowercase letters (`a-z`), digits (`0-9`), and
  underscores (`_`)
- No spaces, hyphens, or special characters
- No impersonation of other individuals, brands, or organisations

Tags that violate content standards (see section 7) may be marked inactive in
the off-chain mirror and excluded from resolution responses, even though the
on-chain registration persists.

### 5.4 No reservation

Checking tag availability does not reserve a tag. Tags are granted on a
first-come, first-served basis at the time of on-chain registration. We make no
guarantees about availability.

### 5.5 Certain tags are reserved

A set of tags is reserved for protocol use (such as `admin`, `support`,
`official`, and similar). Attempting to register a reserved tag will be rejected
at the API level. The reserved list is documented in the open-source repository.

---

## 6. Developer and API Use

### 6.1 API access

Access to the TIP API is currently provided free of charge for reasonable use.
We reserve the right to introduce rate limits, usage tiers, or authentication
requirements in the future. We will provide reasonable notice of material
changes to API access terms.

### 6.2 Permitted uses

You may use the TIP API and SDK to:

- Resolve `@tags` to wallet addresses in your application
- Register tags on behalf of users who have consented to the registration
- Build wallets, exchanges, merchant tools, or other applications that
  integrate payment identity

### 6.3 Prohibited uses

You must not use TIP to:

- Scrape or enumerate `@tags` or wallet addresses for spamming, profiling, or
  selling data
- Build tools designed to front-run, block, or interfere with other users'
  tag registrations
- Impersonate TIP, the Tagwise protocol, or any other entity
- Circumvent rate limits or abuse the API infrastructure
- Violate the acceptable use standards in section 7

### 6.4 SDK and open-source licence

The `@tagwise/tip-sdk` and the TIP source code are released under the MIT
Licence. You may use, copy, modify, and distribute the software in accordance
with that licence. A copy of the licence is available in the
[repository](https://github.com/devfreeguy/tagwise-identity-protocol/blob/main/LICENSE).

---

## 7. Acceptable Use

You must not use TIP to register tags or submit content that:

- Infringes any third-party intellectual property right, including trademarks
- Impersonates any person, organisation, or brand
- Is obscene, threatening, harassing, or discriminatory
- Facilitates fraud, scams, phishing, or other deceptive practices
- Violates any applicable law or regulation

We may mark tags or content that violate these standards as inactive in our
off-chain mirror and exclude them from resolution responses. We cannot remove
on-chain registrations.

---

## 8. Fees and Costs

### 8.1 Blockchain fees

Registering a `@tag` requires paying rent-exemption and a transaction fee on
the Solana network. These fees are paid to the Solana network, not to us. The
amount varies with network conditions and is approximately 0.002 SOL at the
time of writing. We make no representations about future fee levels.

### 8.2 Sponsored registration

We may offer to sponsor the cost of tag registration for eligible users,
covering the on-chain rent and fees. Sponsored registration is subject to
eligibility criteria, usage caps, and availability, and may be withdrawn at any
time without notice. The use of sponsored registration does not create any debt
or payment obligation between you and us.

### 8.3 API fees

Access to the TIP API is currently free. We reserve the right to introduce paid
tiers in the future. We will provide at least 30 days notice before introducing
fees for functionality that is currently free.

---

## 9. Privacy

Our collection and use of personal information in connection with TIP is
described in our [Privacy Policy](/privacy). By using TIP, you agree to the
Privacy Policy.

---

## 10. Intellectual Property

### 10.1 Open-source software

The TIP software, including the on-chain program, SDK, and API, is open-source
and available under the MIT Licence. Nothing in these Terms restricts rights
granted by that licence.

### 10.2 Tagwise branding

The name "Tagwise", the "TIP" acronym as used in connection with this protocol,
and associated logos and marks are the property of the protocol project. You
may not use these marks in a way that implies endorsement or affiliation without
our written consent. Use in factual description (e.g., "built on TIP") is
permitted.

### 10.3 Your content

You retain ownership of any content you submit through TIP (such as display
names, bios, and avatar URLs). By submitting content, you grant us a limited,
worldwide, royalty-free licence to store, display, and transmit it as necessary
to operate the protocol.

---

## 11. Disclaimers

**TIP is provided "as is" and "as available" without warranties of any kind,
express or implied, including warranties of merchantability, fitness for a
particular purpose, or non-infringement.**

**We make no warranty that:**

- TIP will be available without interruption or error
- Any `@tag` will remain resolvable in perpetuity
- The off-chain mirror will always be in sync with on-chain state
- TIP will be free of security vulnerabilities

**Blockchain risk.** Use of the Solana blockchain involves inherent risks,
including network congestion, protocol changes, and the irreversible nature of
on-chain transactions. We are not responsible for any loss arising from
blockchain activity.

**Not financial advice.** Nothing on our website or in our documentation
constitutes financial, investment, or legal advice.

**Devnet notice.** TIP is currently deployed on Solana devnet only. Devnet is
a test environment. Do not send real funds. We accept no responsibility for
any loss arising from use on mainnet prior to our official mainnet launch.

---

## 12. Limitation of Liability

To the maximum extent permitted by applicable law, in no event shall TIP, its
contributors, or its founder be liable for any indirect, incidental, special,
consequential, or punitive damages, including but not limited to loss of funds,
loss of data, or loss of business, arising from your use of or inability to use
TIP, even if advised of the possibility of such damages.

Our total liability to you for any claim arising from your use of TIP shall not
exceed the greater of (a) the amount you paid us in the 12 months preceding the
claim, or (b) USD $100.

Some jurisdictions do not allow the exclusion or limitation of certain
liabilities, so the above may not apply to you in full.

---

## 13. Indemnification

You agree to indemnify, defend, and hold harmless TIP, its contributors, and
its founder from any claim, liability, damage, or expense (including reasonable
legal fees) arising from:

- Your use of TIP in violation of these Terms
- Your violation of any applicable law or third-party right
- Any content you submit through TIP

---

## 14. Modifications to the Service and Terms

### 14.1 Service changes

We may modify, suspend, or discontinue any part of TIP at any time. Where
practical, we will provide advance notice via our
[X account](https://x.com/tagwiseme). On-chain registrations are not affected
by our service decisions — your tag exists on the blockchain regardless of
whether we operate supporting infrastructure.

### 14.2 Terms changes

We may update these Terms from time to time. When we do, we will update the
"Last updated" date at the top of this page. Continued use of TIP after updated
Terms are posted constitutes acceptance of those Terms. Material changes will
be announced via our [X account](https://x.com/tagwiseme).

---

## 15. Governing Law and Disputes

These Terms are governed by applicable law. We will make reasonable efforts to
resolve disputes amicably. If a dispute cannot be resolved informally, it shall
be subject to the jurisdiction of the courts of the founder's place of
residence, unless prohibited by applicable law in your jurisdiction.

Nothing in this clause prevents you from asserting any rights you have under
mandatory consumer protection laws in your country of residence.

---

## 16. Severability

If any provision of these Terms is found to be unenforceable, that provision
will be modified to the minimum extent necessary to make it enforceable, and
the remaining provisions will continue in full force and effect.

---

## 17. Entire Agreement

These Terms, together with the [Privacy Policy](/privacy),
[Cookie Policy](/cookies), and [Security Policy](/security), constitute the
entire agreement between you and TIP regarding your use of the service.

---

## 18. Contact

[hello@tagwise.me](mailto:hello@tagwise.me)
[@tagwiseme](https://x.com/tagwiseme) on X
[github.com/devfreeguy/tagwise-identity-protocol](https://github.com/devfreeguy/tagwise-identity-protocol)
