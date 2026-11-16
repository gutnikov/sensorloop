Please fix this issue.

#9415 [Bug]: safeNumber: can't safely perform arithmetic with number

### What happened?

I am trying to import the following transaction from my bank account to a local Actual account. It seems like there might be floating point overflow/underflow happening?

```
Something went wrong loading this section.
safeNumber: can't safely perform arithmetic with number: -2254107490366200
```

mvp4.csv (attached):

```
Date,Transaction Type,Amount,,,,,,,,
2026-04-08,Buy,-18.818689242668,,,,,,,,
2026-04-08,Buy,-12039.958653084400,,,,,,,,
2026-04-08,Forex Trade Component,-1.26313799999993E-06,,,,,,,,
2026-03-27,Buy,-9.953776817384400,,,,,,,,
2026-03-25,Buy,-0.096469531158,,,,,,,,
2026-03-25,Buy,-3.625916129836,,,,,,,,
2026-01-08,Buy,-4185.895812000000,,,,,,,,
2026-01-08,Forex Trade Component,-1.1148430000001800,,,,,,,,
2026-01-06,Forex Trade Component,-1.69622000000036E-04,,,,,,,,
```

### How can we reproduce the issue?

1. Create a new budget file.
2. Create a new local account.
3. Import the attached mvp4.csv.
4. Observe the error in the UI.

### Where are you hosting Actual?

Docker

### What browsers are you seeing the problem on?

Safari

### Operating System

Mac OSX
