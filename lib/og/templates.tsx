// Satori-safe card templates for the OG route. Flexbox only, every container
// has an explicit display/flexDirection, all colours are literal (see
// tokens.ts), no mask-image, and covers are real <img>. OgImage(params)
// dispatches by `type`; each builder returns a 1200×630 element.
import React from "react";
import { T, FONT, avatarBg, pubBg, initials, fmtK } from "./tokens";

const W = 1200;
const H = 630;

// ---- shared style atoms --------------------------------------------
const mono = (size: number, color: string = T.muted): React.CSSProperties => ({
  fontFamily: FONT.mono,
  fontSize: size,
  color,
  letterSpacing: "0.02em",
});
const root = (pad = "72px 76px"): React.CSSProperties => ({
  width: W,
  height: H,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  padding: pad,
  background: T.canvas,
  color: T.primary,
  fontFamily: FONT.sans,
  overflow: "hidden",
});
const spine: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 6,
  background: T.accent,
};
// faint radial glow stands in for the masked dot-grid (Satori-safe)
const glow: React.CSSProperties = {
  position: "absolute",
  top: -260,
  right: -200,
  width: 720,
  height: 720,
  borderRadius: 720,
  background:
    "radial-gradient(circle, rgba(45,212,191,0.10) 0%, rgba(45,212,191,0) 60%)",
  display: "flex",
};
const topbar: React.CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
};
const url: React.CSSProperties = { ...mono(16, T.faint) };

function Wordmark({ src, h = 38 }: { src: string; h?: number }) {
  // Explicit width (Satori ignores width:auto); ratio matches wordmark-white.png (1600×519).
  const w = (h * 1600) / 519;
  return (
    <img
      src={src}
      width={w}
      height={h}
      alt="Codú"
      style={{ width: w, height: h }}
    />
  );
}
function Eyebrow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        ...mono(17, T.accent),
        textTransform: "uppercase",
        letterSpacing: "0.25em",
      }}
    >
      <span style={{ color: T.faint, marginRight: 6 }}>{"//"}</span>
      <span>{label}</span>
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        ...mono(14, T.muted),
        padding: "6px 14px",
        borderRadius: 999,
        border: `1px solid ${T.hairline}`,
      }}
    >
      {children}
    </div>
  );
}

// ====================================================================
// 1) MAIN-PAGE cards (static surfaces). hed is an array of lines.
// ====================================================================
export const MAIN: Record<
  string,
  { eyebrow: string; hed: string[]; sub: string }
> = {
  home: {
    eyebrow: "The community for AI builders",
    hed: ["Learn to build with AI.", "Ship what you make."],
    sub: "A knowledge-first community for web devs and indie hackers.",
  },
  about: {
    eyebrow: "About Codú",
    hed: ["Less theory.", "More shipping."],
    sub: "Why Codú exists, and who it’s for.",
  },
  articles: {
    eyebrow: "Articles",
    hed: ["Guides and field notes", "from people who ship."],
    sub: "Long-form from across the community.",
  },
  discussions: {
    eyebrow: "Discussions",
    hed: ["Ask, answer,", "and figure it out together."],
    sub: "Questions, TILs and working notes from builders.",
  },
  jobs: {
    eyebrow: "Jobs",
    hed: ["Roles for people", "building with AI."],
    sub: "Hand-picked teams hiring right now.",
  },
  advertise: {
    eyebrow: "Advertise",
    hed: ["Reach developers", "who actually ship."],
    sub: "Sponsor the feed, the newsletter, the jobs board.",
  },
  weekly: {
    eyebrow: "Codú Weekly",
    hed: ["The best of what", "builders shipped."],
    sub: "One email a week. No fluff, no filler.",
  },
};

export function MainCard({ id, logo }: { id: string; logo: string }) {
  const c = MAIN[id] || MAIN.home;
  return (
    <div style={root()}>
      <div style={glow} />
      <div style={spine} />
      <div style={topbar}>
        <Wordmark src={logo} />
        <span style={url}>codu.co</span>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", marginBottom: 26 }}>
          <Eyebrow label={c.eyebrow.toUpperCase()} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {c.hed.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 82,
                lineHeight: 0.96,
                letterSpacing: "-0.035em",
                color: T.primary,
              }}
            >
              {line}
            </div>
          ))}
        </div>
        <div
          style={{
            color: T.muted,
            fontSize: 24,
            lineHeight: 1.4,
            marginTop: 28,
            maxWidth: 560,
            display: "flex",
          }}
        >
          {c.sub}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 2) POST card — adaptive (Article / Discussion / Link), cover or branded
