


// Expected:
// js-resizable_bar="tree"
// data-state="open"
// data-position="left"

// ! Right now, the code only considers one possibility for the panels
// ! to the left of the main part.

class ResizableBar {
  constructor({
    barAttribute,
    barGravity,
    barMaxWidthVW,
    // styles
    barPadding,
    barPaddingBottom,
    barMinWidth,
    barClosedWidth,
    barHandlerWidth,
    barColorMain,
    barColorBackground,
    barColorActive,
    barColorBorder,
    barColorScrollbarTrack,
    barColorScrollbarThumb,
  }) {
    this.barAttribute = barAttribute || 'js-resizable_bar';
    this.barMaxWidthVW = barMaxWidthVW || '20vw';
    this.barGravity = barGravity || 100;
    // styles
    this.barPadding = barPadding || 'calc(var(--base-rhythm, 8px)*2)';
    this.barPaddingBottom = barPaddingBottom || 'calc(var(--base-rhythm, 8px)*8)';
    this.barMinWidth = barMinWidth || 100;
    this.barClosedWidth = barClosedWidth || 12;
    this.barHandlerWidth = barHandlerWidth || 8;
    this.barColorMain = barColorMain || 'var(--color-fg-main, Black)';
    this.barColorBackground = barColorBackground || 'var(--color-bg-main, White)';
    this.barColorActive = barColorActive || 'var(--color-fg-accent, currentColor)';
    this.barColorBorder = barColorBorder || 'var(--color-border, rgba(0,0,0,0.1))';
    this.barColorScrollbarTrack = barColorScrollbarTrack || 'var(--scrollbarBG, transparent)';
    this.barColorScrollbarThumb = barColorScrollbarThumb || 'var(--thumbBG, rgba(0,0,0,.05))';

    // state
    this.state = {
      current: {
        id: null,
        pageX: null
      }
    };

    this.initialState = 'open';
    this.initialWidth = this.barMaxWidthVW;
    this.initialStyle = ``;

    // subscribe
    const _this = this;
    this._mouseDownHandler = (e) => {_this._onMouseDown(e)};
    this._mouseMoveHandler = (e) => {_this._onMouseMove(e)};
    this._mouseUpHandler = (e) => {_this._onMouseUp(e)};
    this._toggleHandler = (e) => {_this._toggle(e)};
  }

  init() {
    this._insertInitialBarStyle();
    this._insertInitialPreloaderStyle();

  }

  render() {
    this._renderBars();
    this._insertBarStyle();
    this._insertPreloaderStyle();
  }

  // render

  _renderBars() {
    [...document.querySelectorAll(`[${this.barAttribute}]`)]
    .forEach((bar) => {
      const id = bar.getAttribute(this.barAttribute);
      const state = this._sessionStorageGetItem(id, 'state') || this.initialState;
      const width = this._sessionStorageGetItem(id, 'width');

      // Read data from element and from Storage
      // and set to State:
      this._setState({
        id: id,
        element: bar,
        position: bar.dataset.position,
        state: state,
        width: width, // bar.offsetWidth,
      })

      // Update Bar with data from Storage:
      this._updateBar(id);

      // Wrap the bar content in the created scrolling element:
      const wrapper = this._createScrollableWrapper(id);
      [ ...bar.childNodes ].forEach(child => wrapper.appendChild(child));
      bar.appendChild(wrapper);

      // Add control elements:
      bar.append(this._createHandler(id));

      // Add testID:
      this._addTestID(bar, id, 'bar');
    });
  }

  // session storage

  _sessionStorageGet() {
    return JSON.parse(sessionStorage.getItem('resizableBarStorage'))
  }

  _sessionStorageSet(obj) {
    const string = JSON.stringify(obj);
    sessionStorage.setItem('resizableBarStorage', string)
  }

  _sessionStorageGetItem(id, item) {
    const storage = this._sessionStorageGet();
    const value = (storage && storage[id]) ? storage[id][item] : null;
    return value;
  }

