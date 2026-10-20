import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import * as db from '../services/supabaseService.js';
import {
  mergeById,
  formatMonthYear,
  mapApplication,
  mapConversation,
  mapJob,
  mapNotification,
  mapProfile,
  mapReview,
  mapWorkHistory,
} from '../lib/mappers.js';
import {
  INITIAL_USERS,
  INITIAL_JOBS,
  INITIAL_APPLICATIONS,
  INITIAL_WORK_HISTORY,
  INITIAL_REVIEWS,
} from '../data/initialData.js';

const STORAGE_KEY = 'worknest_state_v2';
const LEGACY_STORAGE_KEY = 'worknest_state_v1';
const CREDENTIALS_KEY = 'worknest_credentials_v1';

// Sample accounts are showcase content only. They deliberately have no
// password and can never be signed into.
const SAMPLE_ACCOUNT_EMAILS = new Set(INITIAL_USERS.map((u) => u.email.toLowerCase()));

const AppContext = createContext(null);

const createInitialState = () => ({
  currentUser: null,
  users: INITIAL_USERS,
  jobs: INITIAL_JOBS,
  applications: INITIAL_APPLICATIONS,
  savedJobIds: [],
  workHistory: INITIAL_WORK_HISTORY,
  reviews: INITIAL_REVIEWS,
  // Private content (messages, notifications) belongs to real accounts only.
  conversations: [],
  notifications: [],
});

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

const makeSalt = () =>
  typeof crypto !== 'undefined' && crypto.getRandomValues
    ? Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    : Math.random().toString(36).slice(2);

