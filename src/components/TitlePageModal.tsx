import React from 'react';
import { X, Upload } from 'lucide-react';

interface TitlePage {
  title: string;
  author: string;
  contact: string;
  date: string;
  draft: string;
  copyright: string;
  coverImage?: string;
}

interface TitlePageModalProps {
  show: boolean;
  onClose: () => void;
  titlePage: TitlePage;
  setTitlePage: (titlePage: TitlePage) => void;
  setTitle: (title: string) => void;
}

export const TitlePageModal: React.FC<TitlePageModalProps> = ({
  show,
  onClose,
  titlePage,
  setTitlePage,
  setTitle
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div
        className="my-8 bg-white rounded-lg shadow-xl w-[210mm] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="sticky top-4 right-4 float-right text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="title-page p-12 space-y-12">
          <div 
            className={`flex flex-col items-center gap-8 ${
              !titlePage.coverImage ? 'min-h-[100px]' : ''
            }`}
          >
            {titlePage.coverImage ? (
              <div className="relative group">
                <img
                  src={titlePage.coverImage}
                  alt="Cover"
                  className="max-w-full h-auto max-h-[297mm] rounded-lg shadow-md"
                />
                <button
                  onClick={() => setTitlePage(prev => ({ ...prev, coverImage: '' }))}
                  className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="w-full max-w-md h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 transition-colors border-gray-300 hover:border-gray-400"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-sm text-gray-500 text-center">
                  <p>Drop your cover image here, or</p>
                  <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                    browse
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const result = e.target?.result as string;
                            setTitlePage(prev => ({ ...prev, coverImage: result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
            <input
              type="text"
              value={titlePage.title}
              onChange={(e) => {
                setTitlePage(prev => ({ ...prev, title: e.target.value }));
                setTitle(e.target.value);
              }}
              className="w-full text-center text-3xl uppercase font-bold bg-transparent border-none focus:outline-none hover:bg-gray-50 p-3 rounded"
              placeholder="TITLE"
            />
          </div>

          <div className="grid gap-8 max-w-xl mx-auto">
            <input
              type="text"
              value={titlePage.author}
              onChange={(e) => setTitlePage(prev => ({ ...prev, author: e.target.value }))}
              className="text-center bg-transparent border-none focus:outline-none hover:bg-gray-50 p-2 rounded text-lg"
              placeholder="written by"
            />
            <div className="grid grid-cols-2 gap-6">
              <input
                type="text"
                value={titlePage.draft}
                onChange={(e) => setTitlePage(prev => ({ ...prev, draft: e.target.value }))}
                className="text-center bg-transparent border-none focus:outline-none hover:bg-gray-50 p-2 rounded"
                placeholder="Draft Version"
              />
              <input
                type="text"
                value={titlePage.date}
                onChange={(e) => setTitlePage(prev => ({ ...prev, date: e.target.value }))}
                className="text-center bg-transparent border-none focus:outline-none hover:bg-gray-50 p-2 rounded"
                placeholder="Date"
              />
            </div>
            <input
              type="text"
              value={titlePage.contact}
              onChange={(e) => setTitlePage(prev => ({ ...prev, contact: e.target.value }))}
              className="text-center bg-transparent border-none focus:outline-none hover:bg-gray-50 p-2 rounded"
              placeholder="Contact Information"
            />
            <input
              type="text"
              value={titlePage.copyright}
              onChange={(e) => setTitlePage(prev => ({ ...prev, copyright: e.target.value }))}
              className="text-center bg-transparent border-none focus:outline-none hover:bg-gray-50 p-2 rounded"
              placeholder="Copyright"
            />
          </div>
        </div>
      </div>
    </div>
  );
};