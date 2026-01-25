import React, { useEffect } from "react";
import { configureIOSStatusBar } from "@/utils/ios-config";
import { useIOSKeyboard } from "@/hooks/use-ios-keyboard";

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export const AuthLayout = ({ children, activeTab = "login" }: AuthLayoutProps) => {
  const { isKeyboardVisible } = useIOSKeyboard();

  // Configurar status bar do iOS
  useEffect(() => {
    configureIOSStatusBar('#0b5f55');
  }, []);

  // Determinar o estado do layout baseado em activeTab e isKeyboardVisible
  const getLayoutState = () => {
    if (activeTab === "register" && isKeyboardVisible) {
      return "register-keyboard";
    } else if (activeTab === "login" && !isKeyboardVisible) {
      return "login-no-keyboard";
    } else if (activeTab === "login" && isKeyboardVisible) {
      return "login-keyboard";
    } else {
      return "register-no-keyboard";
    }
  };

  const layoutState = getLayoutState();

  const heroLogo = "/assets/triunfo-logo-white.png";
  const hospitalLogo = "/assets/triunfo-hospital.jpg";

  // Configurações responsivas para cada estado - otimizado para mobile
  const getLogoConfig = () => {
    switch (layoutState) {
      case "register-keyboard":
        return { height: '0px', marginTop: '0px', opacity: 0, isHidden: true };
      case "login-no-keyboard":
        // Mobile-first: menor em telas pequenas
        return { height: 'clamp(100px, 18vw, 180px)', marginTop: 'clamp(16px, 4vw, 32px)', opacity: 1, isHidden: false };
      case "login-keyboard":
        return { height: '60px', marginTop: '8px', opacity: 1, isHidden: false };
      default:
        // Registro sem teclado
        return { height: 'clamp(80px, 14vw, 140px)', marginTop: 'clamp(12px, 3vw, 24px)', opacity: 1, isHidden: false };
    }
  };

  const getSpacerHeight = () => {
    switch (layoutState) {
      case "register-keyboard":
        return '0px';
      case "login-no-keyboard":
        // Spacer menor para login - card mais próximo do logo
        return 'clamp(4px, 1vw, 8px)';
      case "login-keyboard":
        return '2px';
      default:
        return 'clamp(6px, 1.5vw, 12px)';
    }
  };

  const logoConfig = getLogoConfig();
  const spacerHeight = getSpacerHeight();

  return (
    <div className="triunfo-auth-v2 fixed inset-0 overflow-hidden">
      {/* Inject Google Fonts + Mobile Optimizations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@400;500;600;700&display=swap');

        .triunfo-auth-v2 {
          --primary: #0d9488;
          --primary-dark: #0f766e;
          --primary-light: #14b8a6;
          --accent: #0891b2;
          --gold: #f59e0b;
          --text-dark: #042f2e;
          --text-body: #134e4a;
          --text-muted: #5eead4;
          --bg-white: #ffffff;
          --bg-light: #f0fdfa;
          --bg-soft: #ccfbf1;

          /* Mobile-safe touch targets */
          --min-touch-target: 44px;

          /* Prevent text scaling issues on iOS */
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        .triunfo-auth-v2 * {
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;
          /* Prevent tap highlight on mobile */
          -webkit-tap-highlight-color: transparent;
        }

        .triunfo-title {
          font-family: 'Merriweather', Georgia, serif;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .triunfo-hero-reveal {
          animation: triunfoFadeSlideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
          transform: translateY(12px);
        }

        .triunfo-card-reveal {
          animation: triunfoCardReveal 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.15s;
          opacity: 0;
          transform: translateY(16px);
        }

        @keyframes triunfoFadeSlideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes triunfoCardReveal {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .triunfo-glass-panel {
          background: rgba(5, 61, 56, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .triunfo-input {
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 500;
          /* Prevent zoom on iOS when focusing inputs */
          font-size: 16px !important;
        }

        .triunfo-btn-primary {
          background: linear-gradient(135deg, #ffffff 0%, #e6fff8 100%);
          color: #0b5f55;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
        }

        .triunfo-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 48px rgba(0, 0, 0, 0.30);
        }

        /* Active state for mobile */
        .triunfo-btn-primary:active {
          transform: translateY(0);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.20);
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: soft-light;
          opacity: 0.14;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* Smooth scrolling for form content */
        .auth-form-content {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          scroll-behavior: smooth;
        }

        /* Hide scrollbar but keep functionality */
        .auth-form-content::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        /* Mobile-specific optimizations */
        @media (max-width: 480px) {
          .triunfo-auth-v2 {
            /* Smaller border radius on very small screens */
            --card-radius: 24px;
          }
        }

        @media (max-width: 360px) {
          .triunfo-auth-v2 {
            --card-radius: 20px;
          }
        }

        /* Landscape mode on mobile */
        @media (max-height: 500px) and (orientation: landscape) {
          .auth-header-branding {
            display: none !important;
          }
          .auth-footer {
            display: none !important;
          }
        }

        /* Safe area padding for notched devices */
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        .pt-safe {
          padding-top: env(safe-area-inset-top, 0px);
        }
      `}</style>

      {/* Gradiente principal do Hero - seguindo diretrizes */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(165deg, #18c2b3 0%, #0d9488 55%, #0b6b64 100%)"
        }}
      />

      {/* Brilhos radiais sutis */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 82% 18%, rgba(255,255,255,0.18) 0%, transparent 60%),
            radial-gradient(circle at 18% 82%, rgba(255,255,255,0.14) 0%, transparent 62%)
          `
        }}
      />

      {/* Ruído sutil */}
      <div className="noise-overlay" />

      {/* Conteúdo principal */}
      <div
        className="relative z-10 h-full flex flex-col"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)"
        }}
      >
        {/* Logo principal - responsivo */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            height: logoConfig.height,
            marginTop: logoConfig.marginTop,
            opacity: logoConfig.opacity,
            transform: "translateZ(0)",
            willChange: "transform, opacity",
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          {!logoConfig.isHidden && (
            <img
              src={heroLogo}
              alt="Hospital de Caridade Santa Rita de Triunfo"
              className="triunfo-hero-reveal"
              loading="eager"
              fetchPriority="high"
              width="800"
              height="280"
              style={{
                width: "min(680px, 88vw)",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.30))",
                animationDelay: "0.1s"
              }}
            />
          )}
        </div>

        {/* Spacer dinâmico */}
        <div style={{ height: spacerHeight, transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)" }} />

        {/* Container principal com glass panel - mobile optimized */}
        <div
          className={`flex flex-col relative z-10 min-h-0 ${activeTab === 'register' ? 'flex-1' : ''}`}
          style={{
            paddingLeft: "clamp(12px, 3vw, 16px)",
            paddingRight: "clamp(12px, 3vw, 16px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)"
          }}
        >
          <div
            className={`flex flex-col relative z-10 min-h-0 w-full max-w-[480px] mx-auto ${activeTab === 'register' ? 'flex-1' : ''}`}
            style={{
              // Para login, o card se ajusta ao conteúdo
              ...(activeTab === 'login' && !isKeyboardVisible ? {
                height: 'auto',
                maxHeight: '100%'
              } : {})
            }}
          >
            <div
              className={`triunfo-card-reveal flex flex-col relative z-10 overflow-hidden ${activeTab === 'register' ? 'flex-1 min-h-0' : ''}`}
              style={{
                paddingBottom: isKeyboardVisible ? "0" : "env(safe-area-inset-bottom)",
                borderRadius: "clamp(20px, 4vw, 32px)",
                background: "rgba(255, 255, 255, 0.98)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                boxShadow: `
                  0 20px 60px rgba(0, 0, 0, 0.25),
                  0 10px 30px rgba(0, 0, 0, 0.10),
                  inset 0 1px 0 rgba(255, 255, 255, 1)
                `,
                transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                // Para login, altura automática
                ...(activeTab === 'login' ? {
                  height: 'auto',
                  flex: 'none'
                } : {})
              }}
            >
              {/* Conteúdo do formulário - scroll otimizado para mobile */}
              <div
                className={`flex flex-col auth-form-content ${activeTab === 'register' ? 'flex-1 overflow-y-auto min-h-0' : ''}`}
                style={{
                  // Para login, não precisa de scroll e ajusta ao conteúdo
                  ...(activeTab === 'login' ? {
                    overflow: 'visible',
                    height: 'auto'
                  } : {})
                }}
              >
                {children}
              </div>

              {/* Footer branding - hospital partnership - só aparece quando teclado não está visível */}
              {!isKeyboardVisible && (
                <div
                  className="auth-footer-branding shrink-0"
                  style={{
                    padding: "clamp(14px, 3.5vw, 20px) clamp(12px, 3vw, 20px)",
                    borderTop: "1px solid rgba(13, 148, 136, 0.08)",
                    background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(240, 253, 250, 0.4) 100%)"
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    {/* Texto "Em parceria com" */}
                    <span
                      style={{
                        fontSize: "clamp(9px, 2.2vw, 11px)",
                        color: "#64748b",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        opacity: 0.7
                      }}
                    >
                      Em parceria com
                    </span>

                    {/* Container dos logos */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {/* Logo Hospital Triunfo */}
                      <div className="flex items-center gap-2">
                        <img
                          src={hospitalLogo}
                          alt="Hospital de Caridade Santa Rita de Triunfo"
                          className="object-contain rounded-md"
                          style={{
                            height: "clamp(36px, 8vw, 48px)",
                            width: "auto",
                            border: "1.5px solid rgba(13, 148, 136, 0.12)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                            transition: "all 0.2s ease"
                          }}
                          loading="eager"
                          fetchPriority="high"
                        />
                        <div className="text-left">
                          <span
                            className="block"
                            style={{
                              color: "#0f766e",
                              fontSize: "clamp(10px, 2.5vw, 12px)",
                              lineHeight: "1.35",
                              fontWeight: 600,
                              letterSpacing: "-0.01em"
                            }}
                          >
                            Hospital de Caridade
                            <br />
                            Santa Rita de Triunfo
                          </span>
                        </div>
                      </div>

                      {/* Divisor vertical sutil */}
                      <div
                        className="bg-gradient-to-b from-transparent via-teal-200/40 to-transparent"
                        style={{ height: "clamp(28px, 6vw, 36px)", width: "1px" }}
                      />

                      {/* Logo CN Vidas com "powered by" */}
                      <div className="flex flex-col items-center gap-1">
                        <span
                          style={{
                            fontSize: "clamp(7px, 1.8vw, 9px)",
                            color: "#94a3b8",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                            fontWeight: 500
                          }}
                        >
                          powered by
                        </span>
                        <img
                          src="/logo_cn_vidas_transparent.png"
                          alt="CN Vidas"
                          style={{
                            height: "clamp(18px, 4vw, 24px)",
                            width: "auto",
                            objectFit: "contain",
                            filter: "saturate(0.95)"
                          }}
                          loading="eager"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
