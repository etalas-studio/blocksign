declare module 'canvas-confetti' {
  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: ('circle' | 'square' | 'star')[];
    zIndex?: number;
    scalar?: number;
    disableForReducedMotion?: boolean;
    useWorker?: boolean;
    resize?: boolean;
    canvas?: HTMLCanvasElement;
  }

  export interface ConfettiResult {
    add: (confetti: Options) => void;
    stop: () => void;
    reset: () => void;
  }

  export default function confetti(options?: Options): ConfettiResult;
  export const confetti: {
    create(canvas?: HTMLCanvasElement): ConfettiResult;
    reset(): void;
  };
}
