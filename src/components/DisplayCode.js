import React from "react";

const DisplayCode = ({script}) => {
  return (
    <pre className={ script.length ? "code" : "hide"}>
      <code>
        {script.map(({command}) => 
            `${command} \n`
        )}
      </code>
    </pre>    
  );
}

export default DisplayCode