Please fix this issue.

#9516 [Bug]: Budget Template - When budgeting to a repeating annual schedule, bill is paid 1 month early and "skip next scheduled date" selected, budget increases in month of original bill

### What happened?

Scenario: I have a bill due annually in November. This year there was a deal but it expired on Oct 31st, so I paid the bill in October, rolled over the excess, and selected "Skip next scheduled date" so the schedule would advance to next year. However, now the budget automation is budgeting the entire next year's amount plus the monthly amount in November.

Expected: Since the schedule has been advanced until next year, the budget should calculate for next year, not the current year.

### How can we reproduce the issue?

1. Create a schedule with an annual due date
2. Set a budget automation tied to this schedule
3. Pay the bill early and skip the next scheduled date. Optional: Rollover overspending on the category.
4. Apply budget template in month bill is due, the monthly goal will now be what would have originally been budgeted for this month plus the whole annual amount. It should just fill in the regular monthly amount since the bill has been paid and advanced.

### Where are you hosting Actual?

Docker
