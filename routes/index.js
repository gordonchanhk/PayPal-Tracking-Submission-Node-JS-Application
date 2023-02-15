const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csv = require('fast-csv');
const upload = multer({ dest: 'tmp/uploads/' });
const axios = require('axios');
const router = express.Router();

// load env variables
require('dotenv').config()

// Load API config from .env file
const PAYPAL_EMAIL = process.env.PAYPAL_EMAIL;
const PAYPAL_API_CLIENT = process.env.PAYPAL_API_CLIENT;
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET;
const PAYPAL_ENDPOINT = process.env.PAYPAL_ENDPOINT;
let global_access_token = '';

getAccessToken();


/* ========================== */
/* ROUTE start */
/* ========================== */

/*
GET home page
*/
router.get('/', async (req, res, next) => {
  await getAccessToken();
  res.render('index');
});


/*
POST process uploaded CSV
*/
router.post('/submit-tracking-csv', upload.single('file'), async function (req, res) {
  try{
    const fileRows = await readCSV(
      req.file.path,
      { headers: true }
    );
    let result = await processCSV(fileRows);
    res.json(result);
  }catch(e){
    console.log('Error occur');
    console.log(e);
    res.sendStatus(400);
    return;
  }
  
});

/*
Read CSV file
*/
function readCSV(path, options) {
  return new Promise((resolve, reject) => {
    const data = [];

    csv
      .parseFile(path, options)
      .on("error", reject)
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", () => {
        fs.unlinkSync(path);
        resolve(data);
      });
  });
}

/*
Function to process CSV and create draft invoice
Depends on .env config `sendInvoice` to send invoice or just keep invoice as Draft state
*/
async function processCSV(fileRows){
  await getAccessToken();

  console.log("process CSV ...");
  let trackings = [];
  // loop the CSV records
  for (const [idx,row] of fileRows.entries()) {
    console.log(idx +"\t" + row['transaction_id'] + "\t" + row['tracking_number'] + "\t" + row['carrier'] + "\t" + row['status'] + "\t");

    trackings.push({
      "transaction_id": row['transaction_id'],
      "tracking_number": row['tracking_number'],
      "status": row['status'],
      "carrier": row['carrier']
    });
    
  }

  let requestPayload = {
    trackers: trackings
  }
  console.log("requestPayload:");
  console.log(requestPayload);
  
  // Submitting tracking
  console.log(`Submitting tracking......`);
  let response = { data: {} };
  try{
    response = await axios.post(`${PAYPAL_ENDPOINT}/v1/shipping/trackers-batch`, requestPayload, {
      headers: {
          Authorization: `Bearer ${global_access_token}`,
          'Content-Type': 'application/json',
      }
    });
    console.log('Response:');
    console.log(response.data);
    return response.data;
  }catch(e){
    console.log(e.response)
  }
  console.log("=======Done======");

}

/*
Route for Access Token generation
 */
async function getAccessToken(){
  const params = new URLSearchParams()
  params.append("grant_type", "client_credentials")

  try{
    const { data: {access_token} } = await axios.post(`${PAYPAL_ENDPOINT}/v1/oauth2/token`, params, {
      headers: {
          'Content-Type': 'application/x-www-form-url-urlencoded',
      },
      auth: {
          username: PAYPAL_API_CLIENT,
          password: PAYPAL_API_SECRET,
      }
    });

    global_access_token = access_token;
  } catch( e ){
    console.log(e);
  }
  return global_access_token;
}


module.exports = router;