// ====================================================================
const KIND: Record<
  string,
  { label: string; tone: "neutral" | "info" | "faint" }
> = {
  article: { label: "Article", tone: "neutral" },
  discussion: { label: "Discussion", tone: "info" },
  link: { label: "Link", tone: "faint" },
};

export type PostParams = {
  type: "post";
  kind: "article" | "discussion" | "link";
  title: string;
  author: { name: string; role: string; hue: number };
  tags?: string[];
  publication?: { name: string; hue: number };
  source?: string;
  read?: string;
  cover?: string; // real image URL → cover layout; omit → branded
  logo: string;
};

function KindBadge({ kind }: { kind: PostParams["kind"] }) {
  const k = KIND[kind] || KIND.article;
  const tone =
    k.tone === "info"
      ? { color: T.info, background: T.infoWash, border: "none" }
      : k.tone === "neutral"
        ? {
            color: T.faint,
            background: "transparent",
            border: `1px solid ${T.hairlineStrong}`,
          }
        : {
            color: T.faint,
            background: "transparent",
            border: `1px solid ${T.hairline}`,
          };
  return (
    <div
      style={{
        display: "flex",
        fontFamily: FONT.mono,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "5px 12px",
        borderRadius: 6,
        ...tone,
      }}
    >
      {k.label}
    </div>
  );
}

function Chips({ p }: { p: PostParams }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <KindBadge kind={p.kind} />
      {p.publication && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            ...mono(14, T.muted),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              borderRadius: 5,
              background: pubBg(p.publication.hue),
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 13,
              color: "#fff",
            }}
          >
            {initials(p.publication.name)}
          </div>
          <span>{p.publication.name}</span>
        </div>
      )}
      {p.source && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            ...mono(15, T.muted),
          }}
        >
          <span>via {p.source}</span>
          <span style={{ color: T.accent, marginLeft: 6 }}>↗</span>
        </div>
      )}
    </div>
  );
}

function Byline({ p }: { p: PostParams }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "auto",
        paddingTop: 26,
        borderTop: `1px solid ${T.hairline}`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 56,
            background: avatarBg(p.author.hue),
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 21,
            color: T.primary,
          }}
        >
          {initials(p.author.name)}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25 }}>
            {p.author.name}
          </span>
          <span style={{ ...mono(14, T.faint), marginTop: 4 }}>
            {p.author.role}
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        {(p.tags || []).slice(0, 2).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
        {p.kind === "article" && p.read && (
          <span style={mono(14, T.accentSoft)}>{p.read} read</span>
        )}
      </div>
    </div>
  );
}

function Title({
  text,
  size,
  lines,
}: {
  text: string;
  size: number;
  lines: number;
}) {
  return (
    <div
      style={{
        fontFamily: FONT.display,
        fontWeight: 800,
        color: T.primary,
        letterSpacing: "-0.03em",
        lineHeight: 1.02,
        fontSize: size,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
      }}
    >
      {text}
    </div>
  );
}

export function PostCard(p: PostParams) {
  const hasCover = !!p.cover;
  return (
    <div style={root("64px 76px")}>
      <div style={glow} />
      <div style={spine} />
      <div style={{ ...topbar, alignItems: "center" }}>
        <Chips p={p} />
        <Wordmark src={p.logo} />
      </div>
      {hasCover ? (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            gap: 56,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Title text={p.title} size={50} lines={4} />
          </div>
          <img
            src={p.cover}
            width={384}
            height={384}
            alt=""
            style={{
              width: 384,
              height: "100%",
              objectFit: "cover",
              borderRadius: 16,
              border: `1px solid ${T.hairlineStrong}`,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            display: "flex",
            flex: 1,
            alignItems: "center",
          }}
        >
          <Title text={p.title} size={60} lines={3} />
        </div>
      )}
      <Byline p={p} />
    </div>
  );
}

// ====================================================================
// 3) IDENTITY cards — profile · publication · job
// ====================================================================
function IdentityShell({
  kicker,
  children,
  footLeft,
  logo,
}: {
  kicker: React.ReactNode;
  children: React.ReactNode;
  footLeft: React.ReactNode;
  logo: string;
}) {
  return (
    <div style={root()}>
      <div style={glow} />
      <div style={spine} />
      <div style={topbar}>
        {kicker}
        <span style={url}>codu.co</span>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          gap: 30,
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: 26,
          borderTop: `1px solid ${T.hairline}`,
        }}
      >
        {footLeft}
        <Wordmark src={logo} h={30} />
      </div>
    </div>
  );
}
function MintBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT.mono,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: T.onAccent,
        background: T.accent,
        padding: "6px 13px",
        borderRadius: 999,
      }}
    >
      {children}
    </div>
  );
}
function MetaLine({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "row", ...mono(19, T.muted) }}
    >
      {children}
    </div>
  );
}
const metaB: React.CSSProperties = { color: T.accentSoft, fontWeight: 500 };

