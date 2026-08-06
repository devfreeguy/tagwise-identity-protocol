"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconSearch,
  IconShieldCheck,
  IconAlertCircle,
  IconWallet,
  IconCopy,
  IconCheck,
  IconShoppingBag,
  IconTerminal2,
} from "@tabler/icons-react";
import { InputGroup, Button } from "@heroui/react";
import { SectionWrapper } from "../layout/SectionWrapper";
import { TipClient, TagNotFoundError, TagInvalidError } from "@tagwise/tip-sdk";
import type { IdentityResponse } from "@tagwise/tip-sdk";
import { NETWORK_NAME } from "../../lib/constants";

//  Singleton client (no auth needed for reads)
const tipClient = new TipClient();

//  Deterministic avatar gradient from a tag string
const GRADIENT_PAIRS = [
  ["#7928CA", "#9F55FF"],
  ["#14F195", "#9945FF"],
  ["#F59E0B", "#7928CA"],
  ["#3B82F6", "#8B5CF6"],
  ["#EC4899", "#F43F5E"],
  ["#06B6D4", "#3B82F6"],
  ["#10B981", "#14F195"],
  ["#F97316", "#EF4444"],
] as const;

function avatarGradient(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  const pair = GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length]!;
  return `from-[${pair[0]}] to-[${pair[1]}]`;
}

