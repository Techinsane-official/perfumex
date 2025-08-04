"use client";

import { useEffect, useState } from "react";
import { createCsrfToken } from "@/lib/csrf";

interface CSRFTokenProps {
  name?: string;
  className?: string;
}

export default function CSRFToken({ name = "csrf_token", className }: CSRFTokenProps) {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    // Generate CSRF token on client side
    const newToken = createCsrfToken();
    setToken(newToken);
  }, []);

  if (!token) {
    return null;
  }

  return <input type="hidden" name={name} value={token} className={className} />;
}

/**
 * Server-side CSRF token component
 */
export function ServerCSRFToken({ name = "csrf_token", className }: CSRFTokenProps) {
  const token = createCsrfToken();

  return <input type="hidden" name={name} value={token} className={className} />;
}
