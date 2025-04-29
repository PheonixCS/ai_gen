import { useCallback, useEffect } from "react";

const AppleAuthButton = () => {
  useEffect(() => {
    // Load Apple Sign In JS SDK
    const loadAppleScript = () => {
      if (document.querySelector('script[src*="appleid.auth.js"]')) return;
      
      const script = document.createElement('script');
      script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      script.async = true;
      document.head.appendChild(script);
    };
    
    loadAppleScript();
  }, []);

  const handleAppleAuth = useCallback(() => {
    if (window.AppleID) {
      try {
        window.AppleID.auth.init({
          clientId: "org.imageni.app", // Make sure this exactly matches your Service ID in Apple Developer account
          scope: "name email",
          redirectURI: "https://imageni.org/login_apple.php", // Make sure this is registered in Apple Developer account
          usePopup: true // Use redirect instead of popup
        });
        window.AppleID.auth.signIn();
      } catch (error) {
        console.error("Apple Auth Error:", error);
      }
    } else {
      console.error("Apple Sign In SDK not loaded");
    }
  }, []);

  return (
    <button
      onClick={handleAppleAuth}
      className="w-full py-3 bg-black text-white rounded border border-white/20 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 384 512"
      >
        <path
          fill="currentColor"
          d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
        />
      </svg>
      Войти с помощью Apple
    </button>
  );
};

// Add type declaration for AppleID global
declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: any) => void;
        signIn: () => void;
      };
    };
  }
}

export default AppleAuthButton;