'use client';

import { useEffect, useState } from 'react';

type Health = {
  ok: boolean;
  node: string;
  env: Record<string, any>;
  prisma: string;
  prismaError?: string;
  timestamps: { now: string };
};

type LinkSummary = {
  ok: number; bad: number;
  byHost: Record<string, { ok: number; bad: number }>;
};

export default function HealthPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [links, setLinks] = useState<{ summary: LinkSummary } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const h = await fetch('/api/health').then(r => r.json());
        const l = await fetch('/api/link-checks?limit=200&days=30').then(r => r.json());
        setHealth(h);
        setLinks(l);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return (
    <div className="p-8 text-gray-700">Loading health…</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">System Health</h1>

        {/* Core status */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card title="Server">
            <KV k="Node" v={health?.node} />
            <KV k="OK" v={String(health?.ok)} />
            <KV k="Prisma" v={health?.prisma} danger={health?.prisma !== 'ok'} />
            {health?.prismaError && <KV k="Prisma Error" v={health.prismaError} danger />}
          </Card>
          <Card title="Environment">
            <KV k="NODE_ENV" v={String(health?.env?.NODE_ENV)} />
            <KV k="DATABASE_URL set" v={String(health?.env?.DATABASE_URL)} />
            <KV k="LOCAL_EVENTS_API_URL" v={String(health?.env?.LOCAL_EVENTS_API_URL)} />
          </Card>
          <Card title="Timestamps">
            <KV k="Now" v={new Date(health?.timestamps?.now || '').toLocaleString()} />
          </Card>
        </div>

        {/* Link summary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Link Checks (30 days)</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Summary">
              <KV k="OK" v={String(links?.summary?.ok || 0)} />
              <KV k="Broken" v={String(links?.summary?.bad || 0)} danger={Boolean(links?.summary?.bad)} />
            </Card>
            <Card title="Top Hosts">
              <div className="space-y-2 max-h-64 overflow-auto">
                {Object.entries(links?.summary?.byHost || {}).map(([host, s]) => (
                  <div key={host} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{host}</span>
                    <span className="text-gray-500">OK {s.ok} • Bad {s.bad}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="How to Run Checks">
              <p className="text-sm text-gray-600">Run locally:</p>
              <pre className="bg-gray-100 text-xs p-2 rounded mt-2">npm run links:check</pre>
              <p className="text-xs text-gray-500 mt-2">Env:
                <br/>LINKCHECK_LIMIT=100
                <br/>LINKCHECK_DAYS=30
              </p>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="font-semibold mb-2">{title}</div>
      <div>{children}</div>
    </div>
  );
}

function KV({ k, v, danger }: { k: string; v?: string; danger?: boolean }) {
  return (
    <div className="flex justify-between text-sm border-b py-1">
      <span className="text-gray-600">{k}</span>
      <span className={danger ? 'text-red-600 font-medium' : 'text-gray-900'}>{v ?? '-'}</span>
    </div>
  );
}

