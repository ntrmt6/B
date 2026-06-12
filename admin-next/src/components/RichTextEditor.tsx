import React, { useState, useRef, useEffect, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  hideLabel?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter product description...',
  minHeight = 'min-h-[300px]',
  label,
  hideLabel = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
    return () => {
      setIsMounted(false);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && isMounted && !isEditing && value) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, isMounted, isEditing]);

  const handleEditorChange = useCallback(() => {
    if (editorRef.current && isMounted) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange, isMounted]);

  const exec = useCallback((command: string, val?: string) => {
    if (!isMounted || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    handleEditorChange();
  }, [isMounted, handleEditorChange]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const handleInsertLink = () => {
    restoreSelection();
    if (linkUrl) {
      if (linkText) {
        const html = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline">${linkText}</a>`;
        document.execCommand('insertHTML', false, html);
      } else {
        document.execCommand('createLink', false, linkUrl);
      }
      handleEditorChange();
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleInsertImageUrl = () => {
    restoreSelection();
    if (imageUrl) {
      const html = `<img src="${imageUrl}" alt="image" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0" />`;
      document.execCommand('insertHTML', false, html);
      handleEditorChange();
    }
    setShowImageUrlModal(false);
    setImageUrl('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (base64 && editorRef.current) {
        editorRef.current.focus();
        restoreSelection();
        const html = `<img src="${base64}" alt="image" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0" />`;
        document.execCommand('insertHTML', false, html);
        handleEditorChange();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const base64 = ev.target?.result as string;
              if (base64) {
                document.execCommand('insertHTML', false,
                  `<img src="${base64}" alt="pasted" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0" />`
                );
                handleEditorChange();
              }
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    }
  }, [handleEditorChange]);

  const colors = ['#000000', '#434343', '#666666', '#999999', '#e74c3c', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#1abc9c', '#d35400', '#c0392b', '#2c3e50', '#7f8c8d', '#ffffff'];

  const Btn = ({ title, onClick, children, active }: { title: string; onClick: () => void; children: React.ReactNode; active?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded text-[13px] transition-all ${active ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800 border border-transparent'}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-0.5 self-center" />;

  return (
    <div className="space-y-0">
      {!hideLabel && <label className="text-sm font-medium text-gray-700 block mb-1">{label || 'Product Description'}</label>}

      {/* Toolbar Row 1 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-white border border-gray-300 rounded-t-lg border-b-0">
        {/* Undo/Redo */}
        <Btn title="Undo" onClick={() => exec('undo')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.69 3L3 13"/></svg>
        </Btn>
        <Btn title="Redo" onClick={() => exec('redo')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016.69 3L21 13"/></svg>
        </Btn>
        <Divider />

        {/* Format Block */}
        <select
          className="h-7 px-1 border border-gray-200 rounded text-xs bg-white hover:bg-gray-50 outline-none cursor-pointer"
          onChange={(e) => { if (e.target.value) { exec('formatBlock', e.target.value); e.target.value = ''; } }}
        >
          <option value="">Format</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code</option>
        </select>

        {/* Font Size */}
        <select
          className="h-7 px-1 border border-gray-200 rounded text-xs bg-white hover:bg-gray-50 outline-none cursor-pointer"
          onChange={(e) => { if (e.target.value) { exec('fontSize', e.target.value); e.target.value = ''; } }}
        >
          <option value="">Size</option>
          <option value="1">Small</option>
          <option value="2">Normal</option>
          <option value="3">Medium</option>
          <option value="4">Large</option>
          <option value="5">X-Large</option>
          <option value="6">XX-Large</option>
          <option value="7">Huge</option>
        </select>
        <Divider />

        {/* Bold, Italic, Underline, Strikethrough */}
        <Btn title="Bold (Ctrl+B)" onClick={() => exec('bold')}><b>B</b></Btn>
        <Btn title="Italic (Ctrl+I)" onClick={() => exec('italic')}><i>I</i></Btn>
        <Btn title="Underline (Ctrl+U)" onClick={() => exec('underline')}><u>U</u></Btn>
        <Btn title="Strikethrough" onClick={() => exec('strikeThrough')}><s>S</s></Btn>
        <Divider />

        {/* Text Color */}
        <div className="relative">
          <Btn title="Text Color" onClick={() => { saveSelection(); setShowColorPicker(showColorPicker === 'text' ? null : 'text'); }}>
            <span className="flex flex-col items-center">
              <span className="text-[13px] font-bold">A</span>
              <span className="w-4 h-1 bg-red-500 rounded-full -mt-0.5"></span>
            </span>
          </Btn>
          {showColorPicker === 'text' && (
            <div className="absolute top-full left-0 z-50 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 grid grid-cols-8 gap-1" style={{ width: '180px' }}>
              {colors.map(c => (
                <button key={c} type="button" className="w-5 h-5 rounded border border-gray-300 hover:scale-125 transition-transform" style={{ backgroundColor: c }}
                  onClick={() => { restoreSelection(); exec('foreColor', c); setShowColorPicker(null); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative">
          <Btn title="Highlight Color" onClick={() => { saveSelection(); setShowColorPicker(showColorPicker === 'bg' ? null : 'bg'); }}>
            <span className="flex flex-col items-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 21h14l-2-7H7l-2 7zm3.5-9h7L18 5c0-1.1-.9-2-2-2H8C6.9 3 6 3.9 6 5l2.5 7z"/></svg>
              <span className="w-4 h-1 bg-yellow-400 rounded-full -mt-0.5"></span>
            </span>
          </Btn>
          {showColorPicker === 'bg' && (
            <div className="absolute top-full left-0 z-50 mt-1 p-2 bg-white rounded-lg shadow-xl border border-gray-200 grid grid-cols-8 gap-1" style={{ width: '180px' }}>
              {colors.map(c => (
                <button key={c} type="button" className="w-5 h-5 rounded border border-gray-300 hover:scale-125 transition-transform" style={{ backgroundColor: c }}
                  onClick={() => { restoreSelection(); exec('hiliteColor', c); setShowColorPicker(null); }}
                />
              ))}
            </div>
          )}
        </div>
        <Divider />

        {/* Alignment */}
        <Btn title="Align Left" onClick={() => exec('justifyLeft')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M3 12h12M3 18h18"/></svg>
        </Btn>
        <Btn title="Align Center" onClick={() => exec('justifyCenter')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M6 12h12M3 18h18"/></svg>
        </Btn>
        <Btn title="Align Right" onClick={() => exec('justifyRight')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M9 12h12M3 18h18"/></svg>
        </Btn>
        <Divider />

        {/* Lists */}
        <Btn title="Bullet List" onClick={() => exec('insertUnorderedList')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="4" cy="6" r="1.5" fill="currentColor"/><path d="M9 6h12"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><path d="M9 12h12"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/><path d="M9 18h12"/></svg>
        </Btn>
        <Btn title="Numbered List" onClick={() => exec('insertOrderedList')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6h12M9 12h12M9 18h12"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none">3</text></svg>
        </Btn>
        <Btn title="Indent" onClick={() => exec('indent')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M11 12h10M3 18h18M3 9l3 3-3 3"/></svg>
        </Btn>
        <Btn title="Outdent" onClick={() => exec('outdent')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M11 12h10M3 18h18M6 9l-3 3 3 3"/></svg>
        </Btn>
        <Divider />

        {/* Blockquote */}
        <Btn title="Block Quote" onClick={() => exec('formatBlock', 'blockquote')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.157 11 15c0 1.933-1.567 3.5-3.5 3.5-1.171 0-2.274-.564-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.157 21 15c0 1.933-1.567 3.5-3.5 3.5-1.171 0-2.274-.564-2.917-1.179z"/></svg>
        </Btn>
        <Btn title="Horizontal Line" onClick={() => exec('insertHorizontalRule')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18"/></svg>
        </Btn>
      </div>

      {/* Toolbar Row 2 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-white border border-gray-300 border-b-0">
        {/* Clear Formatting */}
        <Btn title="Clear Formatting" onClick={() => exec('removeFormat')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/><path d="M4 20l16-16" strokeWidth="1.5" stroke="#e74c3c"/></svg>
        </Btn>
        <Divider />

        {/* Link */}
        <Btn title="Insert Link" onClick={() => { saveSelection(); setShowLinkModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        </Btn>
        <Btn title="Unlink" onClick={() => exec('unlink')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/><path d="M4 20l16-16" strokeWidth="1.5" stroke="#e74c3c"/></svg>
        </Btn>
        <Divider />

        {/* Table */}
        <Btn title="Insert Table" onClick={() => {
          if (!editorRef.current) return;
          editorRef.current.focus();
          restoreSelection();
          const html = '<table style="width:100%;border-collapse:collapse;margin:8px 0"><tbody><tr><td style="border:1px solid #d1d5db;padding:8px;min-width:60px">&nbsp;</td><td style="border:1px solid #d1d5db;padding:8px;min-width:60px">&nbsp;</td><td style="border:1px solid #d1d5db;padding:8px;min-width:60px">&nbsp;</td></tr><tr><td style="border:1px solid #d1d5db;padding:8px">&nbsp;</td><td style="border:1px solid #d1d5db;padding:8px">&nbsp;</td><td style="border:1px solid #d1d5db;padding:8px">&nbsp;</td></tr><tr><td style="border:1px solid #d1d5db;padding:8px">&nbsp;</td><td style="border:1px solid #d1d5db;padding:8px">&nbsp;</td><td style="border:1px solid #d1d5db;padding:8px">&nbsp;</td></tr></tbody></table><p></p>';
          document.execCommand('insertHTML', false, html);
          handleEditorChange();
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        </Btn>
        <Divider />

        {/* Image Upload */}
        <Btn title="Upload Image" onClick={() => { saveSelection(); imageInputRef.current?.click(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </Btn>
        <Btn title="Image from URL" onClick={() => { saveSelection(); setShowImageUrlModal(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8m-4-4h8"/></svg>
        </Btn>
        <Divider />

        {/* Code Block */}
        <Btn title="Code Block" onClick={() => exec('formatBlock', 'pre')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </Btn>
        {/* Subscript / Superscript */}
        <Btn title="Superscript" onClick={() => exec('superscript')}>
          <span className="text-[11px]">X<sup className="text-[8px]">2</sup></span>
        </Btn>
        <Btn title="Subscript" onClick={() => exec('subscript')}>
          <span className="text-[11px]">X<sub className="text-[8px]">2</sub></span>
        </Btn>
      </div>

      {/* Hidden image input */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleEditorChange}
        onPaste={handlePaste}
        onFocus={() => setIsEditing(true)}
        onBlur={() => { setIsEditing(false); saveSelection(); }}
        onClick={() => { if (showColorPicker) setShowColorPicker(null); }}
        className={`w-full px-4 py-3 border ${isEditing ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'} rounded-b-lg focus:outline-none transition ${minHeight} bg-white prose prose-sm max-w-none overflow-auto`}
        style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', outline: 'none' }}
        data-placeholder={placeholder}
      />

      {/* Placeholder style */}
      <style dangerouslySetInnerHTML={{ __html: `
        div[data-placeholder]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .prose img { max-width: 100%; height: auto; border-radius: 8px; }
        .prose table { width: 100%; border-collapse: collapse; }
        .prose td, .prose th { border: 1px solid #d1d5db; padding: 8px; }
        .prose blockquote { border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 8px 0; color: #4b5563; font-style: italic; }
      `}} />

      {/* Character count */}
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-400">
          You can <span className="text-blue-500 cursor-pointer" onClick={() => { saveSelection(); imageInputRef.current?.click(); }}>upload images</span>, add links, tables, and format text with the toolbar.
        </p>
        <span className="text-xs text-gray-400">
          characters: {editorRef.current?.textContent?.length || 0}
        </span>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center" onClick={() => setShowLinkModal(false)}>
          <div className="bg-white rounded-xl p-5 w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">Insert Link</h3>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 outline-none focus:border-blue-500" placeholder="URL (https://...)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} autoFocus />
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 outline-none focus:border-blue-500" placeholder="Display text (optional)" value={linkText} onChange={e => setLinkText(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button type="button" className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={handleInsertLink}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Image URL Modal */}
      {showImageUrlModal && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center" onClick={() => setShowImageUrlModal(false)}>
          <div className="bg-white rounded-xl p-5 w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3">Insert Image from URL</h3>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 outline-none focus:border-blue-500" placeholder="Image URL (https://...)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} autoFocus />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => setShowImageUrlModal(false)}>Cancel</button>
              <button type="button" className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={handleInsertImageUrl}>Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
