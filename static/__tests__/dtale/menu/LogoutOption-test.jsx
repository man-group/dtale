import { shallow } from "enzyme";
import React from "react";

import { expect, it } from "@jest/globals";

import { ReactLogoutOption } from "../../../dtale/menu/LogoutOption";

describe("LogoutOption", () => {
  let wrapper, props;

  beforeEach(() => {
    delete window.location;
    window.location = {
      assign: jest.fn(),
      origin: "origin",
    };
    props = {
      open: jest.fn(),
      username: "aschonfeld",
      auth: true,
    };
    wrapper = shallow(<ReactLogoutOption {...props} />);
  });

  it("renders sucessfully", () => {
    expect(wrapper.text()).toBe("Logout, aschonfeld");
  });

  it("shows null when no auth", () => {
    wrapper.setProps({ auth: false });
    expect(wrapper.html()).toBeNull();
  });
});
