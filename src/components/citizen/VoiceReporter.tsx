
import React, { useState, useEffect } from 'react';
// Import regenerator-runtime to fix the regeneratorRuntime error
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface VoiceReporterProps {
  onTranscriptChange: (transcript: string) => void;
}

const VoiceReporter: React.FC<VoiceReporterProps> = ({ onTranscriptChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Update parent component with transcript
  useEffect(() => {
    if (transcript) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  // Toggle recording
  const toggleListening = async () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error("Your browser doesn't support speech recognition");
      return;
    }

    if (!isMicrophoneAvailable) {
      toast.error("Please allow microphone access");
      return;
    }

    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      setIsProcessing(true);
      try {
        await SpeechRecognition.startListening({ continuous: true });
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Failed to start voice recording");
      }
      setIsProcessing(false);
    }
  };

  // Clear recording
  const clearRecording = () => {
    resetTranscript();
    onTranscriptChange('');
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-4 border border-border rounded-md bg-background/50">
        <p className="text-sm text-muted-foreground">
          Voice reporting is not supported in this browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button"
          variant={isListening ? "destructive" : "outline"}
          className="flex items-center gap-2"
          onClick={toggleListening}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {isListening ? "Stop Recording" : "Start Voice Recording"}
        </Button>
        
        {transcript && (
          <Button 
            type="button"
            variant="ghost"
            onClick={clearRecording}
          >
            Clear
          </Button>
        )}
      </div>
      
      {isListening && (
        <div className="p-3 border border-primary/30 rounded-md bg-primary/5 animate-pulse">
          <p className="text-sm">Listening... Speak clearly into your microphone</p>
        </div>
      )}
      
      {transcript && (
        <div className="p-4 border border-border rounded-md bg-background/50">
          <p className="text-sm font-medium mb-1">Voice transcript:</p>
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceReporter;
