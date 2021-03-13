# I was able to make the columns in my react-virtualized MultiGrid to be resizable!

This update was actually surprisingly easy using `react-draggable`! Here is a much more simplified version of my application code so its a little easier to understand the resizing functionality (the actual source code to my grid is [here](https://github.com/man-group/dtale/blob/master/static/dtale/DataViewer.jsx):

```jsx
import React from "react";
import Draggable from "react-draggable";
import AutoSizer from "react-virtualized/dist/commonjs/AutoSizer";
import MultiGrid from "react-virtualized/dist/commonjs/MultiGrid";

const ROW_HEIGHT = 25;
const HEADER_HEIGHT = 35;

export default class MyGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: [
        { name: "col1", width: 100 },
        { name: "col2", width: 100 },
        { name: "col3", width: 100 }
      ],
      data: [
        { col1: 1, col2: "a", col3: 4.44},
        { col1: 2, col2: "b", col3: 5.55},
        { col1: 3, col2: "c", col3: 6.66},
      ]
    }
    this.cellRenderer = this.cellRenderer.bind(this);
    this.grid = React.createRef();
  }

  cellRenderer({ columnIndex, key, rowIndex, style }) {
    const { columns, data} = this.state;
    if (rowIndex === 0) {
      if (cellIndex === 0) {
        return null; // ignore the upper lefthand corner
      }
      const headerIndex = columnIndex - 1;
      const colCfg = columns[headerIndex];
      return (
        <div key={key} style={style}>
            <div className={`text-nowrap w-100${colCfg.resized ? " resized" : ""}`}>
              {colCfg.name}
            </div>
            <Draggable
              axis="x"
              defaultClassName="DragHandle"
              defaultClassNameDragging="DragHandleActive"
              onDrag={(e, { deltaX }) => this.resizeCol(headerIndex, deltaX)}
              position={{ x: 0 }}
              zIndex={999}>
              <div className="DragHandleIcon">⋮</div>
            </Draggable>
        </div>
      );
    }
    const colCfg = columns[columnIndex - 1];
    const value = data[rowIndex - 1][colCfg.name];
    const divProps = colCfg.resized ? { className: "resized" } : {};
    return (
      <div key={key} style={style} {...divProps}>
        {value}
      </div>
    );
  }

  resizeCol(columnIndex, deltaX) {
    const updatedColumns = this.state.columns.map((colCfg, index) => {
      if (columnIndex === index) {
        return {...colCfg, width: Math.max(colCfg.width + deltaX, 10), resized: true };
      }
      return { ...colCfg };
    });
    this.setState({ columns: updatedColumns }, () => {
      this.grid.current?.forceUpdate();
      this.grid.current?.recomputeGridSize();
    });
  }

  render() {
    return (
      <AutoSizer onResize={() => this.grid.current?.recomputeGridSize()}>
        {({ width, height }) => (
            <MultiGrid
              cellRenderer={this.cellRenderer}
              height={height}
              width={width}
              columnWidth={({ index }) => index === 0 ? 100 : this.state.columns[index - 1].width}
              rowHeight={({ index }) => (index == 0 ? HEADER_HEIGHT : ROW_HEIGHT)}
              rowCount={this.state.data.length + 1}
              fixedColumnCount={1}
              fixedRowCount={1}
              ref={this.grid}  
            />
        )}
      </AutoSizer>
    );
  }
}
```

Key takeaways are that:
* continually update the column widths using the `onDrag` property on `Draggable`
* and also make sure to refresh the grid on a width change by maintaining a reference to it and calling the `forceUpdate` & `recomputeGridSize` functions after the state has been updated
* add additional styling to cells that have been resized so that text will be truncated with ellipses if it becomes too narrow.  Here are the exact styles for the `resized` class:
```css
.resized {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
```

Here are the additional style definitions for the `Draggable` component:
```css
.DragHandle {
  flex: 0 0 16px;
  z-index: 2;
  cursor: col-resize;
  color: #0085ff;
  right: 0;
  position: absolute;
}
.DragHandle:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.DragHandleActive,
.DragHandleActive:hover {
  color: #0b6fcc;
  z-index: 3;
}

.DragHandleIcon {
  flex: 0 0 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
```