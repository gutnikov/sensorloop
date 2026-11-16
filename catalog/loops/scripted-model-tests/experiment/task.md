Please implement this issue.

#58 categorize: get the categories through tool calling

Now and then `invoicer categorize` stops with "no JSON list of categories in the answer": the model wraps the list in prose, or puts a comment inside it. Let's stop parsing text. Give the model a tool, `save_categories`, whose input is `{ "categories": [...] }` (one category per line, in the order of the lines), and read the categories from its call.
