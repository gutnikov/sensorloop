Please fix this issue.

#59 Long billing emails can't be saved

Since Tuesday customers can give a billing email for their invoices, and support already has two who can't save theirs: anything longer than 100 characters fails with `value too long for type character varying(100)`. One of them is the accounts-payable mailbox of a hospital group, 112 characters. An email address can be up to 254 characters; please accept those.
