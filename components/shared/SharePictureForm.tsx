import React, { useState } from 'react';
import { auth } from '../../firebase/config';
import { uploadSharedPicture } from '../../firebase/firestoreService';
import { useToast } from '../../context/ToastContext';

interface SharePictureFormProps {
    onSuccess: () => void;
}

const SharePictureForm: React.FC<SharePictureFormProps> = ({ onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { addToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            addToast('Please select a file first', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const authorName = auth?.currentUser?.displayName || 'Anonymous';
            const authorId = auth?.currentUser?.uid || 'anonymous';
            
            await uploadSharedPicture(file, authorName, authorId);
            
            addToast('Picture shared successfully!', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error uploading picture:', error);
            addToast('Failed to upload picture. Please try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-stone-600 dark:text-zinc-300">
                We'd love to see your moments at Realife Cafe! Upload a picture to share with our community.
            </p>
            <div className="relative">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stone-50 dark:file:bg-zinc-600 file:text-stone-700 dark:file:text-zinc-200 hover:file:bg-stone-100 dark:hover:file:bg-zinc-500"
                    disabled={isUploading}
                />
            </div>
            {file && (
                <div className="mt-2">
                    <p className="text-xs text-stone-400">Selected: {file.name}</p>
                </div>
            )}
            <button 
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`w-full py-2 rounded-md font-semibold transition-colors ${
                    isUploading 
                    ? 'bg-stone-300 cursor-not-allowed' 
                    : 'bg-[#A58D79] hover:bg-[#947D6A] text-white dark:bg-zinc-100 dark:text-zinc-800 dark:hover:bg-zinc-200'
                }`}
            >
                {isUploading ? 'Uploading...' : 'Share Picture'}
            </button>
        </div>
    );
};

export default SharePictureForm;
