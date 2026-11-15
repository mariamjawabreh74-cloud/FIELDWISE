import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  GitCompareArrows,
  House,
  Leaf,
  Menu,
  Mountain,
  Orbit,
  ShieldCheck,
  Sprout,
  CalendarDays,
  ChartNoAxesCombined,
  Waypoints,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "./LanguageToggle";
import { SimulatedBanner } from "./SimulatedBanner";
import { useApiStatus } from "../hooks/ApiProvider";
import { LoadingState } from "./AsyncState";
import { useMediaQuery } from "../hooks/useMediaQuery";

const farmNavigation = [
  { to: "/", key: "home", icon: House },
  { to: "/start", key: "myFarm", icon: Sprout },
  { to: "/farm/analysis", key: "insights", icon: ChartNoAxesCombined },
];
const planNavigation = [
  { to: "/farm/explore", key: "explore", icon: Mountain },
  { to: "/farm/planner", key: "planner", icon: Waypoints },
  { to: "/farm/compare", key: "compare", icon: GitCompareArrows },
  { to: "/farm/plan", key: "plan", icon: CalendarDays },
];

export function Brand({ small = false }: { small?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/"
      className={`brand ${small ? "brand-small" : ""}`}
      aria-label={t("common.brand")}
    >
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 38 43" fill="none">
          <path
            d="M19 39V15"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M18.7 29C7 30 3 23 3 16c10-1 16 3 15.7 13Z"
            fill="currentColor"
          />
          <path
            d="M20 22C19 11 25 5 35 5c1 10-5 17-15 17Z"
            fill="currentColor"
          />
          <path
            d="M19 15C10 16 6 10 7 3c8 0 12 4 12 12Z"
            fill="currentColor"
            opacity=".55"
          />
        </svg>
      </span>
      <span className="brand-copy">
        <span className="brand-name" dir="ltr">
          {t("common.brand")}
        </span>
        {!small && <span className="brand-tagline">{t("common.tagline")}</span>}
      </span>
    </Link>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const { simulated } = useApiStatus();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const mobile = useMediaQuery("(max-width: 920px)");
  const sidebar = useRef<HTMLElement>(null);
  const current = [...farmNavigation, ...planNavigation].find(
    (item) => item.to === location.pathname,
  );
  const section =
    location.pathname === "/methodology"
      ? "methodology"
      : (current?.key ?? "myFarm");
  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = Array.from(
      sidebar.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      ) ?? [],
    );
    focusable[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === focusable[0]) {
          event.preventDefault();
          focusable.at(-1)?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === focusable.at(-1)
        ) {
          event.preventDefault();
          focusable[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open, mobile]);
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        {t("common.skipToContent")}
      </a>
      {open && (
        <button
          className="nav-backdrop"
          onClick={() => setOpen(false)}
          aria-label={t("common.close")}
        />
      )}
      <aside
        ref={sidebar}
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label={t("nav.workspace")}
        aria-hidden={mobile && !open ? true : undefined}
        inert={mobile && !open}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-close icon-button"
            onClick={() => setOpen(false)}
            aria-label={t("common.close")}
          >
            <X size={22} />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label={t("nav.workspace")}>
          <p className="nav-label">{t("nav.farmGroup")}</p>
          {farmNavigation.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive || (key === "myFarm" && ["/farm/location", "/farm/boundary", "/farm/profile", "/farm/history", "/farm/priorities"].includes(location.pathname)) ? "active" : ""}`
              }
            >
              <Icon size={20} strokeWidth={1.65} />
              <span>{t(`nav.${key}`)}</span>
              {key === "home" && <span className="active-dot" />}
            </NavLink>
          ))}
          <p className="nav-label nav-label-second">{t("nav.planGroup")}</p>
          {planNavigation.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={20} strokeWidth={1.65} />
              <span>{t(`nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-story">
            <Leaf
              className="story-leaf"
              size={50}
              strokeWidth={1}
              aria-hidden="true"
            />
            <span className="story-dots" aria-hidden="true">
              ✧
            </span>
            <p>{t("nav.tipTitle")}</p>
            <span>{t("nav.tipBody")}</span>
            <Link
              to="/start"
              className="story-link"
              aria-label={t("home.start")}
            >
              <ArrowUpRight size={19} className="directional" />
            </Link>
          </div>
          <NavLink to="/methodology" className="nav-item methodology-link">
            <BookOpen size={19} strokeWidth={1.6} />
            <span>{t("nav.methodology")}</span>
            <ChevronRight size={15} className="directional ms-auto" />
          </NavLink>
          <div className="event-credit">
            <Orbit size={29} strokeWidth={1.1} />
            <div>
              <strong>{t("nav.event")}</strong>
              <span>{t("nav.eventYear")}</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace" inert={mobile && open}>
        <header className="topbar">
          <div className="topbar-context">
            <button
              className="mobile-menu icon-button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-label={t("common.menu")}
            >
              <Menu size={23} />
            </button>
            <span className="context-mark">
              <Leaf size={17} />
            </span>
            <span>{t("nav.companion")}</span>
            <ChevronRight
              size={14}
              className="breadcrumb-chevron directional"
            />
            <span className="breadcrumb-current">{t(`nav.${section}`)}</span>
          </div>
          <div className="topbar-actions">
            <LanguageToggle />
            <span className="topbar-divider" />
            <Link
              className="icon-button help-button"
              to="/methodology#limitations"
              aria-label={t("common.help")}
            >
              <CircleHelp size={21} strokeWidth={1.5} />
            </Link>
            <span
              className="workspace-avatar"
              aria-label={t(simulated ? "common.demo" : "nav.workspace")}
            >
              <Sprout size={20} />
            </span>
          </div>
        </header>
        <SimulatedBanner simulated={simulated} />
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="persistent-footer">
          <span>
            <ShieldCheck size={14} aria-hidden="true" />
            {t("common.decisionNote")}
          </span>
          <span className="footer-science">
            <span className="tiny-dot" />
            {t("home.science")}
          </span>
        </footer>
      </div>
    </div>
  );
}
