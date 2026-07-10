import { useEffect } from "react";
import { useLocation } from "wouter";

export default function StudentDashboard() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/recovery", { replace: true }); }, [navigate]);
  return null;
}
