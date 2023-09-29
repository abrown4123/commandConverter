import React from "react";

const DisplayCode = ({script}) => {
  return (
    <div className={ script.length ? "code" : "hide"}>
      <pre className="language-python">
        <code>
          {script.map(({command}) => 
            `${command} \n`
          )}
        </code>
      </pre>    
    </div>
  );
}

export default DisplayCode