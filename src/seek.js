const { core, overlay, console, event, input, menu } = iina;

const MOUSE_DELAY = 500;
const KEYBOARD_DELAY = 150;

const SEEK_SPEED = 2;

const KEYBOARD_SHORTCUT = "s";
const SHOW_OVERLAY = true;

const IDLE = 0;
const WAITING = 1;
const SEEKING = 2;

const INPUT_MOUSE = 0;
const INPUT_KEYBOARD = 1;

export class SeekModule {
  status = IDLE;
  seekInput = 0;
  seekTimeoutID = 0;

  constructor() {
    event.on("iina.window-loaded", () => {
      overlay.loadFile("dist/ui/overlay/index.html");
    });

    this.bindMouseInputListeners();
    this.bindKeyboardInputListeners();
  }

  bindMouseInputListeners() {
    this.#bindMouseDown();
    this.#bindMouseUp();
    this.#bindMouseDrag();
  }

  bindKeyboardInputListeners(){
    this.#bindKeyDown();
    this.#bindKeyUp();
  }

  #bindMouseDown() {
    input.onMouseDown(input.MOUSE, (e) => {
      console.log("Mouse Down");

      this.#startSeek(INPUT_MOUSE, MOUSE_DELAY, e.x, e.y);
    });
  }

  #bindMouseUp() {
    input.onMouseUp(input.MOUSE, () => {
      console.log("Mouse Up");

      this.#cancelSeek(INPUT_MOUSE);
    });
  }

  #bindMouseDrag(){
    input.onMouseDrag(input.MOUSE, () => {
      console.log("Mouse Drag");

      this.#cancelSeek(INPUT_MOUSE);
    });
  }

  #bindKeyDown() {
    input.onKeyDown(KEYBOARD_SHORTCUT, (data) => {
      console.log("Key Down");

      if (!data.isRepeat) {
        if (this.status === IDLE) {
          this.#startSeek(INPUT_KEYBOARD, KEYBOARD_DELAY);
        } else if (this.status !== IDLE) {
          this.#cancelSeek(INPUT_KEYBOARD);
        }
      }

      return true;
    });
  }

  #bindKeyUp() {
    input.onKeyUp(KEYBOARD_SHORTCUT, () => {
      console.log("Key Up");

      if (this.status !== WAITING) {
        this.#cancelSeek(INPUT_KEYBOARD);
      }
    });
  }

  #startSeek(input, delay, x,y) {
    // only start seeking if the player is not paused
    if (core.status.paused) {
      return;
    }
    if (this.status !== IDLE) {
      return;
    }

    this.status = WAITING;
    this.seekInput = input;

    // show the overlay after a timeout.
    this.seekTimeoutID = setTimeout(() => {
      // if the window is acturally dragged, cancel the seek
      if (this.status !== WAITING) {
        return;
      }

      console.log("Start Seek");
      this.status = SEEKING;
      this.originalSpeed = core.status.speed;
      core.setSpeed(SEEK_SPEED);

      if (SHOW_OVERLAY) {
        overlay.show();
        overlay.postMessage("showIndicator", { x, y });
      }
    }, delay);
  }

  #cancelSeek(input) {
    console.log("Cancel Seek");

    if (this.status === IDLE || this.seekInput !== input) {
      return;
    }
    if (this.status === SEEKING) {
      core.setSpeed(this.originalSpeed);
    }
    if (this.status === WAITING) {
      clearTimeout(this.seekTimeoutID);
    }
    this.status = IDLE;
    overlay.hide();
  }
}
