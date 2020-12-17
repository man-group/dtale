# Spicy Resizable & Draggable Boostrap Modals in React

[![](http://img.youtube.com/vi/SZdKhOO09po/0.jpg)](http://www.youtube.com/watch?v=SZdKhOO09po "Modals")

I had been using Boostrap modals in my open-source software, [D-Tale](https://github.com/man-group/dtale), for the last year and I had always been meaning to explore how to make them draggable and/or resizable.  I am happy to announce that I was able to achieve both. Through the use of a couple great packages:
* [react-bootstrap](https://github.com/react-bootstrap/react-bootstrap)
* [react-draggable](https://github.com/STRML/react-draggable)
* [re-resizable](https://github.com/bokuweb/re-resizable)

(1) Building Our Bootstrap Modal
```javascript
import React from "react";
import Modal from "react-bootstrap/Modal";

class MyModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { show: true };
  }

  render() {
    return (
      <Modal
        show={this.state.show}
        onHide={() => this.setState({ show: !this.state.show })}
      >
        <Modal.Header closeButton>
          <Modal.Title>Title</Modal.Title>
        </Modal.Header>
          <Modal.Body>Body</Modal.Body>
          <Modal.Footer>Footer</Modal.Footer>
      </Modal>
    );
  }
}
```

(2) Making Your Modal Draggable By the Title Bar
```javascript
import React from "react";
import Modal from "react-bootstrap/Modal";
import ModalDialog from "react-bootstrap/ModalDialog";
import Draggable from "react-draggable";

class DraggableModalDialog extends React.Component {
  render() {
    return (
      <Draggable handle=".modal-title">
        <ModalDialog {...this.props} />
      </Draggable>
    );
  }
}

class MyModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { show: true };
  }

  render() {
    return (
      <Modal
        show={this.state.show}
        onHide={() => this.setState({ show: !this.state.show })}
        dialogAs={DraggableModalDialog}
      >
        <Modal.Header closeButton>
          <Modal.Title>Title</Modal.Title>
        </Modal.Header>
          <Modal.Body>Body</Modal.Body>
          <Modal.Footer>Footer</Modal.Footer>
      </Modal>
    );
  }
}
```

The key is specify the `dialogAs` parameter with your own `ModalDialog` component which wraps the `ModalDialog` in a `Draggable` component.  We will tell the `Draggable` component that the modal title element is what will trigger the drag.  This is possible by setting `handle=".modal-title"`, which means that we want whichever element has the `modal-title` class.

We will also want to add some additional styling to the `modal-title` class:
```CSS
.modal-title {
  width: 100%;
  cursor: move;
}
```

(3) Updating the Content Of Your Modal To Be Resizable
```javascript
import React from "react";
import Modal from "react-bootstrap/Modal";
import ModalDialog from "react-bootstrap/ModalDialog";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";

class DraggableModalDialog extends React.Component {
  render() {
    return (
      <Draggable handle=".modal-title">
        <ModalDialog {...this.props} />
      </Draggable>
    );
  }
}

class MyModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { show: true };
  }

  render() {
    return (
      <Modal
        show={this.state.show}
        onHide={() => this.setState({ show: !this.state.show })}
        dialogAs={DraggableModalDialog}
      >
        <Resizable className="modal-resizable" defaultSize={{ width: "auto", height: "auto" }}>
          <Modal.Header closeButton>
            <Modal.Title>Title</Modal.Title>
          </Modal.Header>
          <Modal.Body>Body</Modal.Body>
          <Modal.Footer>Footer</Modal.Footer>
        </Resizable>
      </Modal>
    );
  }
}
```

We have now wrapped the header, body & footer in a `Resizable` component.  Notice that we have set `defaultSize={{ width: "auto", height: "auto" }}`.  This is because we don't know the size of our modal every time we open it because it may contain different content.  Therein lies the reason why we went with the `re-resizable` package, because it can handle dynamic computation of the initial size.  Otherwise I would have stuck with the STRML packages and used `react-resizable` but this is easier for us lazy folks who like a lot of different content without maintain a long list of dimension configurations.

There is also some styling modifications required to get resizing to work correctly:
```CSS
.modal-content {
  /* this is because we can resize this background so we'll hide it. The coloring will
  now be maintained by the modal-resizable class */
  background: transparent;
}

.modal-content > .modal-resizable {
  background-color: white;
  background-clip: padding-box;
  border: 1px solid #ebedee;
  border: 0;
  border-radius: .2em;
  box-shadow: 0 0 0 1px rgba(101, 108, 126, 0.5) inset, 0 1px 3px 1px rgba(64, 64, 64, 0.5);
}

.modal-resizable > .modal-body {
  /* This is to account for the height of the footer */
  padding: 1em 1em 5em 1em;
}

.modal-footer {
  /* this is to keep the footer pinned to the bottom when we resize */
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 10;
}
```

And now you should have some nice modal components that can be dragged & resized at will!

Hope this helps and support open-source by putting your :star: on this repo!

**BONUS POINTS**

I ended up adding a little resize handle to the corner of my modals so that it might be a little more intuitive that resizing exists.  The problem I'm having is that resize drag is not triggered until you hover outside of the handle so it's a little counter intuitive (if you watch the demo at the top you'll see what I'm talking about when I try to drag from the lower right corner).  I need to try and find a way to make the resize get triggered on a smaller window.  It looks like there is some padding before it is triggered rather than right at the edge of the modal.

