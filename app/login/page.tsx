"use client";
import Header from "@/components/Header";
import Title from "@/components/Title";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm"; // Add import for RegisterForm
import Footer from "@/components/Footer";
import ApiDebugger from "@/components/ApiDebugger";
import AppleAuthButton from "@/components/AppleAuthButton"; // Import the AppleAuthButton component
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// Add TypeScript declaration for YaAuthSuggest, YaSendSuggestToken, Google OAuth
// Note: AppleID is already declared in AppleAuthButton.tsx
declare global {
  interface Window {
    YaAuthSuggest?: {
      init: (
        config: {
          client_id: string;
          response_type: string;
          redirect_uri: string;
        },
        domain: string,
        options: {
          view: string;
          parentId: string;
          buttonSize: string;
          buttonView: string;
          buttonTheme: string;
          buttonBorderRadius: string;
          buttonIcon: string;
        }
      ) => Promise<{ handler: () => Promise<any> }> ;
    };
    YaSendSuggestToken?: (url: string) => void;
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
    // Fixed VK SDK declaration
    VKIDSDK?: {
      Config: {
        init: (config: any) => void;
      };
      ConfigResponseMode: {
        Callback: string;
      };
      ConfigSource: {
        LOWCODE: string;
      };
      OneTap: new () => {
        render: (config: any) => {
          on: (event: string, callback: (payload?: any) => void) => any;
        };
      };
      WidgetEvents: {
        ERROR: string;
      };
      OneTapInternalEvents: {
        LOGIN_SUCCESS: string;
      };
      Auth: {
        exchangeCode: (code: string, deviceId: string) => Promise<any>;
      };
    };
    // AppleID declaration removed to prevent conflict with AppleAuthButton.tsx
  }
}

// Define interfaces for Google authentication responses
interface GoogleCredentialResponse {
  credential: string;
  clientId?: string;
  select_by?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
}

