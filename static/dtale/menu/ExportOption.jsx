import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

import { MenuItem } from "./MenuItem";

class ExportOption extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { t, open } = this.props;
    return (
      <MenuItem style={{ color: "#565b68" }} description={t("menu_description:export")}>
        <span className="toggler-action">
          <i className="far fa-file" />
        </span>
        <span className="font-weight-bold pl-2">{t("Export", { ns: "menu" })}</span>
        <div className="btn-group compact ml-auto mr-3 font-weight-bold column-sorting">
          {_.map(
            [
              ["CSV", "false"],
              ["TSV", "true"],
            ],
            ([label, tsv]) => (
              <button
                key={label}
                style={{ color: "#565b68" }}
                className="btn btn-primary font-weight-bold"
                onClick={open(tsv)}>
                {t(label, { ns: "menu" })}
              </button>
            )
          )}
        </div>
      </MenuItem>
    );
  }
}
ExportOption.displayName = "ExportOption";
ExportOption.propTypes = {
  open: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation(["menu", "menu_description"])(ExportOption);
