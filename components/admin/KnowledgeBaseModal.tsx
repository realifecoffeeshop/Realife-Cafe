import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import Modal from '../shared/Modal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { AppContext } from '../../context/AppContext';
import { KnowledgeArticle } from '../../types';
import { useToast } from '../../context/ToastContext';

// Simple markdown parser
const parseMarkdown = (text: string): string => {
    if (!text) return '';

    // Inline elements
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>');

    // Block elements
    html = html.split('\n\n').map(block => {
        // Headings
        if (block.startsWith('### ')) return `<h3>${block.substring(4)}</h3>`;
        if (block.startsWith('## ')) return `<h2>${block.substring(3)}</h2>`;

        // Lists
        if (block.match(/^\s*([-*]|\d+\.) /)) {
            const listItems = block.split('\n').map(item => {
                const content = item.replace(/^\s*([-*]|\d+\.) /, '');
                return `<li>${content}</li>`;
            }).join('');
            const isOrdered = /^\s*\d+\./.test(block);
            return isOrdered ? `<ol>${listItems}</ol>` : `<ul>${listItems}</ul>`;
        }

        // Paragraphs
        return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return html;
};

const KnowledgeBaseModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useContext(AppContext);
  const { addToast } = useToast();
  const { activeKnowledgeArticleId, knowledgeBase } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'view' | 'edit'>('list');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [articleForm, setArticleForm] = useState<Partial<KnowledgeArticle>>({});
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Reset view when modal is closed or opened
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
          setView('list');
          setSelectedArticle(null);
          setSearchTerm('');
      }, 300); // Delay to allow closing animation
    } else if (activeKnowledgeArticleId) {
        // If modal is opened with a specific article ID, view it directly
        const articleToView = knowledgeBase.find(a => a.id === activeKnowledgeArticleId);
        if (articleToView) {
            setSelectedArticle(articleToView);
            setView('view');
        }
    } else {
        // If no specific article, just show the list
        setView('list');
        setSelectedArticle(null);
    }
  }, [isOpen, activeKnowledgeArticleId, knowledgeBase]);

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) {
      return state.knowledgeBase;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return state.knowledgeBase.filter(
      article =>
        article.title.toLowerCase().includes(lowercasedTerm) ||
        article.content.toLowerCase().includes(lowercasedTerm) ||
        article.category.toLowerCase().includes(lowercasedTerm)
    );
  }, [searchTerm, state.knowledgeBase]);

  const handleSelectArticle = (article: KnowledgeArticle) => {
    setSelectedArticle(article);
    setView('view');
  };

  const handleCreateNew = () => {
    setArticleForm({ title: '', category: 'General', content: '', imageUrl: '' });
    setImageSource('url');
    setView('edit');
  };

  const handleEditArticle = (article: KnowledgeArticle) => {
    setArticleForm(article);
    if (article.imageUrl && article.imageUrl.startsWith('data:image')) {
        setImageSource('upload');
    } else {
        setImageSource('url');
    }
    setView('edit');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setArticleForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setArticleForm(prev => ({ ...prev, imageUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!articleForm.title?.trim() || !articleForm.content?.trim() || !articleForm.category?.trim()) {
        addToast('Title, Category, and Content fields are required.', 'error');
        return;
    }

    if (articleForm.id) {
        dispatch({ type: 'UPDATE_KB_ARTICLE', payload: articleForm as KnowledgeArticle });
        addToast('Article updated successfully!', 'success');
        setSelectedArticle(articleForm as KnowledgeArticle);
        setView('view');
    } else {
        dispatch({ type: 'ADD_KB_ARTICLE', payload: articleForm as Omit<KnowledgeArticle, 'id'> });
        addToast('Article created successfully!', 'success');
        setView('list');
    }
    setArticleForm({});
  };

  const confirmDelete = () => {
    if (deleteCandidate) {
        dispatch({ type: 'DELETE_KB_ARTICLE', payload: deleteCandidate });
        addToast('Article deleted.', 'success');
        setDeleteCandidate(null);
        setView('list');
        setSelectedArticle(null);
    }
  };

  const handleFormat = (formatType: 'bold' | 'italic' | 'ul' | 'ol' | 'h2' | 'h3') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selectedText = value.substring(start, end);
    let markdown = '';
    let newCursorPos = start;

    const wrapText = (prefix: string, suffix: string = prefix) => {
        markdown = `${prefix}${selectedText}${suffix}`;
        newCursorPos = start + prefix.length;
    };

    const prefixLines = (prefix: (line: string, index: number) => string) => {
        const lines = selectedText.split('\n');
        markdown = lines.map(prefix).join('\n');
    };

    switch (formatType) {
        case 'bold': wrapText('**'); break;
        case 'italic': wrapText('*'); break;
        case 'h2': wrapText('## ', ''); break;
        case 'h3': wrapText('### ', ''); break;
        case 'ul': prefixLines(line => `- ${line}`); break;
        case 'ol': prefixLines((line, i) => `${i + 1}. ${line}`); break;
    }
    
    const newValue = value.substring(0, start) + markdown + value.substring(end);
    setArticleForm(prev => ({ ...prev, content: newValue }));

    setTimeout(() => {
        textarea.focus();
        if (selectedText) {
            textarea.setSelectionRange(start, start + markdown.length);
        } else {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };
  
  const ToolbarButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
    <button type="button" onClick={onClick} title={title} className="p-2 rounded-md text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-600">
        {children}
    </button>
  );

  const renderListView = () => (
     <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative flex-grow">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-stone-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                </div>
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"
                />
            </div>
            <button onClick={handleCreateNew} className="bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 px-4 py-2 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200 flex-shrink-0">
                Create New Article
            </button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-3 -mr-3">
            {filteredArticles.length > 0 ? filteredArticles.map(article => (
                <div key={article.id} onClick={() => handleSelectArticle(article)} className="bg-stone-50 dark:bg-zinc-700/50 p-4 rounded-lg cursor-pointer hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors">
                    <span className="text-xs font-semibold uppercase text-stone-500 dark:text-zinc-400">{article.category}</span>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mt-1">{article.title}</h3>
                </div>
            )) : (
                <div className="text-center py-10"><p className="text-stone-600 dark:text-zinc-400">No articles found.</p></div>
            )}
        </div>
    </div>
  );
  
  const renderArticleView = () => {
    if (!selectedArticle) return null;
    const parsedContent = parseMarkdown(selectedArticle.content);
    return (
        <div>
            <button onClick={() => setView('list')} className="text-sm text-stone-600 dark:text-zinc-300 hover:underline mb-4">
                &larr; Back to all articles
            </button>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-48 object-cover rounded-lg" loading="lazy" />
                <span className="text-xs font-semibold uppercase text-stone-500 dark:text-zinc-400">{selectedArticle.category}</span>
                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{selectedArticle.title}</h2>
                <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: parsedContent }}
                />
            </div>
             <div className="flex justify-end space-x-2 mt-6 pt-4 border-t dark:border-zinc-700">
                <button onClick={() => setDeleteCandidate(selectedArticle.id)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                <button onClick={() => handleEditArticle(selectedArticle)} className="px-4 py-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 rounded-md hover:bg-[#947D6A] dark:hover:bg-zinc-200">Edit</button>
            </div>
        </div>
    );
  };
  
  const renderFormView = () => (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">{articleForm.id ? 'Edit Article' : 'Create New Article'}</h2>
        <div>
            <label className="block mb-1 font-medium">Title</label>
            <input name="title" value={articleForm.title || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" />
        </div>
        <div>
            <label className="block mb-1 font-medium">Category</label>
            <input name="category" value={articleForm.category || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" />
        </div>
        <div>
            <label className="block mb-1 font-medium">Content</label>
            <div className="flex items-center space-x-1 border border-b-0 dark:border-zinc-600 rounded-t-md p-2 bg-stone-50 dark:bg-zinc-700/50">
                <ToolbarButton onClick={() => handleFormat('bold')} title="Bold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" transform="rotate(90 12 12) scale(0.8) translate(-1, -1)" /><path d="M6 8c0-2 2-2 4-2s4 0 4 2v8c0 2-2 2-4 2s-4 0-4-2V8z" /></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => handleFormat('italic')} title="Italic">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16M8 4h8M8 20h8" /></svg>
                </ToolbarButton>
                <div className="border-l h-5 border-stone-300 dark:border-zinc-500 mx-2"></div>
                <ToolbarButton onClick={() => handleFormat('h2')} title="Heading 2"><span className="font-bold text-sm">H2</span></ToolbarButton>
                <ToolbarButton onClick={() => handleFormat('h3')} title="Heading 3"><span className="font-bold text-sm">H3</span></ToolbarButton>
                <div className="border-l h-5 border-stone-300 dark:border-zinc-500 mx-2"></div>
                <ToolbarButton onClick={() => handleFormat('ul')} title="Unordered List">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                </ToolbarButton>
                <ToolbarButton onClick={() => handleFormat('ol')} title="Ordered List">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" transform="translate(0, -1)"/><text x="2" y="7" fontSize="8" fontWeight="bold">1</text><text x="2" y="13" fontSize="8" fontWeight="bold">2</text><text x="2" y="19" fontSize="8" fontWeight="bold">3</text></svg>
                </ToolbarButton>
            </div>
            <textarea ref={contentTextareaRef} name="content" value={articleForm.content || ''} onChange={handleFormChange} rows={12} className="w-full p-2 border rounded-b-md rounded-t-none bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white focus:ring-0 focus:border-stone-500" />
        </div>
        <div>
            <label className="block mb-2 font-medium">Image</label>
            <div className="flex items-center space-x-4 mb-2">
                <label><input type="radio" value="url" checked={imageSource === 'url'} onChange={() => setImageSource('url')} className="mr-1"/> URL</label>
                <label><input type="radio" value="upload" checked={imageSource === 'upload'} onChange={() => setImageSource('upload')} className="mr-1"/> Upload</label>
            </div>
            {imageSource === 'url' ? (
                <input name="imageUrl" value={articleForm.imageUrl || ''} onChange={handleFormChange} placeholder="https://example.com/image.jpg" className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white"/>
            ) : (
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stone-50 dark:file:bg-zinc-600 file:text-stone-700 dark:file:text-zinc-200 hover:file:bg-stone-100 dark:hover:file:bg-zinc-500"/>
            )}
            {articleForm.imageUrl && <img src={articleForm.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md mt-2"/>}
        </div>
        <div className="flex justify-end space-x-2 pt-4">
            <button onClick={() => setView(selectedArticle ? 'view' : 'list')} className="px-4 py-2 bg-stone-200 dark:bg-zinc-600 rounded-md">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 rounded-md">Save</button>
        </div>
    </div>
  );

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Knowledge Base">
        {view === 'list' && renderListView()}
        {view === 'view' && renderArticleView()}
        {view === 'edit' && renderFormView()}
    </Modal>
    <ConfirmationModal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
        title="Delete Article"
        message="Are you sure you want to permanently delete this article?"
        confirmButtonText="Yes, Delete"
    />
    </>
  );
};

export default KnowledgeBaseModal;