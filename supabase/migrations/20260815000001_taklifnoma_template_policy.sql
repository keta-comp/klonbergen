-- Allow the new editorial builder template ids (t1..t4) in the public
-- insert policy. Without this, inserts from the Taklifnoma builder are
-- rejected by RLS even though the `template` column is plain text.
drop policy if exists "Anyone can create validated invitations" on public.invitations;

create policy "Anyone can create validated invitations"
  on public.invitations for insert
  to anon, authenticated
  with check (
    char_length(slug) between 6 and 60
    and char_length(bride_name) between 1 and 60
    and char_length(groom_name) between 1 and 60
    and char_length(hall_name) between 1 and 120
    and (address is null or char_length(address) <= 300)
    and template in ('luxury','minimal','classic','royal','modern','t1','t2','t3','t4')
    and coalesce(array_length(photos, 1), 0) <= 5
    and views = 0
  );
