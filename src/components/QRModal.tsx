'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  storeName: string;
}

export default function QRModal({ open, onClose, url, storeName }: QRModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = `${storeName}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-auto bg-[var(--color-surface)] rounded-2xl z-50 p-8 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-[var(--font-sans)] mb-3">
              Código QR
            </h3>
            <p className="text-base text-[var(--color-text-tertiary)] mb-6">
              Imprime este código para tu local o tarjeta
            </p>

            <div className="bg-white p-6 rounded-xl inline-block mb-6">
              <QRCodeSVG
                id="qr-code"
                value={url}
                size={200}
                level="M"
                includeMargin
                fgColor="#1C1917"
                bgColor="#FFFFFF"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-base hover:bg-[var(--color-surface-elevated)] transition-colors"
              >
                {copied ? '¡Copiado!' : <><Copy className="w-4 h-4" /> Copiar link</>}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-text-primary)] text-white rounded-lg text-base hover:bg-[var(--color-text-primary)]/90 transition-colors"
              >
                <Download className="w-4 h-4" /> Descargar PNG
              </button>
            </div>

            <p className="text-sm text-[var(--color-text-tertiary)] mt-4 truncate max-w-xs mx-auto">
              {url}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
