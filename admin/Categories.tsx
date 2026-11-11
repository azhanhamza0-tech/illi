import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

interface CategoryItem {
  id: string;
  nameKurdish: string;
  nameEnglish: string;
  count: number;
}

const initialCategories: CategoryItem[] = [
  { id: 'cat-dubbed', nameKurdish: 'دۆبلاژکراوی کوردی (Kurdish Dubbed)', nameEnglish: 'Kurdish Dubbed', count: 18 },
  { id: 'cat-anime', nameKurdish: 'ئەنیمێ (Anime)', nameEnglish: 'Anime', count: 24 },
  { id: 'cat-series', nameKurdish: 'زنجیرەکان (TV Series)', nameEnglish: 'TV Series', count: 35 },
  { id: 'cat-1', nameKurdish: 'ئاکشن (Action)', nameEnglish: 'Action', count: 42 },
  { id: 'cat-2', nameKurdish: 'کۆمیدی (Comedy)', nameEnglish: 'Comedy', count: 28 },
  { id: 'cat-3', nameKurdish: 'ترسناک (Horror)', nameEnglish: 'Horror', count: 19 },
  { id: 'cat-4', nameKurdish: 'ڕۆمانسی (Romance)', nameEnglish: 'Romance', count: 23 },
  { id: 'cat-5', nameKurdish: 'دراما (Drama)', nameEnglish: 'Drama', count: 54 },
  { id: 'cat-6', nameKurdish: 'زانستی خەیاڵی (Sci-Fi)', nameEnglish: 'Sci-Fi', count: 18 },
  { id: 'cat-7', nameKurdish: 'ئەنیمەیشن (Animation)', nameEnglish: 'Animation', count: 31 },
  { id: 'cat-8', nameKurdish: 'سینەمای کوردی (Kurdish)', nameEnglish: 'Kurdish', count: 65 },
  { id: 'cat-9', nameKurdish: 'تورکی (Turkish)', nameEnglish: 'Turkish', count: 27 },
  { id: 'cat-10', nameKurdish: 'عەرەبی (Arabic)', nameEnglish: 'Arabic', count: 21 },
  { id: 'cat-11', nameKurdish: 'ئینگلیزی (English)', nameEnglish: 'English', count: 70 }
];

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [nameKurdish, setNameKurdish] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const { showToast } = useToast();

  const handleOpenAdd = () => {
    setEditingCat(null);
    setNameKurdish('');
    setNameEnglish('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setNameKurdish(cat.nameKurdish);
    setNameEnglish(cat.nameEnglish);
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`دڵنیایت لە سڕینەوەی هاوپۆلی "${name}"؟`)) {
      setCategories(categories.filter((c) => c.id !== id));
      showToast(`هاوپۆلی "${name}" سڕایەوە`, 'info');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKurdish.trim()) return;

    if (editingCat) {
      setCategories(
        categories.map((c) =>
          c.id === editingCat.id ? { ...c, nameKurdish, nameEnglish } : c
        )
      );
      showToast('هاوپۆل نوێکرایەوە', 'success');
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        nameKurdish,
        nameEnglish: nameEnglish || nameKurdish,
        count: 0
      };
      setCategories([...categories, newCat]);
      showToast('هاوپۆلی نوێ زیادکرا', 'success');
    }

    setModalOpen(false);
  };

  return (
    <div style={{ padding: '32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>
            هاوپۆلەکان و ژانەرەکان (Categories)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            بەڕێوەبردن و زیادکردنی هاوپۆلەکان بۆ فیلم و بەشەکانی ڕوانین.
          </p>
        </div>

        <Button variant="silver" icon={<Plus size={18} />} onClick={handleOpenAdd}>
          زیادکردنی هاوپۆلی نوێ
        </Button>
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
          gap: '16px'
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                {cat.nameKurdish}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {cat.nameEnglish} • {cat.count} بەرهەم
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleOpenEdit(cat)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-silver)',
                  cursor: 'pointer'
                }}
                title="دەستکاریکردن"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.nameKurdish)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  cursor: 'pointer'
                }}
                title="سڕینەوە"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? 'دەستکاریکردنی هاوپۆل' : 'زیادکردنی هاوپۆلی نوێ'}
        maxWidth="460px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              ناوی هاوپۆل بە کوردی
            </label>
            <input
              type="text"
              required
              value={nameKurdish}
              onChange={(e) => setNameKurdish(e.target.value)}
              placeholder="نموونە: بەڵگەنامەیی (Documentary)"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              ناوی ئینگلیزی (English Name)
            </label>
            <input
              type="text"
              value={nameEnglish}
              onChange={(e) => setNameEnglish(e.target.value)}
              placeholder="Documentary"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                direction: 'ltr',
                textAlign: 'right'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button type="submit" variant="silver" style={{ flex: 1 }}>
              پاشەکەوتکردن
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              پاشگەزبوونەوە
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
