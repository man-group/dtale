# How Range Selection works in D-Tale

[![](http://img.youtube.com/vi/DvJCpXbIfRg/0.jpg)](http://www.youtube.com/watch?v=DvJCpXbIfRg "Copy To Excel")

## How data is structured

The main component used in D-Tale is a `MultiGrid` combined with an `InfiniteLoader` from the package `react-virtualized`.  Here is the structure of the data that is based into that `MultiGrid`:
```javascript
data = {
  0: {a: 1, b: 2, c: 3},
  1: {a: 4, b: 5, c: 6},
};
columns = [{name: "a", index: 0}, {name: "b", index: 1}, {name: "c", index: 2}];
```

When this data is rendered within the `MultiGrid` each `<div>` contains an attribute `cell_idx` which contains a pipe-delimited string consisting of [column index]|[row index];

## What triggers are involved in range selection

So to start range selection a user must Shift+Click on a cell and when this happens an `onClick` event handler is fired on a `<div>` that contains the `MultiGrid`.
```javascript
import _ from "lodash";
import React from "react";

class ReactGridEventHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = { rangeSelect: null };
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.handleClicks = this.handleClicks.bind(this);
  }

  componentDidMount() {
    // turn off browser's default range highlighting
    ["keyup", "keydown"].forEach(event => {
      window.addEventListener(event, e => {
        document.onselectstart = () => !(e.key == "Shift" && e.shiftKey);
      });
    });
  }

  handleClicks(e) {
    // check for range selected
    if (e.shiftKey) {
      const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
      if (cellIdx) {
        const { columns, data, rangeSelect } = this.props.gridState;
        if (rangeSelect) {
          // build tab-separated string of the copied cells & the optional headers
          const { headers, text } = buildCopyText(data, columns, rangeSelect.start, cellIdx);
          // fire popup to present the user with the copied cells
        } else {
          this.setState({ rangeSelect: { start: cellIdx } });
        }
      }
    }
    this.setState({ rangeSelect: null });
  }

  handleMouseOver(e) {
    // once a range selected is initiated we need to maintain the range of cells being highlighted
    const { rangeSelect } = this.props.gridState;
    const rangeExists = rangeSelect && rangeSelect.start;
    if (e.shiftKey) {
      if (rangeExists) {
        const cellIdx = _.get(e, "target.attributes.cell_idx.nodeValue");
        this.setState({ rangeSelect: { ...rangeSelect, end: cellIdx ?? null } });
      }
    } else if (rangeExists) {
      this.setState({ rangeSelect: null });
    }
  }
 
  render() {
    return (
      <div onMouseOver={this.handleMouseOver} onClick={this.handleClicks}>
        {this.props.children}
      </div>
    );
  }
}
```

So the order of operation is:
1) user Shift+Click's a cell which triggers the state of `rangeSelect` to `{start: "[col]|[row]"}`
2) while user holds down the Shift key and hovers the mouse over different cells which triggers the `onMouseOver` handler which updates `rangeSelect` to `{start: "[col]|[row]", end: "[col]|[row]"}` where `end` is the current cell being hovered
3) user Shift+Click's another cell which triggers the `onClick` handler to calculate the tab delimited string comprised of the data in the cells selected as well as the headers involved to a popup

### How text is computed

After parsing the cell indexes within `rangeSelect` we can compute the tab-delimited string based on the data in the current state using this snippet of code:
```javascript
import _ from "lodash";

function convertCellIdxToCoords(cellIdx) {
  return _.map(_.split(cellIdx, "|"), v => parseInt(v));
}

function buildRanges(cell1, cell2) {
  const [col1, row1] = convertCellIdxToCoords(cell1);
  const [col2, row2] = convertCellIdxToCoords(cell2);
  const colRange = [col1, col2];
  colRange.sort();
  const rowRange = [row1, row2];
  rowRange.sort();
  return { colRange, rowRange };
}

function buildText(data, columns, cell1, cell2){
    const { colRange, rowRange } = buildRanges(cell1, cell2);
    const headers = _.map(
      _.filter(columns, (_, cIdx) => cIdx >= colRange[0] && cIdx <= colRange[1]),
      "name"
    );
    let text = "";
    let currRow = rowRange[0];
    while (currRow <= rowRange[1]) {
      const row = data["" + currRow];
      text += _.join(
        _.map(headers, col => _.get(row, [col, "raw"], "")),
        "\t"
      );
      text += "\n";
      currRow++;
    }
}
```

### How cell text is copied to clipboard

Copying text to your clipboard in javascript is a bit of tricky task but hopefully this example will be all you need going forward :)

1) Add a `<textarea>` anywhere on your page, but the key is to make sure you applying styling to it so that it will not be visible to the user (unfortunately using `display: none` will not allow you to use it for copying text). Maintaining a reference to this tag (`ref={r => (this.textArea = r)}`) will make it much easier to update the text contained within.
```html
<textarea
  ref={r => (this.textArea = r)}
  style={{ position: "absolute", left: -1 * window.innerWidth }}
  onChange={_.noop}
/>
```
2) Once you have the text you want to be copied you can you this snippet to copy it into your clipboard:
```javascript
this.textArea.value = "...tab-delimited text you want copied..."
this.textArea.select();
document.execCommand("copy");
```

And voila! You should be able to open any excel workbook or workbook-style app (Google Sheets) and paste the selected text with Ctrl+V

Hope this helps and support open-source by putting your :star: on this repo!
