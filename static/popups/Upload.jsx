import $ from "jquery";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Dropzone from "react-dropzone";
import { connect } from "react-redux";

import { Bouncer } from "../Bouncer";
import { RemovableError } from "../RemovableError";
import menuFuncs from "../dtale/menu/dataViewerMenuUtils";
import { buildForwardURL } from "./reshape/Reshape";

require("./Upload.css");

class ReactUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
    };
    this.onDrop = this.onDrop.bind(this);
  }

  onDrop(files) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        /*
         * I'm not sure if reader.onload will be executed in order.
         * For example, if the 1st file is larger than the 2nd one,
         * the 2nd file might load first.
         */
        const contents = reader.result;
        const size = file.size;
        const name = file.name;
        const lastModified = new Date(file.lastModified);
        this.setState(
          {
            file: { size, name, lastModified },
            loading: true,
            error: null,
          },
          () =>
            $.post(menuFuncs.fullPath("/dtale/upload"), { contents, filename: name }, data => {
              if (data.error) {
                this.setState({ error: <RemovableError {...data} /> });
                return;
              }
              if (_.startsWith(window.location.pathname, "/dtale/popup/upload")) {
                window.opener.location.assign(buildForwardURL(window.opener.location.href, data.data_id));
                window.close();
                return;
              }
              const newLoc = buildForwardURL(window.location.href, data.data_id);
              window.location.assign(newLoc);
            })
        );
      };
      reader.readAsDataURL(file);
    });
  }

  render() {
    const { error, file, loading } = this.state;
    return (
      <div key="body" className="modal-body">
        <div className="row">
          <div className="col-md-12">
            <Dropzone
              onDrop={this.onDrop}
              disabled={false}
              disableClick={false}
              maxSize={Infinity}
              minSize={0}
              multiple={false}
              activeStyle={{
                borderStyle: "solid",
                borderColor: "#6c6",
                backgroundColor: "#eee",
              }}
              rejectStyle={{
                borderStyle: "solid",
                borderColor: "#c66",
                backgroundColor: "#eee",
              }}
              disabledStyle={{ opacity: 0.5 }}>
              {({ getRootProps, getInputProps }) => (
                <section className="container">
                  <div
                    {...getRootProps({
                      className: "filepicker dropzone dz-clickable",
                    })}>
                    <input {...getInputProps()} />
                    <div data-filetype=".csv" className="filepicker-file-icon"></div>
                    <div data-filetype=".tsv" className="filepicker-file-icon"></div>
                    <div className="dz-default dz-message">
                      <span>Drop files here to upload, or click to select files</span>
                    </div>
                  </div>
                  <aside className="dropzone-aside">
                    {file && (
                      <React.Fragment>
                        <h4>Loading File</h4>
                        <ul>
                          <li>{`${file.name} - ${file.size} bytes`}</li>
                          <li>{`Last Modified: ${file.lastModified}`}</li>
                        </ul>
                      </React.Fragment>
                    )}
                    {loading && <Bouncer />}
                    {error}
                  </aside>
                </section>
              )}
            </Dropzone>
          </div>
        </div>
      </div>
    );
  }
}
ReactUpload.displayName = "Upload";
ReactUpload.propTypes = {
  chartData: PropTypes.shape({
    visible: PropTypes.bool.isRequired,
  }),
  onClose: PropTypes.func,
};

const ReduxUpload = connect(state => _.pick(state, ["chartData"]))(ReactUpload);

export { ReactUpload, ReduxUpload as Upload };
