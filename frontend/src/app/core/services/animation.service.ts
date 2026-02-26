import { Injectable, inject } from '@angular/core';
import { ConfettiService } from './confetti.service';

export type AnimationType =
  | 'success'
  | 'complete'
  | 'error'
  | 'loading'
  | 'checkmark'
  | 'pulse';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private confetti = inject(ConfettiService);

  /**
   * Trigger success animation
   */
  success(): void {
    this.confetti.success();
  }

  /**
   * Trigger completion celebration
   */
  complete(): void {
    this.confetti.celebration();
  }

  /**
   * Trigger error shake animation on element
   */
  error(element: HTMLElement): void {
    element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 400,
      easing: 'ease-in-out'
    });
  }

  /**
   * Add pulse animation to element
   */
  pulse(element: HTMLElement, duration: number = 2000): void {
    element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], {
      duration,
      iterations: Infinity,
      easing: 'ease-in-out'
    });
  }

  /**
   * Stop pulse animation
   */
  stopPulse(element: HTMLElement): void {
    const animations = element.getAnimations();
    animations.forEach(anim => anim.cancel());
  }

  /**
   * Add loading spinner animation
   */
  loading(element: HTMLElement): Animation {
    return element.animate([
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ], {
      duration: 1000,
      iterations: Infinity,
      easing: 'linear'
    });
  }

  /**
   * Fade in animation
   */
  fadeIn(element: HTMLElement, duration: number = 300): Animation {
    return element.animate([
      { opacity: '0' },
      { opacity: '1' }
    ], {
      duration,
      easing: 'ease-out'
    });
  }

  /**
   * Fade out animation
   */
  fadeOut(element: HTMLElement, duration: number = 300): Animation {
    return element.animate([
      { opacity: '1' },
      { opacity: '0' }
    ], {
      duration,
      easing: 'ease-out'
    });
  }

  /**
   * Slide up animation
   */
  slideUp(element: HTMLElement, duration: number = 300): Animation {
    return element.animate([
      { transform: 'translateY(20px)', opacity: '0' },
      { transform: 'translateY(0)', opacity: '1' }
    ], {
      duration,
      easing: 'ease-out'
    });
  }

  /**
   * Slide down animation
   */
  slideDown(element: HTMLElement, duration: number = 300): Animation {
    return element.animate([
      { transform: 'translateY(-20px)', opacity: '0' },
      { transform: 'translateY(0)', opacity: '1' }
    ], {
      duration,
      easing: 'ease-out'
    });
  }

  /**
   * Scale in animation
   */
  scaleIn(element: HTMLElement, duration: number = 200): Animation {
    return element.animate([
      { transform: 'scale(0.8)', opacity: '0' },
      { transform: 'scale(1)', opacity: '1' }
    ], {
      duration,
      easing: 'ease-out'
    });
  }

  /**
   * Shrink animation (for removal)
   */
  shrink(element: HTMLElement): Animation {
    return element.animate([
      { transform: 'scale(1)', opacity: '1' },
      { transform: 'scale(0.8)', opacity: '0' }
    ], {
      duration: 200,
      easing: 'ease-in'
    });
  }

  /**
   * Checkmark animation for success states
   */
  checkmark(element: HTMLElement): void {
    // Add checkmark class
    element.classList.add('checkmark-animate');

    // Trigger confetti
    this.confetti.trigger('success');

    // Remove class after animation
    setTimeout(() => {
      element.classList.remove('checkmark-animate');
    }, 600);
  }

  /**
   * Bounce animation
   */
  bounce(element: HTMLElement): Animation {
    return element.animate([
      { transform: 'translateY(0)' },
      { transform: 'translateY(-10px)' },
      { transform: 'translateY(0)' }
    ], {
      duration: 400,
      easing: 'ease-in-out'
    });
  }

  /**
   * Shake animation for attention
   */
  shake(element: HTMLElement): Animation {
    return element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 400,
      easing: 'ease-in-out'
    });
  }

  /**
   * Typewriter effect for text
   */
  typewriter(element: HTMLElement, text: string, speed: number = 50): void {
    let i = 0;
    element.textContent = '';

    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };

    type();
  }

  /**
   * Count up animation for numbers
   */
  countUp(element: HTMLElement, target: number, duration: number = 1000): void {
    const start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * easeOutQuart);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target.toLocaleString();
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Progress bar animation
   */
  progress(
    element: HTMLElement,
    from: number,
    to: number,
    duration: number = 300
  ): void {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const current = from + (to - from) * progress;
      element.style.width = `${current}%`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.width = `${to}%`;
      }
    };

    requestAnimationFrame(animate);
  }
}
