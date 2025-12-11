import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import html2canvas from 'html2canvas';
import { IconUpload, IconLoader, IconBook, IconSparkles, IconDownload } from './Icons';

const SYSTEM_PROMPT = `
**System Role:** You are an expert, comprehensive, multi-modal educational assistant named 'Page Genius'. Your mission is to analyze an uploaded image of a textbook page, extract the core academic question, solve it completely, and generate five distinct, structured educational resources based on the content.

**STRICT FORMATTING RULE: ABSOLUTELY NO LaTeX, TeX, or mathematical rendering syntax is permitted ANYWHERE in your response.** This includes, but is not limited to:
* Dollar signs (\`$\`, \`$$\`) for math.
* Backslashes (\`\\\`) for commands (e.g., \`\\begin{array}\`, \`\\hline\`, \`\\times\`, \`\\text{...}\`).
* Use simple plain text for equations (e.g., write 'x + 7' instead of '$x + 7$').
* Use standard Markdown tables and lists for structure.

**Input:** An image of a textbook page (which may contain text, diagrams, and one or more questions).

**Task Instructions (Perform in Sequence):**

1.  **Extraction:** Identify and state the single primary question or problem presented in the image clearly.
2.  **Visualization:** Before the steps, create a simple visualization (using a standard Markdown table) of any key conceptual structure (e.g., calendar grid, graph, or diagram) related to the problem.
3.  **Solution:** Provide the mathematically or conceptually accurate and complete solution to the extracted question.
4.  **Explanation:** Explain the solution methodology in a clear, easy-to-follow, step-by-step format, suitable for a student learning the topic for the first time.
5.  **Quiz Generation:** Create a short, 3-question multiple-choice quiz focused on the core concepts required to solve the problem. Include the correct answer for each question.
6.  **Video Script:** Write a concise, engaging script for a 60-second educational video explaining the main concept *behind* the question. The script must include spoken narration and brief visual cues/calls to action for clarity.

**Strict Output Format:**

Present all six results under the following mandatory Markdown headings. Do not include any introductory or concluding text outside of these sections.

## 1. Extracted Question

[The clear statement of the question/problem.]

## 2. Visualization

[The simple, standard Markdown table showing the structure. If a table is not applicable, use a simple bulleted list.]

## 3. Detailed Solution

[The complete, accurate solution, using only plain text for all math.]

## 4. Step-by-Step Explanation

[The detailed, numbered steps for solving the problem. All math must be plain text.]

## 5. Concept Quiz (3 Questions)

[Three multiple-choice questions with options and the correct answer indicated. All math must be plain text.]

## 6. 60-Second Video Script

[The script, broken down into two columns (TIME/VISUAL and NARRATION) using a standard Markdown table.]
`;

export const Analyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Create fresh instance to ensure we capture env
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = await blobToBase64(file);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // High reasoning model
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: file.type,
                data: base64Data
              }
            },
            {
              text: "Analyze this page according to your instructions."
            }
          ]
        }
      });

      if (response.text) {
        setResult(response.text);
      }
    } catch (error) {
      console.error("Analysis failed", error);
      setResult("Sorry, I encountered an error analyzing the image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = async () => {
    if (!resultRef.current) return;
    
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = 'page-genius-notes.png';
      link.click();
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export image. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col md:flex-row gap-6">
        
        {/* Left Column: Upload & Preview */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 h-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <IconBook className="text-indigo-600" />
              Upload Page
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Take a photo or upload a screenshot of your textbook page.
            </p>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              ref={fileInputRef}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer bg-slate-50"
            >
              <IconUpload className="w-8 h-8 mb-2" />
              <span className="font-medium">Click to Upload</span>
            </button>
          </div>

          {previewUrl && (
            <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative min-h-[200px]">
              <img 
                src={previewUrl} 
                alt="Textbook Preview" 
                className="w-full h-full object-contain absolute inset-0"
              />
              {!result && !isAnalyzing && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%]">
                   <button 
                    onClick={handleAnalyze}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <IconSparkles className="w-5 h-5" />
                    Analyze Page
                  </button>
                </div>
               
              )}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          {!result && !isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <IconBook className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Ready to learn?</p>
              <p className="text-sm">Upload an image to generate solutions, quizzes, and videos.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-indigo-600 p-8">
              <IconLoader className="w-12 h-12 animate-spin mb-4" />
              <p className="text-lg font-medium animate-pulse">Analyzing content...</p>
              <p className="text-sm text-slate-500 mt-2">Solving problems and generating resources.</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col h-full overflow-hidden">
               {/* Export Header */}
               <div className="flex-shrink-0 p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Result</span>
                  <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <IconDownload className="w-4 h-4" />
                    Export Notes
                  </button>
               </div>
               
               {/* Content Area */}
               <div className="flex-1 overflow-y-auto">
                 <div ref={resultRef} className="p-8 prose prose-slate max-w-none bg-white min-h-full">
                   <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                     {/* Basic rendering of the strict markdown structure */}
                     {result.split('## ').map((section, index) => {
                       if (index === 0) return null; // Skip pre-text if any
                       const [title, ...content] = section.split('\n');
                       return (
                         <div key={index} className="mb-8 break-inside-avoid">
                           <h3 className="text-xl font-bold text-indigo-900 border-b border-indigo-100 pb-2 mb-4">
                             {title.trim()}
                           </h3>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             {content.join('\n').trim()}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   {/* Branding Footer for export */}
                   <div className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-400 text-xs">
                     Generated by Page Genius
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};