export default function Login() {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === "development";
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false); // New state to toggle between RegisterForm and LoginForm
  const router = useRouter();
  const [yaScriptLoaded, setYaScriptLoaded] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [appleScriptLoaded, setAppleScriptLoaded] = useState(false);
  const [vkScriptLoaded, setVkScriptLoaded] = useState(false);
  const [utmCampaign, setUtmCampaign] = useState<string | null>(null);
  const initAttempts = useRef(0);
  const maxInitAttempts = 5;

  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const utmCampaign = urlParams.get('utm_campaign');
      if (utmCampaign) {
        localStorage.setItem('utm_campaign', utmCampaign); // Сохраняем в локальное хранилище
      }
      setUtmCampaign(utmCampaign);  
    }, []);
  // Load Yandex SDK script programmatically
  useEffect(() => {
    if (document.querySelector('script[src*="passport-sdk"]')) {
      setYaScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js";
    script.async = true;
    script.onload = () => {
      console.log("Yandex Auth SDK loaded");
      setYaScriptLoaded(true);
    };
    script.onerror = (error) => {
      console.error("Error loading Yandex Auth SDK:", error);
    };

    document.body.appendChild(script);
  }, []);

  // Add a new effect to handle the visibility of the Yandex container
  useEffect(() => {
    // Find elements with the yaPreloadingSuggestBlockContainer class
    const yaContainers = document.getElementsByClassName('yaPreloadingSuggestBlockContainer');
    
    if (yaContainers && yaContainers.length > 0) {
      // Convert HTMLCollection to array to use forEach
      Array.from(yaContainers).forEach(container => {
        if (showEmailLogin) {
          // Hide container when email form is active
          (container as HTMLElement).style.display = 'none';
        } else {
          // Show container when email form is not active
          (container as HTMLElement).style.display = '';
        }
      });
    }
  }, [showEmailLogin]); // Re-run effect when showEmailLogin changes

  // Initialize Google authentication
  useEffect(() => {
    if (!googleScriptLoaded || typeof window.google === "undefined") return;

    // We're still loading the script but won't initialize the client-side widget
    console.log("Google script loaded, but using redirect flow instead of client-side widget");
    
    // We keep this commented in case you want to revert back to client-side authentication later
    /*
    try {
      window.google.accounts.id.initialize({
        client_id:
          "72458687412-r5euu7ter59toms2qlfdjvnc4vedql3j.apps.googleusercontent.com",
        callback: handleGoogleCredentialResponse,
        auto_select: false,
      });

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id:
          "72458687412-r5euu7ter59toms2qlfdjvnc4vedql3j.apps.googleusercontent.com",
        scope: "email profile",
        callback: handleGoogleTokenResponse,
      });

      if (document.getElementById("googleButtonContainer")) {
        window.google.accounts.id.renderButton(
          document.getElementById("googleButtonContainer")!,
          {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: 280,
          }
        );
      }

      console.log("Google Sign-In initialized successfully");
    } catch (error) {
      console.error("Error initializing Google Sign-In:", error);
    }
    */
  }, [googleScriptLoaded]);

  // Initialize Apple Sign In
  useEffect(() => {
    if (!appleScriptLoaded) return;

    try {
      if (window.AppleID) {
        window.AppleID.auth.init({
          clientId: "org.imageni.app",
          scope: "name email",
          redirectURI: "https://imageni.org/login_apple.php",
          state: Math.random().toString(36).substring(2, 15),
        });
        console.log("Apple Sign-In initialized successfully");
      } else {
        console.warn("Apple Sign-In SDK not loaded yet");
      }
    } catch (error) {
      console.error("Error initializing Apple Sign-In:", error);
    }
  }, [appleScriptLoaded]);

  // Load VK SDK script programmatically
  useEffect(() => {
    if (document.querySelector('script[src*="vkid/sdk"]')) {
      setVkScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js";
    script.async = true;
    script.onload = () => {
      console.log("VK ID SDK loaded");
      setVkScriptLoaded(true);
    };
    script.onerror = (error) => {
      console.error("Error loading VK ID SDK:", error);
    };

    document.body.appendChild(script);
  }, []);

  // Initialize VK authentication
  useEffect(() => {
    if (!vkScriptLoaded || typeof window.VKIDSDK === "undefined") return;

    try {
      window.VKIDSDK.Config.init({
        app: 53493233,
        redirectUrl: 'https://imageni.org/login_vk_web.php',
        responseMode: window.VKIDSDK.ConfigResponseMode.Callback,
        source: window.VKIDSDK.ConfigSource.LOWCODE,
        scope: 'email',  // Add email scope to request user email if possible
      });

      console.log("VK ID SDK initialized successfully");

      const oneTap = new window.VKIDSDK.OneTap();
      oneTap.render({
        container: document.getElementById("vkButtonContainer")!,
        theme: "dark", // Changed from light to dark theme
        size: "large",
        shape: "rectangular",
        text: "Войти с помощью VK", // Translated to Russian for consistency
        showAlternativeLogin: true,
        styles: {
          borderRadius: 9
        }
      }).on(window.VKIDSDK.WidgetEvents.ERROR, (error) => {
        console.error("VK One Tap error:", error);
      }).on(
        window.VKIDSDK.OneTapInternalEvents.LOGIN_SUCCESS, function (payload: { code: string; deviceId: string }) {
          if (!window.VKIDSDK) {
            console.error("VKIDSDK not available");
            return;
          }
          
          const { code, deviceId } = payload;
          console.log("VK One Tap login payload:", payload);
          
          // Use VKIDSDK to exchange code for token directly in the browser
          window.VKIDSDK.Auth.exchangeCode(code, deviceId)
            .then((response) => {
              console.log("VK Auth success:", response);
              
              if (response && response.code === 200) {
                const userData = response.data;
                
                // Create user object with VK authentication info
                const user = {
                  email: userData.user.email || `vk_${userData.user.id}@imageni.org`,
                  first_name: userData.user.first_name || '',
                  last_name: userData.user.last_name || '',
                  token: userData.access_token,
                  vkAuth: true
                };
                
                // Store in localStorage and redirect
                localStorage.setItem("user", JSON.stringify(user));
                router.replace("/home/");
              } else {
                // Fallback to server-side approach if response is unexpected
                console.warn("Unexpected VK response format, falling back to server-side flow");
                fallbackToServerSide(code, deviceId);
              }
            })
            .catch((error) => {
              console.error("Error exchanging VK code:", error);
              fallbackToServerSide(code, deviceId);
            });
        }
      );
      console.log("VK One Tap initialized successfully");

    } catch (error) {
      console.error("Error initializing VK ID SDK:", error);
    }
  }, [vkScriptLoaded, router]);
  
  // Function to fallback to server-side VK authentication
  const fallbackToServerSide = (code: string, deviceId: string) => {
    // Send the code directly to our backend with fetch
    fetch('https://imageni.org/login_vk_web.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `vk_code=${encodeURIComponent(code)}&device_id=${encodeURIComponent(deviceId || '')}`
    })
    .then(response => {
      if (response.redirected) {
        // If our backend redirects us, follow that redirect
        window.location.href = response.url;
        return;
      }
      return response.text();
    })
    .then(html => {
      if (html) {
        // Create a temporary element to execute any scripts in the response
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Check for localStorage script in the HTML
        const scripts = tempDiv.getElementsByTagName('script');
        if (scripts.length > 0) {
          for (let i = 0; i < scripts.length; i++) {
            // Create a local variable to properly type-narrow
            const scriptContent = scripts[i].textContent;
            
            // Fix: TypeScript will now properly recognize that scriptContent is not null
            if (scriptContent && scriptContent.includes('localStorage.setItem')) {
              // Execute the script content
              eval(scriptContent);
              
              // If the script redirects to home, we can initiate that
              setTimeout(() => {
                router.push('/home/');
              }, 1500);
              
              return;
            }
          }
        }
      }
      
      // Fallback: if we couldn't process the HTML response properly
      console.warn("Couldn't process the login response, falling back to redirect");
      handleVKSignIn();
    })
    .catch(error => {
      console.error("Error with VK authentication:", error);
      // Fallback to traditional redirect
      handleVKSignIn();
    });
  };

  // Handle Google credential response
  const handleGoogleCredentialResponse = async (
    response: GoogleCredentialResponse
  ) => {
    console.log("Google credential response:", response);

    if (response && response.credential) {
      try {
        const apiResponse = await fetch(
          "https://imageni.org/api/auth/google.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_token: response.credential,
            }),
          }
        );

        const data = await apiResponse.json();

        if (data.code === 200) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              ...data.user,
              token: data.token,
              googleAuth: true,
            })
          );

          router.replace("/home/");
        } else {
          console.error("Failed to authenticate with Google:", data.msg);
        }
      } catch (error) {
        console.error("Error during Google authentication:", error);
      }
    }
  };

  // Handle Google access token response (if using OAuth 2.0 flow)
  const handleGoogleTokenResponse = (tokenResponse: GoogleTokenResponse) => {
    console.log("Google token response:", tokenResponse);
    if (tokenResponse && tokenResponse.access_token) {
    }
  };

  // Handle Google Sign-In button click - modified to use the correct redirect URI
  const handleGoogleSignIn = () => {
    // Redirect to our server-side Google OAuth initialization endpoint
    window.location.href = "https://imageni.org/api/auth/google_redirect.php";
    
    // The server will handle the OAuth flow including proper redirect_uri setup
    // After authentication, the user will be redirected back to our app
  };

  // Handle Apple Sign-In button click
  const handleAppleSignIn = () => {
    window.location.href = "https://imageni.org/login_apple.php?go=1";
  };

  // Handle VK Sign-In button click
  const handleVKSignIn = () => {
    window.location.href = "https://imageni.org/login_vk_web.php?go=1";
  };

  // Check if user is already authenticated and redirect to home
  useEffect(() => {
    try {
      // Check for URL parameters from Apple authentication callback
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('status') === 'ok' && searchParams.get('em') && searchParams.get('pass')) {
        const email = searchParams.get('em');
        const token = searchParams.get('pass');
        
        // Store user data in localStorage
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: email,
            token: token,
            appleAuth: true,
          })
        );
        
        // Remove the sensitive data from URL
        window.history.replaceState({}, document.title, "/login");
        
        // Redirect to home page
        router.replace("/home/");
        return; // Prevent further execution
      }
      
      // Regular authentication check
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user && user.token) {
          router.replace("/home/");
        }
      }
    } catch (error) {
      console.error("Error checking authentication status:", error);
    }
  }, [router]);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "YANDEX_AUTH_SUCCESS") {
        router.replace("/home/");
      }
      
      // Add Apple login callback handler
      if (event.data && event.data.type === "APPLE_AUTH_SUCCESS") {
        router.replace("/home/");
      }

      // Add VK login callback handler
      if (event.data && event.data.type === "VK_AUTH_SUCCESS") {
        router.replace("/home/");
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user") {
        try {
          const userData = event.newValue ? JSON.parse(event.newValue) : null;
          if (userData && userData.token && 
            (userData.yandexAuth || userData.appleAuth || userData.vkAuth)) {
            router.replace("/home/");
          }
        } catch (error) {
          console.error("Error parsing user data from storage event:", error);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  // Initialize Yandex Auth when script is loaded
  useEffect(() => {
    if (!yaScriptLoaded) return;

    const initYandexAuth = () => {
      if (
        typeof window !== "undefined" &&
        document.getElementById("buttonContainerId")
      ) {
        if (typeof window.YaSendSuggestToken === "function") {
          window.YaSendSuggestToken("https://imageni.org/login/");
        }

        if (window.YaAuthSuggest) {
          try {
            window.YaAuthSuggest.init(
              {
                client_id: "8f6ff1a80c9246cd81b46d4c1f98f788",
                response_type: "token",
                redirect_uri: "https://imageni.org/auth/yandex/callback",
              },
              "https://imageni.org",
              {
                view: "button",
                parentId: "buttonContainerId",
                buttonSize: "m",
                buttonView: "main",
                buttonTheme: "light",
                buttonBorderRadius: "0",
                buttonIcon: "ya",
              }
            )
              .then(({ handler }) => {
                console.log("Yandex button initialized successfully");
                return handler();
              })
              .then((data) => console.log("Сообщение с токеном", data))
              .catch((error) => {
                console.error("Обработка ошибки", error);
                retryInit();
              });
          } catch (error) {
            console.error("Error initializing YaAuthSuggest:", error);
            retryInit();
          }
        } else {
          console.warn("YaAuthSuggest not available yet");
          retryInit();
        }
      } else {
        console.warn("Button container not found or window not defined");
        retryInit();
      }
    };

    const retryInit = () => {
      if (initAttempts.current >= maxInitAttempts) {
        console.error("Max initialization attempts reached");
        return;
      }

      initAttempts.current += 1;
      const delay = Math.min(
        1000 * Math.pow(1.5, initAttempts.current),
        10000
      );

      console.log(
        `Retrying Yandex button initialization in ${delay}ms (attempt ${initAttempts.current})`
      );
      setTimeout(initYandexAuth, delay);
    };

    setTimeout(initYandexAuth, 500);
  }, [yaScriptLoaded]);

  return (
    <>
    
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={() => setGoogleScriptLoaded(true)}
        strategy="lazyOnload"
      />

      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        onLoad={() => setAppleScriptLoaded(true)}
        strategy="lazyOnload"
      />

      <Script
        src="https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js"
        onLoad={() => setVkScriptLoaded(true)}
        strategy="lazyOnload"
      />

      <div className="auth-layout bg-[#0F0F0F] text-white p-4">
        <div className="auth-container w-full flex flex-col gap-8 justify-center">
          <Title />

          <div className="flex flex-col gap-4">
            {!showEmailLogin ? (
              <>
                <div
                  id="buttonContainerId"
                  className="w-full h-[42px] flex items-center justify-center rounded-xl overflow-hidden"
                >
                  {!yaScriptLoaded && (
                    <div className="animate-pulse bg-white/10 rounded-xl w-full h-full"></div>
                  )}
                </div>
                
                {/* VK button simplified to just redirect to server-side auth */}
                <button
                  onClick={handleVKSignIn}
                  className="w-full py-3 bg-[#1E1E1E] text-white rounded-xl flex items-center justify-center gap-2 h-[42px] hover:bg-[#2A2A2A] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#1976d2" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5 V37z"></path><path fill="#fff" d="M35.937,18.041c0.046-0.151,0.068-0.291,0.062-0.416C35.984,17.263,35.735,17,35.149,17h-2.618 c-0.661,0-0.966,0.4-1.144,0.801c0,0-1.632,3.359-3.513,5.574c-0.61,0.641-0.92,0.625-1.25,0.625C26.447,24,26,23.786,26,23.199 v-5.185C26,17.32,25.827,17,25.268,17h-4.649C20.212,17,20,17.32,20,17.641c0,0.667,0.898,0.827,1,2.696v3.623 C21,24.84,20.847,25,20.517,25c-0.89,0-2.642-3-3.815-6.932C16.448,17.294,16.194,17,15.533,17h-2.643 C12.127,17,12,17.374,12,17.774c0,0.721,0.6,4.619,3.875,9.101C18.25,30.125,21.379,32,24.149,32c1.678,0,1.85-0.427,1.85-1.094 v-2.972C26,27.133,26.183,27,26.717,27c0.381,0,1.158,0.25,2.658,2c1.73,2.018,2.044,3,3.036,3h2.618 c0.608,0,0.957-0.255,0.971-0.75c0.003-0.126-0.015-0.267-0.056-0.424c-0.194-0.576-1.084-1.984-2.194-3.326 c-0.615-0.743-1.222-1.479-1.501-1.879C32.062,25.36,31.991,25.176,32,25c0.009-0.185,0.105-0.361,0.249-0.607 C32.223,24.393,35.607,19.642,35.937,18.041z"></path>
                  </svg>
                  <span className="ml-2">Войти с помощью VK</span>
                </button>
                    
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 bg-[#1E1E1E] text-white rounded-xl flex items-center justify-center gap-2 h-[42px] hover:bg-[#2A2A2A] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 48 48"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                    />
                    <path
                      fill="#FF3D00"
                      d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                    />
                  </svg>
                  Войти с помощью Google
                </button>

                {/* Restore the Apple sign-in button */}
                <button
                  onClick={handleAppleSignIn}
                  className="w-full py-3 bg-[#1E1E1E] text-white rounded-xl flex items-center justify-center gap-2 h-[42px] hover:bg-[#2A2A2A] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.0349 12.9676C17.0049 9.85405 19.5793 8.50055 19.6793 8.44105C18.2693 6.38705 16.0499 6.09605 15.2749 6.07606C13.4249 5.89005 11.6349 7.17355 10.6949 7.17355C9.73492 7.17355 8.29492 6.09605 6.71992 6.12655C4.69492 6.15655 2.81992 7.29205 1.79992 9.08005C-0.310078 12.7135 1.23992 18.1135 3.25492 21.176C4.25492 22.6835 5.44992 24.371 7.02492 24.3095C8.57492 24.241 9.13492 23.3245 11.0049 23.3245C12.8649 23.3245 13.3849 24.3095 15.0049 24.271C16.6649 24.241 17.6949 22.7505 18.6649 21.236C19.8499 19.4885 20.3249 17.775 20.3549 17.676C20.3249 17.645 17.0649 16.487 17.0349 12.9675M14.0849 4.07455C14.8799 3.10905 15.3999 1.78505 15.2649 0.445557C14.1399 0.491057 12.7149 1.20706 11.8949 2.14206C11.1749 2.98756 10.5499 4.35006 10.6949 5.65405C11.9649 5.74455 13.2799 5.02455 14.0849 4.07505" fill="currentColor"/>
                  </svg>
                  <span>Войти с помощью Apple</span>
                </button>

                <button
                  className="w-full py-3 bg-[#1E1E1E] text-white rounded-xl flex items-center justify-center gap-2 h-[42px] hover:bg-[#2A2A2A] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => {
                    setShowEmailLogin(true);
                    setShowLoginForm(false); // Show RegisterForm by default when email login is clicked
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                  </svg>
                  Войти с помощью почты
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setShowEmailLogin(false)}
                    className="flex items-center text-white/70 hover:text-white transition-colors hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.1252 20.9999C15.9332 20.9999 15.7412 20.9264 15.5949 20.7802L7.34494 12.5302C7.05169 12.2369 7.05169 11.7629 7.34494 11.4697L15.5949 3.21969C15.8882 2.92644 16.3622 2.92644 16.6554 3.21969C16.9487 3.51294 16.9487 3.98694 16.6554 4.28019L8.93569 11.9999L16.6554 19.7197C16.9487 20.0129 16.9487 20.4869 16.6554 20.7802C16.5092 20.9264 16.3172 20.9999 16.1252 20.9999Z" fill="currentColor" />
                    </svg>
                    <span className="ml-2">Назад</span>
                  </button>
                  
                  <button 
                    className="bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black px-4 py-1 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-[1.05] active:scale-[0.95]"
                  >
                    Email
                  </button>
                </div>
                
                {showLoginForm ? (
                  <LoginForm />
                ) : (
                  <RegisterForm onSwitchToLogin={() => setShowLoginForm(true)} />
                )}
              </>
            )}
          </div>

          {showEmailLogin ? null : (
            <div className="w-full md:flex flex-col gap-6 mt-6 bg-[#151515] rounded-lg p-6 border border-white/8">
              <h2 className="text-lg font-medium">Добро пожаловать!</h2>
              <p className="text-white/70">
                Войдите в свой аккаунт, чтобы получить доступ ко всем функциям
                нашего ИИ-генератора изображений. Создавайте, редактируйте и
                делитесь вашими уникальными фотографиями.
              </p>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[#58E877]"></div>
                <div className="w-2 h-2 rounded-full bg-white/30"></div>
                <div className="w-2 h-2 rounded-full bg-white/30"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .signin-button {
          width: 210px;
          height: 40px;
        }
        .apple-signin-button {
          height: 40px;
          margin: 0 auto;
          max-width: 100%;
        }
        #buttonContainerId button {
          border-radius: 0.75rem !important;
          background-color: #1E1E1E !important;
          height: 42px !important;
          width: 100% !important;
          border: none !important;
          transition: all 0.2s ease !important;
        }
        #buttonContainerId button:hover {
          background-color: #2A2A2A !important;
          transform: scale(1.02) !important;
        }
        #buttonContainerId button:active {
          transform: scale(0.98) !important;
        }
        /* Add styling for VK button container */
        #vkButtonContainer div {
          border-radius: 0.75rem !important;
          background-color: #1E1E1E !important;
          height: 42px !important;
          width: 100% !important;
          border: none !important;
          transition: all 0.2s ease !important;
        }
        #vkButtonContainer div:hover {
          background-color: #2A2A2A !important;
          transform: scale(1.02) !important;
        }
        #vkButtonContainer div:active {
          transform: scale(0.98) !important;
        }
      `}</style>
    </>
  );
}
