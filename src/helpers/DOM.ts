export function getStackingContext(e: HTMLElement): HTMLElement {
  while( true ) {
    if ( !e.parentElement ) {
      return e;
    }

    e = e.parentElement;

    let {
      position, zIndex, display, opacity, mixBlendMode,
      transform, filter, backdropFilter, perspective, clipPath
    } = window.getComputedStyle( e );

    if ( /^(fixed|sticky)$/.test(position) ) {
      return e;
    }

    if ( /^(absolute|relative)$/.test(position) && zIndex != 'auto' ) {
      return e;
    }

    if ( /^(flex|grid)$/.test(display) && zIndex != 'auto' ) {
      return e;
    }

    if ( +opacity < 1 ) {
      return e;
    }

    if ( mixBlendMode != 'normal' ) {
      return e;
    }

    if ( [ transform, filter, backdropFilter, perspective, clipPath ].some(t => t && t != 'none') ) {
      return e;
    }


  }
}

export function stopPropagation(e: Event) {
  e.stopPropagation();
}