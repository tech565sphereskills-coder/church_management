import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';

export type EventType = 'service' | 'meeting' | 'conference' | 'special' | 'rehearsal' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location?: string;
  department?: string;
  department_name?: string;
  organizer?: string;
  organizer_name?: string;
  is_service_model?: boolean;
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async (start?: string, end?: string) => {
    setLoading(true);
    try {
    const params: Record<string, string> = {};
    if (start) params.start = start;
    if (end) params.end = end;
      
      const response = await api.get('/calendar/unified_feed/', { params });
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch calendar events', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = async (data: Partial<CalendarEvent>) => {
    try {
      const response = await api.post('/calendar/', data);
      await fetchEvents();
      return response.data;
    } catch (error) {
      console.error('Failed to create event', error);
      throw error;
    }
  };

  const updateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    try {
      const response = await api.patch(`/calendar/${id}/`, data);
      await fetchEvents();
      return response.data;
    } catch (error) {
      console.error('Failed to update event', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/calendar/${id}/`);
      await fetchEvents();
    } catch (error) {
      console.error('Failed to delete event', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}
