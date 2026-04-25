import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

const TIMER_KEY = "sa_timer_start";
const SUPABASE_URL = "https://biqdrsqirzxnznyucwtz.supabase.co";

type TimerContextType = {
  isRunning: boolean;
  elapsedSeconds: number;
  startTimer: () => void;
  stopTimer: () => Promise<void>;
  resumeSession: () => Promise<void>;
  discardSession: () => Promise<void>;
  pendingResume: boolean;
  resumeInfo: { startTime: string; elapsedSeconds: number } | null;
};

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [pendingResume, setPendingResume] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<{ startTime: string; elapsedSeconds: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TIMER_KEY).then((stored) => {
      if (stored) {
        const start = new Date(stored);
        const diff = Math.floor((Date.now() - start.getTime()) / 1000);
        setResumeInfo({ startTime: stored, elapsedSeconds: diff });
        setPendingResume(true);
      }
    });
  }, []);

  const startTimer = useCallback(() => {
    if (isRunning || !user) return;
    const startTime = new Date().toISOString();
    setSessionStartTime(startTime);
    setElapsedSeconds(0);
    setIsRunning(true);
    AsyncStorage.setItem(TIMER_KEY, startTime);
    supabase.from("study_sessions").insert({
      user_id: user.id,
      start_time: startTime,
      status: "active",
    });
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, [isRunning, user]);

  const stopTimer = useCallback(async () => {
    if (!isRunning || !sessionStartTime) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    const endTime = new Date().toISOString();
    AsyncStorage.removeItem(TIMER_KEY);
    setElapsedSeconds(0);
    if (session) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/save-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ start_time: sessionStartTime, end_time: endTime }),
        });
      } catch {}
    }
    setSessionStartTime(null);
  }, [isRunning, sessionStartTime, session]);

  const resumeSession = useCallback(async () => {
    if (!resumeInfo || !session) return;
    setPendingResume(false);
    const endTime = new Date().toISOString();
    AsyncStorage.removeItem(TIMER_KEY);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/save-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ start_time: resumeInfo.startTime, end_time: endTime }),
      });
    } catch {}
    setResumeInfo(null);
  }, [resumeInfo, session]);

  const discardSession = useCallback(async () => {
    setPendingResume(false);
    AsyncStorage.removeItem(TIMER_KEY);
    if (user) {
      await supabase
        .from("study_sessions")
        .delete()
        .eq("user_id", user.id)
        .eq("status", "active");
    }
    setResumeInfo(null);
  }, [user]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <TimerContext.Provider value={{ isRunning, elapsedSeconds, startTimer, stopTimer, resumeSession, discardSession, pendingResume, resumeInfo }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
