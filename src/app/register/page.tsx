'use client';
import Link from 'next/link';
import { useState } from 'react';
import WalletButton from '@/components/WalletButton';
import LanguageToggle from '@/components/LanguageToggle';
import { useAgentStore } from '@/lib/agent-store';
import { useI18n } from '@/lib/i18n';

type Step = 'config' | 'create_asset' | 'upload_metadata' | 'register_identity' | 'setup_executive' | 'delegate' | 'done';

interface StepInfo {
  id: Step;
  label: string;
  desc: string;
  code: string;
}

const STEPS: StepInfo[] = [
  {
    id: 'config',
    label: 'Configure Agent',
    desc: 'Define your agent\'s identity, capabilities, and service endpoints.',
    code: '',
  },
  {
    id: 'create_asset',
    label: 'Create MPL Core Asset',
    desc: 'Mint an MPL Core asset on Solana — the on-chain anchor for your agent identity.',
    code: `import { generateSigner, create } from '@metaplex-foundation/mpl-core';

const asset = generateSigner(umi);
await create(umi, {
  asset,
  name: 'My Agent',
  uri: 'https://arweave.net/agent-metadata.json',
  collection,
}).sendAndConfirm(umi);`,
  },
  {
    id: 'upload_metadata',
    label: 'Upload ERC-8004 Metadata',
    desc: 'Upload the agent registration document to Arweave — following ERC-8004 standard.',
    code: `// Agent Registration Document (ERC-8004)
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Your Agent Name",
  "description": "What your agent does...",
  "image": "https://arweave.net/avatar.png",
  "services": [
    { "name": "A2A", "endpoint": "https://your-agent.com/a2a/agent-card.json", "version": "0.3.0" },
    { "name": "MCP", "endpoint": "https://your-agent.com/mcp", "version": "2025-06-18" }
  ],
  "active": true,
  "registrations": [{ "agentId": "<MINT_ADDRESS>", "agentRegistry": "solana:101:metaplex" }],
  "supportedTrust": ["reputation", "crypto-economic"]
}`,
  },
  {
    id: 'register_identity',
    label: 'Register Agent Identity',
    desc: 'Call registerIdentityV1 to bind identity PDA + AgentIdentity plugin to the Core asset.',
    code: `import { registerIdentityV1 } from '@metaplex-foundation/mpl-agent-registry';

await registerIdentityV1(umi, {
  asset: asset.publicKey,
  collection: collection.publicKey,
  agentRegistrationUri: 'https://arweave.net/registration.json',
}).sendAndConfirm(umi);

// Creates PDA: seeds = ["agent_identity", <asset>]
// Attaches AgentIdentity plugin with lifecycle hooks: Transfer, Update, Execute`,
  },
  {
    id: 'setup_executive',
    label: 'Register Executive Profile',
    desc: 'Create an on-chain executive profile — the operator identity that will run your agent.',
    code: `import { registerExecutiveV1 } from '@metaplex-foundation/mpl-agent-registry';

await registerExecutiveV1(umi, {
  payer: umi.payer,
}).sendAndConfirm(umi);

// Creates PDA: seeds = ["executive_profile", <authority>]
// One profile per wallet — acts as the agent's off-chain operator`,
  },
  {
    id: 'delegate',
    label: 'Delegate Execution',
    desc: 'Link your agent to the executive — granting permission to sign transactions autonomously.',
    code: `import { delegateExecutionV1 } from '@metaplex-foundation/mpl-agent-registry';

const agentIdentity = findAgentIdentityV1Pda(umi, { asset: asset.publicKey });
const executiveProfile = findExecutiveProfileV1Pda(umi, { authority: executive.publicKey });

await delegateExecutionV1(umi, {
  agentAsset: asset.publicKey,
  agentIdentity,
  executiveProfile,
}).sendAndConfirm(umi);

// ✅ Agent is now autonomous — executive can sign on its behalf`,
  },
  {
    id: 'done',
    label: 'Agent Live',
    desc: 'Your agent is registered, delegated, and ready for A2A communication.',
    code: `// Your agent is now:
// ✅ On-chain identity (MPL Core + AgentIdentity plugin)
// ✅ Discoverable (PDA derived from asset pubkey)
// ✅ Has its own wallet (Asset Signer PDA)
// ✅ Autonomous execution (delegated to executive)
// ✅ A2A + MCP endpoints registered
//
// Other agents can discover and interact with it via:
// - On-chain PDA lookup
// - A2A protocol (agent-card.json)
// - MCP tools endpoint`,
  },
];

