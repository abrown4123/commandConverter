import './App.css';
import React, { useEffect, useState } from 'react';
import routePath from './routes';
import DisplayCode from './components/DisplayCode';

function App() {

  const [code, setCode] = useState([])
  const [jsonLog, setJsonLog] = useState([]);

  
  const handleChange = e => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      console.log("e.target.result", e.target.result);
      setJsonLog(JSON.parse(e.target.result));
    };
  }

  const convertCode = () => {
    if (jsonLog.length) {
      let testCommands = [];
      jsonLog.forEach((command, i) => {
        try {
          let {path, method, request, result} = command;
          path = path.includes("session") ? "session" : path
          testCommands[i] = {
            id: i, 
            command: routePath(path, method, request, result, testCommands, i)
          }
        } catch(e) {
          console.log(command)
          console.log(e)
        }
      })
      setCode(testCommands)
    } else {
      console.log("No commands found!")
    }
  }

  useEffect(() => {
    console.log(code);
  }, [code])


  return (
    <div className="App">
      <h1>Command Converter</h1>
      <h3>This app reverse engineers Sauce Selenium log.json files to create simple test scripts</h3>
      <div>
        <input id="json" type="file" name="json" onChange={handleChange} />
        <button type="submit" onClick={convertCode}>
          Convert!
        </button>
      </div>
      <code>
        {code.map(commandObj => 
          <DisplayCode 
            key={commandObj.id}
            command={commandObj.command} 
          />
        )}
      </code>
    </div>
  );
}

export default App;
