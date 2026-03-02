import React, { useState, useEffect } from "react";
import { Shield, ArrowLeft, FileText, Lock, Eye, Calendar } from "lucide-react";

const PrivacyPolicyPage: React.FC = () => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    fetch("/api/legal-documents/privacy-policy.md")
      .then((res) => {
        if (!res.ok) throw new Error("Documento não encontrado");
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar política de privacidade:", err);
        setError("Não foi possível carregar a Política de Privacidade. Tente novamente mais tarde.");
        setIsLoading(false);
      });
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const headers = document.querySelectorAll("[data-section-id]");
      let current = "";
      headers.forEach((header) => {
        const rect = header.getBoundingClientRect();
        if (rect.top <= 120) {
          current = header.getAttribute("data-section-id") || "";
        }
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [content]);

  // Extract sections for table of contents
  const sections = content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = line.replace(/^## /, "").trim();
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
      return { title, id };
    });

  const scrollToSection = (id: string) => {
    const el = document.querySelector(`[data-section-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Headers with IDs
    html = html.replace(/^### (.*$)/gim, '<h3 class="pp-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, (_, title) => {
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
      return `<h2 class="pp-h2" data-section-id="${id}">${title}</h2>`;
    });
    html = html.replace(/^# (.*$)/gim, '<h1 class="pp-h1">$1</h1>');

    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="pp-hr" />');

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="pp-bold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="pp-italic">$1</em>');

    // Lists
    const lines = html.split("\n");
    const processedLines: string[] = [];
    let inList: string | false = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine.match(/^\d+\.\s/)) {
        if (!inList) {
          processedLines.push('<ol class="pp-ol">');
          inList = "ol";
        } else if (inList === "ul") {
          processedLines.push("</ul>");
          processedLines.push('<ol class="pp-ol">');
          inList = "ol";
        }
        const content = trimmedLine.replace(/^\d+\.\s/, "");
        processedLines.push(`<li class="pp-li">${content}</li>`);
      } else if (trimmedLine.match(/^[-*]\s/)) {
        if (!inList) {
          processedLines.push('<ul class="pp-ul">');
          inList = "ul";
        } else if (inList === "ol") {
          processedLines.push("</ol>");
          processedLines.push('<ul class="pp-ul">');
          inList = "ul";
        }
        const content = trimmedLine.replace(/^[-*]\s/, "");
        processedLines.push(`<li class="pp-li">${content}</li>`);
      } else {
        if (inList) {
          processedLines.push(inList === "ol" ? "</ol>" : "</ul>");
          inList = false;
        }
        processedLines.push(line);
      }
    }

    if (inList) {
      processedLines.push(inList === "ol" ? "</ol>" : "</ul>");
    }

    html = processedLines.join("\n");

    // Paragraphs
    html = html.replace(/\n\n+/g, '</p><p class="pp-p">');
    if (!html.match(/^<[h1-6]/)) {
      html = '<p class="pp-p">' + html;
    }
    html += "</p>";

    // Clean up
    html = html.replace(/<p class="pp-p"><\/p>/g, "");
    html = html.replace(/<p class="pp-p">(<h[1-6])/g, "$1");
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
    html = html.replace(/<p class="pp-p">(<hr[^>]*>)/g, "$1");
    html = html.replace(/(<hr[^>]*>)<\/p>/g, "$1");
    html = html.replace(/<p class="pp-p">(<[ou]l)/g, "$1");
    html = html.replace(/(<\/[ou]l>)<\/p>/g, "$1");

    // Important keywords highlight
    html = html.replace(
      /(IMPORTANTE|ATENÇÃO|AVISO|NOTA):/gi,
      '<span class="pp-highlight">$1:</span>'
    );

    return html;
  };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .pp-page {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #334155;
        }

        /* Header */
        .pp-header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          color: white;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }

        .pp-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pp-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .pp-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          text-decoration: none;
        }

        .pp-back-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }

        .pp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pp-logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(59,130,246,0.4);
        }

        .pp-logo-text {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .pp-logo-text span {
          color: #93c5fd;
        }

        /* Hero */
        .pp-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%);
          color: white;
          padding: 64px 24px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .pp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 50%, rgba(59,130,246,0.15) 0%, transparent 60%),
                      radial-gradient(circle at 70% 50%, rgba(99,102,241,0.1) 0%, transparent 60%);
        }

        .pp-hero-content {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0 auto;
        }

        .pp-hero-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 8px 24px rgba(59,130,246,0.3);
          animation: pp-float 3s ease-in-out infinite;
        }

        @keyframes pp-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .pp-hero h1 {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 12px;
          background: linear-gradient(to right, #ffffff, #93c5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pp-hero-subtitle {
          font-size: 16px;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .pp-hero-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          font-size: 13px;
          color: #64748b;
        }

        .pp-hero-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Layout */
        .pp-layout {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
        }

        @media (max-width: 900px) {
          .pp-layout {
            grid-template-columns: 1fr;
          }
          .pp-sidebar {
            display: none !important;
          }
        }

        /* Sidebar / TOC */
        .pp-sidebar {
          position: sticky;
          top: 80px;
          height: fit-content;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
        }

        .pp-toc {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
          border: 1px solid #e2e8f0;
        }

        .pp-toc-title {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pp-toc-list {
          list-style: none;
          padding: 0;
        }

        .pp-toc-item {
          margin-bottom: 2px;
        }

        .pp-toc-link {
          display: block;
          padding: 8px 12px;
          font-size: 13px;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          line-height: 1.4;
        }

        .pp-toc-link:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .pp-toc-link.active {
          background: #eff6ff;
          color: #2563eb;
          border-left-color: #3b82f6;
          font-weight: 600;
        }

        /* Main Content */
        .pp-content-card {
          background: white;
          border-radius: 16px;
          padding: 40px 48px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
          border: 1px solid #e2e8f0;
          line-height: 1.8;
        }

        @media (max-width: 640px) {
          .pp-content-card {
            padding: 24px 20px;
            border-radius: 12px;
          }
          .pp-hero h1 {
            font-size: 24px;
          }
          .pp-hero {
            padding: 40px 20px 32px;
          }
        }

        /* Markdown Rendered Styles */
        .pp-h1 {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 32px 0 16px;
          letter-spacing: -0.5px;
          display: none; /* Hide the duplicate h1 from markdown */
        }

        .pp-h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 40px 0 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          scroll-margin-top: 80px;
        }

        .pp-h3 {
          font-size: 17px;
          font-weight: 600;
          color: #334155;
          margin: 24px 0 10px;
        }

        .pp-p {
          color: #475569;
          font-size: 15px;
          margin-bottom: 12px;
          line-height: 1.8;
        }

        .pp-bold {
          color: #1e293b;
          font-weight: 600;
        }

        .pp-italic {
          color: #475569;
        }

        .pp-ul, .pp-ol {
          margin: 12px 0 16px 24px;
          color: #475569;
          font-size: 15px;
        }

        .pp-li {
          margin-bottom: 6px;
          line-height: 1.7;
          padding-left: 4px;
        }

        .pp-hr {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, #e2e8f0, transparent);
          margin: 32px 0;
        }

        .pp-highlight {
          display: inline-block;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          padding: 2px 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
        }

        /* Footer */
        .pp-footer {
          background: #0f172a;
          color: #94a3b8;
          text-align: center;
          padding: 32px 24px;
          font-size: 14px;
        }

        .pp-footer a {
          color: #93c5fd;
          text-decoration: none;
        }

        .pp-footer a:hover {
          color: white;
        }

        /* Loading */
        .pp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          color: #64748b;
          gap: 16px;
        }

        .pp-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: pp-spin 0.8s linear infinite;
        }

        @keyframes pp-spin {
          to { transform: rotate(360deg); }
        }

        /* Error */
        .pp-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
          color: #ef4444;
          gap: 12px;
        }

        .pp-error p {
          color: #64748b;
          max-width: 400px;
        }

        .pp-retry-btn {
          margin-top: 12px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .pp-retry-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="pp-page">
        {/* Header */}
        <header className="pp-header">
          <div className="pp-header-inner">
            <div className="pp-header-left">
              <a href="/auth" className="pp-back-btn">
                <ArrowLeft size={16} />
                Voltar
              </a>
              <div className="pp-logo">
                <div className="pp-logo-icon">
                  <Shield size={20} color="white" />
                </div>
                <div className="pp-logo-text">
                  CN <span>Vidas</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pp-hero">
          <div className="pp-hero-content">
            <div className="pp-hero-icon">
              <Lock size={28} color="white" />
            </div>
            <h1>Política de Privacidade</h1>
            <p className="pp-hero-subtitle">
              Sua privacidade é nossa prioridade. Saiba como coletamos, usamos e protegemos seus
              dados pessoais em conformidade com a LGPD.
            </p>
            <div className="pp-hero-meta">
              <div className="pp-hero-meta-item">
                <Calendar size={14} />
                Atualizado em 9 de janeiro de 2025
              </div>
              <div className="pp-hero-meta-item">
                <Eye size={14} />
                Leitura de ~10 min
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="pp-layout">
          {/* Sidebar - Table of Contents */}
          <aside className="pp-sidebar">
            <nav className="pp-toc">
              <div className="pp-toc-title">
                <FileText size={14} />
                Índice
              </div>
              <ul className="pp-toc-list">
                {sections.map((section) => (
                  <li key={section.id} className="pp-toc-item">
                    <button
                      className={`pp-toc-link ${activeSection === section.id ? "active" : ""}`}
                      onClick={() => scrollToSection(section.id)}
                    >
                      {section.title.replace(/^\d+\.\s*/, "")}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <main>
            <div className="pp-content-card">
              {isLoading && (
                <div className="pp-loading">
                  <div className="pp-spinner" />
                  <span>Carregando Política de Privacidade...</span>
                </div>
              )}

              {error && (
                <div className="pp-error">
                  <Shield size={40} />
                  <strong>Erro ao carregar documento</strong>
                  <p>{error}</p>
                  <button className="pp-retry-btn" onClick={() => window.location.reload()}>
                    Tentar novamente
                  </button>
                </div>
              )}

              {!isLoading && !error && content && (
                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="pp-footer">
          <p>
            © {new Date().getFullYear()} CN Vidas Ltda. — Todos os direitos reservados.
            <br />
            Dúvidas? Entre em contato:{" "}
            <a href="mailto:privacidade@cnvidas.com.br">privacidade@cnvidas.com.br</a>
          </p>
        </footer>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
