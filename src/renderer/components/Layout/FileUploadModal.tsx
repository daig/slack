import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { gql, useMutation } from '@apollo/client';

const GENERATE_PRESIGNED_URL = gql`
  mutation GenerateS3PresignedUrl($input: GenerateS3PresignedUrlInput!) {
    generateS3PresignedUrl(input: $input) {
      s3PresignedUrlResponse {
        presignedUrl
        fileKey
        bucket
      }
    }
  }
`;

const INDEX_DOCUMENT = gql`
  mutation IndexDocument($input: IndexDocumentInput!) {
    indexDocument(input: $input)
  }
`;

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  userId: string;
  onUploadComplete: (file: File, uploadInfo: { fileKey: string; bucket: string; contentType: string }) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  channelId,
  userId,
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const [generatePresignedUrl] = useMutation(GENERATE_PRESIGNED_URL);
  const [indexDocument] = useMutation(INDEX_DOCUMENT);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Get presigned URL
      const { data } = await generatePresignedUrl({
        variables: {
          input: {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            contentType: selectedFile.type
          }
        }
      });

      const { presignedUrl, fileKey, bucket } = data.generateS3PresignedUrl.s3PresignedUrlResponse;

      // Upload the file using the presigned URL
      await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      // Read file content for indexing
      const fileContent = await selectedFile.text();
      
      // Index the document
      await indexDocument({
        variables: {
          input: {
            fileKey,
            bucket,
            content: fileContent,
            metadata: {
              fileName: selectedFile.name,
              contentType: selectedFile.type,
              uploadedBy: userId,
              uploadedAt: new Date().toISOString()
            }
          }
        }
      });

      onUploadComplete(selectedFile, {
        fileKey,
        bucket,
        contentType: selectedFile.type
      });

      setUploadStatus('File uploaded and indexed successfully!');

    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 w-full">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Upload File
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">Any file up to 10MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="text-sm text-gray-500">
                Selected file: {selectedFile.name}
              </div>
            )}

            {uploadStatus && (
              <div className={`text-sm ${uploadStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {uploadStatus}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 