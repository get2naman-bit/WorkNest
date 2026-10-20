import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import {
  mapProfile,
  mapJob,
  mapApplication,
  mapWorkHistory,
  mapReview,
  mapConversation,
  mapNotification,
  toJobRow,
  toApplicationRow,
  toReviewRow,
  toProfileRow,
} from '../lib/mappers.js';

// ==========================================
// AUTH SERVICES
// ==========================================

export async function signUp({ email, password, role, name, ...metadata }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        name,
        ...metadata,
      },
    },
  });

  if (error) throw error;

  // Insert or update profile row in public.profiles. The database
  // trigger normally creates this row, but upserting keeps things
  // consistent when the trigger is not installed.
  if (data?.user) {
    const profileRow = {
      id: data.user.id,
      email: data.user.email,
      role,
      name,
      location: metadata.location || 'Austin, TX',
      phone: metadata.phone || '',
      company_name: metadata.companyName || '',
      title: metadata.title || '',
      bio: metadata.bio || '',
      skills: metadata.skills || [],
      availability: 'Available Now',
      rating: 5.0,
      reviews_count: 0,
      jobs_completed: 0,
      verified: true,
      profile_completion: role === 'worker' ? 75 : 85,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileRow, { onConflict: 'id' });

    if (profileError) {
      console.warn('Profile upsert warning:', profileError);
    }
  }

  return data;
}

// First-time account creation is verified with a 6-digit email OTP.
// Called right after signUp() has created the unconfirmed account.
export async function sendSignupOtp(email) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  if (!email) throw new Error('An email address is required.');

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // The account was just created by signUp() — never create a second one.
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

// Verify the 6-digit signup OTP. Returns the session on success.
export async function verifySignupOtp({ email, token }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const code = String(token || '').replace(/\D/g, '');
  if (code.length !== 6) throw new Error('Enter the 6-digit code from your email.');

  // Depending on the project's templates the same code verifies as `email`
  // (generic OTP) or as `signup` (account confirmation). Try both and report
  // the first failure, which is the meaningful one ("expired / invalid").
  let firstError = null;
  for (const type of ['email', 'signup']) {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type });
    if (!error) return data?.session || null;
    if (!firstError) firstError = error;
  }

  throw firstError;
}

export async function signIn({ email, password }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function resetPassword(email) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?mode=login`,
  });
  if (error) throw error;
}

export async function changePassword(currentPassword, newPassword) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const email = userData?.user?.email;
  if (!email) throw new Error('Could not determine the signed-in account.');

  // Re-authenticate first so a stolen session alone cannot change the password.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (verifyError) throw new Error('Current password is incorrect.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ==========================================
// PROFILES
// ==========================================

export async function fetchProfile(userId) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return mapProfile(data);
}

export async function fetchAllProfiles() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data || []).map(mapProfile);
}

export async function fetchAllWorkers() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'worker');
  if (error) throw error;
  return (data || []).map(mapProfile);
}

export async function updateProfile(userId, updates) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .update(toProfileRow(updates))
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data);
}

// ==========================================
// JOBS
// ==========================================

export async function fetchJobs() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapJob);
}

export async function createJob(jobData) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('jobs')
    .insert([toJobRow(jobData)])
    .select()
    .single();
  if (error) throw error;
  return mapJob(data);
}

export async function updateJob(jobId, jobData) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('jobs')
    .update(toJobRow(jobData))
    .eq('id', jobId)
    .select()
    .single();
  if (error) throw error;
  return mapJob(data);
}

export async function closeJob(jobId) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('jobs')
    .update({ status: 'closed' })
    .eq('id', jobId)
    .select()
    .single();
  if (error) throw error;
  return mapJob(data);
}

// ==========================================
// APPLICATIONS
// ==========================================

export async function fetchApplications() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('applied_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapApplication);
}

export async function createApplication(applicationData) {
  if (!isSupabaseConfigured) return null;
  // Upsert so a worker who withdrew can apply to the same job again.
  const { data, error } = await supabase
    .from('applications')
    .upsert([toApplicationRow(applicationData)], { onConflict: 'job_id,worker_id' })
    .select()
    .single();
  if (error) throw error;
  return mapApplication(data);
}

export async function updateApplicationStatus(appId, status) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', appId)
    .select()
    .single();
  if (error) throw error;
  return mapApplication(data);
}

// ==========================================
// SAVED JOBS (BOOKMARKS)
// ==========================================

export async function fetchSavedJobIds(workerId) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('job_id')
    .eq('worker_id', workerId);
  if (error) throw error;
  return (data || []).map((d) => d.job_id);
}

export async function toggleSavedJob(workerId, jobId, isCurrentlySaved) {
  if (!isSupabaseConfigured) return;
  if (isCurrentlySaved) {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('worker_id', workerId)
      .eq('job_id', jobId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('saved_jobs')
      .insert([{ worker_id: workerId, job_id: jobId }]);
    if (error) throw error;
  }
}

// ==========================================
// WORK HISTORY & REVIEWS
// ==========================================

export async function fetchWorkHistory(workerId) {
  if (!isSupabaseConfigured) return [];
  let query = supabase
    .from('work_history')
    .select('*')
    .order('created_at', { ascending: false });

  if (workerId) query = query.eq('worker_id', workerId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapWorkHistory);
}

export async function fetchReviews(workerId) {
  if (!isSupabaseConfigured) return [];
  let query = supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (workerId) query = query.eq('worker_id', workerId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapReview);
}

export async function createReview(reviewData) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('reviews')
    .insert([toReviewRow(reviewData)])
    .select()
    .single();
  if (error) throw error;
  return mapReview(data);
}

// ==========================================
// CONVERSATIONS & MESSAGES
// ==========================================

export async function fetchConversations(userId) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapConversation);
}

export async function createConversation(conversation) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      {
        participant1_id: conversation.participant1Id,
        participant2_id: conversation.participant2Id,
        participant1_name: conversation.participant1Name,
        participant2_name: conversation.participant2Name,
        job_id: conversation.jobId || null,
        job_title: conversation.jobTitle || 'General Discussion',
        last_message: conversation.lastMessage || '',
        last_message_time: conversation.lastMessageTime || '',
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return mapConversation(data);
}

export async function sendChatMessage(messageData) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Realtime subscription for conversation messages
export function subscribeToMessages(conversationId, onNewMessage) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export async function fetchNotifications(userId) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function createNotification(notification) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        read: false,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return mapNotification(data);
}

export async function markNotificationAsRead(notifId) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notifId);
  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);
  if (error) throw error;
}
