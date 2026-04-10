'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

/* ── Emoji data ──────────────────────────────────────────────── */
const EMOJI_GROUPS = [
  {
    label: 'Espressioni',
    emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','😉','😍','🥰','😘','😎','🤓','🧐','🤩','🥳','😏','😌','😔','😢','😭','😤','😡','🤯','🥺','😬','😴'],
  },
  {
    label: 'Gesti & persone',
    emojis: ['👍','👎','👌','✌️','🤞','🙏','👏','🤝','💪','🫶','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','✨','🔥','⭐','🌟'],
  },
  {
    label: 'Oggetti & simboli',
    emojis: ['📚','📖','📝','✏️','📌','📎','🔗','📊','📈','📉','💡','🔑','🔒','🛠️','⚙️','🎯','🏆','🎓','📜','💻','🖥️','📱','⌨️','🖱️'],
  },
  {
    label: 'Natura',
    emojis: ['🌍','🌱','🌿','🍃','🌸','🌺','🌻','🌙','☀️','⭐','🌈','❄️','🔆','💧','🌊'],
  },
];

/* ── Emoji picker ────────────────────────────────────────────── */
function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function openPicker(e: React.MouseEvent) {
    e.preventDefault();
    if (open) { setOpen(false); return; }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const panel = open ? createPortal(
    <div
      ref={panelRef}
      className="rounded-lg border border-border-subtle bg-surface-1 p-3 w-[280px] max-h-[320px] overflow-y-auto"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        boxShadow: '0 8px 32px -8px rgba(0,0,0,0.7)',
      }}
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-2.5 last:mb-0">
          <div className="text-[0.62rem] font-semibold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-0.5">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(emoji);
                  setOpen(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded text-lg hover:bg-white/10 transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseDown={openPicker}
        title="Inserisci emoji"
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded text-[0.78rem] transition-colors',
          open
            ? 'bg-accent-cyan/20 text-accent-cyan'
            : 'text-text-muted hover:text-text-primary hover:bg-white/5',
        )}
      >
        😊
      </button>
      {panel}
    </>
  );
}

/* ── Toolbar button ──────────────────────────────────────────── */
function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded text-[0.78rem] transition-colors',
        active
          ? 'bg-accent-cyan/20 text-accent-cyan'
          : 'text-text-muted hover:text-text-primary hover:bg-white/5',
      )}
    >
      {children}
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Scrivi qui...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate({ editor: e }) {
      const html = e.getHTML();
      onChange(e.isEmpty ? '' : html);
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none min-h-[80px] px-3 py-2.5 text-[0.83rem] text-text-primary leading-relaxed',
      },
    },
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && !editor.isFocused) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) return null;

  function insertEmoji(emoji: string) {
    editor?.chain().focus().insertContent(emoji).run();
  }

  return (
    <div className={cn('rounded-md border border-border-subtle bg-surface-2 overflow-hidden focus-within:border-accent-cyan/50 transition-colors', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border-subtle bg-surface-1/50 flex-wrap">

        {/* Bold */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Grassetto (Ctrl+B)">
          <strong>B</strong>
        </ToolbarBtn>

        {/* Italic */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Corsivo (Ctrl+I)">
          <em>I</em>
        </ToolbarBtn>

        {/* Strike */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barrato">
          <span className="line-through">S</span>
        </ToolbarBtn>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* H2 */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titolo">
          <span className="font-bold text-[0.72rem]">H2</span>
        </ToolbarBtn>

        {/* H3 */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Sottotitolo">
          <span className="font-bold text-[0.72rem]">H3</span>
        </ToolbarBtn>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Bullet list */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Elenco puntato">
          <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
            <circle cx="2" cy="4" r="1.5" fill="currentColor" />
            <circle cx="2" cy="8" r="1.5" fill="currentColor" />
            <circle cx="2" cy="12" r="1.5" fill="currentColor" />
            <rect x="5" y="3" width="9" height="2" rx="1" fill="currentColor" />
            <rect x="5" y="7" width="9" height="2" rx="1" fill="currentColor" />
            <rect x="5" y="11" width="9" height="2" rx="1" fill="currentColor" />
          </svg>
        </ToolbarBtn>

        {/* Ordered list */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Elenco numerato">
          <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
            <text x="0" y="5" fontSize="5" fill="currentColor" fontFamily="monospace">1.</text>
            <text x="0" y="9.5" fontSize="5" fill="currentColor" fontFamily="monospace">2.</text>
            <text x="0" y="14" fontSize="5" fill="currentColor" fontFamily="monospace">3.</text>
            <rect x="6" y="3" width="8" height="2" rx="1" fill="currentColor" />
            <rect x="6" y="7.5" width="8" height="2" rx="1" fill="currentColor" />
            <rect x="6" y="12" width="8" height="2" rx="1" fill="currentColor" />
          </svg>
        </ToolbarBtn>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Undo */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Annulla (Ctrl+Z)">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M3 7h10a6 6 0 0 1 0 12H7" strokeLinecap="round" />
            <polyline points="3 7 7 3 7 11" fill="currentColor" stroke="none" />
          </svg>
        </ToolbarBtn>

        {/* Redo */}
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Ripeti (Ctrl+Y)">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path d="M21 7H11a6 6 0 0 0 0 12h6" strokeLinecap="round" />
            <polyline points="21 7 17 3 17 11" fill="currentColor" stroke="none" />
          </svg>
        </ToolbarBtn>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Emoji picker */}
        <EmojiPicker onSelect={insertEmoji} />

        {/* Spacer */}
        <div className="flex-1" />
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
