import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Chapter {
  title: string;
  summary: string;
  content: string; // The text script for this chapter
  durationEstimate: string;
}

export interface PodcastScript {
  title: string;
  summary: string; // Global summary of the PDF
  chapters: Chapter[];
}

export const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'] as const;
export type Voice = typeof VOICES[number];

export const EMOTIONS = ['Neutral', 'Happy', 'Curious', 'Serious', 'Excited', 'Soothing'] as const;
export type Emotion = typeof EMOTIONS[number];

export async function generatePodcastScript(text: string): Promise<PodcastScript> {
  // Truncate text if it's extremely long to avoid context limits, though Flash 2.5 is huge.
  // Let's keep it reasonable (e.g. ~100k chars for now to be safe and fast).
  const truncatedText = text.slice(0, 200000); 

  const prompt = `
    You are an expert podcast producer. Convert the following text (extracted from a PDF) into a structured podcast script.
    
    First, provide a concise **Global Summary** of the entire document (3-5 sentences) highlighting the key topics and main takeaways.
    
    Then, break the content down into logical "lessons" or "chapters".
    For each chapter, provide:
    1. A catchy Title.
    2. A brief Summary (1-2 sentences).
    3. The Content: This should be written as a monologue script for a podcaster. It should be engaging, conversational, and educational. 
       Do NOT include "Host:" prefixes. Just the spoken text.
    
    Return the result as a JSON object with the following structure:
    {
      "title": "Overall Podcast Title",
      "summary": "Global summary of the document...",
      "chapters": [
        {
          "title": "Chapter Title",
          "summary": "Chapter Summary",
          "content": "The spoken script text...",
          "durationEstimate": "e.g. 2 mins"
        }
      ]
    }

    Input Text:
    ${truncatedText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  let jsonText = response.text;
  if (!jsonText) throw new Error("No response from Gemini");

  // Clean up markdown code blocks if present
  jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(jsonText) as PodcastScript;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    console.log("Raw response:", jsonText);
    throw new Error("Failed to generate script structure");
  }
}

export async function generateAudio(text: string, voice: Voice, emotion: Emotion): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text is empty");
  }

  // Construct the prompt with emotion
  const promptText = emotion === 'Neutral' ? text : `Say ${emotion.toLowerCase()}ly: ${text}`;

  console.log(`Generating audio with voice: ${voice}, emotion: ${emotion}, text length: ${promptText.length}`);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      console.error("Gemini response missing audio data:", response);
      throw new Error("Failed to generate audio: No audio data in response");
    }

    // Gemini TTS returns raw PCM (Linear16) at 24kHz. 
    // We need to wrap it in a WAV header for the <audio> tag to play it.
    const pcmData = base64ToUint8Array(base64Audio);
    const wavData = addWavHeader(pcmData, 24000, 1, 16);
    const base64Wav = uint8ArrayToBase64(wavData);

    return `data:audio/wav;base64,${base64Wav}`;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
}

// --- Audio Helpers ---

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function addWavHeader(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitDepth: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  const headerBytes = new Uint8Array(header);
  const wavBytes = new Uint8Array(header.byteLength + pcmData.length);
  wavBytes.set(headerBytes, 0);
  wavBytes.set(pcmData, headerBytes.length);

  return wavBytes;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
