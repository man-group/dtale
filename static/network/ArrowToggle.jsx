import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class ArrowToggle extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { updateArrows, t, to, from } = this.props;
    return (
      <div className="col-auto pl-0">
        <b>{t("Arrows")}</b>
        <div className="btn-group compact col-auto">
          <button className={`btn btn-primary ${to ? "active" : "inactive"}`} onClick={() => updateArrows({ to: !to })}>
            {t("To")}
          </button>
          <button
            className={`btn btn-primary ${from ? "active" : "inactive"}`}
            onClick={() => updateArrows({ from: !from })}>
            {t("From")}
          </button>
        </div>
      </div>
    );
  }
}
ArrowToggle.displayName = "ArrowToggle";
ArrowToggle.propTypes = {
  updateArrows: PropTypes.func,
  to: PropTypes.bool,
  from: PropTypes.bool,
  t: PropTypes.func,
};
export default withTranslation("network")(ArrowToggle);