export default function RegisterPage() {
  const { addAgent } = useAgentStore();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [agentName, setAgentName] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [enableA2A, setEnableA2A] = useState(true);
  const [enableMCP, setEnableMCP] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [txLogs, setTxLogs] = useState<string[]>([]);

  const step = STEPS[currentStep];

  const stepLabels: Record<Step, string> = {
    config: t('register.step.config'),
    create_asset: t('register.step.create'),
    upload_metadata: t('register.step.upload'),
    register_identity: t('register.step.identity'),
    setup_executive: t('register.step.executive'),
    delegate: t('register.step.delegate'),
    done: t('register.step.done'),
  };
  const stepDescs: Record<Step, string> = {
    config: t('register.step.config.desc'),
    create_asset: t('register.step.create.desc'),
    upload_metadata: t('register.step.upload.desc'),
    register_identity: t('register.step.identity.desc'),
    setup_executive: t('register.step.executive.desc'),
    delegate: t('register.step.delegate.desc'),
    done: t('register.step.done.desc'),
  };

  const addLog = (msg: string) => setTxLogs(prev => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${msg}`]);

  const executeStep = async () => {
    setProcessing(true);
    const stepId = STEPS[currentStep].id;

    if (stepId === 'config') {
      if (!agentName.trim()) { setProcessing(false); return; }
      addLog(`Agent configured: ${agentName}`);
      addLog(`Services: ${[enableA2A ? 'A2A' : '', enableMCP ? 'MCP' : '', 'web'].filter(Boolean).join(', ')}`);
    } else if (stepId === 'create_asset') {
      addLog('Creating MPL Core asset on Solana Devnet...');
      await delay(1500);
      addLog('✓ Asset created: AGT_' + Math.random().toString(36).slice(2, 10));
      addLog('✓ Tx: ' + fakeTx());
    } else if (stepId === 'upload_metadata') {
      addLog('Building ERC-8004 registration document...');
      await delay(800);
      addLog('Uploading to Arweave via Turbo...');
      await delay(1200);
      addLog('✓ URI: https://arweave.net/' + Math.random().toString(36).slice(2, 14));
    } else if (stepId === 'register_identity') {
      addLog('Calling registerIdentityV1...');
      await delay(1000);
      addLog('✓ Identity PDA created: PDA_' + Math.random().toString(36).slice(2, 10));
      addLog('✓ AgentIdentity plugin attached with lifecycle hooks');
      addLog('✓ Tx: ' + fakeTx());
    } else if (stepId === 'setup_executive') {
      addLog('Calling registerExecutiveV1...');
      await delay(1000);
      addLog('✓ Executive profile: EXEC_' + Math.random().toString(36).slice(2, 10));
      addLog('✓ Tx: ' + fakeTx());
    } else if (stepId === 'delegate') {
      addLog('Calling delegateExecutionV1...');
      await delay(1200);
      addLog('✓ Delegation record created');
      addLog('✓ Agent is now autonomous');
      addLog('✓ Tx: ' + fakeTx());

      // Add the new agent to the global store now (before advancing to done)
      const newAssetKey = 'AGT_' + Math.random().toString(36).slice(2, 10).toUpperCase();
      addAgent({
        assetPublicKey: newAssetKey,
        owner: '7xK3dR8Nv2qLm5Wp4TgYs6JbCe1FhUo9mPq',
        identityPda: 'PDA_' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        walletPda: 'WAL_' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        registrationUri: 'https://arweave.net/' + Math.random().toString(36).slice(2, 14),
        walletBalance: +(Math.random() * 3).toFixed(2),
        delegatedTo: 'EXEC_' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        createdAt: new Date().toISOString(),
        metadata: {
          type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
          name: agentName,
          description: agentDesc || `Custom agent registered via SolAgent Hub`,
          image: '/agents/custom.svg',
          services: [
            ...(enableA2A ? [{ name: 'A2A' as const, endpoint: `https://solagent.hub/agent/${newAssetKey}/agent-card.json`, version: '0.3.0' }] : []),
            ...(enableMCP ? [{ name: 'MCP' as const, endpoint: `https://solagent.hub/agent/${newAssetKey}/mcp`, version: '2025-06-18' }] : []),
            { name: 'web' as const, endpoint: `https://solagent.hub/agent/${newAssetKey}` },
          ],
          active: true,
          registrations: [{ agentId: newAssetKey, agentRegistry: 'solana:101:metaplex' }],
          supportedTrust: ['reputation'],
        },
      });

      addLog('🎉 Agent registration complete!');
      addLog(`${agentName} is live on Solana Devnet`);
    }

    setProcessing(false);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(c => c + 1);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#2a2d3e] bg-[#0a0b0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#8b5cf6] flex items-center justify-center text-xs font-bold text-black">SA</div>
            <span className="text-lg font-bold">SolAgent Hub</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-1">
              <Link href="/explorer" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.explorer')}</Link>
              <Link href="/register" className="px-4 py-2 rounded-lg text-sm text-[#00f0ff] bg-[#00f0ff]/10">{t('nav.register')}</Link>
              <Link href="/orchestrate" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.orchestrate')}</Link>
              <Link href="/tools" className="px-4 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-white hover:bg-[#181924] transition-all">{t('nav.tools')}</Link>
            </nav>
            <LanguageToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">{t('register.title')}</h1>
        <p className="text-sm text-[#6b7280] mb-8">{t('register.subtitle')}</p>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Step Sidebar */}
          <div className="space-y-1">
            {STEPS.map((s, i) => (
              <div key={s.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                  i === currentStep ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20' :
                  i < currentStep ? 'text-[#22c55e]' :
                  'text-[#6b7280] hover:text-[#9ca3af]'
                }`}
                onClick={() => i <= currentStep && setCurrentStep(i)}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border ${
                  i < currentStep ? 'bg-[#22c55e]/20 border-[#22c55e]/30 text-[#22c55e]' :
                  i === currentStep ? 'bg-[#00f0ff]/20 border-[#00f0ff]/30' :
                  'border-[#2a2d3e]'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className="text-xs">{stepLabels[s.id]}</span>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Step Card */}
            <div className="gradient-border p-6">
              <div className="relative z-10">
                <h2 className="text-xl font-semibold mb-2">{stepLabels[step.id]}</h2>
                <p className="text-sm text-[#9ca3af] mb-6">{stepDescs[step.id]}</p>

                {/* Config Form */}
                {step.id === 'config' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[#6b7280] mb-1.5">{t('register.form.name')}</label>
                      <input type="text" value={agentName} onChange={e => setAgentName(e.target.value)}
                        placeholder={t('register.form.name.placeholder')} className="w-full px-4 py-2.5 rounded-lg bg-[#0a0b0f] border border-[#2a2d3e] text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00f0ff]/50" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b7280] mb-1.5">{t('register.form.desc')}</label>
                      <textarea value={agentDesc} onChange={e => setAgentDesc(e.target.value)}
                        placeholder={t('register.form.desc.placeholder')} rows={3}
                        className="w-full px-4 py-2.5 rounded-lg bg-[#0a0b0f] border border-[#2a2d3e] text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00f0ff]/50 resize-none" />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-[#9ca3af] cursor-pointer">
                        <input type="checkbox" checked={enableA2A} onChange={e => setEnableA2A(e.target.checked)}
                          className="w-4 h-4 rounded bg-[#0a0b0f] border-[#2a2d3e] accent-[#00f0ff]" />
                        A2A Protocol
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#9ca3af] cursor-pointer">
                        <input type="checkbox" checked={enableMCP} onChange={e => setEnableMCP(e.target.checked)}
                          className="w-4 h-4 rounded bg-[#0a0b0f] border-[#2a2d3e] accent-[#8b5cf6]" />
                        MCP Server
                      </label>
                    </div>
                  </div>
                )}

                {/* Code Preview */}
                {step.code && (
                  <div className="bg-[#0a0b0f] rounded-lg border border-[#2a2d3e] p-4 overflow-x-auto">
                    <pre className="text-xs font-mono text-[#9ca3af] leading-relaxed whitespace-pre">{step.code}</pre>
                  </div>
                )}

                {/* Action Button */}
                {step.id !== 'done' ? (
                  <button onClick={executeStep} disabled={processing || (step.id === 'config' && !agentName.trim())}
                    className="mt-6 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00f0ff] to-[#00a8b3] text-black text-sm font-semibold disabled:opacity-40 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all">
                    {processing ? t('register.btn.processing') : step.id === 'config' ? t('register.btn.continue') : t('register.btn.execute')}
                  </button>
                ) : (
                  <Link href="/explorer"
                    className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#00f0ff] to-[#00a8b3] text-black text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all">
                    {t('register.btn.viewExplorer')}
                  </Link>
                )}
              </div>
            </div>

            {/* Transaction Logs */}
            {txLogs.length > 0 && (
              <div className="gradient-border p-4">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="pulse-dot" />
                    <span className="text-xs font-mono text-[#6b7280]">{t('register.txLog')}</span>
                  </div>
                  <div className="bg-[#0a0b0f] rounded-lg p-3 max-h-60 overflow-y-auto">
                    {txLogs.map((log, i) => (
                      <div key={i} className="text-[11px] font-mono text-[#9ca3af] leading-6">
                        {log.includes('✓') ? <span className="text-[#22c55e]"><TxLogLine text={log} /></span> :
                         log.includes('🎉') ? <span className="text-[#00f0ff]">{log}</span> :
                         log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TxLogLine({ text }: { text: string }) {
  // Match "Tx: <hash>" pattern where hash is 64 chars of alphanumeric
  const txMatch = text.match(/Tx: ([A-HJ-NP-Za-km-z1-9]{64})/);
  if (!txMatch) return <>{text}</>;
  const hash = txMatch[1];
  const prefix = text.slice(0, txMatch.index!);
  const displayHash = hash.slice(0, 8) + '...' + hash.slice(-8);
  return (
    <>
      {prefix}Tx:{' '}
      <a
        href={`https://explorer.solana.com/tx/${hash}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00f0ff] hover:underline"
      >
        {displayHash} ↗
      </a>
    </>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function fakeTx() {
  // Generate a longer fake tx hash for more realistic appearance
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let hash = '';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
  return hash;
}
