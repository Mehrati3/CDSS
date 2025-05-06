'use client';

import React, { useState } from 'react';
import {
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ImageIcon from '@mui/icons-material/Image';

export default function DiagnoseHeartPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tableData, setTableData] = useState<any[][] | null>(null);
  const [diagnosis, setDiagnosis] = useState<string>('');

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const handleSubmit = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);

      const response = await fetch("http://localhost:5000/extract-table", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("❌ " + (errorData.error || "Unknown error"));
        setIsProcessing(false);
        return;
      }

      const data = await response.json();
      setTableData(data.table);
      setDiagnosis(data.diagnosis || "✅ Table extracted.");
    } catch (err) {
      console.error("Error submitting PDF:", err);
      alert("❌ Failed to connect to the backend.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-10 tracking-tight">
          🫀 Heart Disease Diagnostic Assistant
        </h1>

        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-xl p-8 mb-10 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                fullWidth
              >
                Upload PDF with Patient Data
                <input hidden type="file" accept="application/pdf" onChange={handlePdfUpload} />
              </Button>
              {pdfFile && <p className="text-sm text-gray-700 mt-2">{pdfFile.name}</p>}
            </div>

            <div>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
              >
                Upload Scan Image
                <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
              </Button>
              {imageFile && <p className="text-sm text-gray-700 mt-2">{imageFile.name}</p>}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            variant="contained"
            color="success"
            fullWidth
            className="mt-2"
            disabled={isProcessing || !pdfFile}
          >
            {isProcessing ? <CircularProgress size={24} /> : '💡 Diagnose'}
          </Button>
        </div>

        {tableData && (
          <Paper elevation={3} className="p-6 rounded-2xl mb-10 overflow-x-auto">
            <Typography variant="h6" fontWeight={700} gutterBottom>
              📊 Extracted Patient Data
            </Typography>
            <table className="min-w-full border-collapse border border-gray-300 mt-4">
              <tbody>
                {tableData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="odd:bg-white even:bg-gray-50">
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-medium"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        )}

        {diagnosis && (
          <Paper elevation={2} className="p-6 rounded-2xl bg-green-50 border border-green-200">
            <Typography variant="h6" fontWeight={700} gutterBottom>
              🧠 Diagnosis Result
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {diagnosis}
            </Typography>
          </Paper>
        )}
      </div>
    </div>
  );
}