  _sessionStorageSetItem(id, item, value) {
    let storage = this._sessionStorageGet() || {};
    storage = {
      ...storage,
      [id]: {
        ...storage[id],
        [item]: value,
      },
    };
    this._sessionStorageSet(storage);
  }

  // state

  _setState({
    id,
    element,
    state,
    position,
    width,
  }) {
    this.state[id] = {
      element: element,
      state: state,
      position: position,
      width: width,
    };
  }

  _updateState({
    id,
    element,
    state,
    position,
    width,
  }) {
    console.assert(id, '_updateState(): ID must be provided');
    if (!this.state[id]) { this.state[id] = {} }

    if (element) { this.state[id].element = element; }
    if (state) { this.state[id].state = state; }
    if (position) { this.state[id].position = position; }
    if (width) { this.state[id].width = width; }
  }

  // current

  _updateCurrent(e) {
    if (e.type == "mousedown") {
      // When we start a new resize, we update the currents:
      this.state.current.id = e.target.dataset.content;
      this.state.current.pageX = e.pageX;
      // When we start a new resize, we take the current width of the element:
      this.state[this.state.current.id].width = this.state[this.state.current.id].element.offsetWidth;
    } else {
      // e.type == "mouseup"
      // At the end of the resize:
      this.state.current.id = null;
      this.state.current.pageX = null;
      // We leave the last adjusted width,
      // * this.state[this.state.current.id].width
      // and if the panel is opened/closed with a button,
      // this adjusted width will be used.
    }
  }

  // elements

  _addTestID(element, id, attr) {
    element.dataset.testid = `${id}-${attr}`;
  }

  _updateBar(id) {
    const bar = this.state[id].element;
    const barState = this.state[id];
    bar.style.width = barState.width + 'px';
    bar.dataset.position = barState.position;
    bar.dataset.state = barState.state;
  }

  _createHandler(id) {
    const handler = document.createElement('div');
    handler.setAttribute(`${this.barAttribute}-handler`, '');
    handler.dataset.content = id;
    handler.style[this.state[id].position] = 'unset'; // 'left | right'

    const border = document.createElement('div');
    border.setAttribute(`${this.barAttribute}-border`, '');
    border.dataset.content = id;
    border.title = `Resize ${id}`;
    border.addEventListener('mousedown', this._mouseDownHandler);

    const button = document.createElement('div');
    button.setAttribute(`${this.barAttribute}-button`, '');
    button.dataset.content = id;
    button.title = `Toggle ${id}`;
    button.addEventListener('mousedown', this._toggleHandler);

    // Add testIDs:
    this._addTestID(border, id, 'handler-border');
    this._addTestID(button, id, 'handler-button');

    handler.append(border, button);
    return handler;
  }

  _createScrollableWrapper(id, direction = 'y') {
    const wrapper = document.createElement('div');
    wrapper.setAttribute(`${this.barAttribute}-scroll`, direction);
    wrapper.dataset.content = id;
    return wrapper;
  }

  // event listeners

  _onMouseDown(e) {
    // Init resizing
    if (e.button == 0) {
      e.preventDefault();
      this._updateCurrent(e);
      window.addEventListener('mousemove', this._mouseMoveHandler);
      window.addEventListener('mouseup', this._mouseUpHandler);
    }
  }

  _onMouseMove(e) {
    // Resizing
    requestAnimationFrame(() => {
      if (this.state.current.id) {
        const delta = e.pageX - this.state.current.pageX;
        const w = this.state[this.state.current.id].width + delta;

        this.state[this.state.current.id].element.style.width = w + 'px';

        if (w < this.barGravity) {
          if (this.state[this.state.current.id].state == 'open') {
            this._close(this.state.current.id);
          }
        } else {
          if (this.state[this.state.current.id].state == 'closed') {
            this._open(this.state.current.id);
          }
        }

      }
    })
  }

