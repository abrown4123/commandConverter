import './App.css';
import React, { useEffect, useState } from 'react';
import seleniumRoutePath from './seleniumRoutes';
import appiumRoutePath from './appiumRoutes';
import DisplayCode from './components/DisplayCode';

function App() {

  const [code, setCode] = useState([])
  const [jsonLog, setJsonLog] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  
  const handleChange = e => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        console.log("e.target.result", JSON.parse(e.target.result));
        setJsonLog(JSON.parse(e.target.result));
      } catch(e) {
          console.log(e)
          setErrorMessage(`The uploaded file is not valid JSON`);
          setTimeout(() => {
            setErrorMessage(null);
          }, 5000)
      }
    };
  }

  const convertCode = () => {
    if (jsonLog.length) {
      let testCommands = [];
      console.log(jsonLog)
      let codeRoute = jsonLog[0].requestBody !== undefined ? appiumRoutePath : seleniumRoutePath;
      console.log(codeRoute)
      // console.log(JSON.parse(jsonLog[1].requestBody))
      jsonLog.forEach((command, i) => {
        try {
          
          testCommands[i] = {
            id: i, 
            command: codeRoute(command, testCommands, i)
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
      <h4 className="error">{errorMessage}</h4>
      <div>
        <input id="json" type="file" name="json" accept="json" onChange={handleChange} />
        <button type="submit" onClick={convertCode}>
          Convert!
        </button>
      </div>
      <DisplayCode script={code} />
    </div>
  );
}

export default App;
