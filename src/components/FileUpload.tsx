import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: isProcessing,
  });

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md",
          isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-gray-300 hover:border-indigo-400",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-lg font-medium text-gray-700">Analyzing PDF & Writing Script...</p>
            <p className="text-sm text-gray-500">This usually takes about 10-20 seconds.</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
              {isDragActive ? (
                <FileText className="w-8 h-8 text-indigo-600" />
              ) : (
                <Upload className="w-8 h-8 text-indigo-600" />
              )}
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-800 mb-2">
                {isDragActive ? "Drop your PDF here" : "Upload a PDF"}
              </p>
              <p className="text-gray-500">
                Drag & drop or click to select a file
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
