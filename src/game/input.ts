// Keyboard input handling

export type Keys = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type KeyboardInput = {
  keys: Keys;
  destroy: () => void;
};

export function createKeyboardInput(): KeyboardInput {
  const keys: Keys = { up: false, down: false, left: false, right: false };

  const handleKey = (e: KeyboardEvent, down: boolean) => {
    // Ignore if typing in input/textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    let handled = true;
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        keys.up = down;
        break;
      case 's':
      case 'arrowdown':
        keys.down = down;
        break;
      case 'a':
      case 'arrowleft':
        keys.left = down;
        break;
      case 'd':
      case 'arrowright':
        keys.right = down;
        break;
      default:
        handled = false;
    }

    if (handled) {
      e.preventDefault();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
  const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);

  // Reset keys when window loses focus
  const onBlur = () => {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return {
    keys,
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    },
  };
}

// Check if any movement key is pressed
export function isMoving(keys: Keys): boolean {
  return keys.up || keys.down || keys.left || keys.right;
}
