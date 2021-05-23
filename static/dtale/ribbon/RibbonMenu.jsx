import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";

require("./RibbonMenu.scss");

class RibbonMenuItem extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  render() {
    const { name, selected, onClick, onHover } = this.props;
    return (
      <div
        id={`ribbon-item-${name}`}
        className={`col-auto ribbon-menu-item${selected === name ? " active" : ""}`}
        onClick={() => onClick(name, this.ref.current)}
        onMouseOver={() => onHover(name, this.ref.current)}
        ref={this.ref}>
        {this.props.children}
      </div>
    );
  }
}
RibbonMenuItem.displayName = "RibbonMenuItem";
RibbonMenuItem.propTypes = {
  name: PropTypes.string,
  onClick: PropTypes.func,
  onHover: PropTypes.func,
  selected: PropTypes.string,
  children: PropTypes.node,
};

class ReactRibbonMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hoverActive: false };
    this.onHover = this.onHover.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visible && !this.props.visible) {
      this.setState({ hoverActive: false });
    }
  }

  onHover(name, element) {
    if (this.state.hoverActive) {
      this.props.openRibbonDropdown(name, element);
    }
  }

  onClick(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    const { visible, mainTitle, mainTitleFont, openRibbonDropdown, ribbonDropdown, t } = this.props;
    const menuClick = (name, element) => {
      openRibbonDropdown(name, element);
      this.setState({ hoverActive: true });
    };
    const itemProps = {
      onHover: this.onHover,
      onClick: menuClick,
      selected: ribbonDropdown,
    };
    const titleStyle = { fontSize: "16px", cursor: "default" };
    if (mainTitleFont) {
      titleStyle.fontFamily = mainTitleFont;
    }
    return (
      <div className={`ribbon-menu-content${visible ? " is-expanded" : ""} row ml-0`} onClick={this.onClick}>
        <RibbonMenuItem name="main" {...itemProps}>
          <span className={`${mainTitleFont ? "" : "title-font "}title-font-base`} style={titleStyle}>
            {mainTitle ?? "D-TALE"}
          </span>
        </RibbonMenuItem>
        <RibbonMenuItem name="actions" {...itemProps}>
          <span className="align-middle">{t("Actions")}</span>
        </RibbonMenuItem>
        <RibbonMenuItem name="visualize" {...itemProps}>
          <span className="align-middle">{t("Visualize")}</span>
        </RibbonMenuItem>
        <RibbonMenuItem name="highlight" {...itemProps}>
          <span className="align-middle">{t("Highlight")}</span>
        </RibbonMenuItem>
        <RibbonMenuItem name="settings" {...itemProps}>
          <span className="align-middle">{t("Settings")}</span>
        </RibbonMenuItem>
      </div>
    );
  }
}
ReactRibbonMenu.displayName = "ReactRibbonMenu";
ReactRibbonMenu.propTypes = {
  visible: PropTypes.bool,
  openRibbonDropdown: PropTypes.func,
  ribbonDropdown: PropTypes.string,
  mainTitle: PropTypes.string,
  mainTitleFont: PropTypes.string,
  t: PropTypes.func,
};
const TranslatedRibbonMenu = withTranslation("menu")(ReactRibbonMenu);
const ReduxRibbonMenu = connect(
  ({ ribbonMenuOpen, ribbonDropdown, mainTitle, mainTitleFont }) => ({
    visible: ribbonMenuOpen,
    ribbonDropdown: ribbonDropdown.name,
    mainTitle,
    mainTitleFont,
  }),
  dispatch => ({
    openRibbonDropdown: (name, element) => dispatch({ type: "open-ribbon-dropdown", name, element }),
  })
)(TranslatedRibbonMenu);
export { ReduxRibbonMenu as RibbonMenu, TranslatedRibbonMenu as ReactRibbonMenu };