export type ProfileParams = {
  type: "profile";
  name: string;
  role: string;
  hue: number;
  location: string;
  bio: string;
  topHelper?: boolean;
  followers: number;
  joined: string;
  interests?: string[];
  logo: string;
};
export function ProfileCard(u: ProfileParams) {
  return (
    <IdentityShell
      logo={u.logo}
      kicker={<Eyebrow label="PROFILE" />}
      footLeft={
        <MetaLine>
          <span style={metaB}>{fmtK(u.followers)}</span>
          <span>&nbsp;followers · {u.joined}</span>
        </MetaLine>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 100,
            background: avatarBg(u.hue),
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 40,
            color: T.primary,
          }}
        >
          {initials(u.name)}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 60,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {u.name}
          </div>
          <div style={{ ...mono(19, T.muted), marginTop: 12 }}>
            {[u.role, u.location].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
      <div
        style={{
          color: T.muted,
          fontSize: 25,
          lineHeight: 1.45,
          maxWidth: 760,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {u.bio}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        {u.topHelper && <MintBadge>★ Top helper</MintBadge>}
        {(u.interests || []).slice(0, 3).map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </IdentityShell>
  );
}

export type PublicationParams = {
  type: "publication";
  name: string;
  hue: number;
  tagline: string;
  articleCount: number;
  followers: number;
  logo: string;
};
export function PublicationCard(p: PublicationParams) {
  return (
    <IdentityShell
      logo={p.logo}
      kicker={<Eyebrow label="PUBLICATION" />}
      footLeft={
        <MetaLine>
          <span style={metaB}>{p.articleCount}</span>
          <span>&nbsp;articles · </span>
          <span style={metaB}>{fmtK(p.followers)}</span>
          <span>&nbsp;followers</span>
        </MetaLine>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 12,
            background: pubBg(p.hue),
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 42,
            color: "#fff",
          }}
        >
          {initials(p.name)}
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 60,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {p.name}
        </div>
      </div>
      <div
        style={{
          color: T.muted,
          fontSize: 25,
          lineHeight: 1.45,
          maxWidth: 760,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {p.tagline}
      </div>
    </IdentityShell>
  );
}

export type JobParams = {
  type: "job";
  company: string;
  logo: string;
  role: string;
  location: string;
  jobType: string;
  salary?: string;
  tags?: string[];
  featured?: boolean;
  wordmark: string;
};
export function JobCard(j: JobParams) {
  return (
    <IdentityShell
      logo={j.wordmark}
      kicker={
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          {j.featured && <MintBadge>Featured</MintBadge>}
          <Eyebrow label="JOB" />
        </div>
      }
      footLeft={
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          {(j.tags || []).slice(0, 3).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 8,
            background: T.elevated,
            border: `1px solid ${T.hairline}`,
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 26,
            color: T.primary,
          }}
        >
          {j.logo}
        </div>
        <div style={{ display: "flex", ...mono(22, T.primary) }}>
          {j.company}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 60,
          letterSpacing: "-0.03em",
          lineHeight: 1.02,
          maxWidth: 900,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}
      >
        {j.role}
      </div>
      <MetaLine>
        <span>
          {j.location} · {j.jobType}
          {j.salary ? " · " : ""}
        </span>
        {j.salary && <span style={metaB}>{j.salary}</span>}
      </MetaLine>
    </IdentityShell>
  );
}

// ====================================================================
// DISPATCH — one entry point the route calls
// ====================================================================
export type OgParams =
  | { type: "main"; id: string; logo: string }
  | PostParams
  | ProfileParams
  | PublicationParams
  | JobParams;

export function OgImage(params: OgParams): React.ReactElement {
  switch (params.type) {
    case "main":
      return <MainCard id={params.id} logo={params.logo} />;
    case "post":
      return <PostCard {...params} />;
    case "profile":
      return <ProfileCard {...params} />;
    case "publication":
      return <PublicationCard {...params} />;
    case "job":
      return <JobCard {...params} />;
    default:
      return <MainCard id="home" logo={(params as any).logo} />;
  }
}
