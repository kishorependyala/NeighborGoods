import { useEffect, useMemo, useState } from 'react';
import {
  addItem,
  Community,
  deleteItem,
  expressInterest,
  getCommunityItems,
  Item,
  removeInterest,
  searchBooks,
  updateItemStatus,
  User,
  BookResult,
} from '../api';
import { S, statusPill, subheading, mutedText } from '../theme';

const categoryMeta: Record<Item['category'], { emoji: string; label: string }> = {
  books: { emoji: '📚', label: 'Books' },
  toys: { emoji: '🧸', label: 'Toys' },
  games: { emoji: '🎲', label: 'Games' },
  bikes: { emoji: '🚲', label: 'Bikes' },
  other: { emoji: '📦', label: 'Other' },
};

type Props = {
  community: Community;
  user: User;
};

export default function ItemsTab({ community, user }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [form, setForm] = useState({
    category: 'books' as Item['category'],
    title: '',
    description: '',
    tokenValue: '15',
    imageUrl: '',
    googleBookId: '',
  });

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCommunityItems(community.id, user.phone);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [community.id, user.phone]);

  const myItems = useMemo(() => items.filter(item => item.userId === user.id), [items, user.id]);

  const handleInterest = async (item: Item) => {
    setError('');
    setSuccess('');
    try {
      if (item.myInterest && item.myInterestId) {
        await removeInterest(item.myInterestId, user.phone);
        setSuccess('Interest removed.');
      } else {
        await expressInterest(user.phone, item.id);
        setSuccess('Interest saved.');
      }
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Unable to update interest');
    }
  };

  const handleStatusChange = async (item: Item, status: Item['status']) => {
    try {
      await updateItemStatus(item.id, user.phone, status);
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Unable to update item');
    }
  };

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`Delete ${item.title}?`)) return;
    try {
      await deleteItem(item.id, user.phone);
      setSuccess('Item deleted.');
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Unable to delete item');
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    try {
      await addItem({
        phone: user.phone,
        communityId: community.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        tokenValue: Number(form.tokenValue || 0),
        imageUrl: form.imageUrl || undefined,
        googleBookId: form.googleBookId || undefined,
      });
      setForm({ category: 'books', title: '', description: '', tokenValue: '15', imageUrl: '', googleBookId: '' });
      setShowForm(false);
      setSuccess('Item added.');
      await loadItems();
    } catch (err: any) {
      setError(err.message || 'Unable to add item');
    }
  };

  const handleBookSearch = async () => {
    if (!bookQuery.trim()) return;
    setBookLoading(true);
    try {
      setBookResults(await searchBooks(bookQuery.trim()));
    } catch (err: any) {
      setError(err.message || 'Unable to search books');
    } finally {
      setBookLoading(false);
    }
  };

  const applyBook = (book: BookResult) => {
    setForm(prev => ({
      ...prev,
      title: book.title,
      description: book.description || prev.description,
      imageUrl: book.imageUrl || '',
      googleBookId: book.id,
      tokenValue: String(book.suggestedTokens ?? 10),
    }));
    setBookModalOpen(false);
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h3 style={subheading}>Items in {community.name}</h3>
            <p style={mutedText}>{items.length} listed • {myItems.length} belong to you</p>
          </div>
          <button onClick={() => setShowForm(prev => !prev)} style={S.smallBtn}>
            {showForm ? 'Close' : '＋ Add item'}
          </button>
        </div>

        {error && <div style={{ ...S.errorBox, marginTop: '0.9rem' }}>{error}</div>}
        {success && <div style={{ ...S.successBox, marginTop: '0.9rem' }}>{success}</div>}

        {showForm && (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.8rem' }}>
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              <label style={S.label}>Category</label>
              <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value as Item['category'] }))} style={S.inp}>
                {Object.entries(categoryMeta).map(([value, meta]) => (
                  <option key={value} value={value}>{meta.emoji} {meta.label}</option>
                ))}
              </select>
            </div>

            {form.category === 'books' && (
              <button onClick={() => setBookModalOpen(true)} style={{ ...S.smallOutlineBtn, justifySelf: 'start' }}>
                🔎 Search Google Books
              </button>
            )}

            <div style={S.fieldGroup}>
              <label style={S.label}>Title</label>
              <input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} style={S.inp} />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Description</label>
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} style={{ ...S.inp, minHeight: 90, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.8rem' }}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Token value</label>
                <input type="number" min={1} value={form.tokenValue} onChange={e => setForm(prev => ({ ...prev, tokenValue: e.target.value }))} style={S.inp} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Image URL (optional)</label>
                <input value={form.imageUrl} onChange={e => setForm(prev => ({ ...prev, imageUrl: e.target.value }))} style={S.inp} />
              </div>
            </div>
            <button onClick={handleSubmit} style={S.primaryBtn}>List Item</button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={S.card}>Loading items...</div>
      ) : items.length === 0 ? (
        <div style={S.card}>No items yet. Add the first one for this community.</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {items.map(item => {
            const mine = item.userId === user.id;
            const category = categoryMeta[item.category];
            return (
              <div key={item.id} style={{ ...S.card, display: 'grid', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: item.imageUrl ? '86px 1fr' : '1fr', gap: '1rem' }}>
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: 86, height: 120, objectFit: 'cover', borderRadius: '0.8rem', border: '1px solid #fde68a', background: '#fff' }}
                    />
                  )}
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ ...subheading, marginBottom: '0.2rem' }}>{item.title}</h3>
                        <p style={mutedText}>{item.ownerName || 'Unknown owner'}</p>
                      </div>
                      <span style={statusPill(item.status)}>{item.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 999, padding: '0.18rem 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: '#9a3412' }}>
                        {category.emoji} {category.label}
                      </span>
                      <span style={{ background: '#fef3c7', borderRadius: 999, padding: '0.18rem 0.6rem', fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                        🪙 {item.tokenValue}
                      </span>
                      <span style={mutedText}>💛 {item.interestCount || 0} interested</span>
                    </div>
                    {item.description && <p style={{ ...mutedText, lineHeight: 1.5 }}>{item.description}</p>}
                  </div>
                </div>

                {mine ? (
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={item.status} onChange={e => handleStatusChange(item, e.target.value as Item['status'])} style={{ ...S.inp, width: 160 }}>
                      <option value="available">available</option>
                      <option value="reserved">reserved</option>
                      <option value="traded">traded</option>
                    </select>
                    <button onClick={() => handleDelete(item)} style={S.smallOutlineBtn}>Delete</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => handleInterest(item)} style={item.myInterest ? S.smallOutlineBtn : S.smallBtn}>
                      {item.myInterest ? '✓ Interested' : 'I Want This! 💛'}
                    </button>
                    {item.myInterest && item.myInterestId && (
                      <button onClick={() => handleInterest(item)} style={S.linkBtn}>Remove</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {bookModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 120 }}>
          <div style={{ ...S.card, width: 'min(92vw, 560px)', maxHeight: '80vh', overflow: 'auto', display: 'grid', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={subheading}>Google Books search</h3>
              <button onClick={() => setBookModalOpen(false)} style={S.linkBtn}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <input value={bookQuery} onChange={e => setBookQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBookSearch()} style={S.inp} placeholder="Search title or author" />
              <button onClick={handleBookSearch} style={S.smallBtn}>Search</button>
            </div>
            {bookLoading ? (
              <div>Searching...</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {bookResults.map(book => (
                  <button
                    key={book.id}
                    onClick={() => applyBook(book)}
                    style={{
                      textAlign: 'left',
                      display: 'grid',
                      gridTemplateColumns: book.imageUrl ? '64px 1fr' : '1fr',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.8rem',
                      border: '1px solid #fed7aa',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {book.imageUrl && <img src={book.imageUrl} alt={book.title} style={{ width: 64, height: 92, objectFit: 'cover', borderRadius: '0.5rem' }} />}
                    <div style={{ display: 'grid', gap: '0.25rem' }}>
                      <strong style={{ color: '#78350f' }}>{book.title}</strong>
                      <span style={mutedText}>{book.authors?.join(', ') || 'Unknown author'}</span>
                      {book.description && <span style={{ ...mutedText, lineHeight: 1.4 }}>{book.description.slice(0, 140)}{book.description.length > 140 ? '…' : ''}</span>}
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                        🪙 {book.suggestedTokens ?? 10} tokens suggested
                      </span>
                    </div>
                  </button>
                ))}
                {!bookResults.length && <div style={mutedText}>Search to see book matches.</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
