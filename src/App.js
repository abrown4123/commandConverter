import './App.css';
import React, { useEffect, useState } from 'react';
import pythonMappings from './pythonMappings';
import DisplayCode from './components/DisplayCode';

function App() {

  const [code, setCode] = useState([])
  const [jsonLog, setJsonLog] = useState([]);

  const locatorStrategy = request => {
    if(request.using.includes("css")) return "css"
    if(request.using.includes("xpath")) return "xpath"
  }

  const handleChange = e => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      console.log("e.target.result", e.target.result);
      setJsonLog(JSON.parse(e.target.result));
    };
  }

  const getElementId = result => {
    for(let propName in result) {
      return result[propName];
    }
  }

  const routePath = (path, method, request, result, testCommands, i) => {
    if (method === "POST" && path === "url") return pythonMappings[method][path](request.url) //This path is driver.get

    if (method === "POST" && path === "element") { //This path is findElem
      let strategy = locatorStrategy(request)
      testCommands[getElementId(result)] = `elem${i}` 
      return pythonMappings[method][path][strategy](`elem${i}`, request.value)
    }

    if (method === "POST" && path.includes("click")) {
      let clickId = path.split("/")[1];
      return pythonMappings[method]["click"](testCommands[clickId]) //this is click
    }

    if (method === "POST" && path.includes("value")) return pythonMappings[method]["sendKeys"](testCommands[request.id], request.text) //this is sendKeys

    if (pythonMappings[method][path] !== undefined) return pythonMappings[method][path]

    return `This command is not yet supported. ${method}: ${path}`
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
      <h3>This app reverse engineers Sauce Selenium log.json files to simple test scripts</h3>
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
