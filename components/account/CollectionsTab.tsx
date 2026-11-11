import React, { useState, useEffect } from 'react';
import { FolderHeart, Plus, Trash2, Film, Play, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collectionService } from '../../services/collectionService';
import { movieService } from '../../services/movieService';
import { UserCustomCollection, Movie } from '../../types/movie';
import { Button } from '../ui/Button';
import { MovieCard } from '../movie/MovieCard';
import { useToast } from '../ui/Toast';

export const CollectionsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [collections, setCollections] = useState<UserCustomCollection[]>([]);
  const [selectedColId, setSelectedColId] = useState<string>('');
  const [newColName, setNewColName] = useState('');
  const [newColIcon, setNewColIcon] = useState('🎬');

  const loadCollections = () => {
    const cols = collectionService.getUserCollections(userId);
    setCollections(cols);
    if (!selectedColId && cols.length > 0) {
      setSelectedColId(cols[0].id);
    }
  };

  useEffect(() => {
    loadCollections();
  }, [userId]);

  const selectedCol = collections.find((c) => c.id === selectedColId);

  const colMovies: Movie[] = (selectedCol?.movieIds || [])
    .map((id) => movieService.getMovieById(id))
    .filter((m): m is Movie => !!m);

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const created = collectionService.createCollection(userId, newColName.trim(), newColIcon);
    setNewColName('');
    loadCollections();
    setSelectedColId(created.id);
    showToast(`کۆکراوەی نوێی «${created.name}» دروستکرا!`, 'success');
  };

  const handleDeleteCollection = (colId: string, colName: string) => {
    if (!confirm(`ئایا دڵنیایت دەتەوێت کۆکراوەی «${colName}» بسڕیتەوە؟`)) return;
    collectionService.deleteCollection(colId);
    loadCollections();
    const remaining = collections.filter((c) => c.id !== colId);
    if (remaining.length > 0) {
      setSelectedColId(remaining[0].id);
    }
    showToast('کۆکراوەکە سڕایەوە', 'info');
  };

  const handleRemoveMovieFromCol = (movieId: string) => {
    if (!selectedCol) return;
    collectionService.toggleMovieInCollection(selectedCol.id, movieId);
    loadCollections();
    showToast('فیلمەکە لەم کۆکراوەیە لابرا', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Header & Collection Creator */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderHeart size={20} color="#ec4899" /> کۆکراوە و پۆلێنە تایبەتەکانی من
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            فۆڵدەری تایبەت بۆ فیلمەکان دروست بکە (وەک: فیلمەکانی شەو، کۆمیدیا، دڵخوازەکان)
          </p>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleCreateCollection} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={newColIcon}
            onChange={(e) => setNewColIcon(e.target.value)}
            style={{
              padding: '8px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '15px'
            }}
          >
            <option value="🎬">🎬</option>
            <option value="😂">😂</option>
            <option value="🔥">🔥</option>
            <option value="👻">👻</option>
            <option value="❤️">❤️</option>
            <option value="🌙">🌙</option>
            <option value="🍿">🍿</option>
          </select>
          <input
            type="text"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            placeholder="ناوی کۆکراوەی نوێ..."
            style={{
              padding: '8px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '13px',
              width: '180px'
            }}
          />
          <Button type="submit" variant="silver" size="sm" icon={<Plus size={15} />}>
            دروستکردن
          </Button>
        </form>
      </div>

      {/* Collection Folders Selector */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
        {collections.map((col) => {
          const isSelected = col.id === selectedColId;
          return (
            <button
              key={col.id}
              onClick={() => setSelectedColId(col.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.5)' : 'var(--border-subtle)'}`,
                color: isSelected ? '#38bdf8' : 'var(--text-silver)',
                fontSize: '13.5px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{col.icon || '📁'}</span>
              <span>{col.name}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#38bdf8' : 'var(--text-muted)'
                }}
              >
                {col.movieIds.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Collection View */}
      {selectedCol && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{selectedCol.icon}</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                {selectedCol.name}
              </h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ({colMovies.length} فیلم لەم کۆکراوەیەدا هەیە)
              </span>
            </div>

            <button
              onClick={() => handleDeleteCollection(selectedCol.id, selectedCol.name)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} /> سڕینەوەی ئەم فۆڵدەرە
            </button>
          </div>

          {colMovies.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <Film size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h5 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                هیچ فیلمێک لەم کۆکراوەیەدا نییە
              </h5>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                دەتوانیت لە پەڕەی هەر فیلمێک دوگمەی «کۆکراوەکان» دابگریت و زیادی بکەیت بۆ ئێرە.
              </p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                گەڕان بەناو کەتەلۆگی فیلمەکان
              </Button>
            </div>
          ) : (
            <div className="movie-grid">
              {colMovies.map((m) => (
                <div key={m.id} style={{ position: 'relative' }}>
                  <MovieCard movie={m} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMovieFromCol(m.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      zIndex: 10,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="لابردن لەم کۆکراوەیە"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
