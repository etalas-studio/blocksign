import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';
import type { Options } from 'canvas-confetti';

export type ConfettiAnimation =
  | 'success'
  | 'celebration'
  | 'fireworks'
  | 'burst'
  | 'star-burst';

@Injectable({
  providedIn: 'root'
})
export class ConfettiService {
  /**
   * Trigger a confetti animation
   */
  trigger(
    animation: ConfettiAnimation = 'success',
    options?: Options
  ): void {
    switch (animation) {
      case 'success':
        this.success();
        break;
      case 'celebration':
        this.celebration();
        break;
      case 'fireworks':
        this.fireworks();
        break;
      case 'burst':
        this.burst(options);
        break;
      case 'star-burst':
        this.starBurst();
        break;
    }
  }

  /**
   * Simple success burst from center
   */
  success(): void {
    const defaults: Options = {
      spread: 64,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#22C55E', '#16A34A', '#4ADE80']
    };

    confetti({
      ...defaults,
      particleCount: 60,
      origin: { y: 0.6 }
    });

    confetti({
      ...defaults,
      particleCount: 40,
      origin: { y: 0.7 }
    });
  }

  /**
   * Full celebration animation
   */
  celebration(): void {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#22C55E', '#2563EB', '#FACC15', '#EF4444'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    }());
  }

  /**
   * Firework style animation
   */
  fireworks(): void {
    const defaults: Options = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#22C55E', '#2563EB', '#FACC15']
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const particleCount = 50;

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    setTimeout(() => clearInterval(interval), 2000);
  }

  /**
   * Custom burst with options
   */
  burst(options?: Options): void {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22C55E', '#16A34A'],
      ...options
    });
  }

  /**
   * Star burst animation
   */
  starBurst(): void {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FACC15', '#FBBF24', '#F59E0B']
    };

    confetti({
      ...defaults,
      particleCount: 80,
      origin: { y: 0.5 }
    });
  }

  /**
   * Fire confetti from a specific element
   */
  fireFromElement(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { x, y },
      colors: ['#22C55E', '#16A34A', '#4ADE80']
    });
  }

  /**
   * Side cannons animation
   */
  sideCannons(): void {
    const end = Date.now() + 1000;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22C55E', '#2563EB']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22C55E', '#2563EB']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }

  /**
   * Reset confetti (clear any remaining)
   */
  reset(): void {
    // Confetti doesn't have a global reset, particles auto-clear
  }
}
