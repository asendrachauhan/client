import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useRouter } from 'next/router';

interface Feed {
  _id: string;
  url: string;
  name: string;
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function FeedsPage() {
  const router = useRouter();
  const { data: feeds, mutate } = useSWR<Feed[]>(`${process.env.NEXT_PUBLIC_API_URL}feeds`, fetcher);
  const safeFeeds = Array.isArray(feeds) ? feeds : [];
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}feeds`, { url, name });
      setUrl('');
      setName('');
      setMessage('✅ Feed added!');
      mutate();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.error || 'Error adding feed');
      } else {
        setMessage('Error adding feed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeed = async (id: string) => {
    if (!window.confirm('Delete this feed?')) return;
    setLoading(true);
    setMessage('');
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}feeds/${id}`);
      setMessage('🗑️ Feed deleted!');
      mutate();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data?.error || 'Error deleting feed');
      } else {
        setMessage('Error deleting feed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 700,
      margin: '2rem auto',
      padding: 24,
      border: '1px solid #ddd',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <button
        onClick={() => router.push('/')}
        style={{
          marginBottom: 24,
          padding: '8px 16px',
          background: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        ⬅️ Back to Import Logs
      </button>

      <h1 style={{ marginBottom: 16 }}>Manage Feeds</h1>

      <form onSubmit={handleAddFeed} style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Feed Name"
          style={{ width: 200, marginRight: 8, padding: 8 }}
          required
        />
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Feed URL"
          style={{ width: 300, marginRight: 8, padding: 8 }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Adding...' : 'Add Feed'}
        </button>
      </form>

      {message && <div style={{ marginBottom: 16, color: '#0070f3' }}>{message}</div>}

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        boxShadow: '0 0 4px rgba(0,0,0,0.05)'
      }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>URL</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {safeFeeds.map(feed => (
            <tr key={feed._id}>
              <td style={tdStyle}>{feed.name}</td>
              <td style={{ ...tdStyle, maxWidth: 300, wordBreak: 'break-all' }}>{feed.url}</td>
              <td style={tdStyle}>
                <button
                  onClick={() => handleDeleteFeed(feed._id)}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </td>
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
