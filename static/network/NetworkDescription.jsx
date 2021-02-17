import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import Collapsible from "../Collapsible";

class NetworkDescription extends React.Component {
  constructor(props) {
    super(props);
    this.renderDescription = this.renderDescription.bind(this);
  }

  renderDescription() {
    const { t } = this.props;
    return (
      <div className="row pt-3 pb-3">
        <div className="col-auto">
          <h3>{t("Example Data")}</h3>
          <table border="1" className="text-center">
            <thead>
              <tr>
                <th className="p-3">to</th>
                <th className="p-3">from</th>
                <th className="p-3">group</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>a</td>
                <td>b</td>
                <td>1</td>
              </tr>
              <tr>
                <td>b</td>
                <td>c</td>
                <td>2</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col">
          <ul>
            <li>
              {t("description1")}
              <b>to</b>
              {` ${t("and")} `}
              <b>from</b>
              {t("description2")}
              <b>group</b>
              {t("description3")}
            </li>
            <li>
              {t("description4")}
              <b>a</b>
              {t("description5")}
            </li>
            <li>{t("description6")}</li>
            <li>{t("description7")}</li>
            <li>
              <b>{t("Clicking")}</b>
              {t("description8")}
            </li>
            <li>
              <b>{t("Double Clicking")}</b>
              {t("description9")}
              <b>{t("Esc")}</b>
              {t("description10")}
            </li>
            <li>
              <b>{t("description11")}</b>
              {t("description12")}
              <b>{t("Shortest Path")}</b>
              {t("description13")}
            </li>
          </ul>
        </div>
      </div>
    );
  }

  render() {
    const { t } = this.props;
    const title = (
      <React.Fragment>
        {t("Network Viewer ")}
        <small>({t("expand for directions")})</small>
      </React.Fragment>
    );
    return (
      <div className="row pb-5">
        <div className="col-md-12">
          <Collapsible title={title} content={this.renderDescription()} />
        </div>
      </div>
    );
  }
}
NetworkDescription.propTypes = { t: PropTypes.func };
export default withTranslation("network")(NetworkDescription);
