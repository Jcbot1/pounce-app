// ════════════════════════════════════════════════════════════════════════
// IMPORTS
// ════════════════════════════════════════════════════════════════════════

const { useState, useEffect, useLayoutEffect, useRef, Fragment, useMemo } = React;

const APP_VERSION = "1.0.1";

const FF_SANS  = "'DM Sans', sans-serif";
const FF_SERIF = "'Fraunces', serif";

const IC  = { fill: "none", stroke: "currentColor", strokeWidth: 2,   strokeLinecap: "round", strokeLinejoin: "round" };
const IC5 = { fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" };

function renderText(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const result = [];
  let ulItems = [], olItems = [];

  function flushUl() {
    if (ulItems.length) {
      result.push(<ul key={result.length} style={{ margin: "0.25rem 0", paddingLeft: "1.4rem", listStyleType: "disc", listStylePosition: "outside" }}>
        {ulItems.map((item, i) => <li key={i} style={{ marginBottom: "0.1rem", display: "list-item", listStyleType: "disc", whiteSpace: "pre-wrap" }}>{item}</li>)}
      </ul>);
      ulItems = [];
    }
  }
  function flushOl() {
    if (olItems.length) {
      result.push(<ol key={result.length} style={{ margin: "0.25rem 0", paddingLeft: "1.4rem", listStyleType: "decimal" }}>
        {olItems.map((item, i) => <li key={i} style={{ marginBottom: "0.1rem", display: "list-item", whiteSpace: "pre-wrap" }}>{item}</li>)}
      </ol>);
      olItems = [];
    }
  }

  lines.forEach((line, i) => {
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (ulMatch) { flushOl(); ulItems.push(ulMatch[1]); }
    else if (olMatch) { flushUl(); olItems.push(olMatch[1]); }
    else {
      flushUl(); flushOl();
      if (line === "") {
        // Empty line — always add a break to preserve spacing
        result.push(<br key={result.length} />);
      } else {
        result.push(<span key={result.length} style={{ whiteSpace: "pre-wrap" }}>{line}{i < lines.length - 1 ? <br/> : null}</span>);
      }
    }
  });
  flushUl(); flushOl();
  return <>{result}</>;
}


function useToast() {
  const [toast, setToast] = useState(null);
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }
  const ToastEl = toast ? (
    <div style={{
      position: "fixed", bottom: "6rem", left: "50%", transform: "translateX(-50%)",
      background: T.mode === "light" ? "rgba(30,26,46,0.92)" : "rgba(255,255,255,0.92)",
      color: T.mode === "light" ? "#fff" : "#1e1a2e",
      padding: "0.75rem 1.25rem", borderRadius: "99px",
      fontFamily: FF_SANS, fontSize: "0.9rem", fontWeight: 500,
      zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      maxWidth: "calc(100vw - 2rem)", textAlign: "center",
      animation: "cardFadeUp 0.2s ease forwards",
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    }}>{toast}</div>
  ) : null;
  return { showToast, ToastEl };
}

// ════════════════════════════════════════════════════════════════════════
// TOAST & MODAL PRIMITIVES
// ════════════════════════════════════════════════════════════════════════

function Modal({ onClose, children, zIndex = 1000 }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return ReactDOM.createPortal(
    <div style={{
      position: "fixed", inset: 0, background: "#00000099", zIndex,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      animation: "sf-blur-fix 0.01s linear forwards",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
    }}
      onWheel={e => e.preventDefault()} onTouchMove={e => e.preventDefault()}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>,
    document.body
  );
}

// ════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════════════

// ── FAB menu button styles ─────────────────────────────────────────────────
const fabMenuBtn     = () => ({ background: "transparent", border: "none", height: "44px", paddingLeft: "1.1rem", paddingRight: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontFamily: FF_SANS, fontSize: "0.9rem", fontWeight: 500, color: T.text, whiteSpace: "nowrap" });
const fabMenuJsonBtn = () => ({ background: "transparent", border: "none", height: "44px", width: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: FF_SANS, fontSize: "0.8rem", lineHeight: 1, textAlign: "center", color: T.muted, flexShrink: 0 });
const fabMenuWrap    = () => ({ display: "flex", alignItems: "center", background: T.surface, border: "1px solid " + T.border, borderRadius: "99px", overflow: "hidden", boxShadow: T.mode === "light" ? "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)" : "0 2px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)" });

// ── Icon Button ────────────────────────────────────────────────────────────
function IconButton({ onClick, onPointerDown, children, variant = "default", size = 28, style: extraStyle }) {
  const bg    = variant === "danger" ? T.red  + "18" : T.surface2;
  const color = variant === "danger" ? T.red        : T.muted;
  return (
    <button onClick={onClick} onPointerDown={onPointerDown}
      style={{ background: bg, border: "none", cursor: "pointer", color,
        display: "flex", alignItems: "center", justifyContent: "center",
        width: size + "px", height: size + "px", borderRadius: "50%", flexShrink: 0, ...extraStyle }}>
      {children}
    </button>
  );
}


