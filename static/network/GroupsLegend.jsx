import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class GroupsLegend extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { groups, t } = this.props;
    if (!_.size(groups)) {
      return null;
    }
    return (
      <div className="groups-legend">
        <div className="row">
          <div className="font-weight-bold col-md-12">{t("Groups")}</div>
          {_.map(groups, ([group, color], i) => (
            <div key={i} className="col-md-12">
              <div
                style={{
                  border: `1px solid ${color.border}`,
                  background: color.background,
                }}
                className="d-inline pl-4"
              />
              <div className="pl-3 d-inline">{group}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
GroupsLegend.displayName = "GroupsLegend";
GroupsLegend.propTypes = { groups: PropTypes.array, t: PropTypes.func };
export default withTranslation("network")(GroupsLegend);
