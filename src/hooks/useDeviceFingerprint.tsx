import { useState, useEffect } from 'react';

// Generate a device fingerprint based on browser/device characteristics
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateFingerprint().then((fp) => {
      setFingerprint(fp);
      setIsLoading(false);
    });
  }, []);

  return { fingerprint, isLoading };
}

async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen properties
  components.push(`screen:${window.screen.width}x${window.screen.height}`);
  components.push(`colorDepth:${window.screen.colorDepth}`);
  components.push(`pixelRatio:${window.devicePixelRatio}`);

  // Timezone
  components.push(`timezone:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  components.push(`tzOffset:${new Date().getTimezoneOffset()}`);

  // Language
  components.push(`lang:${navigator.language}`);
  components.push(`langs:${navigator.languages?.join(',') || ''}`);

  // Platform
  components.push(`platform:${navigator.platform}`);
  components.push(`userAgent:${navigator.userAgent}`);

  // Hardware concurrency
  components.push(`cores:${navigator.hardwareConcurrency || 'unknown'}`);

  // Touch support
  components.push(`touch:${('ontouchstart' in window) ? 'yes' : 'no'}`);
  components.push(`maxTouch:${navigator.maxTouchPoints || 0}`);

  // Canvas fingerprint
  try {
    const canvasFingerprint = await getCanvasFingerprint();
    components.push(`canvas:${canvasFingerprint}`);
  } catch {
    components.push('canvas:error');
  }

  // WebGL vendor/renderer
  try {
    const webglInfo = getWebGLInfo();
    components.push(`webgl:${webglInfo}`);
  } catch {
    components.push('webgl:error');
  }

  // Audio context fingerprint
  try {
    const audioFingerprint = await getAudioFingerprint();
    components.push(`audio:${audioFingerprint}`);
  } catch {
    components.push('audio:error');
  }

  // Generate hash from all components
  const fingerprintString = components.join('|');
  const hash = await hashString(fingerprintString);
  
  return hash;
}

async function getCanvasFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return 'no-context';

  // Draw some text and shapes
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(0, 0, 100, 25);
  ctx.fillStyle = '#069';
  ctx.fillText('PEDY Driver 🚗', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Fingerprint', 4, 17);

  // Draw gradient
  const gradient = ctx.createLinearGradient(0, 0, 200, 0);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(1, '#00ff00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 30, 200, 20);

  // Get canvas data
  const dataUrl = canvas.toDataURL();
  return await hashString(dataUrl);
}

function getWebGLInfo(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return 'no-webgl';

  const glContext = gl as WebGLRenderingContext;
  const debugInfo = glContext.getExtension('WEBGL_debug_renderer_info');
  
  if (!debugInfo) return 'no-debug-info';

  const vendor = glContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  const renderer = glContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  
  return `${vendor}~${renderer}`;
}

async function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        resolve('no-audio-context');
        return;
      }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0; // Mute
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(0);

      scriptProcessor.onaudioprocess = (event) => {
        const output = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < output.length; i++) {
          sum += Math.abs(output[i]);
        }
        
        oscillator.disconnect();
        scriptProcessor.disconnect();
        gainNode.disconnect();
        context.close();
        
        resolve(sum.toString().slice(0, 10));
      };

      // Timeout fallback
      setTimeout(() => {
        try {
          oscillator.disconnect();
          context.close();
        } catch {}
        resolve('timeout');
      }, 500);
    } catch {
      resolve('error');
    }
  });
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 32); // Return first 32 chars
  } catch {
    // Fallback for browsers without crypto.subtle
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

export { generateFingerprint };
