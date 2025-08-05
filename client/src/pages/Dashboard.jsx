import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const RANDOM_FACTS = [
  'Honey never spoils.',
  'Bananas are berries, but strawberries aren’t.',
  'Octopuses have three hearts.',
  'A group of flamingos is called a "flamboyance".',
  'There are more stars in the universe than grains of sand on Earth.',
  'Sharks have been around longer than trees.',
  'The Eiffel Tower can be 15 cm taller during the summer.',
  'Some cats are allergic to humans.',
  'A cloud can weigh more than a million pounds.',
  'Wombat poop is cube-shaped.',
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', color: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [randomFact, setRandomFact] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const userRes = await API.get('/me');
        setUser(userRes.data);
      } catch {
        alert('Authentication error. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      try {
        const notesRes = await API.get('/notes');
        setNotes(notesRes.data.map(n => ({ ...n, body: n.content }))); // Normalize body field
      } catch {
        alert('Failed to fetch notes.');
      }
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    setRandomFact(RANDOM_FACTS[Math.floor(Math.random() * RANDOM_FACTS.length)]);
    const interval = setInterval(() => {
      setRandomFact(RANDOM_FACTS[Math.floor(Math.random() * RANDOM_FACTS.length)]);
    }, 10000); // every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Dark mode toggle
  const toggleDarkMode = () => {
    setIsDark((prev) => {
      localStorage.setItem('darkMode', !prev);
      return !prev;
    });
  };

  // Filter notes based on search term (case insensitive)
  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return notes;
    return notes.filter((n) =>
      (n.title + ' ' + (n.body || '')).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  // Separate pinned, unpinned, archived
  const pinnedNotes = filteredNotes.filter((n) => n.pinned && !n.archived);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned && !n.archived);
  const archivedNotes = filteredNotes.filter((n) => n.archived);

  // Form handlers
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setImageFiles(Array.from(e.target.files));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Title is required.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('body', form.body);
      formData.append('color', form.color);
      imageFiles.forEach((file) => formData.append('images', file));

      if (editingId) {
        await API.put(`/notes/${editingId}`, formData);
        setEditingId(null);
      } else {
        await API.post('/notes', formData);
      }
      const notesRes = await API.get('/notes');
      setNotes(notesRes.data);
      setForm({ title: '', body: '', color: '' });
      setImageFiles([]);
    } catch {
      alert('Error saving note');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await API.delete(`/notes/${id}`);
      setNotes(notes.filter((n) => n.id !== id));
    } catch {
      alert('Failed to delete note.');
    }
  };

  const handleEdit = (note) => {
    setForm({ title: note.title || '', body: note.content || '', color: note.color || '' });
    setEditingId(note.id);
    setImageFiles([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const togglePin = async (note) => {
    try {
      await API.put(`/notes/${note.id}/pin`);
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === note.id ? { ...n, pinned: !n.pinned } : n
        )
      );
    } catch {
      alert('Failed to toggle pin.');
    }
  };

  const toggleArchive = async (note) => {
    try {
      await API.put(`/notes/${note.id}/archive`);
      setNotes((prevNotes) =>
        prevNotes.map((n) =>
          n.id === note.id ? { ...n, archived: !n.archived } : n
        )
      );
    } catch {
      alert('Failed to toggle archive.');
    }
  };

  // Drag & Drop handler
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.source.droppableId !== 'unpinned' || result.destination.droppableId !== 'unpinned') return;

    const newOrder = Array.from(unpinnedNotes);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);

    const newNotes = [
      ...pinnedNotes,
      ...newOrder,
      ...archivedNotes,
    ];

    setNotes(newNotes);

    try {
      await API.post('/notes/reorder', { order: newOrder.map((n) => n.id) });
    } catch {
      alert('Failed to save note order.');
    }
  };

  if (!user)
    return (
      <p
        style={{
          textAlign: 'center',
          marginTop: '2.5rem',
          fontSize: '1.125rem',
          color: isDark ? '#d1d5db' : '#4b5563',
        }}
      >
        Loading...
      </p>
    );

  // Inline styles for light/dark
  const bgColor = isDark ? '#111827' : '#f3f4f6';
  const textColor = isDark ? '#d1d5db' : '#111827';
  const borderColor = isDark ? '#374151' : '#d1d5db';

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh', color: textColor, fontFamily: 'sans-serif', transition: 'all 0.3s' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${borderColor}`,
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src={
              user.profileImage
                ? `http://localhost:5000/uploads/${user.profileImage}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=random&rounded=true`
            }
            alt="Profile"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          />
          
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>{user.name}</h1>
            <p style={{ fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280', margin: 0 }}>{user.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={toggleDarkMode}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
            style={{
              backgroundColor: isDark ? '#facc15' : '#fde68a',
              color: isDark ? '#78350f' : '#713f12',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s',
            }}
          >
            {isDark ? '🌞 Light Mode' : '🌙 Dark Mode'}
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
        {/* Greeting and random fact */}
        <section style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            Hello, {user.name.split(' ')[0]}!
          </h2>
          <p style={{ fontSize: '1rem', color: isDark ? '#9ca3af' : '#4b5563', marginTop: '0.25rem' }}>
            Did you know? {randomFact}
          </p>
        </section>

        {/* Search */}
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: `1px solid ${borderColor}`,
            backgroundColor: isDark ? '#1f2937' : 'white',
            color: textColor,
            fontSize: '1rem',
            outline: 'none',
            marginBottom: '1.5rem',
            transition: 'all 0.2s',
          }}
        />

        {/* Note Form */}
        <section
          style={{
            backgroundColor: isDark ? '#1f2937' : 'white',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: isDark
              ? '0 4px 8px rgba(255,255,255,0.05)'
              : '0 4px 8px rgba(0,0,0,0.05)',
            marginBottom: '3rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editingId ? 'Edit Note' : 'Create a New Note'}
          </h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              name="title"
              value={form.title || ''}
              onChange={handleChange}
              placeholder="Title"
              required
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                borderRadius: '0.375rem',
                border: `1px solid ${borderColor}`,
                backgroundColor: isDark ? '#111827' : 'white',
                color: textColor,
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
            <textarea
              name="body"
              value={form.body || ''}
              onChange={handleChange}
              placeholder="Body"
              rows={3}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                borderRadius: '0.375rem',
                border: `1px solid ${borderColor}`,
                backgroundColor: isDark ? '#111827' : 'white',
                color: textColor,
                outline: 'none',
                resize: 'vertical',
                transition: 'all 0.2s',
              }}
            />
            <input
              name="color"
              value={form.color || ''}
              onChange={handleChange}
              placeholder="Color (e.g. #FFDD57)"
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '1rem',
                borderRadius: '0.375rem',
                border: `1px solid ${borderColor}`,
                backgroundColor: isDark ? '#111827' : 'white',
                color: textColor,
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              style={{
                color: isDark ? '#d1d5db' : '#111827',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563eb')}
              >
                {editingId ? 'Update Note' : 'Create Note'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ title: '', body: '', color: '' });
                    setImageFiles([]);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    border: 'none',
                    cursor: 'pointer',
                    alignSelf: 'center',
                    textDecoration: 'underline',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              📌 Pinned Notes
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={togglePin}
                  onToggleArchive={toggleArchive}
                  onView={setViewingNote}
                  isDark={isDark}
                />
              ))}
            </div>
          </section>
        )}

        {/* Unpinned Notes with Drag & Drop */}
        <section style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Notes
          </h3>
          {unpinnedNotes.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="unpinned">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '1.25rem',
                    }}
                  >
                    {unpinnedNotes.map((note, index) => (
                      <Draggable key={note.id} draggableId={note.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              userSelect: 'none',
                              boxShadow: snapshot.isDragging
                                ? '0 0 10px #2563eb'
                                : 'none',
                              zIndex: snapshot.isDragging ? 1000 : 'auto',
                              ...provided.draggableProps.style,
                            }}
                          >
                            <NoteCard
                              note={note}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onTogglePin={togglePin}
                              onToggleArchive={toggleArchive}
                              onView={setViewingNote}
                              isDark={isDark}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <p>No notes available.</p>
          )}
        </section>

        {/* Archived Notes Toggle */}
        <section style={{ marginBottom: '3rem' }}>
          <button
            onClick={() => setShowArchived((v) => !v)}
            style={{
              backgroundColor: showArchived ? '#dc2626' : '#2563eb',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s',
            }}
          >
            {showArchived ? 'Hide Archived Notes' : `Show Archived Notes (${archivedNotes.length})`}
          </button>
          {showArchived && archivedNotes.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {archivedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={togglePin}
                  onToggleArchive={toggleArchive}
                  onView={setViewingNote}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
          {showArchived && archivedNotes.length === 0 && <p>No archived notes.</p>}
        </section>

        {/* Viewing Note Modal */}
        {viewingNote && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1500,
              padding: '1rem',
            }}
            onClick={() => setViewingNote(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDark ? '#1f2937' : 'white',
                color: textColor,
                borderRadius: '0.75rem',
                padding: '2rem',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setViewingNote(null)}
                aria-label="Close"
                title="Close"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: textColor,
                }}
              >
                &times;
              </button>
              <h2 style={{ marginTop: 0 }}>{viewingNote.title}</h2>
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                {viewingNote.body || '(No content)'}
              </p>
              {viewingNote.image && (
                <img
                  src={`http://localhost:5000/uploads/notes/${viewingNote.image}`}
                  alt="Note Attachment"
                  style={{ maxWidth: '100%', borderRadius: '0.5rem' }}
                />
              )}
              <p
                style={{
                  fontSize: '0.85rem',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginTop: '1rem',
                }}
              >
                {viewingNote.archived
                  ? 'Status: Archived'
                  : viewingNote.pinned
                  ? 'Status: Pinned'
                  : 'Status: Normal'}
              </p>
            </div>
          </div>
        )}
      </main>

      <footer
        style={{
          borderTop: `1px solid ${borderColor}`,
          textAlign: 'center',
          padding: '1rem 0',
          fontSize: '0.875rem',
          color: isDark ? '#6b7280' : '#9ca3af',
        }}
      >
        &copy; {new Date().getFullYear()} Your Notes App. All rights reserved.
      </footer>
    </div>
  );
}

