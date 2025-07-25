import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/router';

interface Log {
  _id: string;
  timestamp: string;
  feedUrl: string;
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: { job: Record<string, unknown>; reason: string }[];
}

interface Feed {
  _id: string;
  url: string;
  name: string;
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function ImportLogsPage() {
  const router = useRouter();
  const { data: logs, mutate } = useSWR<Log[]>(`${process.env.NEXT_PUBLIC_API_URL}import/logs`, fetcher);
  const { data: feeds } = useSWR<Feed[]>(`${process.env.NEXT_PUBLIC_API_URL}feeds`, fetcher);
  const safeFeeds = Array.isArray(feeds) ? feeds : [];
  const [selectedFeed, setSelectedFeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Real-time log updates
  useEffect(() => {
    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}`);
    socket.on('importLogUpdate', () => {
      mutate();
    });
    return () => {
      socket.disconnect();
    };
  }, [mutate]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeed) return;
    setLoading(true);
    setMessage('');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}import`, { feedUrl: selectedFeed });
      setMessage('Import started!');
      mutate();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.error || 'Error starting import');
      } else {
        setMessage('Error starting import');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 1000,
      margin: '2rem auto',
      padding: 32,
      border: '1px solid #ddd',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: 16 }}>📥 Import Logs</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <form onSubmit={handleImport} style={{ display: 'flex', alignItems: 'center' }}>
          <select
            value={selectedFeed}
            onChange={e => setSelectedFeed(e.target.value)}
            style={{ padding: 8, minWidth: 300, marginRight: 12 }}
            required
          >
            <option value="">Select Feed</option>
            {safeFeeds.map(feed => (
              <option key={feed._id} value={feed.url}>
                {feed.name} ({feed.url})
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading || !selectedFeed} style={{ padding: '8px 16px', marginRight: 12 }}>
            {loading ? 'Importing...' : 'Import Jobs'}
          </button>
        </form>

        <button
          onClick={() => router.push('/feeds')}
          style={{
            padding: '8px 16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ➕ Add Feed
        </button>
      </div>

      {message && <div style={{ marginBottom: 16, color: '#0070f3' }}>{message}</div>}

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        boxShadow: '0 0 4px rgba(0,0,0,0.05)'
      }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={thStyle}>Timestamp</th>
            <th style={thStyle}>Feed URL</th>
            <th style={thStyle}>Total Fetched</th>
            <th style={thStyle}>Total Imported</th>
            <th style={thStyle}>New Jobs</th>
            <th style={thStyle}>Updated Jobs</th>
            <th style={thStyle}>Failed Jobs</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map((log) => (
            <tr key={log._id}>
              <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
              <td style={{ ...tdStyle, maxWidth: 200, wordBreak: 'break-all' }}>{log.feedUrl}</td>
              <td style={tdStyle}>{log.totalFetched}</td>
              <td style={tdStyle}>{log.totalImported}</td>
              <td style={tdStyle}>{log.newJobs}</td>
              <td style={tdStyle}>{log.updatedJobs}</td>
              <td style={tdStyle}>{log.failedJobs?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: 12,
  borderBottom: '2px solid #ddd'
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: '1px solid #eee'
};
