import type { Metadata } from "next";

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "IMAGENI",
  description: "IMAGENI - генерация изображений с помощью нейросетей",
};

// Generate a random state parameter for CSRF protection
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate state at render time
  const state = generateRandomState();
  
  return (
    <html lang="ru" className="dark">
      <head>
        {/* Add these scripts to properly load CloudPayments */}
        <script src="https://code.jquery.com/jquery-3.6.0.min.js" defer></script>
        {/* <script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" defer></script> */}
        <script src="https://checkout.cloudpayments.ru/checkout.js"></script>
        <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
        
        {/* Apple Sign-In meta tags with correct parameters */}
        <meta name="appleid-signin-client-id" content="org.imageni.app" />
        <meta name="appleid-signin-scope" content="name%20email" />
        <meta name="appleid-signin-redirect-uri" content="https://imageni.org/login_apple.php" />
        <meta name="appleid-signin-state" content={state} />
      </head>
      <body className={inter.className}>
          {children}
      </body>
    </html>
  );
}
