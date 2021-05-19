import React from "react";
import ReactSlider from "react-slider";
import styled from "styled-components";

export const StyledSlider = styled(ReactSlider)`
  width: 100%;
  height: 25px;
`;

export const StyledThumb = styled.div`
  height: 25px;
  line-height: 25px;
  width: 25px;
  text-align: center;
  background-color: #000;
  color: #fff;
  border-radius: 50%;
  cursor: grab;
`;

export const Thumb = (props, state) => <StyledThumb {...props}>{state.valueNow}</StyledThumb>;

export const StyledTrack = styled.div`
  top: 0;
  bottom: 0;
  background: ${props => (props.index === 1 ? "#2a91d1" : "#ddd")};
  border-radius: 999px;
`;

export const Track = (props, state) => <StyledTrack {...props} index={state.index} />;

export const SingleStyledTrack = styled.div`
  top: 0;
  bottom: 0;
  background: ${props => (props.index === 0 ? "#2a91d1" : "#ddd")};
  border-radius: 999px;
`;

export const SingleTrack = (props, state) => <SingleStyledTrack {...props} index={state.index} />;
