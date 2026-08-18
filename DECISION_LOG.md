# Decision Log

- 2026-08-18: Fixed private events returning "Event not found" for anonymous guests — added get_event_for_guest(uuid) SECURITY DEFINER RPC since events RLS had no policy allowing anon to read a private event row by UUID; App.jsx guest deep-link now calls this RPC instead of querying events directly.
- 2026-08-18: Fixed guest_sessions INSERT failing with 42501 for private events — replaced the raw correlated subquery in anon_insert_guest_sessions's WITH CHECK with a new check_guest_session_insert_allowed() SECURITY DEFINER function, since the raw subquery hit events RLS the same way and always returned zero rows for private events regardless of actual reveal_time.