async function hashPassword(password, salt) {
  const input = `${salt}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const bytes = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      console.warn('Password hashing unavailable, using fallback:', e);
    }
  }
  // Fallback for non-secure contexts. Local-only mode; never sent anywhere.
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `fallback_${hash}_${input.length}`;
}

function readCredentials() {
  try {
    return JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCredentials(credentials) {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (e) {
    console.warn('Failed to save credentials:', e);
  }
}

function buildUserRecord({ id, role, name, email, ...rest }) {
  return {
    id,
    role,
    name: name || '',
    email: email || '',
    phone: '',
    location: 'Austin, TX',
    companyName: '',
    title: '',
    bio: '',
    hourlyRate: '$45/hr',
    availability: 'Available Now',
    rating: 5,
    reviewsCount: 0,
    jobsCompleted: 0,
    jobsPosted: 0,
    workersHired: 0,
    responseTime: '< 1 hr',
    verified: true,
    skills: [],
    badges: [],
    profileCompletion: role === 'worker' ? 75 : 85,
    memberSince: formatMonthYear(new Date()),
    ...rest,
  };
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...createInitialState(), ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Local storage parse error:', e);
    }
    return createInitialState();
  });

  const [isSupabaseMode] = useState(isSupabaseConfigured);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Drop the old demo-mode cache so stale auto-login sessions don't survive.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to local storage:', e);
    }
  }, [state]);

  const refreshPublicContent = async () => {
    const [liveJobs, liveProfiles, liveApps, liveHistory, liveReviews] =
      await Promise.allSettled([
        db.fetchJobs(),
        db.fetchAllProfiles(),
        db.fetchApplications(),
        db.fetchWorkHistory(),
        db.fetchReviews(),
      ]);

    setState((prev) => ({
      ...prev,
      jobs:
        liveJobs.status === 'fulfilled' ? mergeById(liveJobs.value, prev.jobs) : prev.jobs,
      users:
        liveProfiles.status === 'fulfilled'
          ? mergeById(liveProfiles.value, prev.users)
          : prev.users,
      applications:
        liveApps.status === 'fulfilled' ? mergeById(liveApps.value, prev.applications) : prev.applications,
      workHistory:
        liveHistory.status === 'fulfilled'
          ? mergeById(liveHistory.value, prev.workHistory)
          : prev.workHistory,
      reviews:
        liveReviews.status === 'fulfilled'
          ? mergeById(liveReviews.value, prev.reviews)
          : prev.reviews,
    }));
  };

  const refreshUserContent = async (userId) => {
    if (!userId) return;
    const [liveApps, liveSaved, liveConvs, liveNotifs] = await Promise.allSettled([
      db.fetchApplications(),
      db.fetchSavedJobIds(userId),
      db.fetchConversations(userId),
      db.fetchNotifications(userId),
    ]);

    setState((prev) => ({
      ...prev,
      applications:
        liveApps.status === 'fulfilled' ? mergeById(liveApps.value, prev.applications) : prev.applications,
      savedJobIds: liveSaved.status === 'fulfilled' ? liveSaved.value : prev.savedJobIds,
      conversations: liveConvs.status === 'fulfilled' ? liveConvs.value : prev.conversations,
      notifications: liveNotifs.status === 'fulfilled' ? liveNotifs.value : prev.notifications,
    }));
  };

  // Supabase Auth and data sync
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let authSubscription;

    async function initSupabaseData() {
      try {
        setLoading(true);

        // 1. Restore the existing auth session (if any)
        const session = await db.getSession();
        if (session?.user) {
          let profile = null;
          try {
            profile = await db.fetchProfile(session.user.id);
          } catch (e) {
            console.warn('Profile fetch failed, using auth metadata:', e);
          }
          if (profile) {
            setState((prev) => ({ ...prev, currentUser: profile }));
          }
          await refreshUserContent(session.user.id);
        }

        // 2. Fetch public marketplace content
        await refreshPublicContent();
      } catch (err) {
        console.warn('Supabase fetch error, keeping local sample data:', err);
      } finally {
        setLoading(false);
      }
    }

    initSupabaseData();

    // Listen to Auth State Changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (event === 'SIGNED_OUT') {
          setState((prev) => ({ ...prev, currentUser: null }));
        }
        return;
      }

      try {
        const profile = await db.fetchProfile(session.user.id);
        if (profile) {
          setState((prev) => ({ ...prev, currentUser: profile }));
          await refreshUserContent(session.user.id);
        }
      } catch (e) {
        console.warn('Failed to fetch profile on auth state change:', e);
      }
    });

    authSubscription = listener.subscription;

    return () => {
      authSubscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    currentUser,
    users,
    jobs,
    applications,
    savedJobIds,
    workHistory,
    reviews,
    conversations,
    notifications,
  } = state;

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        const { user } = await db.signIn({ email: normalizedEmail, password });
        if (!user) return { success: false, error: 'Unable to sign in with those credentials.' };

        let profile = null;
        try {
          profile = await db.fetchProfile(user.id);
        } catch {
          profile = null;
        }

        if (!profile) {
          profile = buildUserRecord({
            id: user.id,
            role: user.user_metadata?.role || 'worker',
            name: user.user_metadata?.name || normalizedEmail.split('@')[0],
            email: user.email || normalizedEmail,
            location: user.user_metadata?.location || 'Austin, TX',
            companyName: user.user_metadata?.companyName || '',
            title: user.user_metadata?.title || '',
            verified: Boolean(user.email_confirmed_at),
          });
        }

        setState((prev) => ({
          ...prev,
          currentUser: profile,
          users: mergeById([profile], prev.users),
        }));
        await refreshUserContent(profile.id);
        return { success: true, user: profile };
      } catch (err) {
        return { success: false, error: err.message || 'Unable to sign in.' };
      }
    }

    // ---- Local account mode ----
    if (SAMPLE_ACCOUNT_EMAILS.has(normalizedEmail)) {
      return {
        success: false,
        error:
          'That is a sample profile, not a real account. Create your own account to sign in.',
      };
    }

    const credentials = readCredentials();
    const credential = credentials[normalizedEmail];

    if (!credential) {
      return {
        success: false,
        error: 'No account found with this email. Please create an account first.',
      };
    }

    const passwordHash = await hashPassword(password, credential.salt);
    if (passwordHash !== credential.hash) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const user = users.find((u) => u.id === credential.userId);
    if (!user) {
      return {
        success: false,
        error: 'This account could not be found on this device. Please register again.',
      };
    }

    setState((prev) => ({ ...prev, currentUser: user }));
    return { success: true, user };
  };

  const register = async (userData) => {
    const normalizedEmail = userData.email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      try {
        let res = null;
        try {
          res = await db.signUp({ ...userData, email: normalizedEmail });
        } catch (signUpErr) {
          const msg = (signUpErr?.message || '').toLowerCase();
          // The address already has an (unverified) account — resend the code
          // instead of failing, so an abandoned OTP step can be resumed.
          if (msg.includes('already registered') || msg.includes('already been registered')) {
            await db.sendSignupOtp(normalizedEmail);
            return {
              success: true,
              requiresOtp: true,
              email: normalizedEmail,
              user: null,
              resent: true,
            };
          }
          throw signUpErr;
        }

        if (!res?.user) {
          // Supabase answers `user: null` when the address is already taken.
          // One more OTP lets a previously abandoned verification step resume;
          // otherwise tell the user plainly.
          try {
            await db.sendSignupOtp(normalizedEmail);
            return {
              success: true,
              requiresOtp: true,
              email: normalizedEmail,
              user: null,
              resent: true,
            };
          } catch (otpErr) {
            return {
              success: false,
              error: 'An account with this email already exists. Sign in instead.',
            };
          }
        }

        // First-time account creation: send a 6-digit OTP to the address so
        // the email is proven before the account can be used.
        try {
          await db.sendSignupOtp(normalizedEmail);
          return {
            success: true,
            requiresOtp: true,
            email: normalizedEmail,
            user: null,
          };
        } catch (otpErr) {
          // OTP delivery failed — fall back to the confirmation-link flow so
          // the user still has a way to verify.
          console.warn('OTP send failed, falling back to email link:', otpErr);
          if (!res.session) {
            return {
              success: true,
              requiresConfirmation: true,
              user: null,
            };
          }
          // Email confirmation is disabled on this project, so signUp already
          // returned a usable session — finish signing in.
        }

        let profile = null;
        try {
          profile = await db.fetchProfile(res.user.id);
        } catch {
          profile = null;
        }

        if (!profile) {
          profile = buildUserRecord({
            id: res.user.id,
            role: userData.role,
            name: userData.name,
            email: normalizedEmail,
            location: userData.location || 'Austin, TX',
            companyName: userData.role === 'employer' ? userData.companyName || '' : '',
            title: userData.role === 'worker' ? userData.title || '' : '',
            skills: userData.role === 'worker' && userData.title ? [userData.title] : [],
            verified: true,
          });
        }

        setState((prev) => ({
          ...prev,
          users: mergeById([profile], prev.users),
          currentUser: profile,
        }));
        return { success: true, user: profile };
      } catch (err) {
        return { success: false, error: err.message || 'Registration failed.' };
      }
    }

    // ---- Local account mode ----
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing || SAMPLE_ACCOUNT_EMAILS.has(normalizedEmail)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser = buildUserRecord({
      id: makeId(),
      role: userData.role,
      name: userData.name,
      email: normalizedEmail,
      location: userData.location || 'Austin, TX',
      phone: userData.phone || '',
      companyName: userData.role === 'employer' ? userData.companyName || '' : '',
      title: userData.role === 'worker' ? userData.title || '' : '',
      skills: userData.role === 'worker' && userData.title ? [userData.title] : [],
    });

    const salt = makeSalt();
    const credentials = readCredentials();
    credentials[normalizedEmail] = {
      userId: newUser.id,
      salt,
      hash: await hashPassword(userData.password, salt),
    };
    writeCredentials(credentials);

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: newUser,
    }));
    return { success: true, user: newUser };
  };

  // Verify the 6-digit code sent on first-time account creation. On success
  // the user is fully signed in and lands on their dashboard.
  const verifyOtp = async (email, code) => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return { success: false, error: 'Enter your email address first.' };
    }
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Email verification is only available when Supabase is configured.',
      };
    }
    if (!code || String(code).replace(/\D/g, '').length !== 6) {
      return { success: false, error: 'Enter the 6-digit code from your email.' };
    }

    try {
      const session = await db.verifySignupOtp({ email: normalizedEmail, token: code });
      const user = session?.user;
      if (!user) {
        return { success: false, error: 'Verification failed. Please try again.' };
      }

      let profile = null;
      try {
        profile = await db.fetchProfile(user.id);
      } catch {
        profile = null;
      }

      if (!profile) {
        profile = buildUserRecord({
          id: user.id,
          role: user.user_metadata?.role || 'worker',
          name: user.user_metadata?.name || normalizedEmail.split('@')[0],
          email: user.email || normalizedEmail,
          location: user.user_metadata?.location || 'Austin, TX',
          companyName: user.user_metadata?.companyName || '',
          title: user.user_metadata?.title || '',
          skills: Array.isArray(user.user_metadata?.skills) ? user.user_metadata.skills : [],
          verified: true,
        });
      } else {
        // The signup-time profile upsert runs before there is a session, so it
        // can be blocked by RLS. Now that the account is authenticated, carry
        // over anything the form submitted that the profile row is missing.
        const meta = user.user_metadata || {};
        const metaSkills = Array.isArray(meta.skills) ? meta.skills.filter(Boolean) : [];
        const patch = {};
        if ((!profile.skills || !profile.skills.length) && metaSkills.length) {
          patch.skills = metaSkills;
        }
        if (!profile.title && meta.title) patch.title = meta.title;
        if (!profile.companyName && meta.companyName) patch.companyName = meta.companyName;
        if (profile.verified !== true) patch.verified = true;

        if (Object.keys(patch).length) {
          try {
            const updated = await db.updateProfile(user.id, patch);
            if (updated) profile = { ...profile, ...updated };
          } catch (e) {
            console.warn('Profile enrichment after OTP failed:', e);
          }
        }
      }

      setState((prev) => ({
        ...prev,
        currentUser: profile,
        users: mergeById([profile], prev.users),
      }));
      await refreshUserContent(profile.id);
      return { success: true, user: profile };
    } catch (err) {
      return { success: false, error: err.message || 'Verification failed. Please try again.' };
    }
  };

  // Send another signup OTP (rate-limited by Supabase to roughly one per minute).
  const resendOtp = async (email) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'Enter your email address first.' };
    }
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Email verification is only available when Supabase is configured.',
      };
    }

    try {
      await db.sendSignupOtp(normalizedEmail);
      return {
        success: true,
        message: `A new 6-digit code was sent to ${normalizedEmail}.`,
      };
    } catch (err) {
      return {
        success: false,
        error:
          err.message ||
          'Could not send a new code right now. Please wait a minute and try again.',
      };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await db.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    setState((prev) => ({ ...prev, currentUser: null }));
  };

  const requestPasswordReset = async (email) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'Please enter your email address first.' };
    }

    if (isSupabaseConfigured) {
      try {
        await db.resetPassword(normalizedEmail);
        return {
          success: true,
          message: 'Password reset link sent. Check your inbox to finish resetting your password.',
        };
      } catch (err) {
        return { success: false, error: err.message || 'Could not send reset email.' };
      }
    }

    if (SAMPLE_ACCOUNT_EMAILS.has(normalizedEmail)) {
      return {
        success: false,
        error: 'That is a sample profile. Create your own account to manage a password.',
      };
    }

    const credentials = readCredentials();
    if (!credentials[normalizedEmail]) {
      return { success: false, error: 'No account found with this email.' };
    }
    return {
      success: false,
      error:
        'Accounts on this device cannot receive email. Sign in with your password, or register a new account if you have forgotten it.',
    };
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, error: 'You must be signed in.' };

    if (isSupabaseConfigured) {
      try {
        await db.changePassword(currentPassword, newPassword);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message || 'Could not update password.' };
      }
    }

    const email = currentUser.email.toLowerCase();
    const credentials = readCredentials();
    const credential = credentials[email];
    if (!credential) {
      return {
        success: false,
        error: 'Password management is unavailable for sample profiles.',
      };
    }

    const currentHash = await hashPassword(currentPassword, credential.salt);
    if (currentHash !== credential.hash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const salt = makeSalt();
    credentials[email] = {
      userId: currentUser.id,
      salt,
      hash: await hashPassword(newPassword, salt),
    };
    writeCredentials(credentials);
    return { success: true };
  };

  // ==========================================
  // JOBS
  // ==========================================
  const toggleSaveJob = async (jobId) => {
    const isSaved = savedJobIds.includes(jobId);
    if (isSupabaseConfigured && isUuid(currentUser?.id) && isUuid(jobId)) {
      try {
        await db.toggleSavedJob(currentUser.id, jobId, isSaved);
      } catch (e) {
        console.warn('Failed to toggle save on Supabase:', e);
      }
    }

    setState((prev) => ({
      ...prev,
      savedJobIds: isSaved
        ? prev.savedJobIds.filter((id) => id !== jobId)
        : [...prev.savedJobIds, jobId],
    }));
  };

  const applyToJob = async ({ jobId, coverNote, expectedRate, phone }) => {
    if (!currentUser || currentUser.role !== 'worker') {
      return { success: false, error: 'Only registered workers can submit job applications.' };
    }

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found.' };
    if (job.status === 'closed') {
      return { success: false, error: 'This job posting has been filled or closed.' };
    }

    const alreadyApplied = applications.some(
      (a) => a.jobId === jobId && a.workerId === currentUser.id && a.status !== 'withdrawn'
    );
    if (alreadyApplied) {
      return {
        success: false,
        error: 'You have already submitted an active application for this job.',
      };
    }

    let newApp = {
      id: `app_${Date.now()}`,
      jobId,
      workerId: currentUser.id,
      workerName: currentUser.name,
      workerRole: currentUser.title,
      workerRating: currentUser.rating,
      workerReviews: currentUser.reviewsCount,
      companyName: job.companyName,
      jobTitle: job.title,
      payRate: job.payRate,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      appliedDateText: 'Just now',
      coverNote,
      expectedRate: expectedRate || job.payRate,
      phone: phone || currentUser.phone,
    };

    if (isSupabaseConfigured && isUuid(currentUser.id) && isUuid(jobId)) {
      try {
        const created = await db.createApplication(newApp);
        if (created) newApp = created;
        if (isUuid(job.employerId)) {
          await db.updateJob(jobId, { applicantsCount: (job.applicantsCount || 0) + 1 });
        }
      } catch (err) {
        console.warn('Supabase apply error, saving locally:', err);
      }
    }

    let employerNotif = {
      id: `notif_${Date.now()}`,
      userId: job.employerId,
      type: 'application',
      title: 'New Applicant Received',
      message: `${currentUser.name} applied for "${job.title}".`,
      date: 'Just now',
      read: false,
      link: '/employer/applications',
    };

    if (isSupabaseConfigured && isUuid(job.employerId)) {
      try {
        const saved = await db.createNotification(employerNotif);
        if (saved) employerNotif = saved;
      } catch (e) {
        console.warn('Could not persist notification:', e);
      }
    }

    setState((prev) => ({
      ...prev,
      applications: [newApp, ...prev.applications.filter((a) => a.id !== newApp.id)],
      jobs: prev.jobs.map((j) =>
        j.id === jobId ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 } : j
      ),
      notifications: [employerNotif, ...prev.notifications],
    }));

    return { success: true, application: newApp };
  };

  const withdrawApplication = async (appId) => {
    if (isSupabaseConfigured && isUuid(appId)) {
      try {
        await db.updateApplicationStatus(appId, 'withdrawn');
      } catch (e) {
        console.warn(e);
      }
    }

    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === appId ? { ...a, status: 'withdrawn' } : a
      ),
    }));
  };

  const updateApplicationStatus = async (appId, newStatus) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    if (isSupabaseConfigured && isUuid(appId)) {
      try {
        await db.updateApplicationStatus(appId, newStatus);
      } catch (e) {
        console.warn(e);
      }
    }

    let workerNotif = {
      id: `notif_${Date.now()}`,
      userId: app.workerId,
      type: 'application',
      title: `Application ${newStatus.replace('-', ' ').toUpperCase()}`,
      message: `${app.companyName} updated your application status for "${app.jobTitle}" to ${newStatus}.`,
      date: 'Just now',
      read: false,
      link: '/applications',
    };

    if (isSupabaseConfigured && isUuid(app.workerId)) {
      try {
        const saved = await db.createNotification(workerNotif);
        if (saved) workerNotif = saved;
      } catch (e) {
        console.warn('Could not persist notification:', e);
      }
    }

    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === appId ? { ...a, status: newStatus } : a
      ),
      notifications: [workerNotif, ...prev.notifications],
    }));
  };

  const postJob = async (jobData) => {
    if (jobData.id) {
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => (j.id === jobData.id ? { ...j, ...jobData } : j)),
      }));

      if (isSupabaseConfigured && isUuid(jobData.id)) {
        try {
          const updated = await db.updateJob(jobData.id, jobData);
          if (updated) {
            setState((prev) => ({
              ...prev,
              jobs: prev.jobs.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)),
            }));
          }
        } catch (e) {
          console.warn('Supabase job update error, kept locally:', e);
        }
      }
      return jobData.id;
    }

    const newJob = {
      id: `j_${Date.now()}`,
      employerId: currentUser?.id || '',
      companyName: currentUser?.companyName || 'Independent Employer',
      postedDate: 'Just now',
      status: 'active',
      applicantsCount: 0,
      ...jobData,
    };

    if (isSupabaseConfigured && isUuid(currentUser?.id)) {
      try {
        const created = await db.createJob({
          ...newJob,
          employerId: currentUser.id,
          companyName: currentUser.companyName || 'Independent Employer',
        });
        if (created) Object.assign(newJob, created);
      } catch (e) {
        console.warn('Supabase post job error, saved locally:', e);
      }
    }

    setState((prev) => ({
      ...prev,
      jobs: [newJob, ...prev.jobs.filter((j) => j.id !== newJob.id)],
    }));
    return newJob.id;
  };

  const setJobStatus = async (jobId, status) => {
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((j) => (j.id === jobId ? { ...j, status } : j)),
    }));

    if (isSupabaseConfigured && isUuid(jobId)) {
      try {
        await db.updateJob(jobId, { status });
      } catch (e) {
        console.warn('Supabase job status update error:', e);
      }
    }
  };

  const closeJob = (jobId) => setJobStatus(jobId, 'closed');

  // ==========================================
  // MESSAGES
  // ==========================================
  const sendMessage = async ({ conversationId, recipientId, jobId, jobTitle, text }) => {
    if (!currentUser || !text.trim()) return null;

    const senderId = currentUser.id;
    const senderName = currentUser.name;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessage = {
      id: `msg_${Date.now()}`,
      senderId,
      senderName,
      text,
      time: timeNow,
    };

    let targetConv = conversations.find((c) => c.id === conversationId);

    if (!targetConv && recipientId) {
      targetConv = conversations.find(
        (c) =>
          (c.participant1Id === senderId && c.participant2Id === recipientId) ||
          (c.participant1Id === recipientId && c.participant2Id === senderId)
      );
    }

    const recipient = users.find((u) => u.id === recipientId);
    const recipientName = recipient?.name || 'User';

    let resolvedConv = targetConv;

    // Persist the conversation + message when both parties are real
    // Supabase accounts. Sample profiles stay local by design.
    if (isSupabaseConfigured && isUuid(senderId) && isUuid(recipientId)) {
      try {
        if (!resolvedConv) {
          const createdConv = await db.createConversation({
            participant1Id: senderId,
            participant2Id: recipientId,
            participant1Name: senderName,
            participant2Name: recipientName,
            jobId: isUuid(jobId) ? jobId : null,
            jobTitle: jobTitle || 'General Discussion',
            lastMessage: text,
            lastMessageTime: timeNow,
          });
          if (createdConv) {
            resolvedConv = createdConv;
          }
        }

        if (resolvedConv && isUuid(resolvedConv.id)) {
          await db.sendChatMessage({
            conversation_id: resolvedConv.id,
            sender_id: senderId,
            sender_name: senderName,
            text,
          });
        }
      } catch (e) {
        console.warn('Supabase message error, kept locally:', e);
      }
    }

    let msgNotif = {
      id: `notif_${Date.now()}`,
      userId: recipientId,
      type: 'message',
      title: `Message from ${senderName}`,
      message: text.length > 50 ? `${text.substring(0, 50)}...` : text,
      date: 'Just now',
      read: false,
      link: '/messages',
    };

    if (isSupabaseConfigured && isUuid(recipientId)) {
      try {
        const saved = await db.createNotification(msgNotif);
        if (saved) msgNotif = saved;
      } catch (e) {
        console.warn('Could not persist notification:', e);
      }
    }

    setState((prev) => {
      let updatedConversations;

      if (resolvedConv) {
        const convId = resolvedConv.id;
        const exists = prev.conversations.some((c) => c.id === convId);

        if (exists) {
          updatedConversations = prev.conversations.map((c) => {
            if (c.id !== convId) return c;
            // The message is unread for the recipient until they open the
            // thread. Track it per participant so the sender's own open
            // thread never clears the recipient's badge.
            const unreadBy = {
              ...(c.unreadBy || {}),
              [recipientId]: (c.unreadBy?.[recipientId] || 0) + 1,
            };
            return {
              ...c,
              lastMessage: text,
              lastMessageTime: timeNow,
              unreadBy,
              unreadCount: unreadBy[recipientId],
              messages: [...(c.messages || []), newMessage],
            };
          });
        } else {
          updatedConversations = [
            {
              ...resolvedConv,
              lastMessage: text,
              lastMessageTime: timeNow,
              unreadCount: 0,
              messages: [...(resolvedConv.messages || []), newMessage],
            },
            ...prev.conversations,
          ];
        }
      } else {
        const newConv = {
          id: `conv_${Date.now()}`,
          participant1Id: senderId,
          participant2Id: recipientId,
          participant1Name: senderName,
          participant2Name: recipientName,
          jobId: jobId || '',
          jobTitle: jobTitle || 'General Discussion',
          lastMessage: text,
          lastMessageTime: timeNow,
          unreadBy: { [recipientId]: 1 },
          unreadCount: 1,
          messages: [newMessage],
        };
        updatedConversations = [newConv, ...prev.conversations];
      }

      return {
        ...prev,
        conversations: updatedConversations,
        notifications: [msgNotif, ...prev.notifications],
      };
    });

    return newMessage;
  };

  // ==========================================
  // REVIEWS
  // ==========================================
  const submitReview = async ({ historyId, workerId, rating, comment }) => {
    const reviewerName = currentUser?.name || 'Client';
    let newRev = {
      id: `rev_${Date.now()}`,
      workerId,
      employerId: currentUser?.id || '',
      employerName: currentUser?.companyName
        ? `${reviewerName} (${currentUser.companyName})`
        : reviewerName,
      title: 'Completed Project',
      rating: parseFloat(rating),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      comment,
      verified: true,
    };

    if (isSupabaseConfigured && isUuid(workerId)) {
      try {
        const created = await db.createReview(newRev);
        if (created) newRev = created;
      } catch (e) {
        console.warn('Supabase review insert error, kept locally:', e);
      }
    }

    let reviewNotif = {
      id: `notif_${Date.now()}`,
      userId: workerId,
      type: 'review',
      title: 'New Review Received',
      message: `${reviewerName} gave you a ${rating}-star review on your completed job.`,
      date: 'Just now',
      read: false,
      link: '/identity',
    };

    if (isSupabaseConfigured && isUuid(workerId)) {
      try {
        const saved = await db.createNotification(reviewNotif);
        if (saved) reviewNotif = saved;
      } catch (e) {
        console.warn('Could not persist notification:', e);
      }
    }

    setState((prev) => {
      const workerReviews = [...prev.reviews.filter((r) => r.workerId === workerId), newRev];
      const avg = workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;

      const updatedUsers = prev.users.map((u) =>
        u.id === workerId
          ? {
              ...u,
              rating: parseFloat(avg.toFixed(1)),
              reviewsCount: workerReviews.length,
            }
          : u
      );

      const updatedHistory = prev.workHistory.map((h) =>
        h.id === historyId
          ? {
              ...h,
              status: 'completed',
              rating: parseFloat(rating),
              reviewText: comment,
              canReview: false,
            }
          : h
      );

      return {
        ...prev,
        reviews: [newRev, ...prev.reviews],
        users: updatedUsers,
        workHistory: updatedHistory,
        notifications: [reviewNotif, ...prev.notifications],
        currentUser:
          prev.currentUser?.id === workerId
            ? {
                ...prev.currentUser,
                rating: parseFloat(avg.toFixed(1)),
                reviewsCount: workerReviews.length,
              }
            : prev.currentUser,
      };
    });

    return { success: true, review: newRev };
  };

  const markNotificationAsRead = async (id) => {
    if (isSupabaseConfigured && isUuid(id)) {
      try {
        await db.markNotificationAsRead(id);
      } catch (e) {
        console.warn(e);
      }
    }
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    if (isSupabaseConfigured && isUuid(currentUser.id)) {
      try {
        await db.markAllNotificationsAsRead(currentUser.id);
      } catch (e) {
        console.warn(e);
      }
    }
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.userId === currentUser.id ? { ...n, read: true } : n
      ),
    }));
  };

  const markConversationRead = (conversationId, userId = currentUser?.id) => {
    if (!userId) return;
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const unreadBy = { ...(c.unreadBy || {}), [userId]: 0 };
        return { ...c, unreadBy, unreadCount: unreadBy[userId] };
      }),
    }));
  };

  const updateProfile = async (data) => {
    if (!currentUser) return;

    let persisted = null;
    if (isSupabaseConfigured && isUuid(currentUser.id)) {
      try {
        persisted = await db.updateProfile(currentUser.id, data);
      } catch (e) {
        console.warn('Supabase update profile error:', e);
      }
    }

    if (!isSupabaseConfigured && data.email && data.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      // Keep the local credential keyed by the new email so sign-in still works.
      const credentials = readCredentials();
      const oldEmail = currentUser.email.toLowerCase();
      if (credentials[oldEmail]) {
        credentials[data.email.toLowerCase()] = credentials[oldEmail];
        delete credentials[oldEmail];
        writeCredentials(credentials);
      }
    }

    setState((prev) => {
      const updatedUser = { ...prev.currentUser, ...data, ...(persisted || {}) };
      return {
        ...prev,
        currentUser: updatedUser,
        users: prev.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      };
    });
  };

  const unreadNotifsCount = notifications.filter(
    (n) => currentUser && n.userId === currentUser.id && !n.read
  ).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        jobs,
        applications,
        savedJobIds,
        workHistory,
        reviews,
        conversations,
        notifications,
        unreadNotifsCount,
        isSupabaseConfigured,
        isSupabaseMode,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        requestPasswordReset,
        changePassword,
        toggleSaveJob,
        applyToJob,
        withdrawApplication,
        updateApplicationStatus,
        postJob,
        setJobStatus,
        closeJob,
        sendMessage,
        submitReview,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        markConversationRead,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
