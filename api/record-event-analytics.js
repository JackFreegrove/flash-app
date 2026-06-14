import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { event_id } = req.body ?? {};
  if (!event_id) {
    return res.status(400).json({ error: 'event_id is required' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data: existing, error: existingError } = await supabase
      .from('event_analytics')
      .select('id')
      .eq('event_id', event_id)
      .maybeSingle();

    if (existingError) {
      console.error('[record-event-analytics] Error checking existing row:', existingError.message);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existing) {
      return res.status(200).json({ message: 'already recorded' });
    }
  } catch (err) {
    console.error('[record-event-analytics] Unexpected error checking existing:', err.message);
    return res.status(500).json({ error: 'Unexpected error' });
  }

  let event;
  try {
    const { data, error } = await supabase
      .from('events')
      .select('date, expires_at, reveal_time')
      .eq('id', event_id)
      .single();

    if (error) {
      console.error('[record-event-analytics] Error fetching event:', error.message);
      return res.status(500).json({ error: 'Failed to fetch event' });
    }

    event = data;
  } catch (err) {
    console.error('[record-event-analytics] Unexpected error fetching event:', err.message);
    return res.status(500).json({ error: 'Unexpected error' });
  }

  let totalGuests = 0;
  let completedGuests = 0;
  let totalPhotos = 0;

  try {
    const { count, error } = await supabase
      .from('guest_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    if (error) {
      console.error('[record-event-analytics] Error counting guests:', error.message);
      return res.status(500).json({ error: 'Failed to count guests' });
    }

    totalGuests = count ?? 0;
  } catch (err) {
    console.error('[record-event-analytics] Unexpected error counting guests:', err.message);
    return res.status(500).json({ error: 'Unexpected error' });
  }

  try {
    const { count, error } = await supabase
      .from('guest_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('completed', true);

    if (error) {
      console.error('[record-event-analytics] Error counting completed guests:', error.message);
      return res.status(500).json({ error: 'Failed to count completed guests' });
    }

    completedGuests = count ?? 0;
  } catch (err) {
    console.error('[record-event-analytics] Unexpected error counting completed guests:', err.message);
    return res.status(500).json({ error: 'Unexpected error' });
  }

  try {
    const { count, error } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event_id);

    if (error) {
      console.error('[record-event-analytics] Error counting photos:', error.message);
      return res.status(500).json({ error: 'Failed to count photos' });
    }

    totalPhotos = count ?? 0;
  } catch (err) {
    console.error('[record-event-analytics] Unexpected error counting photos:', err.message);
    return res.status(500).json({ error: 'Unexpected error' });
  }

  const revealTime = new Date(event.reveal_time);
  const expiresAt = new Date(event.expires_at);
  const albumLifespanDays = Math.round((expiresAt - revealTime) / (1000 * 60 * 60 * 24));

  let tier;
  if (albumLifespanDays <= 6) {
    tier = 'momento';
  } else if (albumLifespanDays >= 55) {
    tier = 'premium';
  } else {
    tier = 'classic';
  }

  const photosPerGuestAvg = totalGuests > 0 ? totalPhotos / totalGuests : 0;
  const completionRate = totalGuests > 0 ? (completedGuests / totalGuests) * 100 : 0;
  const archivePurchased = albumLifespanDays > 60;

  try {
    const { error: insertError } = await supabase
      .from('event_analytics')
      .insert({
        event_id,
        event_date: event.date,
        tier,
        total_guests: totalGuests,
        total_photos: totalPhotos,
        photos_per_guest_avg: photosPerGuestAvg,
        completion_rate: completionRate,
        reveal_opened: false,
        archive_purchased: archivePurchased,
        album_lifespan_days: albumLifespanDays,
        event_type: null,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[record-event-analytics] Error inserting analytics:', insertError.message);
      return res.status(500).json({ error: 'Failed to insert analytics' });
    }
  } catch (err) {
    console.error('[record-event-analytics] Unexpected error inserting analytics:', err.message);
    return res.status(500).json({ error: 'Unexpected error' });
  }

  return res.status(200).json({ success: true, event_id });
}
