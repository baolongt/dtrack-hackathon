import React from "react";
import ReactDOM from "react-dom/client";
import { InternetIdentityProvider } from "ic-use-internet-identity";
import App from "./App";
import "./index.css";
import { IDENTITY_PROVIDER_HOST } from "./lib/env";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <InternetIdentityProvider
      loginOptions={{
        identityProvider: IDENTITY_PROVIDER_HOST,
      }}
    >
      <App />
    </InternetIdentityProvider>
  </React.StrictMode>
);
