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
    configureIOSStatusBar('#0d7d74');
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

  // Configurações para cada estado - altura ajustada
  const getLogoConfig = () => {
    switch (layoutState) {
      case "register-keyboard":
        return { height: '0px', marginTop: '0px', opacity: 0, isHidden: true };
      case "login-no-keyboard":
        return { height: 'clamp(130px, 20vw, 180px)', marginTop: '24px', opacity: 1, isHidden: false };
      case "login-keyboard":
        return { height: '60px', marginTop: '10px', opacity: 1, isHidden: false };
      default:
        return { height: 'clamp(120px, 18vw, 160px)', marginTop: '20px', opacity: 1, isHidden: false };
    }
  };

  const getSpacerHeight = () => {
    switch (layoutState) {
      case "register-keyboard":
        return '0px';
      case "login-no-keyboard":
        return '12px';
      case "login-keyboard":
        return '4px';
      default:
        return '10px';
    }
  };

  const logoConfig = getLogoConfig();
  const spacerHeight = getSpacerHeight();

  return (
    <div className="triunfo-auth-v2 fixed inset-0 overflow-hidden">
      {/* Background gradiente principal */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(155deg, #0d9488 0%, #0f766e 40%, #134e4a 100%)"
        }}
      />

      {/* Padrão geométrico sutil */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(30deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(150deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(30deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(150deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(60deg, rgba(255,255,255,0.5) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.5) 75%, rgba(255,255,255,0.5)),
            linear-gradient(60deg, rgba(255,255,255,0.5) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.5) 75%, rgba(255,255,255,0.5))
          `,
          backgroundSize: "80px 140px",
          backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px"
        }}
      />

      {/* Gradiente de luz no topo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.15) 0%, transparent 60%)"
        }}
      />

      <div className="relative z-10 h-full flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Logo principal */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            height: logoConfig.height,
            marginTop: logoConfig.marginTop,
            opacity: logoConfig.opacity,
            transform: "translateZ(0)",
            willChange: "transform",
            transition: "all 280ms cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          {!logoConfig.isHidden && (
            <img
              src={heroLogo}
              alt="Hospital de Triunfo"
              className="triunfo-hero-reveal"
              loading="eager"
              fetchpriority="high"
              width="800"
              height="280"
              style={{
                width: "min(800px, 92vw)",
                height: logoConfig.height,
                objectFit: "cover",
                objectPosition: "center center",
                filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3))",
                animationDelay: "0.15s"
              }}
            />
          )}
        </div>

        {/* Spacer dinâmico */}
        <div style={{ height: spacerHeight, transition: "all 280ms cubic-bezier(0.4, 0, 0.2, 1)" }} />

        {/* Container principal com card branco */}
        <div className="flex flex-col relative z-10 flex-1 min-h-0 px-4 pb-safe">
          <div className="flex flex-col relative z-10 flex-1 min-h-0 w-full max-w-[520px] mx-auto">
            <div
              className="flex flex-col relative z-10 flex-1 min-h-0 rounded-[28px] overflow-hidden"
              style={{
                paddingBottom: isKeyboardVisible ? "0" : "env(safe-area-inset-bottom)",
                background: "#ffffff",
                boxShadow: `
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  0 25px 50px -12px rgba(0, 0, 0, 0.25),
                  0 12px 24px -8px rgba(0, 0, 0, 0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 1)
                `,
                transition: "all 280ms cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              {/* Header do card */}
              {!isKeyboardVisible && (
                <div
                  className="px-6 pt-5 pb-4 text-center border-b"
                  style={{
                    borderColor: "rgba(15, 118, 110, 0.08)",
                    background: "linear-gradient(180deg, rgba(240, 253, 250, 0.8) 0%, rgba(255, 255, 255, 0) 100%)"
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <img
                      src={hospitalLogo}
                      alt="Hospital de Triunfo"
                      className="h-11 w-auto object-contain rounded-lg shadow-sm"
                      style={{ border: "1px solid rgba(15, 118, 110, 0.1)" }}
                      loading="eager"
                      fetchpriority="high"
                    />
                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-teal-200 to-transparent" />
                    <span
                      className="text-[10px] uppercase tracking-[0.2em] font-semibold"
                      style={{ color: "#0d9488" }}
                    >
                      Hospital de Triunfo
                    </span>
                  </div>
                </div>
              )}

              {/* Conteúdo do formulário */}
              <div className="flex-1 flex flex-col overflow-y-auto min-h-0 auth-form-content">
                {children}
              </div>

              {/* Footer do card */}
              {!isKeyboardVisible && layoutState !== "register-keyboard" && (
                <div
                  className="text-center py-3 border-t"
                  style={{
                    borderColor: "rgba(15, 118, 110, 0.08)",
                    background: "rgba(248, 250, 252, 0.5)"
                  }}
                >
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: "#0d9488" }}
                  >
                    CN Vidas
                  </span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span
                    className="text-[10px]"
                    style={{ color: "#94a3b8" }}
                  >
                    Cuidando da sua saúde
                  </span>
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