  _onMouseUp(e) {
    // Clean up after work
    window.removeEventListener('mousemove', this._mouseMoveHandler);
    window.removeEventListener('mouseup', this._mouseUpHandler);

    const currentWidth = this.state[this.state.current.id].element.offsetWidth;
    this._updateState({ id: this.state.current.id, width: currentWidth });
    this._sessionStorageSetItem(this.state.current.id, 'width', currentWidth); // WRITE DATA TO STORAGE
    this._updateBar(this.state.current.id);
    this._updateCurrent(e);

  }

  _toggle(e) {
    if (e.button == 0) {
      const id = e.target.dataset.content;
      this.state[id].state = this.state[id].state === 'open'
        ? 'closed'
        : 'open';
      this._sessionStorageSetItem(id, 'state', this.state[id].state);
      this._updateBar(id);
    }
  }

  _open(id) {
    this.state[id].state = 'open';
    this._sessionStorageSetItem(id, 'state', this.state[id].state);
    this._updateBar(id);
  }

  _close(id) {
    this.state[id].state = 'closed';
    this._sessionStorageSetItem(id, 'state', this.state[id].state);
    this._updateBar(id);
  }

  // styles

  _insertStyle(css, attr) {
    const style = document.createElement('style');
    style.setAttribute(`${this.barAttribute}-${attr}`, '');
    style.textContent = css;
    document.head.append(style);
  }

  _insertInitialBarStyle() {
    const storage = this._sessionStorageGet();

    let initStyle = `[${this.barAttribute}]{width:${this.barMaxWidthVW}}`;

    // Add styles based on data from Storage:
    for (let id in storage) {
      const w = (storage[id].state == 'closed') ? this.barClosedWidth : storage[id].width;
      w && (initStyle += `[${this.barAttribute}="${id}"]{width:${w}px}`);
    }

    this._insertStyle(initStyle, 'initial-style')
  }

