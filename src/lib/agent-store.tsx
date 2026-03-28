'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { OnChainAgent } from './types';
import { DEMO_AGENTS, DEMO_TASKS, DEMO_MESSAGES } from './demo-data';

interface AgentStore {
  agents: OnChainAgent[];
  addAgent: (agent: OnChainAgent) => void;
  taskCount: number;
  messageCount: number;
  solSettled: number;
  incrementTasks: () => void;
  incrementMessages: (n?: number) => void;
  addSolSettled: (amount: number) => void;
}

const STORAGE_KEY = 'solagent-hub-store';

const AgentStoreContext = createContext<AgentStore | null>(null);

export function AgentStoreProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<OnChainAgent[]>(DEMO_AGENTS);
  const [taskCount, setTaskCount] = useState(1847);
  const [messageCount, setMessageCount] = useState(5231);
  const [solSettled, setSolSettled] = useState(142.8);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.customAgents && Array.isArray(data.customAgents)) {
          setAgents([...DEMO_AGENTS, ...data.customAgents]);
        }
        if (typeof data.taskCount === 'number') setTaskCount(data.taskCount);
        if (typeof data.messageCount === 'number') setMessageCount(data.messageCount);
        if (typeof data.solSettled === 'number') setSolSettled(data.solSettled);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist custom agents to localStorage whenever they change
  useEffect(() => {
    if (!hydrated) return;
    try {
      const customAgents = agents.slice(DEMO_AGENTS.length);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        customAgents,
        taskCount,
        messageCount,
        solSettled,
      }));
    } catch {}
  }, [agents, taskCount, messageCount, solSettled, hydrated]);

  const addAgent = useCallback((agent: OnChainAgent) => {
    setAgents(prev => [...prev, agent]);
    setMessageCount(prev => prev + Math.floor(Math.random() * 5) + 3);
  }, []);

  const incrementTasks = useCallback(() => {
    setTaskCount(prev => prev + 1);
  }, []);

  const incrementMessages = useCallback((n?: number) => {
    setMessageCount(prev => prev + (n || 1));
  }, []);

  const addSolSettled = useCallback((amount: number) => {
    setSolSettled(prev => Math.round((prev + amount) * 1000) / 1000);
  }, []);

  return (
    <AgentStoreContext.Provider value={{
      agents,
      addAgent,
      taskCount,
      messageCount,
      solSettled,
      incrementTasks,
      incrementMessages,
      addSolSettled,
    }}>
      {children}
    </AgentStoreContext.Provider>
  );
}

export function useAgentStore(): AgentStore {
  const ctx = useContext(AgentStoreContext);
  if (!ctx) {
    // Fallback for pages that aren't wrapped in provider (shouldn't happen, but safe)
    return {
      agents: DEMO_AGENTS,
      addAgent: () => {},
      taskCount: 1847,
      messageCount: 5231,
      solSettled: 142.8,
      incrementTasks: () => {},
      incrementMessages: () => {},
      addSolSettled: () => {},
    };
  }
  return ctx;
}
