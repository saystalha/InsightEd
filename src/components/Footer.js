"use client";

const TwitterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);
const LinkedInIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
const GitHubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const SOCIAL = [
  { label: "Twitter", Icon: TwitterIcon },
  { label: "LinkedIn", Icon: LinkedInIcon },
  { label: "GitHub", Icon: GitHubIcon },
];

const NAV_COLS = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "#hero" },
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative overflow-hidden py-16 pb-8 footer-bg"
      style={{
        borderTop: "1px solid rgba(196,124,62,0.12)",
      }}
    >
      {/* Subtle copper glow at bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(196,124,62,0.10) 0%, transparent 70%)",
        }}
      />
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(196,124,62,0.25), transparent)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Top section */}
        <div
          className="flex flex-wrap gap-16 pb-12 border-b"
          style={{ borderColor: "rgba(196,124,62,0.12)" }}
        >
          {/* Brand */}
          <div className="flex-1 min-w-[220px]">
            <a
              href="#hero"
              className="inline-flex items-center gap-2.5 mb-4 group"
            >
              <div
                className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center transition-all group-hover:scale-105"
                style={{
                  background: "rgba(196,124,62,0.16)",
                  border: "1px solid rgba(196,124,62,0.28)",
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c47c3e"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path
                    d="M8 9.5C8 8.12 9.12 7 10.5 7h3C14.88 7 16 8.12 16 9.5c0 .93-.52 1.73-1.28 2.16C15.46 12.13 16 13.05 16 14H8c0-.95.54-1.87 1.28-2.34C8.52 11.23 8 10.43 8 9.5z"
                    fill="#c47c3e"
                    stroke="none"
                  />
                </svg>
              </div>
              <span className="font-bold text-[1.05rem]">
                <span style={{ color: "#c47c3e" }}>IN</span>
                <span style={{ color: "#f2f2f2" }}>sightEd</span>
              </span>
            </a>
            <p
              className="text-[0.86rem] leading-[1.65] max-w-[260px] mb-5"
              style={{ color: "rgba(242,242,242,0.42)" }}
            >
              Restoring the teacher-student feedback loop through privacy-first
              AI.
            </p>
            <div className="flex gap-2.5">
              {SOCIAL.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:-translate-y-[2px] hover:text-[#c47c3e]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(242,242,242,0.35)",
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <nav className="flex gap-14" aria-label="Footer navigation">
            {NAV_COLS.map((col) => (
              <div
                key={col.title}
                className="flex flex-col gap-3 min-w-[120px]"
              >
                <span
                  className="text-[0.72rem] font-bold tracking-[0.12em] uppercase mb-1"
                  style={{ color: "rgba(242,242,242,0.55)" }}
                >
                  {col.title}
                </span>
                {col.links.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="text-[0.86rem] transition-colors"
                    style={{ color: "rgba(242,242,242,0.42)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#c47c3e")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(242,242,242,0.42)")
                    }
                  >
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          {/* Newsletter */}
          <div className="min-w-[220px]">
            <p
              className="text-[0.72rem] font-bold tracking-[0.12em] uppercase mb-4"
              style={{ color: "rgba(242,242,242,0.55)" }}
            >
              Stay Updated
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl text-[0.84rem] outline-none"
                style={{
                  background: "rgba(15,24,36,0.60)",
                  border: "1.5px solid rgba(196,124,62,0.22)",
                  color: "#f2f2f2",
                }}
              />
              <button className="px-4 py-2.5 rounded-xl text-[0.82rem] font-bold btn-primary flex-shrink-0">
                →
              </button>
            </div>
            <p
              className="text-[0.71rem] mt-2"
              style={{ color: "rgba(242,242,242,0.35)" }}
            >
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <p
            className="text-[0.78rem]"
            style={{ color: "rgba(242,242,242,0.25)" }}
          >
            © {new Date().getFullYear()} InsightEd. All rights reserved.
          </p>
          <div
            className="badge-copper inline-flex items-center gap-2 text-[0.74rem] font-semibold px-3.5 py-1.5 rounded-full"
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#c47c3e" }}
            />
            Privacy-First by Design
          </div>
        </div>
      </div>
    </footer>
  );
}
