import React from 'react';

const Spinner: React.FC = () => (
  <svg className="animate-spin h-12 w-12 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PlaceholderIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);


interface ImageDisplayProps {
  title: string;
  imageUrl: string | null;
  isLoading?: boolean;
  onReset?: () => void;
  onResetEdits?: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ title, imageUrl, isLoading = false, onReset, onResetEdits }) => {
  return (
    <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif text-foreground">{title}</h2>
            {onReset && (
                <button 
                  onClick={onReset} 
                  className="text-sm text-muted hover:text-foreground transition duration-200"
                >
                  Change Image
                </button>
            )}
            {onResetEdits && (
                <button
                  onClick={onResetEdits}
                  className="text-sm text-muted hover:text-foreground transition duration-200"
                >
                  Reset Edits
                </button>
            )}
        </div>
      <div className="aspect-square w-full bg-transparent border border-dashed border-border rounded-lg flex items-center justify-center overflow-hidden relative">
        {isLoading ? (
          <Spinner />
        ) : imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
        ) : (
          <div className="text-center text-muted flex flex-col items-center">
            <PlaceholderIcon />
            <p className="mt-2 text-sm">Edited image will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDisplay;