import React from "react";

const DisplayCode = ({script}) => {
  return (
    <div>
      <div className={ script.length ? "code" : "hide"}>
        <pre>
          <code className="language-python">
            {script.map(({command}) => 
              `${command} \n`
            )}
          </code>
        </pre>    
      </div>
    </div>
  );
}

export default DisplayCode