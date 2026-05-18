import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/700.css";

import { installGlobalErrorHandlers } from './lib/globalErrorHandlers';
import App from './App';
import './i18n/i18n';

// Install global error handlers before React mounts
installGlobalErrorHandlers();

// TODO: Once backend provides the endpoint URL, uncomment:
// import { configureErrorReporter } from './lib/errorReporter';
// configureErrorReporter({ endpoint: '/api/system/client-errors' });

const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
