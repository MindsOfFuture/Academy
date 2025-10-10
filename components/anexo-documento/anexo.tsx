"use client";

import React, { useRef, useState } from "react";

const AnexoUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleButtonClick}
        className="bg-[#6C3BAA] text-white px-6 py-2 rounded-full shadow-md hover:bg-[#592f8d] transition-colors"
      >
        Selecionar arquivo
      </button>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {fileName && (
        <p className="text-sm text-gray-700">
          Arquivo selecionado: <span className="font-medium">{fileName}</span>
        </p>
      )}
    </div>
  );
};

export default AnexoUpload;
