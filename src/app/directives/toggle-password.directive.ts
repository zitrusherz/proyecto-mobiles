import {Directive, ElementRef, HostListener, Renderer2} from '@angular/core';

@Directive({
  selector: '[appTogglePassword]',
  standalone: true,
})
export class TogglePasswordDirective {
  private shown = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('click')
  togglePassword() {
    const inputElement = this.el.nativeElement.previousElementSibling
      ? this.el.nativeElement.previousElementSibling.querySelector('input')
      : null;

    if (!inputElement) {
      console.error('No input element found for toggling password visibility.');
      return;
    }

    this.shown = !this.shown;
    const inputType = this.shown ? 'text' : 'password';
    this.renderer.setAttribute(inputElement, 'type', inputType);
  }
}
