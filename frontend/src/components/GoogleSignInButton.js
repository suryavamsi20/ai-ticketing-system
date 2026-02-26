import React, { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";

export default function GoogleSignInButton({ onToken, disabled = false, label = "Continue with Google" }) {
  const containerRef = useRef(null);
  const [loadError, setLoadError] = useState("");
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setLoadError("Google Sign-In is not configured.");
      return;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const renderButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) {
        return;
      }

      containerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential && typeof onToken === "function") {
            onToken(credential);
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        shape: "pill",
        size: "large",
        text: "continue_with",
        theme: "outline",
        width: 320,
      });
    };

    if (script.dataset.loaded === "true") {
      renderButton();
    } else {
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        renderButton();
      });
      script.addEventListener("error", () => setLoadError("Unable to load Google Sign-In."));
    }
  }, [clientId, onToken]);

  if (disabled) {
    return (
      <button type="button" className="secondary-btn auth-social-btn" disabled>
        {label}
      </button>
    );
  }

  return (
    <div className="auth-google-wrap">
      {loadError ? (
        <p className="error-text">{loadError}</p>
      ) : (
        <>
          <div ref={containerRef} className="google-button-mount" />
          <p className="text-muted auth-google-note">{label}</p>
        </>
      )}
    </div>
  );
}