  _insertBarStyle() {
    const barStyle = `
[${this.barAttribute}] {
  position: relative;
  height: 100%;
  max-width: ${this.barMaxWidthVW};
}

[${this.barAttribute}]:hover {
  z-index: 22;
}

[${this.barAttribute}][data-state="open"] {
  min-width: ${this.barMinWidth}px;
  pointer-events: auto;
}
[${this.barAttribute}][data-state="closed"] {
  max-width: ${this.barClosedWidth}px;
  min-width: ${this.barClosedWidth}px;
  pointer-events: none;
  transition: .5s;
}

[${this.barAttribute}][data-position="left"] {
  border-left: none;
}
[${this.barAttribute}][data-position="right"] {
  border-right: none;
}

[${this.barAttribute}-handler] {
  pointer-events: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  width: ${this.barHandlerWidth}px;
  color: ${this.barColorActive};
}

[${this.barAttribute}-border] {
  pointer-events: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: ${this.barHandlerWidth}px;
  background: transparent;
  transition: .3s;
  cursor: col-resize;
}

[${this.barAttribute}][data-state="closed"] [${this.barAttribute}-border] {
  cursor: e-resize;
}

[${this.barAttribute}-border]::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 1px;
  background: ${this.barColorBorder};
  transition: .3s;
}

[${this.barAttribute}-border]::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: ${0.5 * this.barHandlerWidth}px;
  background: transparent;
  transition: .3s;
}

[${this.barAttribute}][data-position="left"] [${this.barAttribute}-border]::before {
  right: 0;
  left: unset;
}
[${this.barAttribute}][data-position="left"] [${this.barAttribute}-border]::after {
  right: ${-0.25 * this.barHandlerWidth}px;
  left: unset;
}

[${this.barAttribute}][data-position="right"] [${this.barAttribute}-border]::before {
  right: unset;
  left: 0;
}
[${this.barAttribute}][data-position="right"] [${this.barAttribute}-border]::after {
  right: unset;
  left: ${-0.25 * this.barHandlerWidth}px;
}

[${this.barAttribute}-border]:hover::after {
  background: ${this.barColorActive};
}

[${this.barAttribute}-button] {
  cursor: pointer;
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  top: ${-1 * this.barHandlerWidth}px;
  box-sizing: border-box;
  width: ${2 * this.barHandlerWidth}px;
  height: ${2 * this.barHandlerWidth}px;
  font-size: ${1.5 * this.barHandlerWidth}px;
  font-weight: bold;
  border-radius: 50%;
  border-width: 1px;
  border-style: solid;
  border-color: ${this.barColorBackground};
  background: ${this.barColorBackground};
  color: ${this.barColorActive};
  transition: .3s;
}

[data-position="right"] [${this.barAttribute}-button] {
  right: 0;
  left: unset;
}
[data-position="left"] [${this.barAttribute}-button] {
  left: 0;
  right: unset;
}

[${this.barAttribute}-button]:hover {
  color: ${this.barColorMain};
  border-color: ${this.barColorMain};
}

/* ❮❯ */
[${this.barAttribute}-button]::after {
  content: '❮';
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  right: 0;
  top: ${-1 * this.barHandlerWidth}px;
  bottom: ${-1 * this.barHandlerWidth}px;
}
[${this.barAttribute}][data-state="open"] [${this.barAttribute}-button]::after,
[${this.barAttribute}][data-state="open"][data-position="left"] [${this.barAttribute}-button]::after,
[${this.barAttribute}][data-state="closed"][data-position="right"] [${this.barAttribute}-button]::after {
  content: '❮';
}
[${this.barAttribute}][data-state="closed"] [${this.barAttribute}-button]::after,
[${this.barAttribute}][data-state="closed"][data-position="left"] [${this.barAttribute}-button]::after,
[${this.barAttribute}][data-state="open"][data-position="right"] [${this.barAttribute}-button]::after {
  content: '❯';
}

[${this.barAttribute}-scroll] {
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: ${this.barPadding};
  padding-bottom: ${this.barPaddingBottom};
  scrollbar-color: ${this.barColorScrollbarTrack} ${this.barColorScrollbarTrack};
}
[${this.barAttribute}-scroll='y'] {
  overflow-x: hidden;
  overflow-y: scroll;
}
[${this.barAttribute}-scroll]:hover {
  scrollbar-color: ${this.barColorScrollbarThumb} ${this.barColorScrollbarTrack};
}
[${this.barAttribute}-scroll]::-webkit-scrollbar-thumb {
  background-color: ${this.barColorScrollbarTrack};
}
[${this.barAttribute}-scroll]:hover::-webkit-scrollbar-thumb {
  background-color: ${this.barColorScrollbarThumb}
}

[data-state="closed"] [${this.barAttribute}-scroll] {
  display: none;
}
`;
    this._insertStyle(barStyle, 'style');
  }

  _insertInitialPreloaderStyle() {
    let style = `
    aside {
      /* for a pseudo preloader [js-resizable_bar]::after, affects: layout_tree,layout_toc */
      position: relative;
    }
    [${this.barAttribute}]::after {
        display: flex;
        align-items: center;
        justify-content: center;
        content: '';
        position: absolute;
        left: 0; right: 0; top: 0; bottom: 0;
        z-index: 2;
        background-color: ${this.barColorBackground};
    }
    `;

    this._insertStyle(style, 'initial-preloader-style');
  }

  _insertPreloaderStyle() {
    let style = `
    [${this.barAttribute}]::after {
      opacity: 0;
      transition: .3s;
      pointer-events: none;
    }
    `;

    this._insertStyle(style, 'preloader-style');
  }
}

const resizableBar = new ResizableBar({});
resizableBar.init();

window.addEventListener("load", function () {
  resizableBar.render();
});
