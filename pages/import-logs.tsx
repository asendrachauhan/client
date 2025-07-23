import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

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
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24 }}>
      <h1>Import Logs</h1>
      <form onSubmit={handleImport} style={{ marginBottom: 24 }}>
        <select
          value={selectedFeed}
          onChange={e => setSelectedFeed(e.target.value)}
          style={{ width: 400, marginRight: 8 }}
          required
        >
          <option value="">Select Feed</option>
          {safeFeeds?.map(feed => (
            <option key={feed._id} value={feed.url}>
              {feed.name} ({feed.url})
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading || !selectedFeed}>
          {loading ? 'Importing...' : 'Import Jobs'}
        </button>
      </form>
      {message && <div style={{ marginBottom: 16 }}>{message}</div>}
      <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Feed URL</th>
            <th>Total Fetched</th>
            <th>Total Imported</th>
            <th>New Jobs</th>
            <th>Updated Jobs</th>
            <th>Failed Jobs</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map((log) => (
            <tr key={log._id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td style={{ maxWidth: 200, wordBreak: 'break-all' }}>{log.feedUrl}</td>
              <td>{log.totalFetched}</td>
              <td>{log.totalImported}</td>
              <td>{log.newJobs}</td>
              <td>{log.updatedJobs}</td>
              <td>{log.failedJobs?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 