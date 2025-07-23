import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';

interface Feed {
  _id: string;
  url: string;
  name: string;
}

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function FeedsPage() {
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
      setMessage('Feed added!');
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
      setMessage('Feed deleted!');
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
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24 }}>
      <h1>Manage Feeds</h1>
      <form onSubmit={handleAddFeed} style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Feed Name"
          style={{ width: 200, marginRight: 8 }}
          required
        />
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Feed URL"
          style={{ width: 300, marginRight: 8 }}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Feed'}
        </button>
      </form>
      {message && <div style={{ marginBottom: 16 }}>{message}</div>}
      <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {safeFeeds.map(feed => (
            <tr key={feed._id}>
              <td>{feed.name}</td>
              <td style={{ maxWidth: 300, wordBreak: 'break-all' }}>{feed.url}</td>
              <td>
                <button onClick={() => handleDeleteFeed(feed._id)} disabled={loading}>
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