// Note Card component
function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleArchive, onView, isDark }) {
  const cardBg = note.color || (isDark ? '#374151' : '#fef3c7');
  const textColor = isDark ? '#f9fafb' : '#1f2937';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onView(note);
      }}
      style={{
        backgroundColor: cardBg,
        color: textColor,
        padding: '1rem',
        borderRadius: '0.75rem',
        boxShadow: isDark
          ? '0 0 10px rgba(255, 255, 255, 0.1)'
          : '0 0 10px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '150px',
        transition: 'background-color 0.3s',
      }}
    >
      <div>
        <h4
          style={{
            margin: 0,
            fontWeight: '700',
            fontSize: '1.125rem',
            marginBottom: '0.5rem',
            wordBreak: 'break-word',
          }}
          title={note.title}
        >
          {note.title}
        </h4>
        <p
          style={{
            fontSize: '0.875rem',
            color: isDark ? '#d1d5db' : '#4b5563',
            whiteSpace: 'pre-wrap',
            maxHeight: '4.5rem', // ~3 lines
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '0.5rem',
            wordBreak: 'break-word',
          }}
          title={note.body || '(No content)'}
        >
          {note.body || '(No content)'}
        </p>
        {note.image && (
          <img
            src={`http://localhost:5000/uploads/notes/${note.image}`}
            alt="Note Attachment"
            style={{
              maxWidth: '100%',
              maxHeight: '120px',
              borderRadius: '0.5rem',
              objectFit: 'cover',
              marginBottom: '0.5rem',
            }}
          />
        )}
      </div>

      {/* Action buttons */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.25rem',
        }}
        onClick={(e) => e.stopPropagation()} // prevent modal open on button click
      >
        {/* Pin/unpin */}
        <button
          onClick={() => onTogglePin(note)}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
          title={note.pinned ? 'Unpin note' : 'Pin note'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: note.pinned ? '#fbbf24' : isDark ? '#d1d5db' : '#6b7280',
          }}
        >
          {note.pinned ? '📌 unpin' : '📍 pin'}
        </button>

        {/* Archive/unarchive */}
        <button
          onClick={() => onToggleArchive(note)}
          aria-label={note.archived ? 'Unarchive note' : 'Archive note'}
          title={note.archived ? 'Unarchive note' : 'Archive note'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: note.archived ? '#ef4444' : isDark ? '#d1d5db' : '#6b7280',
          }}
        >
          {note.archived ? '📂 unarchive' : '🗄️ archive'}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(note)}
          aria-label="Edit note"
          title="Edit note"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: isDark ? '#d1d5db' : '#6b7280',
          }}
        >
          ✏️ edit
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(note.id)}
          aria-label="Delete note"
          title="Delete note"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            color: isDark ? '#d1d5db' : '#6b7280',
          }}
        >
          🗑️ delete
        </button>
      </div>
    </div>
  );
}
