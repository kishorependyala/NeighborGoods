import { useEffect, useState } from 'react';
import { Community, getMyTrades, getTradeMatches, proposeTrade, Trade, TradeMatch, User } from '../api';
import { S, statusPill, subheading, mutedText } from '../theme';

type Props = {
  community: Community;
  user: User;
};

const typeEmoji: Record<TradeMatch['type'], string> = {
  '2way': '🔄',
  '3way': '🔁',
  '4way': '♻️',
};

export default function TradesTab({ community, user }: Props) {
  const [matches, setMatches] = useState<TradeMatch[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [matchData, tradeData] = await Promise.all([
        getTradeMatches(community.id, user.phone),
        getMyTrades(user.phone),
      ]);
      setMatches(matchData);
      setTrades(tradeData.filter(trade => trade.communityId === community.id));
    } catch (err: any) {
      setError(err.message || 'Unable to load trades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [community.id, user.phone]);

  const handlePropose = async (match: TradeMatch) => {
    try {
      await proposeTrade(user.phone, match.participants, match.itemChain, match.type);
      setSuccess('Trade proposed.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to propose trade');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h3 style={subheading}>Trade matches</h3>
            <p style={mutedText}>Cycle matching for 2-way, 3-way, and 4-way swaps.</p>
          </div>
          <button onClick={load} style={S.smallOutlineBtn}>Refresh</button>
        </div>
        {error && <div style={{ ...S.errorBox, marginTop: '0.8rem' }}>{error}</div>}
        {success && <div style={{ ...S.successBox, marginTop: '0.8rem' }}>{success}</div>}
      </div>

      {loading ? (
        <div style={S.card}>Loading trades...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {matches.length ? matches.map((match, index) => (
              <div key={`${match.participants.join('-')}-${index}`} style={{ ...S.card, display: 'grid', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#78350f' }}>{typeEmoji[match.type]} {match.type.replace('way', '-way')}</strong>
                  <span style={statusPill('proposed')}>match ready</span>
                </div>
                <div style={{ color: '#92400e', fontWeight: 600 }}>
                  {match.participantNames.join(' → ')}
                </div>
                <div style={mutedText}>
                  {match.itemTitles.join(' → ')}
                </div>
                <button onClick={() => handlePropose(match)} style={{ ...S.smallBtn, justifySelf: 'start' }}>
                  Propose Trade
                </button>
              </div>
            )) : <div style={S.card}>No trade cycles found yet. More interests will unlock more matches.</div>}
          </div>

          <div style={S.card}>
            <h3 style={subheading}>My Active Trades</h3>
            <div style={{ display: 'grid', gap: '0.85rem', marginTop: '0.85rem' }}>
              {trades.length ? trades.map(trade => (
                <div key={trade.id} style={{ border: '1px solid #fed7aa', borderRadius: '0.8rem', padding: '0.85rem', display: 'grid', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#78350f' }}>{typeEmoji[trade.type]} {trade.type.replace('way', '-way')}</strong>
                    <span style={statusPill(trade.status)}>{trade.status}</span>
                  </div>
                  <div style={{ color: '#92400e', fontWeight: 600 }}>{trade.participantNames.join(' → ')}</div>
                  <div style={mutedText}>{trade.itemTitles.join(' → ')}</div>
                </div>
              )) : <div style={mutedText}>No active trades for this community yet.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
