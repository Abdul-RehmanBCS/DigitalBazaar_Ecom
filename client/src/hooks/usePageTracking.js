import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";

const SESSION_KEY = "db_session_id";

export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function trackEvent(type, data = {}) {
  api.post("/analytics/track", { type, data, sessionId: getSessionId() }).catch(() => {});
}

export default function usePageTracking() {
  const { pathname, search } = useLocation();
  const prev = useRef("");

  useEffect(() => {
    const path = pathname + search;
    if (path === prev.current) return;
    prev.current = path;
    trackEvent("page_view", { path: pathname, search: search || undefined });
  }, [pathname, search]);
}