export function LivePlaygroundSection() {
  const [tagQuery, setTagQuery] = useState("devfreeguy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTag, setAvailableTag] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentIdentity, setCurrentIdentity] =
    useState<IdentityResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Track whether the initial auto-resolve has been dispatched
  const initialResolveFired = useRef(false);

  //  Resolve a tag via the real TIP API
  const resolveTag = useCallback(async (rawTag: string) => {
    if (!rawTag) return;

    const formattedTag = rawTag.startsWith("@")
      ? rawTag.toLowerCase()
      : `@${rawTag.toLowerCase()}`;

    setLoading(true);
    setError(null);
    setAvailableTag(null);

    const start = performance.now();

    try {
      const identity = await tipClient.identity(formattedTag);
      setLatencyMs(Math.round(performance.now() - start));
      setCurrentIdentity(identity);
    } catch (err) {
      setLatencyMs(Math.round(performance.now() - start));

      if (err instanceof TagNotFoundError) {
        setAvailableTag(formattedTag);
        setCurrentIdentity(null);
      } else if (err instanceof TagInvalidError) {
        setError(
          `"${formattedTag}" is not a valid tag format. Tags must be 3–32 lowercase letters, numbers, or underscores.`,
        );
        setCurrentIdentity(null);
      } else {
        setError("Something went wrong resolving this tag. Please try again.");
        setCurrentIdentity(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  //  Auto-resolve @devfreeguy on mount
  useEffect(() => {
    if (initialResolveFired.current) return;
    initialResolveFired.current = true;
    resolveTag("@devfreeguy");
  }, [resolveTag]);

  const handleResolve = (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    resolveTag(tagQuery);
  };

  const handleCopyAddress = () => {
    if (!currentIdentity) return;
    navigator.clipboard.writeText(currentIdentity.wallet);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyLink = () => {
    if (!currentIdentity) return;
    const paymentLink = `https://pay.tagwise.me/${currentIdentity.tag}`;
    navigator.clipboard.writeText(paymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  //  Derived display values
  const displayName =
    currentIdentity?.displayName ?? currentIdentity?.tag ?? "";
  const gradient = currentIdentity
    ? avatarGradient(currentIdentity.tag)
    : "from-[#7928CA] to-[#9F55FF]";
  const roleLabel = currentIdentity?.merchant
    ? "Verified Merchant"
    : (currentIdentity?.bio ?? "Member");
  const tokenLabel = currentIdentity?.preferredToken ?? "—";
  const paymentLinkUrl = currentIdentity
    ? `https://pay.tagwise.me/${currentIdentity.tag}`
    : "";

console.log(currentIdentity)

  return (
    <section id="playground" className="py-24 relative overflow-hidden">
      {/* Subtle Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-[#7928CA]/5 rounded-full blur-[140px] pointer-events-none" />

      <SectionWrapper className="space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#8B98C2] mb-4">
            Interactive Testbench
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Live Protocol Playground
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Test canonical tag resolution in real time. Try entering{" "}
            <button
              onClick={() => {
                setTagQuery("@devfreeguy");
                setTimeout(() => resolveTag("@devfreeguy"), 50);
              }}
              className="text-[#9F55FF] font-mono hover:text-white transition-colors"
            >
              @devfreeguy
            </button>{" "}
            or any registered tag.
          </p>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleResolve} className="max-w-4xl mx-auto w-full">
          <InputGroup className="h-16 w-full bg-surface-secondary border border-border/80 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/50 transition-all shadow-sm rounded-full pl-6">
            <InputGroup.Prefix>
              <IconSearch
                size={20}
                className="text-muted-foreground mr-2 shrink-0"
              />
            </InputGroup.Prefix>
            <InputGroup.Input
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder="Enter a tag (e.g. @devfreeguy)"
              className="flex-1 h-full bg-transparent outline-none text-base font-medium text-foreground placeholder:text-muted-foreground min-w-0"
            />
            <InputGroup.Suffix>
              <Button
                type="submit"
                variant="primary"
                isPending={loading}
                className="font-mono uppercase tracking-widest text-[11px] px-8 h-12 shadow-md shrink-0 rounded-full"
              >
                Resolve
              </Button>
            </InputGroup.Suffix>
          </InputGroup>
        </form>

        {/* Resolver Output Area */}
        <div className="max-w-4xl mx-auto">
          {error ? (
            /*  Error State  */
            <div className="border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4 rounded-2xl">
              <div className="inline-flex p-3 border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded-xl">
                <IconAlertCircle size={32} />
              </div>
              <h3 className="text-xl font-medium text-foreground">{error}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Please check the format and try again.
              </p>
            </div>
          ) : availableTag ? (
            /*  Available State  */
            <div className="border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4 rounded-2xl">
              <div className="inline-flex p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <IconCheck size={32} />
              </div>
              <h3 className="text-xl font-medium text-foreground">
                Congratulations! <span className="text-emerald-400 font-mono">{availableTag}</span> is available.
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                TIP supports universal open registration. With our smart
                contract, anyone can claim an available tag with permanent
                on-chain ownership.
              </p>
            </div>
          ) : currentIdentity ? (
            /*  Identity Card  */
            <div className="border border-border/80 bg-border/80 gap-px flex flex-col md:flex-row shadow-sm rounded-2xl overflow-hidden">
              {/* Left Column (Avatar + Stats) */}
              <div className="w-full md:w-[45%] bg-surface-secondary p-6 sm:p-8 flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-4 w-full">
                  {currentIdentity.avatar ? (
                    <img
                      src={currentIdentity.avatar}
                      alt={displayName}
                      className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center text-white font-bold text-2xl border border-white/10 shrink-0`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xl font-semibold text-foreground truncate">
                        {displayName}
                      </h3>
                      {currentIdentity.verified && (
                        <IconShieldCheck
                          size={20}
                          className="text-[#9F55FF] shrink-0"
                        />
                      )}
                    </div>
                    <div className="text-sm font-mono text-muted-foreground mt-0.5">
                      {currentIdentity.tag}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-full gap-px bg-border/80 border border-border/80 mt-8">
                  <div className="flex items-center justify-between py-3 px-4 bg-background">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Status
                    </span>
                    <span className="text-emerald-400 font-medium text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse" />
                      {currentIdentity.verified ? "Verified" : "Active"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-background">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Role
                    </span>
                    <span className="text-foreground font-medium text-xs truncate max-w-35 text-right">
                      {roleLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-background">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Token
                    </span>
                    <span className="text-[#9F55FF] font-medium font-mono text-xs">
                      {tokenLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (Addresses) */}
              <div className="w-full md:w-[55%] flex flex-col gap-px bg-border/80">
                {/* Address Block */}
                <div className="flex-1 p-6 sm:p-8 bg-background flex flex-col justify-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-[#7928CA]/5 to-[#9F55FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-3 relative z-10">
                    <span className="flex items-center gap-1.5">
                      <IconWallet size={14} className="text-[#9F55FF]" />
                      Destination Address
                    </span>
                    <span className="text-emerald-400">{NETWORK_NAME}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <code className="text-[13px] font-mono text-foreground font-medium break-all selection:bg-[#7928CA]/30 leading-relaxed">
                      {currentIdentity.wallet}
                    </code>
                    <Button
                      isIconOnly
                      variant="outline"
                      onPress={handleCopyAddress}
                      className="w-10 h-10 min-w-10 bg-surface-secondary border-border/80 hover:border-[#7928CA] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      {copiedAddress ? (
                        <IconCheck size={16} className="text-emerald-400" />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Payment Link Block */}
                <div className="flex-1 p-6 sm:p-8 bg-background flex flex-col justify-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-[#7928CA]/5 to-[#9F55FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-3 relative z-10">
                    <span className="flex items-center gap-1.5">
                      <IconShoppingBag size={14} className="text-[#9F55FF]" />
                      Universal Payment Link
                    </span>
                    <span className="text-[#9F55FF]">Shareable</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <code className="text-[13px] font-mono text-[#9F55FF] font-medium truncate selection:bg-[#7928CA]/30">
                      {paymentLinkUrl}
                    </code>
                    <Button
                      isIconOnly
                      variant="outline"
                      onPress={handleCopyLink}
                      className="w-10 h-10 min-w-10 bg-surface-secondary border-border/80 hover:border-[#7928CA] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      {copiedLink ? (
                        <IconCheck size={16} className="text-emerald-400" />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Footer Latency */}
                <div className="p-4 bg-background flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <span>
                    Latency: {latencyMs !== null ? `${latencyMs}ms` : "—"}
                  </span>
                  <span>Source: TIP API (Live)</span>
                </div>
              </div>
            </div>
          ) : (
            /*  Empty State  */
            <div className="border border-border/80 bg-surface-secondary rounded-2xl p-12 sm:p-16 text-center space-y-5">
              <div className="inline-flex p-4 border border-border/80 bg-background text-muted-foreground">
                <IconTerminal2 size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                Enter a tag above to resolve a live identity
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The resolver queries the TIP API in real time — no mock data.
                Try{" "}
                <button
                  onClick={() => {
                    setTagQuery("@devfreeguy");
                    setTimeout(() => resolveTag("@devfreeguy"), 50);
                  }}
                  className="text-[#9F55FF] font-mono hover:text-white transition-colors"
                >
                  @devfreeguy
                </button>{" "}
                to see it in action.
              </p>
            </div>
          )}
        </div>
      </SectionWrapper>
    </section>
  );
}
