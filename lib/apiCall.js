import fetch from 'node-fetch'
import { REST_API_REGION } from './endpoints.js'
import test from 'node:test';
import assert from 'node:assert';


/* Returns username and api key credentials from parsed cli input */
function credentialsCLI() {
    let args = process.argv.splice(2);
    let enoughArgs = args.length < 2 ? false : true
    if (!enoughArgs) {
        console.error("need at least Sauce Labs username and api key")
        process.exit(1)
    }
    let userArg = args[0], keyArg = args[1];
    return { 
        username: userArg,
        key: keyArg
    }
}

test('cli args captured', (t) => {
    process.argv[2] = "max.dobeck 12345"
    let creds = credentialsCLI()
    assert.equal(creds.username, "max.dobeck");
    assert.equal(creds.key, "12345");
});
