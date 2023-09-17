import React from "react";

const DisplayCode = (props) => {
  return (
    <>
      <pre>{props.command}</pre>
    </>
  );
}

export default DisplayCode