const fetch = require('node-fetch');
const request = require('request');
const net = require("net");


// wrap a request in an promise
function downloadPage(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
        });
    });
}

function downloadPageFetch(url) {
    let settings = { method: "Get", headers:{host:"dns.google"}};
    return fetch(url, settings)
	.then(res => res.text())
}

async function getResolution(url) { // url is the URL we want to resolve
  const req = await downloadPageFetch(`https://8.8.8.8/resolve?name=${url}`); // make a request to googles DOH server
  const parsed = JSON.parse(req); // Parse DOH request
  try {
    return parsed.Answer[0].data; // get parsed data and extract answer
  } catch {
    return "8.8.8.8"; // if we fail to get an IP, return 8.8.8.8
  }
}

async function getIP(url) { // wrapper around getResolution, 
    try { // due to high chance of failure, wrap in try
        const result = await getResolution(url); // resolve request
        if(net.isIP(result) == "0" && result.includes(".")) { // Check if result is an IP
            console.log("is DNS, retrying, ", result);
            return await getIP(result); // if the result isn't an IP, repeat this function (recursive)
        } else {
            return result; // once an IP is gotten, return (recursive)
        }
    } catch (e) {
        console.log("Failed to get IP, stack trace below: ")
        console.log(e);
    }
}

async function run() {
  console.log(await getIP("google.com")) // this is a test and can safely be commented out or ignored
}
run(); // run test

module.exports = { // create public functions
  getIP,
  getResolution,
  downloadPage
}

// DOH stands for DNS Over HTTPS
