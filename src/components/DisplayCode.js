import React from "react";

const DisplayCode = ({script}) => {
  return (
    <div className={ script.length ? "code" : ""}>
      <pre className="language-python">
        {script.map(({id, command}) => <code key={id}> {command}</code>)}
      </pre>    
    </div>
  );
}

export default DisplayCode