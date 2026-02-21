import { useState, useEffect } from "react";
import { API_URL } from "@/lib/config";

export function useActiveRequestCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/requests/active-count`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.count != null) setCount(data.count);
      })
      .catch(() => {});
  }, []);

  return count;
}
