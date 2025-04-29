"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aiGenerationService } from '@/services/ai_gen.service';
import { AuthService } from '@/services/auth.service';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ShareIcon from '@mui/icons-material/Share';
import Image from 'next/image';
import Share from '@/components/Share';

interface ImageHistoryItem {
  prompt: string;
  style_preset: string;
  filename: string;
  file_path: string;
  output_format: string;
  timestamp: number;
  user_id: string;
  metadata_file: string;
  generation_id: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ImageHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const fetchImageHistory = async () => {
      try {
        setLoading(true);
        
        // Get authentication credentials
        const authService = new AuthService();
        const user = await authService.getCurrentUser();
        
        if (!user || !user.email) {
          throw new Error('User not authenticated');
        }
        
        const response = await aiGenerationService.getImageHistory(
          user.email,
          user.password || ''
        );
        
        if (response.code === 200 && response.data) {
          setImages(response.data);
        } else {
          setError('Failed to load image history');
        }
      } catch (err) {
        console.error('Error fetching image history:', err);
        setError('Error loading your images. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImageHistory();
  }, []);

  const handleImageClick = (image: ImageHistoryItem) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleDownload = (image: ImageHistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.file_path;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (image: ImageHistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const imageUrl = 'https://imageni.org' + image.file_path;
    setShareUrl(imageUrl);
    setShareOpen(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.1252 20.9999C15.9332 20.9999 15.7412 20.9264 15.5949 20.7802L7.34494 12.5302C7.05169 12.2369 7.05169 11.7629 7.34494 11.4697L15.5949 3.21969C15.8882 2.92644 16.3622 2.92644 16.6554 3.21969C16.9487 3.51294 16.9487 3.98694 16.6554 4.28019L8.93569 11.9999L16.6554 19.7197C16.9487 20.0129 16.9487 20.4869 16.6554 20.7802C16.5092 20.9264 16.3172 20.9999 16.1252 20.9999Z" fill="#F0F6F3"/>
            </svg>
          </button>
        </div>
        
        {/* Center title */}
        <h2 className="text-[18px] leading-[24px] font-semibold text-center">
          История генераций
        </h2>
        
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/home')} 
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_1490_514" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="3" y="3" width="18" height="18">
                <path d="M3 3H21V21H3V3Z" fill="white"/>
              </mask>
              <g mask="url(#mask0_1490_514)">
                <path d="M12.4411 4.64344C12.1782 4.45219 11.8219 4.45219 11.5589 4.64344L3.30892 10.6435C3.0462 10.8345 2.93635 11.173 3.03681 11.4819C3.13727 11.7909 3.4252 12 3.75005 12H5.25005V18.75C5.25005 19.1642 5.58583 19.5 6.00005 19.5H18.0001C18.4143 19.5 18.7501 19.1642 18.7501 18.75V12H20.2501C20.5749 12 20.8628 11.7909 20.9633 11.4819C21.0637 11.173 20.9539 10.8345 20.6912 10.6435L12.4411 4.64344Z" fill="#F0F6F3"/>
              </g>
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#58E877] mb-4"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center my-8">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => router.push('/home')}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Вернуться на главную
            </button>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center my-12">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.05176 11.5C3.27428 8.31764 5.33646 5.6277 8.23965 4.49587C11.1428 3.36404 14.4569 4.00002 16.75 6.00002" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.9482 11.5C20.7257 14.6824 18.6635 17.3723 15.7604 18.5042C12.8572 19.636 9.54311 19 7.25 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 3L21 6L17 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 21L3 18L7 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">История пуста</h3>
            <p className="text-white/60 mb-6">У вас пока нет сгенерированных изображений</p>
            <button 
              onClick={() => router.push('/ai_gen')} 
              className="px-5 py-3 bg-gradient-to-r from-[#58E877] to-[#FFFBA1] text-black font-medium rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Сгенерировать изображение
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-medium mb-4">Ваши изображения</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className="relative group cursor-pointer rounded-lg overflow-hidden bg-white/5 aspect-square"
                  onClick={() => handleImageClick(image)}
                >
                  <img 
                    src={image.file_path} 
                    alt={image.prompt.substring(0, 20) + '...'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button 
                        className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                        onClick={(e) => handleDownload(image, e)}
                      >
                        <CloudDownloadIcon sx={{ fontSize: 16, color: 'white' }} />
                      </button>
                      <button 
                        className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                        onClick={(e) => handleShare(image, e)}
                      >
                        <ShareIcon sx={{ fontSize: 16, color: 'white' }} />
                      </button>
                    </div>
                    <p className="text-sm line-clamp-2">{image.prompt}</p>
                    <div className="text-xs text-white/70 mt-1">{formatDate(image.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      
      {/* Image preview modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#151515] rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors z-10"
              onClick={handleCloseModal}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 4L12 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className="flex flex-col md:flex-row h-full">
              <div className="relative flex-1 bg-black flex items-center justify-center">
                <img 
                  src={selectedImage.file_path} 
                  alt={selectedImage.prompt}
                  className="max-h-[60vh] md:max-h-[80vh] w-auto object-contain"
                />
                <div className="absolute bottom-4 right-4 flex space-x-2">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <CloudDownloadIcon sx={{ fontSize: 20, color: 'white' }} />
                  </button>
                  <button
                    onClick={() => handleShare(selectedImage)}
                    className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ShareIcon sx={{ fontSize: 20, color: 'white' }} />
                  </button>
                </div>
              </div>
              
              <div className="w-full md:w-80 p-5 overflow-y-auto flex flex-col">
                <h3 className="text-lg font-medium mb-1">Информация о изображении</h3>
                <p className="text-sm text-white/70 mb-4">{formatDate(selectedImage.timestamp)}</p>
                
                <div className="mb-4">
                  <h4 className="text-xs uppercase text-white/50 mb-1">Промпт</h4>
                  <p className="text-sm">{selectedImage.prompt}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-xs uppercase text-white/50 mb-1">Стиль</h4>
                  <p className="text-sm capitalize">{selectedImage.style_preset}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-xs uppercase text-white/50 mb-1">Формат</h4>
                  <p className="text-sm uppercase">{selectedImage.output_format}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Share component */}
      <Share 
        isOpen={shareOpen} 
        onClose={() => setShareOpen(false)} 
        url={shareUrl} 
        title="Check out this AI-generated image!"
      />
    </div>
  );
}
