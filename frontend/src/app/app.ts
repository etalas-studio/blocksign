import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OnboardingModalComponent } from './shared/components/onboarding-modal/onboarding-modal.component';
import { AnimationService } from './core/services/animation.service';

const ONBOARDING_STORAGE_KEY = 'blocksign_onboarding_completed';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OnboardingModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('BlockSign');
  protected readonly showOnboarding = signal(false);

  private animationService = inject(AnimationService);

  ngOnInit(): void {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      // Show onboarding after a short delay
      setTimeout(() => {
        this.showOnboarding.set(true);
      }, 500);
    }
  }

  handleOnboardingComplete(result: { useDemo: boolean }): void {
    // Mark onboarding as completed
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    this.showOnboarding.set(false);

    // Trigger celebration animation
    this.animationService.complete();

    // If user chose demo mode, navigate to sign page with demo document
    if (result.useDemo) {
      // Demo mode logic can be added here
      console.log('Demo mode activated');
    }
  }
}
