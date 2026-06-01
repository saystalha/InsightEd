"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [clickedId, setClickedId] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const sections = ["hero", "features", "how-it-works", "faq"];
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && setActiveSection(e.target.id),
        ),
      { rootMargin: "-10% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const handleNavClick = (id, href) => {
    setClickedId(id);
    setActiveSection(id);
    setTimeout(() => setClickedId(null), 400);
  };

  const links = [
    { label: "Home", href: pathname === "/" ? "#hero" : "/#hero", id: "hero" },
    { label: "Features", href: pathname === "/" ? "#features" : "/#features", id: "features" },
    { label: "How It Works", href: pathname === "/" ? "#how-it-works" : "/#how-it-works", id: "how-it-works" },
    { label: "FAQ", href: pathname === "/" ? "#faq" : "/#faq", id: "faq" },
  ];

  return (
    <header
      id="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400 border-b"
      style={{
        background: "#1D5BF1",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255, 255, 255, 0.15)",
        paddingTop: scrolled ? "0.5rem" : "0.875rem",
        paddingBottom: scrolled ? "0.5rem" : "0.875rem",
        boxShadow: scrolled
          ? "0 4px 32px rgba(0, 0, 0, 0.15)"
          : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-6">
        {/* ── Logo ─────────────────────────── */}
        <Link
          href={pathname === "/" ? "#hero" : "/"}
          id="nav-logo"
          className="flex items-center gap-2.5 group flex-shrink-0"
          onClick={() => handleNavClick("hero", pathname === "/" ? "#hero" : "/")}
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 overflow-hidden"
            style={{
              border: "1px solid rgba(59, 130, 246, 0.35)",
            }}
          >
            <Image
              src="/logo.jpeg"
              alt="InsightEd Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover rounded-[9px]"
              priority
            />
          </div>
          <span className="font-black text-[1.05rem] tracking-tight text-[#FFFFFF]">
            <span style={{ color: "#ffffff" }}>IN</span>sightEd{" "}
          </span>
        </Link>
 
        {/* ── Desktop Nav ──────────────────── */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main navigation"
        >
          {links.map(({ label, href, id }) => {
            const isActive = pathname === "/" && activeSection === id;
            const isClicked = clickedId === id;
            return (
              <Link
                key={label}
                href={href}
                id={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleNavClick(id, href)}
                className="relative px-4 py-2 text-[0.88rem] font-semibold rounded-xl transition-all duration-200 select-none overflow-hidden"
                style={{
                  color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.70)",
                  background: isActive
                    ? "rgba(255, 255, 255, 0.15)"
                    : "transparent",
                  transform: isClicked ? "scale(0.94)" : "scale(1)",
                }}
              >
                {/* Click ripple */}
                {isClicked && (
                  <span
                    className="absolute inset-0 rounded-xl animate-ping-once pointer-events-none"
                    style={{
                      background: "rgba(59, 130, 246, 0.20)",
                      animation: "navRipple 0.4s ease-out forwards",
                    }}
                  />
                )}
                {label}
                {/* Active underline */}
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300"
                  style={{
                    background: "#FFFFFF",
                    width: isActive ? "1rem" : "0px",
                    opacity: isActive ? 1 : 0,
                  }}
                />
              </Link>
            );
          })}
        </nav>
 
        {/* ── Auth Buttons ─────────────────── */}
        <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
          <Link
            href="/login"
            id="nav-login"
            className="px-5 py-2 text-[0.85rem] font-semibold rounded-full transition-all duration-200 active:scale-95"
            style={{
              color: pathname === "/login" ? "#FFFFFF" : "rgba(255, 255, 255, 0.80)",
              background: pathname === "/login" ? "rgba(255, 255, 255, 0.12)" : "transparent",
              borderColor: pathname === "/login" ? "rgba(255, 255, 255, 0.50)" : "rgba(255, 255, 255, 0.25)",
              borderStyle: "solid",
              borderWidth: "1px",
            }}
            onMouseEnter={(e) => {
              if (pathname !== "/login") {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "#FFFFFF";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/login") {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.80)";
              }
            }}
          >
            Login
          </Link>
          {/* Removed Get Started Button */}
        </div>

        {/* ── Mobile Hamburger ─────────────── */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-1.5 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          id="nav-hamburger"
        >
          <span
            className={`block w-[22px] h-0.5 rounded transition-all duration-300 origin-center ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
            style={{ background: "#FFFFFF" }}
          />
          <span
            className={`block w-[22px] h-0.5 rounded transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`}
            style={{ background: "#FFFFFF" }}
          />
          <span
            className={`block w-[22px] h-0.5 rounded transition-all duration-300 origin-center ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
            style={{ background: "#FFFFFF" }}
          />
        </button>
      </div>

      {/* ── Mobile Menu ──────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden flex flex-col px-6 pb-6 pt-4 border-t animate-slide-down"
          style={{
            background: "#1D5BF1",
            borderColor: "rgba(255, 255, 255, 0.15)",
          }}
        >
          {links.map(({ label, href, id }) => (
            <Link
              key={label}
              href={href}
              className="py-3.5 text-[0.95rem] font-semibold border-b transition-colors flex items-center justify-between active:scale-95"
              style={{
                color:
                  pathname === "/" && activeSection === id
                    ? "#FFFFFF"
                    : "rgba(255, 255, 255, 0.70)",
                borderColor: "rgba(255, 255, 255, 0.08)",
              }}
              onClick={() => {
                handleNavClick(id, href);
                setMenuOpen(false);
              }}
            >
              {label}
              {pathname === "/" && activeSection === id && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]" />
              )}
            </Link>
          ))}
          <div className="flex gap-3 pt-5">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 py-3 text-center text-[0.88rem] font-semibold rounded-xl text-white active:scale-95 transition-transform"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.25)",
                background: pathname === "/login" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                borderColor: pathname === "/login" ? "rgba(255, 255, 255, 0.50)" : "rgba(255, 255, 255, 0.25)"
              }}
            >
              Login
            </Link>
            {/* Removed Get Started Button */}
          </div>
        </div>
      )}

      {/* Keyframe for nav ripple */}
      <style>{`
        @keyframes navRipple {
          0%   { opacity: 0.6; transform: scale(0.8); }
          100% { opacity: 0;   transform: scale(1.3); }
        }
      `}</style>
    </header>
  );
}
