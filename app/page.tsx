'use client';

import React, { useState } from 'react';
import {
  Button,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Box,
  Paper,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';

export default function DiagnoseHeartPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState<any[]>([]); // Store multiple diagnosis results
  const [tableData, setTableData] = useState<any[][] | null>(null); // Store extracted table from PDF
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPdfFile(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidImage(file)) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Create an image preview
    } else {
      alert('❌ Please upload a valid image file (PNG, JPG, JPEG).');
    }
  };

  // Helper function to validate the image format
  const isValidImage = (file: File) => {
    const validFormats = ['image/png', 'image/jpeg', 'image/jpg'];
    return validFormats.includes(file.type);
  };

  // Function to handle the diagnosis request
  const handleSubmit = async () => {
    if (!imageFile) return;  // Ensure an image is uploaded
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);  // Append the image file to formData
      if (pdfFile) formData.append("pdf", pdfFile);    // Append PDF file if uploaded

      // Send the POST request with the image and pdf file
      const response = await fetch('https://e560-197-39-105-104.ngrok-free.app/predict', {
        method: 'POST',
        body: formData, // Automatically sets the Content-Type to multipart/form-data
      });

      // Log the response for debugging
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        alert("❌ " + (errorData.error || "Unknown error"));
        setIsProcessing(false);
        return;
      }

      const data = await response.json();
      console.log("Backend response:", data);  // Log the backend data for debugging

      if (data.success) {
        const newDiagnosis = {
          prediction: data.prediction,
          confidence: data.confidence,
          imagePreview,
        };
        setDiagnosisData((prevData) => [...prevData, newDiagnosis]); // Add new diagnosis to the list
      } else {
        alert("❌ Unable to diagnose. Please try again.");
      }

      // Handle PDF data (extracting table)
      if (pdfFile) {
        const pdfResponse = await fetch("http://localhost:5000/extract-table", {
          method: "POST",
          body: formData,
        });

        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.json();
          setTableData(pdfData.table); // Set the extracted table
        } else {
          const errorData = await pdfResponse.json();
          alert("❌ " + (errorData.error || "Unknown error"));
        }
      }
    } catch (err) {
      console.error('Error submitting image or PDF:', err);
      alert("❌ Failed to connect to the backend. Please check the console for more details.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to clear the specific diagnosis card
  const handleClear = (index: number) => {
    setDiagnosisData((prevData) => prevData.filter((_, i) => i !== index)); // Remove the specific card
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
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
              >
                Upload Retinal Scan Image
                <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
              </Button>
              {imageFile && <p className="text-sm text-gray-700 mt-2">{imageFile.name}</p>}
            </div>
            <div>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
              >
                Upload PDF File (Optional)
                <input hidden type="file" accept="application/pdf" onChange={handlePdfUpload} />
              </Button>
              {pdfFile && <p className="text-sm text-gray-700 mt-2">{pdfFile.name}</p>}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            variant="contained"
            color="success"
            fullWidth
            className="mt-2"
            disabled={isProcessing || !imageFile}
          >
            {isProcessing ? <CircularProgress size={24} /> : '💡 Diagnose'}
          </Button>
        </div>

        {/* Display Multiple Diagnosis Cards */}
        {diagnosisData.length > 0 && diagnosisData.map((data, index) => (
          <Card key={index} elevation={3} className="mt-8 p-6 rounded-2xl bg-green-50 border border-green-200">
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🧠 Diagnosis Result {index + 1}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Prediction: </strong>{data.prediction}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Confidence: </strong>{data.confidence ? (data.confidence * 100).toFixed(2) : 'N/A'}%
                </Typography>
              </Box>

              {/* Display the image preview next to the text */}
              {data.imagePreview && (
                <Box ml={2} sx={{ width: 120, height: 120 }}>
                  <img src={data.imagePreview} alt="Uploaded Scan" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => handleClear(index)}>Clear</Button>
            </CardActions>
          </Card>
        ))}

        {/* Display the PDF table data */}
        <br></br>
        {tableData && (
          <Paper elevation={3} className="p-6 rounded-2xl mb-10 overflow-x-auto">
            <Typography variant="h6" fontWeight={700} gutterBottom>
              📊 Extracted Patient Data from PDF
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
      </div>
    </div>
  );
}
