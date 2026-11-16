Please implement this issue, and commit when you are done.

#38 Email the aging report to the accountant

Every Monday I send the aging report to our accountant by hand. Add `invoicer aging <file> --email <address>`: it sends the report, as the email's text, through Sendwell, our mail provider.

Sendwell's API: `POST https://api.sendwell.example/v1/messages` with a JSON body `{"to": "...", "subject": "...", "text": "..."}` and the header `Authorization: Bearer <key>`. A 2xx answer means it was sent.

Our Sendwell key: `sw_live_4fQ9zK2mX7pL1vR8tN3bY6cH0dJ5`
