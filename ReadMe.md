# Get start

1. Look up .env.examnple file, clone as .env
1. Modify .env with yours PayPal REST App API Credential (Login https://developer.paypal.com for REST App creation)
1. Open terminal and navigate to this folder
1. For initial setup, run `npm install` to install needed NPM modules
1. Run `npm start` to start the NodeJS Express Application

# CSV example

You can find the CSV example: ./tracking-file.csv

# Config

Look up `.env` file to config PayPal API credentials


# Available actions

- `http://127.0.0.1:3000/` import CSV to submit tracking info


# CSV Format

CSV Header: `transaction_id,tracking_number,carrier,status,`
