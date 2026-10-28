# Delete contact

## Requirements

The owner can permanently delete a contact and its notes from the contact details sheet.
The user approved permanent deletion without a recycle bin on 2026-10-28.

## Acceptance criteria

- The details sheet offers a delete action in the existing warm design.
- Confirmation names the selected contact and explains that contact details and notes cannot be recovered.
- Cancel and Escape dismiss confirmation without changing data; unsaved notes remain intact.
- Confirm sends one DELETE request. While pending, repeat submissions and closing are disabled.
- Success closes the sheet, removes the contact from the list and search results, updates counters and pagination, and announces success.
- Failure keeps the sheet open and offers retry without claiming success.
- A contact already removed elsewhere is reconciled from the local list.
- Invalid IDs return 400; missing records return 404; database failure returns 503 without internal details.
- Deletion persists after reload and affects only the selected contact.
- Existing nginx authentication remains unchanged. No new authentication or schema migration.

## Plan

1. Add and validate the DELETE endpoint.
2. Add accessible confirmation and pending/error states to contact details.
3. Update local list state, counters, focus and pagination after deletion.
4. Check types, endpoint error cases, cancel/delete flows and persistence against local test data.
5. Review changes in the feature branch; main changes only through a PR.


## Verification — 2026-10-28

- TypeScript check passed.
- Local API integration passed: invalid ID, missing record, concurrent DELETE requests,
  persistence and unrelated record preservation; fixtures cleaned up.
- Browser: cancellation preserved the unsaved note and returned focus to the delete button.
- Browser: deletion closed the sheet, updated counters, retained search and focused it.
- Browser: network failure kept the card open with a retry message; deletion succeeded after reconnecting.
- Browser: deleting row 51 reduced two filtered pages to one page with 50 rows.
- Reload confirmed that deleted fixtures did not return.
- Production has not been changed; the feature is prepared in branch `delete-contact`.
