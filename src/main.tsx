import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/700.css";

import App from './App';
import './i18n/i18n';

const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
