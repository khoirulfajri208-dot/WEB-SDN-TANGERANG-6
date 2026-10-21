import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Check, Volume2, Radio } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSaveVoiceNote: (audioBase64OrText: string) => void;
  existingVoiceNote?: string;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onSaveVoiceNote,
  existingVoiceNote,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingVoiceNote || null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (existingVoiceNote) {
      setAudioUrl(existingVoiceNote);
    }
  }, [existingVoiceNote]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);

        // Convert to dataUrl base64 string for persistent storage
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSaveVoiceNote(base64Audio);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Izin mikrofon dibutuhkan untuk merekam umpan balik suara.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleTogglePlay = () => {
    if (!audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    onSaveVoiceNote('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <Volume2 size={14} className="text-purple-600" /> Catatan Suara Guru (Voice Note)
        </span>
        {isRecording && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 animate-pulse">
            <Radio size={12} /> Merekam ({formatTime(recordingTime)})
          </span>
        )}
      </div>

      {!audioUrl && !isRecording && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Mic size={14} />
          <span>Rekam Voice Note</span>
        </button>
      )}

      {isRecording && (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Square size={14} />
          <span>Hentikan Rekaman</span>
        </button>
      )}

      {audioUrl && !isRecording && (
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="p-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <div className="flex-1">
            <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div className={`h-full bg-purple-600 ${isPlaying ? 'animate-pulse w-full' : 'w-1/2'}`}></div>
            </div>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5 block">
              {isPlaying ? 'Memutar Suara Guru...' : 'Audio Umpan Balik Tersimpan'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
            title="Hapus Rekaman"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
