import React, { useState } from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  TelegramIcon,
  LinkedinIcon,
} from 'next-share';
import { motion } from 'framer-motion';
// Replace react-icons imports with MUI
import { IconButton, Typography, TextField, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface ShareProps {
  url: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

const Share: React.FC<ShareProps> = ({ url, title, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative max-w-md w-full rounded-xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#0f0f0f', 
          border: '1px solid #123123' 
        }}
      >
        <div className="flex justify-between items-center mb-5">
          <Typography variant="h5" component="h3" fontWeight={600} sx={{ color: 'white' }}>
            Share
          </Typography>
          
          <IconButton
            onClick={onClose}
            size="medium"
            aria-label="Close"
            sx={{
              color: 'white',
              '&:hover': {
                color: 'grey.300',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-6">
          <div className="flex flex-col items-center gap-1">
            <FacebookShareButton url={url} quote={title}>
              <FacebookIcon size={48} round />
            </FacebookShareButton>
            <span className="text-xs text-white">Facebook</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <TwitterShareButton url={url} title={title}>
              <TwitterIcon size={48} round />
            </TwitterShareButton>
            <span className="text-xs text-white">Twitter</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <WhatsappShareButton url={url} title={title} separator=":: ">
              <WhatsappIcon size={48} round />
            </WhatsappShareButton>
            <span className="text-xs text-white">WhatsApp</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <TelegramShareButton url={url} title={title}>
              <TelegramIcon size={48} round />
            </TelegramShareButton>
            <span className="text-xs text-white">Telegram</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <LinkedinShareButton url={url}>
              <LinkedinIcon size={48} round />
            </LinkedinShareButton>
            <span className="text-xs text-white">LinkedIn</span>
          </div>
        </div>
        
        <div className="relative">
          <TextField
            fullWidth
            value={url}
            variant="outlined"
            InputProps={{
              readOnly: true,
              style: { color: 'white' },
              endAdornment: (
                <IconButton 
                  onClick={copyToClipboard} 
                  edge="end"
                  size="small"
                  aria-label="Copy link"
                  sx={{ color: 'white' }}
                >
                  <ContentCopyIcon />
                </IconButton>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
              }
            }}
          />
        </div>
        
        {copied && (
          <Typography 
            variant="body2" 
            align="center"
            sx={{ 
              mt: 1, 
              color: 'success.main'
            }}
          >
            Link copied to clipboard!
          </Typography>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Share;
