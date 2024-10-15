import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[appTogglePassword]',
})
export class TogglePasswordDirective {
  private shown = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('click')
  togglePassword() {
    const input =
      this.el.nativeElement.previousElementSibling.querySelector('input');
    this.shown = !this.shown;
    const inputType = this.shown ? 'text' : 'password';
    this.renderer.setAttribute(input, 'type', inputType);
  }
}
