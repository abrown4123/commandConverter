import './App.css';
import React, { useEffect, useState } from 'react';
import sampleData from './log';
import pythonMappings from './pythonMappings';
import DisplayCode from './components/DisplayCode';

function App() {

  const [code, setCode] = useState([])
  const convertCode = () => {
    let testCommands = [];
    sampleData.forEach(command => {
      try {
        let {path, method} = command;
        path = path.includes("session") ? "session" : path
        method === "POST" && path !== "session"
          ?
          testCommands = [...testCommands, pythonMappings[method][path](command.request.url)]
          :
          testCommands = [...testCommands, pythonMappings[method][path]]
      } catch(e) {
        console.log(command)
        console.log(e)
      }
    })
    setCode(testCommands)
  }

  useEffect(() => {
    console.log(code);
  }, [code])


  return (
    <div className="App">
      This is a placeholder
      <div>
        <button onClick={convertCode}>
          Execute function
        </button>
      </div>
      <code>
        {code.map((command, id) => 
          <DisplayCode 
            key={id}
            command={command} 
            />
        )}
      </code>
    </div>
  );
}

export default App;
