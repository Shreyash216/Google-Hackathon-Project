import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ImageResolution } from '../types';
import { IconSparkles, IconLoader, IconImage, IconDownload, IconKey } from './Icons';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<ImageResolution>(ImageResolution.RES_1K);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true); // Optimistic initially

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleConnectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setGeneratedImages([]);

    try {
      // Must instantiate here to get the potentially newly selected key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            imageSize: resolution, // '1K', '2K', or '4K'
            aspectRatio: "1:1"
          }
        }
      });

      const images: string[] = [];
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            images.push(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
          }
        }
      }
      setGeneratedImages(images);
    } catch (error) {
      console.error("Image generation failed", error);
      // If error suggests auth issue, reset key state
      if (JSON.stringify(error).includes("Requested entity was not found")) {
         setHasApiKey(false);
         handleConnectKey(); // Retry prompt immediately
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-md text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconKey className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Pro Feature Access</h2>
          <p className="text-slate-600 mb-8">
            Generating high-quality educational illustrations requires a connected API key from a paid GCP project.
          </p>
          <button
            onClick={handleConnectKey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Connect Account
          </button>
          <div className="mt-4 text-xs text-slate-400">
            See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-500">billing documentation</a> for details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 h-full">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <IconImage className="text-indigo-600" />
            Educational Illustrator (Nano Banana Pro)
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the educational image you need (e.g., 'A labeled cross-section of a volcano')"
                className="flex-1 p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
                {Object.values(ImageResolution).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                      resolution === res 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 w-full sm:w-auto self-end"
            >
              {isLoading ? <IconLoader className="animate-spin" /> : <IconSparkles />}
              Generate Illustration
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden">
           {isLoading ? (
             <div className="flex flex-col items-center animate-pulse text-indigo-600">
               <IconLoader className="w-12 h-12 animate-spin mb-4" />
               <p className="font-medium">Creating your artwork...</p>
             </div>
           ) : generatedImages.length > 0 ? (
             <div className="w-full h-full p-4 grid place-items-center">
               {generatedImages.map((img, idx) => (
                 <div key={idx} className="relative group max-w-full max-h-full">
                   <img 
                    src={img} 
                    alt={`Generated ${idx}`} 
                    className="max-w-full max-h-[60vh] rounded-lg shadow-xl"
                   />
                   <a 
                    href={img} 
                    download={`page-genius-${idx}.png`}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-slate-800 hover:text-indigo-600"
                   >
                     <IconDownload className="w-5 h-5" />
                   </a>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-slate-400 text-center p-6">
               <IconImage className="w-16 h-16 mx-auto mb-4 opacity-20" />
               <p>Enter a prompt to generate high-resolution educational assets.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};