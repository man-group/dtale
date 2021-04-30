import moment from "moment";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";

class QueryExamples extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <p className="font-weight-bold mb-0">{t("Example Queries")}</p>
        <ul className="mb-3">
          <li>
            {`${t("wrap column names in backticks that are protected words or containing spaces/periods")}: `}
            <span className="font-weight-bold">{"`from` == 5 and `Col 1` == 2 and `Col.1` == 3"}</span>
          </li>
          <li>
            {`${t("drop NaN values")}: `}
            <span className="font-weight-bold">{"Col == Col"}</span>
          </li>
          <li>
            {`${t("show only NaN values")}: `}
            <span className="font-weight-bold">{"Col != Col"}</span>
          </li>
          <li>
            {`${t("date filtering")}: `}
            <span className="font-weight-bold">{`Col == '${moment().format("YYYYMMDD")}'`}</span>
          </li>
          <li>
            {`${t("in-clause on string column")}: `}
            <span className="font-weight-bold">{"Col in ('foo','bar')"}</span>
          </li>
          <li>
            {`${t("and-clause on numeric column")}: `}
            <span className="font-weight-bold">{"Col1 > 1 and Col2 <= 1"}</span>
          </li>
          <li>
            {`${t("or-clause on numeric columns")}: `}
            <span className="font-weight-bold">{"Col1 > 1 or Col2 < 1"}</span>
          </li>
          <li>
            {`${t("negative-clause")}: `}
            <span className="font-weight-bold">{"~(Col > 1)"}</span>
          </li>
          <li>
            {`${t("parenthesis usage")}: `}
            <span className="font-weight-bold">{"(Col1 > 1 or Col2 < 1) and (Col3 == 3)"}</span>
          </li>
          <li>
            {`${t("regex usage (search for substrings 'foo' or 'bar')")}:`}
            <br />
            <span className="font-weight-bold">{"Col.str.contains('(foo|bar)', case=False)"}</span>
          </li>
        </ul>
      </React.Fragment>
    );
  }
}
QueryExamples.displayName = "QueryExamples";
QueryExamples.propTypes = { t: PropTypes.func };
export default withTranslation("filter")(QueryExamples);
