# ZOOMABLE UI

Components:

- Pan zoom area
- With inner elements that can respond in a nuanced way to presss and long-presses
- The elements can trigger a press, drag on the area, or long-press and become draggable.
- Draggable and droppable objects

# FEATURES

- Take any React component or HTML elements and make them zoomable and panable. Mouse and touch supported.
- Special consideration for HTML elements like buttons and links that shouldn't be panned.
- Define the boundary of the zoomable space.
- Progomatically set or animate the visible part of the zoomable space (i.e. zoom in, pan to the right, etc)
- Create a zoomable or pannable area that is much larger than the physical screen space.
- WOrks full screen or not.
- ALlows customization of interation events, like press, and hover and right lcick
- Special pressable components that can be used for more complicated interactions than regular HTML elements (e.g. long press, or press but turn into pan if there is horizontal/vertical movement)
- Building blocks for building drag and drop
- React is optional

Demos now:
/ (incomplete) General demo
/ ^^ (html and links)

- Boundary x 2
- Camera control
- Full screen vs. Not

* Events
  / Press events
* Drag and drop
* React optional

# Notes that need to be added to somewhere later to understand

## Cavets

1. Scrollable area inside the zoomable area:

- For components in a <Space> don't use overflow: scroll/auto inside the Zoomable Space... at least for Chrome (Safari seems ok)
- Basically you can't make scrollable via overflow :( otherwise it is too janky

## Browser Support

1. Edge, only mouse works 100%. Touch does for single finger gestures, not
   pinch/spread. Will revisit when edge moves to Chromium. Unsure about
   touchpad, but its probably fine though pinch/zoom may not work.

Unsure about IE. Probably fine for mouse and fails horribly for touch.

Unsure about stylus.

## Notes on Sizing

UPDATE: we now position: absolute and top/left/right/bottom === 0. So set your containig element w/ positoin relative!!! This changes the way to do fixed size divs.

The reason for this is that 1. height: 100% doesnt work in all cases (flex box on Safair) and 2. otherwise the outer div will expand w/ the content, which makes the div much too large, and 3. we can try to fix rthat by setting a height or max-height but trhen we can't properly handle resizes cause the parent div will never get smaller anymore...

1. The Space is designed to take up all available space from its container (i..e it has widht and height 100%). You can override this by passing in style props to change the height and width or passing in a css class to use that changes them (note you may need your css rules to be more specific than usual)

2. Why dont we fit to the size of the contained elements?  
   GOod question. This can break some stuff but you can get it to happen by doing XYZ

3. For the zoomable content, by default it behaves like a normal div with overflow = hidden, meaning that content flows through a width of X pixles where X is the size of the container (in this case the space, see 1 above), and it will grow vertically past
   the bottom boundary (to become invivsitbel if necssary)

- If you want virtual space to be much larger than the Space, you have to do one of a few things: 1. set the transformDivStyle to have height + width, 2. add a div with a fixed widht or height to the size you want, or 3. just position the things you want using absolute positioning and left and top.

## Notes to Self

### Why did we not use impetus?

- We had to selectively ignore pan gestures sometimes, but this was tricky with the after-touch-end-momentum-pan-animation that impetus does. I think
  I was able to work around this everywhere but iOS (maybe Android too)
- Non left mouse buttons were triggering impetus
- Bad bug on iOS where sometimes impetus just dies due to pinching or something.
  - Probably this one https://github.com/chrisbateman/impetus/issues/13
    (...which has a fix and a PR and a fork repo but see the next item...)
- Library looks unmaintained, long standing PRs and issues

Additionally:

- We already have to listen for mouse and touch events in the ViewPort to
  support interaction (detecting taps, long taps, capturing the pan for drag
  and drop, etc) so we were some of the way there to doing what it did.
- I think we need a similar animation based mechanism for moving the ViewPort,
  independent of pan gestures.
- Note a hugely used library according to npm.

### Hammer pros over pan-zoom

- Better two finger panning support for unknown reasons.
- More active and widely used.
- Pinch worked out of the box for mobile Safari and Chrome (didnt have to do anything special like w/ pan-zoom).

### Why did we not use Hammer for everything (why still have our own mouse/touch listeners)?

Unfortunately the hammer press and tap recognizers don't entirely do what we
want. Press is almost what we want, but the order of `press` and `pressup`
events is non-deterministic and if a `pan` starts it kills the `press` (wont
get `pressup`) and sometimes when a pan starts we won't even get the `press`
event.

Tap happens after you release, so its also not what we want (still need to
know about the press when it starts, so we have the same problems as above)

This all ends up meaning its easier to handle presses with our own event
handlers on the mouse and touch events.

// TODO

### https://stackoverflow.com/questions/2989263/disable-auto-zoom-in-input-text-tag-safari-on-iphone
