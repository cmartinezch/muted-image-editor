import React, { useCallback } from 'react';

interface UploaderProps {
  onImageUpload: (file: File) => void;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);


const Uploader: React.FC<UploaderProps> = ({ onImageUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        onImageUpload(file);
    }
  }, [onImageUpload]);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };


  return (
    <div className="flex-grow flex items-center justify-center">
        <div 
            className="w-full max-w-2xl p-8 text-center bg-transparent border border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors duration-300"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <div className="flex flex-col items-center justify-center">
                <UploadIcon />
                <h3 className="mt-4 text-2xl font-serif text-foreground">Drag & drop an image or click to upload</h3>
                <p className="mt-1 text-sm text-muted">PNG, JPG, or WEBP supported</p>
                <input
                    type="file"
                    id="file-input"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    </div>
  );
};

export default Uploader;