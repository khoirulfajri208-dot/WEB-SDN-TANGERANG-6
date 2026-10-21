export const playFeedback = (type: 'click' | 'success' | 'error' | 'scan' | 'warning') => {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('sdn6_qr_mute_feedback') === 'true' && type !== 'warning') {
      return;
    }
    
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      if (type === 'warning') window.navigator.vibrate([150, 100, 150, 100, 250]);
      else if (type === 'success') window.navigator.vibrate([30, 50, 30]);
      else if (type === 'error') window.navigator.vibrate([50, 100, 50]);
      else if (type === 'scan') window.navigator.vibrate([40, 30, 40]);
      else window.navigator.vibrate(20);
    }
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();

      if (type === 'warning') {
        // Distinct, attention-grabbing dual-tone alarm for low battery
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime + 0.16); // C5
        gain1.gain.setValueAtTime(0.18, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.35);

        // Secondary alert pulse
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.38); // G5
        osc2.frequency.setValueAtTime(440.0, ctx.currentTime + 0.52); // A4
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.38);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.72);
        osc2.start(ctx.currentTime + 0.38);
        osc2.stop(ctx.currentTime + 0.72);
      } else if (type === 'scan') {
        // Subtle high-frequency scanner chirp/beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    }
  } catch (e) {
    // Ignore context errors on browsers that block autoplay audio before interaction
  }
};

/**
 * Dedicated audible warning chime specifically for low battery notification
 * Plays a distinct 2-pulse alert sequence accompanied by device haptic vibration
 */
export const playBatteryAlertSound = () => {
  playFeedback('warning');
};

