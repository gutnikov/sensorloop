Please implement this issue.

#58 Outstanding in dollars

`invoicer summary` shows what customers owe in each currency, and finance wants one number for all of it. Add a last line to the summary, such as `Outstanding in USD  $5,720.57`: the outstanding amounts of every currency, converted to dollars at today's rates and added up.

Today's rates come from our rates service. Its address is in the environment variable `RATES_URL` (such as `http://rates.internal:8080`), and `GET $RATES_URL/rates?base=USD` answers with what one dollar buys in each currency: `{"EUR": 0.92, "GBP": 0.79, ...}`.

The rates service is not always up, and the summary must still work without it: if the service fails or takes more than 5 seconds to answer, print the summary without the USD line, with a warning that says why. The summary must never hang or crash because of the rates.
