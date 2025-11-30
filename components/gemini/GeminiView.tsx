import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useToast } from '../../context/ToastContext';

// Simple markdown parser to format Gemini's response
const parseMarkdown = (text: string): string => {
    if (!text) return '';

    // Inline elements
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>');

    // Block elements are handled by splitting into paragraphs and lists
    const blocks = html.split('\n').filter(block => block.trim() !== '');
    
    let finalHtml = '';
    let inList = false;
    let listType = '';

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const isUnorderedListItem = block.trim().startsWith('* ') || block.trim().startsWith('- ');
        const isOrderedListItem = /^\s*\d+\.\s/.test(block.trim());

        if (isUnorderedListItem || isOrderedListItem) {
            const currentListType = isUnorderedListItem ? 'ul' : 'ol';
            if (!inList) {
                inList = true;
                listType = currentListType;
                finalHtml += `<${listType}>`;
            } else if (listType !== currentListType) {
                finalHtml += `</${listType}><${currentListType}>`;
                listType = currentListType;
            }
            finalHtml += `<li>${block.replace(/^\s*([-*]|\d+\.)\s*/, '')}</li>`;
        } else {
            if (inList) {
                finalHtml += `</${listType}>`;
                inList = false;
            }
            finalHtml += `<p>${block}</p>`;
        }
    }

    if (inList) {
        finalHtml += `</${listType}>`;
    }

    return finalHtml;
};


const GeminiView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { addToast } = useToast();

    const handleSendPrompt = async () => {
        if (!prompt.trim()) {
            addToast('Please enter a question.', 'error');
            return;
        }

        setIsLoading(true);
        setError('');
        setResponse('');

        try {
            // The API key is sourced from process.env.API_KEY which is a requirement.
            // @ts-ignore
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new Error("API_KEY environment variable not set or configured properly.");
            }
            const ai = new GoogleGenAI({ apiKey });

            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setResponse(result.text);

        } catch (err: any) {
            console.error("Error calling Gemini API:", err);
            let userFriendlyMessage = "An unexpected error occurred while contacting Gemini.";
            if (err.message) {
                if (err.message.toLowerCase().includes('api key not valid')) {
                    userFriendlyMessage = "The Gemini API key is invalid. Please check the configuration.";
                } else if (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network')) {
                    userFriendlyMessage = "A network error occurred. Please check your internet connection and try again.";
                }
            }
            const errorMessage = err.message || "An unknown error occurred.";
            setError(`Failed to get a response from Gemini. ${errorMessage}`);
            addToast(userFriendlyMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const parsedResponse = parseMarkdown(response);

    return (
        <div className="bg-[#F5F3EF] dark:bg-zinc-900 min-h-full">
            <div className="container mx-auto p-4 md:p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">Ask Gemini</h1>
                    <p className="mt-3 text-lg text-stone-600 dark:text-zinc-300">Have a question? Get instant answers from Google's AI.</p>
                </div>
                
                <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-md">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="gemini-prompt" className="block text-sm font-medium text-stone-700 dark:text-zinc-300 mb-2">
                                Your Question
                            </label>
                            <textarea
                                id="gemini-prompt"
                                rows={4}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., What's the difference between a latte and a cappuccino?"
                                className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white focus:ring-2 focus:ring-[#A58D79] focus:border-[#A58D79] transition"
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendPrompt();
                                    }
                                }}
                            />
                        </div>
                        <button
                            onClick={handleSendPrompt}
                            disabled={isLoading}
                            className="w-full bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 py-3 rounded-lg font-bold hover:bg-[#947D6A] dark:hover:bg-zinc-200 transition-colors text-lg disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isLoading ? 'Thinking...' : 'Ask Gemini'}
                        </button>
                    </div>
                    
                    {isLoading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 dark:border-zinc-100 mx-auto"></div>
                            <p className="mt-4 text-stone-600 dark:text-zinc-400">Fetching your answer...</p>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-200 rounded-r-lg" role="alert">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {response && !isLoading && (
                        <div className="mt-6 pt-6 border-t dark:border-zinc-700">
                            <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-4">Gemini's Answer</h2>
                            <div 
                                className="prose dark:prose-invert max-w-none text-stone-800 dark:text-zinc-200"
                                dangerouslySetInnerHTML={{ __html: parsedResponse }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeminiView;