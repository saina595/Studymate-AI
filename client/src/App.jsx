import ReactMarkdown from "react-markdown";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Brain, Sparkles, LibraryBig, LogOut, ArrowRight,
  Clock3, Layers3, FileText, RotateCcw, ChevronLeft, ChevronRight,
  Eye, EyeOff, CheckCircle2, GraduationCap, Menu, X
} from "lucide-react";
import { apiRequest } from "./api.js";

const dateLabel = value => new Date(value).toLocaleDateString(undefined, {
  year: "numeric", month: "short", day: "numeric"
});

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("studymate_token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("studymate_user") || "null"); }
    catch { return null; }
  });
  const [authMode, setAuthMode] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authLoading, setAuthLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [activeSummary, setActiveSummary] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [libraryTab, setLibraryTab] = useState("summaries");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const handler = () => setPage("workspace");
    window.addEventListener("studymate-goto-workspace", handler);
    return () => window.removeEventListener("studymate-goto-workspace", handler);
  }, []);

  useEffect(() => {
    if (!token) return;
    apiRequest("/auth/me", { token })
      .then(data => setUser(data.user))
      .catch(() => logout());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) loadLibrary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadLibrary() {
    try {
      const [summaryData, flashcardData] = await Promise.all([
        apiRequest("/summaries", { token }),
        apiRequest("/flashcards", { token })
      ]);
      setSummaries(summaryData.summaries || []);
      setFlashcardSets(flashcardData.flashcardSets || []);
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("studymate_token");
    localStorage.removeItem("studymate_user");
    setToken("");
    setUser(null);
    setPage("dashboard");
    setActiveSummary(null);
    setActiveSet(null);
    setNotice("");
    setError("");
  }

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setAuthLoading(true);
    try {
      const path = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const data = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(authForm)
      });
      localStorage.setItem("studymate_token", data.token);
      localStorage.setItem("studymate_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      setPage("dashboard");
      setNotice(authMode === "signup" ? "Account created. Welcome to StudyMate AI!" : "Welcome back!");
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function generate(kind) {
    setError("");
    setNotice("");
    setBusy(kind);
    try {
      const path = kind === "summary" ? "/summaries" : "/flashcards/generate";
      const data = await apiRequest(path, {
        method: "POST",
        token,
        body: JSON.stringify({ topic: topic.trim() || "Untitled notes", originalText })
      });
      await loadLibrary();
      if (kind === "summary") {
        setActiveSummary(data.summary);
        setPage("summary");
        setNotice("Your summary was generated and saved.");
      } else {
        setActiveSet(data.flashcardSet);
        setCardIndex(0);
        setFlipped(false);
        setPage("study");
        setNotice("Your flashcards were generated and saved.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function openSummary(id) {
    setError("");
    try {
      const data = await apiRequest(`/summaries/${id}`, { token });
      setActiveSummary(data.summary);
      setPage("summary");
    } catch (err) { setError(err.message); }
  }

  async function openSet(id) {
    setError("");
    try {
      const data = await apiRequest(`/flashcards/${id}`, { token });
      setActiveSet(data.flashcardSet);
      setCardIndex(0);
      setFlipped(false);
      setPage("study");
    } catch (err) { setError(err.message); }
  }

  const totalCards = useMemo(() => flashcardSets.reduce((sum, set) => sum + (set.cards?.length || 0), 0), [flashcardSets]);

  function navigate(nextPage) {
    setPage(nextPage);
    setError("");
    setNotice("");
    setMobileNav(false);
    setActiveSummary(nextPage === "summary" ? activeSummary : activeSummary);
  }

  if (!token || !user) {
    return (
      <div className="auth-shell">
        <div className="auth-decoration decor-one" /><div className="auth-decoration decor-two" />
        <div className="auth-brand"><div className="brand-mark"><GraduationCap size={23} /></div><span>StudyMate <b>AI</b></span></div>
        <div className="auth-layout">
          <section className="auth-pitch">
            <div className="eyebrow"><Sparkles size={15} /> YOUR PERSONAL STUDY ASSISTANT</div>
            <h1>Study less scattered.<br /><span>Learn with clarity.</span></h1>
            <p>Turn your class notes into clear summaries and smart flashcards, all in one place.</p>
            <div className="pitch-points">
              <div><span className="point-icon lavender"><FileText size={18} /></span><span><b>Clear summaries</b><small>Make long notes easier to revise.</small></span></div>
              <div><span className="point-icon peach"><Brain size={18} /></span><span><b>Active recall</b><small>Practice with AI-generated flashcards.</small></span></div>
              <div><span className="point-icon mint"><LibraryBig size={18} /></span><span><b>Your own library</b><small>Come back to your saved study material.</small></span></div>
            </div>
          </section>
          <form className="auth-card" onSubmit={handleAuth}>
            <div className="auth-card-icon"><BookOpen size={23} /></div>
            <h2>{authMode === "signup" ? "Create your account" : "Welcome back"}</h2>
            <p className="muted">{authMode === "signup" ? "Start building your personal study library." : "Log in to continue learning."}</p>
            {authMode === "signup" && <label>Full name<input required value={authForm.name} onChange={e => setAuthForm({...authForm, name:e.target.value})} placeholder="Your name" autoComplete="name" /></label>}
            <label>Email address<input required type="email" value={authForm.email} onChange={e => setAuthForm({...authForm, email:e.target.value})} placeholder="you@example.com" autoComplete="email" /></label>
            <label>Password<input required minLength={8} type="password" value={authForm.password} onChange={e => setAuthForm({...authForm, password:e.target.value})} placeholder="At least 8 characters" autoComplete={authMode === "signup" ? "new-password" : "current-password"} /></label>
            {error && <div className="alert error">{error}</div>}
            <button className="button primary full" disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "signup" ? "Create account" : "Log in"} <ArrowRight size={17} /></button>
            <p className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New to StudyMate AI?"} <button type="button" onClick={() => {setAuthMode(authMode === "signup" ? "login" : "signup");setError("");}}>{authMode === "signup" ? "Log in" : "Create account"}</button></p>
          </form>
        </div>
        <p className="auth-foot">Made for focused learning · StudyMate AI</p>
      </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Layers3 },
    { id: "workspace", label: "Study workspace", icon: Sparkles },
    { id: "library", label: "My library", icon: LibraryBig }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand"><div className="brand-mark"><GraduationCap size={22} /></div><span>StudyMate <b>AI</b></span><button className="icon-button close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
        <div className="side-label">WORKSPACE</div>
        <nav>{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${page === item.id || (page === "summary" && item.id === "library") || (page === "study" && item.id === "library") ? "active" : ""}`} onClick={() => navigate(item.id)}><Icon size={18}/>{item.label}</button>; })}</nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><Sparkles size={17}/><b>Small steps add up</b><p>A little revision today makes tomorrow easier.</p></div>
          <div className="profile-row"><div className="avatar">{user.name?.charAt(0)?.toUpperCase() || "S"}</div><div className="profile-text"><b>{user.name}</b><small>{user.email}</small></div><button className="icon-button" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={17}/></button></div>
        </div>
      </aside>
      {mobileNav && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{page === "workspace" ? "Study workspace" : page === "library" ? "My library" : page === "summary" ? "Summary" : page === "study" ? "Study mode" : "Dashboard"}</b></div><div className="topbar-right"><span className="status-dot"/><span>Personal study space</span></div></header>
        <div className="page-content">
          {notice && <div className="alert success"><CheckCircle2 size={17}/>{notice}<button onClick={() => setNotice("")}>×</button></div>}
          {error && <div className="alert error">{error}<button onClick={() => setError("")}>×</button></div>}

          {page === "dashboard" && <Dashboard user={user} summaries={summaries} flashcardSets={flashcardSets} totalCards={totalCards} navigate={navigate} openSummary={openSummary} openSet={openSet} />}
          {page === "workspace" && <Workspace topic={topic} setTopic={setTopic} originalText={originalText} setOriginalText={setOriginalText} busy={busy} generate={generate} />}
          {page === "library" && <Library summaries={summaries} flashcardSets={flashcardSets} libraryTab={libraryTab} setLibraryTab={setLibraryTab} openSummary={openSummary} openSet={openSet} />}
          {page === "summary" && activeSummary && <SummaryView summary={activeSummary} onBack={() => navigate("library")} />}
          {page === "study" && activeSet && <StudyMode set={activeSet} cardIndex={cardIndex} setCardIndex={setCardIndex} flipped={flipped} setFlipped={setFlipped} onBack={() => navigate("library")} />}
        </div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Dashboard({ user, summaries, flashcardSets, totalCards, navigate, openSummary, openSet }) {
  const recent = [
    ...summaries.map(item => ({...item, kind:"summary"})),
    ...flashcardSets.map(item => ({...item, kind:"flashcards"}))
  ].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);
  return <>
    <div className="welcome-banner"><div><div className="eyebrow light"><Sparkles size={14}/> YOUR LEARNING SPACE</div><h1>Good to see you, {user.name?.split(" ")[0]} <span>✦</span></h1><p>What would you like to learn or revise today?</p><button className="button white-button" onClick={() => navigate("workspace")}>Start studying <ArrowRight size={16}/></button></div><div className="banner-art"><div className="art-orbit orbit-a"/><div className="art-orbit orbit-b"/><div className="art-book"><BookOpen size={66}/><Sparkles className="art-sparkle" size={24}/></div><div className="float-note note-a">Key ideas ✨</div><div className="float-note note-b">Learn · Revise · Repeat</div></div></div>
    <div className="section-title-row"><div><h2>Your study overview</h2><p>A little progress at a time.</p></div><span className="small-note"><Clock3 size={14}/> Saved to your account</span></div>
    <div className="stats-grid">
      <StatCard icon={FileText} label="Summaries created" value={summaries.length} tone="purple" hint="Your key takeaways"/>
      <StatCard icon={Layers3} label="Flashcard sets" value={flashcardSets.length} tone="orange" hint="Ready for revision"/>
      <StatCard icon={Brain} label="Total flashcards" value={totalCards} tone="green" hint="Practice active recall"/>
    </div>
    <div className="section-title-row recent-title"><div><h2>Recently created</h2><p>Pick up where you left off.</p></div><button className="text-button" onClick={() => navigate("library")}>View library <ArrowRight size={15}/></button></div>
    {recent.length ? <div className="recent-grid">{recent.map(item => <button className="recent-card" key={`${item.kind}-${item._id}`} onClick={() => item.kind === "summary" ? openSummary(item._id) : openSet(item._id)}><div className={`recent-icon ${item.kind}`} >{item.kind === "summary" ? <FileText size={19}/> : <Brain size={19}/>}</div><div className="recent-card-copy"><b>{item.topic}</b><small>{item.kind === "summary" ? "AI Summary" : `${item.cards?.length || 0} flashcards`}</small></div><span className="recent-date">{dateLabel(item.createdAt)}</span></button>)}</div> : <EmptyState title="Your study library is waiting" text="Generate your first summary or flashcard set to see it here." action="Create study material" onClick={() => navigate("workspace")} />}
  </>;
}

function StatCard({ icon: Icon, label, value, tone, hint }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-hint">{hint}</div></div>;
}

function Workspace({ topic, setTopic, originalText, setOriginalText, busy, generate }) {
  return <>
    <PageHeading eyebrow="AI STUDY WORKSPACE" title="Turn notes into knowledge" description="Paste your study material once, then choose how you want to revise it." />
    <div className="workspace-layout">
      <section className="panel input-panel"><div className="panel-heading"><div className="panel-icon lavender"><FileText size={19}/></div><div><h2>Your study material</h2><p>Class notes, textbook paragraphs, or topic explanations.</p></div></div>
        <label className="field-label">Topic or title <span>Optional</span></label><input className="text-input" value={topic} onChange={e => setTopic(e.target.value)} maxLength={120} placeholder="e.g. Database Normalization"/>
        <label className="field-label textarea-label">Paste your notes <span>{originalText.length.toLocaleString()} / 20,000</span></label><textarea className="notes-input" value={originalText} onChange={e => setOriginalText(e.target.value.slice(0,20000))} placeholder={"Paste your study material here...\n\nTip: Start with one topic or a few paragraphs for the best results."}/>
        <div className="input-footer"><span><CheckCircle2 size={15}/> Your material is saved only when you generate content.</span><span>{originalText.trim().length < 30 ? "Enter at least 30 characters" : "Ready to generate"}</span></div>
        <div className="generate-actions"><button className="button primary" disabled={!!busy || originalText.trim().length < 30} onClick={() => generate("summary")}>{busy === "summary" ? <span className="spinner"/> : <Sparkles size={17}/>} {busy === "summary" ? "Summarizing..." : "Generate summary"}</button><button className="button secondary" disabled={!!busy || originalText.trim().length < 30} onClick={() => generate("flashcards")}>{busy === "flashcards" ? <span className="spinner"/> : <Brain size={17}/>} {busy === "flashcards" ? "Creating cards..." : "Generate flashcards"}</button></div>
      </section>
      <aside className="workspace-aside"><div className="aside-illustration"><div className="illustration-circle"><BookOpen size={36}/></div><Sparkles className="ill-sparkle s1" size={19}/><Sparkles className="ill-sparkle s2" size={13}/></div><h3>One set of notes.<br/>Two ways to learn.</h3><p>Understand the big picture with a summary, then test your memory with flashcards.</p><div className="benefit-row"><span className="benefit-check">✓</span><span><b>Summaries</b><small>Quick, organized revision notes</small></span></div><div className="benefit-row"><span className="benefit-check peach-check">✓</span><span><b>Flashcards</b><small>Question-and-answer practice</small></span></div><div className="privacy-note"><CheckCircle2 size={16}/><span>Your generated content is linked to your account.</span></div></aside>
    </div>
  </>;
}

function Library({ summaries, flashcardSets, libraryTab, setLibraryTab, openSummary, openSet }) {
  const items = libraryTab === "summaries" ? summaries : flashcardSets;
  return <>
    <PageHeading eyebrow="YOUR PERSONAL COLLECTION" title="My library" description="All your saved summaries and flashcard sets, together in one place." />
    <div className="library-toolbar"><div className="tabs"><button className={libraryTab === "summaries" ? "selected" : ""} onClick={() => setLibraryTab("summaries")}><FileText size={16}/> Summaries <span>{summaries.length}</span></button><button className={libraryTab === "flashcards" ? "selected" : ""} onClick={() => setLibraryTab("flashcards")}><Brain size={16}/> Flashcard sets <span>{flashcardSets.length}</span></button></div></div>
    {items.length ? <div className="library-grid">{items.map(item => <article className="library-card" key={item._id}><div className="library-card-top"><div className={`recent-icon ${libraryTab === "summaries" ? "summary" : "flashcards"}`}>{libraryTab === "summaries" ? <FileText size={19}/> : <Brain size={19}/>}</div><span className="date-pill"><Clock3 size={13}/>{dateLabel(item.createdAt)}</span></div><h3>{item.topic}</h3><p className="library-preview">{libraryTab === "summaries" ? item.summary : `${item.cards?.length || 0} flashcards ready to study.`}</p><div className="library-card-bottom"><span>{libraryTab === "summaries" ? "AI summary" : `${item.cards?.length || 0} cards`}</span><button className="text-button" onClick={() => libraryTab === "summaries" ? openSummary(item._id) : openSet(item._id)}>{libraryTab === "summaries" ? "Open summary" : "Study set"} <ArrowRight size={15}/></button></div></article>)}</div> : <EmptyState title={libraryTab === "summaries" ? "No summaries yet" : "No flashcard sets yet"} text="Create study material from your notes and it will be saved here automatically." action="Go to study workspace" onClick={() => {window.dispatchEvent(new CustomEvent("studymate-goto-workspace"));}} />}
  </>;
}

function SummaryView({ summary, onBack }) {
  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary.summary);
      alert("Summary copied to clipboard!");
    } catch {
      alert("Unable to copy the summary. Please try again.");
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="YOUR SAVED SUMMARY"
        title={summary.topic}
        description={`Created ${dateLabel(summary.createdAt)} · AI-generated revision notes`}
        action={
          <button className="button secondary" onClick={onBack}>
            <ChevronLeft size={16} />
            Back to library
          </button>
        }
      />

      <div className="summary-actions">
        <span className="summary-badge">
          <Sparkles size={15} />
          Smart revision notes
        </span>

        <button
          className="button secondary copy-summary-button"
          onClick={copySummary}
        >
          <FileText size={16} />
          Copy summary
        </button>
      </div>

      <div className="summary-layout">
        <section className="panel summary-panel">
          <div className="panel-heading">
            <div className="panel-icon lavender">
              <Sparkles size={19} />
            </div>

            <div>
              <h2>Key takeaways</h2>
              <p>Your notes, organized for revision</p>
            </div>
          </div>

          <article className="summary-content">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="summary-h1">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="summary-h2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="summary-h3">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="summary-paragraph">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="summary-list">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="summary-list ordered">{children}</ol>
                ),
                li: ({ children }) => (
                  <li>{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="summary-highlight">{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="summary-quote">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {summary.summary}
            </ReactMarkdown>
          </article>
        </section>

        <section className="panel original-panel">
          <div className="panel-heading">
            <div className="panel-icon peach">
              <FileText size={19} />
            </div>

            <div>
              <h2>Original notes</h2>
              <p>Your source material</p>
            </div>
          </div>

          <div className="original-content">
            {summary.originalText}
          </div>
        </section>
      </div>
    </>
  );
}

function StudyMode({ set, cardIndex, setCardIndex, flipped, setFlipped, onBack }) {
  const cards = set.cards || [];
  const card = cards[cardIndex];
  function move(amount) {
    setCardIndex(index => Math.max(0, Math.min(cards.length - 1, index + amount)));
    setFlipped(false);
  }
  return <>
    <PageHeading eyebrow="ACTIVE RECALL" title={set.topic} description={`Study one card at a time · ${cards.length} cards in this set`} action={<button className="button secondary" onClick={onBack}><ChevronLeft size={16}/> Back to library</button>} />
    <div className="study-wrap"><div className="study-progress-row"><span>Card {cardIndex + 1} of {cards.length}</span><span>{Math.round(((cardIndex + 1) / Math.max(cards.length,1))*100)}% through</span></div><div className="progress-track"><div style={{width:`${((cardIndex+1)/Math.max(cards.length,1))*100}%`}}/></div>
      {card && <button className={`flashcard ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped(value => !value)} aria-label="Flip flashcard"><span className="card-kicker">{flipped ? "ANSWER" : "QUESTION"}</span><span className="card-content">{flipped ? card.answer : card.question}</span><span className="flip-hint"><RotateCcw size={15}/> Click to {flipped ? "see question" : "reveal answer"}</span><span className="card-corner"><Brain size={22}/></span></button>}
      <div className="study-controls"><button className="button secondary" onClick={() => move(-1)} disabled={cardIndex === 0}><ChevronLeft size={17}/> Previous</button><button className="button primary" onClick={() => move(1)} disabled={cardIndex >= cards.length - 1}>Next card <ChevronRight size={17}/></button></div>
      <div className="study-bottom-note"><Sparkles size={16}/> Try answering out loud before you flip the card.</div>
    </div>
  </>;
}

function EmptyState({ title, text, action, onClick }) {
  return <div className="empty-state"><div className="empty-icon"><LibraryBig size={24}/></div><h3>{title}</h3><p>{text}</p><button className="button primary" onClick={onClick}>{action} <ArrowRight size={16}/></button></div>;
}
