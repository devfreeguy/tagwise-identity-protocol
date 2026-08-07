"use client";

import { useState } from "react";
import {
  IconCopy,
  IconCheck,
  IconTerminal2,
  IconCode,
  IconExternalLink,
  IconBrandTypescript,
  type Icon,
} from "@tabler/icons-react";
import { Tabs, Tab, cn, type TabProps } from "@heroui/react";
import { Highlight, themes } from "prism-react-renderer";
import { SectionWrapper } from "../layout/SectionWrapper";
import { Button } from "../ui/Button";
import Link from "next/link";
import { LINKS } from "../../lib/constants";

interface ITabItem {
  id: string;
  isActive: boolean;
  Icon: Icon;
  label: string;
}

const TabList = [
  {
    icon: IconBrandTypescript,
    id: "ts",
    label: "Typescript",
  },
  {
    icon: IconCode,
    id: "rest",
    label: "REST API",
  },
  {
    icon: IconTerminal2,
    id: "curl",
    label: "cURL",
  },
];

const TabItem = ({ id, isActive, Icon, label }: ITabItem) => {
  return (
    <Tabs.Tab
      id={id}
      className={`flex items-center gap-2 whitespace-nowrap ${
        isActive
          ? "text-white"
          : "text-muted-foreground group-hover:text-foreground"
      }`}
    >
      <Icon
        size={14}
        // className={
        //   isActive
        //     ? "text-white"
        //     : "text-muted-foreground group-hover:text-foreground"
        // }
      />
      <span>{label}</span>
      <Tabs.Indicator className="bg-accent" />
    </Tabs.Tab>
  );
};

export function DeveloperExperienceSection() {
  const [activeTab, setActiveTab] = useState<"ts" | "rest" | "curl">("ts");
  const [copied, setCopied] = useState(false);

  const snippets = {
    ts: `import { TipClient, TagNotFoundError } from "@tagwise/tip-sdk";

const client = new TipClient();

try {
  const result = await client.resolve("alice");

  console.log("Tag:", result.tag);                  // "@alice"
  console.log("Payment Wallet:", result.wallet);    // "8L2Z3nSXbwoFhK9x9BEs6b1qhF6xEcNJ7T4NqmiWaeuf"
  console.log("Display Name:", result.displayName); // "Alice Smith"
  console.log("Payment Link:", result.paymentLink); // "https://tagwise.me/pay/@alice"
} catch (error) {
  if (error instanceof TagNotFoundError) {
    console.log("Tag @alice has not been registered yet.");
  } else {
    console.error("Failed to resolve tag:", error);
  }
}`,
    rest: `GET https://api.tagwise.me/v1/resolve/alice
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{
  "tag": "@alice",
  "wallet": "8L2Z3nSXbwoFhK9x9BEs6b1qhF6xEcNJ7T4NqmiWaeuf",
  "owner": "5A3c9x...p1M2Z",
  "displayName": "Alice Smith",
  "paymentLink": "https://tagwise.me/pay/@alice",
  "signature": "4zL8aY...2xY9b"
}`,
    curl: `curl -X GET "https://api.tagwise.me/v1/resolve/alice" \\
  -H "Accept: application/json" \\
  -H "X-TIP-Client: MySolanaWallet/1.0"`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developer-experience" className="py-24 relative">
      <SectionWrapper className="space-y-16">
        {/* Code Showcase Block */}
        <div className="max-w-4xl mx-auto">
          <div className="border border-border/80 bg-background shadow-sm w-full overflow-hidden rounded-2xl">
            {/* Top Editor Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/80 bg-surface-secondary p-3 gap-3">
              <div className="w-80">
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as any)}
                >
                  <Tabs.ListContainer
                    aria-label="Code Snippets"
                    className="bg-background"
                  >
                    <Tabs.List aria-label="Code Snippets">
                      {TabList.map(({ icon: Icon, id, label }, i) => (
                        <TabItem
                          key={i}
                          isActive={activeTab == id}
                          id={id}
                          Icon={Icon}
                          label={label}
                        />
                      ))}
                    </Tabs.List>
                  </Tabs.ListContainer>
                </Tabs>
              </div>

              {/* Copy Button */}
              <Button
                size="sm"
                variant="tertiary"
                onPress={handleCopy}
                className="px-4 py-2"
                isDisabled={copied}
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            {/* Code Content */}
            <div className="p-6 sm:p-8 overflow-x-auto bg-[#0a0a0c] min-h-80 flex items-stretch">
              <Highlight
                theme={themes.vsDark}
                code={snippets[activeTab]}
                language={
                  activeTab === "ts"
                    ? "typescript"
                    : activeTab === "rest"
                      ? "http"
                      : "bash"
                }
              >
                {({
                  className,
                  style,
                  tokens,
                  getLineProps,
                  getTokenProps,
                }) => (
                  <pre
                    className={`font-mono text-[13px] leading-loose text-white/90 select-all w-full ${className}`}
                    style={{ ...style, backgroundColor: "transparent" }}
                  >
                    <code>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </code>
                  </pre>
                )}
              </Highlight>
            </div>

            {/* Bottom links footer */}
            <div className="px-6 py-4 bg-surface-secondary border-t border-border/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Version
                </span>
                <span className="text-[11px] font-mono text-foreground bg-background px-2 py-1 border border-border/80">
                  @tagwise/tip-sdk@1.0.0
                </span>
              </div>

              <div className="flex items-center gap-6">
                <a
                  href={LINKS.DOCS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Docs</span>
                  <IconExternalLink size={14} />
                </a>
                <a
                  href={LINKS.GITHUB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <span>GitHub</span>
                  <IconExternalLink size={14} />
                </a>
                <a
                  href={LINKS.API_DOCS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <span>API</span>
                  <IconExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href={LINKS.DOCS} target="_blank" rel="noopener noreferrer">
            <Button>Read Documentation</Button>
          </Link>

          <Link href={LINKS.GITHUB} target="_blank" rel="noopener noreferrer">
            <Button variant="tertiary">SDK Repository</Button>
          </Link>
        </div>
      </SectionWrapper>
    </section>
  );
}
