import { TogglePasswordDirective } from './toggle-password.directive';
import { Renderer2, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

describe('TogglePasswordDirective', () => {
  let directive: TogglePasswordDirective;
  let mockRenderer: Renderer2;
  let mockElementRef: ElementRef;
  let previousSibling: HTMLElement;
  beforeEach(() => {
    mockRenderer = jasmine.createSpyObj('Renderer2', ['setAttribute']);

    // Crea un elemento que actuará como el hermano anterior al elemento de la directiva
    const previousSibling = document.createElement('div');
    const input = document.createElement('input');
    previousSibling.appendChild(input);

    // Crea el elemento donde se aplicará la directiva (simula el elemento hermano siguiente)
    const directiveHost = document.createElement('button');
    previousSibling.insertAdjacentElement('afterend', directiveHost);

    mockElementRef = new ElementRef(directiveHost);

    TestBed.configureTestingModule({
      providers: [
        { provide: Renderer2, useValue: mockRenderer },
        { provide: ElementRef, useValue: mockElementRef },
      ],
    });

    directive = new TogglePasswordDirective(mockElementRef, mockRenderer);
  });

  it('should toggle input type to text when clicked once', () => {
    directive.togglePassword();

    // Asegúrate de que el input es el que estás probando
    const input = previousSibling.querySelector('input');
    expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
      input,
      'type',
      'text'
    );
  });

  it('should toggle input type back to password when clicked twice', () => {
    directive.togglePassword();
    directive.togglePassword();

    const input = previousSibling.querySelector('input');
    expect(mockRenderer.setAttribute).toHaveBeenCalledWith(
      input,
      'type',
      'password'
    );
  });

});
