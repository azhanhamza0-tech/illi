import React, { useState } from 'react';
import { Star, EyeOff, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { Review } from '../types/movie';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const initialReviews: Review[] = [
  {
    id: 'rev-1',
    movieId: 'm1',
    userId: 'user_2',
    userName: 'دەریا کوردی',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    rating: 9.8,
    comment: 'یەکێک لە ناوازەترین کارە سینەماییەکان، وەرگێڕان و کوالێتی وێنە لە پلاتفۆرمی ڕوانین بێ وێنەیە!',
    date: '٢ ڕۆژ لەمەوبەر',
    likes: 38,
    status: 'published'
  },
  {
    id: 'rev-2',
    movieId: 'm2',
    userId: 'user_3',
    userName: 'زانا سلێمانی',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    rating: 9.0,
    comment: 'کوالێتی 4K Ultra HD و دەنگی دەوروبەر بەڕاستی هەستێکی نایاب دەبەخشێت.',
    date: 'هەفتەیەک لەمەوبەر',
    likes: 19,
    status: 'published'
  },
  {
    id: 'rev-3',
    movieId: 'm3',
    userId: 'user_4',
    userName: 'سۆران ئەحمەد',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 6.5,
    comment: 'دەنگی وەرگێڕانەکە کەمێک دەنگی مۆسیقای فیلمەکەی شاردبووەوە بەڵام بە گشتی باش بوو.',
    date: '٣ ڕۆژ لەمەوبەر',
    likes: 4,
    status: 'published'
  }
];

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const { showToast } = useToast();

  const handleToggleHide = (id: string) => {
    setReviews(
      reviews.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === 'flagged' ? 'published' : 'flagged';
          showToast(`دۆخی هەڵسەنگاندن گۆڕدرا بۆ ${nextStatus === 'flagged' ? 'شاراوە' : 'بڵاوکراوە'}`, 'info');
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('دڵنیایت لە سڕینەوەی ئەم هەڵسەنگاندنە؟')) {
      setReviews(reviews.filter((r) => r.id !== id));
      showToast('هەڵسەنگاندنەکە سڕایەوە', 'success');
    }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
          هەڵسەنگاندن و سەرنجی بینەران (Reviews Moderation)
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          وردبینی و بەڕێوەبردنی سەرنجی بەکارهێنەران لەسەر فیلمەکان (پیشاندان، شاردنەوە، سڕینەوە).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
        {reviews.map((rev) => (
          <div
            key={rev.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              border: rev.status === 'flagged' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
              opacity: rev.status === 'flagged' ? 0.65 : 1
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={rev.userAvatar}
                  alt={rev.userName}
                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14.5px' }}>{rev.userName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rev.date}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FACC15', fontWeight: 700, fontSize: '13px' }}>
                  <Star size={14} fill="#FACC15" />
                  {rev.rating} / 10
                </span>

                <button
                  onClick={() => handleToggleHide(rev.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-silver)',
                    cursor: 'pointer'
                  }}
                  title={rev.status === 'flagged' ? 'پیشاندان' : 'شاردنەوە'}
                >
                  {rev.status === 'flagged' ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>

                <button
                  onClick={() => handleDelete(rev.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    cursor: 'pointer'
                  }}
                  title="سڕینەوە"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-silver)', lineHeight: 1.6, margin: 0 }}>
              "{rev.comment}"
            </p>

            {rev.status === 'flagged' && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>
                ⚠️ ئەم هەڵسەنگاندنە لە ماڵپەڕی گشتیدا شاردراوەتەوە.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
