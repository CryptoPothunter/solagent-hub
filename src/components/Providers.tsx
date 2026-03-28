'use client';
import { AgentStoreProvider } from '@/lib/agent-store';
import { I18nProvider } from '@/lib/i18n';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AgentStoreProvider>{children}</AgentStoreProvider>
    </I18nProvider>
  );
}