function FabMenuButton({ onClick, children, color, jsonBtn = false, bare = false }) {
  if (bare) return (
    <button onClick={onClick} {...surfacePress()} style={{
      background: "transparent", border: "none", cursor: "pointer",
      height: "44px",
      ...(jsonBtn
        ? { width: "44px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF_SANS, fontSize: "0.8rem", color: color || T.muted, flexShrink: 0 }
        : { paddingLeft: "1.1rem", paddingRight: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: FF_SANS, fontSize: "0.9rem", fontWeight: 500, color: color || T.text, whiteSpace: "nowrap" }
      ),
    }}>
      {children}
    </button>
  );
  return (
    <>
      <button onClick={onClick} {...surfacePress()}
        className="button button-raised button-round"
        style={{
          background: T.surface, color: color || T.text,
          fontFamily: FF_SANS, fontSize: "0.9rem", fontWeight: 500,
          textTransform: "none", whiteSpace: "nowrap",
          padding: "0 1.1rem", height: "44px", width: "auto",
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
        }}>
        {children}
      </button>
    </>
  );
}

// ── Glass Button ───────────────────────────────────────────────────────────
// For frosted/glassy circular icon buttons (hamburger, back chevron, etc.)
function GlassButton({ onClick, onPointerDown, children, size = 44, style: extraStyle, divRef }) {
  return (
    <div ref={divRef} data-glass-btn="1" style={{
      width: size, height: size, borderRadius: "99px", flexShrink: 0,
      background: T.surface,
      border: "1px solid " + T.border,
      boxShadow: T.mode === "light"
        ? "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05), inset 1px 1px 0 rgba(255,255,255,0.6), inset -1px -1px 0 rgba(255,255,255,0.2)"
        : "0 2px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(255,255,255,0.04)",
      display: "flex", ...extraStyle,
    }}>
      <button onClick={onClick} onPointerDown={onPointerDown} {...glassPress()} style={{
        flex: 1, background: "transparent", border: "none",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: T.text, borderRadius: "99px", overflow: "hidden",
      }}>
        {children}
      </button>
    </div>
  );
}

// ── Ghost Button ───────────────────────────────────────────────────────────
function GhostButton({ onClick, children, small, style: extraStyle }) {
  return (
    <button onClick={onClick} {...glassPress()}
      className={`button button-outline button-round${small ? ' button-small' : ''}`}
      style={{ fontFamily: FF_SANS, color: T.text, borderColor: T.border, textTransform: "none", WebkitTapHighlightColor: "transparent", ...(!small && { height: "44px" }), ...extraStyle }}>
      {children}
    </button>
  );
}

// ── Danger Button ──────────────────────────────────────────────────────────
function DangerButton({ onClick, children, small, style: extraStyle }) {
  return (
    <button onClick={onClick} {...dangerPress()}
      className={`button button-fill button-round${small ? ' button-small' : ''}`}
      style={{ fontFamily: FF_SANS, background: T.red, color: "#fff", textTransform: "none", WebkitTapHighlightColor: "transparent", ...(!small && { height: "44px" }), ...extraStyle }}>
      {children}
    </button>
  );
}

// ── Primary Button ─────────────────────────────────────────────────────────
function PrimaryButton({ onClick, children, small, disabled, style: extraStyle }) {
  return (
    <button onClick={onClick} {...(disabled ? {} : surfacePress())}
      disabled={disabled}
      className={`button button-fill button-round${small ? ' button-small' : ''}`}
      style={{ fontFamily: FF_SANS, background: disabled ? T.surface2 : T.accent, color: disabled ? T.muted : "#fff", textTransform: "none", WebkitTapHighlightColor: "transparent", ...(!small && { height: "44px" }), ...extraStyle }}>
      {children}
    </button>
  );
}

// ── Success Button ─────────────────────────────────────────────────────────
function SuccessButton({ onClick, children, small, style: extraStyle }) {
  return (
    <button onClick={onClick} {...glassPress()}
      className={`button button-fill button-round${small ? ' button-small' : ''}`}
      style={{ fontFamily: FF_SANS, background: T.green, color: "#fff", textTransform: "none", WebkitTapHighlightColor: "transparent", ...(!small && { height: "44px" }), ...extraStyle }}>
      {children}
    </button>
  );
}

// ── Modal Card ─────────────────────────────────────────────────────────────
// Inner card for all modals. Change once to update every modal.
function ModalCard({ children, maxWidth = 420, pad = "1.75rem", scroll = false, style: extraStyle }) {
  return (
    <div style={{
      background: T.mode === "light" ? "#fff" : T.surface, border: "none",
      borderRadius: "16px",
      boxShadow: T.mode === "light"
        ? "0px 10px 20px rgba(0,0,0,0.19), 0px 6px 6px rgba(0,0,0,0.23)"
        : "0px 10px 20px rgba(0,0,0,0.45), 0px 6px 6px rgba(0,0,0,0.4)",
      width: "100%", maxWidth,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      ...(scroll ? { maxHeight: "80vh" } : {}),
      ...extraStyle,
    }}
      onClick={e => e.stopPropagation()}>
      <div style={{
        padding: pad,
        display: "flex", flexDirection: "column", gap: "1.25rem",
        ...(scroll ? { overflowY: "auto", maxHeight: "80vh" } : {}),
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Kebab Menu Item ────────────────────────────────────────────────────────
// Single source for all kebab/context menu row buttons.
function KebabMenuItem({ onClick, children, color, danger = false }) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const hoverBg = danger
    ? (T.mode === "light" ? T.red + "12" : T.red + "18")
    : (T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)");
  return (
    <button
      onClick={onClick}
      {...(danger ? dangerPress() : surfacePress())}
      onMouseEnter={canHover ? e => { e.currentTarget.style.background = hoverBg; } : undefined}
      onMouseLeave={canHover ? e => { e.currentTarget.style.background = "transparent"; } : undefined}
      style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        width: "100%", textAlign: "left", background: "transparent",
        border: "none", padding: "0.95rem 1.1rem",
        fontFamily: FF_SANS, fontSize: "0.9rem",
        color: color || T.text, cursor: "pointer",
      }}>
      {children}
    </button>
  );
}

// ── Icon primitives ──────────────────────────────────────────────────────────
function FilterIcon({ size = 14, sw = 2.5 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...(sw === 2.5 ? IC5 : IC)}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}
function TrashIcon({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" {...IC}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
// ── Hamburger Menu Item ────────────────────────────────────────────────────
function HamburgerMenuItem({ onClick, children, right, color, danger = false, style: extraStyle }) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const hoverBg = danger
    ? (T.mode === "light" ? T.red + "12" : T.red + "18")
    : (T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)");
  return (
    <button onClick={onClick} {...(danger ? dangerPress() : surfacePress())}
      onMouseEnter={canHover ? e => { e.currentTarget.style.background = hoverBg; } : undefined}
      onMouseLeave={canHover ? e => { e.currentTarget.style.background = "transparent"; } : undefined}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", textAlign: "left", background: "transparent", border: "none",
        padding: "1rem 1.25rem", fontFamily: FF_SANS, fontSize: "0.95rem",
        color: color || T.text, cursor: "pointer", ...extraStyle,
      }}>
      {children}
      {right && <span>{right}</span>}
    </button>
  );
}

// ── Hamburger Section Header ───────────────────────────────────────────────
function HamburgerSectionHeader({ label, onBack, right, noBorder }) {
  return (
    <div style={{ padding: "0.6rem 0.75rem 0.6rem 0.4rem", borderBottom: noBorder ? "none" : "1px solid " + T.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <button onClick={onBack} {...surfacePress()} style={{ background: "none", border: "none", borderRadius: "99px", color: T.muted2, cursor: "pointer", padding: 0, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" {...IC5}><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p style={{ fontFamily: FF_SANS, fontSize: "0.72rem", letterSpacing: "0.1em", color: T.muted2 }}>{label}</p>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ── Answer Button ──────────────────────────────────────────────────────────
// Quiz answer choice button (single, multi, matching)
function AnswerButton({ onClick, children, bg, color, submitted, label, style: extraStyle }) {
  return (
    <button onClick={onClick}
      className="button button-raised"
      style={{
        background: bg, color, borderRadius: "12px", padding: "1.1rem 1.25rem",
        textAlign: "left", cursor: submitted ? "default" : "pointer", pointerEvents: submitted ? "none" : "auto",
        fontFamily: FF_SANS, fontSize: "0.93rem", lineHeight: 1.5,
        display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "0.7rem",
        transition: "all 0.15s", whiteSpace: "pre-wrap", textTransform: "none",
        width: "100%", height: "auto", minHeight: "52px", ...extraStyle,
      }}>
      {label && (
        <span style={{ minWidth: "20px", height: "20px", border: "1px solid currentColor", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", flexShrink: 0, marginTop: "2px" }}>
          {label}
        </span>
      )}
      {children}
    </button>
  );
}

// ── Session Option Button ──────────────────────────────────────────────────
// Session picker mode/count/timer option buttons
function OptionButton({ onClick, children, active = false, disabled = false, style: extraStyle }) {
  return (
    <button onClick={onClick} {...glassPress()}
      className={`button button-raised button-round${active ? ' button-fill' : ''}`}
      style={{
        padding: "1.8rem 0.9rem", textAlign: "left",
        display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "0.65rem",
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%", opacity: disabled ? 0.45 : 1,
        fontFamily: FF_SANS, fontSize: "0.95rem",
        WebkitTapHighlightColor: "transparent",
        height: "auto", minHeight: "44px",
        textTransform: "none", whiteSpace: "normal",
        ...(active ? { background: T.accent, color: "#fff" } : { background: T.mode === "dark" ? T.surface2 : T.surface, color: T.text }),
        ...extraStyle,
      }}>
      {children}
    </button>
  );
}

// ── Tag Chip ───────────────────────────────────────────────────────────────
// Read-only accent tag pill (shown on set cards, results, etc.)
const TAG_PALETTE = [
  "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899",
];
function tagColor(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

function TagChip({ tag }) {
  const color = tagColor(tag);
  return (
    <span style={{
      display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: "99px",
      fontSize: "0.63rem", fontFamily: FF_SANS, letterSpacing: "0.1em",
      background: color, color: "#fff", fontWeight: 600,
      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }}>{tag}</span>
  );
}

// ── Editor Tag Chip ────────────────────────────────────────────────────────
// Interactive tag pill in the editor (tappable to remove)
function EditorTagChip({ tag, onRemove }) {
  const color = tagColor(tag);
  return (
    <button onClick={onRemove} {...primaryPress()} style={{
      display: "inline-flex", alignItems: "center", gap: "0.35rem",
      padding: "0.38rem 0.9rem", borderRadius: "99px", border: "none", cursor: "pointer",
      fontFamily: FF_SANS, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.08em",
      background: color, color: "#fff", height: "auto", width: "auto",
      textShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }}>
      {tag}
      <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>✕</span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════
// STUDI MASCOT
// ════════════════════════════════════════════════════════════════════════

// ── App Card ───────────────────────────────────────────────────────────────
// Unified tappable card used across Sets, History, and Search screens.
function AppCard({ onClick, children, style: extraStyle }) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  return (
    <div
      onClick={onClick}
      {...primaryPress()}
      style={{
        ...card({ marginBottom: "0.6rem" }),
        cursor: "pointer",
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        ...extraStyle,
      }}
      onMouseEnter={canHover ? e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = T.mode === "light"
          ? "0px 10px 20px rgba(0,0,0,0.19), 0px 6px 6px rgba(0,0,0,0.23)"
          : "0px 10px 20px rgba(0,0,0,0.45), 0px 6px 6px rgba(0,0,0,0.4)";
      } : undefined}
      onMouseLeave={canHover ? e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = T.mode === "light"
          ? "0 1px 4px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08)"
          : "0 1px 4px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)";
      } : undefined}
    >
      {children}
    </div>
  );
}

// ── Hint Button ────────────────────────────────────────────────────────────
// Reusable hint button + popup used in both regular and flashcard review
function HintButton({ hint, hintOpen, setHintOpen, examMode, renderText }) {
  const btnRef = useRef(null);
  const [popupPos, setPopupPos] = useState({ top: "4rem", right: "1rem" });

  useLayoutEffect(() => {
    if (!hintOpen || !btnRef.current) return;
    function updatePos() {
      const r = btnRef.current.getBoundingClientRect();
      const popupW = Math.min(360, window.innerWidth - 32);
      const rightFromBtn = window.innerWidth - r.right;
      setPopupPos({
        top: r.bottom + 8 + "px",
        right: Math.min(rightFromBtn, window.innerWidth - popupW - 16) + "px",
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, { passive: true, capture: true });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, { capture: true });
      window.removeEventListener("resize", updatePos);
    };
  }, [hintOpen]);

  if (!hint || examMode) return null;
  return (
    <div style={{ position: "relative" }}>
      {hintOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setHintOpen(false)} />
          <div className="menu-open" style={{
            position: "fixed",
            top: popupPos.top,
            right: popupPos.right,
            background: T.mode === "light" ? T.accent + "06" : T.accent + "08",
            backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
            border: "1px solid " + T.accent + "22",
            borderRadius: "16px", padding: "0.9rem 1rem",
            boxShadow: menuShadow(),
            width: "min(360px, calc(100vw - 2rem))", zIndex: 10,
            maxHeight: "60vh", overflowY: "auto", WebkitOverflowScrolling: "touch",
          }}>
            <p style={{ color: T.muted, fontSize: "0.63rem", fontFamily: FF_SANS, letterSpacing: "0.1em", marginBottom: "0.4rem" }}>HINT</p>
            <p style={{ color: T.text, fontSize: "0.9rem", fontFamily: FF_SANS, lineHeight: 1.6 }}>{renderText(hint)}</p>
          </div>
        </>
      )}
      <button ref={btnRef} onClick={e => { e.stopPropagation(); setHintOpen(o => !o); }}
        className={`button button-round ${hintOpen ? 'button-tonal' : 'button-raised'}`}
        style={{
          width: "36px", height: "36px", transition: "background 0.2s, box-shadow 0.2s",
          ...(hintOpen ? { background: T.accent + "25", color: T.accent } : { background: T.surface, color: T.text }),
        }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={hintOpen ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6M10 21h4M12 2a7 7 0 0 1 4 12.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26A7 7 0 0 1 12 2z" />
        </svg>
      </button>
    </div>
  );
}

// ── MascotMonoIcon — logosmall.svg ───────────────────────────────────────────
function MascotMonoIcon({ width = 40, height = 40, color }) {
  const c = color || T.accent;
  return (
    <div style={{
      width, height, flexShrink: 0,
      backgroundColor: c,
      WebkitMaskImage: "url(./logosmall.svg)",
      WebkitMaskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskImage: "url(./logosmall.svg)",
      maskSize: "contain",
      maskRepeat: "no-repeat",
      maskPosition: "center",
    }} />
  );
}

// ── PounceLogo — mascot icon + wordmark ─────────────────────────────────────
function PounceLogo({ height = 28, theme, stacked = false }) {
  const t = theme || T;
  const iconW = stacked ? height * 2.5 : height * 1.1;
  const iconH = stacked ? Math.round(iconW * 348 / 411) : iconW;
  return (
    <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", alignItems: "center", gap: stacked ? "0.15rem" : "0.4rem" }}>
      <MascotMonoIcon width={iconW} height={iconH} color={t.accent} />
      <svg height={height} viewBox="0 0 154 52" style={{ overflow: "visible", display: "block" }} xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="42" fontFamily={FF_SERIF} fontSize="44" fontWeight="600" fill={t.accent} letterSpacing="0.5">Pounce</text>
      </svg>
    </div>
  );
}

function Mochi({ size = 100 }) {
  return <MascotMonoIcon width={size} height={size} color={T.accent} />;
}


// ════════════════════════════════════════════════════════════════════════
// PERSISTENCE
// ════════════════════════════════════════════════════════════════════════

// ── Responsive breakpoints ─────────────────────────────────────────────────
const BREAKPOINT_TABLET  = 768;
const BREAKPOINT_DESKTOP = 1200;
const SIDEBAR_WIDTH      = 240;
const SIDEBAR_COLLAPSED  = 64;

function useWindowWidth() {
  const [width, setWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 375);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}


const VALID_TYPES = new Set(['single', 'multi', 'dropdown', 'matching', 'flashcard']);

const HISTORY_SORT_OPTIONS = [
  { id: "date-desc",  label: "Newest first" },
  { id: "date-asc",   label: "Oldest first" },
  { id: "score-desc", label: "Score: high → low" },
  { id: "score-asc",  label: "Score: low → high" },
];

// ── Utility: export JSON file ──────────────────────────────────────────────
function exportAll(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateSet(s) {
  if (!s || typeof s !== 'object') return false;
  if (!s.id || typeof s.name !== 'string' || !Array.isArray(s.questions)) return false;
  return s.questions.every(q => {
    if (!q || !q.id || !VALID_TYPES.has(q.type)) return false;
    if (q.type === 'single' || q.type === 'multi')  return Array.isArray(q.correct) && Array.isArray(q.options);
    if (q.type === 'dropdown')  return Array.isArray(q.dropdowns);
    if (q.type === 'matching')  return Array.isArray(q.pairs);
    if (q.type === 'flashcard') return typeof q.back === 'string';
    return false;
  });
}

function validateSession(s) {
  if (!s || typeof s !== 'object') return false;
  if (!s.id || typeof s.setName !== 'string' || !Array.isArray(s.results)) return false;
  return s.results.every(r => r && typeof r.correct === 'boolean');
}

// ── Persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "az305_study_sets";
const HISTORY_KEY = "az305_results_history";

// Compressed localStorage helpers (LZString loaded via CDN in index.html).
// decompressFromUTF16 returns null when the value isn't LZ-compressed, so we
// fall back to the raw string — this gives zero-cost migration of existing data.
function lzGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = LZString.decompressFromUTF16(raw);
    return d != null ? d : raw;
  } catch { return null; }
}
function lzSet(key, value) {
  localStorage.setItem(key, LZString.compressToUTF16(value));
}

// ── 1. Proper UUID v4 generator ───────────────────────────────────────────────
function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── 2. DataService — single source of truth for all data operations ───────────
// Currently backed by localStorage. Swap these implementations for API calls
// when moving to a cloud backend. All functions return Promises to match
// the async signature a real API would use.
const DataService = {
  getSets: async () => {
    try {
      const sets = JSON.parse(lzGet(STORAGE_KEY)) || [];
      // Migrate: group string → tags array, add timestamps if missing
      return sets.map(s => ({
        ...s,
        tags: s.tags || (s.group ? [s.group] : []),
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
      }));
    } catch { return []; }
  },
  saveSets: async (sets) => {
    lzSet(STORAGE_KEY, JSON.stringify(sets));
  },
  getHistory: async () => {
    try { return JSON.parse(lzGet(HISTORY_KEY)) || []; }
    catch { return []; }
  },
  saveHistory: async (history) => {
    lzSet(HISTORY_KEY, JSON.stringify(history));
  },
};

// Keep synchronous shims for the few places that still call these directly
// (will be removed when fully async)
function loadSets() {
  try {
    const sets = JSON.parse(lzGet(STORAGE_KEY)) || [];
    return sets.map(s => ({
      ...s,
      tags: s.tags || (s.group ? [s.group] : []),
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: s.updatedAt || new Date().toISOString(),
    }));
  } catch { return []; }
}
function saveSets(s) { lzSet(STORAGE_KEY, JSON.stringify(s)); }
function loadHistory() { try { return JSON.parse(lzGet(HISTORY_KEY)) || []; } catch { return []; } }
function saveHistory(h) { lzSet(HISTORY_KEY, JSON.stringify(h)); }

// Average per-question accuracy across sessions. Each unique question ID counts once
// regardless of how many sessions it appeared in, so quick quizzes don't skew the result.
function computeMastery(sessions) {
  const qMap = {};
  sessions.forEach(s => {
    if (!s.results) return;
    s.results.forEach(r => {
      if (!qMap[r.qId]) qMap[r.qId] = { correct: 0, total: 0 };
      qMap[r.qId].total++;
      if (r.correct) qMap[r.qId].correct++;
    });
  });
  const vals = Object.values(qMap);
  return vals.length
    ? Math.round(vals.reduce((sum, q) => sum + q.correct / q.total, 0) / vals.length * 100)
    : null;
}

function blankQuestion(type = "single") {
  const base = { id: uid(), type, topic: "", question: "", hint: "", explanation: "" };
  if (type === "single")   return { ...base, options: ["", "", ""], correct: [] };
  if (type === "multi")    return { ...base, options: ["", "", "", ""], correct: [], selectCount: 2 };
  if (type === "dropdown") return {
    ...base,
    dropdowns: [
      { id: uid(), rowLabel: "", options: ["", ""], correct: null },
    ],
  };
  if (type === "matching") return {
    ...base,
    pairs: [
      { id: uid(), term: "", match: "" },
      { id: uid(), term: "", match: "" },
    ],
    distractors: [],
  };
  if (type === "flashcard") return { ...base, back: "" };
}

function blankSet() {
  const now = new Date().toISOString();
  return { id: uid(), name: "New Study Set", tags: [], questions: [], createdAt: now, updatedAt: now };
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// Returns { options: string[], originalIndices: number[] }
// originalIndices[i] = the original index of the option now at position i
function shuffleOptions(options) {
  const indexed = options.map((opt, i) => ({ opt, orig: i }));
  const shuffled = shuffle(indexed);
  return {
    options: shuffled.map(x => x.opt),
    originalIndices: shuffled.map(x => x.orig),
  };
}

// Build a shuffled view of a question's options once per question mount.
// For dropdown questions options inside each dropdown are also shuffled.
function buildShuffledQuestion(q) {
  if (q.type === "single" || q.type === "multi") {
    const { options, originalIndices } = shuffleOptions(q.options);
    // correct set expressed in NEW (display) indices
    const correctDisplay = q.correct.map(origIdx => originalIndices.indexOf(origIdx));
    return { ...q, options, originalIndices, correct: correctDisplay };
  }
  if (q.type === "dropdown") {
    const dropdowns = q.dropdowns.map(dd => {
      const { options, originalIndices } = shuffleOptions(dd.options);
      return { ...dd, options, originalIndices, correct: originalIndices.indexOf(dd.correct) };
    });
    return { ...q, dropdowns };
  }
  if (q.type === "matching") {
    return { ...q, pairs: shuffle(q.pairs) };
  }
  return q;
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel, extraButton }) {
  return (
    <Modal onClose={onCancel}>
      <ModalCard pad="2.25rem" maxWidth={360}>
        <div>
          <h3 style={{ fontFamily: FF_SERIF, fontWeight: 300, fontSize: "1.15rem", color: T.text, marginBottom: "0.4rem" }}>
            {title}
          </h3>
          {message && (
            <p style={{ fontFamily: FF_SANS, fontSize: "0.9rem", color: T.muted2, lineHeight: 1.55 }}>
              {message}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexDirection: "column" }}>
          {extraButton}
          <DangerButton onClick={onConfirm} style={{ width: "100%", justifyContent: "center" }}>{confirmLabel}</DangerButton>
          <GhostButton onClick={onCancel} style={{ width: "100%", justifyContent: "center" }}>Cancel</GhostButton>
        </div>
      </ModalCard>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════
// THEME & ACCENT
// ════════════════════════════════════════════════════════════════════════

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEME_KEY         = "studyapp_theme";
const ACCENT_KEY        = "studyapp_accent";
const BG_STYLE_KEY      = "studyapp_bg_style";
const PROFILE_NAME_KEY  = "studyapp_profile_name";
const PROFILE_ICON_KEY  = "studyapp_profile_iconid";
const PROFILE_BG_KEY    = "studyapp_profile_bg";
const PROFILE_ICOLOR_KEY= "studyapp_profile_iconcolor";

const PROFILE_ICON_DEFS = [
  { id: "book",    svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { id: "bolt",    svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { id: "brain",   svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-3 2.5 2.5 0 0 1-1.5-4.7V11a5 5 0 0 1 5-5z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-3 2.5 2.5 0 0 0 1.5-4.7V11a5 5 0 0 0-5-5z"/></svg> },
  { id: "star",    svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { id: "rocket",  svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> },
  { id: "bulb",    svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> },
  { id: "target",  svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { id: "trophy",  svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 4 17 4 7 20 7 20 17 16 17"/><polygon points="8 21 16 21 16 17 8 17 8 21"/><path d="M10 7V3H14V7"/></svg> },
  { id: "owl",     svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-4 0-7 3-7 7 0 2.5 1.5 5 3 6.5V18h8v-2.5c1.5-1.5 3-4 3-6.5 0-4-3-7-7-7z"/><circle cx="9" cy="9" r="1.5" fill={c}/><circle cx="15" cy="9" r="1.5" fill={c}/><path d="M9 15s1 1 3 1 3-1 3-1"/><line x1="12" y1="18" x2="12" y2="21"/><line x1="9" y1="21" x2="15" y2="21"/></svg> },
  { id: "flame",   svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg> },
  { id: "grad",    svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
  { id: "compass", svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
  { id: "coffee",  svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg> },
  { id: "paw",     svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14.7 13.5c-1.1 -2 -1.441 -2.5 -2.7 -2.5c-1.259 0 -1.736 .755 -2.836 2.747c-.942 1.703 -2.846 1.845 -3.321 3.291c-.097 .265 -.145 .677 -.143 .962c0 1.176 .787 2 1.8 2c1.259 0 3 -1 4.5 -1s3.241 1 4.5 1c1.013 0 1.8 -.823 1.8 -2c0 -.285 -.049 -.697 -.146 -.962c-.475 -1.451 -2.512 -1.835 -3.454 -3.538"/><path d="M20.188 8.082a1.039 1.039 0 0 0 -.406 -.082h-.015c-.735 .012 -1.56 .75 -1.993 1.866c-.519 1.335 -.28 2.7 .538 3.052c.129 .055 .267 .082 .406 .082c.739 0 1.575 -.742 2.011 -1.866c.516 -1.335 .273 -2.7 -.54 -3.052l-.001 0"/><path d="M9.474 9c.055 0 .109 0 .163 -.011c.944 -.128 1.533 -1.346 1.32 -2.722c-.203 -1.297 -1.047 -2.267 -1.932 -2.267c-.055 0 -.109 0 -.163 .011c-.944 .128 -1.533 1.346 -1.32 2.722c.204 1.293 1.048 2.267 1.933 2.267"/><path d="M16.456 6.733c.214 -1.376 -.375 -2.594 -1.32 -2.722a1.164 1.164 0 0 0 -.162 -.011c-.885 0 -1.728 .97 -1.93 2.267c-.214 1.376 .375 2.594 1.32 2.722c.054 .007 .108 .011 .162 .011c.885 0 1.73 -.974 1.93 -2.267"/><path d="M5.69 12.918c.816 -.352 1.054 -1.719 .536 -3.052c-.436 -1.124 -1.271 -1.866 -2.009 -1.866c-.14 0 -.277 .027 -.407 .082c-.816 .352 -1.054 1.719 -.536 3.052c.436 1.124 1.271 1.866 2.009 1.866c.14 0 .277 -.027 .407 -.082"/></svg> },
  { id: "cat",     svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 3v10a8 8 0 1 1 -16 0v-10l3.432 3.432a7.963 7.963 0 0 1 4.568 -1.432c1.769 0 3.403 .574 4.728 1.546l3.272 -3.546"/><path d="M2 16h5l-4 4"/><path d="M22 16h-5l4 4"/><path d="M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M9 11v.01"/><path d="M15 11v.01"/></svg> },
  { id: "fish",    svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16.69 7.44a6.973 6.973 0 0 0 -1.69 4.56c0 1.747 .64 3.345 1.699 4.571"/><path d="M2 9.504c7.715 8.647 14.75 10.265 20 2.498c-5.25 -7.761 -12.285 -6.142 -20 2.504"/><path d="M18 11v.01"/><path d="M11.5 10.5c-.667 1 -.667 2 0 3"/></svg> },
  { id: "moon",    svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
  { id: "cookie",  svg: (c) => <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 13v.01"/><path d="M12 17v.01"/><path d="M12 12v.01"/><path d="M16 14v.01"/><path d="M11 8v.01"/><path d="M13.148 3.476l2.667 1.104a4 4 0 0 0 4.656 6.14l.053 .132a3 3 0 0 1 0 2.296q -.745 1.18 -1.024 1.852q -.283 .684 -.66 2.216a3 3 0 0 1 -1.624 1.623q -1.572 .394 -2.216 .661q -.712 .295 -1.852 1.024a3 3 0 0 1 -2.296 0q -1.203 -.754 -1.852 -1.024q -.707 -.292 -2.216 -.66a3 3 0 0 1 -1.623 -1.624q -.397 -1.577 -.661 -2.216q -.298 -.718 -1.024 -1.852a3 3 0 0 1 0 -2.296q .719 -1.116 1.024 -1.852q .257 -.62 .66 -2.216a3 3 0 0 1 1.624 -1.623q 1.547 -.384 2.216 -.661q .687 -.285 1.852 -1.024a3 3 0 0 1 2.296 0"/></svg> },
];

const PROFILE_COLOR_PAIRS = [
  { bg: "#1e3a5f", icon: "#60b4ff" }, // deep blue / sky
  { bg: "#3b1f5e", icon: "#c084fc" }, // deep purple / lavender
  { bg: "#1a4731", icon: "#4ade80" }, // deep green / mint
  { bg: "#5c1a1a", icon: "#f87171" }, // deep red / coral
  { bg: "#4a2c0a", icon: "#fb923c" }, // deep amber / orange
  { bg: "#1a3a4a", icon: "#22d3ee" }, // deep teal / cyan
  { bg: "#3d2a0a", icon: "#fbbf24" }, // deep brown / gold
  { bg: "#2d1a4a", icon: "#a78bfa" }, // deep violet / soft purple
  { bg: "#1a3a2a", icon: "#34d399" }, // forest / emerald
  { bg: "#4a1a2a", icon: "#f472b6" }, // deep rose / pink
  { bg: "#0f2a1a", icon: "#86efac" }, // dark forest / pale green
  { bg: "#1a1a3a", icon: "#818cf8" }, // midnight / indigo
  { bg: "#3a1a0a", icon: "#fdba74" }, // dark rust / peach
  { bg: "#0a2a3a", icon: "#67e8f9" }, // deep ocean / ice
  { bg: "#2a1a0a", icon: "#fcd34d" }, // dark walnut / yellow
  { bg: "#1a0a2a", icon: "#e879f9" }, // deep plum / fuchsia
  { bg: "#0a3a2a", icon: "#6ee7b7" }, // dark jade / aquamarine
  { bg: "#3a0a1a", icon: "#fda4af" }, // deep burgundy / rose
  { bg: "#1a2a0a", icon: "#bef264" }, // dark olive / lime
  { bg: "#2a2a2a", icon: "#e2e8f0" }, // charcoal / silver
];

function randomProfileCombo(currentId) {
  const icons = PROFILE_ICON_DEFS.filter(i => i.id !== currentId);
  const icon = icons[Math.floor(Math.random() * icons.length)];
  const color = PROFILE_COLOR_PAIRS[Math.floor(Math.random() * PROFILE_COLOR_PAIRS.length)];
  return { iconId: icon.id, bg: color.bg, iconColor: color.icon };
}

function ProfileIconDisplay({ iconId, bg, iconColor, size = 36 }) {
  const def = PROFILE_ICON_DEFS.find(d => d.id === iconId) || PROFILE_ICON_DEFS[0];
  return (
    <div style={{ width: size, height: size, borderRadius: "99px", background: bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: size * 0.58, height: size * 0.58 }}>
        {def.svg(iconColor, bg)}
      </div>
    </div>
  );
}

const ACCENT_SCHEMES = {
  purple:       { label: "Purple",        swatch: "#9333ea", gradient2: "#c084fc",
    dark:  { accent: "#9333ea", accent2: "#a855f7", purple: "#9333ea" },
    light: { accent: "#7e22ce", accent2: "#9333ea", purple: "#7e22ce" } },
  purple_pastel:{ label: "Soft Purple",   swatch: "#c4b5fd", gradient2: "#e9d5ff",
    dark:  { accent: "#c4b5fd", accent2: "#ddd6fe", purple: "#c4b5fd" },
    light: { accent: "#a78bfa", accent2: "#7c3aed", purple: "#a78bfa" } },
  blue:         { label: "Blue",          swatch: "#6366f1", gradient2: "#a78bfa",
    dark:  { accent: "#6366f1", accent2: "#818cf8", purple: "#6366f1" },
    light: { accent: "#4f46e5", accent2: "#6366f1", purple: "#4f46e5" } },
  blue_pastel:  { label: "Soft Blue",     swatch: "#bfdbfe", gradient2: "#ddd6fe",
    dark:  { accent: "#93c5fd", accent2: "#bfdbfe", purple: "#93c5fd" },
    light: { accent: "#60a5fa", accent2: "#2563eb", purple: "#60a5fa" } },
  teal:         { label: "Teal",          swatch: "#0d9488", gradient2: "#34d399",
    dark:  { accent: "#0d9488", accent2: "#2dd4bf", purple: "#0d9488" },
    light: { accent: "#0f766e", accent2: "#0d9488", purple: "#0f766e" } },
  teal_pastel:  { label: "Soft Teal",     swatch: "#99f6e4", gradient2: "#d1fae5",
    dark:  { accent: "#6ee7b7", accent2: "#a7f3d0", purple: "#6ee7b7" },
    light: { accent: "#2dd4bf", accent2: "#0f766e", purple: "#2dd4bf" } },
  amber:        { label: "Amber",         swatch: "#d4a800", gradient2: "#f59e0b",
    dark:  { accent: "#f0b429", accent2: "#fcd34d", purple: "#f0b429" },
    light: { accent: "#c27f00", accent2: "#d4a800", purple: "#c27f00" } },
  amber_pastel: { label: "Soft Amber",    swatch: "#fde68a", gradient2: "#fef3c7",
    dark:  { accent: "#fcd34d", accent2: "#fde68a", purple: "#fcd34d" },
    light: { accent: "#f59e0b", accent2: "#b45309", purple: "#f59e0b" } },
  pink:         { label: "Pink",          swatch: "#f472b6", gradient2: "#fb7185",
    dark:  { accent: "#f472b6", accent2: "#f9a8d4", purple: "#f472b6" },
    light: { accent: "#ec4899", accent2: "#db2777", purple: "#ec4899" } },
  pink_pastel:  { label: "Soft Pink",     swatch: "#fbcfe8", gradient2: "#fce7f3",
    dark:  { accent: "#f9a8d4", accent2: "#fbcfe8", purple: "#f9a8d4" },
    light: { accent: "#f472b6", accent2: "#be185d", purple: "#f472b6" } },
  coffee:       { label: "Coffee",        swatch: "#a0522d", gradient2: "#c8843a",
    dark:  { accent: "#c8843a", accent2: "#e09848", purple: "#c8843a" },
    light: { accent: "#8b4513", accent2: "#a0522d", purple: "#8b4513" } },
  coffee_pastel:{ label: "Soft Coffee",   swatch: "#d4a574", gradient2: "#e8c9a0",
    dark:  { accent: "#d4a574", accent2: "#e8c9a0", purple: "#d4a574" },
    light: { accent: "#b45309", accent2: "#7c2d12", purple: "#b45309" } },
  neutral:      { label: "Neutral",        swatch: "#94a3b8", gradient2: "#cbd5e1",
    dark:  { accent: "#94a3b8", accent2: "#cbd5e1", purple: "#94a3b8" },
    light: { accent: "#64748b", accent2: "#94a3b8", purple: "#64748b" } },
};

function buildTheme(mode, accentKey) {
  const base = mode === "light" ? {
    mode:    "light",
    bg:      "#f7f5f2",
    surface: "#fefcf9",
    surface2:"#f2efe9",
    border:  "#e5e0d8",
    border2: "#cec8be",
    green:   "#22c55e",
    red:     "#dc2626",
    yellow:  "#d97706",
    text:    "#171512",
    muted:   "#918e88",
    muted2:  "#635f5a",
  } : {
    mode:    "dark",
    bg:      "#0f0905",
    surface: "#181614",
    surface2:"#201e1b",
    border:  "#302c28",
    border2: "#423e3a",
    green:   "#22c55e",
    red:     "#ef4444",
    yellow:  "#f59e0b",
    text:    "#edeae6",
    muted:   "#88868a",
    muted2:  "#aeacb0",
  };
  const baseKey   = accentKey.replace(/_pastel$/, "");
  const pastelKey = baseKey + "_pastel";
  const effectiveKey = mode === "dark" && ACCENT_SCHEMES[pastelKey] ? pastelKey : baseKey;
  const scheme = ACCENT_SCHEMES[effectiveKey] || ACCENT_SCHEMES.purple;
  const built = { ...base, ...scheme.dark, gradient2: scheme.gradient2 };
  // Convert accent hex to rgb string for use in rgba()
  const hex = built.accent.replace("#", "");
  built.accentRgb = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)].join(",");
  return built;
}


function resolveTheme(theme) {
  if (theme === "system" || (theme && theme.startsWith("system_"))) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

// Module-level T — reassigned on theme/accent change, all components re-render via key
let T = buildTheme(
  resolveTheme(localStorage.getItem(THEME_KEY) || "system"),
  localStorage.getItem(ACCENT_KEY) || "purple"
);
// ST — sidebar theme, follows T unless overridden
let ST = T;

// ════════════════════════════════════════════════════════════════════════
// SET ICON LIBRARY
// ════════════════════════════════════════════════════════════════════════
const SET_ICONS = [
  { category: "Academic", icons: [
    { id: "atom",          label: "Science",      path: "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 21l0 .01M3 9l0 .01M21 9l0 .01M8 20.1a9 9 0 0 1 -5 -7.1M16 20.1a9 9 0 0 0 5 -7.1M6.2 5a9 9 0 0 1 11.4 0" },
    { id: "math",          label: "Math",         path: "M19 5h-7L8 19M5 5l14 14M5 19l4-4" },
    { id: "book",          label: "Book",         path: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" },
    { id: "pencil",        label: "Notes",        path: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" },
    { id: "flask",         label: "Chemistry",    path: "M9 3h6M9 3v6l-4.5 9A1 1 0 0 0 5.4 21h13.2a1 1 0 0 0 .9-1.5L15 9V3" },
    { id: "world",         label: "Geography",    path: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" },
    { id: "language",      label: "Language",     path: "M4 5h7M9 3v2c0 4.418-2.239 8-5 8M5 9c0 2.144 2.952 3.908 6.7 4M12 20l4-9 4 9M19.1 18h-6.2" },
    { id: "history",       label: "History",      path: "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0M12 7v5l3 3" },
    { id: "graduationcap", label: "Education",    path: "M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 2 3 6 3s6-1 6-3v-5" },
    { id: "calculator",    label: "Calculator",   path: "M4 5a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -14M8 8a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v1a1 1 0 0 1 -1 1h-6a1 1 0 0 1 -1 -1l0 -1M8 14l0 .01M12 14l0 .01M16 14l0 .01M8 17l0 .01M12 17l0 .01M16 17l0 .01" },
    { id: "clipboard",     label: "Exam",         path: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4" },
  ]},
  { category: "Technology", icons: [
    { id: "code",          label: "Code",         path: "M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16" },
    { id: "cpu",           label: "Hardware",     path: "M5 6a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -12M9 9h6v6h-6l0 -6M3 10h2M3 14h2M10 3v2M14 3v2M21 10h-2M21 14h-2M14 21v-2M10 21v-2" },
    { id: "cloud",         label: "Cloud",        path: "M6.657 18c-2.572 0 -4.657 -2.007 -4.657 -4.483c0 -2.475 2.085 -4.482 4.657 -4.482c.393 -1.762 1.794 -3.2 3.675 -3.773c1.88 -.572 3.956 -.193 5.444 1c1.488 1.19 2.162 3.007 1.77 4.769h.99c1.913 0 3.464 1.56 3.464 3.486c0 1.927 -1.551 3.487 -3.465 3.487h-11.878" },
    { id: "database",      label: "Data",         path: "M4 6a8 3 0 1 0 16 0a8 3 0 1 0 -16 0M4 6v6a8 3 0 0 0 16 0v-6M4 12v6a8 3 0 0 0 16 0v-6" },
    { id: "terminal",      label: "Terminal",     path: "M4 17l6-6-6-6M12 19h8" },
    { id: "shield",        label: "Security",     path: "M12 3l8 4v5c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V7l8-4z" },
    { id: "network",       label: "Network",      path: "M8 18a2 2 0 1 0 -4 0a2 2 0 0 0 4 0M20 6a2 2 0 1 0 -4 0a2 2 0 0 0 4 0M8 6a2 2 0 1 0 -4 0a2 2 0 0 0 4 0M20 18a2 2 0 1 0 -4 0a2 2 0 0 0 4 0M14 12a2 2 0 1 0 -4 0a2 2 0 0 0 4 0M7.5 7.5l3 3M7.5 16.5l3 -3M13.5 13.5l3 3M16.5 7.5l-3 3" },
    { id: "robot",         label: "AI",           path: "M12 8V4M8 8h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM10 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0M14 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0M6 17l-2 2M18 17l2 2" },
    { id: "wifi",          label: "Wifi",         path: "M12 18l.01 0M9.172 15.172a4 4 0 0 1 5.656 0M6.343 12.343a8 8 0 0 1 11.314 0" },
    { id: "smartphone",    label: "Mobile",       path: "M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14M11 4h2M12 17v.01" },
    { id: "bug",           label: "Debugging",    path: "M8 9a4 4 0 0 1 8 0M8 9H5M16 9h3M7 13H4M20 13h-3M7 17l-3 2M17 17l3 2M9 21h6M8 9v8a4 4 0 0 0 8 0V9" },
  ]},
  { category: "Professional", icons: [
    { id: "briefcase",     label: "Business",     path: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M12 12v4M10 14h4" },
    { id: "chart",         label: "Finance",      path: "M3 3v18h18M7 16l4-4 4 4 4-4" },
    { id: "stethoscope",   label: "Medical",      path: "M6 4h-1a2 2 0 0 0 -2 2v3.5a5.5 5.5 0 0 0 11 0v-3.5a2 2 0 0 0 -2 -2h-1M8 15a6 6 0 1 0 12 0v-3M11 3v2M6 3v2M18 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" },
    { id: "building",      label: "Architect",    path: "M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10" },
    { id: "music",         label: "Music",        path: "M3 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0M13 17a3 3 0 1 0 6 0a3 3 0 0 0 -6 0M9 17v-13h10v13M9 8h10" },
    { id: "plane",         label: "Aviation",     path: "M16 10h4a2 2 0 0 1 0 4h-4l-4 7H9l2-7H7l-2 2H2l2-4-2-4h3l2 2h4L9 3h3l4 7z" },
    { id: "heartbeat",     label: "Fitness",      path: "M3 12h4l3-9 4 18 3-9h4" },
    { id: "truck",         label: "Logistics",    path: "M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" },
    { id: "presentation",  label: "Marketing",    path: "M3 3h18v12H3zM8 21l4-6 4 6M12 15v2" },
    { id: "currency",      label: "Accounting",   path: "M15 11v.01M5.173 8.378a3 3 0 1 1 4.656 -1.377M16 4v3.803a6.019 6.019 0 0 1 2.658 3.197h1.341a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-1.342c-.336 .95 -.907 1.8 -1.658 2.473v2.027a1.5 1.5 0 0 1 -3 0v-.583a6.04 6.04 0 0 1 -1 .083h-4a6.04 6.04 0 0 1 -1 -.083v.583a1.5 1.5 0 0 1 -3 0v-2l0 -.027a6 6 0 0 1 4 -10.473h2.5l4.5 -3" },
    { id: "pill",         label: "Pharmacy",     path: "M4.5 12.5l8 -8a4.94 4.94 0 0 1 7 7l-8 8a4.94 4.94 0 0 1 -7 -7M8.5 8.5l7 7" },
  ]},
  { category: "Lifestyle", icons: [
    { id: "flame",         label: "Fire",         path: "M12 12c2-2.5 1-6-1-8 0 3.5-3 5-3 8a4 4 0 0 0 8 0c0-1.5-.5-3-1.5-4-.5 1.5-2 2-2.5 4z" },
    { id: "heart",         label: "Health",       path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" },
    { id: "trophy",        label: "Goal",         path: "M8 21h8M12 17v4M7 4H4v5a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V4h-3M7 4h10" },
    { id: "star",          label: "Star",         path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
    { id: "bolt",          label: "Energy",       path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
    { id: "moon",          label: "Night",        path: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" },
    { id: "sun",           label: "Day",          path: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" },
    { id: "camera",        label: "Photo",        path: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" },
    { id: "gamepad",       label: "Gaming",       path: "M12 5h3.5a5 5 0 0 1 0 10h-5.5l-4.015 4.227a2.3 2.3 0 0 1 -3.923 -2.035l1.634 -8.173a5 5 0 0 1 4.904 -4.019h3.4M14 15l4.07 4.284a2.3 2.3 0 0 0 3.925 -2.023l-1.6 -8.232M8 9v2M7 10h2M14 10h2" },
    { id: "bookopen",      label: "Reading",      path: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" },
    { id: "dumbbell",      label: "Gym",          path: "M2 12h1M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1M9 12h6M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2M22 12h-1" },
    { id: "chefhat",       label: "Cooking",      path: "M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6zM6 17h12" },
    { id: "compass",       label: "Travel",       path: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" },
    { id: "ball",          label: "Sport",        path: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 3c0 0-4 5-4 9s4 9 4 9M12 3c0 0 4 5 4 9s-4 9-4 9M3 12h18" },
    { id: "headphones",    label: "Audio",        path: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" },
  ]},
];



const inp = (extra = {}) => ({
  background: T.surface,
  border: "1.5px solid " + T.border,
  borderRadius: "8px",
  color: T.text,
  fontFamily: FF_SANS,
  fontSize: "1rem",
  padding: "0.7rem 1rem",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  WebkitAppearance: "none",
  ...extra,
});

function SnapTextarea({ style, maxLength, ...props }) {
  const ref = useRef(null);
  const len = (props.value || "").length;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [props.value]);

  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <textarea ref={ref} maxLength={maxLength}
        style={{ ...style, resize: "none", overflow: "hidden", paddingBottom: maxLength ? "1.4rem" : "1.25rem" }} {...props} />
      {maxLength && (
        <span style={{
          position: "absolute", bottom: "0.65rem", right: "0.65rem",
          fontFamily: FF_SANS, fontSize: "0.6rem",
          color: len >= maxLength ? T.red : len >= maxLength * 0.85 ? "#f59e0b" : T.muted,
          pointerEvents: "none", lineHeight: 1,
        }}>{len}/{maxLength}</span>
      )}
    </div>
  );
}

// ── EditorTextarea — auto-expanding textarea for all editor fields ─────────
function EditorTextarea({ value, onChange, placeholder, maxLength, rows = 3, noBorder = false }) {
  const ref = useRef(null);
  const len = (value || "").length;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        style={{ ...inp(), resize: "none", overflow: "hidden", lineHeight: 1.6,
          paddingBottom: maxLength ? "1.4rem" : "1.25rem",
          ...(noBorder ? { border: "none", borderRadius: 0, background: "transparent", boxShadow: "none" } : {}),
        }}
      />
      {maxLength && (
        <span style={{
          position: "absolute", bottom: "0.65rem", right: "0.65rem",
          fontFamily: FF_SANS, fontSize: "0.6rem",
          color: len >= maxLength ? T.red : len >= maxLength * 0.85 ? "#f59e0b" : T.muted,
          pointerEvents: "none", lineHeight: 1,
        }}>{len}/{maxLength}</span>
      )}
    </div>
  );
}

const menuShadow    = () => T.mode === "light"
  ? "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)"
  : "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)";

const menuPopupStyle = (extra = {}) => ({
  background: T.mode === "light" ? "rgba(255,255,255,1)" : "rgba(30,26,46,1)",
  backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
  border: "1px solid " + (T.mode === "light" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)"),
  borderRadius: "16px", overflow: "hidden",
  boxShadow: menuShadow(),
  ...extra,
});

const answerBgs = () => ({
  sel: T.mode === "light" ? T.accent + "18" : T.accent + "45",
  cor: T.mode === "light" ? T.green  + "18" : T.green  + "45",
  wro: T.mode === "light" ? T.red    + "18" : T.red    + "45",
});
const corBgCard = () => T.mode === "light" ? T.green + "18" : "#052e16";
const wroBgCard = () => T.mode === "light" ? T.red   + "18" : "#2d0a0a";

const card = (extra = {}) => ({
  background: T.mode === "light" ? "#fff" : "rgba(36,32,54,1)",
  borderRadius: "16px",
  border: "none",
  padding: "1rem",
  position: "relative",
  isolation: "isolate",
  boxShadow: T.mode === "light"
    ? "0 1px 4px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08)"
    : "0 1px 4px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
  ...extra,
});

const SET_CARD_SCROLL_GRID = {
  display: "grid",
  gridTemplateRows: "repeat(2, auto)",
  gridAutoFlow: "column",
  gridAutoColumns: "calc(100vw - 3.75rem)",
  columnGap: "0.75rem",
  overflowX: "auto",
  scrollbarWidth: "none",
  paddingLeft: "1.25rem",
  paddingRight: "0.75rem",
  paddingBottom: "0.5rem",
  marginLeft: "-1.25rem",
  marginRight: "-1.25rem",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "1.25rem",
};

// ════════════════════════════════════════════════════════════════════════
// PRESS HANDLERS
// ════════════════════════════════════════════════════════════════════════

// ── Press handlers ─────────────────────────────────────────────────────────
// Uses CSS classes to avoid React re-render wiping inline style changes.

const _addClass = (el, cls) => el.classList.add(...cls.split(' '));
const _remClass = (el, cls) => el.classList.remove(...cls.split(' '));
const _afterPress = (el, addCls, removeCls) => setTimeout(() => {
  el.style.transition = "background 0.3s ease";
  _remClass(el, removeCls);
  setTimeout(() => { el.style.transition = ""; }, 300);
}, 150);

const glassPress = () => ({
  onPointerDown: e => { const el = e.currentTarget; _remClass(el, 'press-glass-done'); _addClass(el, `press-glass ${T.mode}`); },
  onPointerUp:   e => { _afterPress(e.currentTarget, '', `press-glass ${T.mode}`); },
  onPointerLeave:e => { _afterPress(e.currentTarget, '', `press-glass ${T.mode}`); },
});


const surfacePress = () => ({
  onPointerDown: e => { const el = e.currentTarget; _remClass(el, 'press-surface-done'); _addClass(el, `press-surface ${T.mode}`); },
  onPointerUp:   e => { _afterPress(e.currentTarget, '', `press-surface ${T.mode}`); },
  onPointerLeave:e => { _afterPress(e.currentTarget, '', `press-surface ${T.mode}`); },
});

const dangerPress = () => ({
  onPointerDown: e => { const el = e.currentTarget; _remClass(el, 'press-danger-done'); _addClass(el, `press-danger ${T.mode}`); },
  onPointerUp:   e => { _afterPress(e.currentTarget, '', `press-danger ${T.mode}`); },
  onPointerLeave:e => { _afterPress(e.currentTarget, '', `press-danger ${T.mode}`); },
});


const primaryPress = () => ({
  onPointerDown: e => { const el = e.currentTarget; _remClass(el, 'press-primary-done'); _addClass(el, 'press-primary'); },
  onPointerUp:   e => { _afterPress(e.currentTarget, '', 'press-primary'); },
  onPointerLeave:e => { _afterPress(e.currentTarget, '', 'press-primary'); },
});
const Label = ({ children, style, required }) => (
  <p style={{ fontFamily: FF_SANS, fontSize: "0.67rem", letterSpacing: "0.12em", color: T.muted, marginBottom: "0.4rem", ...style }}>
    {required && <span style={{ color: T.red, marginRight: "0.2em" }}>*</span>}
    {children}
  </p>
);

const Divider = () => (
  <div style={{ display: "flex", alignItems: "center", margin: "1.25rem 0", gap: "0.6rem" }}>
    <div style={{ flex: 1, height: "1px", background: T.border }} />
    <svg width="14" height="14" viewBox="0 0 100 100" fill={T.border2}>
      <ellipse cx="50" cy="68" rx="22" ry="18"/>
      <ellipse cx="22" cy="46" rx="11" ry="13" transform="rotate(-15 22 46)"/>
      <ellipse cx="42" cy="32" rx="11" ry="13" transform="rotate(-5 42 32)"/>
      <ellipse cx="63" cy="32" rx="11" ry="13" transform="rotate(5 63 32)"/>
      <ellipse cx="80" cy="46" rx="11" ry="13" transform="rotate(15 80 46)"/>
    </svg>
    <div style={{ flex: 1, height: "1px", background: T.border }} />
  </div>
);

function Tag({ label, color }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "0.15rem 0.7rem", borderRadius: "99px",
      fontSize: "0.63rem", fontFamily: FF_SANS, letterSpacing: "0.1em",
      background: color + "22", color, border: "1px solid " + color + "44",
      maxWidth: "100%", minWidth: 0, verticalAlign: "middle",
    }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </span>
  );
}

const TYPE_META = {
  single:    { label: "SINGLE",    color: T.accent  },
  multi:     { label: "MULTI",     color: T.green   },
  dropdown:  { label: "DROPDOWN",  color: "#f59e0b" },
  matching:  { label: "MATCHING",  color: "#0ea5e9" },
  flashcard: { label: "FLASHCARD", color: "#a855f7" },
};

// ── Collapsible — animates height to the measured content height ──────────
function Collapsible({ open, children }) {
  const innerRef = useRef(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    if (innerRef.current) {
      const sh = innerRef.current.scrollHeight;
      if (sh !== h) setH(sh);
    }
  });
  const duration = Math.min(0.5, Math.max(0.25, h * 0.0005)) + "s";
  return (
    <div style={{ overflow: "hidden", height: open ? h + "px" : "0", transition: `height ${duration} ease`, margin: "0 -1.25rem", padding: "0 1.25rem" }}>
      <div ref={innerRef} style={{ display: "flow-root" }}>{children}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// QUESTION EDITOR
// ════════════════════════════════════════════════════════════════════════

function QuestionEditor({ q, onChange, onDeleteRequest, invalid, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  const set = (field, val) => onChange({ ...q, [field]: val });

  // single/multi option helpers
  const setOpt   = (i, v)  => { const o = [...q.options]; o[i] = v; set("options", o); };
  const addOpt   = ()      => set("options", [...q.options, ""]);
  const removeOpt = (i)    => {
    const opts = q.options.filter((_, j) => j !== i);
    const cor  = q.correct.map(c => c > i ? c - 1 : c).filter(c => c !== i && c < opts.length);
    onChange({ ...q, options: opts, correct: cor });
  };
  const toggleCorrect = (i) => {
    if (q.type === "single") { set("correct", q.correct[0] === i ? [] : [i]); }
    else {
      const has = q.correct.includes(i);
      if (has) {
        set("correct", q.correct.filter(x => x !== i));
      } else if (q.correct.length < q.selectCount) {
        set("correct", [...q.correct, i]);
      }
      // if already at selectCount, do nothing — user must deselect first
    }
  };

  // dropdown helpers
  const setDDOpt    = (di, oi, v) => { const dds = q.dropdowns.map((d, i) => { if (i !== di) return d; const o = [...d.options]; o[oi] = v; return { ...d, options: o }; }); set("dropdowns", dds); };
  const addDDOpt    = (di)        => { const dds = q.dropdowns.map((d, i) => i !== di ? d : { ...d, options: [...d.options, ""] }); set("dropdowns", dds); };
  const removeDDOpt = (di, oi)    => {
    const dds = q.dropdowns.map((d, i) => {
      if (i !== di) return d;
      const opts = d.options.filter((_, j) => j !== oi);
      const cor  = d.correct >= opts.length ? 0 : d.correct === oi ? 0 : d.correct > oi ? d.correct - 1 : d.correct;
      return { ...d, options: opts, correct: cor };
    });
    set("dropdowns", dds);
  };
  const setDDCor      = (di, v) => set("dropdowns", q.dropdowns.map((d, i) => i !== di ? d : { ...d, correct: parseInt(v) }));
  const setDDRowLabel = (di, v) => set("dropdowns", q.dropdowns.map((d, i) => i !== di ? d : { ...d, rowLabel: v }));
  const addDD         = ()      => { if (q.dropdowns.length < 3) set("dropdowns", [...q.dropdowns, { id: uid(), rowLabel: "", options: ["", ""], correct: null }]); };
  const removeDD      = (di)    => { if (q.dropdowns.length > 1) set("dropdowns", q.dropdowns.filter((_, i) => i !== di)); };

  const meta = TYPE_META[q.type];

  return (
    <div style={card({ marginBottom: "0.75rem", borderColor: invalid ? T.red + "66" : undefined })}>
      {/* collapsed header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Left — type bubble, pinned */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            <Tag label={meta.label} color={meta.color} />
          </div>
          {/* Center — topic, grows and shrinks */}
          {q.topic && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
              <Tag label={q.topic} color={T.muted2} />
            </div>
          )}
          {!q.topic && <div style={{ flex: 1 }} />}
          {/* Right — delete, pinned */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            <IconButton variant="danger" size={28} onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDeleteRequest(); }}>
              <TrashIcon size={13} />
            </IconButton>
          </div>
        </div>
        <span style={{ color: q.question ? T.text : T.muted, fontSize: "0.87rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FF_SANS, paddingRight: "1.5rem" }}>
          {q.question || "Untitled question…"}
        </span>
      </div>

      <Collapsible open={open}>
        <div style={{ marginTop: "1.25rem" }}>
          {/* type + topic */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.9rem" }}>
            <div style={{ flex: "1 1 180px" }}>
              <Label required>QUESTION TYPE</Label>
              <select value={q.type} onChange={e => onChange({ ...blankQuestion(e.target.value), id: q.id })}
                style={{ ...inp(), appearance: "none" }}>
                <option value="single">Single answer</option>
                <option value="multi">Multi-select</option>
                <option value="dropdown">Dropdown</option>
                <option value="matching">Matching</option>
                <option value="flashcard">Flashcard</option>
              </select>
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <Label>TOPIC / CATEGORY</Label>
              <input value={q.topic} onChange={e => set("topic", e.target.value)}
                placeholder="e.g. Storage, Identity…" maxLength={1000} style={inp()} />
            </div>
          </div>

          {/* question text — hidden for flashcard which has its own Front/Back fields */}
          {q.type !== "flashcard" && (
            <div style={{ marginBottom: "0.9rem" }}>
              <Label required>QUESTION TEXT</Label>
              <SnapTextarea value={q.question} onChange={e => set("question", e.target.value)}
                rows={3} placeholder="Enter the question…" maxLength={10000}
                style={{ ...inp(), lineHeight: 1.6 }} />
            </div>
          )}

          {/* ── single / multi ── */}
          {(q.type === "single" || q.type === "multi") && (
            <>
              {q.type === "multi" && (
                <div style={{ marginBottom: "0.9rem" }}>
                  <Label>HOW MANY MUST BE SELECTED</Label>
                  <select value={q.selectCount} onChange={e => set("selectCount", parseInt(e.target.value))}
                    style={{ ...inp({ width: "100px" }), appearance: "none" }}>
                    {[2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
              <Label required>OPTIONS — click circle/checkbox to mark correct answer(s)
                {q.type === "multi" && (
                  <span style={{ marginLeft: "0.5rem", color: q.correct.length === q.selectCount ? T.green : T.red }}>
                    ({q.correct.length}/{q.selectCount} marked)
                  </span>
                )}
              </Label>
              {q.options.map((opt, i) => {
                const isCor = q.correct.includes(i);
                return (
                  <div key={i} style={{ marginBottom: "0.75rem",
                    background: T.mode === "light" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.04)",
                    border: "1px solid " + (isCor ? T.green + "66" : T.border),
                    borderRadius: "12px", overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}>
                    {/* Top bar — correct toggle + delete */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      
                      background: "transparent",
                    }}>
                      <button {...surfacePress()} onClick={() => toggleCorrect(i)} style={{
                        display: "flex", alignItems: "center", gap: "0.35rem",
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                        color: isCor ? T.green : T.muted, fontSize: "0.72rem",
                        fontFamily: FF_SANS, height: "auto",
                      }}>
                        <span style={{
                          width: "16px", height: "16px", flexShrink: 0,
                          border: "1.5px solid " + (isCor ? T.green : T.border2),
                          borderRadius: q.type === "single" ? "50%" : "3px",
                          background: isCor ? T.green + "33" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.55rem",
                        }}>{isCor ? "✓" : ""}</span>
                        {isCor ? "Correct" : "Mark correct"}
                      </button>
                      {q.options.length > 2 && (
                        <IconButton variant="danger" size={26} onClick={() => removeOpt(i)}><svg width="10" height="10" viewBox="0 0 24 24" {...IC5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></IconButton>
                      )}
                    </div>
                    {/* Textarea */}
                    <SnapTextarea value={opt} onChange={e => setOpt(i, e.target.value)}
                      placeholder={"Enter option…"}
                      rows={3} maxLength={1000}
                      style={{ ...inp(), width: "100%", border: "none", borderRadius: 0,
                        background: "transparent", boxShadow: "none" }} />
                  </div>
                );
              })}
              {q.options.length < 6 && (
                <GhostButton onClick={addOpt} small style={{ marginTop: "0.3rem" }}>+ Add option</GhostButton>
              )}
            </>
          )}

          {/* ── dropdown ── */}
          {q.type === "dropdown" && (
            <>
              <Label required style={{ marginBottom: "0.6rem" }}>DROPDOWN ROWS — each row is one line of the question</Label>
              {q.dropdowns.map((dd, di) => (
                <div key={dd.id} style={{ marginBottom: "0.75rem", padding: "0.75rem", border: "1px solid " + T.border, borderRadius: "12px", background: T.surface2 }}>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span style={{ color: T.muted, fontFamily: FF_SANS, fontSize: "0.72rem" }}>ROW {di + 1}</span>
                      {q.dropdowns.length > 1 && (
                        <IconButton variant="danger" size={26} onClick={() => removeDD(di)}><svg width="10" height="10" viewBox="0 0 24 24" {...IC5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></IconButton>
                      )}
                    </div>
                    <EditorTextarea value={dd.rowLabel} onChange={e => setDDRowLabel(di, e.target.value)}
                      placeholder="Label text shown before the dropdown (e.g. Storage Tier)"
                      rows={2} maxLength={1000} />
                  </div>
                  <Label required>OPTIONS — select the correct one</Label>
                  {dd.options.map((opt, oi) => (
                    <div key={oi} style={{ marginBottom: "0.5rem",
                      background: T.mode === "light" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.04)",
                      border: "1px solid " + (dd.correct === oi ? T.green + "66" : T.border),
                      borderRadius: "12px", overflow: "hidden",
                      transition: "border-color 0.2s",
                    }}>
                      {/* Top bar */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        
                        background: "transparent",
                      }}>
                        <button onClick={() => setDDCor(di, oi)} style={{
                          display: "flex", alignItems: "center", gap: "0.35rem",
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                          color: dd.correct === oi ? T.green : T.muted, fontSize: "0.72rem",
                          fontFamily: FF_SANS, height: "auto",
                        }}>
                          <span style={{
                            width: "16px", height: "16px", flexShrink: 0,
                            border: "1.5px solid " + (dd.correct === oi ? T.green : T.border2),
                            borderRadius: "50%",
                            background: dd.correct === oi ? T.green + "33" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.55rem",
                          }}>{dd.correct === oi ? "✓" : ""}</span>
                          {dd.correct === oi ? "Correct" : "Mark correct"}
                        </button>
                        {dd.options.length > 2 && (
                          <IconButton variant="danger" size={26} onClick={() => removeDDOpt(di, oi)}><svg width="10" height="10" viewBox="0 0 24 24" {...IC5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></IconButton>
                        )}
                      </div>
                      {/* Textarea */}
                      <EditorTextarea value={opt} onChange={e => setDDOpt(di, oi, e.target.value)}
                        placeholder={"Enter option…"} maxLength={1000} rows={2} noBorder />
                    </div>
                  ))}
                  {dd.options.length < 4 && (
                    <GhostButton onClick={() => addDDOpt(di)} small style={{ marginTop: "0.3rem" }}>+ Add option</GhostButton>
                  )}
                </div>
              ))}
              {q.dropdowns.length < 3 && (
                <GhostButton onClick={addDD} small style={{ color: T.yellow }}>+ Add row</GhostButton>
              )}
            </>
          )}

          {q.type === "matching" && (
            <>
              <Label required style={{ marginBottom: "0.6rem" }}>PAIRS — enter each term and its correct match</Label>
              {q.pairs.map((pair, pi) => (
                <div key={pair.id} style={{ marginBottom: "1rem", padding: "0.75rem", background: T.surface2, borderRadius: "12px", border: "1px solid " + T.border }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: T.muted, fontFamily: FF_SANS, fontSize: "0.72rem" }}>PAIR {pi + 1}</span>
                    {q.pairs.length > 2 && (
                      <IconButton variant="danger" size={26} onClick={() => set("pairs", q.pairs.filter((_, i) => i !== pi))}><svg width="10" height="10" viewBox="0 0 24 24" {...IC5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></IconButton>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <SnapTextarea value={pair.term} onChange={e => { const pairs = q.pairs.map((p, i) => i === pi ? { ...p, term: e.target.value } : p); set("pairs", pairs); }}
                      placeholder="Term" rows={2} maxLength={1000} style={{ ...inp() }} />
                    <SnapTextarea value={pair.match} onChange={e => { const pairs = q.pairs.map((p, i) => i === pi ? { ...p, match: e.target.value } : p); set("pairs", pairs); }}
                      placeholder="Match" rows={2} maxLength={1000} style={{ ...inp(), borderColor: "#0ea5e944" }} />
                  </div>
                </div>
              ))}
              <GhostButton onClick={() => set("pairs", [...q.pairs, { id: uid(), term: "", match: "" }])} small style={{ color: "#0ea5e9" }}>+ Add pair</GhostButton>

              <Divider />
              <Label style={{ marginBottom: "0.6rem" }}>DISTRACTORS — extra answers that don't match anything</Label>
              {(q.distractors || []).map((d, di) => (
                <div key={di} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <SnapTextarea value={d} onChange={e => {
                    const distractors = (q.distractors || []).map((v, i) => i === di ? e.target.value : v);
                    set("distractors", distractors);
                  }} placeholder={"Distractor " + (di + 1)} rows={2} maxLength={1000}
                    style={{ ...inp(), flex: 1, borderColor: T.red + "44" }} />
                  <div style={{ paddingTop: "0.35rem" }}>
                    <IconButton variant="danger" size={26} onClick={() => set("distractors", (q.distractors || []).filter((_, i) => i !== di))}><svg width="10" height="10" viewBox="0 0 24 24" {...IC5}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></IconButton>
                  </div>
                </div>
              ))}
              <GhostButton onClick={() => set("distractors", [...(q.distractors || []), ""])} small style={{ color: T.muted }}>+ Add distractor</GhostButton>
            </>
          )}

          {/* ── flashcard ── */}
          {q.type === "flashcard" && (
            <>
              <Label required style={{ marginBottom: "0.4rem" }}>FRONT (term, question, or concept)</Label>
              <SnapTextarea value={q.question || ""} onChange={e => set("question", e.target.value)}
                rows={2} placeholder="Term or concept…" maxLength={10000}
                style={{ ...inp(), lineHeight: 1.6, marginBottom: "1rem" }} />
              <Label required style={{ marginBottom: "0.4rem" }}>BACK (definition, answer, or explanation)</Label>
              <SnapTextarea value={q.back || ""} onChange={e => set("back", e.target.value)}
                rows={2} placeholder="Definition or answer…" maxLength={10000}
                style={{ ...inp(), lineHeight: 1.6 }} />
            </>
          )}

          <Divider />

          {/* hint */}
          <div style={{ marginBottom: "1rem" }}>
            <Label>HINT (optional — accessible during the test)</Label>
            <SnapTextarea value={q.hint || ""} onChange={e => set("hint", e.target.value)}
              rows={2} placeholder="A nudge in the right direction…" maxLength={10000}
              style={{ ...inp(), lineHeight: 1.6 }} />
          </div>

          {/* explanation */}
          <div style={{ paddingBottom: "1rem" }}>
            <Label>EXPLANATION (shown after answering)</Label>
            <SnapTextarea value={q.explanation || ""} onChange={e => set("explanation", e.target.value)}
              rows={3} placeholder="Why is this the correct answer?" maxLength={10000}
              style={{ ...inp(), lineHeight: 1.6 }} />
          </div>
        </div>
      </Collapsible>
    </div>
  );
}

function EditMode({ set, allTags, onSave, onBack, scrolled, onCanSaveChange, onQuestionCountChange, editSearch = "", showSidebar = false, isDesktop = false, sidebarWidth = 0 }) {
  const [draft, setDraft]         = useState(() => JSON.parse(JSON.stringify(set)));
  const [confirmBack, setConfirmBack] = useState(false);
  const [newTag, setNewTag]       = useState("");
  const [tagsOpen, setTagsOpen]   = useState(false);
  const [addingTag, setAddingTag] = useState(false);

  const savedDraftRef = useRef(JSON.stringify(set));

  useEffect(() => {
    const handler = () => {
      const isDirty = JSON.stringify(draft) !== savedDraftRef.current;
      if (isDirty) {
        // Dismiss keyboard first so iOS compositor is stable when the modal's backdrop-filter renders.
        document.activeElement?.blur();
        setTimeout(() => setConfirmBack(true), 100);
      } else {
        onBack();
      }
    };
    document.addEventListener("studi-back", handler);
    return () => document.removeEventListener("studi-back", handler);
  }, [draft, onBack]);

  const [newestId, setNewestId] = useState(null);
  const [confirmDeleteQ, setConfirmDeleteQ] = useState(null); // { i, q }

  useEffect(() => {
    if (!newestId) return;
    const el = document.getElementById("question-" + newestId);
    if (!el) return;

    let attempts = 0;
    let lastHeight = 0;
    const interval = setInterval(() => {
      const rect = el.getBoundingClientRect();
      attempts++;
      // Wait until height has stabilised (card fully expanded)
      if (rect.height === lastHeight && rect.height > 100) {
        clearInterval(interval);
        // Only scroll if card is below the visible area
        const viewportBottom = window.innerHeight;
        if (rect.bottom > viewportBottom) {
          const top = rect.top + window.scrollY - 72;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }
      lastHeight = rect.height;
      if (attempts > 20) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [newestId]);

  const updateQ  = (i, q) => { const qs = [...draft.questions]; qs[i] = q; setDraft({ ...draft, questions: qs }); };
  const deleteQ  = (i)    => setDraft({ ...draft, questions: draft.questions.filter((_, j) => j !== i) });
  const addQ = (type) => {
    const newQ = blankQuestion(type);
    setDraft(d => ({ ...d, questions: [...d.questions, newQ] }));
    setNewestId(newQ.id);
  };

  function validateQuestion(q) {
    if (!q.question || !q.question.trim()) return false;
    if (q.type === "single" || q.type === "multi") {
      const filled = q.options.filter(o => o && o.trim()).length;
      if (filled < 2) return false;
      if (!q.correct || q.correct.length === 0) return false;
      if (q.type === "multi" && q.correct.length !== q.selectCount) return false;
    }
    if (q.type === "matching") {
      if (!q.pairs || q.pairs.length < 2) return false;
      if (q.pairs.some(p => !p.term.trim() || !p.match.trim())) return false;
    }
    if (q.type === "dropdown") {
      for (const dd of q.dropdowns) {
        const filled = dd.options.filter(o => o && o.trim()).length;
        if (filled < 2) return false;
      }
    }
    if (q.type === "flashcard") {
      if (!q.back || !q.back.trim()) return false;
    }
    return true;
  }

  const invalidQuestions = draft.questions.map((q, i) => ({ i, valid: validateQuestion(q) })).filter(q => !q.valid);
  const canSave = draft.questions.length > 0 && invalidQuestions.length === 0;
  const isDirty = JSON.stringify(draft) !== savedDraftRef.current;

  useEffect(() => { onCanSaveChange?.(canSave && isDirty); onQuestionCountChange?.(draft.questions.length); }, [canSave, isDirty, draft.questions.length]);

  useEffect(() => {
    function handler(e) { setDraft(d => ({ ...d, name: e.detail })); }
    document.addEventListener("studi-setname", handler);
    return () => document.removeEventListener("studi-setname", handler);
  }, []);

  useEffect(() => {
    function handler(e) { setDraft(d => ({ ...d, tags: e.detail })); }
    document.addEventListener("studi-settags", handler);
    return () => document.removeEventListener("studi-settags", handler);
  }, []);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent("studi-drafttags", { detail: draft.tags || [] }));
  }, [draft.tags]);

  useEffect(() => {
    function handler(e) { setDraft(d => ({ ...d, icon: e.detail })); }
    document.addEventListener("studi-seticon", handler);
    return () => document.removeEventListener("studi-seticon", handler);
  }, []);

  useEffect(() => {
    function handler() {
      if (canSave) {
        onSave(draft);
        savedDraftRef.current = JSON.stringify(draft);
      }
    }
    document.addEventListener("studi-save", handler);
    return () => document.removeEventListener("studi-save", handler);
  }, [canSave, draft]);

  function toggleTag(tag) {
    const tags = draft.tags || [];
    setDraft({ ...draft, tags: tags.includes(tag) ? tags.filter(t => t !== tag) : tags.length >= 5 ? tags : [...tags, tag] });
  }
  function addNewTag() {
    const t = newTag.trim();
    if (!t) return;
    const tags = draft.tags || [];
    if (tags.length >= 5) return;
    setDraft({ ...draft, tags: tags.includes(t) ? tags : [...tags, t] });
    setNewTag("");
    setAddingTag(false);
  }

  const combinedTags = [...new Set([...allTags, ...(draft.tags || [])])];

  return (
    <div>
      {confirmBack && (
        <ConfirmDialog
          title="Leave without saving?"
          message="Any unsaved changes to this study set will be lost."
          confirmLabel="Leave"
          onConfirm={() => { setConfirmBack(false); onBack(); }}
          onCancel={() => setConfirmBack(false)}
          extraButton={canSave && (
            <SuccessButton onClick={() => { onSave(draft); setConfirmBack(false); onBack(); }} style={{ width: "100%", justifyContent: "center" }}>
              Save & Leave
            </SuccessButton>
          )}
        />
      )}

      {/* Tags — inline pills + add button */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem", minHeight: "30px" }}>
        {(draft.tags || []).map(tag => (
          <EditorTagChip key={tag} tag={tag} onRemove={() => toggleTag(tag)} />
        ))}

        {addingTag ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", height: "30px" }}>
            <input autoFocus value={newTag} onChange={e => setNewTag(e.target.value)}
              maxLength={10} placeholder="Tag name…"
              onKeyDown={e => {
                if (e.key === "Enter") { addNewTag(); }
                if (e.key === "Escape") { setAddingTag(false); setNewTag(""); }
              }}
              style={{ ...inp({ width: "110px", fontSize: "16px", padding: "0.2rem 0.85rem", borderRadius: "99px", height: "100%", boxSizing: "border-box" }) }} />
            <SuccessButton onClick={() => { addNewTag(); }} small style={{ height: "100%", minHeight: 0 }}>Save</SuccessButton>
            <GhostButton onClick={() => { setAddingTag(false); setNewTag(""); }} small style={{ height: "100%", minHeight: 0 }}>Cancel</GhostButton>
          </div>
        ) : (draft.tags || []).length < 5 ? (
          <button onClick={() => setAddingTag(true)}
            {...primaryPress()}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              padding: "0.3rem 0.85rem", borderRadius: "99px", cursor: "pointer",
              fontFamily: FF_SANS, fontSize: "0.8rem", height: "auto", width: "auto",
              background: "transparent",
              border: "1px dashed " + T.border2,
              color: T.muted,
            }}>
            + Add tag
          </button>
        ) : null}
      </div>

      {draft.questions.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: T.muted,
          fontFamily: FF_SANS, fontSize: "0.78rem", letterSpacing: "0.08em" }}>
          NO QUESTIONS YET
        </div>
      )}

      {draft.questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => !editSearch.trim() || q.question?.toLowerCase().includes(editSearch.toLowerCase()))
        .map(({ q, i }) => (
        <div key={q.id} id={"question-" + q.id}>
          <QuestionEditor q={q}
            onChange={nq => updateQ(i, nq)}
            onDeleteRequest={() => setConfirmDeleteQ({ i, q })}
            invalid={!validateQuestion(q)}
            defaultOpen={q.id === newestId} />
        </div>
      ))}

      {confirmDeleteQ && (
        <ConfirmDialog
          title="Delete this question?"
          message={confirmDeleteQ.q.question ? (confirmDeleteQ.q.question.slice(0, 60) + (confirmDeleteQ.q.question.length > 60 ? "…" : "")) : "This question has no text yet."}
          onConfirm={() => { deleteQ(confirmDeleteQ.i); setConfirmDeleteQ(null); }}
          onCancel={() => setConfirmDeleteQ(null)}
        />
      )}

      {/* Editor FAB */}
      <EditorFab onAddQuestion={addQ} draft={draft} onAddGenerated={qs => setDraft(d => ({ ...d, questions: [...d.questions, ...qs] }))} showSidebar={isDesktop} isDesktop={isDesktop} questionCount={draft.questions.length} sidebarWidth={showSidebar ? sidebarWidth : 0} />
    </div>
  );
}

// ── GradientBorderButton — hollow button with gradient border ──────────────
function GradientBorderButton({ onClick, children, size, style: extraStyle, disabled = false }) {
  return (
    <button onClick={disabled ? undefined : onClick}
      className="button button-round"
      style={{
        background: `linear-gradient(${T.surface}, ${T.surface}) padding-box, linear-gradient(135deg, ${T.accent} 0%, ${T.gradient2} 100%) border-box`,
        border: "2px solid transparent",
        color: T.muted2, fontFamily: FF_SANS, fontWeight: 600, fontSize: "0.95rem",
        textTransform: "none",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
        boxShadow: `0 4px 20px ${T.accent}30`,
        WebkitTapHighlightColor: "transparent",
        ...(size ? { width: size, height: size, borderRadius: "50%", flexShrink: 0 } : {}),
        ...extraStyle,
      }}>
      {children}
    </button>
  );
}

// ── BottomPill — shared pill container for quiz submit and editor FAB ──────
function BottomPill({ left, children, sidebarOffset = 0 }) {
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: 0, right: 0, zIndex: 110,
      display: "flex", justifyContent: "center", alignItems: "center",
      padding: "0 1rem", pointerEvents: "none",
      transform: sidebarOffset ? `translateX(${sidebarOffset / 2}px)` : undefined,
      transition: "transform 0.25s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        background: T.mode === "light" ? "#ede8e0" : "#181614",
        borderRadius: "99px",
        padding: "0 0.4rem 0 1.2rem",
        minHeight: "60px",
        boxShadow: T.mode === "light"
          ? "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)"
          : "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        pointerEvents: "all",
      }}>
        {left && (
          <span style={{ color: T.mode === "light" ? T.muted2 : "#64748b", fontSize: "0.72rem",
            fontFamily: FF_SANS, letterSpacing: "0.05em", flexShrink: 0 }}>
            {left}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

function EditorFab({ onAddQuestion, draft, onAddGenerated, showSidebar = false, isDesktop = false, questionCount = 0, sidebarWidth = 0 }) {
  const [open, setOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [menuCenter, setMenuCenter] = useState(null);

  const types = [
    { type: "single",    label: "Single answer",  color: TYPE_META.single.color    },
    { type: "multi",     label: "Multi-select",    color: TYPE_META.multi.color     },
    { type: "dropdown",  label: "Dropdown",          color: TYPE_META.dropdown.color  },
    { type: "matching",  label: "Matching",        color: "#0ea5e9"                 },
    { type: "flashcard", label: "Flashcard",       color: TYPE_META.flashcard.color },
  ];

  function closeMenu() {
    setMenuClosing(true);
    setTimeout(() => { setOpen(false); setMenuClosing(false); }, 260);
  }

  return (
    <>
      {/* Overlay to close */}
      {(open || menuClosing) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 109 }} onPointerDown={closeMenu} />
      )}

        {/* Menu items */}
        {(open || menuClosing) && (
          <div style={{
            display: "flex", flexDirection: "column", gap: "0.4rem",
            alignItems: "center",
            position: "fixed", bottom: "calc(1.5rem + 70px)", left: menuCenter !== null ? menuCenter + "px" : "50%", transform: "translateX(-50%)", zIndex: 110, width: 0, overflow: "visible",
          }}>
            {types.map((t, idx) => {
              const n = types.length;
              const openDelay  = (n - 1 - idx) * 35;
              const closeDelay = idx * 28;
              const anim = menuClosing
                ? `fabItemOut 0.13s ease-in ${closeDelay}ms both`
                : `fabItemIn 0.20s cubic-bezier(0.34, 1.56, 0.64, 1) ${openDelay}ms both`;
              return (
                <div key={t.type} style={{ animation: anim }}>
                  <FabMenuButton onClick={() => { onAddQuestion(t.type); closeMenu(); }} color={t.color}>
                    + {t.label}
                  </FabMenuButton>
                </div>
              );
            })}
          </div>
        )}

        {/* FAB pill */}
        <BottomPill left={`${questionCount} ${questionCount === 1 ? "question" : "questions"}`} sidebarOffset={sidebarWidth}>
          <GradientBorderButton onClick={e => { if (open) { closeMenu(); return; } const r = e.currentTarget.getBoundingClientRect(); setMenuCenter(r.left + r.width / 2); setOpen(true); }} style={{ height: "46px", padding: "0 1.7rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              transform: open ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <line x1="10" y1="2" x2="10" y2="18" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="2" y1="10" x2="18" y2="10" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </span>
            Add Question
          </GradientBorderButton>
        </BottomPill>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REVIEW MODE
// ════════════════════════════════════════════════════════════════════════

function ReviewSingle({ q, selected, onSelect, submitted, examMode }) {
  const { sel: selBg, cor: corBg, wro: wroBg } = answerBgs();
  const selColor = T.accent;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", animation: "matchCurrentIn 0.3s ease forwards" }}>
      {q.options.map((opt, i) => {
        const isSel = selected.includes(i);
        const isCor = q.correct.includes(i);
        let bg = T.surface;
        let color = T.muted2;
        if (submitted) {
          if (!examMode && isCor)      { bg = corBg; color = T.green; }
          else if (!examMode && isSel) { bg = wroBg; color = T.red; }
          else if (isSel)              { bg = selBg; color = selColor; }
        } else if (isSel) {
          bg = selBg; color = selColor;
        }
        return (
          <AnswerButton key={i} onClick={() => !submitted && onSelect(i)} bg={bg} color={color} submitted={submitted} label={submitted && !examMode && isCor ? "✓" : submitted && !examMode && isSel ? "✗" : String.fromCharCode(65 + i)}>
            <span>{renderText(opt)}</span>
          </AnswerButton>
        );
      })}
    </div>
  );
}

function ReviewMulti({ q, selected, onToggle, submitted, examMode }) {
  const { sel: selBg, cor: corBg, wro: wroBg } = answerBgs();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", animation: "matchCurrentIn 0.3s ease forwards" }}>
      <p style={{ color: T.muted, fontSize: "0.72rem", fontFamily: FF_SANS, letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
        CHOOSE {q.selectCount} · {selected.length}/{q.selectCount} selected
      </p>
      {q.options.map((opt, i) => {
        const isSel = selected.includes(i);
        const isCor = q.correct.includes(i);
        let bg = T.surface;
        let color = T.muted2;
        if (submitted) {
          if (!examMode && isCor)      { bg = corBg; color = T.green; }
          else if (!examMode && isSel) { bg = wroBg; color = T.red; }
          else if (isSel)              { bg = selBg; color = T.accent; }
        } else if (isSel) {
          bg = selBg; color = T.accent;
        }
        const label = submitted && !examMode && isCor ? "✓" : submitted && !examMode && isSel ? "✗" : String.fromCharCode(65 + i);
        return (
          <AnswerButton key={i} onClick={() => !submitted && onToggle(i)} bg={bg} color={color} submitted={submitted} label={null}>
            <span style={{ minWidth: "20px", height: "20px", border: "1px solid currentColor", borderRadius: "4px",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontFamily: FF_SANS, fontWeight: 600,
              flexShrink: 0, marginTop: "2px", background: isSel && !submitted ? T.accent + "33" : "transparent" }}>
              {isSel && !submitted ? "✓" : label}
            </span>
            <span>{renderText(opt)}</span>
          </AnswerButton>
        );
      })}
    </div>
  );
}

function ReviewDropdown({ q, selections, onSelect, submitted }) {
  const [openId, setOpenId] = useState(null);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openId) return;
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenId(null);
    }
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [openId]);

  const { sel: selBg, cor: corBg, wro: wroBg } = answerBgs();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", animation: "matchCurrentIn 0.3s ease forwards" }}>
      {q.dropdowns.map((dd, di) => {
        const { options, originalIndices } = shuffleOptions(dd.options);
        const val     = selections[dd.id];
        const hasVal  = val !== undefined;
        const isCor   = submitted && hasVal && val === dd.correct;
        const isWrong = submitted && hasVal && val !== dd.correct;
        const isOpen  = openId === dd.id;

        const triggerBg = submitted ? (isCor ? corBg : isWrong ? wroBg : T.surface) : hasVal ? selBg : T.surface;
        const triggerColor = submitted ? (isCor ? T.green : isWrong ? T.red : T.muted) : hasVal ? T.accent : T.muted;
        const triggerBorder = submitted ? (isCor ? T.green : isWrong ? T.red : T.border) : hasVal ? T.accent : T.border2;

        return (
          <div key={dd.id} style={{
            display: "flex", flexDirection: "column", gap: "0.5rem",
            padding: "0.85rem 0.9rem",
            background: T.surface2, borderRadius: "12px",
            border: "1px solid " + (submitted ? (isCor ? T.green + "55" : isWrong ? T.red + "55" : T.border) : T.border),
          }}>
            {/* row label */}
            <span style={{
              fontFamily: FF_SANS, fontSize: "0.92rem", color: T.muted2,
            }}>
              {renderText(dd.rowLabel || "Row " + (di + 1))}
            </span>
            {/* custom dropdown */}
            <div style={{ position: "relative" }} ref={isOpen ? menuRef : null}>
              <button
                disabled={submitted}
                onClick={e => {
                  if (!submitted) {
                    if (isOpen) { setOpenId(null); }
                    else {
                      const r = e.currentTarget.getBoundingClientRect();
                      const arrowClearance = 132; // bottom: 5.5rem (88px) + height 44px
                      setOpenUpward(window.innerHeight - r.bottom < arrowClearance + 150);
                      setOpenId(dd.id);
                    }
                  }
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem",
                  background: triggerBg, color: triggerColor,
                  border: (hasVal && !submitted) ? "1.5px solid " + T.accent + "44" : "1px solid " + triggerBorder,
                  borderRadius: "6px", padding: "0.45rem 0.6rem",
                  fontFamily: FF_SANS, fontSize: "0.8rem",
                  cursor: submitted ? "default" : "pointer",
                  textAlign: "left", whiteSpace: "normal", wordBreak: "break-word",
                }}>
                <span style={{ flex: 1, lineHeight: 1.4 }}>
                  {hasVal ? dd.options[val] : "— select —"}
                </span>
                {!submitted && (
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                    <path d="M1 1l4 4 4-4" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  </svg>
                )}
              </button>
              {isOpen && (
                <div style={{
                  position: "absolute",
                  ...(openUpward ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }),
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  background: T.surface,
                  border: "1px solid " + T.border,
                  borderRadius: "10px",
                  boxShadow: T.mode === "light" ? "0 8px 24px rgba(0,0,0,0.12)" : "0 8px 24px rgba(0,0,0,0.4)",
                  overflow: "hidden",
                }}>
                  {dd.options.map((opt, oi) => (
                    <button key={oi} onClick={() => { onSelect(dd.id, oi); setOpenId(null); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: val === oi ? T.accent + "18" : "transparent",
                        border: "none", padding: "0.65rem 0.9rem",
                        fontFamily: FF_SANS, fontSize: "0.8rem",
                        color: val === oi ? T.accent : T.text,
                        cursor: "pointer", lineHeight: 1.5, whiteSpace: "normal", wordBreak: "break-word",
                      }}
                      onMouseEnter={e => { if (val !== oi) e.currentTarget.style.background = T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = val === oi ? T.accent + "18" : "transparent"; }}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {isWrong && (
                <span style={{ fontSize: "0.65rem", color: T.green, fontFamily: FF_SANS, marginTop: "3px", display: "block" }}>
                  ✓ {renderText(dd.options[dd.correct])}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewMatching({ q, userMatches, onMatch, submitted, examMode }) {
  const pairs = q.pairs;
  const distractors = q.distractors || [];
  const shuffledMatches = useMemo(() => shuffle([...pairs.map(p => p.match), ...distractors]), [q.id]);
  const usedMatches = Object.values(userMatches).filter(v => v !== undefined);
  const currentTermIdx = pairs.findIndex((_, i) => userMatches[i] === undefined);
  const allMatched = currentTermIdx === -1;

  function handleMatchSelect(match) {
    if (submitted || allMatched) return;
    onMatch(currentTermIdx, match);
  }

  const availableMatches = shuffledMatches.filter(m => !usedMatches.includes(m));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* All pairs always in order */}
      {pairs.map((pair, i) => {
        const matched = userMatches[i] !== undefined;
        const isCurrent = i === currentTermIdx;
        const isCorrect = matched && userMatches[i] === pair.match;

        if (submitted) {
          return (
            <div key={pair.id} style={{
              background: examMode
                ? T.surface2
                : isCorrect ? corBgCard() : wroBgCard(),
              border: "1px solid " + (examMode ? T.border : isCorrect ? T.green : T.red),
              borderRadius: "12px", padding: "0.75rem 1rem",
            }}>
              <div style={{ fontFamily: FF_SANS, fontSize: "0.78rem", color: T.muted, marginBottom: "0.25rem" }}>{renderText(pair.term)}</div>
              <div style={{ fontFamily: FF_SANS, fontSize: "0.9rem", fontWeight: 500, color: examMode ? T.text : isCorrect ? T.green : T.red }}>
                → {renderText(userMatches[i])}
              </div>
              {!examMode && !isCorrect && (
                <div style={{ fontFamily: FF_SANS, fontSize: "0.78rem", color: T.green, marginTop: "0.25rem" }}>
                  ✓ {renderText(pair.match)}
                </div>
              )}
            </div>
          );
        }

        if (matched) {
          return (
            <div key={pair.id} onClick={() => onMatch(i, undefined)}
              style={{
                background: T.surface2, border: "1px solid " + T.border,
                borderRadius: "12px", padding: "0.75rem 1rem",
                cursor: "pointer", transition: "opacity 0.15s", opacity: 0.6,
                animation: "matchFadeIn 0.3s ease forwards",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.45"}
              onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}>
              <div style={{ fontFamily: FF_SANS, fontSize: "0.78rem", color: T.muted, marginBottom: "0.25rem" }}>{renderText(pair.term)}</div>
              <p style={{ fontFamily: FF_SANS, fontSize: "0.9rem", fontWeight: 500, color: T.text }}>
                → {renderText(userMatches[i])}
                <span style={{ float: "right", color: T.muted, fontSize: "0.72rem", fontWeight: 400 }}>tap to change</span>
              </p>
            </div>
          );
        }

        if (isCurrent) {
          return (
            <div key={pair.id}>
              {i > 0 && (
                <div style={{ height: "1px", background: T.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)", margin: "0.5rem 0 1rem" }} />
              )}
              <div style={{ background: T.surface2, border: "1px solid #0ea5e9", borderRadius: "12px", padding: "0.75rem 1rem", marginBottom: "0.5rem", animation: "matchCurrentIn 0.3s ease forwards" }}>
                <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: "#0ea5e9", marginBottom: "0.4rem" }}>
                  MATCH THIS TERM
                </p>
                <p style={{ fontFamily: FF_SANS, fontSize: "1rem", fontWeight: 500, color: T.text, whiteSpace: "pre-wrap" }}>
                  {pair.term}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                {availableMatches.map((match, mi) => (
                  <AnswerButton key={mi} onClick={() => handleMatchSelect(match)} bg={T.surface2} border={"1px solid " + T.border} color={T.text} submitted={false} style={{ padding: "0.85rem 1rem" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "2px", border: "2px solid " + T.border2, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }} />
                    {match}
                  </AnswerButton>
                ))}
              </div>
            </div>
          );
        }

        // Future unmatched term — show as placeholder
        return (
          <div key={pair.id}>
            {i === currentTermIdx + 1 && (
              <div style={{ height: "1px", background: T.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)", margin: "0.5rem 0 1rem" }} />
            )}
            <div style={{
              background: "transparent",
              border: "1px dashed " + (T.mode === "light" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"),
              borderRadius: "12px", padding: "0.75rem 1rem",
            }}>
              <p style={{ fontFamily: FF_SANS, fontSize: "0.9rem", color: T.muted, whiteSpace: "pre-wrap", opacity: 0.6 }}>{pair.term}</p>
            </div>
          </div>
        );
      })}

      {allMatched && !submitted && (
        <p style={{ fontFamily: FF_SANS, fontSize: "0.9rem", color: T.muted, textAlign: "center", padding: "0.5rem" }}>
          All pairs matched — submit when ready.
        </p>
      )}
    </div>
  );
}

function ReviewFlashcard({ q, onGrade, submitted, results }) {
  const [flipped, setFlipped] = useState(false);

  const gradedBorder = submitted
    ? "1px solid " + (results?.correct ? T.green + "44" : T.red + "44")
    : "1px solid " + T.border;

  return (
    <div>
      {/* Card */}
      <div
        onClick={() => !submitted && setFlipped(f => !f)}
        style={{
          minHeight: "220px", borderRadius: "16px", cursor: submitted ? "default" : "pointer",
          position: "relative", perspective: "1000px", marginBottom: "1rem",
        }}>
        <div style={{
          position: "relative", width: "100%", minHeight: "220px",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          {/* Front */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "16px",
            background: T.surface, border: gradedBorder,
            boxShadow: T.mode === "light"
              ? "0 4px 20px rgba(0,0,0,0.08)" : "0 4px 20px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "2rem", textAlign: "center", gap: "0.75rem",
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          }}>
            <Label style={{ marginBottom: 0 }}>TERM</Label>
            <div style={{ fontFamily: FF_SANS, fontSize: "1.1rem", fontWeight: 600, color: T.text, lineHeight: 1.5 }}>
              {renderText(q.question)}
            </div>
          </div>

          {/* Back */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "16px",
            background: T.surface, border: gradedBorder,
            boxShadow: T.mode === "light"
              ? "0 4px 20px rgba(0,0,0,0.08)" : "0 4px 20px rgba(0,0,0,0.25)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "2rem", textAlign: "center", gap: "0.75rem",
            backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}>
            <Label style={{ marginBottom: 0 }}>ANSWER</Label>
            <div style={{ fontFamily: FF_SANS, fontSize: "1rem", color: T.text, lineHeight: 1.6 }}>
              {renderText(q.back)}
            </div>
          </div>
        </div>
      </div>

      {/* Grade buttons — only show after flip */}
      {flipped && !submitted && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <DangerButton onClick={() => onGrade(false)} style={{ flex: 1, justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" {...IC5} style={{ marginRight: "0.4rem" }}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Missed it
          </DangerButton>
          <SuccessButton onClick={() => onGrade(true)} style={{ flex: 1, justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" {...IC5} style={{ marginRight: "0.4rem" }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Got it
          </SuccessButton>
        </div>
      )}
    </div>
  );
}

function ReviewMode({ set, questionLimit, examMode, timerMinutes, onFinish, onBack }) {
  const [questions] = useState(() => {
    const shuffled = shuffle(set.questions).map(buildShuffledQuestion);
    return questionLimit ? shuffled.slice(0, questionLimit) : shuffled;
  });

  const [idx, setIdx]     = useState(0);
  const [drafts, setDrafts] = useState(() => questions.map(() => ({ selected: [], dropSel: {}, matchSel: {} })));
  const [results, setResults] = useState({});
  const [hintOpen, setHintOpen] = useState(false);
  const [confirmBack, setConfirmBack] = useState(false);
  const bubbleRef      = useRef(null);
  const [bubbleAtStart, setBubbleAtStart] = useState(true);
  const [bubbleAtEnd,   setBubbleAtEnd]   = useState(false);
  const bubbleDragX    = useRef(null);
  const bubbleDragSL   = useRef(0);
  const bubbleDragDist = useRef(0);

  function checkBubbleScroll(el) {
    setBubbleAtStart(el.scrollLeft <= 4);
    setBubbleAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }

  useEffect(() => {
    const el = bubbleRef.current;
    if (el) checkBubbleScroll(el);
  }, [questions.length]);

  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const handler = e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);
  const topRef         = useRef(null);
  const topSentinelRef = useRef(null);
  const answersRef     = useRef(null);
  const explanationRef = useRef(null);
  const bottomRef      = useRef(null);
  const [atBottom, setAtBottom] = useState(false);
  const atBottomRef = useRef(false);
  const [atTop, setAtTop] = useState(true);
  const [flagged,  setFlagged]  = useState({});

  // Timer
  const totalSeconds = timerMinutes ? timerMinutes * 60 : null;
  const [secsLeft, setSecsLeft] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!totalSeconds) return;
    if (paused) return;
    const interval = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) { clearInterval(interval); handleFinish(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paused]);

  function formatTime(s) {
    if (s === null) return "";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  const timerColor = secsLeft !== null
    ? secsLeft <= totalSeconds * 0.1 ? T.red
    : secsLeft <= totalSeconds * 0.2 ? "#f59e0b"
    : T.text
    : T.text;

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      atBottomRef.current = entry.isIntersecting;
      setAtBottom(entry.isIntersecting);
    }, { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = topSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setAtTop(entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function handleScrollBtn() {
    if (atBottomRef.current) {
      topSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const HEADER = 80;
    const stops = [topRef, answersRef, explanationRef, bottomRef];
    for (let i = 0; i < stops.length; i++) {
      const el = stops[i].current;
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top > HEADER + 10) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  useEffect(() => {
    const handler = () => setConfirmBack(true);
    document.addEventListener("studi-back", handler);
    return () => document.removeEventListener("studi-back", handler);
  }, []);

  // Scroll current bubble into view
  useEffect(() => {
    if (!bubbleRef.current) return;
    const active = bubbleRef.current.querySelector("[data-active='true']");
    if (active) active.scrollIntoView({ inline: "center", block: "nearest", behavior: "instant" });
  }, [idx]);

  // Close hint when changing questions
  useEffect(() => { setHintOpen(false); }, [idx]);

  const q           = questions[idx];
  const draft       = drafts[idx];
  const pastResult  = results[idx];
  const isSubmitted = pastResult !== undefined;
  const allAnswered = Object.keys(results).length === questions.length;
  const unansweredCount = questions.length - Object.keys(results).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const [confirmFinish, setConfirmFinish] = useState(false);

  function setSelected(sel) {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, selected: sel } : d));
    if (examMode) autoSave({ selected: sel, dropSel: draft.dropSel, matchSel: draft.matchSel });
  }
  function setDropSel(updater) {
    const next = typeof updater === "function" ? updater(draft.dropSel) : updater;
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, dropSel: next } : d));
    if (examMode) autoSave({ selected: draft.selected, dropSel: next, matchSel: draft.matchSel });
  }

  function autoSave(d) {
    // In exam mode, save answer immediately whenever selection is complete
    const isComplete = (
      (q.type === "single"   && d.selected.length === 1) ||
      (q.type === "multi"    && d.selected.length === q.selectCount) ||
      (q.type === "dropdown" && q.dropdowns.every(dd => d.dropSel[dd.id] !== undefined)) ||
      (q.type === "matching" && Object.keys(d.matchSel).length === q.pairs.length)
    );
    if (isComplete) {
      const correct = (
        q.type === "single" || q.type === "multi"
          ? [...d.selected].sort().join(",") === [...q.correct].sort().join(",")
          : q.type === "dropdown"
            ? q.dropdowns.every(dd => d.dropSel[dd.id] === dd.correct)
            : q.type === "matching"
              ? q.pairs.every((p, pi) => d.matchSel[pi] === p.match)
              : false
      );
      setResults(prev => ({ ...prev, [idx]: { qId: q.id, correct, selected: d.selected, dropSel: d.dropSel, matchSel: d.matchSel } }));
    }
  }

  const canSubmit = () => {
    if (examMode) return false; // exam mode auto-saves
    if (isSubmitted) return false;
    if (q.type === "single")    return draft.selected.length === 1;
    if (q.type === "multi")     return draft.selected.length === q.selectCount;
    if (q.type === "dropdown")  return q.dropdowns.every(d => draft.dropSel[d.id] !== undefined);
    if (q.type === "matching")  return Object.keys(draft.matchSel).length === q.pairs.length;
    if (q.type === "flashcard") return false;
    return false;
  };

  function calcCorrect() {
    if (q.type === "single" || q.type === "multi")
      return [...draft.selected].sort().join(",") === [...q.correct].sort().join(",");
    if (q.type === "dropdown")
      return q.dropdowns.every(d => draft.dropSel[d.id] === d.correct);
    if (q.type === "matching")
      return q.pairs.every((p, i) => draft.matchSel[i] === p.match);
    return false;
  }

  function handleFlashcardGrade(correct) {
    setResults(prev => ({
      ...prev,
      [idx]: { qId: q.id, correct, selected: [], dropSel: {}, matchSel: {} },
    }));
  }

  function handleSubmit() {
    if (!canSubmit()) return;
    const correct = calcCorrect();
    setResults(prev => ({
      ...prev,
      [idx]: { qId: q.id, correct, selected: draft.selected, dropSel: draft.dropSel, matchSel: draft.matchSel },
    }));
  }

  function handleFinish() {
    // Build ordered results array matching questions order
    const ordered = questions.map((_, i) => results[i]).filter(Boolean);
    onFinish(ordered, questions);
  }

  // Navigate to next unanswered question, or stay if none
  function goNextUnanswered() {
    for (let i = idx + 1; i < questions.length; i++) {
      if (!results[i]) { setIdx(i); return; }
    }
    for (let i = 0; i < idx; i++) {
      if (!results[i]) { setIdx(i); return; }
    }
  }

  function handleBubbleClick(i) {
    if (i === idx) return;
    setIdx(i);
  }

  // Display values — frozen if already submitted, live if in progress
  const displaySelected  = isSubmitted && !examMode ? (pastResult.selected || []) : draft.selected;
  const displayDropSel   = isSubmitted && !examMode ? (pastResult.dropSel  || {}) : draft.dropSel;
  const displayMatchSel  = isSubmitted && !examMode ? (pastResult.matchSel || {}) : draft.matchSel;

  function setMatchSel(updater) {
    setDrafts(prev => prev.map((d, i) => {
      if (i !== idx) return d;
      const next = typeof updater === "function" ? updater(d.matchSel) : updater;
      if (examMode) autoSave({ selected: d.selected, dropSel: d.dropSel, matchSel: next });
      return { ...d, matchSel: next };
    }));
  }

  const meta = TYPE_META[q.type];

  return (
    <div>
      <div ref={topSentinelRef} style={{ height: "1px", scrollMarginTop: "200px" }} />
      {confirmBack && (
        <ConfirmDialog
          title="Leave this session?"
          message="Your progress on this session will be lost."
          confirmLabel="Leave"
          onConfirm={() => { setConfirmBack(false); onBack(); }}
          onCancel={() => setConfirmBack(false)}
        />
      )}
      {/* Bubble navigator */}
      {timerMinutes ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
          <span style={{ fontFamily: FF_SANS, fontSize: "0.72rem", fontWeight: 600, color: T.muted, letterSpacing: "0.08em" }}>QUESTIONS</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: FF_SANS, fontSize: "0.78rem", fontWeight: 600, color: timerColor, transition: "color 0.5s", letterSpacing: "0.05em" }}>{formatTime(secsLeft)}</span>
            <button onClick={() => setPaused(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", padding: "0.1rem" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "0.35rem" }}>
          <span style={{ fontFamily: FF_SANS, fontSize: "0.72rem", fontWeight: 600, color: T.muted, letterSpacing: "0.08em" }}>QUESTIONS</span>
        </div>
      )}

      {/* Pause modal */}
      {paused && (
        <Modal onClose={() => setPaused(false)} zIndex={1100}>
          <ModalCard style={{ maxWidth: "340px", width: "100%", textAlign: "center" }}>
            <p style={{ fontFamily: FF_SANS, fontSize: "0.72rem", letterSpacing: "0.12em", color: T.muted, marginBottom: "1rem" }}>EXAM PAUSED</p>
            <p style={{ fontFamily: FF_SERIF, fontSize: "1.5rem", fontWeight: 600, color: T.text, marginBottom: "0.25rem" }}>{formatTime(secsLeft)}</p>
            <p style={{ fontFamily: FF_SANS, fontSize: "0.85rem", color: T.muted, marginBottom: "1.5rem" }}>remaining</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1.75rem" }}>
              {[
                { label: "Answered",   value: Object.keys(results).length, color: T.green },
                { label: "Unanswered", value: questions.length - Object.keys(results).length, color: T.muted },
                { label: "Flagged",    value: flaggedCount, color: T.accent },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ fontFamily: FF_SERIF, fontSize: "1.75rem", fontWeight: 600, color }}>{value}</span>
                  <span style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.08em", color: T.muted }}>{label.toUpperCase()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setPaused(false)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0.7rem 1.75rem", borderRadius: "99px",
              background: `linear-gradient(${T.surface}, ${T.surface}) padding-box, linear-gradient(135deg, ${T.accent} 0%, ${T.gradient2} 100%) border-box`,
              border: "2px solid transparent", cursor: "pointer",
              fontFamily: FF_SANS, fontWeight: 600, fontSize: "0.95rem", color: T.muted2,
              boxShadow: "0 4px 20px " + T.accent + "30",
            }}>Resume</button>
          </ModalCard>
        </Modal>
      )}
      <div ref={bubbleRef} onScroll={e => checkBubbleScroll(e.currentTarget)}
        onPointerDown={e => {
          if (e.button !== 0) return;
          bubbleDragX.current = e.clientX;
          bubbleDragSL.current = bubbleRef.current.scrollLeft;
          bubbleDragDist.current = 0;
        }}
        onPointerMove={e => {
          if (bubbleDragX.current === null) return;
          const dx = e.clientX - bubbleDragX.current;
          bubbleDragDist.current = Math.abs(dx);
          if (bubbleDragDist.current > 4) {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
            bubbleRef.current.scrollLeft = bubbleDragSL.current - dx;
          }
        }}
        onPointerUp={() => { bubbleDragX.current = null; }}
        onClickCapture={e => { if (bubbleDragDist.current > 4) e.stopPropagation(); }}
        style={{
        display: "flex", gap: "0.35rem", overflowX: "auto", overflowY: "visible",
        paddingBottom: "0.5rem", paddingTop: "0.5rem", paddingLeft: "0.35rem",
        marginBottom: "1.5rem", scrollbarWidth: "none", cursor: "grab",
        maskImage: `linear-gradient(to right, ${bubbleAtStart ? "black" : "transparent"} 0%, black 10%, black 88%, ${bubbleAtEnd ? "black" : "transparent"} 100%)`,
        WebkitMaskImage: `linear-gradient(to right, ${bubbleAtStart ? "black" : "transparent"} 0%, black 10%, black 88%, ${bubbleAtEnd ? "black" : "transparent"} 100%)`,
      }}>
        <style>{"div::-webkit-scrollbar { display: none; }"}</style>
        {questions.map((_, i) => {
          const res = results[i];
          const isCurrent  = i === idx;
          const isAnswered = res !== undefined;
          const isCorrectQ = isAnswered && res.correct;
          const bubbleClass = isCurrent
            ? 'button button-fill button-round'
            : isAnswered ? 'button button-tonal button-round' : 'button button-outline button-round';
          const bubbleColor = isCurrent
            ? { background: T.accent, color: "#fff" }
            : isAnswered
              ? (examMode
                  ? { background: T.accent + "25", color: T.accent }
                  : isCorrectQ
                    ? { background: T.green + "25", color: T.green }
                    : { background: T.red + "25", color: T.red })
              : { color: T.text, background: T.surface2 };
          return (
            <button key={i} data-active={isCurrent ? "true" : "false"} onClick={() => handleBubbleClick(i)}
              className={bubbleClass}
              style={{
                ...bubbleColor,
                width: "40px", height: "40px", flexShrink: 0,
                fontFamily: FF_SANS, fontSize: "0.72rem", fontWeight: 600, textTransform: "none",
                cursor: isCurrent ? "default" : "pointer",
                position: "relative", transition: "all 0.15s", overflow: "visible",
              }}>
              {i + 1}
              {isAnswered && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", borderRadius: "50%", background: examMode ? T.accent : isCorrectQ ? T.green : T.red, color: "#fff", fontSize: "0.6rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid " + T.surface }}>
                  {examMode ? "✓" : isCorrectQ ? "✓" : "✗"}
                </span>
              )}
              {flagged[i] && (
                <span style={{ position: "absolute", bottom: "-4px", left: "-4px", width: "16px", height: "16px", borderRadius: "50%", background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid " + T.surface }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Question card — flashcard has its own layout */}
      {q.type === "flashcard" ? (
        <div ref={topRef} style={{ scrollMarginTop: "80px", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
            {q.topic && <Tag label={q.topic.toUpperCase()} color={T.muted2} />}
            <span style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <HintButton hint={q.hint} hintOpen={hintOpen} setHintOpen={setHintOpen} examMode={examMode} renderText={renderText} />
              <button onClick={() => setFlagged(prev => ({ ...prev, [idx]: !prev[idx] }))} {...primaryPress()}
                className={`button button-round ${flagged[idx] ? 'button-tonal' : 'button-raised'}`}
                style={{
                  width: "36px", height: "36px",
                  ...(flagged[idx] ? { background: "#f59e0b25", color: "#f59e0b" } : { background: T.surface, color: T.text }),
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={flagged[idx] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
              </button>
            </div>
          </div>
          <ReviewFlashcard q={q} onGrade={handleFlashcardGrade} submitted={isSubmitted} results={pastResult} />
        </div>
      ) : (
      <div ref={topRef} style={{ ...card({ marginBottom: "1.25rem" }), scrollMarginTop: "80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
          {q.topic && <Tag label={q.topic.toUpperCase()} color={T.muted2} />}
          <span style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <HintButton hint={q.hint} hintOpen={hintOpen} setHintOpen={setHintOpen} examMode={examMode} renderText={renderText} />
            <button onClick={() => setFlagged(prev => ({ ...prev, [idx]: !prev[idx] }))}
              {...primaryPress()}
              className={`button button-round ${flagged[idx] ? 'button-tonal' : 'button-raised'}`}
              style={{
                width: "36px", height: "36px",
                ...(flagged[idx] ? { background: "#f59e0b25", color: "#f59e0b" } : { background: T.surface, color: T.text }),
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={flagged[idx] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                <line x1="4" y1="22" x2="4" y2="15"/>
              </svg>
            </button>
          </div>
        </div>
        <p style={{ fontFamily: FF_SANS, fontSize: "1rem", color: T.text, lineHeight: 1.65, marginBottom: "1.25rem" }}>
          {renderText(q.question)}
        </p>

        <div ref={answersRef} style={{ scrollMarginTop: "80px" }}>
          {q.type === "single" && (
            <ReviewSingle q={q} selected={displaySelected}
              onSelect={i => !isSubmitted && setSelected([i])}
              submitted={isSubmitted} examMode={examMode} />
          )}
        {q.type === "multi" && (
          <ReviewMulti q={q} selected={displaySelected}
            onToggle={i => {
              if (isSubmitted) return;
              if (draft.selected.includes(i)) setSelected(draft.selected.filter(x => x !== i));
              else if (draft.selected.length < q.selectCount) setSelected([...draft.selected, i]);
            }}
            submitted={isSubmitted} examMode={examMode} />
        )}
        {q.type === "dropdown" && (
          <ReviewDropdown q={q} selections={displayDropSel}
            onSelect={(id, val) => !isSubmitted && setDropSel(p => ({ ...p, [id]: val }))}
            submitted={isSubmitted} />
        )}
        {q.type === "matching" && (
          <ReviewMatching q={q} userMatches={displayMatchSel}
            onMatch={(termIdx, match) => {
              if (!isSubmitted) {
                setMatchSel(p => {
                  const next = { ...p };
                  if (match === undefined) delete next[termIdx];
                  else next[termIdx] = match;
                  return next;
                });
              }
            }}
            submitted={isSubmitted} examMode={examMode} />
        )}

        </div>

      </div>

      )} {/* end flashcard/regular card conditional */}

      {isSubmitted && q.explanation && !examMode && (
        <div ref={explanationRef} style={{
          marginTop: "0.75rem", borderRadius: "16px", overflow: "hidden",
          background: T.surface, border: "1px solid " + T.border,
          boxShadow: T.mode === "light" ? "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)" : "0 2px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)",
          display: "flex", scrollMarginTop: "80px",
        }}>
          <div style={{ width: "3px", background: T.accent, flexShrink: 0 }} />
          <div style={{ padding: "0.9rem 1rem" }}>
            <p style={{ color: T.muted, fontSize: "0.67rem", fontFamily: FF_SANS, letterSpacing: "0.1em", marginBottom: "0.35rem" }}>EXPLANATION</p>
            <p style={{ color: T.muted2, fontSize: "0.9rem", lineHeight: 1.6 }}>{renderText(q.explanation)}</p>
          </div>
        </div>
      )}

      {/* Floating action buttons — scroll only */}
      {!(atTop && atBottom) && <div style={{
        position: "fixed", bottom: "5.5rem", left: "50%",
        transform: "translateX(-50%)",
        zIndex: 101, display: "flex", gap: "0.5rem", alignItems: "center",
      }}>
        {/* Scroll button */}
        <button onClick={handleScrollBtn}
          className="button button-raised button-round"
          style={{ width: "44px", height: "44px", background: T.surface, color: T.text, transition: "transform 0.3s ease" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" {...IC5}
            style={{ transform: atBottom ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
          </svg>
        </button>
      </div>}

      <div ref={bottomRef} style={{ height: "1px" }} />

      {/* Fixed bottom — submit pill only */}
      <BottomPill left={`${Object.keys(results).length} / ${questions.length}`}>
        {q.type === "flashcard" && !isSubmitted ? (
          <span style={{ fontFamily: FF_SANS, fontSize: "0.78rem", color: T.muted, fontStyle: "italic" }}>Tap card to flip</span>
        ) : !examMode && !isSubmitted ? (
          <GradientBorderButton onClick={handleSubmit} disabled={!canSubmit()} style={{ justifyContent: "center", minWidth: "150px", height: "46px", padding: "0 1.7rem" }}>Submit answer</GradientBorderButton>
        ) : !allAnswered ? (
          <PrimaryButton onClick={goNextUnanswered} style={{ justifyContent: "center", minWidth: "150px", height: "46px", padding: "0 1.7rem" }}>Next unanswered →</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setConfirmFinish(true)} style={{ justifyContent: "center", minWidth: "150px", height: "46px", padding: "0 1.7rem" }}>See results →</PrimaryButton>
        )}
      </BottomPill>

      {confirmFinish && (
        <ConfirmDialog
          title="Submit session?"
          message={
            (unansweredCount > 0 && flaggedCount > 0)
              ? unansweredCount + " unanswered and " + flaggedCount + " flagged question" + (flaggedCount !== 1 ? "s" : "") + " remaining."
              : unansweredCount > 0
              ? unansweredCount + " question" + (unansweredCount !== 1 ? "s" : "") + " still unanswered."
              : flaggedCount > 0
              ? flaggedCount + " flagged question" + (flaggedCount !== 1 ? "s" : "") + " remaining."
              : "Ready to see your results?"
          }
          confirmLabel="Submit"
          onConfirm={() => { setConfirmFinish(false); handleFinish(); }}
          onCancel={() => setConfirmFinish(false)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// RESULTS SCREEN
// ════════════════════════════════════════════════════════════════════════

function AnimatedPct({ target, color }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target]);
  return (
    <span style={{ fontFamily: FF_SANS, fontSize: "1.5rem", fontWeight: 700, color }}>
      {display}%
    </span>
  );
}

function ResultsScreen({ results, questions, set, onRestart, onBack, onSaveToHistory, questionLimit, examMode = false, isHistoryView, historyDate, onRetryMissed, exportModal, onCloseExport, confirmRetry, onCloseConfirmRetry, history }) {
  const score  = results.filter(r => r.correct).length;
  const pct    = Math.round((score / results.length) * 100);
  const passed = pct >= 70;
  const [expanded,     setExpanded]     = useState(null);
  const [saved,        setSaved]        = useState(false);
  const [resultsFilter, setResultsFilter] = useState("all");
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [filterPos,    setFilterPos]    = useState({ top: 0, right: 0 });
  const autoSavedIdRef = useRef(null);

  useEffect(() => {
    function handler() { onBack(); }
    document.addEventListener("studi-back", handler);
    return () => document.removeEventListener("studi-back", handler);
  }, [onBack]);

  // Build a session object for export/history
  function buildSession() {
    return {
      id:        uid(),
      setName:   set.name,
      setId:     set.id,
      date:      new Date().toISOString(),
      score,
      total:     results.length,
      mode:      examMode ? "exam" : questionLimit ? "quick" : "review",
      results,
      questions,
    };
  }

  // Auto-save when results screen first mounts
  useEffect(() => {
    if (!isHistoryView && !saved) {
      const s = buildSession();
      autoSavedIdRef.current = s.id;
      onSaveToHistory(s);
      setSaved(true);
    }
  }, []);

  const session = buildSession();

  const priorSessions = (history || [])
    .filter(h => {
      const matchesSet = (set.id && h.setId === set.id) || h.setName === set.name;
      if (!matchesSet) return false;
      if (!isHistoryView && h.id === autoSavedIdRef.current) return false;
      if (isHistoryView && historyDate && h.date === historyDate) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-5);

  const missedQuestions = questions.filter((q, i) => {
    const r = results.find(r => r.qId === q.id);
    return r && !r.correct;
  });
  const hasMissed = missedQuestions.length > 0 && !isHistoryView && onRetryMissed;

  return (
    <div>
      {exportModal && <ExportResultsModal session={session} onClose={onCloseExport} />}
      {confirmRetry && (
        <ConfirmDialog
          title="Start over?"
          message="This will clear your answers and restart from the beginning."
          confirmLabel="Retry"
          onConfirm={() => { onCloseConfirmRetry(); onRestart(); }}
          onCancel={onCloseConfirmRetry}
        />
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button {...glassPress()} onClick={e => {
            const rect = e.currentTarget.parentElement.getBoundingClientRect();
            setFilterPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
            setFilterOpen(o => !o);
          }} className={`button button-round ${(filterOpen || resultsFilter !== "all") ? 'button-tonal' : 'button-raised'}`}
          style={{ gap: "0.4rem", height: "36px", paddingLeft: "1rem", paddingRight: "1rem", flexShrink: 0, fontFamily: FF_SANS, fontWeight: 500, fontSize: "0.9rem", WebkitTapHighlightColor: "transparent", textTransform: "none", transition: "background 0.2s, box-shadow 0.2s",
            ...((filterOpen || resultsFilter !== "all") ? { background: T.accent + "25", color: T.accent } : { background: T.surface, color: T.text }) }}>
            <FilterIcon size={13} />
            <span style={{ fontSize: "0.85rem" }}>{resultsFilter === "correct" ? "Correct" : resultsFilter === "incorrect" ? "Incorrect" : "All"}</span>
          </button>
          {filterOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setFilterOpen(false)} />
              <div className="menu-open" style={{
                position: "fixed", top: filterPos.top, right: filterPos.right, zIndex: 9999,
                background: T.mode === "light" ? "#ffffff" : "#1e1630",
                border: "1px solid " + (T.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"),
                borderRadius: "16px", overflow: "hidden",
                boxShadow: T.mode === "light" ? "0 8px 40px rgba(0,0,0,0.12)" : "0 8px 40px rgba(0,0,0,0.4)",
                minWidth: "160px",
              }}>
                {[
                  { id: "all", label: "All" },
                  { id: "incorrect", label: "Incorrect only" },
                  { id: "correct", label: "Correct only" },
                ].map(opt => (
                  <button key={opt.id} {...surfacePress()} onClick={() => { setResultsFilter(opt.id); setFilterOpen(false); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      background: resultsFilter === opt.id ? T.accent + "18" : "transparent",
                      border: "none", padding: "0.85rem 1.1rem",
                      fontFamily: FF_SANS, fontSize: "0.92rem",
                      color: resultsFilter === opt.id ? T.accent : T.text, cursor: "pointer",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = resultsFilter === opt.id ? T.accent + "18" : "transparent"; }}>
                    {opt.label}
                    {resultsFilter === opt.id && <span style={{ float: "right" }}>&#10003;</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ ...card({ marginBottom: "1.5rem", padding: 0, overflow: "hidden", borderColor: passed ? T.green + "55" : T.red + "55" }) }}>
        {/* Score row */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem 1.25rem 1rem" }}>
          <div style={{ width: "88px", height: "88px", borderRadius: "50%", flexShrink: 0,
            border: "3px solid " + (passed ? T.green : T.red),
            background: passed ? corBgCard() : wroBgCard(),
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AnimatedPct target={pct} color={passed ? T.green : T.red} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: FF_SANS, fontWeight: 700, fontSize: "1.15rem",
              color: passed ? T.green : T.red, marginBottom: "0.25rem" }}>
              {passed ? "Pass ✓" : "Not yet"}
            </p>
            <p style={{ fontFamily: FF_SANS, fontWeight: 600, fontSize: "0.9rem", color: T.text, marginBottom: "0.2rem" }}>
              {score} of {results.length} correct
            </p>
            <p style={{ fontFamily: FF_SANS, fontSize: "0.8rem", color: T.muted2,
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>
              {set.name}
            </p>
            {isHistoryView && historyDate && (
              <p style={{ color: T.muted, fontFamily: FF_SANS, fontSize: "0.72rem", marginTop: "0.25rem" }}>
                {new Date(historyDate).toLocaleDateString(undefined, { dateStyle: "full" })}
              </p>
            )}
          </div>
        </div>

        {/* Prior attempts trend */}
        {priorSessions.length > 0 && (
          <div style={{ borderTop: "1px solid " + (T.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"), padding: "1rem 1.25rem" }}>
            <Label style={{ marginBottom: "0.65rem" }}>TREND FOR THIS SET</Label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", overflowX: "auto" }}>
              {priorSessions.map((s, i) => {
                const p = Math.round(s.score / s.total * 100);
                const col = p >= 75 ? T.green : p >= 60 ? "#f59e0b" : T.red;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%",
                      background: col + "1a", border: "2px solid " + col,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: FF_SANS, fontWeight: 700, fontSize: "0.63rem", color: col }}>{p}%</span>
                    </div>
                    <span style={{ fontFamily: FF_SANS, fontSize: "0.58rem", color: T.muted, textAlign: "center", lineHeight: 1.2 }}>
                      {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                <span style={{ color: T.muted, fontSize: "1rem", height: "38px", display: "flex", alignItems: "center", paddingBottom: "2px" }}>→</span>
                <span style={{ fontFamily: FF_SANS, fontSize: "0.58rem", color: T.accent, fontWeight: 600 }}>
                  {isHistoryView ? new Date(historyDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "today"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Topic breakdown inline */}
        <TopicSummaryInline results={results} questions={questions} />
      </div>

      <p style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text, marginBottom: "0.75rem" }}>Question Review</p>
      {results.filter(r => {
        if (resultsFilter === "correct") return r.correct;
        if (resultsFilter === "incorrect") return !r.correct;
        return true;
      }).map((r, i) => {
        const q = questions.find(q => q.id === r.qId);
        if (!q) return null;
        const open = expanded === i;
        const corBg = corBgCard(), wroBg = wroBgCard();
        return (
          <div key={i} style={card({ marginBottom: "0.6rem", borderColor: r.correct ? T.green + "44" : T.red + "44" })}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", cursor: "pointer" }}
              onClick={() => setExpanded(open ? null : i)}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.9rem", color: r.correct ? T.green : T.red, flexShrink: 0 }}>
                  {r.correct ? "✓" : "✗"}
                </span>
                <span style={{ fontFamily: FF_SANS, fontSize: "0.72rem", color: T.muted, flexShrink: 0 }}>
                  Q{i + 1}
                </span>
                {q.topic && <Tag label={q.topic.toUpperCase()} color={T.muted2} />}
                <span style={{ flex: 1 }} />
                <span style={{ color: T.muted, display: "flex", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><svg width="14" height="14" viewBox="0 0 24 24" {...IC}><polyline points="6 9 12 15 18 9"/></svg></span>
              </div>
              <span style={{ color: T.muted2, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: FF_SANS, paddingRight: "1.5rem" }}>
                {q.question}
              </span>
            </div>

            <Collapsible open={open}>
              <div style={{ marginTop: "1rem" }}>
                {/* Question text */}
                <p style={{ color: T.text, fontFamily: FF_SANS, fontSize: "0.95rem", lineHeight: 1.65, marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
                  {renderText(q.question)}
                </p>

                {/* Answers */}
                <div style={{ marginBottom: "1rem" }}>
                  {q.type === "single" && (
                    <ReviewSingle q={q} selected={r.selected || []} onSelect={() => {}} submitted={true} />
                  )}
                  {q.type === "multi" && (
                    <ReviewMulti q={q} selected={r.selected || []} onToggle={() => {}} submitted={true} />
                  )}
                  {q.type === "dropdown" && (
                    <ReviewDropdown q={q} selections={r.dropSel || {}} onSelect={() => {}} submitted={true} />
                  )}
                  {q.type === "matching" && (
                    <ReviewMatching q={q} userMatches={r.matchSel || {}} onMatch={() => {}} submitted={true} examMode={false} />
                  )}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div style={{ padding: "0.75rem 0.9rem", background: T.surface2, borderRadius: "6px",
                    borderLeft: "3px solid " + T.accent }}>
                    <p style={{ color: T.muted, fontSize: "0.65rem", fontFamily: FF_SANS, letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                      EXPLANATION
                    </p>
                    <p style={{ color: T.muted2, fontSize: "0.9rem", lineHeight: 1.55 }}>{renderText(q.explanation)}</p>
                  </div>
                )}
              </div>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  HOME — set list
// ════════════════════════════════════════════════════════════════════════

// ── Export modal (reusable) ───────────────────────────────────────────────────
function ExportModal({ set, onClose }) {
  const [copyLabel, setCopyLabel] = useState("Select all & copy");
  const textareaRef = useRef(null);
  const text = JSON.stringify(set, null, 2);

  function handleCopy() {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.select();
    el.setSelectionRange(0, 99999);
    setCopyLabel(navigator.platform.includes("Mac") ? "Press ⌘C to copy" : "Press Ctrl+C to copy");
    setTimeout(() => setCopyLabel("Select all & copy"), 3000);
  }

  return (
    <Modal onClose={onClose}>
      <ModalCard pad="1.5rem" maxWidth={600} scroll>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Label style={{ marginBottom: "0.1rem" }}>EXPORT — "{set.name}"</Label>
            <p style={{ color: T.muted, fontSize: "0.72rem", fontFamily: FF_SANS }}>
              Download or copy this JSON to restore later.
            </p>
          </div>
        </div>
        <textarea ref={textareaRef} readOnly value={text}
          style={{ ...inp(), flex: 1, minHeight: "180px",
            fontFamily: FF_SANS, fontSize: "1rem", lineHeight: 1.5, color: T.muted2 }} />
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <PrimaryButton onClick={handleCopy} small>{copyLabel}</PrimaryButton>
          <GhostButton onClick={onClose} small>Close</GhostButton>
        </div>
      </ModalCard>
    </Modal>
  );
}

// ── Session picker modal ──────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════
// SESSION PICKER & MODALS
// ════════════════════════════════════════════════════════════════════════

function SessionPicker({ set, onStart, onClose, onEdit }) {
  const count = set.questions.length;
  const [step,      setStep]      = useState("mode");   // "mode" | "review-count" | "exam-timer"
  const [mode,      setMode]      = useState(null);     // "review" | "exam"
  const [customMin, setCustomMin] = useState(60);

  const QUICK_OPTIONS = [3, 5, 10, 20].filter(n => n <= count);
  const TIMER_OPTIONS = [30, 60, 90, 120];

  const stepLabel = {
    "mode":         "Study Session",
    "review-count": "Quick Mode",
    "exam-timer":   "Exam Mode",
  }[step];

  const back = step === "review-count" || step === "exam-timer" ? () => setStep("mode") : null;

  return (
    <Modal onClose={onClose}>
      <ModalCard pad="1.75rem" maxWidth={420}>

        {/* Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.3rem" }}>
            {back && (
              <button onClick={back}
                {...surfacePress()}
                style={{ background: "none", border: "none", borderRadius: "99px", color: T.muted, cursor: "pointer", padding: 0, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" {...IC5}><polyline points="15 18 9 12 15 6"/></svg></button>
            )}
            <h2 style={{ fontFamily: FF_SANS, fontWeight: 700, fontSize: "1.1rem", color: T.text }}>{stepLabel}</h2>
          </div>
          <p style={{ color: T.muted, fontSize: "0.82rem", fontFamily: FF_SANS }}>
            {set.name} · {count} question{count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Step: pick mode */}
        {step === "mode" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <OptionButton onClick={() => { if (QUICK_OPTIONS.length > 0) { setMode("review"); setStep("review-count"); } }} disabled={QUICK_OPTIONS.length === 0}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontFamily: FF_SANS, fontWeight: 700, color: T.text, fontSize: "1rem", lineHeight: 1 }}>Quick Mode</span>
                  <span style={{ display: "block", fontFamily: FF_SANS, color: T.muted2, fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.3 }}>
                    {QUICK_OPTIONS.length > 0 ? "A handful of random questions with feedback" : "Need at least 3 questions for this mode"}
                  </span>
                </div>
              </div>
            </OptionButton>
            <OptionButton onClick={() => onStart(null, "review", null)}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontFamily: FF_SANS, fontWeight: 700, color: T.text, fontSize: "1rem", lineHeight: 1 }}>Review Mode</span>
                  <span style={{ display: "block", fontFamily: FF_SANS, color: T.muted2, fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.3 }}>
                    All {count} questions, answers as you go
                  </span>
                </div>
              </div>
            </OptionButton>
            <OptionButton onClick={() => { setMode("exam"); setStep("exam-timer"); }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontFamily: FF_SANS, fontWeight: 700, color: T.text, fontSize: "1rem", lineHeight: 1 }}>Exam Mode</span>
                  <span style={{ display: "block", fontFamily: FF_SANS, color: T.muted2, fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.3 }}>
                    Timed, no feedback until the end
                  </span>
                </div>
              </div>
            </OptionButton>
          </div>
        )}

        {/* Step: review question count */}
        {step === "review-count" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {QUICK_OPTIONS.map(n => (
              <OptionButton key={n} onClick={() => onStart(n, "review", null)}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontFamily: FF_SANS, fontWeight: 700, color: T.text, fontSize: "1rem", lineHeight: 1 }}>{n} questions</span>
                    <span style={{ display: "block", fontFamily: FF_SANS, color: T.muted2, fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.3 }}>
                      Random selection
                    </span>
                  </div>
                </div>
              </OptionButton>
            ))}
          </div>
        )}

        {/* Step: exam timer */}
        {step === "exam-timer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Timer card: quick picks + stepper */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
              background: T.mode === "light" ? "#ede8e0" : "#181614",
              borderRadius: "16px", padding: "1.25rem 1rem",
              boxShadow: T.mode === "light" ? "0 2px 12px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.18)",
            }}>
              {/* Stepper */}
              <div className="stepper stepper-large stepper-round stepper-raised"
                style={{ "--f7-theme-color": T.accent, background: T.mode === "light" ? "#fff" : T.surface2, "--f7-stepper-height": "56px", "--f7-stepper-button-width": "72px", "--f7-stepper-large-height": "56px", "--f7-stepper-large-button-width": "72px" }}>
                <div className="stepper-button-minus" onClick={() => setCustomMin(m => Math.max(5, m - 5))} />
                <div className="stepper-input-wrap">
                  <input type="text" inputMode="numeric" value={customMin}
                    onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setCustomMin(Math.min(240, Math.max(5, v))); }}
                    style={{ fontFamily: FF_SANS, textAlign: "center", color: T.text }} />
                </div>
                <div className="stepper-button-plus" onClick={() => setCustomMin(m => Math.min(240, m + 5))} />
              </div>
              <p style={{ fontFamily: FF_SANS, fontSize: "0.75rem", color: T.muted }}>minutes</p>
              {/* Quick picks */}
              <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                {TIMER_OPTIONS.map(min => (
                  <button key={min} onClick={() => setCustomMin(min)} {...surfacePress()}
                    className={`button button-round${customMin === min ? ' button-fill' : ' button-outline'}`}
                    style={{ flex: 1, height: "44px", fontFamily: FF_SANS, fontSize: "0.85rem", fontWeight: 600,
                      ...(customMin === min ? { background: T.accent, color: "#fff" } : { color: T.text, borderColor: T.border }) }}>
                    {min}m
                  </button>
                ))}
              </div>
            </div>

            {/* Start button outside the card */}
            <PrimaryButton onClick={() => onStart(null, "exam", customMin)} style={{ width: "100%", justifyContent: "center", height: "52px", fontSize: "1rem" }}>
              Start
            </PrimaryButton>

          </div>
        )}

        {step === "mode" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {onEdit && <GhostButton onClick={() => { onClose(); onEdit(); }} style={{ flex: 1 }}>Edit set</GhostButton>}
            <GhostButton onClick={onClose} style={{ flex: 1 }}>Cancel</GhostButton>
          </div>
        )}
      </ModalCard>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  HOME — set list
// ════════════════════════════════════════════════════════════════════════

function ProfileModal({ name, iconId, bg, iconColor, onSave, onClose }) {
  const [draftName,  setDraftName]  = useState(name);
  const [draftIconId, setDraftIconId] = useState(iconId);
  const [draftBg,    setDraftBg]    = useState(bg);
  const [draftIColor,setDraftIColor]= useState(iconColor);

  function randomIcon() {
    const combo = randomProfileCombo(draftIconId);
    setDraftIconId(combo.iconId);
    setDraftBg(combo.bg);
    setDraftIColor(combo.iconColor);
  }

  return (
    <Modal onClose={onClose}>
      <ModalCard pad="2rem" maxWidth={340}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
          <button onClick={randomIcon} {...surfacePress()} style={{
            width: "80px", height: "80px", borderRadius: "99px", background: draftBg,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            transition: "transform 0.15s",
          }}>
            <div style={{ width: draftIconId === "stu" ? "74px" : "44px", height: draftIconId === "stu" ? "74px" : "44px" }}>
              {(PROFILE_ICON_DEFS.find(d => d.id === draftIconId) || PROFILE_ICON_DEFS[0]).svg(draftIColor, draftBg)}
            </div>
          </button>
        </div>
        <p style={{ fontFamily: FF_SANS, fontSize: "0.75rem", color: T.muted,
          textAlign: "center", marginBottom: "1.25rem" }}>Tap to change</p>
        <input value={draftName} onChange={e => setDraftName(e.target.value)}
          placeholder="Your name" maxLength={15}
          style={{ ...inp({ width: "100%", marginBottom: "1.25rem", textAlign: "center",
            fontFamily: FF_SANS, fontSize: "1rem" }) }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <PrimaryButton onClick={() => { onSave(draftName || "Profile", draftIconId, draftBg, draftIColor); onClose(); }}
            style={{ width: "100%", justifyContent: "center" }}>
            Save
          </PrimaryButton>
          <GhostButton onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
            Cancel
          </GhostButton>
        </div>
      </ModalCard>
    </Modal>
  );
}

function GlobalNav({ theme, onSetTheme, accent, onSetAccent, bgStyle, onSetBgStyle, sets, history, onClearAll, screen, profileName, profileIconId, profileBg, profileIColor, onSaveProfile, onRequestClear, sidebarMode = false, forceMobile = false, onToggleForceMobile, onSmartImport, activeSet, allTags, onRenameActiveSet, onSetActiveSetTags, onSetActiveSetIcon, onDeleteActiveSet, reviewResults, reviewQs, historySession, onRequestRetry, onRetryMissed, onRequestDeleteResults, onStudyFromHistory, editCanSave = false, inSearch = false, onDismissSearch }) {
  const inSession = screen === "review" || screen === "edit" || screen === "results" || screen === "historyResults";
  const inEdit = screen === "edit";
  const inResults = screen === "results" || screen === "historyResults";
  const isHist = screen === "historyResults";
  const resultsMissed = (reviewResults && reviewQs)
    ? reviewQs.filter(q => { const r = reviewResults.find(rv => rv.qId === q.id); return r && !r.correct; })
    : [];
  const hasMissed = resultsMissed.length > 0 && !isHist;
  const [showProfile, setShowProfile] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [section, setSection] = useState(null); // null | "appearance" | "color"
  const navRef = useRef(null);
  const importRef = useRef(null);
  const [iconPickerActiveSetOpen, setIconPickerActiveSetOpen] = useState(false);
  const [confirmDeleteActiveSet,  setConfirmDeleteActiveSet]  = useState(false);

  useEffect(() => {
    if (!open || sidebarMode) return;
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) { setOpen(false); setSection(null); }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open, sidebarMode]);

  useEffect(() => {
    function handle() { setIconPickerActiveSetOpen(true); }
    document.addEventListener("studi-edit-icon", handle);
    return () => document.removeEventListener("studi-edit-icon", handle);
  }, []);

  useEffect(() => {
    function handle() { setConfirmDeleteActiveSet(true); }
    document.addEventListener("studi-edit-delete", handle);
    return () => document.removeEventListener("studi-edit-delete", handle);
  }, []);

  function close() { if (!sidebarMode) { setOpen(false); setSection(null); } }

  function exportActiveSetFn() {
    if (!activeSet) return;
    const json = JSON.stringify([activeSet], null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (activeSet.name || "set").replace(/[^a-z0-9]/gi, "-").toLowerCase() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportResultsFn() {
    const sess = isHist
      ? historySession
      : (reviewResults && reviewQs ? { results: reviewResults, questions: reviewQs, setName: activeSet?.name, date: new Date().toISOString() } : null);
    if (!sess) return;
    const json = JSON.stringify(sess, null, 2);
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    a.download = (sess.setName || "results").replace(/\s+/g, "-").toLowerCase() + "-results.json";
    a.click();
  }

  return (
    <div ref={navRef} style={{ position: "relative" }}>
      {showProfile && <ProfileModal name={profileName} iconId={profileIconId} bg={profileBg} iconColor={profileIColor} onSave={onSaveProfile} onClose={() => setShowProfile(false)} />}

      {iconPickerActiveSetOpen && activeSet && (
        <IconPickerModal
          currentIcon={activeSet.icon || null}
          onSelect={iconId => { onSetActiveSetIcon && onSetActiveSetIcon(activeSet.id, iconId); setIconPickerActiveSetOpen(false); }}
          onClose={() => setIconPickerActiveSetOpen(false)}
        />
      )}
      {confirmDeleteActiveSet && activeSet && (
        <ConfirmDialog
          title="Delete this study set?"
          message={activeSet.name + " and all its questions will be permanently removed."}
          onConfirm={() => { setConfirmDeleteActiveSet(false); onDeleteActiveSet(activeSet.id); }}
          onCancel={() => setConfirmDeleteActiveSet(false)}
        />
      )}

      {!sidebarMode && (
        (!inEdit && !inResults && inSearch) ? (
          <GlassButton onClick={() => { onDismissSearch?.(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </GlassButton>
        ) : (!inEdit && !inResults) ? (
          <div onClick={() => { setOpen(o => !o); if (open) setSection(null); }} style={{ cursor: "pointer", flexShrink: 0, WebkitTapHighlightColor: "transparent" }}>
            <ProfileIconDisplay iconId={profileIconId} bg={profileBg} iconColor={profileIColor} size={44} />
          </div>
        ) : (inEdit && editCanSave) ? (
          <GlassButton onClick={() => { setOpen(o => !o); if (open) setSection(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </GlassButton>
        ) : (
          <GlassButton onClick={() => { setOpen(o => !o); if (open) setSection(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.muted2} strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </GlassButton>
        )
      )}

      {(open || sidebarMode) && (
        <div style={sidebarMode ? { paddingBottom: "1rem" } : { ...menuPopupStyle({ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 500, minWidth: "200px" }) }} className={sidebarMode ? "" : "menu-open"}>

          {/* ── Profile row ── */}
          {section === null && !inEdit && !inResults && (
          <button onClick={() => { close(); setShowProfile(true); }} style={{
            display: "flex", alignItems: "center", gap: "0.85rem",
            width: "100%", background: "transparent", border: "none",
            padding: "0.9rem 1.25rem",
            
            cursor: "pointer",
          }}
            onMouseEnter={e => e.currentTarget.style.background = T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ProfileIconDisplay iconId={profileIconId} bg={profileBg} iconColor={profileIColor} size={36} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontFamily: FF_SANS, fontWeight: 600, fontSize: "0.92rem", color: T.text, lineHeight: 1.2 }}>
                {profileName}
              </p>
            </div>
          </button>
          )}

          {/* ── Edit page menu ── */}
          {section === null && inEdit && (
            <>
              <HamburgerMenuItem onClick={() => { if (!editCanSave) return; close(); document.dispatchEvent(new CustomEvent("studi-save")); }} color={editCanSave ? T.accent : T.muted}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  <span>Save</span>
                </span>
              </HamburgerMenuItem>
              <HamburgerMenuItem onClick={() => { close(); document.dispatchEvent(new CustomEvent("studi-edit-icon")); }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
                  <span>Icon</span>
                </span>
              </HamburgerMenuItem>
              <HamburgerMenuItem onClick={() => { exportActiveSetFn(); close(); }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Export set</span>
                </span>
              </HamburgerMenuItem>
              <HamburgerMenuItem danger color={T.red} onClick={() => { close(); document.dispatchEvent(new CustomEvent("studi-edit-delete")); }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <TrashIcon size={15} />
                  <span>Delete set</span>
                </span>
              </HamburgerMenuItem>
            </>
          )}

          {/* ── Results page menu ── */}
          {section === null && inResults && (
            <>
              {!isHist && (
                <HamburgerMenuItem onClick={() => { close(); onRequestRetry?.(); }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    <span>Retry</span>
                  </span>
                </HamburgerMenuItem>
              )}
              {hasMissed && (
                <HamburgerMenuItem onClick={() => { close(); onRetryMissed?.(resultsMissed); }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span>Retry missed</span>
                  </span>
                </HamburgerMenuItem>
              )}
              {isHist && (
                <HamburgerMenuItem onClick={() => { close(); onStudyFromHistory?.(); }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>Study set</span>
                  </span>
                </HamburgerMenuItem>
              )}
              <HamburgerMenuItem onClick={() => { exportResultsFn(); close(); }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Export</span>
                </span>
              </HamburgerMenuItem>
              <HamburgerMenuItem danger color={T.red} onClick={() => { close(); onRequestDeleteResults?.(); }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <TrashIcon size={15} />
                  <span>Delete</span>
                </span>
              </HamburgerMenuItem>
            </>
          )}

          {/* ── Main menu ── */}
          {section === null && !inEdit && !inResults && (
            <>
              <HamburgerMenuItem onClick={() => setSection("appearance")} right={<span style={{ fontSize: "0.8rem", color: T.muted }}>›</span>}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" {...IC}>
                    <circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                  <span>Appearance</span>
                </span>
              </HamburgerMenuItem>

              <input ref={importRef} type="file" accept=".json" onChange={e => { const f = e.target.files[0]; if (f && onSmartImport) { onSmartImport(f); close(); } e.target.value = ""; }} style={{ display: "none" }} />


              {!inSession && (<>
              <button onClick={() => importRef.current?.click()}
                {...surfacePress()} style={{ width: "100%", background: "transparent", border: "none", padding: "0.9rem 1.25rem", fontFamily: FF_SANS, fontSize: "0.95rem", color: T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Import</span>
              </button>

              <button onClick={() => { exportAll(sets, "studi-sets.json"); close(); }}
                {...surfacePress()} style={{ width: "100%", background: "transparent", border: "none", padding: "0.9rem 1.25rem", fontFamily: FF_SANS, fontSize: "0.95rem", color: T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1rem" }}>⊞</span>
                <span>Export all sets</span>
              </button>

              <button onClick={() => { exportAll(history, "studi-history.json"); close(); }}
                {...surfacePress()} style={{ width: "100%", background: "transparent", border: "none", padding: "0.9rem 1.25rem", fontFamily: FF_SANS, fontSize: "0.95rem", color: T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1rem" }}>◷</span>
                <span>Export all history</span>
              </button>

              <HamburgerMenuItem onClick={() => { close(); onRequestClear(); }} color={T.red} danger>
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <TrashIcon size={15} />
                  <span>Clear all data</span>
                </span>
              </HamburgerMenuItem>
              </>)}
            </>
          )}
          {section === "appearance" && (
            <>
              <HamburgerSectionHeader label="Appearance" onBack={() => setSection(null)} noBorder />

              <div style={{ padding: "0.25rem 1.25rem 0.75rem" }}>
                <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, marginBottom: "0.5rem" }}>Theme</p>
                <div style={{ marginBottom: "1rem" }}>
                  <ThemePicker theme={theme} onSetTheme={onSetTheme} />
                </div>

                <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, marginBottom: "0.5rem" }}>Color</p>
                <div style={{ marginBottom: "1rem" }}>
                  <ColorPicker accent={accent} onSetAccent={onSetAccent} />
                </div>

                <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, marginBottom: "0.5rem" }}>Background</p>
                <div style={{ marginBottom: "0.25rem" }}>
                  <BackgroundPicker bgStyle={bgStyle} onSetBgStyle={onSetBgStyle} large />
                </div>

              </div>
            </>
          )}

          {/* Version */}
          {section === null && !inEdit && !inResults && (
            <p style={{ fontFamily: FF_SANS, fontSize: "0.6rem", letterSpacing: "0.1em",
              color: T.muted, textAlign: "center", padding: "0.6rem 1.25rem",
               }}>
              {`POUNCE v${APP_VERSION}`}
            </p>
          )}

        </div>
      )}
    </div>
  );
}

// ── Tag picker modal ──────────────────────────────────────────────────────────
function TagPicker({ set, allTags, onSetTags, onClose }) {
  const [selected, setSelected] = useState(set.tags || []);
  const [newTag,   setNewTag]   = useState("");

  function toggle(tag) {
    setSelected(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length >= 5 ? prev : [...prev, tag]);
  }
  function addTag() {
    const t = newTag.trim();
    if (!t) return;
    if (selected.length >= 5) return;
    setSelected(prev => prev.includes(t) ? prev : [...prev, t]);
    setNewTag("");
  }
  function commit() { onSetTags(set.id, selected); onClose(); }

  return (
    <Modal onClose={onClose} zIndex={1000}>
      <div style={{ ...card({ padding: 0, borderRadius: "16px", width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", overflow: "hidden" }) }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: "1.1rem 1.25rem 0.75rem",
           }}>
          <p style={{ fontFamily: FF_SANS, fontSize: "0.72rem", letterSpacing: "0.12em", color: T.muted2, marginBottom: "0.25rem" }}>TAGS</p>
          <p style={{ fontFamily: FF_SANS, fontWeight: 600, fontSize: "0.95rem", color: T.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{set.name}</p>
        </div>

        <div style={{ padding: "0.9rem 1.25rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", minHeight: "3rem" }}>
          {allTags.length === 0 && selected.length === 0 && !newTag && (
            <p style={{ color: T.muted, fontSize: "0.8rem", fontFamily: FF_SANS }}>No tags yet — create one below.</p>
          )}
          {[...new Set([...allTags, ...selected])].map(tag => {
            const active = selected.includes(tag);
            const color = tagColor(tag);
            return (
              <button key={tag} onClick={() => toggle(tag)} style={{
                padding: "0.35rem 0.85rem", borderRadius: "99px", border: "none", cursor: "pointer",
                fontFamily: FF_SANS, fontSize: "0.8rem", fontWeight: active ? 600 : 400,
                background: active ? color : T.mode === "light" ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)",
                color: active ? "#fff" : T.muted2,
              }}>{tag}</button>
            );
          })}
        </div>

        <div style={{ padding: "0.5rem 1.25rem 0.9rem", display: "flex", gap: "0.5rem",
           }}>
          <input value={newTag} onChange={e => setNewTag(e.target.value)} maxLength={10}
            onKeyDown={e => { if (e.key === "Enter") addTag(); }}
            placeholder="New tag…"
            style={{ ...inp({ flex: 1, fontSize: "1rem" }) }} />
          <SuccessButton onClick={e => { addTag(); e.currentTarget.blur(); }} small>Add</SuccessButton>
        </div>

        <div style={{ padding: "0.75rem 1.25rem 1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end",
           }}>
          <GhostButton onClick={onClose} small>Cancel</GhostButton>
          <PrimaryButton onClick={commit} small>Done</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

// ── Set card ──────────────────────────────────────────────────────────────────
function SetCard({ s, allTags, onEdit, onExport, onStudy, onDelete, onSetTags, onRename, onSetIcon, lastSession, mastery }) {
  const canStudy = s.questions.length > 0;
  const iconDef = s.icon ? SET_ICONS.flatMap(c => c.icons).find(i => i.id === s.icon) : null;
  const masteryColor = mastery == null ? null : mastery >= 75 ? T.green : mastery >= 60 ? "#f59e0b" : T.red;

  return (
    <AppCard onClick={() => canStudy && onStudy(s)} style={{ cursor: canStudy ? "pointer" : "default", opacity: canStudy ? 1 : 0.6, scrollSnapAlign: "start" }}>
      <div style={{ display: "flex", gap: "0.85rem" }}>

        {/* Icon square — self-centered */}
        <div style={{
          alignSelf: "center", flexShrink: 0,
          width: "64px", height: "64px",
          borderRadius: "14px",
          background: T.accent + "18",
          boxShadow: T.mode === "light"
            ? "0 1px 4px rgba(0,0,0,0.10), 0 3px 8px rgba(0,0,0,0.08)"
            : "0 1px 4px rgba(0,0,0,0.30), 0 3px 8px rgba(0,0,0,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {iconDef ? (
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconDef.path} />
            </svg>
          ) : (
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none" stroke={T.accent} strokeWidth="5">
              <ellipse cx="50" cy="68" rx="22" ry="18"/>
              <ellipse cx="22" cy="46" rx="11" ry="13" transform="rotate(-15 22 46)"/>
              <ellipse cx="42" cy="32" rx="11" ry="13" transform="rotate(-5 42 32)"/>
              <ellipse cx="63" cy="32" rx="11" ry="13" transform="rotate(5 63 32)"/>
              <ellipse cx="80" cy="46" rx="11" ry="13" transform="rotate(15 80 46)"/>
            </svg>
          )}
        </div>

        {/* Right content — name top, tags bottom */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: "64px" }}>
          <p style={{ fontFamily: FF_SANS, fontWeight: 600, color: canStudy ? T.text : T.muted, fontSize: "0.95rem", lineHeight: 1.4, margin: 0 }}>
            {s.name}
          </p>
          <span style={{ fontSize: "0.72rem", fontFamily: FF_SANS, letterSpacing: "0.05em", color: T.muted, marginTop: "0.2rem" }}>
            {s.questions.length} Questions
          </span>
          <div style={{ flex: 1, minHeight: "0.4rem" }} />
          {(s.tags && s.tags.length > 0) && (
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {[...s.tags].sort((a, b) => a.localeCompare(b)).slice(0, 5).map(tag => <TagChip key={tag} tag={tag} />)}
            </div>
          )}
        </div>

      </div>
    </AppCard>
  );
}
// ── Icon Picker Modal ──────────────────────────────────────────────────────
function IconPickerModal({ currentIcon, onSelect, onClose }) {
  return (
    <Modal onClose={onClose}>
      <ModalCard pad="1.25rem" maxWidth={380} scroll>
        <p style={{ fontFamily: FF_SANS, fontSize: "0.72rem", letterSpacing: "0.1em", color: T.muted }}>SET ICON</p>

        {/* No icon option */}
        <div
          onClick={() => { onSelect(null); onClose(); }}
          {...surfacePress()}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.65rem 0.85rem", borderRadius: "12px", cursor: "pointer",
            border: "1px solid " + (currentIcon === null ? T.accent : T.border),
            background: currentIcon === null ? T.accent + "10" : "transparent",
            marginBottom: "1rem",
          }}>
          <div style={{ width: 32, height: 32, borderRadius: "8px", background: T.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <span style={{ fontFamily: FF_SANS, fontSize: "0.9rem", color: T.text, fontWeight: currentIcon === null ? 600 : 400 }}>No icon</span>
          {currentIcon === null && <span style={{ marginLeft: "auto", color: T.accent, fontSize: "0.8rem" }}>✓</span>}
        </div>

        {/* Categories */}
        {SET_ICONS.map(cat => (
          <div key={cat.category} style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, marginBottom: "0.5rem" }}>{cat.category.toUpperCase()}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {cat.icons.map(icon => {
                const active = currentIcon === icon.id;
                return (
                  <div
                    key={icon.id}
                    onClick={() => { onSelect(icon.id); onClose(); }}
                    {...surfacePress()}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem",
                      padding: "0.6rem 0.25rem", borderRadius: "12px", cursor: "pointer",
                      border: "1px solid " + (active ? T.accent : T.border),
                      background: active ? T.accent + "10" : "transparent",
                    }}>
                    <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? T.accent : T.muted2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon.path} />
                      </svg>
                    </div>
                    <span style={{ fontFamily: FF_SANS, fontSize: "0.62rem", color: active ? T.accent : T.muted, textAlign: "center", lineHeight: 1.2 }}>{icon.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </ModalCard>
    </Modal>
  );
}
// ── Tag section ───────────────────────────────────────────────────────────────
// ── Ghost card ────────────────────────────────────────────────────────────
function GhostCard({ onClick }) {
  return (
    <div onClick={onClick} style={{
      borderRadius: "16px",
      border: "2px dashed " + T.accent + "44",
      background: T.accent + "05",
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: "0.6rem",
      minHeight: "108px",
      transition: "border-color 0.2s, background 0.2s",
      scrollSnapAlign: "start",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent + "88"; e.currentTarget.style.background = T.accent + "0d"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.accent + "44"; e.currentTarget.style.background = T.accent + "05"; }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: "1.4rem", color: T.accent, opacity: 0.5, lineHeight: 1 }}>＋</span>
        <span style={{ fontFamily: FF_SANS, fontSize: "0.8rem", color: T.muted, fontWeight: 500 }}>New set</span>
      </div>
    </div>
  );
}

function TagSection({ tag, sets, allTags, onEdit, onExport, onStudy, onDelete, onSetTags, onSetIcon, onRename, cardColumns = 1, onCreate, history = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [contentHeight, setContentHeight] = useState(null);
  const contentRef = useRef(null);
  const tagSets = sets.filter(s => (s.tags || []).includes(tag));

  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  });

  function setInfo(s) {
    const sessions = history.filter(h => h.setId === s.id || h.setName === s.name);
    return {
      lastSession: sessions.length ? [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null,
      mastery: computeMastery(sessions),
    };
  }
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", cursor: "pointer" }}
        onClick={() => setCollapsed(c => !c)}>
        <span style={{ fontFamily: FF_SANS, fontSize: "0.72rem", letterSpacing: "0.1em",
          color: T.accent, fontWeight: 600, flex: 1 }}>
          {tag.toUpperCase()}
        </span>
        <span style={{ color: T.muted, fontSize: "0.72rem", fontFamily: FF_SANS }}>
          {tagSets.length} set{tagSets.length !== 1 ? "s" : ""}
        </span>
        <span style={{ color: T.muted, display: "flex", marginLeft: "0.25rem", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" {...IC}><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      <div style={{
        height: collapsed ? 0 : (contentHeight !== null ? contentHeight : "auto"),
        overflow: collapsed ? "hidden" : "visible",
        transition: collapsed ? "height 0.3s ease, overflow 0s 0s" : "height 0.3s ease, overflow 0s 0.3s",
      }}>
        <div ref={contentRef}>
          {cardColumns === 1 ? (
            <div className="no-scrollbar" style={SET_CARD_SCROLL_GRID}>
              {tagSets.map(s => { const info = setInfo(s); return (
                <SetCard key={s.id} s={s} allTags={allTags}
                  onEdit={onEdit} onExport={onExport}
                  onStudy={onStudy} onDelete={onDelete}
                  onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename}
                  lastSession={info.lastSession} mastery={info.mastery} />
              ); })}
              {onCreate && <GhostCard onClick={() => onCreate(tag)} />}
              <div style={{ gridRow: "1 / 3", width: "0.5rem", flexShrink: 0 }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem", paddingBottom: "0.5rem" }}>
              {tagSets.map(s => { const info = setInfo(s); return (
                <SetCard key={s.id} s={s} allTags={allTags}
                  onEdit={onEdit} onExport={onExport}
                  onStudy={onStudy} onDelete={onDelete}
                  onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename}
                  lastSession={info.lastSession} mastery={info.mastery} />
              ); })}
              {onCreate && <GhostCard onClick={() => onCreate(tag)} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SETS TAB
// ════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════

function SetsTab({ sets, allTags, untaggedSets, onEdit, onExport, onStudy, onDelete, onSetTags, onSetIcon, onRename, externalSearch, externalActiveTag, externalFilterOpen, onSetFilterOpen, onSetActiveTag, cardColumns = 1, onCreate, history = [] }) {
  const [search,     setSearch]     = useState("");
  const effectiveSearch = externalSearch !== undefined ? externalSearch : search;
  const activeTag  = externalActiveTag !== undefined ? externalActiveTag : null;
  const filterOpen = externalFilterOpen || false;
  const setFilterOpen = onSetFilterOpen || (() => {});
  const setActiveTag  = onSetActiveTag  || (() => {});
  const filterRef = useRef(null);
  const [filterPos, setFilterPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [filterOpen]);

  function openFilter(btnEl) {
    const rect = btnEl.getBoundingClientRect();
    setFilterPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setFilterOpen(true);
  }

  const q = effectiveSearch.toLowerCase().trim();
  function matchesSearch(s) {
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || (s.tags || []).some(t => t.toLowerCase().includes(q));
  }

  const filteredSets = sets.filter(s => {
    if (!matchesSearch(s)) return false;
    if (activeTag === null) return true;
    if (activeTag === "__untagged__") return !s.tags || s.tags.length === 0;
    return (s.tags || []).includes(activeTag);
  });
  const isFiltered = !!effectiveSearch || activeTag !== null;

  return (
    <div>
      {sets.length > 0 && activeTag && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem", justifyContent: "flex-end" }}>
        </div>
      )}
      {sets.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div className="stu-bob" style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}><Mochi size={90} /></div>
          <p style={{ fontFamily: FF_SERIF, fontWeight: 300, fontSize: "1.4rem", color: T.text, marginBottom: "0.5rem" }}>No sets yet</p>
          <p style={{ fontFamily: FF_SANS, color: T.muted2, fontSize: "0.9rem", lineHeight: 1.6, maxWidth: "260px", margin: "0 auto" }}>
            Tap the <span style={{ fontWeight: 700, color: T.accent }}>+</span> button below to create your first study set.
          </p>
        </div>
      )}

      {sets.length > 0 && isFiltered && filteredSets.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ fontFamily: FF_SERIF, fontWeight: 300, fontSize: "1.2rem", color: T.text, marginBottom: "0.4rem" }}>No matches</p>
          <p style={{ fontFamily: FF_SANS, color: T.muted2, fontSize: "0.9rem" }}>Try a different search or filter.</p>
        </div>
      )}

      {isFiltered && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem" }}>
          {filteredSets.map(s => {
            const sh = history.filter(h => h.setId === s.id || h.setName === s.name);
            const ls = sh.length ? [...sh].sort((a,b) => new Date(b.date)-new Date(a.date))[0] : null;
            return <SetCard key={s.id} s={s} allTags={allTags}
              onEdit={onEdit} onExport={onExport} onStudy={onStudy} onDelete={onDelete} onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename} lastSession={ls} mastery={computeMastery(sh)} />;
          })}
        </div>
      )}

      {!isFiltered && (
        <>
          {allTags.map(tag => (
            <TagSection key={tag} tag={tag} sets={sets} allTags={allTags}
              onEdit={onEdit} onExport={onExport} onStudy={onStudy} onDelete={onDelete} onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename} cardColumns={cardColumns} onCreate={onCreate} history={history} />
          ))}
          {untaggedSets.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              {allTags.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
                  <span style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text }}>Untagged</span>
                  <span style={{ color: T.muted, fontSize: "0.72rem", fontFamily: FF_SANS }}>{untaggedSets.length} set{untaggedSets.length !== 1 ? "s" : ""}</span>
                </div>
              )}
              {cardColumns === 1 ? (
                <div className="no-scrollbar" style={SET_CARD_SCROLL_GRID}>
                  {untaggedSets.map(s => {
                    const sh = history.filter(h => h.setId === s.id || h.setName === s.name);
                    const ls = sh.length ? [...sh].sort((a,b) => new Date(b.date)-new Date(a.date))[0] : null;
                    return <SetCard key={s.id} s={s} allTags={allTags}
                      onEdit={onEdit} onExport={onExport} onStudy={onStudy} onDelete={onDelete} onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename} lastSession={ls} mastery={computeMastery(sh)} />;
                  })}
                  {onCreate && <GhostCard onClick={() => onCreate(null)} />}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem" }}>
                  {untaggedSets.map(s => {
                    const sh = history.filter(h => h.setId === s.id || h.setName === s.name);
                    const ls = sh.length ? [...sh].sort((a,b) => new Date(b.date)-new Date(a.date))[0] : null;
                    return <SetCard key={s.id} s={s} allTags={allTags}
                      onEdit={onEdit} onExport={onExport} onStudy={onStudy} onDelete={onDelete} onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename} lastSession={ls} mastery={computeMastery(sh)} />;
                  })}
                  {onCreate && <GhostCard onClick={() => onCreate(null)} />}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  HOME — set list
// ════════════════════════════════════════════════════════════════════════

function SearchScreen({ sets, history, allTags, onEdit, onStudy, onViewHistory, onDelete, onDeleteHistory, onSetTags, onSetIcon, onRename, onExport, inputRef: externalRef, query: externalQuery, cardColumns = 1 }) {
  const [internalQuery, setInternalQuery] = useState("");
  const localRef = useRef(null);
  const inputRef = externalRef || localRef;
  const query = externalQuery !== undefined ? externalQuery : internalQuery;
  const setQuery = externalQuery !== undefined ? () => {} : setInternalQuery;

  const q = query.trim().toLowerCase();

  const matchedSets = q ? sets.filter(s =>
    s.name?.toLowerCase().includes(q) ||
    s.questions?.some(qn => qn.question?.toLowerCase().includes(q))
  ) : [];

  const matchedHistory = q ? history.filter(h =>
    h.setName?.toLowerCase().includes(q)
  ) : [];

  const hasResults = matchedSets.length > 0 || matchedHistory.length > 0;

  const recentSets = [...sets].slice(-4).reverse();
  const recentHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  return (
    <div>

      {/* Pre-populated recent content */}
      {!q && (
        <div>
          {recentSets.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text, marginBottom: "0.75rem" }}>
                Recent Sets
              </p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem" }}>
                {recentSets.map(s => { const sh = history.filter(h => h.setId === s.id || h.setName === s.name); return <SetCard key={s.id} s={s} allTags={allTags} onEdit={onEdit} onExport={onExport} onStudy={onStudy} onDelete={onDelete} onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename} mastery={computeMastery(sh)} />; })}
              </div>
            </div>
          )}
          {recentHistory.length > 0 && (
            <div>
              <p style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text, marginBottom: "0.75rem" }}>
                Recent Sessions
              </p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem" }}>
                {recentHistory.map(h => <HistoryCard key={h.id} session={h} onView={onViewHistory} />)}
              </div>
            </div>
          )}
          {recentSets.length === 0 && recentHistory.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: T.muted }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto 1rem", opacity: 0.5 }}>
                <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
              </svg>
              <p style={{ fontFamily: FF_SANS, fontSize: "0.95rem" }}>Search across your sets, questions, and history</p>
            </div>
          )}
        </div>
      )}

      {/* No results */}
      {q && !hasResults && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: T.muted }}>
          <p style={{ fontFamily: FF_SANS, fontSize: "0.95rem" }}>No results for <strong>"{query}"</strong></p>
        </div>
      )}

      {/* Sets results */}
      {matchedSets.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text, marginBottom: "0.75rem" }}>
            Sets · {matchedSets.length}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem" }}>
            {matchedSets.map(s => { const sh = history.filter(h => h.setId === s.id || h.setName === s.name); return <SetCard key={s.id} s={s} allTags={allTags} onEdit={onEdit} onExport={onExport} onStudy={onStudy} onDelete={onDelete} onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename} mastery={computeMastery(sh)} />; })}
          </div>
        </div>
      )}

      {/* History results */}
      {matchedHistory.length > 0 && (
        <div>
          <p style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text, marginBottom: "0.75rem" }}>
            History · {matchedHistory.length}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem" }}>
            {matchedHistory.map(h => <HistoryCard key={h.id} session={h} onView={onViewHistory} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Home({ sets, onCreate, onSetTags, onSetIcon, onRename, onEdit, onStudy, onDelete, history, onImportHistory, onDeleteHistory, onViewHistory, tab, setTab, onModalChange, externalSearch, externalActiveTag, externalFilterOpen, onSetFilterOpen, onSetActiveTag, externalHistorySearch, externalHistorySortBy, searchInputRef, searchQuery, cardColumns = 1, setsActiveTag, setSetsActiveTag, setsFilterOpen, setSetsFilterOpen, setsFilterPos, setSetsFilterPos, historySortBy, setHistorySortBy, historySortOpen, setHistorySortOpen, historySortPos, setHistorySortPos, allTagsModalOpen, setAllTagsModalOpen, setModalOpen, allTags, showSidebar = false, profileName = "" }) {
  const [exportingSet, setExportingSet] = useState(null);
  const [pickingSet,   setPickingSet]   = useState(null);

  useEffect(() => { if (onModalChange) onModalChange(!!pickingSet); }, [pickingSet]);

  const untaggedSets = sets.filter(s => !s.tags || s.tags.length === 0);

  // ── Swipe / sliding track ─────────────────────────────────────────────────
  const TAB_ORDER = ["home", "sets", "history"];
  const trackRef       = useRef(null);
  const containerRef   = useRef(null);
  const tabRef         = useRef(tab);
  const lastRealTabRef = useRef(tab !== "search" ? tab : "home");
  const swipeRef       = useRef({ startX: 0, startY: 0, axis: null });
  const panelRefs      = [useRef(null), useRef(null), useRef(null)];

  function setTrackX(idx, extraPx, animated) {
    const el = trackRef.current;
    if (!el) return;
    const base = -(idx / TAB_ORDER.length) * 100;
    el.style.transition = animated ? "transform 0.32s cubic-bezier(0.25, 1, 0.5, 1)" : "none";
    el.style.transform  = extraPx ? `translateX(calc(${base}% + ${extraPx}px))` : `translateX(${base}%)`;
  }

  // Set initial position before first paint to avoid flash
  React.useLayoutEffect(() => {
    setTrackX(TAB_ORDER.indexOf(lastRealTabRef.current), 0, false);
  }, []);

  // Animate to correct position when tab changes from outside (pill taps, etc.)
  useEffect(() => {
    tabRef.current = tab;
    if (tab !== "search") {
      lastRealTabRef.current = tab;
      setTrackX(TAB_ORDER.indexOf(tab), 0, true);
    }
  }, [tab]);

  // Keep page height = active panel height so off-screen panels don't add scroll space
  React.useLayoutEffect(() => {
    function sync() {
      if (tabRef.current === "search") return;
      const idx = TAB_ORDER.indexOf(lastRealTabRef.current);
      const panel = panelRefs[idx]?.current;
      if (panel && containerRef.current) containerRef.current.style.height = panel.scrollHeight + "px";
    }
    sync();
    const ro = new ResizeObserver(sync);
    panelRefs.forEach(r => { if (r.current) ro.observe(r.current); });
    return () => ro.disconnect();
  }, []);

  // Sync height + scroll to top on tab change (useLayoutEffect = before paint)
  const isFirstTabRender = useRef(true);
  React.useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    if (tab === "search") { c.style.height = ""; return; }
    const panel = panelRefs[TAB_ORDER.indexOf(tab)]?.current;
    if (panel) c.style.height = panel.scrollHeight + "px";
    if (!isFirstTabRender.current) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    isFirstTabRender.current = false;
  }, [tab]);

  // Touch event listeners on the root element so swipes work regardless of content height.
  // passive:false on touchmove is required to call preventDefault for horizontal swipes.
  useEffect(() => {
    const el = document.documentElement;

    function onTouchStart(e) {
      if (tabRef.current === "search") return;
      const t = e.touches[0];
      const EDGE = 22;
      // Home and history panels have no horizontal scrollers — allow swipe from anywhere.
      // Sets panel keeps a narrow edge zone to avoid hijacking the horizontal card carousel.
      const fromEdge = tabRef.current === "sets"
        ? (t.clientX < EDGE || t.clientX > window.innerWidth - EDGE)
        : true;
      swipeRef.current = { startX: t.clientX, startY: t.clientY, axis: null, fromEdge };
    }

    function onTouchMove(e) {
      if (tabRef.current === "search") return;
      if (!swipeRef.current.fromEdge) return;
      const t  = e.touches[0];
      const dx = t.clientX - swipeRef.current.startX;
      const dy = t.clientY - swipeRef.current.startY;
      if (swipeRef.current.axis === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        swipeRef.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (swipeRef.current.axis !== "x") return;
      e.preventDefault();
      const idx = TAB_ORDER.indexOf(lastRealTabRef.current);
      let clamped = dx;
      if (idx === 0 && dx > 0)                       clamped = dx * 0.25;
      if (idx === TAB_ORDER.length - 1 && dx < 0)    clamped = dx * 0.25;
      setTrackX(idx, clamped, false);
    }

    function onTouchEnd(e) {
      if (swipeRef.current.axis !== "x") { swipeRef.current.axis = null; return; }
      const t      = e.changedTouches[0];
      const dx     = t.clientX - swipeRef.current.startX;
      const idx    = TAB_ORDER.indexOf(lastRealTabRef.current);
      let newIdx   = idx;
      if (dx < -50 && idx < TAB_ORDER.length - 1) newIdx = idx + 1;
      else if (dx > 50 && idx > 0)                newIdx = idx - 1;
      setTrackX(newIdx, 0, true);
      if (newIdx !== idx) setTab(TAB_ORDER[newIdx]);
      swipeRef.current.axis = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ margin: "0 -1.25rem", overflow: "hidden" }}>
    <div ref={containerRef} style={{ width: "100%" }}>
      {exportingSet && <ExportModal set={exportingSet} onClose={() => setExportingSet(null)} />}
      {pickingSet && (
        <SessionPicker
          set={pickingSet}
          onStart={(limit, mode, timerMinutes) => { setPickingSet(null); onStudy(pickingSet, limit, mode, timerMinutes); }}
          onClose={() => setPickingSet(null)}
          onEdit={() => { setPickingSet(null); onEdit(pickingSet); }}
        />
      )}

      {/* ── Sliding track (home / sets / history) ── */}
      <div ref={trackRef} style={{
        display: tab === "search" ? "none" : "flex",
        width: `${TAB_ORDER.length * 100}%`,
        alignItems: "flex-start",
      }}>
        {/* HOME panel */}
        <div ref={panelRefs[0]} style={{ width: `${100 / TAB_ORDER.length}%`, flexShrink: 0, padding: "0 1.25rem 1.5rem" }}>
          <div style={{ marginTop: "11px" }}>
            <Dashboard history={history} sets={sets} onStudy={onStudy} onViewHistory={onViewHistory} />
          </div>
        </div>

        {/* SETS panel */}
        <div ref={panelRefs[1]} style={{ width: `${100 / TAB_ORDER.length}%`, flexShrink: 0, padding: "6px 1.25rem 1.5rem" }}>
          {sets.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text }}>Your Sets</span>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button {...glassPress()} onClick={e => { const rect = e.currentTarget.parentElement.getBoundingClientRect(); setSetsFilterPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right }); setSetsFilterOpen(o => !o); }}
                  className={`button button-round ${(!!setsActiveTag || setsFilterOpen) ? "button-tonal" : "button-raised"}`}
                  style={{ gap: "0.4rem", height: "36px", paddingLeft: "1rem", paddingRight: "1rem", flexShrink: 0, fontFamily: FF_SANS, fontWeight: 500, fontSize: "0.9rem", WebkitTapHighlightColor: "transparent", textTransform: "none", transition: "background 0.2s, box-shadow 0.2s",
                    ...((!!setsActiveTag || setsFilterOpen) ? { background: T.accent + "25", color: T.accent } : { background: T.surface, color: T.text }) }}>
                  <FilterIcon size={13} />
                  <span style={{ fontSize: "0.85rem" }}>{setsActiveTag ? (setsActiveTag === "__untagged__" ? "Untagged" : setsActiveTag) : "All"}</span>
                </button>
                {setsFilterOpen && ReactDOM.createPortal(
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setSetsFilterOpen(false)} />
                    <div className="menu-open" style={{ position: "fixed", top: setsFilterPos.top, right: setsFilterPos.right, zIndex: 9999, background: T.mode === "light" ? "#ffffff" : "#1e1630", border: "1px solid " + (T.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"), borderRadius: "16px", overflow: "hidden", boxShadow: T.mode === "light" ? "0 8px 40px rgba(0,0,0,0.12)" : "0 8px 40px rgba(0,0,0,0.4)", minWidth: "160px" }}>
                      {[null, ...allTags.slice(0, 5), "__untagged__"].map((tag) => (
                        <button key={tag || "all"} {...surfacePress()} onClick={() => { setSetsActiveTag(tag); setSetsFilterOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: setsActiveTag === tag ? T.accent + "18" : "transparent", border: "none", padding: "0.85rem 1.1rem", fontFamily: FF_SANS, fontSize: "0.92rem", color: setsActiveTag === tag ? T.accent : T.text, cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.background = setsActiveTag === tag ? T.accent + "18" : T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = setsActiveTag === tag ? T.accent + "18" : "transparent"; }}>
                          {tag === null ? "All" : tag === "__untagged__" ? "Untagged" : tag}
                        </button>
                      ))}
                      {allTags.length > 5 && (
                        <button {...surfacePress()} onClick={() => { setSetsFilterOpen(false); setAllTagsModalOpen(true); setModalOpen(true); }} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "0.85rem 1.1rem", fontFamily: FF_SANS, fontSize: "0.92rem", color: T.accent, cursor: "pointer", fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.background = T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                          More ({allTags.length - 5} more) →
                        </button>
                      )}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          )}
          <SetsTab
            sets={sets} allTags={allTags} untaggedSets={untaggedSets}
            onEdit={onEdit} onExport={setExportingSet}
            onStudy={s => setPickingSet(s)} onDelete={onDelete}
            onSetTags={onSetTags} onSetIcon={onSetIcon} onRename={onRename}
            externalSearch={externalSearch}
            externalActiveTag={externalActiveTag}
            externalFilterOpen={externalFilterOpen}
            onSetFilterOpen={onSetFilterOpen}
            onSetActiveTag={onSetActiveTag}
            cardColumns={cardColumns}
            onCreate={tag => onCreate(tag)}
            history={history}
          />
        </div>

        {/* HISTORY panel */}
        <div ref={panelRefs[2]} style={{ width: `${100 / TAB_ORDER.length}%`, flexShrink: 0, padding: "6px 1.25rem 1.5rem" }}>
          {(history?.length ?? 0) > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text }}>Recent</span>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button {...glassPress()} onClick={e => { const rect = e.currentTarget.parentElement.getBoundingClientRect(); setHistorySortPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right }); setHistorySortOpen(o => !o); }}
                  className={`button button-round ${(historySortOpen || historySortBy !== "date-desc") ? "button-tonal" : "button-raised"}`}
                  style={{ gap: "0.4rem", height: "36px", paddingLeft: "1rem", paddingRight: "1rem", flexShrink: 0, fontFamily: FF_SANS, fontWeight: 500, fontSize: "0.9rem", WebkitTapHighlightColor: "transparent", textTransform: "none", transition: "background 0.2s, box-shadow 0.2s",
                    ...((historySortOpen || historySortBy !== "date-desc") ? { background: T.accent + "25", color: T.accent } : { background: T.surface, color: T.text }) }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" {...IC}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
                  <span style={{ fontSize: "0.9rem" }}>{{ "date-desc": "Newest", "date-asc": "Oldest", "score-desc": "Score ↓", "score-asc": "Score ↑" }[historySortBy] || "Sort"}</span>
                </button>
                {historySortOpen && ReactDOM.createPortal(
                  <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setHistorySortOpen(false)} />
                    <div className="menu-open" style={{ position: "fixed", top: historySortPos.top, right: historySortPos.right, zIndex: 9999, background: T.mode === "light" ? "#ffffff" : "#1e1630", border: "1px solid " + (T.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"), borderRadius: "16px", overflow: "hidden", boxShadow: T.mode === "light" ? "0 8px 40px rgba(0,0,0,0.12)" : "0 8px 40px rgba(0,0,0,0.4)", minWidth: "180px" }}>
                      {HISTORY_SORT_OPTIONS.map(opt => (
                        <button key={opt.id} {...surfacePress()} onClick={() => { setHistorySortBy(opt.id); setHistorySortOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", background: historySortBy === opt.id ? T.accent + "18" : "transparent", border: "none", padding: "0.85rem 1.1rem", fontFamily: FF_SANS, fontSize: "0.92rem", color: historySortBy === opt.id ? T.accent : T.text, cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.background = historySortBy === opt.id ? T.accent + "18" : T.mode === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = historySortBy === opt.id ? T.accent + "18" : "transparent"; }}>
                          {opt.label}{historySortBy === opt.id && <span style={{ float: "right" }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          )}
          <ResultsHistoryView
            history={history}
            onImport={onImportHistory}
            onDelete={onDeleteHistory}
            onView={onViewHistory}
            externalSearch={externalHistorySearch}
            externalSortBy={externalHistorySortBy}
            cardColumns={cardColumns}
          />
        </div>
      </div>

      {/* ── SEARCH TAB (not in slider) ── */}
      {tab === "search" && (
        <div style={{ padding: "0 1rem" }}>
          <SearchScreen
            sets={sets}
            history={history}
            allTags={allTags}
            onEdit={onEdit}
            onStudy={s => setPickingSet(s)}
            onViewHistory={onViewHistory}
            onDelete={onDelete}
            onDeleteHistory={onDeleteHistory}
            onSetTags={onSetTags}
            onSetIcon={onSetIcon}
            onRename={onRename}
            onExport={setExportingSet}
            inputRef={searchInputRef}
            query={searchQuery}
            cardColumns={cardColumns}
          />
        </div>
      )}
    </div>
    </div>
  );
}

// ── Topic performance bar ──────────────────────────────────────────────────
function TopicBar({ topic, correct, total }) {
  const pct = Math.round((correct / total) * 100);
  const color = pct >= 75 ? T.green : pct >= 60 ? "#f59e0b" : T.red;
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <div style={{ marginBottom: "0.35rem" }}>
        <p style={{ fontFamily: FF_SANS, fontSize: "0.8rem", fontWeight: 500, color: T.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.15rem" }}>{topic}</p>
        <span style={{ fontFamily: FF_SANS, fontSize: "0.72rem", color, fontWeight: 600 }}>
          {correct}/{total} · {pct}%
        </span>
      </div>
      <div style={{ height: "4px", borderRadius: "4px", overflow: "hidden",
        background: T.mode === "light" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)" }}>
        <div style={{
          height: "100%",
          width: animPct + "%",
          background: color,
          borderRadius: "4px",
          transition: "width 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)",
        }} />
      </div>
    </div>
  );
}

function TopicSummaryInline({ results, questions }) {
  const topicMap = {};
  results.forEach(r => {
    const q = questions.find(q => q.id === r.qId);
    if (!q) return;
    const topic = q.topic && q.topic.trim() ? q.topic.trim() : null;
    if (!topic) return;
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    if (r.correct) topicMap[topic].correct++;
  });

  const topics = Object.entries(topicMap)
    .map(function(e) { return { topic: e[0], correct: e[1].correct, total: e[1].total, pct: Math.round((e[1].correct / e[1].total) * 100) }; })
    .sort(function(a, b) { return a.pct - b.pct; });

  if (topics.length === 0) return null;

  const divider = T.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const trackBg = T.mode === "light" ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.09)";

  return (
    <div style={{ borderTop: "1px solid " + divider }}>
      {topics.map(function(t, i) {
        const color = t.pct >= 75 ? T.green : t.pct >= 60 ? "#f59e0b" : T.red;
        return (
          <div key={t.topic} style={{
            padding: "0.85rem 1.25rem",
            borderBottom: i < topics.length - 1 ? "1px solid " + divider : "none",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontFamily: FF_SANS, fontSize: "0.85rem", fontWeight: 500, color: T.text, lineHeight: 1.4 }}>
                {t.topic}
              </span>
              <span style={{ fontFamily: FF_SANS, fontSize: "0.88rem", fontWeight: 700, color, flexShrink: 0 }}>
                {t.pct}%
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "99px", background: trackBg, overflow: "hidden" }}>
              <div style={{ height: "100%", width: t.pct + "%", background: color, borderRadius: "99px",
                transition: "width 0.7s cubic-bezier(0.34,1.2,0.64,1)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExportResultsModal({ session, onClose }) {
  const [copyLabel, setCopyLabel] = useState("Select all & copy");
  const textareaRef = useRef(null);
  const text = JSON.stringify(session, null, 2);

  function handleCopy() {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.select();
    el.setSelectionRange(0, 99999);
    setCopyLabel(navigator.platform.includes("Mac") ? "Press ⌘C to copy" : "Press Ctrl+C to copy");
    setTimeout(() => setCopyLabel("Select all & copy"), 3000);
  }

  return (
    <Modal onClose={onClose}>
      <ModalCard pad="1.5rem" maxWidth={600} scroll>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Label style={{ marginBottom: "0.1rem" }}>EXPORT RESULTS — "{session.setName}"</Label>
            <p style={{ color: T.muted, fontSize: "0.72rem", fontFamily: FF_SANS }}>
              {new Date(session.date).toLocaleDateString(undefined, { dateStyle: "full" })} · {session.score}/{session.total} correct
            </p>
          </div>
        </div>
        <textarea ref={textareaRef} readOnly value={text}
          style={{ ...inp(), flex: 1, minHeight: "180px",
            fontFamily: FF_SANS, fontSize: "1rem", lineHeight: 1.5, color: T.muted2 }} />
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <PrimaryButton onClick={handleCopy} small>{copyLabel}</PrimaryButton>
          <GhostButton onClick={onClose} small>Close</GhostButton>
        </div>
      </ModalCard>
    </Modal>
  );
}

function HistoryCard({ session, onView }) {
  const pct    = Math.round((session.score / session.total) * 100);
  const passed = pct >= 70;

  return (
    <AppCard onClick={() => onView(session)} style={{ borderColor: passed ? T.green + "44" : T.red + "44" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <p style={{ fontFamily: FF_SANS, fontWeight: 600, color: T.text, fontSize: "0.95rem",
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", lineHeight: 1.4, margin: 0 }}>
          {session.setName}
        </p>
        <span style={{ fontSize: "0.68rem", fontFamily: FF_SANS, letterSpacing: "0.05em", color: T.muted, marginTop: "0.1rem" }}>
          {new Date(session.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
        </span>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.4rem" }}>
          {session.mode && (
            <Tag
              label={session.mode === "quick" ? "QUICK " + session.total : session.mode === "exam" ? "EXAM" : "REVIEW"}
              color={session.mode === "quick" ? "#06b6d4" : session.mode === "exam" ? "#f59e0b" : "#8b5cf6"}
            />
          )}
          <span style={{
            display: "inline-flex", alignItems: "center", padding: "0.15rem 0.7rem", borderRadius: "99px",
            fontSize: "0.63rem", fontFamily: FF_SANS, letterSpacing: "0.1em", fontWeight: 600,
            background: (passed ? T.green : T.red) + "18", color: passed ? T.green : T.red,
            border: "1px solid " + (passed ? T.green : T.red) + "44",
          }}>
            {pct}% · {session.score}/{session.total}
          </span>
        </div>
      </div>
    </AppCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HISTORY TAB
// ════════════════════════════════════════════════════════════════════════

function ResultsHistoryView({ history, onImport, onDelete, onView, externalSearch, externalSortBy, cardColumns = 1 }) {
  const [exportSession, setExportSession] = useState(null);
  const [confirmDel,    setConfirmDel]    = useState(null);
  const sortBy = externalSortBy || "date-desc";
  const searchQ = (externalSearch || "").toLowerCase().trim();

  const sorted = [...history].sort((a, b) => {
    if (sortBy === "date-desc")  return new Date(b.date) - new Date(a.date);
    if (sortBy === "date-asc")   return new Date(a.date) - new Date(b.date);
    const pctA = a.score / a.total, pctB = b.score / b.total;
    if (sortBy === "score-desc") return pctB - pctA;
    if (sortBy === "score-asc")  return pctA - pctB;
    return 0;
  }).filter(s => !searchQ || s.setName.toLowerCase().includes(searchQ));

  const currentSort = HISTORY_SORT_OPTIONS.find(o => o.id === sortBy);

  return (
    <div>
      {exportSession && <ExportResultsModal session={exportSession} onClose={() => setExportSession(null)} />}
      {confirmDel && (
        <ConfirmDialog
          title="Delete this result?"
          message={confirmDel.setName + " session from " + new Date(confirmDel.date).toLocaleDateString() + " will be removed."}
          onConfirm={() => { onDelete(confirmDel.id); setConfirmDel(null); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      {(history?.length ?? 0) === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div className="stu-bob" style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}><Mochi size={90} /></div>
          <p style={{ fontFamily: FF_SERIF, fontWeight: 300, fontSize: "1.4rem", color: T.text, marginBottom: "0.5rem" }}>
            No results yet
          </p>
          <p style={{ fontFamily: FF_SANS, color: T.muted2, fontSize: "0.9rem", lineHeight: 1.6, maxWidth: "260px", margin: "0 auto" }}>
            Complete a study session to start tracking your progress.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cardColumns}, 1fr)`, gap: "0.75rem" }}>
        {sorted.map(session => (
          <HistoryCard
            key={session.id}
            session={session}
            onView={onView}
          />
        ))}
      </div>
    </div>
  );
}

// ── Quick Question widget ─────────────────────────────────────────────────────
function QuickQuestion({ sets }) {
  const allQs = [];
  sets.forEach(function(s) {
    (s.questions || []).forEach(function(q) {
      if (q.type === "single" || q.type === "multi") allQs.push({ q, setName: s.name });
    });
  });

  function pickRandom() {
    if (!allQs.length) return null;
    const item = allQs[Math.floor(Math.random() * allQs.length)];
    const q = item.q;
    const options = q.options ? [...q.options] : [];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = options[i]; options[i] = options[j]; options[j] = tmp;
    }
    return { q, options };
  }

  const [current, setCurrent] = useState(() => pickRandom());
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  function next() { setCurrent(pickRandom()); setSelected([]); setSubmitted(false); }

  if (!current) return null;

  const { q, options } = current;
  const isMulti = q.type === "multi";
  const correctLabels = q.correct.map(i => q.options[i]);
  const isCorrectOverall = submitted &&
    [...selected].sort().join("|||") === [...correctLabels].sort().join("|||");

  function handleClick(opt) {
    if (submitted) return;
    if (isMulti) {
      setSelected(prev =>
        prev.includes(opt)
          ? prev.filter(x => x !== opt)
          : prev.length < q.selectCount ? [...prev, opt] : prev
      );
    } else {
      setSelected([opt]);
      setSubmitted(true);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "0.6rem" }}>
        <p style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text }}>Quick Question</p>
      </div>
      <div style={card({})}>
        {isMulti && (
          <p style={{ fontFamily: FF_SANS, fontSize: "0.78rem", color: T.muted2, marginBottom: "0.5rem" }}>
            Select {q.selectCount}
          </p>
        )}
        <div style={{ fontFamily: FF_SANS, fontSize: "0.95rem", fontWeight: 500, color: T.text, marginBottom: "1rem", lineHeight: 1.5 }}>
          {renderText(q.question)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {options.map(function(opt, i) {
            const { sel: selBg, cor: corBg, wro: wroBg } = answerBgs();
            const isSelected = selected.includes(opt);
            const isCorrect  = correctLabels.includes(opt);
            let bg = T.surface;
            let color = T.muted2;
            if (submitted) {
              if (isCorrect)       { bg = corBg; color = T.green; }
              else if (isSelected) { bg = wroBg; color = T.red; }
            } else if (isSelected) {
              bg = selBg; color = T.accent;
            }
            const label = submitted && isCorrect ? "✓" : submitted && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i);
            return (
              <AnswerButton key={i} onClick={() => handleClick(opt)} bg={bg} color={color} submitted={submitted} label={isMulti ? null : label}>
                {isMulti && (
                  <span style={{
                    minWidth: "20px", height: "20px", border: "1px solid currentColor", borderRadius: "4px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontFamily: FF_SANS, fontWeight: 600,
                    flexShrink: 0, marginTop: "2px", background: isSelected && !submitted ? T.accent + "33" : "transparent",
                  }}>
                    {isSelected && !submitted ? "✓" : label}
                  </span>
                )}
                <span>{renderText(opt)}</span>
              </AnswerButton>
            );
          })}
        </div>
        {isMulti && !submitted && (
          <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
            <PrimaryButton onClick={() => setSubmitted(true)}
              style={{ width: "auto", padding: "0 1.25rem",
                opacity: selected.length === q.selectCount ? 1 : 0.4,
                pointerEvents: selected.length === q.selectCount ? "auto" : "none" }}>
              Submit
            </PrimaryButton>
          </div>
        )}
        {submitted && (
          <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontFamily: FF_SANS, fontSize: "0.9rem", color: isCorrectOverall ? T.green : T.red }}>
              {isCorrectOverall ? "\u2713 Correct!" : "\u2717 Incorrect"}
            </p>
            <PrimaryButton onClick={next} style={{ width: "auto", padding: "0 1.25rem" }}>
              Next →
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════

function Dashboard({ history, sets, onStudy, onViewHistory }) {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const totalSessions  = history.length;
  const totalQuestions = history.reduce((sum, s) => sum + s.total, 0);
  const mastery        = computeMastery(history);

  // Streak — count consecutive days going back from today
  const streak = (() => {
    if (!totalSessions) return 0;
    const days = new Set(history.map(s => new Date(s.date).toDateString()));
    let count = 0;
    const d = new Date();
    while (days.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  // Most recent session
  const lastSession = totalSessions > 0
    ? [...history].sort(function(a, b) { return new Date(b.date) - new Date(a.date); })[0]
    : null;

  // Per-question topic accuracy — keyed by qId so quick-quiz repetition doesn't skew counts
  const qTopicMap = {};
  history.forEach(function(session) {
    if (!session.results || !session.questions) return;
    session.results.forEach(function(r) {
      const q = session.questions.find(function(q) { return q.id === r.qId; });
      if (!q) return;
      const topic = q.topic && q.topic.trim() ? q.topic.trim() : null;
      if (!topic) return;
      if (!qTopicMap[r.qId]) qTopicMap[r.qId] = { correct: 0, total: 0, topic, setNames: [] };
      qTopicMap[r.qId].total++;
      if (r.correct) qTopicMap[r.qId].correct++;
      if (qTopicMap[r.qId].setNames.indexOf(session.setName) === -1) {
        qTopicMap[r.qId].setNames.push(session.setName);
      }
    });
  });
  const topicMap = {};
  Object.values(qTopicMap).forEach(function(q) {
    if (!topicMap[q.topic]) topicMap[q.topic] = { rates: [], setNames: [] };
    topicMap[q.topic].rates.push(q.correct / q.total);
    q.setNames.forEach(function(n) { if (topicMap[q.topic].setNames.indexOf(n) === -1) topicMap[q.topic].setNames.push(n); });
  });
  const allTopics = Object.entries(topicMap)
    .map(function(entry) {
      const topic = entry[0], d = entry[1];
      const pct = Math.round(d.rates.reduce(function(s, r) { return s + r; }, 0) / d.rates.length * 100);
      return { topic, pct, total: d.rates.length, setNames: d.setNames };
    })
    .sort(function(a, b) { return a.pct - b.pct; });

  const [topicsExpanded, setTopicsExpanded] = useState(false);

  const statCard = (label, value, sub, color = T.accent) => (
    <div style={{ ...card({ flex: "1 1 0", textAlign: "center", padding: "1.25rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }) }}>
      <p style={{ fontFamily: FF_SANS, fontSize: "2rem", fontWeight: 700, color, lineHeight: 1, margin: 0, marginBottom: "0.3rem" }}>
        {value !== undefined && value !== null ? value : "—"}
      </p>
      <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, margin: 0, marginBottom: sub ? "0.15rem" : 0 }}>
        {label}
      </p>
      {sub && <p style={{ fontFamily: FF_SANS, fontSize: "0.72rem", color: T.muted2, margin: 0 }}>{sub}</p>}
    </div>
  );

  const sectionLabel = (text) => (
    <p style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text, marginBottom: "0.75rem" }}>
      {text}
    </p>
  );

  if (!totalSessions) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div className="stu-bob" style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}><Mochi size={90} /></div>
        <p style={{ fontFamily: FF_SERIF, fontWeight: 300, fontSize: "1.4rem", color: T.text, marginBottom: "0.5rem" }}>
          No sessions yet
        </p>
        <p style={{ fontFamily: FF_SANS, color: T.muted2, fontSize: "0.9rem", lineHeight: 1.6 }}>
          Complete a study session and save it from the results screen to start tracking your progress here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* Stats row */}
      <div className="card-fade-up" style={{ animationDelay: "0ms" }}>
        {sectionLabel("Overview")}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {statCard("Sessions",  totalSessions,  null, T.accent)}
          {statCard("Questions", totalQuestions, null, T.accent)}
          {statCard("Mastery", mastery != null ? mastery + "%" : "—", null,
            mastery >= 75 ? T.green : mastery >= 60 ? "#f59e0b" : mastery != null ? T.red : T.muted)}
          {statCard("Streak", streak > 0 ? streak + "🔥" : "0", streak > 0 ? "days in a row" : "Study today to start your streak!", T.purple)}
        </div>
      </div>

      {/* Last session */}
      {lastSession && (
        <div className="card-fade-up" style={{ animationDelay: "150ms" }}>
          {sectionLabel("Last Session")}
          <div
            onClick={() => onViewHistory(lastSession)}
            style={{
              ...card({ cursor: "pointer", transition: "background 0.15s",
                borderColor: lastSession.score / lastSession.total >= 0.7 ? T.green + "44" : T.red + "44" }),
            }}
            onMouseEnter={canHover ? e => { e.currentTarget.style.background = T.mode === "light" ? "rgba(248,248,250,1)" : "rgba(42,38,60,1)"; } : undefined}
            onMouseLeave={canHover ? e => { e.currentTarget.style.background = T.mode === "light" ? "#fff" : "rgba(36,32,54,1)"; } : undefined}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0,
                border: "3px solid " + lastSession.score / lastSession.total >= 0.7 ? T.green : T.red,
                background: lastSession.score / lastSession.total >= 0.7 ? corBgCard() : wroBgCard(),
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FF_SANS, fontWeight: 700, fontSize: "1rem",
                  color: lastSession.score / lastSession.total >= 0.7 ? T.green : T.red }}>
                  {Math.round((lastSession.score / lastSession.total) * 100)}%
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FF_SANS, fontWeight: 600, color: T.text, fontSize: "0.95rem",
                  marginBottom: "0.2rem" }}>
                  {lastSession.setName}
                </p>
                <p style={{ fontFamily: FF_SANS, fontSize: "0.72rem", color: T.muted }}>
                  {new Date(lastSession.date).toLocaleDateString(undefined, { dateStyle: "medium" })} · {lastSession.score}/{lastSession.total} correct
                </p>
              </div>
              <span style={{ color: T.muted, fontSize: "0.8rem", flexShrink: 0 }}>›</span>
            </div>
          </div>
        </div>
      )}

      {/* Topic breakdown */}
      {allTopics.length > 0 && (
        <div className="card-fade-up" style={{ animationDelay: "300ms" }}>
          {sectionLabel("Topics")}
          <div style={card({ padding: 0, overflow: "hidden" })}>
            {(topicsExpanded ? allTopics : allTopics.slice(0, 4)).map(function(t, i, arr) {
              const color = t.pct >= 75 ? T.green : t.pct >= 60 ? "#f59e0b" : T.red;
              const divider = T.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
              const trackBg = T.mode === "light" ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.09)";
              return (
                <div key={t.topic} style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid " + divider,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.6rem" }}>
                    <span style={{ fontFamily: FF_SANS, fontSize: "0.88rem", fontWeight: 500, color: T.text, lineHeight: 1.4 }}>
                      {t.topic}
                    </span>
                    <span style={{ fontFamily: FF_SANS, fontSize: "1rem", fontWeight: 700, color, flexShrink: 0, lineHeight: 1 }}>
                      {t.pct}%
                    </span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "99px", background: trackBg, overflow: "hidden", marginBottom: "0.45rem" }}>
                    <div style={{ height: "100%", width: t.pct + "%", background: color, borderRadius: "99px",
                      transition: "width 0.7s cubic-bezier(0.34,1.2,0.64,1)" }} />
                  </div>
                  <span style={{ fontFamily: FF_SANS, fontSize: "0.68rem", color: T.muted }}>
                    {t.total} {t.total === 1 ? "question" : "questions"}
                  </span>
                </div>
              );
            })}
            {allTopics.length > 4 && (
              <button onClick={function() { setTopicsExpanded(function(e) { return !e; }); }}
                style={{
                  display: "block", width: "100%", padding: "0.85rem 1.25rem",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontFamily: FF_SANS, fontSize: "0.8rem", fontWeight: 500,
                  color: T.accent, textAlign: "center",
                  WebkitTapHighlightColor: "transparent",
                }}>
                {topicsExpanded ? "Show less" : "Show all " + allTopics.length + " topics"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Question */}
      <div className="card-fade-up" style={{ animationDelay: "450ms" }}>
        <QuickQuestion sets={sets} />
      </div>

    </div>
  );
}

function FloatingHomeBar({ homeTab, setHomeTab, history, disabled, onSetsTab, fabSlot }) {
  const [lastRealTab, setLastRealTab] = React.useState(homeTab !== "search" ? homeTab : "home");
  React.useEffect(() => { if (homeTab !== "search") setLastRealTab(homeTab); }, [homeTab]);

  const pillBg     = T.mode === "light" ? "#e2e8f0" : "#1e1630";

  const pillShadow = T.mode === "light"
    ? "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)"
    : "0 4px 24px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)";

  return (
    <>
      <div style={{
        position: "fixed", bottom: "21px", left: 0, right: 0,
        zIndex: disabled ? 90 : 100,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        padding: "0 1rem",
        transform: homeTab === "search" ? "translateY(120px)" : "translateY(0)",
        transition: homeTab === "search"
          ? "opacity 0.2s ease, transform 0.28s ease-in"
          : "opacity 0.2s ease, transform 0.42s cubic-bezier(0.34, 1.2, 0.64, 1)",
        opacity: disabled ? 0.4 : 1,
      }}>
      {/* Pill + FAB wrapper */}
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Tab pill */}
      <div style={{
        flex: 1,
        display: "flex", alignItems: "center",
        background: T.mode === "light" ? "rgba(255,255,255,0.68)" : "rgba(143,139,152,0.20)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "99px",
        padding: "0 0.25rem", gap: "0", height: "62px",
        border: "1px solid " + (T.mode === "light" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.12)"),
        boxShadow: pillShadow, pointerEvents: "all",
        position: "relative",
      }}>
        {/* Sliding indicator */}
        <div style={{
          position: "absolute",
          top: "0.25rem", bottom: "0.25rem",
          left: homeTab === "home" ? "0.25rem" : homeTab === "sets" ? "calc(33.33% + 0.06rem)" : homeTab === "history" ? "calc(66.67% - 0.06rem)" :
            lastRealTab === "home" ? "0.25rem" : lastRealTab === "sets" ? "calc(33.33% + 0.06rem)" : "calc(66.67% - 0.06rem)",
          width: "calc(33.33% - 0.17rem)",
          opacity: homeTab === "search" ? 0 : 1,
          borderRadius: "99px",
          background: T.mode === "light" ? "rgba(140,150,165,0.45)" : "rgba(0,0,0,0.55)",
          boxShadow: T.mode === "light"
            ? "inset 0 1px 2px rgba(0,0,0,0.08)"
            : "inset 0 1px 2px rgba(0,0,0,0.2)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "left 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)",
          pointerEvents: "none",
        }} />
        {[
          { id: "home",    label: "Home",
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
          { id: "sets",    label: "Sets",
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
          { id: "history", label: "History",
            badge: (history?.length || 0) > 0 ? history.length : null,
            svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
        ].map(t => {
          const active = homeTab === t.id;
          return (
            <button key={t.id} onClick={() => { setHomeTab(t.id); if (t.id === "sets" && onSetsTab) onSetsTab(); }} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              flex: "1 1 0", minWidth: 0, alignSelf: "stretch",
              padding: 0,
              borderRadius: "99px",
              background: "transparent",
              border: "none", cursor: "pointer",
              position: "relative",
              zIndex: 1,
              gap: "0.2rem",
            }}>
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                color: active ? T.accent : T.mode === "light" ? "#6b7280" : "#9c94b0",
                transition: "color 0.2s",
              }}>
                {t.svg}
                {t.badge && !active && (
                  <span style={{
                    position: "absolute", top: "-10px", right: "-14px",
                    background: T.accent,
                    color: "#fff",
                    fontSize: "0.65rem", fontFamily: FF_SANS, fontWeight: 700,
                    borderRadius: "99px",
                    minWidth: "18px", height: "18px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 4px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    lineHeight: 1,
                  }}>{t.badge}</span>
                )}
              </span>
              <span style={{
                fontSize: "0.72rem", fontFamily: FF_SANS, fontWeight: 500,
                lineHeight: 1, textAlign: "center",
                color: active ? T.accent : T.mode === "light" ? "#6b7280" : "#9c94b0",
                transition: "color 0.2s",
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      {fabSlot}
      </div>
    </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// STATIC STYLES
// ════════════════════════════════════════════════════════════════════════

const STATIC_STYLES = `
  * {
    -webkit-user-select: none;
    user-select: none;
  }
  input, textarea, [contenteditable] {
    -webkit-user-select: text;
    user-select: text;
  }
  @keyframes menuIn {
    0%   { opacity: 0; transform: scale(0.85) translateY(-6px); }
    60%  { opacity: 1; transform: scale(1.02) translateY(1px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes menuInUp {
    0%   { opacity: 0; transform: scale(0.85) translateY(6px); }
    60%  { opacity: 1; transform: scale(1.02) translateY(-1px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes menuOutUp {
    0%   { opacity: 1; transform: scale(1) translateY(0); }
    100% { opacity: 0; transform: scale(0.85) translateY(8px); }
  }
  @keyframes fabItemIn {
    0%   { opacity: 0; transform: translateY(18px) scale(0.68); }
    65%  { opacity: 1; transform: translateY(-2px) scale(1.04); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fabItemOut {
    0%   { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(14px) scale(0.68); }
  }
  .menu-open     { animation: menuIn    0.22s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; transform-origin: top right; }
  .menu-open-up  { animation: menuInUp  0.22s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; transform-origin: bottom right; }
  .menu-open-up-left { animation: menuInUp 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; transform-origin: bottom left; }
  .menu-open-tl  { animation: menuIn    0.22s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; transform-origin: top left; }
  .menu-close-up { animation: menuOutUp 0.12s ease-in forwards; transform-origin: bottom right; pointer-events: none; }

  @keyframes stuBob {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-8px); }
  }
  .stu-bob { animation: stuBob 3s ease-in-out infinite; }

  @keyframes cardFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes matchFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 0.6; transform: translateY(0); }
  }
  @keyframes matchCurrentIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .card-fade-up { animation: cardFadeUp 0.6s ease forwards; opacity: 0; }

  @keyframes barFill {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0% 0 0); }
  }
  @keyframes saveShimmer {
    0%   { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(250%) skewX(-15deg); }
  }
  @keyframes checkPop {
    0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
    60%  { transform: scale(1.35) rotate(4deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes savedTextIn {
    0%   { opacity: 0; transform: translateY(4px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .save-shimmer { animation: saveShimmer 0.6s ease forwards; }
  .check-pop    { animation: checkPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  .saved-text   { animation: savedTextIn 0.2s ease 0.1s both; }

  /* Press feedback */
  .press-primary        { transition: none !important; opacity: 0.75 !important; }
  .press-primary-done   { transition: opacity 0.3s ease !important; opacity: 1 !important; }
  .press-surface.light  { transition: none !important; background: #ece9e4 !important; }
  .press-surface.dark   { transition: none !important; background: #2a2724 !important; }
  .press-surface-done   { transition: background 0.3s ease !important; }
  .press-danger.light   { transition: none !important; background: #fca5a5 !important; }
  .press-danger.dark    { transition: none !important; background: #7f1d1d !important; }
  .press-danger-done    { transition: background 0.3s ease !important; }
  .glass-btn            { background: #ffffff; }
  .dark .glass-btn, .glass-btn.dark-mode { background: rgb(40,36,58); }
  .press-glass.light    { transition: none !important; background: rgba(255,255,255,0.5) !important; }
  .press-glass.dark     { transition: none !important; background: rgba(255,255,255,0.25) !important; }
  .press-glass-done     { transition: background 0.3s ease !important; }

  @keyframes sf-blur-fix { from { opacity: 0.9999; } to { opacity: 1; } }

  .no-scrollbar::-webkit-scrollbar { display: none; }
`;

function DeleteAnimation({ onComplete }) {
  const [phase, setPhase] = useState("start"); // start → open → fill → shake → overfill → close → done

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("open"),     50);
    const t1 = setTimeout(() => setPhase("fill"),     800);
    const t2 = setTimeout(() => setPhase("shake"),    2000);
    const t3 = setTimeout(() => setPhase("overfill"), 2900);
    const t4 = setTimeout(() => setPhase("close"),    3500);
    const t5 = setTimeout(() => setPhase("done"),     4500);
    const t6 = setTimeout(() => onComplete(),         5000);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, []);

  const lidClosed  = phase === "start" || phase === "close" || phase === "done";
  const shaking    = phase === "shake";
  const fillHeight = phase === "fill" || phase === "shake" ? 38
    : phase === "overfill" || phase === "close" || phase === "done" ? 77 : 0;
  const opacity    = phase === "done" ? 0 : 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: T.mode === "light" ? "rgba(247,245,242,0.96)" : "rgba(15,9,5,0.96)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "1.5rem",
      opacity, transition: "opacity 0.4s ease",
    }}>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          15%      { transform: translateX(-6px) rotate(-3deg); }
          30%      { transform: translateX(6px)  rotate(3deg); }
          45%      { transform: translateX(-4px) rotate(-2deg); }
          60%      { transform: translateX(4px)  rotate(2deg); }
          75%      { transform: translateX(-2px) rotate(-1deg); }
          90%      { transform: translateX(2px)  rotate(1deg); }
        }
        @keyframes lidPop {
          0%   { transform: rotate(0deg); }
          40%  { transform: rotate(-38deg) translate(-4px, -6px); }
          100% { transform: rotate(-38deg) translate(-4px, -6px); }
        }
        @keyframes fillRise {
          from { height: 0; }
          to   { height: 38px; }
        }
      `}</style>

      <div style={{
        animation: shaking ? "shake 0.7s ease-in-out" : "none",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <svg width="120" height="160" viewBox="-10 -20 140 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="trashGrad" x1="0" y1="0" x2="120" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={T.accent} />
              <stop offset="100%" stopColor={T.gradient2} />
            </linearGradient>
            <clipPath id="canClip">
              <rect x="18" y="50" width="84" height="80" rx="8" />
            </clipPath>
          </defs>

          {/* Lid — springs open immediately, closes at end */}
          <g style={{
            transformOrigin: "18px 42px",
            transform: lidClosed ? "rotate(0deg) translate(0px,0px)" : "rotate(-35deg) translate(-4px,-6px)",
            transition: lidClosed
              ? "transform 0.6s cubic-bezier(0.34,1.2,0.64,1)"
              : "transform 0.5s cubic-bezier(0.34,1.4,0.64,1)",
          }}>
            {/* Lid body */}
            <rect x="12" y="36" width="96" height="14" rx="7" fill="url(#trashGrad)" />
            {/* Handle */}
            <rect x="46" y="28" width="28" height="10" rx="5" fill="url(#trashGrad)" />
          </g>

          {/* Can body */}
          <rect x="18" y="50" width="84" height="80" rx="8" fill="url(#trashGrad)" opacity="0.15"
            stroke="url(#trashGrad)" strokeWidth="3" />

          {/* Fill level — rises when filling */}
          <rect x="21" y={130 - fillHeight} width="78" height={fillHeight} rx="4"
            fill="url(#trashGrad)" opacity="0.5" clipPath="url(#canClip)"
            style={{ transition: "y 0.7s ease, height 0.7s ease" }} />

          {/* Lines on can */}
          <line x1="45" y1="62" x2="42" y2="118" stroke="url(#trashGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1="60" y1="62" x2="60" y2="118" stroke="url(#trashGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1="75" y1="62" x2="78" y2="118" stroke="url(#trashGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      </div>

      <p style={{ fontFamily: FF_SANS, fontSize: "1rem", color: T.muted2, letterSpacing: "0.02em" }}>
        {phase === "close" || phase === "done" ? "All done." : "Clearing data…"}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// WELCOME & ONBOARDING
// ════════════════════════════════════════════════════════════════════════

function WelcomeModal({ onImportSets, onImportHistory, onDismiss, theme, accent, showToast }) {
  const localT = buildTheme(resolveTheme(theme), accent);
  T = localT;
  const setsRef = useRef(null);
  const histRef = useRef(null);
  const [setsImported, setSetsImported] = useState(false);
  const [histImported, setHistImported] = useState(false);

  function handleSetsFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const incoming = Array.isArray(parsed) ? parsed : [parsed];
        const valid = incoming.filter(validateSet);
        if (valid.length === 0) {
          const looksLikeHistory = incoming.some(s => s && s.setName && Array.isArray(s.results));
          if (looksLikeHistory) { showToast("This looks like history data. Import it from the History section instead."); return; }
          showToast("No valid sets found. Make sure this file was exported from Pounce."); return;
        }
        onImportSets(valid); setSetsImported(true);
      } catch { showToast("Could not read file — invalid JSON."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleHistFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const incoming = Array.isArray(parsed) ? parsed : [parsed];
        const valid = incoming.filter(validateSession);
        if (valid.length === 0) {
          const looksLikeSets = incoming.some(s => s && s.name && Array.isArray(s.questions));
          if (looksLikeSets) { showToast("This looks like a study set. Import it from the Sets section instead."); return; }
          showToast("No valid history found. Make sure this file was exported from Pounce."); return;
        }
        onImportHistory(valid); setHistImported(true);
      } catch { showToast("Could not read file — invalid JSON."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500,
      background: localT.mode === "light"
        ? "linear-gradient(135deg, " + localT.accent + "0f 0%, " + localT.gradient2 + "09 100%)"
        : "linear-gradient(135deg, " + localT.accent + "0c 0%, " + localT.gradient2 + "07 100%)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
      opacity: 0, animation: "cardFadeUp 0.6s ease 0.1s forwards" }}>

      <input ref={setsRef} type="file" accept=".json" onChange={handleSetsFile} style={{ display: "none" }} />
      <input ref={histRef} type="file" accept=".json" onChange={handleHistFile} style={{ display: "none" }} />

      <div style={{
        background: localT.surface,
        border: "1px solid " + (localT.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)"),
        borderRadius: "16px", padding: "2.5rem 2rem",
        maxWidth: "380px", width: "100%", textAlign: "center",
        boxShadow: localT.mode === "light"
          ? "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)"
          : "0 2px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)",
        opacity: 0, animation: "cardFadeUp 0.5s ease 0.3s forwards",
      }}>
        <div style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "center" }}>
          <PounceLogo height={38} theme={localT} />
        </div>
        <p style={{ fontFamily: FF_SERIF, fontWeight: 300, fontSize: "1.3rem", color: localT.text, marginBottom: "0.5rem" }}>
          Welcome!
        </p>
        <p style={{ fontFamily: FF_SANS, fontSize: "0.9rem", color: localT.muted2, lineHeight: 1.6, marginBottom: "2rem" }}>
          Get started by importing an existing study set, or create your first one from scratch.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Import sets — PrimaryButton (gradient border) + {} */}
          {setsImported ? (
            <div style={{ display: "flex", borderRadius: "99px", background: localT.green + "22", border: "1px solid " + localT.green, padding: "0.75rem 1.5rem", justifyContent: "center", fontFamily: FF_SANS, fontSize: "0.95rem", fontWeight: 600, color: localT.green }}>
              ✓ Sets imported
            </div>
          ) : (
            <div style={{ display: "flex", borderRadius: "99px", overflow: "hidden",
              background: "linear-gradient(" + (localT.surface) + ", " + (localT.surface) + ") padding-box, linear-gradient(135deg, " + localT.accent + " 0%, " + localT.gradient2 + " 100%) border-box",
              border: "2px solid transparent" }}>
              <button onClick={() => { if (setsRef.current) setsRef.current.click(); }}
                {...surfacePress()}
                style={{ flex: 1, background: "transparent", color: localT.muted2, border: "none",
                  padding: "0.75rem 1.5rem", fontFamily: FF_SANS, fontSize: "0.95rem",
                  fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                ⊞ Import study sets
              </button>
            </div>
          )}
          {/* Import history — GhostButton (grey surface) + {} */}
          {histImported ? (
            <div style={{ display: "flex", borderRadius: "99px", background: localT.green + "22", border: "1px solid " + localT.green, padding: "0.75rem 1.5rem", justifyContent: "center", fontFamily: FF_SANS, fontSize: "0.95rem", color: localT.green }}>
              ✓ History imported
            </div>
          ) : (
            <div style={{ display: "flex", borderRadius: "99px", overflow: "hidden", background: localT.surface2 }}>
              <button onClick={() => { if (histRef.current) histRef.current.click(); }}
                {...surfacePress()}
                style={{ flex: 1, background: "transparent", color: localT.muted2, border: "none",
                  padding: "0.75rem 1.5rem", fontFamily: FF_SANS, fontSize: "0.95rem",
                  cursor: "pointer", textAlign: "center" }}>
                ◷ Import history
              </button>
            </div>
          )}
          {/* Start fresh — transparent ghost */}
          <button onClick={onDismiss}
            {...surfacePress()}
            style={{ background: "transparent", color: setsImported || histImported ? localT.accent : localT.muted,
              fontWeight: setsImported || histImported ? 600 : 400,
              border: "none", borderRadius: "99px",
              padding: "0.75rem 1.5rem", fontFamily: FF_SANS, fontSize: "0.95rem",
              cursor: "pointer", width: "100%" }}>
            {setsImported || histImported ? "Let's go! →" : "Start fresh"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// NAVIGATION & FAB
// ════════════════════════════════════════════════════════════════════════

function HomeFAB({ onCreate, onImport, disabled }) {
  const [open, setOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const fileRef = useRef(null);
  function closeMenu() {
    setMenuClosing(true);
    setTimeout(() => { setOpen(false); setMenuClosing(false); }, 290);
  }
  useEffect(() => {
    if (!open) return;
    const close = () => closeMenu();
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  if (disabled) return null;
  const fabItems = [
    { label: "Create", onClick: () => { onCreate(); setOpen(false); }, gradient: true,
      icon: <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><line x1="10" y1="2" x2="10" y2="18" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round"/><line x1="2" y1="10" x2="18" y2="10" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round"/></svg> },
    { label: "Import", onClick: () => { fileRef.current?.click(); setOpen(false); }, gradient: false,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
  ];
  return (
    <>
      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }}
        onChange={e => { const f = e.target.files[0]; if (f) onImport(f); e.target.value = ""; }} />
      {open && menuPos && (
        <div style={{
          display: "flex", flexDirection: "column", gap: "0.5rem",
          alignItems: "flex-end",
          position: "fixed",
          bottom: menuPos.bottom + "px",
          right: menuPos.right + "px",
          zIndex: 110, pointerEvents: "all",
        }} onPointerDown={e => e.stopPropagation()}>
          {fabItems.map(({ label, onClick, icon, gradient }, idx) => {
            const n = fabItems.length;
            const openDelay  = (n - 1 - idx) * 65;
            const closeDelay = idx * 55;
            const anim = menuClosing
              ? `fabItemOut 0.18s ease-in ${closeDelay}ms both`
              : `fabItemIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) ${openDelay}ms both`;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.6rem", animation: anim }}>
                <button onClick={onClick} {...surfacePress()} style={{
                  background: T.mode === "light" ? T.surface : T.surface2,
                  border: "1px solid " + T.border, borderRadius: "8px",
                  padding: "0.35rem 0.65rem", fontFamily: FF_SANS, fontSize: "0.85rem", fontWeight: 500,
                  color: T.text, cursor: "pointer", whiteSpace: "nowrap",
                  boxShadow: T.mode === "light"
                    ? "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)"
                    : "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
                }}>{label}</button>
                {gradient
                  ? <GradientBorderButton onClick={onClick} size="44px">{icon}</GradientBorderButton>
                  : <GlassButton onClick={onClick} size={44}>{icon}</GlassButton>}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ flexShrink: 0, pointerEvents: "all" }} onPointerDown={e => e.stopPropagation()}>
        <GradientBorderButton onClick={e => {
          if (open) { closeMenu(); return; }
          const r = e.currentTarget.getBoundingClientRect();
          setMenuPos({ right: window.innerWidth - r.right + 4, bottom: window.innerHeight - r.top + 10 });
          setOpen(true);
        }} size="62px">
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <line x1="10" y1="2" x2="10" y2="18" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="2" y1="10" x2="18" y2="10" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </span>
        </GradientBorderButton>
      </div>
    </>
  );
}

function ResultsFAB({ isHist, hasMissed, onRetry, onRetryMissed, onExport, onExportJson }) {
  const [open, setOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  function closeMenu() { setMenuClosing(true); setTimeout(() => { setOpen(false); setMenuClosing(false); }, 120); }
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", left: "1rem", zIndex: 110, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
      {(open || menuClosing) && (
        <>
          {/* Backdrop */}
          <div style={{ position: "fixed", inset: 0, zIndex: 105 }} onClick={closeMenu} />
          <div className={menuClosing ? "menu-close-up" : "menu-open-up"} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
            {!isHist && (
              <GhostButton onClick={() => { closeMenu(); onRetry(); }} style={{ height: "44px", paddingLeft: "1.1rem", paddingRight: "1.1rem", gap: "0.5rem", whiteSpace: "nowrap" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                Retry
              </GhostButton>
            )}
            {hasMissed && (
              <GhostButton onClick={() => { closeMenu(); onRetryMissed(); }} style={{ height: "44px", paddingLeft: "1.1rem", paddingRight: "1.1rem", gap: "0.5rem", whiteSpace: "nowrap" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Retry missed
              </GhostButton>
            )}
            <div style={fabMenuWrap()}>
              <button onClick={() => { closeMenu(); onExport(); }}
                {...surfacePress()}
                style={fabMenuBtn()}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Export
              </button>
              <div style={{ width: "1px", alignSelf: "stretch", background: T.border }} />
              <button onClick={() => { closeMenu(); onExportJson(); }}
                {...surfacePress()}
                style={fabMenuJsonBtn()}>
                {"{}"}
              </button>
            </div>
          </div>
        </>
      )}
      <GradientBorderButton onClick={() => setOpen(o => !o)} size="60px">
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="2" x2="10" y2="18" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="2" y1="10" x2="18" y2="10" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </span>
      </GradientBorderButton>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════════════════

// ── Sidebar (large screen nav) ─────────────────────────────────────────────
// ── ThemePicker ────────────────────────────────────────────────────────────
function ThemePicker({ theme, onSetTheme }) {
  const opts = [
    { id: "light",  svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
    { id: "dark",   svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
    { id: "system", svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  ];
  return (
    <div className="segmented segmented-raised" style={{ padding: "3px 0", background: T.surface2 }}>
      {opts.map(opt => {
        const active = theme === opt.id || (opt.id === "system" && theme?.startsWith("system"));
        return (
          <button key={opt.id} className={"button" + (active ? " button-active" : "")}
            onClick={() => onSetTheme(opt.id)}
            style={{ color: active ? T.accent : T.muted }}>
            {opt.svg}
          </button>
        );
      })}
    </div>
  );
}


// ── HalftoneCanvas ─────────────────────────────────────────────────────────
function HalftoneCanvas({ color, maxOpacity = 0.15 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;

    function draw() {
      const W = parent ? parent.offsetWidth  : window.innerWidth;
      const H = parent ? parent.offsetHeight : window.innerHeight;
      if (!W || !H) return;
      canvas.width  = W;
      canvas.height = H;

      const ctx     = canvas.getContext("2d");
      const spacing = 8;
      const maxR    = spacing * 0.18;
      ctx.fillStyle = color;

      const shear = 0.3; // ~17° tilt
      for (let x = 0; x <= W + spacing; x += spacing) {
        const tX       = x / W;
        const boundary = H * 0.38 + Math.sin(tX * Math.PI * 1.5) * H * 0.09;
        const fadeW    = H * 0.30;
        const yStart   = (x * shear) % spacing - spacing;
        for (let y = yStart; y <= H + spacing; y += spacing) {
          const s = Math.max(0, Math.min(1, (boundary - y) / fadeW));
          const r = s * maxR;
          if (r < 0.3) continue;
          ctx.globalAlpha = s * maxOpacity;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    draw();
    const ro = new ResizeObserver(draw);
    if (parent) ro.observe(parent);
    return () => ro.disconnect();
  }, [color, maxOpacity]);

  return (
    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", display: "block" }} />
  );
}

// ── GridCanvas ──────────────────────────────────────────────────────────────
function GridCanvas({ color, opacity = 0.13 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;

    function draw() {
      const W = parent ? parent.offsetWidth  : window.innerWidth;
      const H = parent ? parent.offsetHeight : window.innerHeight;
      if (!W || !H) return;
      canvas.width  = W;
      canvas.height = H;

      const ctx     = canvas.getContext("2d");
      const spacing = 32;

      ctx.strokeStyle = color;
      ctx.lineWidth   = 0.5;
      ctx.globalAlpha = opacity;

      for (let x = spacing; x < W; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = spacing; y < H; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Fade out downward using destination-in mask
      const fade = ctx.createLinearGradient(0, 0, 0, H * 0.5);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }

    draw();
    const ro = new ResizeObserver(draw);
    if (parent) ro.observe(parent);
    return () => ro.disconnect();
  }, [color, opacity]);

  return (
    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", display: "block" }} />
  );
}

// ── BackgroundPicker ────────────────────────────────────────────────────────
function BackgroundPicker({ bgStyle, onSetBgStyle, large = false }) {
  const opts = [
    { id: "gradient", label: "Gradient" },
    { id: "dots",     label: "Dots" },
    { id: "grid",     label: "Grid" },
    { id: "none",     label: "None" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: large ? 0 : "0.15rem" }}>
      {opts.map(opt => {
        const active = bgStyle === opt.id;
        return (
          <button key={opt.id} onClick={() => onSetBgStyle(opt.id)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "transparent", border: "none", cursor: "pointer", padding: large ? "0 0.1rem" : "0.3rem 0.1rem", height: large ? "44px" : undefined, fontFamily: FF_SANS, fontSize: large ? "0.9rem" : "0.88rem", fontWeight: large ? 500 : 400, color: active ? T.text : T.muted, textAlign: "left" }}>
            <span style={{ width: large ? "18px" : "16px", height: large ? "18px" : "16px", borderRadius: "50%", border: `2px solid ${active ? T.accent : T.border2}`, background: active ? T.accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s, background 0.15s" }}>
              {active && <span style={{ width: large ? "7px" : "6px", height: large ? "7px" : "6px", borderRadius: "50%", background: "#fff" }} />}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── ColorPicker ────────────────────────────────────────────────────────────
function ColorPicker({ accent, onSetAccent }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {Object.entries(ACCENT_SCHEMES).filter(([key]) => !key.endsWith("_pastel")).map(([key, scheme]) => (
        <button key={key} onClick={() => onSetAccent(key)} title={scheme.label} style={{ width: "28px", height: "28px", borderRadius: "50%", background: scheme.swatch, border: (accent === key || accent === key + "_pastel") ? "3px solid " + T.text : "3px solid transparent", cursor: "pointer" }} />
      ))}
    </div>
  );
}

// ── SidebarActionButton ────────────────────────────────────────────────────
function SidebarActionButton({ onClick, icon, label, danger = false, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "0 -0.75rem" }}>
      <button onClick={onClick} style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem", background: "transparent", border: "none", padding: "0.55rem 0.75rem", cursor: "pointer", fontFamily: FF_SANS, fontSize: "0.9rem", color: danger ? T.red : T.text, textAlign: "left" }}>
        <span style={{ color: danger ? T.red : T.muted, display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>
        {label}
        {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
      </button>
    </div>
  );
}


// ── Desktop FAB — centered text button for large screens ───────────────────
function DesktopFAB({ homeTab, onCreate, disabled, sidebarWidth, setCount = 0 }) {
  if (homeTab !== "sets") return null;
  return (
    <BottomPill sidebarOffset={sidebarWidth} left={`${setCount} ${setCount === 1 ? "set" : "sets"}`}>
      <GradientBorderButton onClick={() => onCreate()} disabled={disabled} style={{ height: "46px", padding: "0 1.7rem" }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <line x1="10" y1="2" x2="10" y2="18" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="2" y1="10" x2="18" y2="10" stroke={T.accent} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        New Set
      </GradientBorderButton>
    </BottomPill>
  );
}

function App() {
  // ── User context — null means guest/local mode.
  // Replace with real auth state when adding cloud backend.
  const [currentUser, setCurrentUser] = useState(null);

  const windowWidth  = useWindowWidth();
  const [forceMobile, setForceMobile] = useState(null);
  const [sidebarAppearanceOpen, setSidebarAppearanceOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState(null);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recentTooltip, setRecentTooltip] = useState(null); // { name, y }
  const sidebarPopupRef = useRef(null);
  const sidebarCogRef = useRef(null);
  useEffect(() => {
    if (!sidebarAppearanceOpen) return;
    function handleOutside(e) {
      if (sidebarCogRef.current && sidebarCogRef.current.contains(e.target)) return;
      if (sidebarPopupRef.current && !sidebarPopupRef.current.contains(e.target)) {
        setSidebarAppearanceOpen(false);
      }
    }
    setTimeout(() => document.addEventListener("pointerdown", handleOutside), 50);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [sidebarAppearanceOpen]);
  useEffect(() => { if (!sidebarAppearanceOpen) setSidebarSection(null); }, [sidebarAppearanceOpen]);
  const sidebarImportRef = useRef(null);

  function handleSidebarImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const incoming = Array.isArray(parsed) ? parsed : [parsed];
        // Auto-detect: history sessions have setName + results array
        const looksLikeHistory = incoming.every(s => s && s.setName && Array.isArray(s.results));
        if (looksLikeHistory) {
          const valid = incoming.filter(validateSession);
          if (valid.length === 0) { showToast("No valid history found."); return; }
          handleImportHistory(valid);
          showToast(`Imported ${valid.length} session${valid.length !== 1 ? "s" : ""}`);
        } else {
          const valid = incoming.filter(validateSet);
          if (valid.length === 0) { showToast("No valid sets found."); return; }
          handleImport(valid);
          showToast(`Imported ${valid.length} set${valid.length !== 1 ? "s" : ""}`);
        }
      } catch { showToast("Could not read file — invalid JSON."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  } // null=auto, true=force mobile, false=force desktop
  const isMobile     = forceMobile !== null ? forceMobile : windowWidth < BREAKPOINT_TABLET;

  const [theme, setThemeState]         = useState(() => localStorage.getItem(THEME_KEY) || "system");
  const [accent, setAccentState]       = useState(() => localStorage.getItem(ACCENT_KEY) || "purple");
  const [bgStyle, setBgStyleState]     = useState(() => localStorage.getItem(BG_STYLE_KEY) || "gradient");
  const [profileName,  setProfileName]  = useState(() => localStorage.getItem(PROFILE_NAME_KEY) || "Profile");
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const name = profileName ? `, ${profileName}` : "";
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const morning   = [`Good morning${name}.`, `Rise and shine${name}!`, `Morning${name}. Ready to learn?`, `Early start${name}. Nice.`, `Morning${name} — let's make it count.`, `Coffee in hand${name}? Let's go.`];
    const afternoon = [`Good afternoon${name}.`, `Afternoon${name}. Keep it going.`, `Hey${name}, afternoon grind?`, `Midday check-in${name}.`];
    const evening   = [`Good evening${name}.`, `Evening${name}. One more session?`, `Hey${name}, evening wind-down?`, `Evening${name}. Let's finish strong.`];
    const late      = [`Studying late${name}?`, `Burning the midnight oil${name}?`, `Night owl mode${name}.`, `Up late${name}? Let's make it worth it.`];
    return h < 12 ? pick(morning) : h < 17 ? pick(afternoon) : h < 21 ? pick(evening) : pick(late);
  }, [profileName]);
  const [profileIconId, setProfileIconId] = useState(() => localStorage.getItem(PROFILE_ICON_KEY) || "grad");
  const [profileBg,    setProfileBg]    = useState(() => localStorage.getItem(PROFILE_BG_KEY) || "#1e3a5f");
  const [profileIColor,setProfileIColor]= useState(() => localStorage.getItem(PROFILE_ICOLOR_KEY) || "#60b4ff");
  const [sets, setSets]                = useState(() => loadSets());
  const [history, setHistory]          = useState(() => loadHistory());
  const [screen, setScreen]            = useState("home");
  const isTablet     = windowWidth >= BREAKPOINT_TABLET && windowWidth < BREAKPOINT_DESKTOP;
  const isDesktop    = windowWidth >= BREAKPOINT_DESKTOP;
  const showSidebar  = !isMobile && screen !== "review";
  const cardColumns  = isDesktop ? 3 : isTablet ? 2 : 1;
  const [homeTab, setHomeTab]          = useState("home");
  const prevHomeTabRef = useRef("home");
  const [editingSetName, setEditingSetName] = useState(false);
  const prevShowSidebarRef = useRef(showSidebar);
  const sidebarJustLeft = prevShowSidebarRef.current && !showSidebar;
  prevShowSidebarRef.current = showSidebar;
  const setNameTextareaRef = useRef(null);
  useEffect(() => {
    if (!editingSetName) return;
    function handlePointerDown(e) {
      if (setNameTextareaRef.current && setNameTextareaRef.current.contains(e.target)) return;
      setEditingSetName(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [editingSetName]);
  useEffect(() => {
    if (editingSetName && setNameTextareaRef.current) {
      const x = window.scrollX, y = window.scrollY;
      setNameTextareaRef.current.focus({ preventScroll: true });
      window.scrollTo(x, y);
    }
  }, [editingSetName]);
  const [editSearch, setEditSearch] = useState("");
  const [editCanSave, setEditCanSave] = useState(false);
  const [editQuestionCount, setEditQuestionCount] = useState(0);
  const [setsSearch, setSetsSearch]    = useState("");
  const [setsActiveTag, setSetsActiveTag] = useState(null);
  const [setsFilterOpen, setSetsFilterOpen] = useState(false);
  const [setsFilterPos, setSetsFilterPos] = useState({ top: 0, right: 0 });
  const [allTagsModalOpen, setAllTagsModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historySortBy, setHistorySortBy] = useState("date-desc");
  const [historySortOpen, setHistorySortOpen] = useState(false);
  const [historySortPos, setHistorySortPos] = useState({ top: 0, right: 0 });
  const [activeSet, setActiveSet]      = useState(null);
  const [questionLimit, setQLimit]       = useState(null);
  const [examMode,      setExamMode]     = useState(false);
  const [timerMinutes,  setTimerMinutes] = useState(null);
  const [pendingStudySet, setPendingStudySet] = useState(null);
  const [reviewResults, setRevRes]     = useState(null);
  const [reviewQs, setRevQs]           = useState(null);
  const [historySession, setHistSess]  = useState(null);
  const { showToast, ToastEl } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen]      = useState(false);

  useEffect(() => {
    if (modalOpen) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [modalOpen]);
  const [showClearConfirm,  setShowClearConfirm]  = useState(false);
  const [showClearConfirm2, setShowClearConfirm2] = useState(false);
  const [resultsExportModal, setResultsExportModal] = useState(false);
  const searchInputRef = useRef(null);
  const [resultsConfirmRetry, setResultsConfirmRetry] = useState(false);
  const [resultsDeleteConfirm, setResultsDeleteConfirm] = useState(false);
  const [lastSavedSessionId, setLastSavedSessionId] = useState(null);

  const [showWelcome, setShowWelcome]  = useState(() => {
    return localStorage.getItem("studi_welcomed") !== "true";
  });
  T = buildTheme(resolveTheme(theme), accent);
  ST = T;

  const allTags = useMemo(() => [...new Set(sets.flatMap(s => s.tags || []))].sort((a, b) => a.localeCompare(b)), [sets]);

  function handleSetTheme(mode) {
    const saveMode = mode.startsWith("system") ? "system" : mode;
    localStorage.setItem(THEME_KEY, saveMode);
    setThemeState(mode);
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function handler() {
      setThemeState(prev => {
        if (prev === "system" || (prev && prev.startsWith("system"))) {
          return "system_" + Date.now();
        }
        return prev;
      });
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  function handleSetAccent(key) {
    localStorage.setItem(ACCENT_KEY, key);
    setAccentState(key);
  }
  function handleSetBgStyle(style) {
    localStorage.setItem(BG_STYLE_KEY, style);
    setBgStyleState(style);
  }
  function handleSaveProfile(name, iconId, bg, iconColor) {
    localStorage.setItem(PROFILE_NAME_KEY, name);
    localStorage.setItem(PROFILE_ICON_KEY, iconId);
    localStorage.setItem(PROFILE_BG_KEY, bg);
    localStorage.setItem(PROFILE_ICOLOR_KEY, iconColor);
    setProfileName(name);
    setProfileIconId(iconId);
    setProfileBg(bg);
    setProfileIColor(iconColor);
  }

  useEffect(() => { saveSets(sets); },   [sets]);
  useEffect(() => { saveHistory(history); }, [history]);

  useEffect(() => {
    function handler(e) { setActiveSet(s => s ? { ...s, tags: e.detail } : s); }
    document.addEventListener("studi-drafttags", handler);
    return () => document.removeEventListener("studi-drafttags", handler);
  }, []);

  function handleCreate(tag) {
    const s = blankSet();
    if (tag) s.tags = [tag];
    setActiveSet(s);
    setScreen("edit");
  }
  function handleEdit(s)         { setActiveSet(s); setScreen("edit"); }
  function handleStudy(s, limit, mode, timerMinutes) {
    setActiveSet(s);
    setQLimit(limit !== undefined ? limit : null);
    setExamMode(mode === "exam");
    setTimerMinutes(timerMinutes || null);
    setScreen("review");
  }
  function handleDelete(id)      { setSets(prev => prev.filter(s => s.id !== id)); }
  function handleSetTags(setId, tags) { setSets(prev => prev.map(s => s.id === setId ? { ...s, tags } : s)); }
  function handleSetIcon(setId, icon) { setSets(prev => prev.map(s => s.id === setId ? { ...s, icon } : s)); }
  function handleRename(setId, name) { setSets(prev => prev.map(s => s.id === setId ? { ...s, name } : s)); }

  function handleSave(updated) {
    const stamped = { ...updated, updatedAt: new Date().toISOString(),
      tags: updated.tags ? [...updated.tags].sort((a, b) => a.localeCompare(b)) : updated.tags };
    setSets(prev => {
      const exists = prev.find(s => s.id === stamped.id);
      if (exists) return prev.map(s => s.id === stamped.id ? stamped : s);
      return [...prev, stamped];
    });
    setActiveSet(stamped);
  }

  const [showDeleteAnim, setShowDeleteAnim] = useState(false);

  function handleClearAll() {
    setShowDeleteAnim(true);
  }

  function completeClearAll() {
    setSets([]);
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(PROFILE_NAME_KEY);
    localStorage.removeItem(PROFILE_ICON_KEY);
    localStorage.removeItem(PROFILE_BG_KEY);
    localStorage.removeItem(PROFILE_ICOLOR_KEY);
    localStorage.removeItem("studi_welcomed");
    setShowWelcome(true);
    setScreen("home");
    setHomeTab("home");
    setShowDeleteAnim(false);
  }

  function handleImport(imported) {
    const normalized = imported.map(s => ({ tags: [], ...s }));
    setSets(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      return [...prev, ...normalized.filter(s => !existingIds.has(s.id))];
    });
  }

  function handleFinish(results, questions) {
    setRevRes(results); setRevQs(questions); setScreen("results");
  }
  function handleRestart() {
    setScreen("review"); setRevRes(null); setRevQs(null);
  }

  function handleRetryMissed(missedQuestions) {
    const fullSet = { ...activeSet, questions: missedQuestions };
    setActiveSet(fullSet);
    setScreen("review"); setRevRes(null); setRevQs(null);
  }

  function handleViewHistory(session) {
    setHistSess(session);
    setScreen("historyResults");
  }

  function handleSaveToHistory(session) {
    setHistory(prev => {
      const exists = prev.find(s => s.id === session.id);
      if (exists) return prev; // no duplicates
      return [...prev, session];
    });
    setLastSavedSessionId(session.id);
  }

  function handleImportHistory(sessions) {
    setHistory(prev => {
      const existingIds = new Set(prev.map(s => s.id));
      return [...prev, ...sessions.filter(s => !existingIds.has(s.id))];
    });
  }
  function handleSmartImport(f) {
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const inc = Array.isArray(parsed) ? parsed : [parsed];
        const isHist = inc.every(s => s && s.setName && Array.isArray(s.results));
        if (isHist) {
          const v = inc.filter(validateSession);
          if (v.length) { handleImportHistory(v); showToast(`Imported ${v.length} session${v.length !== 1 ? "s" : ""}`); }
          else showToast("No valid history found.");
        } else {
          const v = inc.filter(validateSet);
          if (v.length) { handleImport(v); showToast(`Imported ${v.length} set${v.length !== 1 ? "s" : ""}`); }
          else showToast("No valid sets found.");
        }
      } catch { showToast("Could not read file — invalid JSON."); }
    };
    r.readAsText(f);
  }
  function handleDeleteHistory(id) {
    setHistory(prev => prev.filter(s => s.id !== id));
  }

  const [scrolled, setScrolled] = useState(false);
  const [titleBarVisible, setTitleBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRaf = useRef(null);
  useEffect(() => {
    function onScroll() {
      if (scrollRaf.current) return;
      scrollRaf.current = requestAnimationFrame(() => {
        scrollRaf.current = null;
        const y = Math.max(0, window.scrollY); // clamp to 0 to ignore iOS rubber-band negative scroll
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const atTop = y < 10;
        const atBottom = maxScroll <= 0 || y >= maxScroll - 10; // no content to scroll = treat as top
        const delta = y - lastScrollY.current;

        setScrolled(y > 30);

        if (atTop) {
          setTitleBarVisible(true);
        } else if (atBottom) {
          // ignore — don't change visibility during bottom bounce
        } else if (delta > 8) {
          setTitleBarVisible(false);
        } else if (delta < -8) {
          setTitleBarVisible(true);
        }

        lastScrollY.current = y;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
  }, []);

  return (
    <>
    <div style={{ background: bgStyle === "gradient"
      ? (T.mode === "light"
        ? `linear-gradient(135deg, ${T.accent}15 0%, ${T.gradient2}0a 30%, transparent 55%), radial-gradient(ellipse at 15% 10%, rgba(${T.accentRgb},0.04) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(251,191,36,0.06) 0%, transparent 45%), ${T.bg}`
        : `linear-gradient(135deg, ${T.accent}11 0%, ${T.gradient2}08 30%, transparent 55%), radial-gradient(ellipse at 15% 10%, rgba(${T.accentRgb},0.05) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(251,146,60,0.06) 0%, transparent 45%), ${T.bg}`)
      : T.bg,
      minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {bgStyle === "dots" && <HalftoneCanvas color={T.accent} maxOpacity={T.mode === "light" ? 0.07 : 0.05} />}
      {bgStyle === "grid" && <GridCanvas color={T.accent} opacity={T.mode === "light" ? 0.13 : 0.10} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&family=Fraunces:ital,wght@0,300;0,600;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { -webkit-font-smoothing: subpixel-antialiased; -moz-osx-font-smoothing: auto; text-rendering: optimizeLegibility; scrollbar-gutter: stable; }
        ul, ol { list-style-position: outside; }
        ul { list-style-type: disc; }
        ol { list-style-type: decimal; }
        body { background: ${T.bg}; color: ${T.text}; }

        button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        input, textarea, select { outline: none; color: ${T.text}; }
        input:focus, textarea:focus, select:focus { border-color: ${T.accent} !important; box-shadow: 0 0 0 2px ${T.accent}22; }
        @media (hover: hover) { button:hover:not(:disabled) { filter: brightness(0.95); } }
        button:focus { outline: none; }
        button:active:not(:disabled) { transform: scale(0.96); }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${T.surface}; }
        ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 2px; }
      `}</style>
      <style>{STATIC_STYLES}</style>

      {showDeleteAnim && <DeleteAnimation onComplete={completeClearAll} />}

      {showWelcome && (
        <WelcomeModal
          onImportSets={imported => { handleImport(imported); }}
          onImportHistory={sessions => { handleImportHistory(sessions); }}
          onDismiss={() => { setShowWelcome(false); localStorage.setItem("studi_welcomed", "true"); }}
          theme={theme} accent={accent}
        />
      )}

      {pendingStudySet && (
        <SessionPicker
          set={pendingStudySet}
          onStart={(limit, mode, timer) => { setPendingStudySet(null); handleStudy(pendingStudySet, limit, mode, timer); }}
          onClose={() => setPendingStudySet(null)}
          onEdit={() => { setPendingStudySet(null); handleEdit(pendingStudySet); }}
        />
      )}
      {showClearConfirm && (
        <ConfirmDialog
          title="Clear all data?"
          message="All study sets, questions, and history will be permanently deleted. This cannot be undone."
          confirmLabel="Clear everything"
          onConfirm={() => { setShowClearConfirm(false); setShowClearConfirm2(true); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
      {showClearConfirm2 && (
        <ConfirmDialog
          title="Are you sure?"
          message="All sets, questions, and history will be gone forever. There is no way to recover this data."
          confirmLabel="Yes, delete everything"
          onConfirm={() => { setShowClearConfirm2(false); handleClearAll(); }}
          onCancel={() => setShowClearConfirm2(false)}
        />
      )}
      {resultsDeleteConfirm && (
        <ConfirmDialog
          title="Delete this result?"
          message={screen === "historyResults" && historySession ? historySession.setName + " session from " + new Date(historySession.date).toLocaleDateString() + " will be removed." : "This result will be removed from your history."}
          onConfirm={() => {
            setResultsDeleteConfirm(false);
            if (screen === "historyResults" && historySession) {
              handleDeleteHistory(historySession.id);
            } else if (lastSavedSessionId) {
              handleDeleteHistory(lastSavedSessionId);
              setLastSavedSessionId(null);
            }
            setScreen("home");
          }}
          onCancel={() => setResultsDeleteConfirm(false)}
        />
      )}
      {allTagsModalOpen && (
        <Modal onClose={() => { setAllTagsModalOpen(false); setModalOpen(false); }}>
          <ModalCard pad="1.5rem" maxWidth={480} scroll>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: FF_SANS, fontSize: "1.2rem", fontWeight: 700, color: T.text }}>All Tags</span>
              <button onClick={() => { setAllTagsModalOpen(false); setModalOpen(false); }} {...surfacePress()}
                style={{ background: "none", border: "none", borderRadius: "99px", cursor: "pointer", color: T.muted, fontSize: "1.2rem", lineHeight: 1, padding: "0.25rem" }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
              {["__untagged__", ...[...allTags].sort((a, b) => a.localeCompare(b))].map(tag => (
                <button key={tag} onClick={() => { setSetsActiveTag(tag); setAllTagsModalOpen(false); setModalOpen(false); }}
                  style={{
                    textAlign: "left", background: setsActiveTag === tag ? T.accent + "18" : T.surface2,
                    border: "1px solid " + (setsActiveTag === tag ? T.accent + "44" : T.border),
                    borderRadius: "12px", padding: "0.6rem 0.75rem",
                    fontFamily: FF_SANS, fontSize: "0.9rem",
                    color: setsActiveTag === tag ? T.accent : T.text, cursor: "pointer",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                  {tag === "__untagged__" ? "Untagged" : tag}
                  {setsActiveTag === tag && <span style={{ float: "right" }}>✓</span>}
                </button>
              ))}
            </div>
            <GhostButton onClick={() => { setSetsActiveTag(null); setAllTagsModalOpen(false); setModalOpen(false); }} style={{ alignSelf: "flex-end" }}>
              Clear filter
            </GhostButton>
          </ModalCard>
        </Modal>
      )}
      <div style={{ minHeight: "100vh", visibility: (showDeleteAnim || showWelcome) ? "hidden" : "visible",
        position: "relative",
        background: bgStyle === "gradient" || bgStyle === "dots" || bgStyle === "grid" ? "transparent" : T.bg,
        marginLeft: showSidebar ? (sidebarCollapsed ? SIDEBAR_COLLAPSED + 16 + "px" : SIDEBAR_WIDTH + 16 + "px") : 0,
        paddingTop: showSidebar ? "48px" : 0,
        borderTopLeftRadius: 0,
        boxShadow: "none",
        transition: "margin-left 0.25s ease" }}>
        
        <div style={{
          position: showSidebar ? "fixed" : "sticky", top: 0, zIndex: 99,
          ...(showSidebar ? {
            left: (sidebarCollapsed ? SIDEBAR_COLLAPSED + 16 : SIDEBAR_WIDTH + 16) + "px", right: 0,
            height: "48px",
            transition: "left 0.25s ease",
          } : {}),
          display: "flex", flexDirection: "column",
        }}>

          {/* gradient bg — keyed so it remounts on theme change, forcing repaint without resetting child state */}
          <div key={T.mode} style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            background: showSidebar
              ? "transparent"
              : T.mode === "light"
                  ? `linear-gradient(to bottom, rgba(${T.accentRgb},0.04) 0%, rgba(${T.accentRgb},0) 100%), linear-gradient(to bottom, rgba(247,245,242,0.72) 60%, rgba(247,245,242,0) 100%)`
                  : `linear-gradient(to bottom, rgba(${T.accentRgb},0.07) 0%, rgba(${T.accentRgb},0) 100%), linear-gradient(to bottom, rgba(15,9,5,0.72) 60%, rgba(15,9,5,0) 100%)`,
          }} />
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
          }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: showSidebar ? "1200px" : (isDesktop || isTablet) ? "900px" : "720px", height: showSidebar ? "48px" : undefined, padding: showSidebar ? "0 1rem" : editingSetName && !(screen === "edit" && (isDesktop || isTablet || titleBarVisible)) ? "0.5rem 1rem 1.75rem" : "0.5rem 1rem", display: "flex", position: "relative", zIndex: 1 }}>

            <div style={{ width: (!showSidebar && screen === "home") ? "0" : "44px", flexShrink: 0, display: "flex", alignItems: "center" }}>
            {(screen === "edit" || screen === "review" || screen === "results" || screen === "historyResults") ? (
              <GlassButton onClick={() => { document.dispatchEvent(new CustomEvent("studi-back")); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </GlassButton>
            ) : (
              <div style={{ width: "44px" }} />
            )}
            </div>

            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: editingSetName ? "flex-start" : "center", minWidth: 0, overflow: !showSidebar && screen === "home" ? "visible" : "hidden", paddingLeft: !showSidebar && screen === "home" ? "0" : "1rem", paddingRight: "1rem" }}>
            {(screen === "edit" || screen === "review") ? (
              (editingSetName ? (
                <textarea
                  ref={setNameTextareaRef}
                  value={activeSet ? activeSet.name : ""}
                  onChange={e => {
                    setActiveSet(s => ({ ...s, name: e.target.value }));
                    document.dispatchEvent(new CustomEvent("studi-setname", { detail: e.target.value }));
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  onFocus={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                    const len = e.target.value.length;
                    e.target.setSelectionRange(len, len);
                  }}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setEditingSetName(false); } }}
                  maxLength={160}
                  rows={1}
                  style={{
                    fontFamily: FF_SANS, fontWeight: 600, fontSize: "1rem",
                    color: T.text, textAlign: "center", background: "transparent",
                    border: "none", borderBottom: "1px solid " + T.accent,
                    outline: "none", width: "100%", padding: "0",
                    resize: "none", overflow: "hidden", lineHeight: 1.4,
                  }} />
              ) : (
                <span onClick={() => screen === "edit" && setEditingSetName(true)} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  maxWidth: "100%", boxSizing: "border-box",
                  paddingLeft: undefined,
                  cursor: screen === "edit" ? "text" : "default",
                  borderBottom: screen === "edit" ? "1px solid transparent" : "none",
                }}>
                  <span style={{
                    fontFamily: FF_SANS, fontWeight: 600, fontSize: "0.95rem",
                    color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    minWidth: 0,
                  }}>
                    {activeSet ? activeSet.name : ""}
                  </span>
                  {screen === "edit" && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                  )}
                </span>
              ))
            ) : (screen === "results" || screen === "historyResults") ? (
              <span style={{
                fontFamily: FF_SANS, fontWeight: 600, fontSize: "0.95rem",
                color: T.text, textAlign: "center",
              }}>
                Results
              </span>
            ) : !showSidebar ? (
              <div style={{ position: "relative", display: "flex", alignItems: "center", background: T.surface, border: "none", borderRadius: "99px", height: "44px", paddingLeft: "0.75rem", paddingRight: "0.5rem", boxSizing: "border-box", width: "100%" }}>
                <svg style={{ flexShrink: 0, opacity: 0.5, pointerEvents: "none", marginRight: "0.5rem" }}
                  width="14" height="14" viewBox="1 1 22 22" fill="none" stroke={T.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
                </svg>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onFocus={() => { if (homeTab !== "search") { prevHomeTabRef.current = homeTab; } setHomeTab("search"); }}
                  onChange={e => { setSearchQuery(e.target.value); if (homeTab !== "search") { prevHomeTabRef.current = homeTab; setHomeTab("search"); } }}
                  placeholder="Search…"
                  style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: T.text, fontFamily: FF_SANS, fontSize: "16px", height: "44px", padding: 0, boxSizing: "border-box" }}
                />
              </div>
            ) : screen === "home" ? (
              <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", padding: "0 1rem" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", background: ST.surface, border: "none", borderRadius: "99px", height: "38px", paddingLeft: "0.75rem", paddingRight: "0.5rem", boxSizing: "border-box" }}>
                  <svg style={{ flexShrink: 0, opacity: 0.5, pointerEvents: "none", marginRight: "0.5rem" }}
                    width="14" height="14" viewBox="1 1 22 22" fill="none" stroke={ST.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
                  </svg>
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); if (e.target.value && homeTab !== "search") setHomeTab("search"); }}
                    placeholder="Search…"
                    style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: ST.text, fontFamily: FF_SANS, fontSize: "16px", height: "38px", padding: 0, boxSizing: "border-box" }}
                  />
                  {searchQuery && (
                    <span onClick={() => { setSearchQuery(""); setHomeTab("sets"); }} style={{ flexShrink: 0, flexGrow: 0, cursor: "pointer", color: ST.muted, fontSize: "1rem", lineHeight: 1, padding: "0 0.15rem", display: "inline-flex", alignItems: "center" }}>✕</span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ width: "44px" }} />
            )}
            </div>

            <div style={{ width: "44px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            {(!showSidebar || screen !== "home") && <GlobalNav theme={theme} onSetTheme={handleSetTheme} accent={accent} onSetAccent={handleSetAccent} bgStyle={bgStyle} onSetBgStyle={handleSetBgStyle}
              sets={sets} history={history} onClearAll={handleClearAll} screen={screen}
              profileName={profileName} profileIconId={profileIconId} profileBg={profileBg} profileIColor={profileIColor}
              onSaveProfile={handleSaveProfile}
              onRequestClear={() => setShowClearConfirm(true)}
              forceMobile={isMobile} onToggleForceMobile={() => setForceMobile(f => f === true ? false : true)}
              onSmartImport={handleSmartImport}
              activeSet={activeSet}
              allTags={allTags}
              onRenameActiveSet={(id, name) => { handleRename(id, name); setActiveSet(s => s && s.id === id ? { ...s, name } : s); }}
              onSetActiveSetTags={(id, tags) => { handleSetTags(id, tags); setActiveSet(s => s && s.id === id ? { ...s, tags } : s); document.dispatchEvent(new CustomEvent("studi-settags", { detail: tags })); }}
              onSetActiveSetIcon={(id, icon) => { handleSetIcon(id, icon); setActiveSet(s => s && s.id === id ? { ...s, icon } : s); document.dispatchEvent(new CustomEvent("studi-seticon", { detail: icon })); }}
              onDeleteActiveSet={(id) => { handleDelete(id); setScreen("home"); }}
              reviewResults={reviewResults} reviewQs={reviewQs} historySession={historySession}
              onRequestRetry={() => setResultsConfirmRetry(true)}
              onRetryMissed={handleRetryMissed}
              onRequestDeleteResults={() => setResultsDeleteConfirm(true)}
              onStudyFromHistory={() => { const set = sets.find(s => s.name === historySession?.setName); if (set) setPendingStudySet(set); else showToast("Original set not found."); }}
              editCanSave={editCanSave}
              inSearch={homeTab === "search"}
              onDismissSearch={() => { setSearchQuery(""); setHomeTab(prevHomeTabRef.current || "home"); searchInputRef.current?.blur(); }} />}
            </div>
          </div>
          </div>

        </div>

        
        <div style={{ position: "relative", display: "flex", justifyContent: "center", flex: 1,
          padding: screen === "home" ? (showSidebar ? "1.5rem 0 4rem" : "1.5rem 0 7rem") : (screen === "review" || screen === "edit") ? "1.5rem 0 7rem" : "1.5rem 0 4rem",
        }}>
          <div style={{ width: "100%", maxWidth: showSidebar ? "1200px" : (isDesktop || isTablet) ? "900px" : "720px", padding: "0 1.25rem" }}>
            {screen === "home" && homeTab === "home" && (
              <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
                <p style={{ fontFamily: FF_SANS, fontSize: "1.5rem", fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3 }}>{greeting}</p>
              </div>
            )}
            {screen === "home" && (
              <Home
                sets={sets}
                onCreate={handleCreate}
                onSetTags={handleSetTags}
                onSetIcon={handleSetIcon}
                onRename={handleRename}
                onEdit={handleEdit} onStudy={handleStudy}
                onDelete={handleDelete}
                history={history}
                onImportHistory={handleImportHistory}
                onDeleteHistory={handleDeleteHistory}
                onViewHistory={handleViewHistory}
                tab={homeTab} setTab={setHomeTab}
                onModalChange={setModalOpen}
                externalSearch={setsSearch}
                externalActiveTag={setsActiveTag}
                externalHistorySearch={historySearch}
                cardColumns={cardColumns}
                externalHistorySortBy={historySortBy}
                searchInputRef={searchInputRef}
                searchQuery={searchQuery}
                setsActiveTag={setsActiveTag} setSetsActiveTag={setSetsActiveTag}
                setsFilterOpen={setsFilterOpen} setSetsFilterOpen={setSetsFilterOpen}
                setsFilterPos={setsFilterPos} setSetsFilterPos={setSetsFilterPos}
                historySortBy={historySortBy} setHistorySortBy={setHistorySortBy}
                historySortOpen={historySortOpen} setHistorySortOpen={setHistorySortOpen}
                historySortPos={historySortPos} setHistorySortPos={setHistorySortPos}
                allTagsModalOpen={allTagsModalOpen} setAllTagsModalOpen={setAllTagsModalOpen}
                setModalOpen={setModalOpen}
                allTags={allTags}
                showSidebar={showSidebar}
                profileName={profileName}
              />
            )}
            {screen === "edit" && activeSet && (
              <EditMode set={activeSet} allTags={allTags} onSave={handleSave} onBack={() => setScreen("home")} scrolled={scrolled} onCanSaveChange={setEditCanSave} onQuestionCountChange={setEditQuestionCount} editSearch={editSearch} showSidebar={showSidebar} isDesktop={!isMobile} sidebarWidth={sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH} />
            )}
            {screen === "review" && activeSet && (
              <ReviewMode set={activeSet} questionLimit={questionLimit} examMode={examMode} timerMinutes={timerMinutes} onFinish={handleFinish} onBack={() => setScreen("home")} />
            )}
            {screen === "results" && reviewResults && (
              <ResultsScreen results={reviewResults} questions={reviewQs}
                set={activeSet} onRestart={handleRestart} onBack={() => setScreen("home")}
                onSaveToHistory={handleSaveToHistory} questionLimit={questionLimit} examMode={examMode}
                onRetryMissed={handleRetryMissed}
                exportModal={resultsExportModal} onCloseExport={() => setResultsExportModal(false)}
                confirmRetry={resultsConfirmRetry} onCloseConfirmRetry={() => setResultsConfirmRetry(false)}
                history={history} />
            )}
            {screen === "historyResults" && historySession && (
              <ResultsScreen
                results={historySession.results}
                questions={historySession.questions}
                set={{ name: historySession.setName, id: historySession.setId }}
                onRestart={null}
                onBack={() => setScreen("home")}
                onSaveToHistory={null}
                questionLimit={historySession.total}
                isHistoryView={true}
                historyDate={historySession.date}
                exportModal={resultsExportModal} onCloseExport={() => setResultsExportModal(false)}
                confirmRetry={resultsConfirmRetry} onCloseConfirmRetry={() => setResultsConfirmRetry(false)}
                history={history} />
            )}
          </div>
        </div>

        {screen === "home" && isMobile && (
          <>
            <FloatingHomeBar
              homeTab={homeTab} setHomeTab={setHomeTab}
              history={history}
              disabled={modalOpen}
              onSetsTab={() => setSetsSearch("")}
              fabSlot={
                <HomeFAB
                  onCreate={handleCreate}
                  onImport={handleSmartImport}
                  disabled={modalOpen}
                />
              }
            />
          </>
        )}
        {screen === "home" && showSidebar && homeTab === "sets" && (
          <DesktopFAB
            homeTab={homeTab}
            onCreate={handleCreate}
            disabled={modalOpen}
            sidebarWidth={sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH}
            setCount={sets.length}
          />
        )}
      </div>

      {showSidebar && (
        <div style={{
          position: "fixed", left: "8px", top: "8px", bottom: "8px",
          width: (sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH) + "px",
          transition: "width 0.25s ease",
          background: ST.surface + "cc",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRadius: "16px",
          boxShadow: ST.mode === "light"
            ? "0px 10px 20px rgba(0,0,0,0.19), 0px 6px 6px rgba(0,0,0,0.23)"
            : "0px 10px 20px rgba(0,0,0,0.45), 0px 6px 6px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column",
          zIndex: 200, overflowY: "auto", overflowX: "hidden",
        }}>
          {/* Logo */}
          <div style={{ padding: "0 1.25rem", paddingTop: sidebarCollapsed ? "0.8rem" : "1.5rem", height: sidebarCollapsed ? "64px" : "185px", display: "flex", alignItems: sidebarCollapsed ? "flex-start" : "flex-start", justifyContent: "center", flexShrink: 0 }}>
            {sidebarCollapsed ? (
              <MascotMonoIcon width={36} height={36} color={ST.accent} />
            ) : (
              <PounceLogo height={44} stacked />
            )}
          </div>
          

          {sidebarCollapsed && <div style={{ flex: 1 }} />}

          {/* Nav tabs */}
          <nav style={{ padding: "0 0.75rem", display: "flex", flexDirection: "column", gap: sidebarCollapsed ? "0.5rem" : "0.2rem" }}>
            {[
              { id: "home",    label: "Home",
                icon:       <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                iconFilled: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { id: "sets",    label: "Sets",
                icon:       <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
                iconFilled: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
              { id: "history", label: "History",
                icon:       <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                iconFilled: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg> },
              { id: "search",  label: "Search",
                icon:       <svg width="16" height="16" viewBox="0 0 24 24" {...IC}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
                iconFilled: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg> },
            ].filter(tab => !(tab.id === "search" && showSidebar)).map(tab => {
              const active = screen === "home" && homeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setHomeTab(tab.id); setScreen("home"); if (tab.id !== "search") setSearchQuery(""); if (tab.id === "sets") setSetsSearch(""); }}
                  title={sidebarCollapsed ? tab.label : undefined}
                  style={{ display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-start", gap: "0.75rem", padding: "0.65rem 0.75rem", borderRadius: "12px", background: active ? ST.accent + "18" : "transparent", color: active ? ST.accent : ST.muted2, border: "none", cursor: "pointer", width: "100%", fontFamily: FF_SANS, fontSize: "0.95rem", fontWeight: active ? 600 : 400, transition: "background 0.15s" }}>
                  <span style={{ color: active ? ST.accent : ST.muted, flexShrink: 0, display: "flex", alignItems: "center" }}>{active ? tab.iconFilled : tab.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      {tab.label}
                      {tab.id === "history" && (history?.length ?? 0) > 0 && (
                        <span style={{ marginLeft: "auto", background: ST.accent + "22", color: ST.accent, fontFamily: FF_SANS, fontSize: "0.65rem", fontWeight: 600, padding: "0.1rem 0.4rem", borderRadius: "99px" }}>{history.length}</span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Recent — sets and history mixed, hidden when collapsed */}
          {!sidebarCollapsed && (sets.length > 0 || history.length > 0) && (
            <div style={{ flex: 1, overflow: "hidden", padding: "0.5rem 0.75rem 0", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              <p style={{ fontFamily: FF_SANS, fontSize: "0.62rem", letterSpacing: "0.1em", color: ST.muted, padding: "0.25rem 0.5rem 0.35rem", flexShrink: 0 }}>Recent</p>
              <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                {[
                  ...[...sets].map(s => ({ type: "set", id: s.id, name: s.name, date: s.updatedAt || 0, meta: s.questions?.length ?? 0 })),
                  ...[...history].map(h => ({ type: "history", id: h.id, name: h.setName, date: h.date || 0, meta: Math.round((h.score / h.total) * 100) + "%" })),
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => (
                  <button key={item.type + item.id} onClick={() => {
                    if (item.type === "set") { setHomeTab("sets"); setScreen("home"); setSetsSearch(item.name); setSetsActiveTag(null); }
                    else { const session = history.find(h => h.id === item.id); if (session) { setHomeTab("history"); setScreen("home"); setHistorySearch(session.setName); } }
                  }}
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.5rem", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left", minWidth: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = ST.surface2; const nameEl = e.currentTarget.querySelector('span'); if (nameEl && nameEl.scrollWidth > nameEl.clientWidth) { const r = e.currentTarget.getBoundingClientRect(); setRecentTooltip({ name: item.name, y: r.top + r.height / 2 }); } }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; setRecentTooltip(null); }}>
                    {item.type === "set" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ST.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ST.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0M12 7v5l3 3"/>
                      </svg>
                    )}
                    <span style={{ fontFamily: FF_SANS, fontSize: "0.85rem", color: ST.muted2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.name}</span>
                    <span style={{ fontFamily: FF_SANS, fontSize: "0.62rem", color: ST.muted, flexShrink: 0 }}>{item.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {sidebarCollapsed && <div style={{ flex: 1 }} />}

          {/* Settings popup */}

          {/* Sticky footer */}
          <div style={{
            marginTop: "auto", flexShrink: 0,
            background: ST.mode === "light"
              ? "linear-gradient(to bottom, rgba(255,253,250,0) 0%, rgba(255,253,250,1) 40%)"
              : "linear-gradient(to bottom, rgba(20,18,15,0) 0%, rgba(20,18,15,1) 40%)",
            padding: "1.5rem 0.75rem 0.6rem",
            display: "flex", flexDirection: "column", gap: "0.25rem",
          }}>
            {/* When collapsed: profile icon (opens settings) above toggle */}
            {sidebarCollapsed && (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.1rem" }}>
                  <button ref={sidebarCogRef} onClick={() => setSidebarAppearanceOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center", borderRadius: "8px" }}
                    onMouseEnter={e => e.currentTarget.style.background = ST.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <ProfileIconDisplay iconId={profileIconId} bg={profileBg} iconColor={profileIColor} size={30} />
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}>
                  <button onClick={() => setSidebarCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", color: ST.muted, display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", padding: 0, borderRadius: "99px", flexShrink: 0 }} title="Expand sidebar">
                    <svg width="16" height="16" viewBox="0 0 24 24" {...IC}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                      <rect x="3" y="3" width="6" height="18" rx="2" fill="currentColor" stroke="none"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
            {/* Bottom row — expanded only */}
            {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <button ref={sidebarCogRef} onClick={() => setSidebarAppearanceOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0 }}>
                <ProfileIconDisplay iconId={profileIconId} bg={profileBg} iconColor={profileIColor} size={28} />
              </button>
              <span style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.08em", color: ST.muted, flex: 1, textAlign: "center" }}>{`v${APP_VERSION}`}</span>
              <button onClick={() => setSidebarCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", color: ST.muted, display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", padding: 0, borderRadius: "99px", flexShrink: 0 }} title="Collapse sidebar">
                <svg width="16" height="16" viewBox="0 0 24 24" {...IC}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <rect x="3" y="3" width="6" height="18" rx="2" fill="currentColor" stroke="none"/>
                </svg>
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Recent item name tooltip */}
      {recentTooltip && (
        <div style={{
          position: "fixed",
          left: SIDEBAR_WIDTH + 26 + "px",
          top: recentTooltip.y + "px",
          transform: "translateY(-50%)",
          background: T.mode === "light" ? T.surface : T.surface2,
          border: "1px solid " + T.border,
          borderRadius: "8px",
          padding: "0.35rem 0.65rem",
          boxShadow: T.mode === "light"
            ? "0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)"
            : "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
          fontFamily: FF_SANS,
          fontSize: "0.85rem",
          color: T.text,
          whiteSpace: "nowrap",
          zIndex: 300,
          pointerEvents: "none",
        }}>
          {recentTooltip.name}
        </div>
      )}



    </div>
      {sidebarAppearanceOpen ? (
        <div ref={sidebarPopupRef} className="menu-open-up-left" onClick={e => e.stopPropagation()} style={{ ...menuPopupStyle({ position: "fixed", bottom: "3.5rem", left: (sidebarCollapsed ? 12 : 16) + "px", zIndex: 10000, width: SIDEBAR_WIDTH - 16 + "px" }) }}>

          {sidebarSection === null && (
            <>
              <button onClick={() => { setSidebarAppearanceOpen(false); setSidebarProfileOpen(true); }} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0.65rem 1rem",
                display: "flex", alignItems: "center", gap: "0.75rem",
                width: "100%", textAlign: "left",
                borderRadius: "8px 8px 0 0",
              }}
                onMouseEnter={e => e.currentTarget.style.background = ST.surface2}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <ProfileIconDisplay iconId={profileIconId} bg={profileBg} iconColor={profileIColor} size={32} />
                <span style={{ fontFamily: FF_SANS, fontSize: "0.9rem", fontWeight: 600, color: ST.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profileName || "Profile"}
                </span>
              </button>

              <input ref={sidebarImportRef} type="file" accept=".json" onChange={handleSidebarImport} style={{ display: "none" }} />
              <div style={{ padding: "0.25rem 0.5rem" }}>
                <SidebarActionButton onClick={() => setSidebarSection("appearance")} icon={<svg width="14" height="14" viewBox="0 0 24 24" {...IC}><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>} label="Appearance" right={<span style={{ fontSize: "0.8rem", color: T.muted }}>›</span>} />
                <SidebarActionButton onClick={() => sidebarImportRef.current?.click()} icon={<svg width="14" height="14" viewBox="0 0 24 24" {...IC}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>} label="Import" />
                <SidebarActionButton onClick={() => exportAll(sets, "studi-sets.json")} icon={<span style={{ fontSize: "0.9rem" }}>⊞</span>} label="Export all sets" />
                <SidebarActionButton onClick={() => exportAll(history, "studi-history.json")} icon={<span style={{ fontSize: "0.9rem" }}>◷</span>} label="Export all history" />
                <SidebarActionButton onClick={() => { setSidebarAppearanceOpen(false); setShowClearConfirm(true); }} icon={<TrashIcon size={14} />} label="Clear all data" danger />
              </div>
            </>
          )}

          {sidebarSection === "appearance" && (
            <>
              <HamburgerSectionHeader label="Appearance" onBack={() => setSidebarSection(null)} noBorder />
              <div style={{ padding: "0.25rem 1.25rem 0.75rem" }}>
                <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, marginBottom: "0.5rem" }}>Theme</p>
                <div style={{ marginBottom: "1rem" }}><ThemePicker theme={theme} onSetTheme={handleSetTheme} /></div>

                <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, marginBottom: "0.5rem" }}>Color</p>
                <div style={{ marginBottom: "1rem" }}><ColorPicker accent={accent} onSetAccent={handleSetAccent} /></div>
                <p style={{ fontFamily: FF_SANS, fontSize: "0.65rem", letterSpacing: "0.1em", color: T.muted, marginBottom: "0.5rem" }}>Background</p>
                <div style={{ marginBottom: "0.25rem" }}><BackgroundPicker bgStyle={bgStyle} onSetBgStyle={handleSetBgStyle} /></div>
              </div>
            </>
          )}

        </div>
      ) : null}

      {sidebarProfileOpen && <ProfileModal name={profileName} iconId={profileIconId} bg={profileBg} iconColor={profileIColor} onSave={handleSaveProfile} onClose={() => setSidebarProfileOpen(false)} />}

    </>
  );
}
