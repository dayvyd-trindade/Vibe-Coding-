export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
}

export class TTSAudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    // Prioritize Portuguese voices (pt-BR, pt-PT)
    const ptVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'));
    const otherVoices = voices.filter((v) => !v.lang.toLowerCase().startsWith('pt'));

    const mapped = [...ptVoices, ...otherVoices].map((v) => ({
      voice: v,
      name: `${v.name} (${v.lang})`,
      lang: v.lang,
    }));

    return mapped;
  }

  public speak(
    text: string,
    options: {
      voice?: SpeechSynthesisVoice;
      rate?: number;
      pitch?: number;
      onBoundary?: (charIndex: number, length: number) => void;
      onEnd?: () => void;
      onError?: (error: any) => void;
    } = {}
  ): void {
    if (!this.synth) return;

    this.stop();

    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      // Find default pt-BR voice
      const voices = this.synth.getVoices();
      const ptVoice = voices.find((v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt'));
      if (ptVoice) utterance.voice = ptVoice;
    }

    utterance.lang = options.voice?.lang || 'pt-BR';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    utterance.onboundary = (event) => {
      if (options.onBoundary) {
        options.onBoundary(event.charIndex, event.charLength || 10);
      }
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (err) => {
      this.isSpeaking = false;
      this.isPaused = false;
      if (options.onError) options.onError(err);
    };

    this.currentUtterance = utterance;
    this.isSpeaking = true;
    this.isPaused = false;
    this.synth.speak(utterance);
  }

  public pause(): void {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
    }
  }

  public getStatus(): { isSpeaking: boolean; isPaused: boolean } {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
    };
  }
}

export const ttsAudio = new TTSAudioService();
